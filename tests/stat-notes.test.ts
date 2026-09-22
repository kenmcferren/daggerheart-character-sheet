import { describe, it, expect } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { deriveStats } from '../src/engine/rules'
import { sheetView } from '../src/engine/sheetView'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { adv, equipped, hp, stress, up } from './lib/levelup-paths'

const setup = buildCreation([JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))])
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}

/** Guardian / Stalwart to level 8: subclass-upgrade at 5 (Unrelenting) and 8 (Undaunted), foundation's
 * Unwavering held from level 1. All three should be baked into the printed thresholds, stacked. */
function stalwartToMastery() {
  let ch = equipped('guardian')
  ch = up(ch, [hp(2), hp(2)])
  ch = up(ch, [stress(2), stress(2)])
  ch = up(ch, [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })])
  ch = up(ch, [adv('subclass-upgrade', 3), hp(3)])
  ch = up(ch, [stress(3), stress(3)])
  ch = up(ch, [adv('evasion', 3), adv('experience', 3, { experienceIndexes: [0, 1] })])
  ch = up(ch, [adv('subclass-upgrade', 4), hp(4)])
  return ch
}

describe('[s7] rules-math step 1: stat bonuses and stat-note footnotes', () => {
  it('a mastery Stalwart carries all three of Unwavering/Unrelenting/Undaunted, stacked (+1+2+3 = +6 to both thresholds)', () => {
    const ch = stalwartToMastery()
    const v = sheetView(ch, setup)
    expect(v.progress.subclassRanks['guardian.stalwart']).toBe(3)
    const base = deriveStats(ch, setup)
    expect(v.stats.majorThreshold).toBe(base.majorThreshold + 6)
    expect(v.stats.severeThreshold).toBe(base.severeThreshold + 6)
  })

  it('Armorer (domain card) carries a build note instead of a baked-in Armor Score bonus', () => {
    const g = equipped('guardian')
    g.choices.domainCardIds = [g.choices.domainCardIds[0], 'armorer']
    const gv = sheetView(g, setup)
    expect(gv.statNotes).toContainEqual(expect.objectContaining({ name: 'Armorer', kind: 'build', stats: ['armorScore'] }))
  })

  it('Scorpion’s Poise (Executioners Guild, specialization) carries a situational Evasion note once held', () => {
    let a = equipped('assassin')
    a.choices.subclassId = 'assassin.executioners-guild'
    a = up(a, [hp(2), hp(2)])
    a = up(a, [stress(2), stress(2)])
    a = up(a, [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })])
    a = up(a, [adv('subclass-upgrade', 3), hp(3)]) // level 5: specialization (Death Strike, Scorpion's Poise)
    const av = sheetView(a, setup)
    expect(av.progress.subclassRanks['assassin.executioners-guild']).toBe(2)
    expect(av.statNotes).toContainEqual(expect.objectContaining({ name: 'Scorpion’s Poise', kind: 'situational', stats: ['evasion'] }))
  })

  it('sample sheets: baked-in Stalwart thresholds, and footnoted Armorer / Scorpion’s Poise', async () => {
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    const g = stalwartToMastery()
    g.choices.domainCardIds = [...g.choices.domainCardIds, 'armorer']
    const gMarks = (await withRecording(async () => renderSheet(g, setup, fonts))).filter(outside)
    expect(gMarks).toHaveLength(0)
    writeFileSync('TestArtifacts/sheet-samples/guardian-stalwart-armorer-statnotes.pdf', await renderSheet(g, setup, fonts))

    let a = equipped('assassin')
    a.choices.subclassId = 'assassin.executioners-guild'
    a = up(a, [hp(2), hp(2)])
    a = up(a, [stress(2), stress(2)])
    a = up(a, [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })])
    a = up(a, [adv('subclass-upgrade', 3), hp(3)])
    const aMarks = (await withRecording(async () => renderSheet(a, setup, fonts))).filter(outside)
    expect(aMarks).toHaveLength(0)
    writeFileSync('TestArtifacts/sheet-samples/assassin-executioners-guild-statnotes.pdf', await renderSheet(a, setup, fonts))
  }, 30_000)
})
