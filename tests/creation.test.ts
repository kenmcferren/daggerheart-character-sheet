import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation, detectConflicts, CreationError } from '../src/engine/creation'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const frames = JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))
const packs = [core, frames]

describe('[s3] creation engine', () => {
  it('no frame: the ten SRD steps in order', () => {
    const c = buildCreation(packs)
    expect(c.steps.map((s) => s.id)).toEqual([
      'class', 'subclass', 'ancestry', 'community', 'traits', 'equipment', 'background', 'experiences', 'domain-cards', 'connections',
    ])
    expect(c.conflicts).toEqual([])
  })
  it('supplement collects annotations by target', () => {
    const c = buildCreation(packs, { supplements: ['witherwild'] })
    expect(c.annotations.get('classes.druid')?.[0].source).toBe('witherwild')
    expect(c.annotations.get('classes.ranger')).toBeDefined()
  })
  it('insert-step places steps before a base step or before creation', () => {
    const c = buildCreation(packs, { supplements: ['floating-magic-school', 'fairy-tale'] })
    const ids = c.steps.map((s) => s.id)
    expect(ids[0]).toBe('villain-prompts')
    expect(ids.indexOf('flight-artifact')).toBe(ids.indexOf('traits') - 1)
    expect(c.steps.find((s) => s.id === 'flight-artifact')).toMatchObject({ choice: 'flight-artifact', source: 'floating-magic-school' })
  })
  it('replace and add pool ops resolve to pool entries', () => {
    const c = buildCreation(packs, { supplements: ['western'] })
    expect(c.pools.get('weapons')![0].entries.length).toBeGreaterThan(0)
    expect(c.pools.get('consumables')).toBeDefined()
  })
  it('flags two supplements replacing the weapons pool', () => {
    const c = buildCreation(packs, { supplements: ['everyday-hero', 'tech'] })
    const hit = c.conflicts.find((x) => x.kind === 'pool-replaced-twice')
    expect(hit?.frames).toEqual(['everyday-hero', 'tech'])
  })
  it('flags replace + add on the same pool', () => {
    const c = buildCreation(packs, { supplements: ['everyday-hero', 'western'] })
    expect(c.conflicts.map((x) => x.kind)).toContain('pool-replace-and-add')
  })
  it('every supplement alone is conflict-free', () => {
    for (const f of frames.content.campaignFrames.filter((x: any) => x.frameKind === 'supplement')) {
      expect(buildCreation(packs, { supplements: [f.id] }).conflicts, f.id).toEqual([])
    }
  })
  it('rejects unknown ids, frame slot, duplicates', () => {
    expect(() => buildCreation(packs, { frame: 'nope' })).toThrow(CreationError)
    expect(() => buildCreation(packs, { frame: 'tech' })).toThrow(/supplement/)
    expect(() => buildCreation(packs, { supplements: ['tech', 'tech'] })).toThrow(/twice/)
  })
  it('detects duplicate steps, trackers, resources, and move add/remove', () => {
    const k = detectConflicts([
      { op: 'insert-step', step: 'x', source: 'a' }, { op: 'insert-step', step: 'x', source: 'b' },
      { op: 'add-tracker', id: 't', source: 'a' }, { op: 'add-tracker', id: 't', source: 'b' },
      { op: 'set-resource', resource: 'currency', source: 'a' }, { op: 'set-resource', resource: 'currency', source: 'b' },
      { op: 'remove-move', move: 'm', source: 'a' }, { op: 'add-move', id: 'm', source: 'b' },
    ]).map((c) => c.kind)
    expect(k).toEqual(expect.arrayContaining(['step-duplicate', 'tracker-duplicate', 'resource-set-twice', 'move-conflict']))
  })
  it('rejects an insert before an unknown step', () => {
    const bad = {
      ...frames, id: 'bad', extends: ['srd-core'],
      content: { campaignFrames: [{ id: 'bad-s', name: 'Bad', frameKind: 'supplement', creation: { ops: [{ op: 'insert-step', before: 'zzz', step: 'q', title: 'Q' }] } }] },
    }
    expect(() => buildCreation([core, bad], { supplements: ['bad-s'] })).toThrow(/unknown step/)
  })
})
