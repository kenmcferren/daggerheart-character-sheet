import type { AdvancementRecord, Character, LevelRecord } from '../../src/engine/character'
import { COMPANION_SUBCLASS, STANCE_SUBCLASS, afterAdvancements, applyLevelUp, companionOptionCount, domainCardProblem, extrasOf, optionAvailability, progressOf } from '../../src/engine/levelup'
import { tierOf } from '../../src/engine/rules'
import { equipped, reg } from './levelup-paths'

/** A named way of leveling: which advancements to prefer, and whether to swap a card every level. */
export interface Pattern { name: string; prefer: string[]; swap?: boolean; seed?: number }

const FALLBACK = ['hit-point', 'stress', 'evasion', 'experience', 'domain-card', 'traits', 'subclass-upgrade', 'proficiency', 'multiclass']

export const NAMED: Pattern[] = [
  { name: 'all-subclass', prefer: ['subclass-upgrade'] },
  { name: 'multiclass-at-5', prefer: ['multiclass', 'subclass-upgrade'] },
  { name: 'max-hp-stress', prefer: ['hit-point', 'stress'] },
  { name: 'traits-heavy', prefer: ['traits', 'experience'] },
  { name: 'experience-heavy', prefer: ['experience', 'domain-card'] },
  { name: 'proficiency-first', prefer: ['proficiency', 'evasion'] },
  { name: 'card-swap-heavy', prefer: ['domain-card'], swap: true },
  { name: 'class-extras', prefer: ['brawler-combo-die', 'evasion'] },
]

