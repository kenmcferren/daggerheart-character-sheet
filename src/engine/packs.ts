import Ajv from 'ajv'
import schema from '../../schema/source-pack.schema.json'

export const CONTENT_KINDS = [
  'classes', 'subclasses', 'ancestries', 'communities', 'domains',
  'domainCards', 'equipment', 'campaignFrames', 'levelUpOptions',
] as const
export type ContentKind = (typeof CONTENT_KINDS)[number]

export interface Entry { id: string; name: string; description?: string; [field: string]: unknown }

export interface SourcePack {
  schemaVersion: 1
  id: string
  name: string
  version: string
  publisher: string
  extends?: string[]
  content?: Partial<Record<ContentKind, Entry[]>>
  overrides?: Partial<Record<ContentKind, Record<string, Record<string, unknown>>>>
}

export type Registry = Record<ContentKind, Map<string, Entry & { sourcePack: string }>>

export class PackError extends Error {}

const check = new Ajv({ allErrors: true }).compile(schema)

/** Validates untrusted JSON; returns the typed pack or throws PackError listing every problem. */
export function validatePack(data: unknown): SourcePack {
  if (!check(data)) {
    const msgs = (check.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`)
    throw new PackError(`Invalid source pack: ${msgs.join('; ')}`)
  }
  return data as unknown as SourcePack
}

/**
 * Loads packs into one registry. `extends` must name packs in the same set and are
 * applied first. Duplicate ids within a kind are an error; overrides patch existing entries.
 */
export function loadPacks(raw: unknown[]): Registry {
  const packs = raw.map(validatePack)
  const byId = new Map<string, SourcePack>()
  for (const p of packs) {
    if (byId.has(p.id)) throw new PackError(`Duplicate pack id "${p.id}"`)
    byId.set(p.id, p)
  }

  const ordered: SourcePack[] = []
  const state = new Map<string, 'visiting' | 'done'>()
  const visit = (p: SourcePack) => {
    if (state.get(p.id) === 'done') return
    if (state.get(p.id) === 'visiting') throw new PackError(`Circular extends at "${p.id}"`)
    state.set(p.id, 'visiting')
    for (const dep of p.extends ?? []) {
      const d = byId.get(dep)
      if (!d) throw new PackError(`Pack "${p.id}" extends missing pack "${dep}"`)
      visit(d)
    }
    state.set(p.id, 'done')
    ordered.push(p)
  }
  packs.forEach(visit)

  const reg = Object.fromEntries(CONTENT_KINDS.map((k) => [k, new Map()])) as Registry
  for (const p of ordered) {
    for (const kind of CONTENT_KINDS) {
      for (const e of p.content?.[kind] ?? []) {
        const prior = reg[kind].get(e.id)
        if (prior) {
          throw new PackError(`Duplicate ${kind} id "${e.id}" in pack "${p.id}" (already from "${prior.sourcePack}")`)
        }
        reg[kind].set(e.id, { ...e, sourcePack: p.id })
      }
      for (const [id, patch] of Object.entries(p.overrides?.[kind] ?? {})) {
        const cur = reg[kind].get(id)
        if (!cur) throw new PackError(`Pack "${p.id}" overrides missing ${kind} "${id}"`)
        reg[kind].set(id, { ...cur, ...patch, id, sourcePack: p.id })
      }
    }
  }
  return reg
}
