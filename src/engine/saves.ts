import { validateCharacter, CharacterError, type Character } from './character'
import { validateShip, type Ship } from './ship'

/** Minimal async key-value contract; idb-keyval in the browser, a Map in tests. */
export interface KeyValueStore {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  del(key: string): Promise<void>
  keys(): Promise<string[]>
}

const PREFIX = 'character:'

export class CharacterStore {
  private kv: KeyValueStore
  private now: () => string

  constructor(kv: KeyValueStore, now: () => string = () => new Date().toISOString()) {
    this.kv = kv
    this.now = now
  }

  /** Validates, stamps updatedAt, stores. Returns the stored record. */
  async save(c: Character): Promise<Character> {
    const rec = validateCharacter({ ...c, updatedAt: this.now() })
    await this.kv.set(PREFIX + rec.id, rec)
    return rec
  }

  async load(id: string): Promise<Character | null> {
    const raw = await this.kv.get(PREFIX + id)
    return raw === undefined ? null : validateCharacter(raw)
  }

  async remove(id: string): Promise<void> {
    await this.kv.del(PREFIX + id)
  }

  /** Newest first. Corrupt records are skipped and reported, not fatal. */
  async list(): Promise<{ characters: Character[]; corruptIds: string[] }> {
    const characters: Character[] = []
    const corruptIds: string[] = []
    for (const key of (await this.kv.keys()).filter((k) => k.startsWith(PREFIX))) {
      try {
        characters.push(validateCharacter(await this.kv.get(key)))
      } catch {
        corruptIds.push(key.slice(PREFIX.length))
      }
    }
    characters.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return { characters, corruptIds }
  }

  /** Every saved version of one character, lowest level first (ties: oldest first). */
  async versionsOf(lineageId: string): Promise<Character[]> {
    const { characters } = await this.list()
    return characters.filter((c) => c.lineageId === lineageId).sort((a, b) => a.level - b.level || a.createdAt.localeCompare(b.createdAt))
  }

  /** One entry per character: its most recently saved version, plus how many versions exist. Newest first. */
  async lineages(): Promise<{ latest: Character; versionCount: number }[]> {
    const { characters } = await this.list()
    const by = new Map<string, Character[]>()
    for (const c of characters) by.set(c.lineageId, [...(by.get(c.lineageId) ?? []), c])
    return [...by.values()].map((vs) => ({ latest: vs[0], versionCount: vs.length }))
  }

  /** Deletes every version of a character. */
  async removeLineage(lineageId: string): Promise<void> {
    for (const v of await this.versionsOf(lineageId)) await this.remove(v.id)
  }
}

const SHIP_PREFIX = 'ship:'

/** Ship saves (Series 14) share the key-value store with characters under their own key prefix, so neither list sees the other. */
export class ShipStore {
  private kv: KeyValueStore
  private now: () => string

  constructor(kv: KeyValueStore, now: () => string = () => new Date().toISOString()) {
    this.kv = kv
    this.now = now
  }

  async save(s: Ship): Promise<Ship> {
    const rec = validateShip({ ...s, updatedAt: this.now() })
    await this.kv.set(SHIP_PREFIX + rec.id, rec)
    return rec
  }

  async load(id: string): Promise<Ship | null> {
    const raw = await this.kv.get(SHIP_PREFIX + id)
    return raw === undefined ? null : validateShip(raw)
  }

  async remove(id: string): Promise<void> {
    await this.kv.del(SHIP_PREFIX + id)
  }

  /** Newest first. Corrupt records are skipped and reported, not fatal. */
  async list(): Promise<{ ships: Ship[]; corruptIds: string[] }> {
    const ships: Ship[] = []
    const corruptIds: string[] = []
    for (const key of (await this.kv.keys()).filter((k) => k.startsWith(SHIP_PREFIX))) {
      try {
        ships.push(validateShip(await this.kv.get(key)))
      } catch {
        corruptIds.push(key.slice(SHIP_PREFIX.length))
      }
    }
    ships.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return { ships, corruptIds }
  }

  /** Ships linked to a character (by lineage, so every level of the character keeps its ship). */
  async forCharacter(characterLineageId: string): Promise<Ship[]> {
    return (await this.list()).ships.filter((s) => s.characterLineageId === characterLineageId)
  }

  /** Links a ship to a character (or unlinks it with null) and saves it. */
  async link(shipId: string, characterLineageId: string | null): Promise<Ship> {
    const s = await this.load(shipId)
    if (!s) throw new Error(`No ship "${shipId}"`)
    return this.save({ ...s, characterLineageId })
  }

  /** When a character is deleted its ships stay, unlinked. Returns how many were unlinked. */
  async unlinkCharacter(characterLineageId: string): Promise<number> {
    const linked = await this.forCharacter(characterLineageId)
    for (const s of linked) await this.save({ ...s, characterLineageId: null })
    return linked.length
  }
}

/** Reads an export file of either kind; ships carry kind: 'ship'. */
export function importSaveFile(text: string): { kind: 'character'; character: Character } | { kind: 'ship'; ship: Ship } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new CharacterError('File is not valid JSON')
  }
  if (typeof data === 'object' && data !== null && (data as { kind?: unknown }).kind === 'ship') return { kind: 'ship', ship: validateShip(data) }
  return { kind: 'character', character: validateCharacter(data) }
}
