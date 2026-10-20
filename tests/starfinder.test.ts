import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { ancestryList, armorPool, deriveStats, validateCreation, weaponPool } from '../src/engine/rules'
import { sheetView } from '../src/engine/sheetView'
import { progressOf } from '../src/engine/levelup'
import { validatePack } from '../src/engine/packs'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { equipped } from './lib/levelup-paths'
import { ARMS, SF_ARMS } from './lib/packs'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const PACKS = [pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS, SF_ARMS]
const plain = buildCreation(PACKS)
const sf = buildCreation(PACKS, { supplements: ['starfinder-ancestries'] })
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}
const eq = [...sf.registry.equipment.values()] as any[]
const oneHanded = (slot: string) => eq.filter((e) => e.weaponSlot === slot && e.tier === 1 && e.burden === 'one-handed')
const withAncestry = (id: string) => { const ch = equipped('wizard'); ch.choices.ancestryId = id; return ch }

describe('[s9] Starfinder ancestries option', () => {
  it('the pack validates against the schema', () => {
    expect(() => validatePack(pack('starfinder'))).not.toThrow()
  })

  it('off: the standard list is unchanged (Clank and Human present, no Starfinder ancestries)', () => {
    const names = ancestryList(plain).map((a) => a.name)
    expect(names).toContain('Clank')
    expect(names).toContain('Human')
    expect(names).not.toContain('Android')
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)).filter((n) => names.includes(n)))
    expect(plain.mixedAncestryAllowed).toBe(true)
  })

  it('on: Starfinder ancestries first, alphabetical (Human included), then the standard ones without Clank and Human', () => {
    const names = ancestryList(sf).map((a) => a.name)
    expect(names.slice(0, 10)).toEqual(['Android', 'Baruthu', 'Human', 'Kasatha', 'Lashunta', 'Pahtra', 'Shirren', 'Skittermander', 'Vesk', 'Ysoki'])
    const rest = names.slice(10)
    expect(rest).not.toContain('Clank')
    expect(rest).not.toContain('Human')
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)))
    expect(rest.length).toBe(ancestryList(plain).length - 2)
    expect(sf.mixedAncestryAllowed).toBe(false)
  })

  it('on: Mixed Ancestry and Clank are refused by validation', () => {
    const mixed = withAncestry('human')
    mixed.creation = { ...mixed.creation!, mixedAncestry: { first: 'elf', second: 'dwarf' } }
    expect(validateCreation(mixed, sf).some((i) => i.step === 'ancestry' && /Mixed Ancestry/.test(i.message))).toBe(true)
    expect(validateCreation(withAncestry('clank'), sf).some((i) => i.step === 'ancestry' && /not available/.test(i.message))).toBe(true)
    expect(validateCreation(withAncestry('clank'), plain).some((i) => i.step === 'ancestry')).toBe(false)
  })

  it('Android: every Experience starts at +3 (creation); other ancestries stay at +2', () => {
    expect(progressOf(withAncestry('sf-android'), sf.registry).experiences.map((e) => e.bonus)).toEqual([3, 3])
    expect(progressOf(withAncestry('human'), sf.registry).experiences.map((e) => e.bonus)).toEqual([2, 2])
  })

  it('Skittermander: +1 Evasion is baked in; Ysoki Scurry is a situational footnote, not baked in', () => {
    const base = deriveStats(withAncestry('human'), sf).evasion
    expect(sheetView(withAncestry('sf-skittermander'), sf).stats.evasion).toBe(base + 1)
    const y = sheetView(withAncestry('sf-ysoki'), sf)
    expect(y.stats.evasion).toBe(base)
    expect(y.statNotes.some((n) => n.name === 'Scurry' && n.kind === 'situational' && n.stats.includes('evasion'))).toBe(true)
  })

  it('Kasatha may wield two secondary weapons; other ancestries only one', () => {
    const [prim] = oneHanded('primary'), [s1, s2] = oneHanded('secondary')
    const gear = (id: string) => { const ch = withAncestry(id); const armor = ch.choices.equipmentIds[1]; ch.choices.equipmentIds = [prim.id, s1.id, s2.id, armor]; return ch }
    const equipmentIssue = (ch: any) => validateCreation(ch, sf).some((i) => i.step === 'equipment' && /secondary/.test(i.message))
    expect(equipmentIssue(gear('sf-kasatha'))).toBe(false)
    expect(equipmentIssue(gear('human'))).toBe(true)
    // Four-armed also allows a two-handed primary with up to two secondaries.
    const [big] = eq.filter((e) => e.weaponSlot === 'primary' && e.tier === 1 && e.burden === 'two-handed')
    const big2 = (id: string) => { const ch = gear(id); ch.choices.equipmentIds[0] = big.id; return ch }
    expect(equipmentIssue(big2('sf-kasatha'))).toBe(false)
    expect(equipmentIssue(big2('human'))).toBe(true)
  })

  it('the weapons and armor row prints natural weapons and extra secondaries as extra cells, inside the margins', async () => {
    const [prim] = oneHanded('primary'), [s1, s2] = oneHanded('secondary')
    const mk = (id: string, ids: string[]) => { const ch = withAncestry(id); ch.choices.equipmentIds = [...ids, ch.choices.equipmentIds[1]]; return ch }
    const cases = [mk('sf-pahtra', [prim.id, s1.id]), mk('sf-ysoki', [prim.id, s1.id]), mk('sf-kasatha', [prim.id, s1.id, s2.id]), mk('human', [prim.id, s1.id])]
    const texts: string[] = []
    for (const ch of cases) {
      const marks = await withRecording(async () => renderSheet(ch, sf, fonts))
      expect(marks.filter(outside)).toHaveLength(0)
      texts.push(marks.filter((m) => m.kind === 'text').map((m) => m.text).join(' '))
    }
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    for (const [i, name] of ['pahtra', 'ysoki', 'kasatha'].entries()) writeFileSync(`TestArtifacts/sheet-samples/starfinder-${name}-wizard.pdf`, await renderSheet(cases[i], sf, fonts))
    expect(texts[0]).toMatch(/Claws/)
    expect(texts[1]).toMatch(/Bite/)
    expect(texts[1]).toContain('d4+2')
    expect(texts[2]).toContain(s2.name)
    expect(texts[3]).not.toMatch(/Claws|Bite/)
  }, 60_000)
})

