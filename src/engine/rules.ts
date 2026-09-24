import { TRAITS, creationOf, type Character } from './character'
import type { CreationSetup, FrameOp } from './creation'
import type { Entry } from './packs'

/** SRD Character Creation step 3: assign +2, +1, +1, +0, +0, -1 to the six traits in any order. */
export const TRAIT_MODIFIERS = [2, 1, 1, 0, 0, -1]
export const STARTING_STRESS = 6
export const STARTING_HOPE = 2
export const STARTING_PROFICIENCY = 1
export const STARTING_EXPERIENCES = 2
export const STARTING_DOMAIN_CARDS = 2

export const DOWNTIME_MOVES = [
  { id: 'tend-to-wounds', name: 'Tend to Wounds' },
  { id: 'clear-stress', name: 'Clear Stress' },
  { id: 'repair-armor', name: 'Repair Armor' },
  { id: 'prepare', name: 'Prepare' },
  { id: 'work-on-project', name: 'Work on a Project' },
] as const

export const tierOf = (level: number) => (level <= 1 ? 1 : level <= 4 ? 2 : level <= 7 ? 3 : 4)

export interface Issue { step: string; message: string }

type Item = Entry & Record<string, any>
type Slot = 'primary' | 'secondary'

/** Weapons a character may pick from: the base tables (every tier, or only `tier`), changed by frame pool ops. */
export function weaponPool(setup: CreationSetup, tier?: number): { entries: Item[]; builder?: string } {
  const contribs = setup.pools.get('weapons') ?? []
  const replaced = contribs[0]?.mode === 'replace'
  const base = replaced ? [] : baseTable(setup, 'weapon', tier)
  const entries = [...base, ...contribs.flatMap((c) => expandTiers(c.entries as Item[], tier))]
  return { entries, builder: contribs.find((c) => c.choice)?.choice }
}

export function armorPool(setup: CreationSetup, tier?: number): Item[] {
  const contribs = setup.pools.get('armor') ?? []
  const base = contribs[0]?.mode === 'replace' ? [] : baseTable(setup, 'armor', tier)
  return [...base, ...contribs.flatMap((c) => expandTiers(c.entries as Item[], tier))]
}

/** Frame pool items list one `tiers` table; the pickers and stats want one flat item per tier, like the base tables (id `<id>-t<n>`, name unchanged). */
const expandTiers = (entries: Item[], only?: number): Item[] =>
  entries.flatMap((e) => {
    if (!e.tiers) return [e]
    const { tiers, ...rest } = e
    return Object.entries(tiers as Record<string, object>)
      .filter(([t]) => only === undefined || Number(t) === only)
      .map(([t, v]) => ({ ...rest, ...v, id: `${e.id}-t${t}`, baseId: e.id, tier: Number(t) }) as Item)
  })

const baseTable = (setup: CreationSetup, category: string, tier?: number): Item[] =>
  [...setup.registry.equipment.values()].filter((e: Item) => e.category === category && (tier === undefined || e.tier === tier)) as Item[]

/** Wheelchair weapons take the primary slot. */
const slotOf = (w: Item): Slot => (w.weaponSlot === 'secondary' ? 'secondary' : 'primary')

export function frameChoiceDefs(setup: CreationSetup) {
  return [setup.frame, ...setup.supplements].flatMap((f) => (f?.creation?.choices ?? []).map((c) => ({ ...c, source: f!.id })))
}

/** Downtime moves after frame remove-move / add-move ops. */
export function downtimeMoves(setup: CreationSetup): { id: string; name: string; rules?: string }[] {
  const removed = new Set(setup.ops.filter((o) => o.op === 'remove-move').map((o) => String(o.move)))
  const added = setup.ops.filter((o) => o.op === 'add-move').map((o) => ({ id: String(o.id), name: String(o.name), rules: String(o.rules ?? '') }))
  return [...DOWNTIME_MOVES.filter((m) => !removed.has(m.id)), ...added]
}

const label = (id: string) => id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())
const nonBlank = (s: unknown) => typeof s === 'string' && s.trim() !== ''

/**
 * Checks the whole creation. Issues are keyed by wizard step id so the UI can mark steps.
 * An empty list means the character is complete and legal.
 */
