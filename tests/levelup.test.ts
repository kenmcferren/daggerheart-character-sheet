import { describe, it, expect } from 'vitest'
import { newCharacter, validateCharacter, exportCharacter, importCharacter, type Character } from '../src/engine/character'
import { applyLevelUp, progressOf, replay, validateLevelUp, LevelUpError } from '../src/engine/levelup'
import { branchDifferences } from '../src/engine/branches'
import { CharacterStore, type KeyValueStore } from '../src/engine/saves'

import { reg, cards, level1, adv, hp, stress, rec, up, problems, toLevel } from './lib/levelup-paths'

class MemoryKV implements KeyValueStore {
  map = new Map<string, unknown>()
  async get(k: string) { return this.map.get(k) }
  async set(k: string, v: unknown) { this.map.set(k, v) }
  async del(k: string) { this.map.delete(k) }
  async keys() { return [...this.map.keys()] }
}

describe('[s5] character history and versions', () => {
  it('version 1 saves migrate: level 1, own lineage, empty history, levelUpChoices dropped', () => {
    const old: any = { ...newCharacter('old'), schemaVersion: 1 }
    delete old.lineageId; delete old.parentId; delete old.history
    old.choices = { ...old.choices, levelUpChoices: { 2: ['x'] } }
    const c = validateCharacter(old)
    expect(c).toMatchObject({ schemaVersion: 2, lineageId: 'old', parentId: null, history: [] })
    expect((c.choices as any).levelUpChoices).toBeUndefined()
  })
  it('history length must match the level', () => {
    expect(() => validateCharacter({ ...newCharacter('a'), level: 3 })).toThrow(/one record per level/)
  })
  it('leveling makes a new version and leaves the old one untouched', () => {
    const l1 = level1()
    const frozen = JSON.stringify(l1)
    const l2 = up(l1, [hp(2), stress(2)])
    expect(JSON.stringify(l1)).toBe(frozen)
    expect(l2).toMatchObject({ level: 2, parentId: 'v1', lineageId: 'v1' })
    expect(l2.id).not.toBe(l1.id)
    expect(l2.history).toHaveLength(1)
    expect(validateCharacter(JSON.parse(exportCharacter(l2)))).toEqual(l2)
    expect(importCharacter(exportCharacter(l2)).history).toEqual(l2.history)
  })
  it('replaying a built history gives no errors and matches what each level added', () => {
    const c = toLevel(4)
    const r = replay(c, reg)
    expect(r.errors).toEqual([])
    expect(r.progress).toMatchObject({ level: 4, proficiency: 2, hitPointSlots: 2, stressSlots: 2, evasionBonus: 1 })
    expect(r.progress.experiences.map((e) => e.text)).toEqual(['Sailor', 'Liar', 'Exp 2'])
    expect(r.progress.experiences.map((e) => e.bonus)).toEqual([3, 3, 2])
    expect(r.progress.domainCardIds).toHaveLength(2 + 3)
  })
  it('a tampered history is caught on replay', () => {
    const c = toLevel(3)
    c.history[1].advancements = [hp(2), hp(2), hp(2)]
    expect(replay(c, reg).errors.join('|')).toMatch(/exactly 2/)
  })
})

