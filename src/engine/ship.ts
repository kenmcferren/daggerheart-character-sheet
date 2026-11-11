import type { Registry } from './packs'
import { TRAITS, type Trait } from './character'

/** Starheart ships (Series 14). Rules come from the `ships` field of the Starheart Ships supplement; saves store ids only. */
export const SHIP_SCHEMA_VERSION = 1
export const SHIP_FRAME_ID = 'starheart-ships'
export const SYSTEMS = ['transport', 'weapons', 'science', 'engineering'] as const
export type System = (typeof SYSTEMS)[number]
export type PerSystem = Record<System, number>

export interface ShipCard {
  id: string; name: string; system: System; domain: string; rules: string
  grants?: { stress?: number; hp?: System }
  reloadTokens?: number
  cardTokens?: { name: string; max: number }
  usesPer?: 'refuel' | 'scene'
  tokens?: ('analysis' | 'power')[]
}
/** A ship's archetype (Series 15): the pair of domains it holds gives a name and features, like a pseudo-class. */
export interface ShipArchetype { id: string; name: string; domains: [string, string]; features: string[]; tokens?: ('analysis' | 'power')[] }
/** Ship advancement (Series 16): taken only at a refit; each take checks one box of its option. */
export interface AdvancementGain { hp?: number; stress?: number; evasion?: number; thresholds?: [number, number] }
export interface AdvancementOption {
  id: string; name: string; boxes?: number; boxesFromSize?: boolean; gains?: AdvancementGain[]; alternatesWith?: string; compartment?: boolean
}
export interface ShipCompartment { id: string; name: string; rules: string; rollsOn?: string; spareSuits?: { count: number; slots: number } }
export interface AdvancementRules {
  vault: { base: number; boxesPerExtraSlot: number }
  options: AdvancementOption[]
  compartments: ShipCompartment[]
}
export interface ShipRules {
  sizes: { size: number; name: string; short?: string }[]
  startingSizes: { flier: number; hub: number }
  systems: { id: System; name: string; covers?: string }[]
  configurations: { id: string; name: string; caps: PerSystem }[]
  frames: { id: string; name: string; freeHp: number; stress: number; evasion: number; thresholds: [number, number] }[]
  build: { domains: number; cards: number; primaryCap: number; baseHp: number; hpPerCard: number; maxHpPerSystem: number }
  tokenCaps: { analysis: number; power: number }
  domains: { id: string; name: string; focus?: string; description: string }[]
  archetypes?: ShipArchetype[]
  advancement?: AdvancementRules
  keywords?: { name: string; rules: string }[]
  rulesSections?: { title: string; text: string }[]
  cards: ShipCard[]
}

/** One checked advancement box. `gain` indexes the option's `gains` (which way it was taken); `system` is where a Hull Point went; `compartmentId` is the compartment added. */
export interface AdvancementTake { optionId: string; gain?: number; system?: System; compartmentId?: string }
/** Vault and advancement. Absent on ships saved before Series 16: read it with advancementOf(). */
export interface ShipAdvancement {
  /** Cards gained but not in the 7-card loadout. Their While Available effects are always on. Swapped with the loadout only at a refit. */
  vaultCardIds: string[]
  taken: AdvancementTake[]
}

/** 'flier': a character's own Solo Flier. 'hub': the party's shared Hub Ship. */
export type ShipRole = 'flier' | 'hub'

export interface Ship {
  /** Marker that tells a ship save or export file from a character. */
  kind: 'ship'
  schemaVersion: number
  id: string
  /** Shared by every saved version of one ship (for later ship advancement). */
  lineageId: string
  parentId: string | null
  name: string
  createdAt: string
  updatedAt: string
  role: ShipRole
  size: number
  /** Linked character (lineage id): the ship's owner and default pilot, whose traits print on the ship page. Null = no link (a Hub Ship opened on its own). */
  characterLineageId: string | null
  sources: { enabledPacks: string[]; supplementIds: string[] }
  choices: {
    configurationId: string | null
    primaryTrait: Trait | null
    secondaryTrait: Trait | null
    frameId: string | null
    domainIds: string[]
    cardIds: string[]
    /** Free HP placed in each system. */
    freeHp: PerSystem
  }
  advancement?: ShipAdvancement
  description: string
  notes: string
}

