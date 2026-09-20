import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation, type CreationSetup } from '../src/engine/creation'
import { newCharacter, creationOf, type Character } from '../src/engine/character'
import { validateCreation, deriveStats, weaponPool, downtimeMoves, ancestryFeatures, tierOf } from '../src/engine/rules'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const frames = JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))
const packs = [core, frames]

/** A complete legal character for the given setup (Wizard, School of Knowledge). */
function legal(setup: CreationSetup, tweak: (c: Character) => void = () => {}): Character {
  const ch = newCharacter('t1', '2026-01-01T00:00:00.000Z')
  const eq = [...setup.registry.equipment.values()] as any[]
  const cards = [...setup.registry.domainCards.values()] as any[]
  const cls: any = setup.registry.classes.get('wizard')
  ch.choices.classId = 'wizard'
  ch.choices.subclassId = 'wizard.school-of-knowledge'
  ch.choices.ancestryId = 'human'
  ch.choices.communityId = 'wanderborne'
  ch.traits = { agility: 0, strength: 0, finesse: 1, instinct: -1, presence: 1, knowledge: 2 }
  const prim = eq.find((e) => e.weaponSlot === 'primary' && e.tier === 1 && e.burden === 'one-handed')
  const sec = eq.find((e) => e.weaponSlot === 'secondary' && e.tier === 1)
  const armor = eq.find((e) => e.category === 'armor' && e.tier === 1)
  ch.choices.equipmentIds = [prim.id, sec.id, armor.id]
  ch.choices.domainCardIds = cards.filter((c) => c.level === 1 && cls.domains.includes(c.domain)).slice(0, 2).map((c) => c.id)
  ch.creation = { ...creationOf(ch), potion: 'health', classItem: 'A book', experiences: ['Sailor', 'Liar'] }
  tweak(ch)
  return ch
}
const steps = (issues: { step: string }[]) => [...new Set(issues.map((i) => i.step))]
const baseArmor = (s: CreationSetup) => ([...s.registry.equipment.values()] as any[]).find((e) => e.category === 'armor' && e.tier === 1).id as string

