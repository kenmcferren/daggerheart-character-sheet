import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { loadPacks } from '../src/engine/packs'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const reg: any = loadPacks([core])
const words = (t: string) => t.split(/\s+/).filter(Boolean).length

/** A feature and the features after it that were folded into it (short ""), so a merged short is compared with all the text it replaces. */
function groups(list: any[]) {
  const out: { name: string; rules: string; short: string }[] = []
  for (const f of list) {
    if (f.short === undefined) continue
    if (f.short === '' && out.length) out[out.length - 1].rules += ` ${f.rules}`
    else out.push({ name: f.name ?? f.id, rules: f.rules, short: f.short })
  }
  return out
}

describe('[s5] condensed sheet wording', () => {
  const files = readdirSync('scripts/srd-convert/short').filter((f) => f.endsWith('.json'))
  it('there is at least one class with condensed wording', () => { expect(files.length).toBeGreaterThan(0) })
  for (const file of files) {
    const id = file.replace('.json', '')
    it(`${id}: every short is no longer than the SRD text it replaces and adds no numbers`, () => {
      const cls = reg.classes.get(id)
      const subs = [...reg.subclasses.values()].filter((s: any) => s.class === id) as any[]
      const lists = [[cls.hopeFeature], cls.features, ...subs.map((s) => s.features), cls.stances ?? [], cls.companion?.levelUpOptions ?? []]
      const items = lists.flatMap(groups)
      expect(items.length).toBeGreaterThan(0)
      for (const f of items) {
        expect(words(f.short), f.name).toBeLessThanOrEqual(words(f.rules))
        for (const n of f.short.match(/\d+/g) ?? []) expect(f.rules, `${f.name}: number ${n} is not in the SRD text`).toContain(n)
      }
    })
  }
})
