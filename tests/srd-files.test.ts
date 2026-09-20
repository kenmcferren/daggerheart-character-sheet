import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'

const root = 'Daggerheart SRD Files'
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((e) => (statSync(join(d, e)).isDirectory() ? walk(join(d, e)) : [join(d, e)]))
const files = walk(root).filter((f) => f.endsWith('.md'))
const count = (d: string) => readdirSync(join(root, d)).filter((f) => f.endsWith('.md')).length

describe('[s2] SRD Markdown files', () => {
  it('every relative link resolves', () => {
    const broken: string[] = []
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
        const l = decodeURIComponent(m[1])
        if (/^(https?:|#)/.test(l)) continue
        if (!existsSync(join(dirname(f), l.split('#')[0]))) broken.push(`${f} -> ${l}`)
      }
    }
    expect(broken).toEqual([])
  })

  it('has the expected content counts', () => {
    expect(count('Classes')).toBe(14) // 13 classes + index
    for (const d of ['Arcana', 'Blade', 'Bone', 'Codex', 'Dread', 'Grace', 'Midnight', 'Sage', 'Splendor', 'Valor']) {
      const t = readFileSync(join(root, 'Domains', `${d} Domain.md`), 'utf8')
      expect(t.match(/^\*\*Level \d+ /gm)?.length, d).toBe(21)
    }
  })

  it('leaves no glyph placeholders or page footers', () => {
    for (const f of files) {
      const t = readFileSync(f, 'utf8').split('\n').filter((l) => !l.startsWith('> Source')).join('\n')
      expect(t, f).not.toMatch(/⟦|^(Daggerheart SRD \d+|\d+ Daggerheart SRD)$/m)
    }
  })

  it('every adversary and environment has tier, difficulty and features', () => {
    for (const d of ['Adversaries', 'Environments']) {
      for (const t of readdirSync(join(root, d)).filter((x) => x.startsWith('Tier '))) {
        for (const f of readdirSync(join(root, d, t))) {
          const s = readFileSync(join(root, d, t, f), 'utf8')
          expect(s, f).toMatch(/\*\*Tier \d/)
          expect(s, f).toMatch(/\*\*Difficulty:\*\* (\d+|Special)/)
          expect(s, f).toMatch(/## Features/)
        }
      }
    }
  })
})
