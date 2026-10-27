import { TRAITS, creationOf, type Character, type Creation } from './character'
import { CONSUMABLE_LABEL, type CreationSetup, type FrameOp } from './creation'
import type { Entry } from './packs'
import { cardTypeProblem, classList, startingCardRule } from './classCards'

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

/** A catalog Augment for a frame's builder weapon (e.g. Tech's Iconic Weapon's Motherboard Module): a fixed SRD option with
 *  a Scrap cost, crafted ("built") freely once its tier Prerequisite is met, but only as many can be "installed" as the
 *  weapon has Upgrade slots. */
export interface AugmentDef {
  id: string; name: string; effect: string; cost: string
  /** Precompile tier Prerequisite; absent = craftable from Tier 1. */
  tier?: number
  armorScore?: number; evasion?: number; damage?: number; attack?: number
  /** Steps to shift the weapon's range toward Very Far (Scope). */
  rangeStep?: number
  /** How many times it can be installed (the boxes beside it on the sheet); each installation stacks. Absent = 1. */
  max?: number
}
/** `installed` is a count; saves from before stacking hold `true`, read as 1. */
export interface AugmentState { crafted: boolean; installed: number | boolean }
export const installedCount = (s?: AugmentState): number => (typeof s?.installed === 'number' ? s.installed : s?.installed ? 1 : 0)

const parseAugmentStates = (raw: unknown): Record<string, AugmentState> => {
  try {
    const o = JSON.parse(typeof raw === 'string' ? raw : '{}')
    return o && typeof o === 'object' ? o : {}
  } catch { return {} }
}

/** Every builder choice's Augment catalog and the character's crafted/installed state for each, by choice id. */
export function augmentsOf(setup: CreationSetup, cr: Creation): { id: string; defs: AugmentDef[]; states: Record<string, AugmentState> }[] {
  return (frameChoiceDefs(setup) as { id: string; type: string; augments?: AugmentDef[] }[])
    .filter((d) => d.type === 'builder' && d.augments)
    .map((d) => {
      const v = cr.frameChoices[d.id]
      return { id: d.id, defs: d.augments!, states: parseAugmentStates(typeof v === 'object' ? (v as Record<string, string>).augments : undefined) }
    })
}

