export const CHARACTER_SCHEMA_VERSION = 2

export const TRAITS = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'] as const
export type Trait = (typeof TRAITS)[number]

/** One advancement taken at a level. `option` is a levelUpOptions id; `fromTier` is the tier whose boxes were marked. */
export interface AdvancementRecord {
  option: string
  fromTier: number
  /** traits */
  traits?: Trait[]
  /** experience: indexes into the character's Experiences */
  experienceIndexes?: number[]
  /** domain-card */
  cardId?: string
  /** subclass-upgrade: defaults to the main subclass */
  subclassId?: string
  /** multiclass */
  /** multiclass: which unused upgraded-subclass box (tier) to cross out; this box's tier or the next; default this tier's if unused. */
  crossOutTier?: number
  multiclass?: { classId: string; domainId: string; subclassId: string }
}

/** Everything chosen when reaching one level. The character's history is the source of truth for anything gained after level 1. */
export interface LevelRecord {
  level: number
  /** Required at levels 2, 5 and 8 (tier achievement). */
  newExperience?: string
  advancements: AdvancementRecord[]
  /** The level's new domain card. */
  newCardId: string
  /** Optional exchange: give back a previously acquired card for another of the same level or lower. */
  swap?: { out: string; in: string }
  /** Class-specific: Brawler stance; Ranger companion options. */
  stanceId?: string
  /** A multiclass into Brawler / Martial Artist: the two Tier 1 stances taken with the subclass foundation. */
  startStanceIds?: string[]
  /** A multiclass into Ranger / Beastbound: the companion sheet taken with the subclass foundation. */
  newCompanion?: { name: string; experiences: string[]; attack: string; damageType: 'physical' | 'magic' | null }
  companionOptionIds?: string[]
  /** Ranger Intelligent: index of the companion Experience that gets +1. */
  companionExperience?: number
  /** Ranger Vicious: raise the companion's damage die or its range by one step. */
  viciousChoice?: 'die' | 'range'
}

/** Everything is a reference by id into the loaded source packs; no book content is stored here. */
export interface Character {
  schemaVersion: number
  /** Id of this saved version (snapshot). Unique per version; see lineageId. */
  id: string
  /** Shared by every version of one character. */
  lineageId: string
  /** The version this one was leveled up from; null for the first version. */
  parentId: string | null
  name: string
  createdAt: string
  updatedAt: string
  level: number
  sources: { enabledPacks: string[]; campaignFrameId: string | null; supplementIds?: string[] }
  choices: {
    classId: string | null
    subclassId: string | null
    ancestryId: string | null
    communityId: string | null
    domainCardIds: string[]
    equipmentIds: string[]
  }
  /** One record per level gained after level 1, in order. */
  history: LevelRecord[]
  traits: Partial<Record<Trait, number>>
  /** Wizard answers that are not plain pack-entry ids. Optional so older saves still load; see creationOf(). */
  creation?: Creation
  notes: string
}

export interface Creation {
  pronouns: string
  description: string
  /** [first feature's ancestry, second feature's ancestry]; null = one ancestry (choices.ancestryId). */
  mixedAncestry: { first: string; second: string } | null
  potion: 'health' | 'stamina' | null
  classItem: string
  backgroundAnswers: string[]
  experiences: string[]
  connections: string[]
  /** Frame-defined choices by choice id: builder fields or free text. */
  frameChoices: Record<string, Record<string, string> | string>
  companion: { name: string; experiences: string[]; attack: string; damageType: 'physical' | 'magic' | null } | null
  stanceIds: string[]
}

export function newCreation(): Creation {
  return {
    pronouns: '', description: '', mixedAncestry: null, potion: null, classItem: '',
    backgroundAnswers: [], experiences: [], connections: [], frameChoices: {}, companion: null, stanceIds: [],
  }
}

/** The creation block with defaults filled in (older saves may lack it). */
export const creationOf = (c: Character): Creation => ({ ...newCreation(), ...c.creation })

export class CharacterError extends Error {}

