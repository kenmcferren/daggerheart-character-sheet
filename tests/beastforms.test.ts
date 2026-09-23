import { describe, it, expect } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { renderSheet, lastLayout, type SheetFonts } from '../src/pdf/sheet'
import { sheetView } from '../src/engine/sheetView'
import { withRecording, outside } from './lib/record'
import { level1, toLevel } from './lib/levelup-paths'

const packs = [JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))]
const setup = buildCreation(packs)
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}

describe('[s8] Druid Beastform page', () => {
  it('non-Druid characters get no beastforms; a level 1 Druid only sees Tier 1 forms (6 of 24)', () => {
    expect(sheetView(level1('wizard'), setup).beastforms).toEqual([])
    const v = sheetView(level1('druid'), setup).beastforms
    expect(v).toHaveLength(6)
    expect(v.every((b) => b.tier === 1)).toBe(true)
  })

  it('a Tier 4 Druid sees all 24 forms, including the two upgrade templates with no stat line', () => {
    const ch = toLevel(8, level1('druid'))
    const v = sheetView(ch, setup).beastforms
    expect(v).toHaveLength(24)
    const templates = v.filter((b) => b.traitTotal === undefined)
    expect(templates.map((b) => b.name)).toEqual(['Legendary Beast', 'Mythic Beast'])
  })

  it('stats are worked out against the sheet: trait total includes the form bonus, Evasion and thresholds add on top', () => {
    const ch = level1('druid')
    const v = sheetView(ch, setup)
    const agile = v.beastforms.find((b) => b.id === 'agile-scout')!
    expect(agile.traitLabel).toBe('agility')
    expect(agile.traitTotal).toBe((ch.traits.agility ?? 0) + 1)
    expect(agile.evasion).toBe(v.stats.evasion + 2)
    // Powerful Beast (Thick Hide, +2 thresholds) only reachable at Tier 2+.
    const powerful = sheetView(toLevel(4, level1('druid')), setup).beastforms.find((b) => b.id === 'powerful-beast')!
    const base = sheetView(toLevel(4, level1('druid')), setup).stats
    expect(powerful.majorThreshold).toBe(base.majorThreshold + 2)
    expect(powerful.severeThreshold).toBe(base.severeThreshold + 2)
  })

  it('prints as its own page after the domain cards, inside the margins, in grayscale', async () => {
    const ch = toLevel(8, level1('druid'))
    let bytes = new Uint8Array()
    const marks = await withRecording(async () => (bytes = await renderSheet(ch, setup, fonts)))
    const texts = marks.filter((m) => m.kind === 'text').map((m) => m.text ?? '')
    expect(texts).toContain('Beastforms')
    expect(texts).toContain('Legendary Beast')
    expect(texts.some((t) => t.startsWith('Ev. '))).toBe(true)
    expect(marks.filter(outside)).toEqual([])
    // Beastforms start on a fresh sheet: every page before them is an even count (double-sided printing).
    const { PDFDocument } = await import('pdf-lib')
    expect(((await PDFDocument.load(bytes)).getPageCount() - lastLayout.beastformPages) % 2).toBe(0)
    // 2-page target not yet reached (owner, 2026-09-23): logged, not asserted, until text/layout condensing lands.
    console.log(`Beastform page(s) at Tier 4 (24 forms): ${lastLayout.beastformPages}`)
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    writeFileSync('TestArtifacts/sheet-samples/druid-level-8-beastforms.pdf', bytes)
  }, 60_000)
})
