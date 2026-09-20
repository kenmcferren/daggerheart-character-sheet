import { describe, it, expect } from 'vitest'
import { loadPacks, validatePack, PackError } from '../src/engine/packs'

const base = { schemaVersion: 1, id: 'a', name: 'A', version: '1', publisher: 'P' }

describe('[s1] Source pack validation', () => {
  it('accepts a minimal pack', () => expect(validatePack(base).id).toBe('a'))
  it('rejects missing fields', () => expect(() => validatePack({ id: 'a' })).toThrow(PackError))
  it('rejects unknown top-level keys', () => expect(() => validatePack({ ...base, junk: 1 })).toThrow(PackError))
  it('rejects bad entry ids', () =>
    expect(() => validatePack({ ...base, content: { classes: [{ id: 'Bad Id', name: 'x' }] } })).toThrow(PackError))
  it('rejects unknown content kinds', () =>
    expect(() => validatePack({ ...base, content: { spells: [] } })).toThrow(PackError))
  it('rejects an override that tries to change the id', () =>
    expect(() => validatePack({ ...base, overrides: { classes: { bard: { id: 'x' } } } })).toThrow(PackError))
})

describe('[s1] Source pack loader', () => {
  const core = { ...base, content: { classes: [{ id: 'bard', name: 'Bard' }] } }
  it('loads entries and tags their pack', () => {
    const r = loadPacks([core])
    expect(r.classes.get('bard')?.sourcePack).toBe('a')
  })
  it('errors on duplicate pack ids', () => expect(() => loadPacks([core, core])).toThrow(/Duplicate pack/))
  it('errors on duplicate entry ids across packs', () =>
    expect(() => loadPacks([core, { ...core, id: 'b' }])).toThrow(/Duplicate classes/))
  it('applies extended packs first, so overrides work regardless of input order', () => {
    const ext = { ...base, id: 'b', extends: ['a'], overrides: { classes: { bard: { name: 'Skald' } } } }
    const r = loadPacks([ext, core])
    expect(r.classes.get('bard')).toMatchObject({ name: 'Skald', sourcePack: 'b' })
  })
  it('errors on missing extends', () =>
    expect(() => loadPacks([{ ...base, extends: ['zz'] }])).toThrow(/missing pack/))
  it('errors on circular extends', () => {
    const b = { ...base, id: 'b', extends: ['a'] }
    expect(() => loadPacks([{ ...base, extends: ['b'] }, b])).toThrow(/Circular/)
  })
  it('errors when overriding a missing entry', () =>
    expect(() => loadPacks([{ ...base, overrides: { classes: { nope: { name: 'x' } } } }])).toThrow(/missing classes/))
})