export function validateCreation(ch: Character, setup: CreationSetup): Issue[] {
  const out: Issue[] = []
  const bad = (step: string, message: string) => out.push({ step, message })
  const cr = creationOf(ch)
  const reg = setup.registry
  const cls: any = ch.choices.classId ? reg.classes.get(ch.choices.classId) : undefined

  if (!cls) bad('class', 'Choose a class.')
  const sub: any = ch.choices.subclassId ? reg.subclasses.get(ch.choices.subclassId) : undefined
  if (!sub) bad('subclass', 'Choose a subclass.')
  else if (cls && sub.class !== cls.id) bad('subclass', `${sub.name} is not a ${cls.name} subclass.`)

  if (cr.mixedAncestry) {
    const { first, second } = cr.mixedAncestry
    if (!reg.ancestries.has(first) || !reg.ancestries.has(second)) bad('ancestry', 'Choose both ancestries for the Mixed Ancestry.')
    else if (first === second) bad('ancestry', 'Mixed Ancestry takes the first feature of one ancestry and the second feature of a different one.')
  } else if (!ch.choices.ancestryId || !reg.ancestries.has(ch.choices.ancestryId)) bad('ancestry', 'Choose an ancestry.')
  if (!ch.choices.communityId || !reg.communities.has(ch.choices.communityId)) bad('community', 'Choose a community.')

  // Traits
  const vals = TRAITS.map((t) => ch.traits[t])
  if (vals.some((v) => v === undefined)) bad('traits', 'Assign a modifier to all six traits.')
  else if ([...vals].sort().join() !== [...TRAIT_MODIFIERS].sort().join()) bad('traits', 'Assign +2, +1, +1, +0, +0, -1 in any order.')

  validateEquipment(ch, setup, bad)

  const exps = cr.experiences.filter(nonBlank)
  if (exps.length !== STARTING_EXPERIENCES || cr.experiences.length !== STARTING_EXPERIENCES) bad('experiences', `Write exactly ${STARTING_EXPERIENCES} Experiences.`)

  // Domain cards: two level 1 cards from the class's domains, one each or both from one.
  const ids = ch.choices.domainCardIds
  if (ids.length !== STARTING_DOMAIN_CARDS || new Set(ids).size !== ids.length) bad('domain-cards', `Choose ${STARTING_DOMAIN_CARDS} different level 1 domain cards.`)
  for (const id of ids) {
    const card: any = reg.domainCards.get(id)
    if (!card) bad('domain-cards', `Unknown domain card "${id}".`)
    else if (card.level !== 1) bad('domain-cards', `${card.name} is level ${card.level}; choose level 1 cards.`)
    else if (cls && !cls.domains.includes(card.domain)) bad('domain-cards', `${card.name} is not from a ${cls.name} domain.`)
  }

  // Class extras
  if (sub?.id === 'ranger.beastbound') {
    const c = cr.companion
    const need = cls.companion?.experiences?.count ?? 2
    if (!c || !nonBlank(c.name) || !nonBlank(c.attack) || !c.damageType || c.experiences.filter(nonBlank).length !== need) {
      bad('subclass', 'Beastbound: name your companion, give it two Experiences, and describe its attack and damage type.')
    }
  }
  if (sub?.id === 'brawler.martial-artist') {
    const known = cr.stanceIds
    const want = cls.knownStancesAtCreation ?? 2
    const okIds = known.every((id) => cls.stances.some((s: any) => s.id === id && s.tier === 1))
    if (known.length !== want || new Set(known).size !== known.length || !okIds) bad('subclass', `Martial Artist: choose ${want} different Tier 1 stances.`)
  }

  // Frame choices
  for (const def of frameChoiceDefs(setup) as any[]) {
    const v = cr.frameChoices[def.id]
    if (def.type === 'builder') {
      const b = (typeof v === 'object' ? v : {}) as Record<string, string>
      for (const f of (def.fields ?? []) as { key: string; options?: string[]; free?: boolean }[]) {
        if (f.free ? !nonBlank(b[f.key]) : !f.options?.includes(b[f.key])) bad(def.id, `${label(def.id)}: ${f.free ? 'fill in' : 'choose'} ${f.key}.`)
      }
    } else if (!nonBlank(v)) bad(def.id, `${label(def.id)}: fill this in.`)
  }
  return out
}