describe('[s3] character rules', () => {
  const setup = buildCreation(packs)
  it('a complete character has no issues', () => {
    expect(validateCreation(legal(setup), setup)).toEqual([])
  })
  it('empty character flags every base step that needs input', () => {
    const issues = validateCreation(newCharacter('x'), setup)
    expect(steps(issues)).toEqual(expect.arrayContaining(['class', 'subclass', 'ancestry', 'community', 'traits', 'equipment', 'experiences', 'domain-cards']))
  })
  it('traits must be exactly +2,+1,+1,+0,+0,-1', () => {
    const c = legal(setup, (x) => { x.traits = { agility: 2, strength: 2, finesse: 1, instinct: 0, presence: 0, knowledge: -1 } })
    expect(steps(validateCreation(c, setup))).toEqual(['traits'])
    const d = legal(setup, (x) => { delete x.traits.knowledge })
    expect(steps(validateCreation(d, setup))).toEqual(['traits'])
  })
  it('subclass must belong to the class', () => {
    const c = legal(setup, (x) => { x.choices.subclassId = 'bard.troubadour' })
    expect(validateCreation(c, setup)[0]).toMatchObject({ step: 'subclass' })
  })
  it('weapon rules: two-handed alone, or one-handed pair; nothing else', () => {
    const eq = [...setup.registry.equipment.values()] as any[]
    const two = eq.find((e) => e.weaponSlot === 'primary' && e.tier === 1 && e.burden === 'two-handed')
    const armor = baseArmor(setup)
    const sec = eq.find((e) => e.weaponSlot === 'secondary' && e.tier === 1)
    expect(validateCreation(legal(setup, (x) => { x.choices.equipmentIds = [two.id, armor] }), setup)).toEqual([])
    expect(steps(validateCreation(legal(setup, (x) => { x.choices.equipmentIds = [two.id, sec.id, armor] }), setup))).toEqual(['equipment'])
    expect(steps(validateCreation(legal(setup, (x) => { x.choices.equipmentIds = [sec.id, armor] }), setup))).toEqual(['equipment'])
    expect(steps(validateCreation(legal(setup, (x) => { x.choices.equipmentIds = [two.id] }), setup))).toEqual(['equipment'])
  })
  it('potion and class item are required', () => {
    expect(steps(validateCreation(legal(setup, (x) => { x.creation!.potion = null }), setup))).toEqual(['equipment'])
    expect(steps(validateCreation(legal(setup, (x) => { x.creation!.classItem = ' ' }), setup))).toEqual(['equipment'])
  })
  it('exactly two Experiences', () => {
    expect(steps(validateCreation(legal(setup, (x) => { x.creation!.experiences = ['One'] }), setup))).toEqual(['experiences'])
    expect(steps(validateCreation(legal(setup, (x) => { x.creation!.experiences = ['A', 'B', 'C'] }), setup))).toEqual(['experiences'])
  })
  it('domain cards: two, level 1, from class domains, distinct', () => {
    const cards = [...setup.registry.domainCards.values()] as any[]
    const wiz: any = setup.registry.classes.get('wizard')
    const off = cards.find((c) => c.level === 1 && !wiz.domains.includes(c.domain))
    const hi = cards.find((c) => c.level === 2 && wiz.domains.includes(c.domain))
    const ok = legal(setup).choices.domainCardIds
    expect(steps(validateCreation(legal(setup, (x) => { x.choices.domainCardIds = [ok[0], off.id] }), setup))).toEqual(['domain-cards'])
    expect(steps(validateCreation(legal(setup, (x) => { x.choices.domainCardIds = [ok[0], hi.id] }), setup))).toEqual(['domain-cards'])
    expect(steps(validateCreation(legal(setup, (x) => { x.choices.domainCardIds = [ok[0], ok[0]] }), setup))).toEqual(['domain-cards'])
  })
  it('Mixed Ancestry: two different ancestries, first feature of one, second of the other', () => {
    const c = legal(setup, (x) => { x.creation!.mixedAncestry = { first: 'goblin', second: 'orc' } })
    expect(validateCreation(c, setup)).toEqual([])
    const f = ancestryFeatures(c, setup)
    const g: any = setup.registry.ancestries.get('goblin')
    const o: any = setup.registry.ancestries.get('orc')
    expect(f.map((x) => x.name)).toEqual([g.features[0].name, o.features[1].name])
    expect(steps(validateCreation(legal(setup, (x) => { x.creation!.mixedAncestry = { first: 'orc', second: 'orc' } }), setup))).toEqual(['ancestry'])
  })
  it('Beastbound needs a full companion; Martial Artist needs two Tier 1 stances', () => {
    const beast = (x: Character) => { x.choices.classId = 'ranger'; x.choices.subclassId = 'ranger.beastbound'; x.choices.domainCardIds = [] }
    const r = validateCreation(legal(setup, beast), setup)
    expect(r.some((i) => i.step === 'subclass' && /companion/.test(i.message))).toBe(true)
    const withC = validateCreation(legal(setup, (x) => { beast(x); x.creation!.companion = { name: 'Fen', experiences: ['Scout', 'Loyal'], attack: 'Bites', damageType: 'physical' } }), setup)
    expect(withC.some((i) => /companion/.test(i.message))).toBe(false)
    const ma = (ids: string[]) => validateCreation(legal(setup, (x) => { x.choices.classId = 'brawler'; x.choices.subclassId = 'brawler.martial-artist'; x.creation!.stanceIds = ids }), setup)
    expect(ma(['favored', 'reliable']).some((i) => /stances/.test(i.message))).toBe(false)
    expect(ma(['favored', 'aggressive']).some((i) => /stances/.test(i.message))).toBe(true)
    expect(ma(['favored']).some((i) => /stances/.test(i.message))).toBe(true)
  })
  it('derived starting numbers', () => {
    const c = legal(setup)
    const s = deriveStats(c, setup)
    const cls: any = setup.registry.classes.get('wizard')
    const armor: any = setup.registry.equipment.get(c.choices.equipmentIds[2])
    expect(s).toMatchObject({
      level: 1, tier: 1, evasion: cls.startingEvasion, hitPoints: cls.startingHitPoints, stress: 6, hope: 2, proficiency: 1,
      majorThreshold: armor.majorThreshold + 1, severeThreshold: armor.severeThreshold + 1, armorScore: armor.armorScore,
    })
    expect(s.kit).toEqual(expect.arrayContaining(['A torch', '50 feet of rope', 'Basic supplies', 'A handful of gold', 'A book']))
    expect(s.kit.some((k) => /Health Potion/.test(k))).toBe(true)
    expect(s.downtimeMoves.map((m) => m.id)).toContain('prepare')
  })
  it('tiers', () => {
    expect([1, 2, 4, 5, 7, 8, 10].map(tierOf)).toEqual([1, 2, 2, 3, 3, 4, 4])
  })
})

