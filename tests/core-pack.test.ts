import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadPacks, validatePack } from '../src/engine/packs'

const raw = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))

describe('[s2] SRD core pack', () => {
  it('validates against the schema', () => {
    expect(() => validatePack(raw)).not.toThrow()
  })
  it('has the expected counts', () => {
    const c = raw.content
    expect([c.classes.length, c.subclasses.length, c.ancestries.length, c.communities.length, c.domains.length, c.domainCards.length]).toEqual([13, 26, 24, 15, 10, 210])
  })
  it('resolves every cross-reference', () => {
    const r = loadPacks([raw])
    for (const c of r.classes.values()) {
      for (const d of c.domains) expect(r.domains.has(d), `${c.id} domain ${d}`).toBe(true)
      for (const s of c.subclasses) expect(r.subclasses.has(s), `${c.id} sub ${s}`).toBe(true)
    }
    for (const s of r.subclasses.values()) expect(r.classes.has(s.class), s.id).toBe(true)
    for (const c of r.domainCards.values()) expect(r.domains.has(c.domain), c.id).toBe(true)
    for (const d of r.domains.values()) for (const c of d.classes) expect(r.classes.has(c), `${d.id} class ${c}`).toBe(true)
  })
  it('every domain has 21 cards and every class has two domains', () => {
    for (const d of raw.content.domains) expect(raw.content.domainCards.filter((c: any) => c.domain === d.id).length).toBe(21)
    for (const c of raw.content.classes) expect(c.domains.length).toBe(2)
  })
  it('carries no empty rules text', () => {
    for (const k of ['classes', 'subclasses', 'ancestries', 'communities']) for (const e of raw.content[k]) for (const f of e.features ?? []) expect(f.rules.length, `${e.id}`).toBeGreaterThan(0)
    for (const c of raw.content.domainCards) expect(c.rules.length, c.id).toBeGreaterThan(0)
  })
})
