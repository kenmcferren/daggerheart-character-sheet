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
  for (const [kind, list] of [['ancestries', [...reg.ancestries.values()]], ['communities', [...reg.communities.values()]]] as const) {
    it(`${kind}: every short is no longer than the SRD text it replaces and adds no numbers`, () => {
      const items = (list as any[]).flatMap((e) => groups(e.features))
      if (kind === 'ancestries') expect(items.length, 'no shorts applied').toBeGreaterThan(0)
      for (const f of items) {
        expect(words(f.short), f.name).toBeLessThanOrEqual(words(f.rules))
        for (const n of f.short.match(/\d+/g) ?? []) expect(f.rules, `${f.name}: number ${n} is not in the SRD text`).toContain(n)
      }
    })
  }
  for (const file of files) {
    const id = file.replace('.json', '')
    it(`${id}: every short is no longer than the SRD text it replaces and adds no numbers`, () => {
      const cls = reg.classes.get(id)
      const subs = [...reg.subclasses.values()].filter((s: any) => s.class === id) as any[]
      const lists = [[cls.hopeFeature], cls.features, ...subs.map((s) => s.features), cls.stances ?? [], cls.companion?.levelUpOptions ?? [], ...(cls.beastforms ?? []).map((b: any) => b.features)]
      const items = lists.flatMap(groups)
      expect(items.length).toBeGreaterThan(0)
      for (const f of items) {
        expect(words(f.short), f.name).toBeLessThanOrEqual(words(f.rules))
        for (const n of f.short.match(/\d+/g) ?? []) expect(f.rules, `${f.name}: number ${n} is not in the SRD text`).toContain(n)
      }
    })
  }
})

describe('[s5] condensed campaign rules', () => {
  const frames = JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8')).content.campaignFrames as any[]
  const ops = frames.flatMap((f) => f.creation.ops.filter((o: any) => typeof o.short === 'string').map((o: any) => ({ frame: f.id, ...o })))
  it('every campaign rule with a short is no longer than the SRD text and adds no numbers (table cells included)', () => {
    expect(ops.length).toBeGreaterThan(0)
    for (const o of ops) {
      const full = String(o.body ?? o.rules)
      const name = o.title ?? o.name ?? o.item
      expect(words(o.short), `${o.frame} ${name}`).toBeLessThanOrEqual(words(full))
      const printed = `${o.short} ${(o.table ? [o.table.head, ...o.table.rows] : []).flat().join(' ')}`
      for (const n of printed.match(/\d+/g) ?? []) expect(full, `${o.frame} ${name}: number ${n} is not in the SRD text`).toContain(n)
    }
  })
  it('table rows all have as many cells as the header', () => {
    for (const o of ops.filter((x) => x.table)) for (const r of o.table.rows) expect(r.length).toBe(o.table.head.length)
  })
})

describe('[s5] condensed domain cards', () => {
  /** Substitution markers ({{key|template|fallback}}) resolve to their fallback, which is the SRD wording. */
  const plain = (s: string) => s.replace(/\{\{\w+\|[^|}]*\|([^}]*)\}\}/g, '$1')
  const cards = ([...reg.domainCards.values()].filter((c: any) => c.short !== undefined) as any[]).map((c) => ({ ...c, raw: c.short, short: plain(c.short) }))
  it('substitution markers use a known key, put # in the template, and print nothing else', () => {
    const keys = ['spellcast', 'agility', 'agilityMin1', 'strength2', 'halfProfUp', 'halfAgilityUp', 'knowledgeMin1', 'finesseOrAgility', 'level', 'presence', 'strength', 'strengthPlus3', 'proficiency']
    for (const c of cards) for (const m of c.raw.matchAll(/\{\{(\w+)\|([^|}]*)\|([^}]*)\}\}/g)) { expect(keys, `${c.name}: key ${m[1]}`).toContain(m[1]); expect(m[2], `${c.name}: template`).toContain('#') }
  })
  it('there are condensed cards', () => { expect(cards.length).toBeGreaterThan(0) })
  it('every card short is no longer than the SRD text, adds no numbers, and keeps grimoire spell lines and once-per wording', () => {
    for (const c of cards) {
      expect(words(c.short), c.name).toBeLessThanOrEqual(words(c.rules))
      for (const n of c.short.match(/\d+/g) ?? []) expect(c.rules, `${c.name}: number ${n} is not in the SRD text`).toContain(n)
      if (c.sheetTable) for (const r of c.sheetTable.rows) {
        expect(r.length, `${c.name}: table row`).toBe(c.sheetTable.head.length)
        for (const n of r.join(' ').match(/\d+/g) ?? []) expect(c.rules.replace(/(\d) (\d)/g, '$1$2') /* the SRD prints Bare Bones' "13/31" as "13/3 1" */, `${c.name}: table number ${n} is not in the SRD text`).toContain(n)
      }
      const once = (t: string) => (t.match(/once per (?:long )?rest/gi) ?? []).length
      expect(once(c.short), `${c.name}: once-per wording`).toBe(once(c.rules))
      if (c.type === 'grimoire') {
        // Spell names (lines that start "Name: ..."); a spell's continuation lines may be merged into its line.
        const lead = (t: string) => t.split('\n').map((l) => /^([A-Z][^:.]{1,40}):\s/.exec(l)?.[1]).filter(Boolean)
        expect(lead(c.short), `${c.name}: spell lines`).toEqual(lead(c.rules))
      }
    }
  })
})
