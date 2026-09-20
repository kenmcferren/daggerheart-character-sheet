import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'

describe('[s2] Pack validation report', () => {
  it('reports no problems for packs/core', () => {
    const r = spawnSync('node', ['scripts/validate-packs.mjs'], { encoding: 'utf8' })
    expect(r.stdout).toContain('0 problem(s)')
    expect(r.status).toBe(0)
  })
  it('fails and names the problem when a reference is broken', () => {
    const r = spawnSync('node', ['scripts/validate-packs.mjs', 'tests/fixtures/broken-pack'], { encoding: 'utf8' })
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('unknown domain "nope"')
  })
})
