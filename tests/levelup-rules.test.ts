import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadPacks, validatePack } from '../src/engine/packs'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const reg = loadPacks([core])
const opts = [...reg.levelUpOptions.values()] as any[]
const of = (kind: string) => opts.filter((o) => o.kind === kind)
const get = (id: string) => reg.levelUpOptions.get(id) as any

describe('[s5] level-up rules as data', () => {
  it('has 3 achievements, 9 core advancements, 2 level steps, 3 class-specific entries', () => {
    expect(of('tier-achievement').map((o) => o.level)).toEqual([2, 5, 8])
    expect(of('advancement').filter((o) => !o.classId)).toHaveLength(9)
    expect(of('level-step').filter((o) => !o.classId).map((o) => o.effect)).toEqual(['thresholds', 'level-domain-card'])
    expect(opts.filter((o) => o.classId).map((o) => o.id).sort()).toEqual(['brawler-combo-die', 'brawler-stance', 'ranger-companion-option'])
  })

  it('tier achievements: +2 Experience and +1 Proficiency each; marks cleared at 5 and 8 only', () => {
    for (const a of of('tier-achievement')) expect(a).toMatchObject({ newExperience: 2, proficiency: 1 })
    expect(of('tier-achievement').map((a) => a.clearTraitMarks)).toEqual([false, true, true])
  })

  it('slot counts per tier match the printed level-up sheet', () => {
    const slots = (id: string) => get(id).slots
    expect(slots('traits')).toEqual({ 2: 3, 3: 3, 4: 3 })
    expect(slots('hit-point')).toEqual({ 2: 2, 3: 2, 4: 2 })
    expect(slots('stress')).toEqual({ 2: 2, 3: 2, 4: 2 })
    for (const id of ['experience', 'domain-card', 'evasion']) expect(slots(id), id).toEqual({ 2: 1, 3: 1, 4: 1 })
    expect(slots('subclass-upgrade')).toEqual({ 3: 1, 4: 1 })
    expect(slots('proficiency')).toEqual({ 3: 2, 4: 2 })
    expect(slots('multiclass')).toEqual({ 3: 2, 4: 2 })
  })

  it('costs, minimum level, marks, and cross-outs', () => {
    expect(get('proficiency').cost).toBe(2)
    expect(get('multiclass').cost).toBe(2)
    expect(get('traits').marksTraits).toBe(true)
    for (const id of ['proficiency', 'multiclass', 'subclass-upgrade']) expect(get(id).minLevel, id).toBe(5)
    expect(get('domain-card').cardLevelCap).toBeUndefined()
    expect(get('multiclass').crossesOut).toEqual([{ option: 'subclass-upgrade', scope: 'one' }, { option: 'multiclass', scope: 'all' }])
    expect(get('subclass-upgrade').crossesOut).toEqual([{ option: 'multiclass', scope: 'tier' }])
  })

  it('every cross-out and class reference resolves; every entry has SRD rules text', () => {
    for (const o of opts) {
      expect(o.rules.trim().length, o.id).toBeGreaterThan(20)
      if (o.classId) expect(reg.classes.has(o.classId), o.id).toBe(true)
      for (const c of o.crossesOut ?? []) expect(reg.levelUpOptions.has(c.option), o.id).toBe(true)
    }
  })

  it('schema rejects a malformed option', () => {
    const bad = (patch: object) => validatePack({ ...core, content: { levelUpOptions: [{ id: 'x', name: 'X', kind: 'advancement', rules: 'r', ...patch }] } })
    expect(() => bad({})).not.toThrow()
    expect(() => bad({ kind: 'bogus' })).toThrow()
    expect(() => bad({ slots: { 5: 1 } })).toThrow()
    expect(() => bad({ cost: 3 })).toThrow()
    expect(() => bad({ rules: undefined })).toThrow()
  })
})