/** Installed (built into the weapon) Augment defs across all builder choices, one entry per installation so stacks add up. */
export function installedAugments(setup: CreationSetup, cr: Creation): AugmentDef[] {
  return augmentsOf(setup, cr).flatMap((u) => u.defs.flatMap((d) => {
    const n = Math.min(installedCount(u.states[d.id]), d.max ?? 1)
    return Array.from({ length: n }, () => d)
  }))
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
  else if (!classList(setup).includes(cls)) bad('class', `${cls.name} is not available with the selected options.`)
  const sub: any = ch.choices.subclassId ? reg.subclasses.get(ch.choices.subclassId) : undefined
  if (!sub) bad('subclass', 'Choose a subclass.')
  else if (cls && sub.class !== cls.id) bad('subclass', `${sub.name} is not a ${cls.name} subclass.`)

  if (cr.mixedAncestry && !setup.mixedAncestryAllowed) bad('ancestry', 'Mixed Ancestry is not available with the selected options.')
  else if (cr.mixedAncestry) {
    const { first, second } = cr.mixedAncestry
    if (!reg.ancestries.has(first) || !reg.ancestries.has(second)) bad('ancestry', 'Choose both ancestries for the Mixed Ancestry.')
    else if (first === second) bad('ancestry', 'Mixed Ancestry takes the first feature of one ancestry and the second feature of a different one.')
  } else if (!ch.choices.ancestryId || !reg.ancestries.has(ch.choices.ancestryId)) bad('ancestry', 'Choose an ancestry.')
  else if (!ancestryList(setup).some((a) => a.id === ch.choices.ancestryId)) bad('ancestry', 'That ancestry is not available with the selected options.')
  if (!ch.choices.communityId || !reg.communities.has(ch.choices.communityId)) bad('community', 'Choose a community.')
  else if (!communityList(setup).some((c) => c.id === ch.choices.communityId)) bad('community', 'That community is not available with the selected options.')

  // Traits
  const vals = TRAITS.map((t) => ch.traits[t])
  if (vals.some((v) => v === undefined)) bad('traits', 'Assign a modifier to all six traits.')
  else if ([...vals].sort().join() !== [...TRAIT_MODIFIERS].sort().join()) bad('traits', 'Assign +2, +1, +1, +0, +0, -1 in any order.')

  validateEquipment(ch, setup, bad)

  const exps = cr.experiences.filter(nonBlank)
  if (exps.length !== STARTING_EXPERIENCES || cr.experiences.length !== STARTING_EXPERIENCES) bad('experiences', `Write exactly ${STARTING_EXPERIENCES} Experiences.`)

  // Domain cards: two level 1 cards from the class's domains, one each or both from one (Starheart classes may change the count, add a domain or bar a card type).
  const ids = ch.choices.domainCardIds
  const rule = cls ? startingCardRule(cls, sub) : { count: STARTING_DOMAIN_CARDS }
  const domains = [...(cls?.domains ?? []), ...(rule.extraDomain ? [rule.extraDomain] : [])]
  if (ids.length !== rule.count || new Set(ids).size !== ids.length) bad('domain-cards', `Choose ${rule.count} different level 1 domain cards.`)
  for (const id of ids) {
    const card: any = reg.domainCards.get(id)
    if (!card) bad('domain-cards', `Unknown domain card "${id}".`)
    else if (card.level !== 1) bad('domain-cards', `${card.name} is level ${card.level}; choose level 1 cards.`)
    else if (cls && !domains.includes(card.domain)) bad('domain-cards', `${card.name} is not from a ${cls.name} domain.`)
    else if (cls && cardTypeProblem(cls, card)) bad('domain-cards', `${card.name}: ${cardTypeProblem(cls, card)}.`)
  }
  if (rule.extraDomain && !ids.some((id) => (reg.domainCards.get(id) as any)?.domain === rule.extraDomain)) bad('domain-cards', `${sub.name}: choose one card from ${rule.extraDomain[0].toUpperCase()}${rule.extraDomain.slice(1)}.`)

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
      for (const f of (def.fields ?? []) as { key: string; options?: string[]; free?: boolean; optional?: boolean }[]) {
        if (f.optional) continue
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
    const maxSecondary = secondarySlots(ch, setup)
    // One primary (or none), up to maxSecondary secondaries, and the hands they need must fit in the hands available:
    // 2+0 is fine, 2+1 is not, 2+2 needs four arms. A secondary needs a primary.
    const fits = prim.length <= 1 && sec.length <= maxSecondary && (sec.length === 0 || prim.length === 1) && ws.reduce((n, w) => n + weaponLoad(w), 0) <= handsAvailable(ch, setup)
    // No weapon is a legal choice (Brawler fights bare-handed).
    if (ws.length && !fits) bad('equipment', `Choose no weapon, one primary weapon, or a primary and ${maxSecondary > 1 ? 'up to two secondary weapons' : 'a secondary weapon'}, using no more than ${handsAvailable(ch, setup)} hands in all (weapons that need no hands are free).`)
  }
  // No armor is a legal choice too (Bare Bones, Brawler).
  if (armorIds.length > 1) bad('equipment', 'Choose at most one set of armor.')
  if (setup.startingStims.length) {
    if (!setup.startingStims.some((s) => s.id === cr.potion) || !setup.startingStims.some((s) => s.id === cr.potion2)) bad('equipment', 'Choose two starting stims.')
  } else if (cr.potion !== 'health' && cr.potion !== 'stamina') bad('equipment', 'Choose a Minor Health Potion or a Minor Stamina Potion.')
  if (!nonBlank(cr.classItem)) bad('equipment', 'Choose one class item.')
}

