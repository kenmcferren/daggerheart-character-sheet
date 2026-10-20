import { describe, it, expect, afterAll } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { buildCreation } from '../src/engine/creation'
import type { Character } from '../src/engine/character'
import { renderSheet, lastLayout, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { NAMED, build, type Pattern } from './lib/patterns'
import { ARMS, SF_ARMS } from './lib/packs'

// Page-count audit with the Starfinder ancestries option on (Series 9 step 4). Same legal paths as the leveling-pattern
// matrix (tests/level-patterns.test.ts), but the ancestry is swapped after the path is built and the sheet is rendered
// with the Starfinder supplement. Human is rendered the same way as the baseline, so the comparison is like for like.
const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const setup = buildCreation([pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS, SF_ARMS], { supplements: ['starfinder-ancestries'] })
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}
const ANCESTRIES = ['human', 'sf-ysoki', 'sf-skittermander', 'sf-kasatha', 'sf-pahtra', 'sf-lashunta']
const SEEDS = [1, 2]
const randoms: Pattern[] = SEEDS.map((seed) => ({ name: `random-${seed}`, prefer: [], seed }))
const classIds = [...setup.registry.classes.keys()] as string[]
const eq = [...setup.registry.equipment.values()] as any[]

/** Worst-case gear for the ancestry: a Kasatha carries a one-handed primary and two secondaries. */
function dress(ch: Character, ancestry: string): Character {
  const c = structuredClone(ch)
  c.choices.ancestryId = ancestry
  if (ancestry === 'sf-kasatha') {
    const armor = c.choices.equipmentIds.find((id) => eq.find((e) => e.id === id && e.category === 'armor'))
    const prim = eq.find((e) => e.weaponSlot === 'primary' && e.tier === 1 && e.burden === 'one-handed')
    const [s1, s2] = eq.filter((e) => e.weaponSlot === 'secondary' && e.tier === 1 && e.burden === 'one-handed')
    c.choices.equipmentIds = [prim.id, s1.id, s2.id, ...(armor ? [armor] : [])]
  } else if (ancestry !== 'human') {
    // Make sure a secondary weapon is present so the row is as wide as it can get.
    const has = c.choices.equipmentIds.some((id) => eq.find((e) => e.id === id && e.weaponSlot === 'secondary'))
    const prim = c.choices.equipmentIds.some((id) => eq.find((e) => e.id === id && e.weaponSlot === 'primary' && e.burden === 'one-handed'))
    if (!has && prim) c.choices.equipmentIds = [...c.choices.equipmentIds, eq.find((e) => e.weaponSlot === 'secondary' && e.tier === 1 && e.burden === 'one-handed').id]
  }
  return c
}

interface Row { ancestry: string; classId: string; pattern: string; pages: number; front: number; blank: number; cardPages: number; problems: string[] }
const rows: Row[] = []
// Build every path once per class; reuse across ancestries (the build is the slow part).
const paths = new Map<string, Character>()
const pathOf = (classId: string, p: Pattern) => {
  const key = `${classId}/${p.name}`
  if (!paths.has(key)) paths.set(key, build(classId, p, 10, p.name.startsWith('random')))
  return paths.get(key)!
}

describe('[s9] Starfinder page-count audit', () => {
  // One statically named test so the policy file can skip it (the policy matches names as written in the source).
  it('every Starfinder ancestry: all classes and named + seeded paths to level 10 stay inside the margins and within 6 pages', { timeout: 3_600_000 }, async () => {
    for (const ancestry of ANCESTRIES) {
      for (const classId of classIds) {
        for (const p of [...NAMED, ...randoms]) {
          const ch = dress(pathOf(classId, p), ancestry)
          let bytes = new Uint8Array()
          const marks = await withRecording(async () => (bytes = await renderSheet(ch, setup, fonts)))
          const problems: string[] = []
          const out = marks.filter(outside)
          if (out.length) problems.push(`${out.length} marks outside the margins`)
          const pages = (await PDFDocument.load(bytes)).getPageCount()
          if (pages > 6) problems.push(`${pages} pages`)
          rows.push({ ancestry, classId, pattern: p.name, pages, front: lastLayout.frontPages, blank: lastLayout.blankPages, cardPages: lastLayout.cardPages, problems })
        }
      }
    }
    expect(rows.filter((r) => r.problems.length).map((r) => `${r.ancestry} ${r.classId} ${r.pattern}: ${r.problems.join('; ')}`)).toEqual([])
  })

  afterAll(() => {
    if (!rows.length) return
    const dir = 'TestArtifacts/starfinder-audit'
    mkdirSync(dir, { recursive: true })
    const key = (r: Row) => `${r.classId}/${r.pattern}`
    const base = new Map(rows.filter((r) => r.ancestry === 'human').map((r) => [key(r), r]))
    const dist = (a: string) => {
      const m = new Map<number, number>()
      for (const r of rows.filter((x) => x.ancestry === a)) m.set(r.pages, (m.get(r.pages) ?? 0) + 1)
      return [...m].sort((x, y) => x[0] - y[0]).map(([p, n]) => `${p}p: ${n}`).join(', ')
    }
    const grew = rows.filter((r) => r.ancestry !== 'human' && base.has(key(r)) && r.pages > base.get(key(r))!.pages)
    writeFileSync(`${dir}/report.md`, [
      '# Starfinder page-count audit', '',
      `Sheets per ancestry: ${rows.filter((r) => r.ancestry === 'human').length} (13 classes x ${NAMED.length + SEEDS.length} paths, level 10). Human is the baseline.`, '',
      '## Page distribution', ...ANCESTRIES.map((a) => `- ${a}: ${dist(a)}`), '',
      `## Sheets that grew vs. Human (${grew.length})`, ...grew.map((r) => `- ${r.ancestry} ${r.classId} ${r.pattern}: ${base.get(key(r))!.pages} -> ${r.pages} pages (front ${base.get(key(r))!.front}->${r.front}, cards ${base.get(key(r))!.cardPages}->${r.cardPages})`), '',
    ].join('\n'))
    writeFileSync(`${dir}/run.json`, JSON.stringify({ ancestries: ANCESTRIES, seeds: SEEDS, rows }, null, 1))
  })
})
