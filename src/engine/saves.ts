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
}
