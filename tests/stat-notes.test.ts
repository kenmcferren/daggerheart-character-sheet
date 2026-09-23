import { describe, it, expect } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { deriveStats } from '../src/engine/rules'
import { sheetView } from '../src/engine/sheetView'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { progressOf } from '../src/engine/levelup'
import { adv, equipped, hp, level1, problems, reg, stress, toLevel, up } from './lib/levelup-paths'

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
    // The auto-picked level cards happen to include Fortified Armor (Blade lvl 4); it's worn armor, so its
    // own +2 damage thresholds is now computed too (owner, 2026-09-23) — on top of Stalwart's stacked +6.
    expect(v.progress.domainCardIds).toContain('fortified-armor')
    const base = deriveStats(ch, setup)
    expect(v.stats.majorThreshold).toBe(base.majorThreshold + 6 + 2)
    expect(v.stats.severeThreshold).toBe(base.severeThreshold + 6 + 2)
  })

  it('Armorer / Fortified Armor (domain cards): computed while armor is equipped, not a footnote (owner, 2026-09-23)', () => {
    const base = equipped('guardian')
    const g = equipped('guardian')
    g.choices.domainCardIds = [g.choices.domainCardIds[0], 'armorer', 'fortified-armor']
    const bv = sheetView(base, setup), gv = sheetView(g, setup)
    expect(gv.stats.armorScore).toBe(bv.stats.armorScore + 1)
    expect(gv.stats.majorThreshold).toBe(bv.stats.majorThreshold + 2)
    expect(gv.stats.severeThreshold).toBe(bv.stats.severeThreshold + 2)
    expect(gv.statNotes.some((n) => n.name === 'Armorer' || n.name === 'Fortified Armor')).toBe(false)
  })

  it('Armorer / Fortified Armor do nothing without armor equipped', () => {
    const g = equipped('guardian')
    g.choices.equipmentIds = g.choices.equipmentIds.filter((id) => !id.startsWith('armor.'))
    g.choices.domainCardIds = [g.choices.domainCardIds[0], 'armorer', 'fortified-armor']
    const base = { ...g, choices: { ...g.choices, domainCardIds: [g.choices.domainCardIds[0]] } }
    expect(sheetView(g, setup).stats.armorScore).toBe(sheetView(base, setup).stats.armorScore)
  })

  it('Mage Robes / Granminster’s Finery (equipped armor): threshold bonus = Spellcast trait, Armor Score bonus = Presence', () => {
    const w = equipped('wizard')
    w.choices.equipmentIds = [...w.choices.equipmentIds.filter((id) => !id.startsWith('armor.')), 'armor.mage-robes']
    const wv = sheetView(w, setup)
    const spellcastTrait = wv.spellcastTraits[0] as keyof typeof w.traits
    expect(wv.stats.majorThreshold).toBe(deriveStats(w, setup).majorThreshold + (w.traits[spellcastTrait] ?? 0))

    const g = equipped('guardian')
    g.choices.equipmentIds = [...g.choices.equipmentIds.filter((id) => !id.startsWith('armor.')), 'armor.granminsters-finery']
    const gv = sheetView(g, setup)
    expect(gv.stats.armorScore).toBe(deriveStats(g, setup).armorScore + (g.traits.presence ?? 0))
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

  it('Blade-Touched / Splendor-Touched / Valor-Touched carry a build note (loadout composition is never modelled)', () => {
    const g = equipped('guardian')
    g.choices.domainCardIds = [g.choices.domainCardIds[0], 'blade-touched']
    const gv = sheetView(g, setup)
    expect(gv.statNotes).toContainEqual(expect.objectContaining({ name: 'Blade-Touched', kind: 'build', stats: ['severeThreshold'] }))
  })

  it('Vitality: a one-time permanent choice of 2 of 3 benefits, baked in the level it is taken, not a footnote', () => {
    const ch = toLevel(4, level1('warrior'))
    const before = progressOf(ch, reg)
    const leveled = up(ch, [adv('evasion', 3), adv('experience', 3, { experienceIndexes: [0, 1] })], { newCardId: 'vitality', vitalityChoice: ['hitPoint', 'thresholds'] })
    const after = progressOf(leveled, reg)
    expect(after.hitPointSlots).toBe(before.hitPointSlots + 1)
    expect(after.stressSlots).toBe(before.stressSlots)
    expect(after.vitalityThresholds).toBe(true)
    const v = sheetView(leveled, setup)
    const base = deriveStats(leveled, setup)
    expect(v.stats.majorThreshold).toBe(base.majorThreshold + 2)
    expect(v.stats.severeThreshold).toBe(base.severeThreshold + 2)
    expect(v.statNotes.some((n) => n.name === 'Vitality')).toBe(false)
  })

  it('Vitality requires exactly 2 different choices, and rejects a choice on a level that did not take the card', () => {
    const ch = toLevel(4, level1('warrior'))
    const adv5 = [adv('evasion', 3), adv('experience', 3, { experienceIndexes: [0, 1] })]
    expect(problems(ch, adv5, { newCardId: 'vitality', vitalityChoice: ['hitPoint'] }).join()).toMatch(/choose 2 of/)
    expect(problems(ch, adv5, { newCardId: 'vitality' }).join()).toMatch(/choose 2 of/)
    expect(problems(ch, adv5, { vitalityChoice: ['hitPoint', 'stress'] }).join()).toMatch(/not taken this level/)
  })

  it('sample sheets: baked-in Stalwart/Armorer thresholds, and footnoted Scorpion’s Poise', async () => {
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