describe('[s5] level-up rules', () => {
  it('each level must be the next one; max level 10', () => {
    const l1 = level1()
    expect(validateLevelUp(l1, { ...rec(l1, [hp(2), hp(2)]), level: 3 }, reg).join()).toMatch(/expected level 2/)
    expect(problems(toLevel(10), [hp(4), hp(4)]).join()).toMatch(/cannot pass 10/)
  })
  it('advancements must cost exactly 2', () => {
    expect(problems(level1(), [hp(2)]).join()).toMatch(/exactly 2/)
    expect(problems(level1(), [hp(2), hp(2), hp(2)]).join()).toMatch(/exactly 2/)
  })
  it('tier achievement Experience is required at 2, 5, 8 and not elsewhere', () => {
    expect(problems(level1(), [hp(2), hp(2)], { newExperience: '' }).join()).toMatch(/write the new Experience/)
    const l2 = up(level1(), [hp(2), hp(2)])
    expect(problems(l2, [hp(2), hp(2)], { newExperience: 'Nope' }).join()).toMatch(/no new Experience/)
  })
  it('proficiency: +1 from the achievement at 2, 5, 8 and +1 per Proficiency advancement (costs both)', () => {
    expect(progressOf(toLevel(7), reg).proficiency).toBe(3)
    const c = up(toLevel(4), [adv('proficiency', 3)])
    expect(progressOf(c, reg).proficiency).toBe(4)
    expect(problems(toLevel(4), [adv('proficiency', 3), hp(3)]).join()).toMatch(/exactly 2/)
    expect(problems(level1(), [adv('proficiency', 2)]).join()).toMatch(/needs level 5|no slots in tier 2/)
  })
  it('slots run out: tier 2 has 2 Hit Point slots; later tiers add their own', () => {
    const l3 = up(up(level1(), [hp(2), hp(2)]), [stress(2), stress(2)])
    expect(problems(l3, [hp(2), stress(2)]).join()).toMatch(/no unmarked slots left in tier 2/)
    const l4 = toLevel(4)
    expect(problems(toLevel(4), [hp(2), stress(2)]).join()).toMatch(/no unmarked slots/)
    expect(problems(up(l4, [hp(3)].concat([stress(3)])), [hp(3), hp(3)]).join()).toMatch(/no unmarked slots/)
  })
  it('earlier-tier slots stay open in later tiers; later tiers stay closed early', () => {
    const l4 = up(up(up(level1(), [hp(2), stress(2)]), [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })]), [hp(2), stress(2)])
    expect(problems(l4, [adv('domain-card', 2, { cardId: cards.find((c) => c.level === 4 && (reg.classes.get('wizard') as any).domains.includes(c.domain)).id }), hp(2)], { newExperience: 'x' })).toBeDefined()
    // level 5 (tier 3) can still use a tier 2 box... all tier 2 slots taken above except traits and domain-card
    const t = ['agility', 'strength'] as any
    expect(problems(l4, [adv('traits', 2, { traits: t }), adv('traits', 3, { traits: ['finesse', 'instinct'] as any })]).join()).toBe('')
    expect(problems(level1(), [adv('traits', 3, { traits: t }), hp(2)]).join()).toMatch(/no slots in tier 3/)
  })
  it('traits: two different, unmarked; marks clear at levels 5 and 8', () => {
    const t = (a: string, b: string) => adv('traits', 2, { traits: [a, b] as any })
    expect(problems(level1(), [t('agility', 'agility'), hp(2)]).join()).toMatch(/two different traits/)
    const l2 = up(level1(), [t('agility', 'strength'), hp(2)])
    expect(progressOf(l2, reg)).toMatchObject({ traitBonus: { agility: 1, strength: 1 }, markedTraits: ['agility', 'strength'] })
    expect(problems(l2, [t('strength', 'finesse'), hp(2)]).join()).toMatch(/strength is marked/)
    const l3 = up(l2, [t('finesse', 'instinct'), hp(2)])
    const l4 = up(l3, [t('presence', 'knowledge'), stress(2)])
    expect(problems(l4, [t('agility', 'strength'), hp(2)]).join()).toMatch(/no unmarked slots left in tier 2|is marked/)
    const l5 = up(l4, [adv('traits', 3, { traits: ['agility', 'strength'] as any }), hp(3)])
    expect(progressOf(l5, reg).traitBonus.agility).toBe(2)
    expect(progressOf(l5, reg).markedTraits.sort()).toEqual(['agility', 'strength'])
  })
  it('Experience advancement: two different existing Experiences', () => {
    expect(problems(level1(), [adv('experience', 2, { experienceIndexes: [0, 0] }), hp(2)]).join()).toMatch(/two different Experiences/)
    expect(problems(level1(), [adv('experience', 2, { experienceIndexes: [0, 2] }), hp(2)]).join()).toBe('')
    expect(problems(level1(), [adv('experience', 2, { experienceIndexes: [0, 3] }), hp(2)]).join()).toMatch(/two different Experiences/)
  })
  it('extra domain card: class domains, level cap by tier, no duplicates', () => {
    const wiz: any = reg.classes.get('wizard')
    const mine = cards.filter((c) => wiz.domains.includes(c.domain))
    const l1 = level1()
    const own = l1.choices.domainCardIds[0]
    expect(problems(l1, [adv('domain-card', 2, { cardId: own }), hp(2)]).join()).toMatch(/already held/)
    const high = mine.find((c) => c.level === 3)
    expect(problems(l1, [adv('domain-card', 2, { cardId: high.id }), hp(2)]).join()).toMatch(/above level 2/)
    const foreign = cards.find((c) => !wiz.domains.includes(c.domain) && c.level === 1)
    expect(problems(l1, [adv('domain-card', 2, { cardId: foreign.id }), hp(2)]).join()).toMatch(/not from a domain you have/)
    const ok = mine.find((c) => c.level === 2 && c.id !== own)
    expect(problems(l1, [adv('domain-card', 2, { cardId: ok.id }), hp(2)]).join()).toBe('')
    const l5 = toLevel(4)
    const four = mine.find((c) => c.level === 5)
    // The cap is the character's level (not the box tier): a level 5 card at level 5 is fine from a tier 2 box.
    expect(problems(l5, [adv('domain-card', 2, { cardId: four.id }), hp(3)]).join()).toBe('')
    expect(problems(l5, [adv('domain-card', 3, { cardId: four.id }), hp(3)]).join()).toBe('')
    const six = mine.find((c) => c.level === 6)
    expect(problems(l5, [adv('domain-card', 3, { cardId: six.id }), hp(3)]).join()).toMatch(/above level 5/)
  })
  it('the level card must be at or below the level, from the class domains', () => {
    const wiz: any = reg.classes.get('wizard')
    const c = cards.find((x) => wiz.domains.includes(x.domain) && x.level === 5)
    expect(validateLevelUp(level1(), { ...rec(level1(), [hp(2), hp(2)]), newCardId: c.id }, reg).join()).toMatch(/new domain card: .*above level 2/)
  })
  it('swap: a previously held card for one of the same level or lower', () => {
    const l1 = level1()
    const wiz: any = reg.classes.get('wizard')
    const [a] = l1.choices.domainCardIds
    const lower = cards.find((c) => wiz.domains.includes(c.domain) && c.level === 1 && !l1.choices.domainCardIds.includes(c.id) && c.id !== rec(l1, []).newCardId)
    const swap = { out: a, in: lower.id }
    const l2 = up(l1, [hp(2), hp(2)], { swap })
    const ids = progressOf(l2, reg).domainCardIds
    expect(ids).toContain(lower.id)
    expect(ids).not.toContain(a)
    const higher = cards.find((c) => wiz.domains.includes(c.domain) && c.level === 2)
    expect(problems(l1, [hp(2), hp(2)], { swap: { out: a, in: higher.id } }).join()).toMatch(/swap: .*above level 1/)
    expect(problems(l1, [hp(2), hp(2)], { swap: { out: a, in: a } }).join()).toMatch(/choose a different card/)
    expect(problems(l1, [hp(2), hp(2)], { swap: { out: 'nope', in: lower.id } }).join()).toMatch(/swap: choose a card you held/)
  })
})

