import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadPacks } from '../src/engine/packs'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const frames = JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))

describe('[s2] SRD campaign frame pack', () => {
  it('loads on top of the core pack', () => {
    const r = loadPacks([core, frames])
    expect(r.campaignFrames.size).toBe(9)
    expect(r.campaignFrames.get('witherwild')).toMatchObject({ frameKind: 'frame' })
  })
  it('exactly one frame; the rest are supplements', () => {
    expect(frames.content.campaignFrames.filter((f: any) => f.frameKind === 'frame').length).toBe(1)
  })
  it('annotate targets resolve to core entries', () => {
    const r = loadPacks([core, frames])
    for (const f of r.campaignFrames.values()) for (const op of (f as any).creation?.ops ?? []) {
      if (op.op !== 'annotate') continue
      const [kind, ...rest] = op.target.split('.')
      expect((r as any)[kind].has(rest.join('.')), `${f.id}: ${op.target}`).toBe(true)
    }
  })
  it('pool references and tracker attachments resolve inside the frame', () => {
    for (const f of frames.content.campaignFrames) for (const op of f.creation?.ops ?? []) {
      if (op.with?.startsWith('pools.')) expect(f.pools[op.with.slice(6)], `${f.id} ${op.with}`).toBeDefined()
      if (op.attachTo?.startsWith('pools.')) {
        const [, pool, id] = op.attachTo.split('.')
        expect(f.pools[pool].some((e: any) => e.id === id), `${f.id} ${op.attachTo}`).toBe(true)
      }
    }
  })
  it('pool entry ids are unique and tiered items carry four tiers', () => {
    for (const f of frames.content.campaignFrames) for (const pool of Object.values(f.pools ?? {}) as any[][]) {
      expect(new Set(pool.map((e) => e.id)).size).toBe(pool.length)
      for (const e of pool) if (e.tiers) expect(Object.keys(e.tiers)).toEqual(['1', '2', '3', '4'])
    }
  })
  it('every annotate/back-sheet carries text', () => {
    for (const f of frames.content.campaignFrames) for (const op of f.creation?.ops ?? []) {
      if (op.op === 'annotate') expect(op.text.length + (op.questions?.length ?? 0), f.id + op.target).toBeGreaterThan(0)
      if (op.op === 'back-sheet') expect(op.body.length, f.id + op.title).toBeGreaterThan(0)
    }
  })
})
