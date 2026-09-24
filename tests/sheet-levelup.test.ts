import { describe, it, expect } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { buildCreation } from '../src/engine/creation'
import type { Character } from '../src/engine/character'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { sheetView } from '../src/engine/sheetView'
import { withRecording, outside } from './lib/record'
import { level1, equipped, adv, hp, stress, up, toLevel, reg } from './lib/levelup-paths'

const packs = [JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))]
const setup = buildCreation(packs)
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}

async function draw(ch: Character) {
  let bytes = new Uint8Array()
  const marks = await withRecording(async () => (bytes = await renderSheet(ch, setup, fonts)))
  const pages = (await PDFDocument.load(bytes)).getPageCount()
  return { marks, texts: marks.filter((m) => m.kind === 'text').map((m) => m.text ?? ''), pages }
}
const mc = { classId: 'bard', domainId: 'grace', subclassId: 'bard.troubadour' }

describe('[s5] sheet at level N', () => {
  it('numbers come from the history: level, tier, Proficiency, Evasion, traits, Experience bonuses', async () => {
    let ch = equipped()
    ch = up(ch, [adv('traits', 2, { traits: ['agility', 'strength'] }), adv('evasion', 2)])          // 2
    ch = up(ch, [adv('experience', 2, { experienceIndexes: [0, 2] }), hp(2)])                        // 3
    const v = sheetView(ch, setup)
    expect(v.stats).toMatchObject({ level: 3, tier: 2, proficiency: 2, hitPoints: 5 + 1, stress: 6 })
    expect(v.stats.evasion).toBe(12)
    expect(v.traits).toMatchObject({ agility: 1, strength: 1, finesse: 1, knowledge: 2 })
    expect(v.experiences.map((e) => `${e.text} +${e.bonus}`)).toEqual(['Sailor +3', 'Liar +2', 'Exp 2 +3'])
    const { texts, marks } = await draw(ch)
    expect(texts).toContain('Level 3, Tier 2, Proficiency')
    expect(texts).toContain('12')
    expect(texts.filter((t) => t === '+3')).toHaveLength(2)
    expect(marks.filter(outside)).toEqual([])
  }, 60_000)

  it('damage thresholds rise with level', async () => {
    const l1 = equipped()
    const l4 = toLevel(4, l1)
    const a = sheetView(l1, setup).stats, b = sheetView(l4, setup).stats
    expect(b.majorThreshold - a.majorThreshold).toBe(3)
    expect(b.severeThreshold - a.severeThreshold).toBe(3)
  })

  it('multiclass adds the class features, the subclass foundation and the second domain\'s cards', async () => {
    const ch = up(toLevel(4, equipped()), [adv('multiclass', 3, { multiclass: mc })])   // level 5
    const v = sheetView(ch, setup)
    expect(v.multiclass?.className).toBe('Bard')
    expect(v.subclasses.map((s) => [s.name, s.multiclass])).toEqual([['School of Knowledge', false], ['Troubadour', true]])
    expect(v.subclasses.every((s) => s.features.length > 0)).toBe(true)
    expect(v.spellcastTraits.length).toBeGreaterThan(0)
    const { texts, marks, pages } = await draw(ch)
    expect(pages).toBeGreaterThanOrEqual(2)
    expect(texts.some((t) => t.includes('MC: Bard'))).toBe(true)
    expect(texts.some((t) => t.includes('MC Subclass: Troubadour'))).toBe(true)
    expect(marks.filter(outside)).toEqual([])
  })

  it('subclass specialization and mastery show as they are taken', () => {
    let ch = up(toLevel(4, equipped()), [adv('subclass-upgrade', 3), hp(3)])
    expect(sheetView(ch, setup).subclasses[0].features.map((f) => f.level)).toContain('specialization')
    expect(sheetView(ch, setup).subclasses[0].features.map((f) => f.level)).not.toContain('mastery')
    ch = up(toLevel(7, ch), [adv('subclass-upgrade', 4), stress(4)])
    expect(sheetView(ch, setup).subclasses[0].features.map((f) => f.level)).toContain('mastery')
  })

  it('domain cards printed = every card held after swaps', async () => {
    const l1 = equipped()
    const l2 = up(l1, [hp(2), hp(2)])
    expect(sheetView(l2, setup).domainCardIds).toHaveLength(3)
    const { texts } = await draw(l2)
    for (const id of sheetView(l2, setup).domainCardIds) expect(texts, id).toContain((reg.domainCards.get(id) as any).name)
  })

  it('brawler: Combo Die and stances; ranger: companion options', () => {
    const b = up(equipped('brawler'), [adv('brawler-combo-die', 2), hp(2)], { stanceId: (reg.classes.get('brawler') as any).stances.find((s: any) => s.tier === 1 && !level1('brawler').creation!.stanceIds.includes(s.id)).id })
    const bv = sheetView(b, setup)
    expect(bv.comboDie).toBe('d6')
    expect(bv.stanceIds).toHaveLength(level1('brawler').creation!.stanceIds.length + 1)
    expect(sheetView(level1('wizard'), setup).comboDie).toBeNull()
    const r = up(equipped('ranger'), [hp(2), stress(2)], { companionOptionIds: ['aware'] })
    expect(sheetView(r, setup).companionOptions.map((o) => o.id)).toEqual(['aware'])
  })

  it('beastbound ranger: companion block numbers follow the options taken', async () => {
    const base = equipped('ranger')
    const r0 = { ...base, choices: { ...base.choices, subclassId: 'ranger.beastbound' }, creation: { ...base.creation!, companion: { name: 'Bramble', experiences: ['Scout', 'Fetch'], attack: 'Bite', damageType: 'physical' as const } } } as Character
    expect(sheetView(r0, setup).companion).toMatchObject({ name: 'Bramble', evasion: 10, stress: 3, die: 'd6', range: 'Melee', features: [] })
    const r1 = up(r0, [hp(2), stress(2)], { companionOptionIds: ['aware'] })
    expect(sheetView(r1, setup).companion!.evasion).toBe(12)
    const v = up(r1, [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })], { companionOptionIds: ['vicious'], viciousChoice: 'range' })
    expect(sheetView(v, setup).companion).toMatchObject({ die: 'd6', range: 'Very Close' })
    expect(() => up(r1, [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })], { companionOptionIds: ['vicious'] })).toThrow(/Vicious/)
    const l3 = up(v, [hp(2), stress(2)], { companionOptionIds: ['intelligent'], companionExperience: 1 })
    const l4 = up(l3, [stress(3), hp(3)], { companionOptionIds: ['armored'] })
    const c = sheetView(l4, setup).companion!
    expect(c.experiences.map((e) => e.bonus)).toEqual([2, 3])
    expect(c.features.map((f) => f.name)).toEqual(['Armored'])
    expect(() => up(v, [hp(2), stress(2)], { companionOptionIds: ['intelligent'] })).toThrow(/Intelligent/)
    const l6 = up(l4, [hp(3), stress(3)], { companionOptionIds: ['creature-comfort'] })
    const l7 = up(l6, [adv('evasion', 3), adv('experience', 3, { experienceIndexes: [0, 1] })], { companionOptionIds: ['bonded'] })
    const l8 = up(l7, [hp(4), stress(4)], { companionOptionIds: ['resilient'] })
    expect(sheetView(l8, setup).companion).toMatchObject({ stress: 4, range: 'Very Close' })
    const bytes = await renderSheet(l8, setup, fonts)
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    writeFileSync('TestArtifacts/sheet-samples/ranger-beastbound-level-8-companion.pdf', bytes)
    const { marks } = await draw(l8)
    expect(marks.filter(outside)).toEqual([])
  })

  it('sample sheets at levels 3, 5, 8 and 10 render inside the margins (files in TestArtifacts/sheet-samples)', async () => {
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    const save = async (name: string, ch: Character) => {
      const bytes = await renderSheet(ch, setup, fonts)
      writeFileSync(`TestArtifacts/sheet-samples/${name}.pdf`, bytes)
    }
    const l4 = toLevel(4, equipped())
    await save('wizard-level-3', toLevel(3, equipped()))
    const l5 = up(l4, [adv('multiclass', 3, { multiclass: mc })])
    await save('wizard-level-5-multiclass', l5)
    await save('wizard-level-8-multiclass', toLevel(8, l5))
    // Most slots: the Guardian starts with 7 Hit Points; five Hit Point advancements reach the cap of 12.
    let g = equipped('guardian')
    const plan = [[hp(2), hp(2)], [stress(2), stress(2)], [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })], [hp(3), hp(3)], [stress(3), stress(3)], [adv('evasion', 3), adv('experience', 3, { experienceIndexes: [0, 1] })], [hp(4), adv('traits', 4, { traits: ['agility', 'strength'] })], [stress(4), stress(4)], [adv('evasion', 4), adv('experience', 4, { experienceIndexes: [0, 1] })]]
    while (g.level < 10) g = up(g, plan[g.level - 1])
    expect(sheetView(g, setup).stats.hitPoints).toBe(12)
    await save('guardian-level-10-max-slots', g)
    const { marks } = await draw(g)
    expect(marks.filter(outside)).toEqual([])
  }, 60_000)

  it('brawler stances print on the domain card sheet before any card, only the chosen ones', async () => {
    const b = up(equipped('brawler'), [hp(2), hp(2)], { stanceId: 'reliable' })
    const v = sheetView(b, setup)
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    writeFileSync('TestArtifacts/sheet-samples/brawler-level-2-stances.pdf', await renderSheet(b, setup, fonts))
    const { texts } = await draw(b)
    const first = (name: string) => texts.findIndex((t) => t === name)
    for (const id of v.stanceIds) {
      const name = (reg.classes.get('brawler') as any).stances.find((x: any) => x.id === id).name
      expect(first(name), name).toBeGreaterThan(-1)
      for (const cardId of v.domainCardIds) expect(first(name)).toBeLessThan(first((reg.domainCards.get(cardId) as any).name))
    }
    expect(texts).not.toContain('Aggressive')
    expect(texts.some((t) => t.includes('(Stance)'))).toBe(false)
  })

  it('assassin poisons print on the domain card sheet before any card; only the ones known at the subclass rank', async () => {
    let a = level1('assassin')
    a.choices.subclassId = 'assassin.poisoners-guild'
    a = up(a, [hp(2), hp(2)])
    const names = (c: Character) => sheetView(c, setup).sheetCards.map((x) => x.name)
    expect(names(a)).toEqual(['Ghost Petal', 'Grave Spore', 'Leech Weed'])
    const spec = up(toLevel(4, a), [adv('subclass-upgrade', 3), hp(3)])
    expect(names(spec)).toEqual(['Ghost Petal', 'Grave Spore', 'Leech Weed', 'Midnight Vine', 'Gorgon Root'])
    const { texts } = await draw(a)
    const first = (t: string) => texts.findIndex((x) => x === t)
    for (const n of names(a)) for (const id of sheetView(a, setup).domainCardIds) expect(first(n)).toBeLessThan(first((reg.domainCards.get(id) as any).name))
    expect(texts).not.toContain('Midnight Vine')
  })

  it('druid elements print as a table across the top of the domain card sheet: element rows, one column per held Elemental feature', async () => {
    const l2 = up(level1('druid'), [hp(2), hp(2)])
    expect(sheetView(level1('druid'), setup).sheetTable!.columns).toHaveLength(1)
    expect(sheetView(level1('wizard'), setup).sheetTable).toBeNull()
    const t1 = sheetView(l2, setup).sheetTable!
    expect(t1.rows).toEqual(['Fire', 'Earth', 'Water', 'Air'])
    expect(t1.columns.map((c) => c.title)).toEqual(['Elemental Incarnation'])
    const l5 = up(toLevel(4, l2), [adv('subclass-upgrade', 3), hp(3)])
    const t2 = sheetView(l5, setup).sheetTable!
    expect(t2.columns.map((c) => c.title)).toEqual(['Elemental Incarnation', 'Elemental Aura'])
    expect(t2.columns[1].cells[0]).toContain('mark Hit Points')
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    writeFileSync('TestArtifacts/sheet-samples/druid-level-5-elements.pdf', await renderSheet(l5, setup, fonts))
    const { texts, marks } = await draw(l5)
    expect(texts).toContain('Fire')
    expect(texts).toContain('Aura')
    expect(marks.filter(outside)).toEqual([])
  })

  it('a level 1 character is unchanged: same numbers as deriveStats', () => {
    const ch = equipped()
    const v = sheetView(ch, setup)
    expect(v.stats.evasion).toBe((reg.classes.get('wizard') as any).startingEvasion)
    expect(v.traits).toEqual(ch.traits)
    expect(v.experiences).toEqual([{ text: 'Sailor', bonus: 2 }, { text: 'Liar', bonus: 2 }])
  })
})