describe('[s5] slot cap', () => {
  it('Hit Points never pass 12: a 7 Hit Point class can take only five Hit Point slots', () => {
    let g = level1('guardian')
    const filler = [[stress(2), stress(2)], [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })]]
    g = up(g, [hp(2), hp(2)])            // 9
    g = up(g, filler[0])
    g = up(g, filler[1])
    g = up(g, [hp(3), hp(3)])            // 11 (level 5)
    g = up(g, [stress(3), stress(3)])
    g = up(g, [adv('evasion', 3), adv('experience', 3, { experienceIndexes: [0, 1] })])
    expect(problems(g, [hp(4), hp(4)]).join()).toMatch(/Hit Points are already at 12/)
    g = up(g, [hp(4), adv('traits', 4, { traits: ['agility', 'strength'] })])   // 12
    expect(progressOf(g, reg).hitPointSlots).toBe(5)
    expect(problems(g, [hp(4), stress(4)]).join()).toMatch(/Hit Points are already at 12/)
  })
  it('the level-up screen greys the option out once the cap is reached', async () => {
    const { optionAvailability } = await import('../src/engine/levelup')
    const st = { ...progressOf(level1('guardian'), reg), hitPointSlots: 5 }
    expect(optionAvailability(st, 8, reg.levelUpOptions.get('hit-point'), reg, 2).reason).toMatch(/already at 12/)
    expect(optionAvailability(st, 8, reg.levelUpOptions.get('stress'), reg, 2).reason).toBeNull()
  })
})

