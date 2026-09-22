import type { AdvancementRecord, Character, LevelRecord } from '../engine/character'
import type { Registry } from '../engine/packs'
import { applyRecord, initialProgress, type Progress } from '../engine/levelup'
import { titleCase } from './util'

const nameOf = (reg: Registry, kind: 'domainCards' | 'classes' | 'subclasses', id: string) => (reg[kind].get(id) as { name?: string } | undefined)?.name ?? id

/** One line for an advancement, e.g. "Increase two traits: Agility, Strength". `before` = state before this advancement's level. */
export function describeAdvancement(a: AdvancementRecord, before: Progress, reg: Registry): string {
  const opt = reg.levelUpOptions.get(a.option) as { name: string } | undefined
  const head = opt?.name ?? a.option
  const tier = `tier ${a.fromTier} box`
  if (a.traits?.length) return `${head}: ${a.traits.map(titleCase).join(', ')} (${tier})`
  if (a.experienceIndexes?.length) return `${head}: ${a.experienceIndexes.map((i) => before.experiences[i]?.text ?? `#${i + 1}`).join(', ')} (${tier})`
  if (a.cardId) return `${head}: ${nameOf(reg, 'domainCards', a.cardId)} (${tier})`
  if (a.multiclass) {
    const m = a.multiclass
    return `${head}: ${nameOf(reg, 'classes', m.classId)}, ${titleCase(m.domainId)} domain, ${nameOf(reg, 'subclasses', m.subclassId)} foundation (${tier})`
  }
  if (a.subclassId) return `${head}: ${nameOf(reg, 'subclasses', a.subclassId)} (${tier})`
  return `${head} (${tier})`
}

/** Plain-language lines for what one level record gained. */
export function describeRecord(rec: LevelRecord, before: Progress, reg: Registry): string[] {
  const lines: string[] = []
  if (rec.newExperience) lines.push(`New Experience: ${rec.newExperience} (+2)`)
  for (const a of rec.advancements) lines.push(describeAdvancement(a, before, reg))
  lines.push(`New domain card: ${nameOf(reg, 'domainCards', rec.newCardId)}`)
  if (rec.swap) lines.push(`Swapped ${nameOf(reg, 'domainCards', rec.swap.out)} for ${nameOf(reg, 'domainCards', rec.swap.in)}`)
  if (rec.stanceId) lines.push(`New stance: ${titleCase(rec.stanceId)}`)
  if (rec.companionOptionIds?.length) lines.push(`Companion: ${rec.companionOptionIds.map(titleCase).join(', ')}`)
  if (rec.viciousChoice && rec.companionOptionIds?.includes('vicious')) lines.push(`Vicious: companion ${rec.viciousChoice}`)
  if (rec.companionExperience !== undefined && rec.companionOptionIds?.includes('intelligent')) lines.push(`Intelligent: companion Experience ${rec.companionExperience + 1} +1`)
  return lines
}

/** Every level's lines, oldest first, replaying so Experience indexes resolve to names. */
export function describeHistory(ch: Character, reg: Registry): { level: number; lines: string[] }[] {
  let p = initialProgress(ch, reg)
  return ch.history.map((rec) => {
    const lines = describeRecord(rec, p, reg)
    p = applyRecord(p, rec, ch, reg).progress
    return { level: rec.level, lines }
  })
}