describe('[s9] Starfinder armor', () => {
  const armorOf = (supps: string[]) => armorPool(buildCreation(PACKS, { supplements: supps }))
  it('replaces the core armor list when the supplement is on', () => {
    const on = armorOf(['starfinder-armaments'])
    expect(on.length).toBe(29)
    expect(on.some((a) => a.id === 'armor.mage-robes')).toBe(false)
    expect(on.find((a) => a.id === 'carbon-skin')).toMatchObject({ tier: 1, majorThreshold: 5, severeThreshold: 11, armorScore: 3 })
  })
  it('replaces the core weapon list too (Tier 1 and 2 only for now)', () => {
    const w = weaponPool(buildCreation(PACKS, { supplements: ['starfinder-armaments'] })).entries
    expect(w.length).toBe(91)
    expect(w.filter((x) => x.id.startsWith('weapon.')).every((x) => x.damageType === 'magic' && x.tier! <= 2)).toBe(true)
    expect(w.some((x) => x.id === 'weapon.dagger')).toBe(false)
    expect(Math.max(...w.map((x) => x.tier!))).toBe(2)
    expect(w.find((x) => x.id === 'arc-pistol')).toMatchObject({ weaponSlot: 'primary', range: 'far', damageType: 'tech', burden: 'one-handed' })
  })
  it('leaves the core lists alone when it is off', () => {
    const s = buildCreation(PACKS, { supplements: [] })
    expect(armorPool(s).some((a) => a.id === 'armor.mage-robes')).toBe(true)
    expect(weaponPool(s).entries.some((x) => x.id.startsWith('weapon.'))).toBe(true)
  })
  it('wins over a frame that only adds armor', () => {
    const s = buildCreation(PACKS, { supplements: ['starfinder-armaments', 'monster-hunting'] })
    expect(s.conflicts).toEqual([])
    expect(armorPool(s).length).toBe(29)
  })
})

describe('[s9] Starfinder weapon hands', () => {
  const g = buildCreation(PACKS, { supplements: ['starfinder-ancestries', 'starfinder-armaments'] })
  const pool = weaponPool(g).entries as any[]
  const two = pool.find((e) => e.weaponSlot === 'primary' && e.tier === 1 && e.burden === 'two-handed')
  const one = pool.find((e) => e.weaponSlot === 'primary' && e.tier === 1 && e.burden === 'one-handed')
  const glove = pool.find((e) => e.id === 'battleglove')
  const knives = pool.filter((e) => e.weaponSlot === 'secondary' && e.tier === 1 && e.burden === 'one-handed')
  const handsIssue = (ancestry: string, ids: string[]) => {
    const ch = withAncestry(ancestry)
    ch.choices.equipmentIds = [...ids, armorPool(g)[0].id]
    return validateCreation(ch, g).some((i) => i.step === 'equipment' && /hands/.test(i.message))
  }
  it('a no-hands weapon is free: two-handed + no-hands is fine, two-handed + one-handed is not', () => {
    expect(glove.burden).toBe('no-hands')
    expect(handsIssue('human', [two.id, glove.id])).toBe(false)
    expect(handsIssue('human', [one.id, glove.id])).toBe(false)
    expect(handsIssue('human', [two.id, knives[0].id])).toBe(true)
    expect(handsIssue('human', [one.id, knives[0].id])).toBe(false)
  })
  it('four arms hold a two-handed primary plus two one-handed secondaries', () => {
    expect(handsIssue('sf-kasatha', [two.id, knives[0].id, knives[1].id])).toBe(false)
    expect(handsIssue('sf-kasatha', [two.id, knives[0].id, glove.id])).toBe(false)
    expect(handsIssue('human', [two.id, knives[0].id, knives[1].id])).toBe(true)
  })
})
