import { describe, it, expect, afterAll } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { buildCreation } from '../src/engine/creation'
import type { Character } from '../src/engine/character'
import { replay } from '../src/engine/levelup'
import { sheetView } from '../src/engine/sheetView'
import { renderSheet, lastLayout, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { equipped, reg } from './lib/levelup-paths'
import { NAMED, build, type Pattern } from './lib/patterns'

const packs = [JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))]
const setup = buildCreation(packs)
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}

/** Seeds for the random legal paths. Logged in run.json so any path can be rebuilt. */
const SEEDS = [1, 2, 3, 4, 5, 6]
/** Most pages a fully leveled sheet may take (first audit: 208 paths, max 6, level 1 sheets are 3). A longer sheet means the overflow policy needs another look. */
const PAGE_BUDGET = 6
/** The Beastforms page (Series 8 step 1) fits Druid back inside the shared budget after condensing to 2 pages; no per-class exception needed. */
const budgetFor = (_classId: string) => PAGE_BUDGET

interface Row { classId: string; pattern: string; seed?: number; level: number; pages: number; front: number; blank: number; cardPages: number; basePages: number; hp: number; stress: number; cards: number; subclassCards: number; multiclass: string; problems: string[]; ms: number }
const rows: Row[] = []

async function measure(ch: Character, pattern: string, seed?: number): Promise<Row> {
  const t0 = Date.now()
  const problems: string[] = []
  const replayed = replay(ch, reg)
  if (replayed.errors.length) problems.push(`replay: ${replayed.errors[0]}`)
  if (JSON.stringify(replay(ch, reg).progress) !== JSON.stringify(replayed.progress)) problems.push('replay is not deterministic')
  let bytes = new Uint8Array()
  const marks = await withRecording(async () => (bytes = await renderSheet(ch, setup, fonts)))
  const out = marks.filter(outside)
  if (out.length) problems.push(`${out.length} marks outside the margins (first: ${out[0].kind} ${out[0].text ?? ''})`)
  const colour = marks.flatMap((m) => m.colors).filter((c) => c && (c.red !== c.green || c.green !== c.blue))
  if (colour.length) problems.push('colour (non-gray) marks')
  const pages = (await PDFDocument.load(bytes)).getPageCount()
  if (pages >= budgetFor(ch.choices.classId!)) { mkdirSync('TestArtifacts/pattern-audit', { recursive: true }); writeFileSync(`TestArtifacts/pattern-audit/${ch.choices.classId}-${pattern}-level-${ch.level}.pdf`, bytes) }
  const v = sheetView(ch, setup)
  return {
    classId: ch.choices.classId!, pattern, seed, level: ch.level,
    pages, front: lastLayout.frontPages, blank: lastLayout.blankPages, cardPages: lastLayout.cardPages, basePages: 0,
    hp: v.stats.hitPoints, stress: v.stats.stress, cards: v.domainCardIds.length,
    subclassCards: v.subclasses.reduce((n, s) => n + s.features.length, 0), multiclass: v.multiclass?.className ?? '-',
    problems, ms: Date.now() - t0,
  }
}

const classIds = [...reg.classes.keys()] as string[]
const randoms: Pattern[] = SEEDS.map((seed) => ({ name: `random-${seed}`, prefer: [], seed }))

describe('[s5] leveling-pattern matrix', () => {
  for (const classId of classIds) {
    it(`${classId}: named and random legal paths to level 10 replay, print inside the margins in grayscale, and stay within the page budget`, { timeout: 900_000 }, async () => {
      const base = await measure(equipped(classId), 'level-1')
      for (const p of [...NAMED, ...randoms]) {
        const random = p.name.startsWith('random')
        const row = await measure(build(classId, p, 10, random), p.name, p.seed)
        row.basePages = base.pages
        rows.push(row)
        if (p.name === 'multiclass-at-5') {
          for (const lvl of [5, 8]) rows.push({ ...(await measure(build(classId, p, lvl), `${p.name}@${lvl}`)), basePages: base.pages })
        }
      }
      const bad = rows.filter((r) => r.classId === classId && r.problems.length)
      expect(bad.map((r) => `${r.pattern}: ${r.problems.join('; ')}`)).toEqual([])
      const over = rows.filter((r) => r.classId === classId && r.pages > budgetFor(classId))
      expect(over.map((r) => `${r.pattern}: ${r.pages} pages`)).toEqual([])
    })
  }

  afterAll(() => {
    if (!rows.length) return
    const dir = 'TestArtifacts/pattern-audit'
    mkdirSync(dir, { recursive: true })
    const maxPages = Math.max(...rows.map((r) => r.pages))
    const worst = [...rows].sort((a, b) => b.pages - a.pages || b.subclassCards - a.subclassCards).slice(0, 12)
    const table = (rs: Row[]) => ['| class | pattern | lvl | pages (front+blank+cards; lvl 1: n) | HP | Stress | cards | subclass cards | multiclass | problems |', '|---|---|---|---|---|---|---|---|---|---|',
      ...rs.map((r) => `| ${r.classId} | ${r.pattern} | ${r.level} | ${r.pages} (${r.front}+${r.blank}+${r.cardPages}; ${r.basePages}) | ${r.hp} | ${r.stress} | ${r.cards} | ${r.subclassCards} | ${r.multiclass} | ${r.problems.join('; ') || '-'} |`)].join('\n')
    const byPages = new Map<number, number>()
    for (const r of rows) byPages.set(r.pages, (byPages.get(r.pages) ?? 0) + 1)
    writeFileSync(`${dir}/report.md`, [
      '# Leveling-pattern audit', '',
      `Paths: ${rows.length} (13 classes x named + seeded random, level 10; multiclass-at-5 also at levels 5 and 8). Random seeds: ${SEEDS.join(', ')}.`,
      `Max pages: ${maxPages}. Page budget: ${PAGE_BUDGET}. Paths with problems: ${rows.filter((r) => r.problems.length).length}.`, '',
      '## Page-count distribution', ...[...byPages].sort((a, b) => a[0] - b[0]).map(([p, n]) => `- ${p} pages: ${n} sheets`), '',
      '## Longest sheets', '', table(worst), '', '## All paths', '', table(rows), '',
    ].join('\n'))
    writeFileSync(`${dir}/run.json`, JSON.stringify({ seeds: SEEDS, pageBudget: PAGE_BUDGET, patterns: [...NAMED.map((p) => p.name), ...randoms.map((p) => p.name)], rows }, null, 2))
  })
})
