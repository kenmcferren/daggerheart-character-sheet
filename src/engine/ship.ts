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
  keywords?: { name: string; rules: string }[]
  rulesSections?: { title: string; text: string }[]
  cards: ShipCard[]
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
  if (errs.length) throw new ShipError(`Invalid ship: ${errs.join('; ')}`)
  return input as unknown as Ship
}

export const shipCard = (rules: ShipRules, id: string) => rules.cards.find((c) => c.id === id)
export const shipConfiguration = (rules: ShipRules, s: Ship) => rules.configurations.find((c) => c.id === s.choices.configurationId)
export const shipFrame = (rules: ShipRules, s: Ship) => rules.frames.find((f) => f.id === s.choices.frameId)
const cardsOf = (rules: ShipRules, s: Ship) => s.choices.cardIds.map((id) => shipCard(rules, id)).filter((c): c is ShipCard => !!c)

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
  for (const c of cardsOf(rules, s)) if (c.grants?.hp) hp[c.grants.hp]++
  return hp
}

/** Final HP per system (including Free HP). */
export function hullPoints(rules: ShipRules, s: Ship): PerSystem {
  const hp = hullBeforeFree(rules, s)
  for (const y of SYSTEMS) hp[y] += s.choices.freeHp[y]
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
  const cards = cardsOf(rules, s)
  const hp = hullPoints(rules, s)
  const arch = archetypeOf(rules, s)
  const size = rules.sizes.find((z) => z.size === s.size)
  return {
    sizeName: size ? size.name : `Size ${s.size}`,
    hp,
    totalHp: SYSTEMS.reduce((a, y) => a + hp[y], 0),
    stress: (fr?.stress ?? 0) + cards.reduce((a, c) => a + (c.grants?.stress ?? 0), 0),
    evasion: fr?.evasion ?? null,
    thresholds: fr ? fr.thresholds : null,
    tokenTrackers: (['analysis', 'power'] as const).filter((t) => cards.some((c) => c.tokens?.includes(t)) || !!arch?.tokens?.includes(t)).map((token) => ({ token, max: rules.tokenCaps[token] })),
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
  if (!s.name.trim()) p('name', 'Name your ship.')
  return out
}

/** Export file format: pretty JSON, diffable. */
export const exportShip = (s: Ship) => JSON.stringify(s, null, 2)