describe('[s5] subclass upgrades and multiclass', () => {
  const mc = (classId = 'bard', domainId = 'grace', subclassId?: string) => ({ classId, domainId, subclassId: subclassId ?? (reg.classes.get(classId) as any).subclasses[0] })
  const l4 = () => toLevel(4)

  it('not before level 5', () => {
    expect(problems(l4(), [adv('subclass-upgrade', 2)]).join()).toMatch(/needs level 5|no slots in tier 2/)
    expect(problems(l4(), [adv('multiclass', 2, { multiclass: mc() })]).join()).toMatch(/needs level 5|no slots in tier 2/)
  })
  it('subclass card goes foundation -> specialization -> mastery, then no more', () => {
    const l5 = up(l4(), [adv('subclass-upgrade', 3), hp(3)])
    expect(progressOf(l5, reg).subclassRanks).toEqual({ 'wizard.school-of-knowledge': 2 })
    const l8 = up(toLevel(7, l5), [adv('subclass-upgrade', 4), hp(4)])
    expect(progressOf(l8, reg).subclassRanks['wizard.school-of-knowledge']).toBe(3)
  })
  it('only one upgraded subclass slot per tier box', () => {
    const l5 = up(l4(), [adv('subclass-upgrade', 3), hp(3)])
    expect(problems(l5, [adv('subclass-upgrade', 3), stress(3)]).join()).toMatch(/no unmarked slots left in tier 3/)
  })
  it('multiclass costs both advancements and adds class, domain, subclass foundation', () => {
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: mc() })])
    const p = progressOf(l5, reg)
    expect(p.multiclass).toEqual(mc())
    expect(p.subclassRanks[mc().subclassId]).toBe(1)
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: mc() }), hp(3)]).join()).toMatch(/exactly 2/)
  })
  it('multiclass input is checked: different class, its own domain, its own subclass', () => {
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: mc('wizard', 'codex') })]).join()).toMatch(/different class/)
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: mc('bard', 'bone') })]).join()).toMatch(/not a domain of/)
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: mc('bard', 'grace', 'ranger.beastbound') })]).join()).toMatch(/choose a subclass of/)
    expect(problems(l4(), [adv('multiclass', 3, {})]).join()).toMatch(/choose a class/)
  })
  it('multiclass can be taken once only', () => {
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: mc() })])
    const l8 = toLevel(7, l5)
    expect(problems(l8, [adv('multiclass', 4, { multiclass: mc('rogue', 'midnight') })]).join()).toMatch(/no unmarked slots left in tier 4/)
  })
  it('subclass upgrade closes that tier multiclass box; multiclass cannot then use it', () => {
    const b = up(l4(), [adv('subclass-upgrade', 3), hp(3)])
    expect(problems(b, [adv('multiclass', 3, { multiclass: mc() })]).join()).toMatch(/no unmarked slots left in tier 3/)
  })
  it('multiclass crosses out one unused subclass upgrade, this or next tier (default this tier)', () => {
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: mc() })])
    expect(progressOf(l5, reg).crossed.sort()).toEqual(['multiclass@*', 'subclass-upgrade@3'])
    const l8 = toLevel(7, l5)
    expect(problems(l8, [adv('subclass-upgrade', 4), hp(4)]).join()).toBe('')
    const chosen = up(l4(), [adv('multiclass', 3, { multiclass: mc(), crossOutTier: 4 })])
    expect(progressOf(chosen, reg).crossed.sort()).toEqual(['multiclass@*', 'subclass-upgrade@4'])
    expect(problems(toLevel(7, chosen), [adv('subclass-upgrade', 4), hp(4)]).join()).toMatch(/no unmarked slots left in tier 4/)
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: mc(), crossOutTier: 2 })]).join()).toMatch(/cannot be crossed out/)
    // Crossing out next tier's box keeps this tier's subclass card available later in the tier, even though Multiclass was taken here.
    const later = up(chosen, [adv('subclass-upgrade', 3), hp(3)])
    expect(progressOf(later, reg).subclassRanks['wizard.school-of-knowledge']).toBe(2)
    // A tier 4 Multiclass box can only cross out tier 4's subclass box.
    expect(problems(toLevel(7, l4()), [adv('multiclass', 4, { multiclass: mc(), crossOutTier: 5 })]).join()).toMatch(/cannot be crossed out/)
  })
  it('multiclass needs an unused subclass upgrade left to cross out', () => {
    const l5 = up(l4(), [adv('subclass-upgrade', 3), hp(3)])
    const l8 = up(toLevel(7, l5), [adv('subclass-upgrade', 4), hp(4)])
    expect(problems(l8, [adv('multiclass', 4, { multiclass: mc() })], {}).join()).toMatch(/no unmarked slots left in tier 4|no unused Take an upgraded subclass card/)
    expect(problems(toLevel(7, up(l4(), [adv('subclass-upgrade', 3), hp(3)])), [adv('multiclass', 3, { multiclass: mc(), crossOutTier: 3 })]).join()).toMatch(/no unmarked slots|cannot be crossed out/)
  })
  it('multiclass domain cards are limited to half your level (rounded up)', () => {
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: mc() })])
    const grace = cards.filter((c) => c.domain === 'grace')
    const l6 = l5
    // next level is 6: half = 3
    const three = grace.find((c) => c.level === 3)
    const four = grace.find((c) => c.level === 4)
    expect(validateLevelUp(l6, { ...rec(l6, [hp(3), hp(3)]), newCardId: three.id }, reg).join()).toBe('')
    expect(validateLevelUp(l6, { ...rec(l6, [hp(3), hp(3)]), newCardId: four.id }, reg).join()).toMatch(/above half your level/)
  })
  it('an upgrade can target the multiclass subclass', () => {
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: mc() })])
    const l8 = up(toLevel(7, l5), [adv('subclass-upgrade', 4, { subclassId: mc().subclassId }), hp(4)])
    expect(progressOf(l8, reg).subclassRanks[mc().subclassId]).toBe(2)
    expect(problems(toLevel(7, l5), [adv('subclass-upgrade', 4, { subclassId: 'assassin.executioners-guild' }), hp(4)]).join()).toMatch(/one of your subclasses/)
  })
})