export class ShipError extends Error {}

const zero = (): PerSystem => ({ transport: 0, weapons: 0, science: 0, engineering: 0 })

export function newShip(id: string, role: ShipRole, rules: ShipRules, now = new Date().toISOString()): Ship {
  return {
    kind: 'ship', schemaVersion: SHIP_SCHEMA_VERSION, id, lineageId: id, parentId: null, name: '', createdAt: now, updatedAt: now,
    role, size: rules.startingSizes[role], characterLineageId: null,
    sources: { enabledPacks: [], supplementIds: [SHIP_FRAME_ID] },
    choices: { configurationId: null, primaryTrait: null, secondaryTrait: null, frameId: null, domainIds: [], cardIds: [], freeHp: zero() },
    description: '', notes: '',
  }
}

/** The ship rules from a loaded registry, or null when no loaded supplement carries them. */
export function shipRulesFrom(reg: Registry): ShipRules | null {
  const f = reg.campaignFrames.get(SHIP_FRAME_ID) ?? [...reg.campaignFrames.values()].find((e) => e.ships)
  return (f?.ships as ShipRules | undefined) ?? null
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStrArr = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isStrOrNull = (v: unknown) => v === null || typeof v === 'string'

/** Shape check for untrusted data (stored record, import file). Rules checks are in shipProblems(). */
export function validateShip(input: unknown): Ship {
  if (!isObj(input) || input.kind !== 'ship') throw new ShipError('Not a ship save')
  if (input.schemaVersion !== SHIP_SCHEMA_VERSION) throw new ShipError(`Unsupported ship schemaVersion ${String(input.schemaVersion)}`)
  const errs: string[] = []
  for (const k of ['id', 'lineageId', 'name', 'createdAt', 'updatedAt', 'description', 'notes']) if (typeof input[k] !== 'string') errs.push(`${k} must be a string`)
  if (input.id === '' || input.lineageId === '') errs.push('id and lineageId must not be empty')
  if (!isStrOrNull(input.parentId)) errs.push('parentId must be a string or null')
  if (!isStrOrNull(input.characterLineageId)) errs.push('characterLineageId must be a string or null')
  if (input.role !== 'flier' && input.role !== 'hub') errs.push('role must be flier or hub')
  if (!Number.isInteger(input.size) || (input.size as number) < 1) errs.push('size must be a positive integer')
  const s = input.sources
  if (!isObj(s) || !isStrArr(s.enabledPacks) || !isStrArr(s.supplementIds)) errs.push('sources is malformed')
  const c = input.choices
  if (!isObj(c)) errs.push('choices must be an object')
  else {
    for (const k of ['configurationId', 'frameId']) if (!isStrOrNull(c[k])) errs.push(`choices.${k} must be a string or null`)
    for (const k of ['primaryTrait', 'secondaryTrait']) if (c[k] !== null && !(TRAITS as readonly unknown[]).includes(c[k])) errs.push(`choices.${k} must be a trait or null`)
    for (const k of ['domainIds', 'cardIds']) if (!isStrArr(c[k])) errs.push(`choices.${k} must be a string array`)
    const hp = c.freeHp
    if (!isObj(hp) || !SYSTEMS.every((y) => Number.isInteger(hp[y]) && (hp[y] as number) >= 0)) errs.push('choices.freeHp must give a whole number for each system')
  }
  if (input.advancement !== undefined) {
    const a = input.advancement
    if (!isObj(a) || !isStrArr(a.vaultCardIds) || !Array.isArray(a.taken)) errs.push('advancement is malformed')
    else for (const t of a.taken) {
      if (!isObj(t) || typeof t.optionId !== 'string' || (t.gain !== undefined && !Number.isInteger(t.gain)) || (t.system !== undefined && !(SYSTEMS as readonly unknown[]).includes(t.system)) || (t.compartmentId !== undefined && typeof t.compartmentId !== 'string')) { errs.push('advancement.taken is malformed'); break }
    }
  }
  if (errs.length) throw new ShipError(`Invalid ship: ${errs.join('; ')}`)
  return input as unknown as Ship
}

export const shipCard = (rules: ShipRules, id: string) => rules.cards.find((c) => c.id === id)
export const shipConfiguration = (rules: ShipRules, s: Ship) => rules.configurations.find((c) => c.id === s.choices.configurationId)
export const shipFrame = (rules: ShipRules, s: Ship) => rules.frames.find((f) => f.id === s.choices.frameId)
const cardsOf = (rules: ShipRules, s: Ship) => s.choices.cardIds.map((id) => shipCard(rules, id)).filter((c): c is ShipCard => !!c)
const vaultOf = (rules: ShipRules, s: Ship) => advancementOf(s).vaultCardIds.map((id) => shipCard(rules, id)).filter((c): c is ShipCard => !!c)

export const advancementOf = (s: Ship): ShipAdvancement => s.advancement ?? { vaultCardIds: [], taken: [] }
export const advancementOption = (rules: ShipRules, id: string) => rules.advancement?.options.find((o) => o.id === id)

/** Boxes an option has on this ship: fixed, or the ship's size for compartments. */
export const optionBoxes = (s: Ship, o: AdvancementOption) => (o.boxesFromSize ? s.size : (o.boxes ?? 0))
/** Boxes of one option already checked. */
export const boxesChecked = (s: Ship, optionId: string) => advancementOf(s).taken.filter((t) => t.optionId === optionId).length
/** Every checked box, all options. */
export const totalChecked = (s: Ship) => advancementOf(s).taken.length

/** Vault slots: the loadout holds 7 cards and each two checked boxes add one more card, which sits in the vault (rounded down). */
export function vaultCapacity(rules: ShipRules, s: Ship): number {
  const v = rules.advancement?.vault
  return v ? v.base + Math.floor(totalChecked(s) / v.boxesPerExtraSlot) : 0
}

/** Compartments the ship has, in the order added. */
export function compartmentsOf(rules: ShipRules, s: Ship): ShipCompartment[] {
  const all = rules.advancement?.compartments ?? []
  return advancementOf(s).taken.flatMap((t) => (t.compartmentId ? all.filter((c) => c.id === t.compartmentId) : []))
}

/** Total gains from checked boxes. A Hull Point's system is in `hpPerSystem`. */
export function advancementBonuses(rules: ShipRules, s: Ship) {
  const out = { hpPerSystem: zero(), stress: 0, evasion: 0, thresholds: [0, 0] as [number, number] }
  for (const t of advancementOf(s).taken) {
    const g = advancementOption(rules, t.optionId)?.gains?.[t.gain ?? 0]
    if (!g) continue
    if (g.hp && t.system) out.hpPerSystem[t.system] += g.hp
    out.stress += g.stress ?? 0
    out.evasion += g.evasion ?? 0
    if (g.thresholds) { out.thresholds[0] += g.thresholds[0]; out.thresholds[1] += g.thresholds[1] }
  }
  return out
}

/** The threshold option the next threshold advancement must be: +1/+2 and +1/+1 take turns, starting with the first listed. */
export function nextThresholdOption(rules: ShipRules, s: Ship): string | null {
  const opts = (rules.advancement?.options ?? []).filter((o) => o.alternatesWith)
  if (opts.length !== 2) return null
  const n = advancementOf(s).taken.filter((t) => opts.some((o) => o.id === t.optionId)).length
  return opts[n % 2].id
}

export type TakeResult = { ok: true; ship: Ship } | { ok: false; reason: string }

/** Checks one box of an option (refit only; the caller is the Refit screen). Returns a new ship, or why it can't be taken. */
export function takeAdvancement(rules: ShipRules, s: Ship, take: AdvancementTake): TakeResult {
  const o = advancementOption(rules, take.optionId)
  if (!o) return { ok: false, reason: 'Unknown advancement.' }
  if (boxesChecked(s, o.id) >= optionBoxes(s, o)) return { ok: false, reason: `All ${o.name} boxes are checked.` }
  if (o.alternatesWith && nextThresholdOption(rules, s) !== o.id) return { ok: false, reason: 'Threshold gains take turns: +1/+2, then +1/+1.' }
  const t: AdvancementTake = { optionId: o.id }
  if (o.gains?.length) {
    const gain = take.gain ?? 0
    const g = o.gains[gain]
    if (!g) return { ok: false, reason: 'Choose how to take this advancement.' }
    t.gain = gain
    if (g.hp) {
      if (!take.system) return { ok: false, reason: 'Choose which system gets the Hull Point.' }
      t.system = take.system
    }
  }
  if (o.compartment) {
    const known = rules.advancement?.compartments.some((c) => c.id === take.compartmentId)
    if (!take.compartmentId || !known) return { ok: false, reason: 'Choose a compartment.' }
    if (compartmentsOf(rules, s).some((c) => c.id === take.compartmentId)) return { ok: false, reason: 'The ship already has that compartment.' }
    t.compartmentId = take.compartmentId
  }
  const a = advancementOf(s)
  return { ok: true, ship: { ...s, advancement: { ...a, taken: [...a.taken, t] } } }
}

/** Gains a card into the vault. Returns why not when the vault is full or the card is not allowed. */
export function addToVault(rules: ShipRules, s: Ship, cardId: string): TakeResult {
  const c = shipCard(rules, cardId)
  const a = advancementOf(s)
  if (!c) return { ok: false, reason: 'Unknown card.' }
  if (!s.choices.domainIds.includes(c.domain)) return { ok: false, reason: `${c.name} is not from your domains.` }
  if (s.choices.cardIds.includes(cardId) || a.vaultCardIds.includes(cardId)) return { ok: false, reason: `${c.name} is already on the ship.` }
  if (a.vaultCardIds.length >= vaultCapacity(rules, s)) return { ok: false, reason: 'The vault is full.' }
  return { ok: true, ship: { ...s, advancement: { ...a, vaultCardIds: [...a.vaultCardIds, cardId] } } }
}

/** Refit swap: a loadout card trades places with a vaulted card. Card caps per system are checked by shipProblems(). */
export function swapLoadoutVault(s: Ship, loadoutCardId: string, vaultCardId: string): Ship {
  const a = advancementOf(s)
  if (!s.choices.cardIds.includes(loadoutCardId) || !a.vaultCardIds.includes(vaultCardId)) return s
  return {
    ...s,
    choices: { ...s.choices, cardIds: s.choices.cardIds.map((id) => (id === loadoutCardId ? vaultCardId : id)) },
    advancement: { ...a, vaultCardIds: a.vaultCardIds.map((id) => (id === vaultCardId ? loadoutCardId : id)) },
  }
}

/** Refit frame change: earned advancements stay and stack on the new frame. Configuration and domains cannot change here. */
export const changeFrame = (s: Ship, frameId: string): Ship => ({ ...s, choices: { ...s.choices, frameId } })

/** Systems whose card cap is the primary cap (two per configuration); empty until a configuration is chosen. */
export function primarySystems(rules: ShipRules, s: Ship): System[] {
  const cfg = shipConfiguration(rules, s)
  return cfg ? SYSTEMS.filter((y) => cfg.caps[y] === rules.build.primaryCap) : []
}

/** The pilot trait each system rolls with: Primary Trait for primary systems, Secondary Trait for the rest. */
export function systemTrait(rules: ShipRules, s: Ship, y: System): Trait | null {
  if (!shipConfiguration(rules, s)) return null
  return primarySystems(rules, s).includes(y) ? s.choices.primaryTrait : s.choices.secondaryTrait
}

/** Cards chosen in each system. */
export function cardsPerSystem(rules: ShipRules, s: Ship): PerSystem {
  const n = zero()
  for (const c of cardsOf(rules, s)) n[c.system]++
  return n
}

/** HP per system before Free HP: base, plus one per card, plus While Available grants. */
export function hullBeforeFree(rules: ShipRules, s: Ship): PerSystem {
  const n = cardsPerSystem(rules, s)
  const hp = zero()
  for (const y of SYSTEMS) hp[y] = rules.build.baseHp + n[y] * rules.build.hpPerCard
  for (const c of [...cardsOf(rules, s), ...vaultOf(rules, s)]) if (c.grants?.hp) hp[c.grants.hp]++
  return hp
}

/** Final HP per system (including Free HP). */
export function hullPoints(rules: ShipRules, s: Ship): PerSystem {
  const hp = hullBeforeFree(rules, s)
  const adv = advancementBonuses(rules, s).hpPerSystem
  for (const y of SYSTEMS) hp[y] += s.choices.freeHp[y] + adv[y]
  return hp
}

export interface ShipStats {
  sizeName: string
  hp: PerSystem
  totalHp: number
  stress: number
  evasion: number | null
  thresholds: [number, number] | null
  /** Ship-wide token trackers to print (Analysis, Power), each with its cap. */
  tokenTrackers: { token: 'analysis' | 'power'; max: number }[]
}

/** The archetype of the ship's two domains (either order); null until both are chosen. */
export function archetypeOf(rules: ShipRules, s: Ship): ShipArchetype | null {
  const d = s.choices.domainIds
  if (d.length !== 2) return null
  return rules.archetypes?.find((a) => a.domains.includes(d[0]) && a.domains.includes(d[1]) && d[0] !== d[1]) ?? null
}

export function shipStats(rules: ShipRules, s: Ship): ShipStats {
  const fr = shipFrame(rules, s)
  const always = [...cardsOf(rules, s), ...vaultOf(rules, s)]
  const bonus = advancementBonuses(rules, s)
  const hp = hullPoints(rules, s)
  const arch = archetypeOf(rules, s)
  const size = rules.sizes.find((z) => z.size === s.size)
  return {
    sizeName: size ? size.name : `Size ${s.size}`,
    hp,
    totalHp: SYSTEMS.reduce((a, y) => a + hp[y], 0),
    stress: (fr?.stress ?? 0) + bonus.stress + always.reduce((a, c) => a + (c.grants?.stress ?? 0), 0),
    evasion: fr ? fr.evasion + bonus.evasion : null,
    thresholds: fr ? [fr.thresholds[0] + bonus.thresholds[0], fr.thresholds[1] + bonus.thresholds[1]] : null,
    tokenTrackers: (['analysis', 'power'] as const).filter((t) => always.some((c) => c.tokens?.includes(t)) || !!arch?.tokens?.includes(t)).map((token) => ({ token, max: rules.tokenCaps[token] })),
  }
}

/** One roll line per system: "Transport (Agility): +2". `pilotTraits` are the linked character's; without them the value is null. */
export function systemRollLines(rules: ShipRules, s: Ship, pilotTraits?: Partial<Record<Trait, number>>) {
  return SYSTEMS.map((y) => {
    const trait = systemTrait(rules, s, y)
    const value = trait && pilotTraits && Number.isInteger(pilotTraits[trait]) ? (pilotTraits[trait] as number) : null
    const name = rules.systems.find((x) => x.id === y)?.name ?? y
    const label = trait ? `${name} (${trait[0].toUpperCase()}${trait.slice(1)})` : name
    return { system: y, trait, value, text: value === null ? label : `${label}: ${value >= 0 ? '+' : ''}${value}` }
  })
}

export type ShipStep = 'configuration' | 'traits' | 'frame' | 'domains' | 'cards' | 'hull' | 'name'
export interface ShipProblem { step: ShipStep; message: string }

/** Every rule the ship breaks, by creation step; empty = a complete, legal ship. */
export function shipProblems(rules: ShipRules, s: Ship): ShipProblem[] {
  const out: ShipProblem[] = []
  const p = (step: ShipStep, message: string) => out.push({ step, message })
  const cfg = shipConfiguration(rules, s)
  const b = rules.build
  if (!cfg) p('configuration', 'Choose a configuration.')
  const { primaryTrait: pt, secondaryTrait: st } = s.choices
  if (!pt || !st) p('traits', 'Choose a Primary Trait and a Secondary Trait.')
  else if (pt === st) p('traits', 'The Primary and Secondary Traits must be different.')
  const fr = shipFrame(rules, s)
  if (!fr) p('frame', 'Choose a frame.')
  const doms = s.choices.domainIds
  const known = new Set(rules.domains.map((d) => d.id))
  if (doms.length !== b.domains || new Set(doms).size !== doms.length || !doms.every((d) => known.has(d))) p('domains', `Choose ${b.domains} different domains.`)
  const ids = s.choices.cardIds
  if (new Set(ids).size !== ids.length) p('cards', 'A card can only be chosen once.')
  for (const id of ids) {
    const c = shipCard(rules, id)
    if (!c) p('cards', `Unknown card "${id}".`)
    else if (!doms.includes(c.domain)) p('cards', `${c.name} is not from your domains.`)
  }
  if (ids.length !== b.cards) p('cards', `Choose ${b.cards} cards (${ids.length} chosen).`)
  if (cfg) {
    const n = cardsPerSystem(rules, s)
    for (const y of SYSTEMS) if (n[y] > cfg.caps[y]) p('cards', `${rules.systems.find((x) => x.id === y)?.name ?? y} can hold at most ${cfg.caps[y]} cards (${n[y]} chosen).`)
  }
  if (fr) {
    const placed = SYSTEMS.reduce((a, y) => a + s.choices.freeHp[y], 0)
    if (placed !== fr.freeHp) p('hull', `Place ${fr.freeHp} Free HP (${placed} placed).`)
  }
  const hp = hullPoints(rules, s)
  for (const y of SYSTEMS) if (hp[y] > b.maxHpPerSystem) p('hull', `${rules.systems.find((x) => x.id === y)?.name ?? y} has ${hp[y]} HP; the most is ${b.maxHpPerSystem}.`)
  for (const m of advancementProblems(rules, s)) p(m.step, m.message)
  if (!s.name.trim()) p('name', 'Name your ship.')
  return out
}

/** Rules the vault and advancement boxes must keep. Steps are the wizard steps the message belongs under. */
export function advancementProblems(rules: ShipRules, s: Ship): ShipProblem[] {
  const out: ShipProblem[] = []
  const a = advancementOf(s)
  const adv = rules.advancement
  if (!adv) {
    if (a.taken.length || a.vaultCardIds.length) out.push({ step: 'cards', message: 'This ship has advancements but the rules are not loaded.' })
    return out
  }
  const doms = s.choices.domainIds
  if (a.vaultCardIds.length > vaultCapacity(rules, s)) out.push({ step: 'cards', message: `The vault holds at most ${vaultCapacity(rules, s)} cards (${a.vaultCardIds.length} stored).` })
  for (const id of a.vaultCardIds) {
    const c = shipCard(rules, id)
    if (!c) out.push({ step: 'cards', message: `Unknown vault card "${id}".` })
    else if (!doms.includes(c.domain)) out.push({ step: 'cards', message: `${c.name} is not from your domains.` })
    else if (s.choices.cardIds.includes(id)) out.push({ step: 'cards', message: `${c.name} is in both the loadout and the vault.` })
  }
  if (new Set(a.vaultCardIds).size !== a.vaultCardIds.length) out.push({ step: 'cards', message: 'A card can only be in the vault once.' })
  for (const o of adv.options) if (boxesChecked(s, o.id) > optionBoxes(s, o)) out.push({ step: 'hull', message: `${o.name}: more boxes checked than it has.` })
  const seen = new Set<string>()
  for (const t of a.taken) {
    if (!advancementOption(rules, t.optionId)) out.push({ step: 'hull', message: `Unknown advancement "${t.optionId}".` })
    if (t.compartmentId) {
      if (!adv.compartments.some((c) => c.id === t.compartmentId)) out.push({ step: 'hull', message: `Unknown compartment "${t.compartmentId}".` })
      if (seen.has(t.compartmentId)) out.push({ step: 'hull', message: 'A compartment can only be added once.' })
      seen.add(t.compartmentId)
    }
  }
  return out
}

/** Export file format: pretty JSON, diffable. */
export const exportShip = (s: Ship) => JSON.stringify(s, null, 2)
