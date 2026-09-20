export const CHARACTER_SCHEMA_VERSION = 1

export const TRAITS = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'] as const
export type Trait = (typeof TRAITS)[number]

/** Everything is a reference by id into the loaded source packs; no book content is stored here. */
export interface Character {
  schemaVersion: number
  id: string
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
    levelUpChoices: Record<string, string[]>
  }
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
    name: '',
    createdAt: now,
    updatedAt: now,
    level: 1,
    sources: { enabledPacks: [], campaignFrameId: null },
    choices: {
      classId: null, subclassId: null, ancestryId: null, communityId: null,
      domainCardIds: [], equipmentIds: [], levelUpChoices: {},
    },
    traits: {},
    creation: newCreation(),
    notes: '',
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStrArr = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isStrOrNull = (v: unknown) => v === null || typeof v === 'string'

/** Validates untrusted data (import file, stored record). Throws CharacterError listing problems. */
export function validateCharacter(data: unknown): Character {
  const errs: string[] = []
  if (!isObj(data)) throw new CharacterError('Character must be an object')
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
    if (!isObj(c.levelUpChoices) || !Object.values(c.levelUpChoices).every(isStrArr)) {
      errs.push('choices.levelUpChoices must map level to string arrays')
    }
  }
  if (!isObj(data.traits) || !Object.entries(data.traits).every(([k, v]) => (TRAITS as readonly string[]).includes(k) && Number.isInteger(v))) {
    errs.push('traits must map trait names to integers')
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
