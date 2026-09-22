import type { Character } from './character'
import { progressOf } from './levelup'
import type { Registry } from './packs'

export const BRANCH_AREAS = ['Subclass', 'Domain cards', 'Experiences', 'Multiclass'] as const
export type BranchArea = (typeof BRANCH_AREAS)[number]

const RANK = ['foundation', 'specialization', 'mastery']

/** A version's value in each area, as plain text (equal text = equal value). */
export function branchValues(ch: Character, reg: Registry): Record<BranchArea, string> {
  const p = progressOf(ch, reg)
  const name = (kind: 'subclasses' | 'classes' | 'domainCards', id: string) => (reg[kind].get(id) as { name?: string } | undefined)?.name ?? id
  const mc = p.multiclass
  return {
    Subclass: Object.entries(p.subclassRanks).map(([id, r]) => `${name('subclasses', id)} (${RANK[r - 1]})`).sort().join(', '),
    'Domain cards': p.domainCardIds.map((id) => name('domainCards', id)).sort().join(', '),
    Experiences: p.experiences.map((e) => `${e.text} (+${e.bonus})`).sort().join(', '),
    Multiclass: mc ? `${name('classes', mc.classId)}, ${mc.domainId} domain, ${name('subclasses', mc.subclassId)}` : 'None',
  }
}

/**
 * Branches = versions of the same level. For each level with more than one version, the areas whose values differ between
 * them, with each version's value. Versions that share every value show nothing.
 */
export function branchDifferences(versions: Character[], reg: Registry): Map<string, { area: BranchArea; value: string }[]> {
  const out = new Map<string, { area: BranchArea; value: string }[]>()
  const byLevel = new Map<number, Character[]>()
  for (const v of versions) byLevel.set(v.level, [...(byLevel.get(v.level) ?? []), v])
  for (const group of byLevel.values()) {
    if (group.length < 2) continue
    const values = group.map((v) => ({ id: v.id, vals: branchValues(v, reg) }))
    for (const area of BRANCH_AREAS) {
      if (new Set(values.map((x) => x.vals[area])).size < 2) continue
      for (const x of values) out.set(x.id, [...(out.get(x.id) ?? []), { area, value: x.vals[area] }])
    }
  }
  return out
}