export interface Tracker { id: string; shape: string; label: string; count: number | { trait?: string; level?: true; tier?: true; base?: number }; attachTo?: string; placement?: string }

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
  const stims = [cr.potion, cr.potion2].map((id) => setup.startingStims.find((s) => s.id === id)).filter((s) => s !== undefined)
  if (stims.length) for (const stim of stims) kit.push(`${stim.name} (${stim.rules})`)
  else if (cr.potion) kit.push(cr.potion === 'health' ? 'Minor Health Potion (clear 1d4 Hit Points)' : 'Minor Stamina Potion (clear 1d4 Stress)')
  for (const id of cr.consumables ?? []) {
    const c = setup.consumables.find((x) => x.id === id)
    if (c) kit.push(`${c.name} (${CONSUMABLE_LABEL[c.type] ?? c.type} ${c.number}: ${c.rules})`)
  }
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

  const installed = installedAugments(setup, cr)
  const armorScoreBonus = installed.reduce((n, a) => n + (a.armorScore ?? 0), 0)
  const evasionBonus = installed.reduce((n, a) => n + (a.evasion ?? 0), 0)

  return {
    level: ch.level,
    tier,
    evasion: (cls?.startingEvasion ?? 0) + evasionBonus,
    hitPoints: cls?.startingHitPoints ?? 0,
    stress: STARTING_STRESS,
    hope: STARTING_HOPE,
    proficiency: STARTING_PROFICIENCY,
    majorThreshold: armor ? (armor.majorThreshold as number) + ch.level : 0,
    severeThreshold: armor ? (armor.severeThreshold as number) + ch.level : 0,
    armorScore: (armor ? (armor.armorScore as number) : 0) + armorScoreBonus,
    currency,
    kit,
    downtimeMoves: downtimeMoves(setup),
    trackers,
  }
}

/** Hands a weapon needs: two-handed 2, one-handed 1, anything else (e.g. Battleglove's "no-hands") 0. */
export const weaponLoad = (w: object): number => ((w as { burden?: unknown }).burden === 'two-handed' ? 2 : (w as { burden?: unknown }).burden === 'one-handed' ? 1 : 0)

/** Hands available for weapons: 2, or 4 with an ancestry feature like Kasatha Four-armed. */
export const handsAvailable = (ch: Character, setup: CreationSetup): number => 2 * secondarySlots(ch, setup)

/** How many secondary weapons the character may wield: 1, or 2 with an ancestry feature like Kasatha Four-armed. */
export function secondarySlots(ch: Character, setup: CreationSetup): number {
  return ancestryFeatures(ch, setup).some((f: any) => f.extraSecondaryWeapon) ? 2 : 1
}

/** Ancestries offered at creation: the supplement's first-listed ones in its order, then the rest alphabetically, minus hidden ones. */
export function ancestryList(setup: CreationSetup): any[] {
  const active = new Set([setup.frame?.id, ...setup.supplements.map((s) => s.id)])
  const all = ([...setup.registry.ancestries.values()] as any[]).filter((a) => !a.onlyWith || active.has(a.onlyWith))
  const first = setup.ancestryFirst.map((id) => all.find((a) => a.id === id)).filter(Boolean)
  if (setup.starheartOnly && first.length) return first
  const rest = all.filter((a) => !setup.ancestryFirst.includes(a.id) && !setup.ancestryHidden.includes(a.id)).sort((a, b) => String(a.name).localeCompare(String(b.name)))
  return [...first, ...rest]
}

/** Communities offered at creation: the supplement's first-listed ones in its order, then the rest alphabetically. */
export function communityList(setup: CreationSetup): any[] {
  const active = new Set([setup.frame?.id, ...setup.supplements.map((s) => s.id)])
  const all = ([...setup.registry.communities.values()] as any[]).filter((c) => !c.onlyWith || active.has(c.onlyWith))
  const first = setup.communityFirst.map((id) => all.find((c) => c.id === id)).filter(Boolean)
  if (setup.starheartOnly && first.length) return first
  const rest = all.filter((c) => !setup.communityFirst.includes(c.id)).sort((a, b) => String(a.name).localeCompare(String(b.name)))
  return [...first, ...rest]
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