export function newCharacter(id: string, now = new Date().toISOString()): Character {
  return {
    schemaVersion: CHARACTER_SCHEMA_VERSION,
    id,
    lineageId: id,
    parentId: null,
    name: '',
    createdAt: now,
    updatedAt: now,
    level: 1,
    sources: { enabledPacks: [], campaignFrameId: null },
    choices: {
      classId: null, subclassId: null, ancestryId: null, communityId: null,
      domainCardIds: [], equipmentIds: [],
    },
    history: [],
    traits: {},
    creation: newCreation(),
    notes: '',
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStrArr = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isStrOrNull = (v: unknown) => v === null || typeof v === 'string'

/** Version 1 saves are level 1 with no history; the unused levelUpChoices field is dropped. */
function migrateV1(d: Record<string, unknown>): Record<string, unknown> {
  const choices = isObj(d.choices) ? { ...d.choices } : d.choices
  if (isObj(choices)) delete choices.levelUpChoices
  return { ...d, schemaVersion: 2, choices, lineageId: d.id, parentId: null, history: [] }
}

/** Validates untrusted data (import file, stored record). Throws CharacterError listing problems. */
export function validateCharacter(input: unknown): Character {
  const errs: string[] = []
  if (!isObj(input)) throw new CharacterError('Character must be an object')
  let data: Record<string, unknown> = input
  if (data.schemaVersion === 1) data = migrateV1(data)
  if (data.schemaVersion !== CHARACTER_SCHEMA_VERSION) {
    throw new CharacterError(`Unsupported character schemaVersion ${String(data.schemaVersion)}`)
  }
  for (const k of ['id', 'name', 'createdAt', 'updatedAt', 'notes'] as const) {
    if (typeof data[k] !== 'string') errs.push(`${k} must be a string`)
  }
  if (typeof data.id === 'string' && !data.id) errs.push('id must not be empty')
  if (!Number.isInteger(data.level) || (data.level as number) < 1 || (data.level as number) > 10) {
    errs.push('level must be an integer 1-10')
  }
  const s = data.sources
  if (!isObj(s) || !isStrArr(s.enabledPacks) || !isStrOrNull(s.campaignFrameId) || (s.supplementIds !== undefined && !isStrArr(s.supplementIds))) errs.push('sources is malformed')
  const c = data.choices
  if (!isObj(c)) errs.push('choices must be an object')
  else {
    for (const k of ['classId', 'subclassId', 'ancestryId', 'communityId']) {
      if (!isStrOrNull(c[k])) errs.push(`choices.${k} must be a string or null`)
    }
    for (const k of ['domainCardIds', 'equipmentIds']) {
      if (!isStrArr(c[k])) errs.push(`choices.${k} must be a string array`)
    }
  }
  if (!isObj(data.traits) || !Object.entries(data.traits).every(([k, v]) => (TRAITS as readonly string[]).includes(k) && Number.isInteger(v))) {
    errs.push('traits must map trait names to integers')
  }
  if (typeof data.lineageId !== 'string' || !data.lineageId) errs.push('lineageId must be a non-empty string')
  if (!isStrOrNull(data.parentId)) errs.push('parentId must be a string or null')
  if (!Array.isArray(data.history) || !data.history.every((r) => isObj(r) && Number.isInteger(r.level) && Array.isArray(r.advancements) && typeof r.newCardId === 'string')) {
    errs.push('history must be a list of level records')
  } else if (Number.isInteger(data.level) && data.history.length !== (data.level as number) - 1) {
    errs.push('history must have one record per level after 1')
  }
  const cr = data.creation
  if (cr !== undefined && !isObj(cr)) errs.push('creation must be an object')
  if (errs.length) throw new CharacterError(`Invalid character: ${errs.join('; ')}`)
  return data as unknown as Character
}

/** Export file format: pretty JSON, diffable. */
export function exportCharacter(c: Character): string {
  return JSON.stringify(c, null, 2)
}

export function importCharacter(text: string): Character {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new CharacterError('File is not valid JSON')
  }
  return validateCharacter(data)
}