describe('[s3] character rules with frames', () => {
  it('Feasts: Tend to Wounds, Clear Stress and Prepare replaced by Make a Feast', () => {
    const ids = downtimeMoves(buildCreation(packs, { supplements: ['feasts'] })).map((m) => m.id)
    expect(ids).toEqual(['repair-armor', 'work-on-project', 'make-a-feast'])
  })
  it('Everyday Hero replaces the weapon and armor pools', () => {
    const s = buildCreation(packs, { supplements: ['everyday-hero'] })
    const w = weaponPool(s)
    expect(w.entries.length).toBeGreaterThan(0)
    expect(w.entries.every((e) => !e.id.startsWith('weapon.'))).toBe(true)
    const armor = (s.pools.get('armor')![0].entries[0] as any).id
    const two = w.entries.find((e) => e.burden === 'two-handed')
    const prim = w.entries.find((e) => e.weaponSlot === 'primary' && e.burden === 'one-handed')
    const sec = w.entries.find((e) => e.weaponSlot === 'secondary' && e.burden === 'one-handed')
    const ids = two ? [two.id, armor] : [prim!.id, sec!.id, armor]
    expect(steps(validateCreation(legal(s, (x) => { x.choices.equipmentIds = ids }), s))).not.toContain('equipment')
    expect(steps(validateCreation(legal(s), s))).toContain('equipment')
  })
  it('Western adds to the weapon pool: base weapons and revolver both allowed', () => {
    const w = weaponPool(buildCreation(packs, { supplements: ['western'] })).entries
    expect(w.some((e) => e.id.startsWith('weapon.'))).toBe(true)
    expect(w.some((e) => e.id === 'revolver')).toBe(true)
  })
  it('Tech: Iconic Weapon builder validated; Credits replace gold; upgrade slots scale by tier', () => {
    const s = buildCreation(packs, { supplements: ['tech'] })
    expect(weaponPool(s)).toMatchObject({ entries: [], builder: 'iconic-weapon' })
    const armor = baseArmor(s)
    const noBuild = legal(s, (x) => { x.choices.equipmentIds = [armor] })
    expect(steps(validateCreation(noBuild, s))).toEqual(['iconic-weapon'])
    const choices = { 'iconic-weapon': { trait: 'knowledge', range: 'far', damage: 'd8+0', name: 'Arc rifle', description: 'Hums' } }
    const built = legal(s, (x) => { x.choices.equipmentIds = [armor]; x.creation!.frameChoices = choices })
    expect(validateCreation(built, s)).toEqual([])
    const st = deriveStats(built, s)
    expect(st.currency).toEqual({ name: 'Credits', amount: 5 })
    expect(st.kit).toContain('5 Credits')
    expect(st.kit).toContain('Tech Link')
    expect(st.trackers.find((t) => t.id === 'upgrade-slots')!.count).toBe(2)
    built.level = 5
    expect(deriveStats(built, s).trackers.find((t) => t.id === 'upgrade-slots')!.count).toBe(4)
    const extra = legal(s, (x) => { x.choices.equipmentIds = [armor, 'weapon.dagger']; x.creation!.frameChoices = choices })
    expect(steps(validateCreation(extra, s))).toEqual(['equipment'])
  })
  it('Floating Magic School: flight artifact text required', () => {
    const s = buildCreation(packs, { supplements: ['floating-magic-school'] })
    expect(steps(validateCreation(legal(s), s))).toEqual(['flight-artifact'])
    expect(validateCreation(legal(s, (x) => { x.creation!.frameChoices = { 'flight-artifact': 'A broom' } }), s)).toEqual([])
  })
})