function validateEquipment(ch: Character, setup: CreationSetup, bad: (s: string, m: string) => void) {
  const cr = creationOf(ch)
  const { entries: weapons, builder } = weaponPool(setup)
  const picked = ch.choices.equipmentIds
  const weaponIds = picked.filter((id) => weapons.some((w) => w.id === id))
  const armorIds = picked.filter((id) => armorPool(setup).some((a) => a.id === id))
  const unknown = picked.filter((id) => !weaponIds.includes(id) && !armorIds.includes(id))
  for (const id of unknown) bad('equipment', `"${id}" is not normally available as starting equipment. Check with your GM before using.`)

  const ws = weaponIds.map((id) => weapons.find((w) => w.id === id)!)
  if (builder && weapons.length === 0) {
    // The frame replaces the weapon pool with a builder; the builder step validates the weapon.
    if (ws.length) bad('equipment', 'This frame replaces the weapon list; no other weapons can be chosen.')
  } else {
    const prim = ws.filter((w) => slotOf(w) === 'primary')
    const sec = ws.filter((w) => slotOf(w) === 'secondary')
    const twoHanded = prim.length === 1 && sec.length === 0 && prim[0].burden === 'two-handed'
    const pair = prim.length === 1 && sec.length === 1 && prim[0].burden === 'one-handed' && sec[0].burden === 'one-handed'
    // No weapon is a legal choice (Brawler fights bare-handed).
    if (ws.length && !twoHanded && !pair) bad('equipment', 'Choose no weapon, one two-handed primary weapon, or a one-handed primary and a one-handed secondary.')
  }
  // No armor is a legal choice too (Bare Bones, Brawler).
  if (armorIds.length > 1) bad('equipment', 'Choose at most one set of armor.')
  if (cr.potion !== 'health' && cr.potion !== 'stamina') bad('equipment', 'Choose a Minor Health Potion or a Minor Stamina Potion.')
  if (!nonBlank(cr.classItem)) bad('equipment', 'Choose one class item.')
}

export interface Tracker { id: string; shape: string; label: string; count: number | { trait: string }; attachTo?: string; placement?: string }

export interface DerivedStats {
  level: number
  tier: number
  evasion: number
  hitPoints: number
  stress: number
  hope: number
  proficiency: number
  majorThreshold: number
  severeThreshold: number
  armorScore: number
  currency: { name: string; amount: number }
  kit: string[]
  downtimeMoves: { id: string; name: string }[]
  trackers: Tracker[]
}

/** Starting numbers from the SRD, computed from choices. Missing choices fall back to 0/empty. */
export function deriveStats(ch: Character, setup: CreationSetup): DerivedStats {
  const reg = setup.registry
  const cls: any = ch.choices.classId ? reg.classes.get(ch.choices.classId) : undefined
  const armor = armorPool(setup).find((a) => ch.choices.equipmentIds.includes(a.id))
  const cr = creationOf(ch)
  const tier = tierOf(ch.level)

  const res = setup.ops.find((o: FrameOp) => o.op === 'set-resource' && o.resource === 'currency')
  const currency = res ? { name: String(res.name), amount: Number(res.start) } : { name: 'Gold (handfuls)', amount: 1 }
  const kit = ['A torch', '50 feet of rope', 'Basic supplies', currency.name === 'Gold (handfuls)' ? 'A handful of gold' : `${currency.amount} ${currency.name}`]
  if (cr.potion) kit.push(cr.potion === 'health' ? 'Minor Health Potion (clear 1d4 Hit Points)' : 'Minor Stamina Potion (clear 1d4 Stress)')
  if (cr.classItem.trim()) kit.push(cr.classItem.trim())
  for (const o of setup.ops) if (o.op === 'grant') kit.push(String(o.item))

  const trackers: Tracker[] = []
  for (const o of setup.ops) {
    if (o.op !== 'add-tracker') continue
    const base = o.count as number | { trait: string }
    const count = typeof base === 'number' ? base + Number(o.perTier ?? 0) * (tier - 1) : base
    trackers.push({ id: String(o.id), shape: String(o.shape), label: String(o.label), count, attachTo: o.attachTo as string | undefined, placement: o.placement as string | undefined })
  }
  for (const id of ch.choices.domainCardIds) for (const t of ((reg.domainCards.get(id) as any)?.trackers ?? []) as Tracker[]) trackers.push(t)

  return {
    level: ch.level,
    tier,
    evasion: cls?.startingEvasion ?? 0,
    hitPoints: cls?.startingHitPoints ?? 0,
    stress: STARTING_STRESS,
    hope: STARTING_HOPE,
    proficiency: STARTING_PROFICIENCY,
    majorThreshold: armor ? (armor.majorThreshold as number) + ch.level : 0,
    severeThreshold: armor ? (armor.severeThreshold as number) + ch.level : 0,
    armorScore: armor ? (armor.armorScore as number) : 0,
    currency,
    kit,
    downtimeMoves: downtimeMoves(setup),
    trackers,
  }
}

/** Ancestry features the character has, honoring Mixed Ancestry (first feature of one, second of another). */
export function ancestryFeatures(ch: Character, setup: CreationSetup): { name?: string; rules: string; from: string }[] {
  const cr = creationOf(ch)
  const get = (id: string) => setup.registry.ancestries.get(id) as any
  if (cr.mixedAncestry) {
    const a = get(cr.mixedAncestry.first), b = get(cr.mixedAncestry.second)
    return [a && { ...a.features[0], from: a.name }, b && { ...b.features[1], from: b.name }].filter(Boolean)
  }
  const a = get(ch.choices.ancestryId ?? '')
  return a ? a.features.map((f: any) => ({ ...f, from: a.name })) : []
}
