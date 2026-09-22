import { validateCharacter, type Character } from './character'

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