/** Small seeded generator (mulberry32) so a run can be reproduced from its seed. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(list: T[], rand: () => number) => list[Math.floor(rand() * list.length)]

/** Builds the next level's record using only choices the rules allow; throws if the generator itself cannot find a legal one. */
export function nextRecord(ch: Character, pattern: Pattern, rand: () => number, random: boolean): LevelRecord {
  const level = ch.level + 1
  const tier = tierOf(level)
  const prev = progressOf(ch, reg)
  const cls: any = reg.classes.get(ch.choices.classId!)
  const options = ([...reg.levelUpOptions.values()] as any[]).filter((o) => o.kind === 'advancement' && (!o.classId || o.classId === ch.choices.classId))
  const ids = options.map((o) => o.id as string)
  const cards = ([...reg.domainCards.values()] as any[])
  // Worst case for space: the eligible card with the longest rules text; random paths choose freely.
  const choose = (list: any[]) => (random ? pick(list, rand) : [...list].sort((a, b) => b.rules.length - a.rules.length || a.id.localeCompare(b.id))[0])

  const drafts: AdvancementRecord[] = []
  let budget = 2
  while (budget > 0) {
    const st = afterAdvancements(prev, level, drafts, ch, reg)
    const order = random ? [...ids].sort(() => rand() - 0.5) : [...new Set([...pattern.prefer, ...FALLBACK, ...ids])]
    let taken = false
    for (const id of order) {
      const opt = options.find((o) => o.id === id)
      if (!opt) continue
      const av = optionAvailability(st, level, opt, reg, budget)
      if (av.reason) continue
      const fromTier = av.tiers.includes(tier) ? tier : av.tiers[0]
      const a: AdvancementRecord = { option: id, fromTier }
      if (opt.effect === 'traits') a.traits = (['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'] as const).filter((t) => !st.markedTraits.includes(t)).slice(0, 2)
      else if (opt.effect === 'experience') a.experienceIndexes = [0, 1]
      else if (opt.effect === 'domain-card') {
        const eligible = cards.filter((c) => domainCardProblem(st, level, cls, reg, c.id, level, st.domainCardIds) === null)
        if (!eligible.length) continue
        a.cardId = choose(eligible).id
      } else if (opt.effect === 'subclass-upgrade') {
        const open = Object.entries(st.subclassRanks).filter(([, r]) => r < 3)
        if (!open.length) continue
        a.subclassId = open[0][0]
      } else if (opt.effect === 'multiclass') {
        const others = ([...reg.classes.values()] as any[]).filter((c) => c.id !== ch.choices.classId)
        const other = random ? pick(others, rand) : others[(level + ch.choices.classId!.length) % others.length]
        const sub = ([...reg.subclasses.values()] as any[]).find((s) => s.class === other.id)
        a.multiclass = { classId: other.id, domainId: other.domains[0], subclassId: sub.id }
      }
      drafts.push(a)
      budget -= opt.cost ?? 1
      taken = true
      break
    }
    if (!taken) throw new Error(`no legal advancement at level ${level} for ${ch.choices.classId} (${pattern.name})`)
  }

  const after = afterAdvancements(prev, level, drafts, ch, reg)
  const held = [...after.domainCardIds]
  const rec: LevelRecord = { level, advancements: drafts, newCardId: '' }
  if ([2, 5, 8].includes(level)) rec.newExperience = `Experience ${level}`
  const fresh = cards.filter((c) => domainCardProblem(after, level, cls, reg, c.id, level, held) === null)
  if (!fresh.length) throw new Error(`no domain card available at level ${level}`)
  rec.newCardId = choose(fresh).id
  if (pattern.swap) {
    const out = prev.domainCardIds.map((id) => reg.domainCards.get(id) as any).find((c) => c && cards.some((x) => x.id !== c.id && x.id !== rec.newCardId && domainCardProblem(after, level, cls, reg, x.id, c.level, held.filter((h) => h !== c.id)) === null))
    if (out) {
      const ins = cards.filter((x) => x.id !== out.id && x.id !== rec.newCardId && domainCardProblem(after, level, cls, reg, x.id, out.level, held.filter((h) => h !== out.id)) === null)
      rec.swap = { out: out.id, in: choose(ins).id }
    }
  }
  const vitalityNew = [...drafts.map((d) => d.cardId), rec.newCardId, rec.swap?.in].includes('vitality') && !prev.domainCardIds.includes('vitality')
  if (vitalityNew) rec.vitalityChoice = ['hitPoint', 'thresholds']
  const { stanceClass, companionClass } = extrasOf(after.subclassRanks, reg)
  if (stanceClass) {
    if (!(STANCE_SUBCLASS in prev.subclassRanks)) rec.startStanceIds = (stanceClass.stances as any[]).filter((x) => x.tier === 1).slice(0, 2).map((x) => x.id)
    else {
      const s = (stanceClass.stances as any[]).filter((x) => x.tier <= tier && !after.stanceIds.includes(x.id))
      rec.stanceId = choose(s.map((x) => ({ ...x, rules: x.rules }))).id
    }
  }
  if (companionClass) {
    if (!(COMPANION_SUBCLASS in prev.subclassRanks)) rec.newCompanion = { name: 'Rex', experiences: ['Scout', 'Loyal'], attack: 'Bite', damageType: 'physical' }
    else {
      const need = companionOptionCount(prev, after, reg, companionClass)
      rec.companionOptionIds = (companionClass.companion.levelUpOptions as any[]).filter((o) => !after.companionOptionIds.includes(o.id)).slice(0, need).map((o) => o.id)
      if (rec.companionOptionIds.includes('vicious')) rec.viciousChoice = 'die'
      if (rec.companionOptionIds.includes('intelligent')) rec.companionExperience = 0
    }
  }
  return rec
}

/** A character of the class leveled to `target` by the pattern (random = pick any legal option, seeded). */
export function build(classId: string, pattern: Pattern, target = 10, random = false): Character {
  let ch = equipped(classId)
  const rand = rng(pattern.seed ?? 1)
  let n = 0
  while (ch.level < target) ch = applyLevelUp(ch, nextRecord(ch, pattern, rand, random), reg, `${classId}-${pattern.name}-${++n}`, '2026-03-01T00:00:00.000Z')
  return ch
}
