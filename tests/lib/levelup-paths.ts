import { readFileSync } from 'node:fs'
import { buildCreation } from '../../src/engine/creation'
import { newCharacter, creationOf, type Character, type AdvancementRecord, type LevelRecord } from '../../src/engine/character'
import { applyLevelUp, progressOf, validateLevelUp } from '../../src/engine/levelup'

/** Shared helpers for building legal leveled-up characters in tests. */
const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const frames = JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))
export const reg = buildCreation([core, frames]).registry
export const cards = [...reg.domainCards.values()] as any[]

/** A level 1 character of the given class (subclass = its first). Cards: two level 1 cards from its domains. */
export function level1(classId = 'wizard', id = 'v1'): Character {
  const ch = newCharacter(id, '2026-01-01T00:00:00.000Z')
  const cls: any = reg.classes.get(classId)
  ch.choices.classId = classId
  ch.choices.subclassId = classId === 'brawler' ? 'brawler.martial-artist' : cls.subclasses[0]
  ch.choices.domainCardIds = cards.filter((c) => c.level === 1 && cls.domains.includes(c.domain)).slice(0, 2).map((c) => c.id)
  ch.creation = { ...creationOf(ch), experiences: ['Sailor', 'Liar'] }
  if (classId === 'brawler') ch.creation.stanceIds = ['favored', 'nimble'].filter((s) => (cls.stances as any[]).some((x) => x.id === s))
  return ch
}

export const adv = (option: string, fromTier: number, more: Partial<AdvancementRecord> = {}): AdvancementRecord => ({ option, fromTier, ...more })
export const hp = (t: number) => adv('hit-point', t)
export const stress = (t: number) => adv('stress', t)

/** A record for the next level with a fresh legal card from the class's own domains and the achievement Experience if due. */
export function rec(ch: Character, advancements: AdvancementRecord[], more: Partial<LevelRecord> = {}): LevelRecord {
  const level = ch.level + 1
  const cls: any = reg.classes.get(ch.choices.classId!)
  const owned = progressOf(ch, reg).domainCardIds
  const card = cards.find((c) => cls.domains.includes(c.domain) && c.level <= level && !owned.includes(c.id))
  const r: LevelRecord = { level, advancements, newCardId: card.id, ...more }
  if ([2, 5, 8].includes(level) && r.newExperience === undefined) r.newExperience = `Exp ${level}`
  return r
}
let n = 0
export const up = (ch: Character, advancements: AdvancementRecord[], more: Partial<LevelRecord> = {}) => applyLevelUp(ch, rec(ch, advancements, more), reg, `id${++n}`, '2026-02-01T00:00:00.000Z')
export const problems = (ch: Character, advancements: AdvancementRecord[], more: Partial<LevelRecord> = {}) => validateLevelUp(ch, rec(ch, advancements, more), reg)

/** Level 4 wizard: hit-point x2, stress x2, evasion, experience (all tier 2 slots except traits and cards). */
export function toLevel(target: number, ch = level1()): Character {
  const plan: AdvancementRecord[][] = [
    [hp(2), hp(2)], [stress(2), stress(2)], [adv('evasion', 2), adv('experience', 2, { experienceIndexes: [0, 1] })], // 2-4
    [hp(3), hp(3)], [stress(3), stress(3)], [adv('evasion', 3), adv('experience', 3, { experienceIndexes: [0, 1] })], // 5-7
    [hp(4), hp(4)], [stress(4), stress(4)], [adv('evasion', 4), adv('experience', 4, { experienceIndexes: [0, 1] })], // 8-10
  ]
  while (ch.level < target) ch = up(ch, plan[ch.level - 1])
  return ch
}

/** Level 1 character with equipment so the sheet has an armor and a weapon. */
export function equipped(classId = 'wizard'): Character {
  const ch = level1(classId)
  const eq = [...reg.equipment.values()] as any[]
  ch.name = 'Test Hero'
  ch.choices.ancestryId = 'human'
  ch.choices.communityId = 'wanderborne'
  ch.traits = { agility: 0, strength: 0, finesse: 1, instinct: -1, presence: 1, knowledge: 2 }
  ch.choices.equipmentIds = [eq.find((e) => e.weaponSlot === 'primary' && e.tier === 1).id, eq.find((e) => e.category === 'armor' && e.tier === 1).id]
  return ch
}

