import { describe, it, expect } from 'vitest'
import {
  newCharacter, validateCharacter, exportCharacter, importCharacter, CharacterError,
} from '../src/engine/character'
import { CharacterStore, type KeyValueStore } from '../src/engine/saves'

function memoryStore(): KeyValueStore & { map: Map<string, unknown> } {
  const map = new Map<string, unknown>()
  return {
    map,
    get: async (k) => map.get(k),
    set: async (k, v) => void map.set(k, structuredClone(v)),
    del: async (k) => void map.delete(k),
    keys: async () => [...map.keys()],
  }
}

describe('[s1] Character model', () => {
  it('a new character is valid', () => expect(() => validateCharacter(newCharacter('c1'))).not.toThrow())
  it('rejects wrong schemaVersion', () =>
    expect(() => validateCharacter({ ...newCharacter('c1'), schemaVersion: 99 })).toThrow(/schemaVersion/))
  it('rejects out-of-range level', () =>
    expect(() => validateCharacter({ ...newCharacter('c1'), level: 11 })).toThrow(/level/))
  it('rejects unknown trait names', () =>
    expect(() => validateCharacter({ ...newCharacter('c1'), traits: { luck: 1 } })).toThrow(CharacterError))
  it('rejects malformed choices', () => {
    const c = newCharacter('c1') as unknown as Record<string, unknown>
    expect(() => validateCharacter({ ...c, choices: { ...(c.choices as object), domainCardIds: 'x' } })).toThrow(/domainCardIds/)
  })
})

describe('[s1] Character export/import', () => {
  it('round-trips', () => {
    const c = { ...newCharacter('c1'), name: 'Vex', traits: { agility: 2 } }
    expect(importCharacter(exportCharacter(c))).toEqual(c)
  })
  it('rejects non-JSON and invalid content', () => {
    expect(() => importCharacter('nope')).toThrow(/not valid JSON/)
    expect(() => importCharacter('{"a":1}')).toThrow(CharacterError)
  })
})

describe('[s1] Character store', () => {
  const t = (n: number) => `2026-01-01T00:00:0${n}.000Z`
  it('saves, stamps updatedAt, and loads', async () => {
    const s = new CharacterStore(memoryStore(), () => t(5))
    await s.save(newCharacter('c1', t(1)))
    expect((await s.load('c1'))?.updatedAt).toBe(t(5))
  })
  it('returns null for a missing id', async () => expect(await new CharacterStore(memoryStore()).load('x')).toBeNull())
  it('removes', async () => {
    const s = new CharacterStore(memoryStore())
    await s.save(newCharacter('c1'))
    await s.remove('c1')
    expect(await s.load('c1')).toBeNull()
  })
  it('refuses to save an invalid character', async () =>
    await expect(new CharacterStore(memoryStore()).save({ ...newCharacter('c1'), level: 0 })).rejects.toThrow(CharacterError))
  it('lists newest first and reports corrupt records', async () => {
    const kv = memoryStore()
    let n = 1
    const s = new CharacterStore(kv, () => t(n++))
    await s.save(newCharacter('old'))
    await s.save(newCharacter('new'))
    kv.map.set('character:bad', { junk: true })
    kv.map.set('other:key', 1)
    const r = await s.list()
    expect(r.characters.map((c) => c.id)).toEqual(['new', 'old'])
    expect(r.corruptIds).toEqual(['bad'])
  })
})