describe('[s5] class-specific level-up steps', () => {
  it('brawler: one new stance per level from your tier or lower', () => {
    const b: any = reg.classes.get('brawler')
    const t1 = b.stances.filter((s: any) => s.tier === 1).map((s: any) => s.id)
    const t2 = b.stances.find((s: any) => s.tier === 2)
    const ch = level1('brawler')
    ch.creation!.stanceIds = t1.slice(0, 2)
    expect(problems(ch, [hp(2), hp(2)]).join()).toMatch(/choose a stance/)
    expect(problems(ch, [hp(2), hp(2)], { stanceId: t1[0] }).join()).toMatch(/already known/)
    expect(problems(ch, [hp(2), hp(2)], { stanceId: t2.id }).join()).toBe('')
    const t3 = b.stances.find((s: any) => s.tier === 3)
    expect(problems(ch, [hp(2), hp(2)], { stanceId: t3.id }).join()).toMatch(/above your tier/)
    const l2 = up(ch, [hp(2), hp(2)], { stanceId: t2.id })
    expect(progressOf(l2, reg).stanceIds).toEqual([...t1.slice(0, 2), t2.id])
  })
  it('brawler: combo die advancement, one slot per tier', () => {
    const ch = level1('brawler')
    const stanceOf = (c: Character) => (reg.classes.get('brawler') as any).stances.find((s: any) => s.tier <= Math.max(2, Math.ceil((c.level + 1) / 3)) && !progressOf(c, reg).stanceIds.includes(s.id)).id
    const l2 = up(ch, [adv('brawler-combo-die', 2), hp(2)], { stanceId: stanceOf(ch) })
    expect(progressOf(l2, reg).comboDieSteps).toBe(1)
    expect(problems(l2, [adv('brawler-combo-die', 2), hp(2)], { stanceId: stanceOf(l2) }).join()).toMatch(/no unmarked slots left in tier 2/)
    expect(problems(level1('wizard'), [adv('brawler-combo-die', 2), hp(2)]).join()).toMatch(/not available to this class/)
  })
  it('ranger: at least one companion option per level, each once; more with Expert/Advanced Training', () => {
    const ch = level1('ranger')
    expect(problems(ch, [hp(2), hp(2)]).join()).toMatch(/choose 1 companion/)
    expect(problems(ch, [hp(2), hp(2)], { companionOptionIds: ['aware', 'armored'] }).join()).toMatch(/choose 1 companion/)
    expect(problems(ch, [hp(2), hp(2)], { companionOptionIds: ['nope'] }).join()).toMatch(/unknown companion option/)
    const l2 = up(ch, [hp(2), hp(2)], { companionOptionIds: ['aware'] })
    expect(problems(l2, [hp(2), hp(2)], { companionOptionIds: ['aware'] }).join()).toMatch(/already taken/)
    // Expert Training (the Beastbound specialization) allows a second option per level.
    const opts = ['armored', 'vicious', 'resilient', 'bonded', 'intelligent', 'creature-comfort', 'light-in-the-dark']
    let c = up(l2, [stress(2), stress(2)], { companionOptionIds: [opts[0]] })
    c = up(c, [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })], { companionOptionIds: [opts[1]] })
    expect(problems(c, [adv('subclass-upgrade', 3), hp(3)], { companionOptionIds: [opts[2], opts[3]] }).join()).toBe('')
    expect(problems(c, [adv('subclass-upgrade', 3), hp(3)], { companionOptionIds: [opts[2], opts[3], opts[4]] }).join()).toMatch(/choose 2 companion/)
    expect(problems(c, [hp(3), hp(3)], { companionOptionIds: [opts[2], opts[3]] }).join()).toMatch(/choose 1 companion/)
    // Extra options are one-time: the level after the specialization needs just one again.
    const l5 = up(c, [adv('subclass-upgrade', 3), hp(3)], { companionOptionIds: [opts[2], opts[3]] })
    expect(problems(l5, [stress(3), stress(3)], { companionOptionIds: [opts[4], opts[5]] }).join()).toMatch(/choose 1 companion/)
    expect(problems(l5, [stress(3), stress(3)], { companionOptionIds: [opts[4]] }).join()).toBe('')
  })
})

