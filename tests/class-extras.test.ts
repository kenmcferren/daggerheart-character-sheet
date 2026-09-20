import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadPacks } from '../src/engine/packs'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const reg = loadPacks([core])
const cls = (id: string) => reg.classes.get(id) as any

describe('[s3] structured class extras', () => {
  it('druid: 24 beastforms, 6 per tier, only the two upgrade forms lack a stat line', () => {
    const b = cls('druid').beastforms
    expect(b).toHaveLength(24)
    for (const t of [1, 2, 3, 4]) expect(b.filter((x: any) => x.tier === t)).toHaveLength(6)
    expect(b.filter((x: any) => !x.attack).map((x: any) => x.id)).toEqual(['legendary-beast', 'mythic-beast'])
    expect(b.find((x: any) => x.id === 'pack-predator')).toMatchObject({
      traitBonus: { trait: 'strength', bonus: 2 }, evasionBonus: 1,
      attack: { range: 'melee', trait: 'strength', damage: 'd8+2', damageType: 'physical' },
      advantages: ['attack', 'sprint', 'track'],
    })
    expect(b.find((x: any) => x.id === 'striking-serpent').attack.range).toBe('very-close')
    expect(b.find((x: any) => x.id === 'mythic-hybrid').attack.trait).toBe('strength')
    for (const x of b.filter((y: any) => y.attack)) expect(x.features.length, x.id).toBeGreaterThan(0)
  })
  it('ranger: companion data', () => {
    const c = cls('ranger').companion
    expect(c).toMatchObject({ startingEvasion: 10, startingDamageDie: 'd6', startingRange: 'melee', experiences: { count: 2, bonus: 2 } })
    expect(c.levelUpOptions.map((o: any) => o.id)).toContain('aware')
    expect(c.levelUpOptions).toHaveLength(8)
    expect(c.exampleExperiences).toHaveLength(20)
  })
  it('brawler: 16 stances across four tiers, focus cap 6, two known at creation', () => {
    const b = cls('brawler')
    expect(b.stances).toHaveLength(16)
    expect(new Set(b.stances.map((s: any) => s.tier))).toEqual(new Set([1, 2, 3, 4]))
    expect(b.stances.find((s: any) => s.id === 'reliable').rules).toContain('+1 bonus to your attack rolls')
    expect(b.focusMax).toBe(6)
    expect(b.knownStancesAtCreation).toBe(2)
  })
  it('structured entries are no longer duplicated as raw supplements', () => {
    expect(cls('druid').supplements.map((s: any) => s.title)).toEqual(['Beastform Options'])
    expect(cls('brawler').supplements.some((s: any) => /^Tier/.test(s.title))).toBe(false)
  })
  it('multiclassing is a level-up option available from level 5', () => {
    expect(reg.levelUpOptions.get('multiclass')).toMatchObject({ minLevel: 5 })
  })
  it('once-per-rest cards carry uses, usesPer and a one-circle tracker', () => {
    const cards = [...reg.domainCards.values()] as any[]
    const withUses = cards.filter((c) => c.uses)
    expect(withUses.length).toBe(65)
    for (const c of withUses) {
      expect(c.uses).toBe(1)
      expect(['short-rest', 'long-rest', 'rest', 'scene', 'session']).toContain(c.usesPer)
      expect(c.trackers).toEqual([expect.objectContaining({ shape: 'circle', count: 1 })])
    }
    expect(cards.filter((c) => !c.uses).every((c) => !c.trackers)).toBe(true)
  })
})