describe('[s5] saved versions and branches', () => {
  it('lineages list one entry per character; versions stay separate; re-leveling an old version branches', async () => {
    const store = new CharacterStore(new MemoryKV(), (() => { let t = 0; return () => new Date(Date.UTC(2026, 0, 1, 0, 0, ++t)).toISOString() })())
    const l1 = await store.save(level1('wizard', 'w1'))
    const l2 = await store.save(up(l1, [hp(2), hp(2)]))
    const l3 = await store.save(up(l2, [stress(2), stress(2)]))
    const l4a = await store.save(up(l3, [adv('evasion', 2), adv('traits', 2, { traits: ['agility', 'strength'] as any })]))
    // Reopen level 3 and take different choices: a second level 4, not an overwrite.
    const l4b = await store.save(up(l3, [adv('experience', 2, { experienceIndexes: [0, 1] }), adv('traits', 2, { traits: ['finesse', 'instinct'] as any })]))
    expect(l4a.id).not.toBe(l4b.id)
    const versions = await store.versionsOf('w1')
    expect(versions.map((v) => v.level)).toEqual([1, 2, 3, 4, 4])
    expect(progressOf(l4a, reg).evasionBonus).toBe(1)
    expect(progressOf(l4b, reg).evasionBonus).toBe(0)
    expect(progressOf(l4a, reg).traitBonus.agility).toBe(1)
    expect(progressOf(l4b, reg).traitBonus.agility).toBeUndefined()
    expect(versions.filter((v) => v.parentId === l3.id)).toHaveLength(2)
    const list = await store.lineages()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ versionCount: 5 })
    expect(list[0].latest.id).toBe(l4b.id)
    // Editing within a level overwrites that level's version only.
    await store.save({ ...l4a, notes: 'new gear' })
    expect((await store.load(l4a.id))!.notes).toBe('new gear')
    expect((await store.load(l4b.id))!.notes).toBe('')
    expect(await store.versionsOf('w1')).toHaveLength(5)
    // A second character is a separate lineage; removing one lineage leaves the other.
    await store.save(level1('bard', 'b1'))
    expect(await store.lineages()).toHaveLength(2)
    await store.removeLineage('w1')
    expect((await store.lineages()).map((l) => l.latest.lineageId)).toEqual(['b1'])
  })
  it('branch differences: only same-level versions, only the areas that differ', () => {
    const l1 = level1()
    const l2 = up(l1, [hp(2), hp(2)])
    const l3a = up(l2, [stress(2), stress(2)])
    const l3b = up(l2, [adv('experience', 2, { experienceIndexes: [0, 1] }), stress(2)])
    const d = branchDifferences([l1, l2, l3a, l3b], reg)
    expect(d.has(l1.id)).toBe(false)
    expect(d.has(l2.id)).toBe(false)
    const areas = (id: string) => (d.get(id) ?? []).map((x) => x.area)
    // Same experiences text but different bonuses; the level card is the same first pick, so cards match.
    expect(areas(l3a.id)).toEqual(['Experiences'])
    expect(d.get(l3b.id)![0].value).toContain('Sailor (+3)')
    expect(d.get(l3a.id)![0].value).toContain('Sailor (+2)')
    // A different card on the same level shows under Domain cards.
    const wiz: any = reg.classes.get('wizard')
    const other = cards.find((c) => wiz.domains.includes(c.domain) && c.level <= 3 && !progressOf(l2, reg).domainCardIds.includes(c.id) && c.id !== rec(l2, []).newCardId)
    const l3c = applyLevelUp(l2, { ...rec(l2, [stress(2), stress(2)]), newCardId: other.id }, reg, 'c3')
    expect(branchDifferences([l3a, l3c], reg).get('c3')!.map((x) => x.area)).toEqual(['Domain cards'])
    // Multiclass and subclass areas.
    const l4 = toLevel(4)
    const m = up(l4, [adv('multiclass', 3, { multiclass: { classId: 'bard', domainId: 'grace', subclassId: 'bard.troubadour' } })])
    const u = up(l4, [adv('subclass-upgrade', 3), hp(3)])
    const dd = branchDifferences([m, u], reg)
    expect(dd.get(m.id)!.map((x) => x.area)).toEqual(expect.arrayContaining(['Subclass', 'Multiclass']))
    expect(dd.get(m.id)!.find((x) => x.area === 'Multiclass')!.value).toMatch(/Bard, grace domain/)
    expect(dd.get(u.id)!.find((x) => x.area === 'Multiclass')!.value).toBe('None')
  })
  it('applyLevelUp throws LevelUpError with every problem listed', () => {
    const l1 = level1()
    expect(() => applyLevelUp(l1, { level: 2, advancements: [], newCardId: 'nope' }, reg, 'x')).toThrow(LevelUpError)
  })
})

describe('[s5] afterAdvancements names the new Experience', () => {
  it('lists the typed tier-achievement Experience, not a placeholder, so a later "increase two Experiences" advancement shows its text', async () => {
    const { afterAdvancements, progressOf } = await import('../src/engine/levelup')
    const { level1, reg } = await import('./lib/levelup-paths')
    const ch = level1()
    const st = afterAdvancements(progressOf(ch, reg), 2, [], ch, reg, 'Bridge builder')
    expect(st.experiences.map((e) => e.text)).toContain('Bridge builder')
    expect(afterAdvancements(progressOf(ch, reg), 2, [], ch, reg).experiences.map((e) => e.text)).not.toContain('x')
  })
})
