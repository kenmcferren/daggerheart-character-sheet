import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { validateCreation, deriveStats } from '../src/engine/rules'
import { creationOf } from '../src/engine/character'
import { validatePack } from '../src/engine/packs'
import { equipped } from './lib/levelup-paths'
import { ARMS, SF_ARMS } from './lib/packs'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const PACKS = [pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS, SF_ARMS]
const plain = buildCreation(PACKS)
const on = buildCreation(PACKS, { supplements: ['starfinder-consumables'] })
const withPotion = (potion: string) => { const ch = equipped('wizard'); ch.creation = { ...creationOf(ch), potion, classItem: 'A book', experiences: ['Sailor', 'Liar'] }; return ch }
const equipmentIssues = (ch: ReturnType<typeof withPotion>, s: typeof on) => validateCreation(ch, s).filter((i) => i.step === 'equipment')

describe('[s11] Starheart consumables option', () => {
  it('the pack validates and the data file has 120 items, 30 per category', () => {
    expect(() => validatePack(pack('starfinder'))).not.toThrow()
    const d = JSON.parse(readFileSync('scripts/srd-convert/starfinder/consumables.json', 'utf8'))
    expect(d.items).toHaveLength(120)
    for (const t of ['cypher', 'gadget', 'ordnance', 'stim']) expect(d.items.filter((i: { type: string }) => i.type === t)).toHaveLength(30)
  })

  it('off: standard potions only', () => {
    expect(plain.startingStims).toEqual([])
    expect(equipmentIssues(withPotion('health'), plain)).toEqual([])
    expect(equipmentIssues(withPotion('stim-1'), plain).length).toBeGreaterThan(0)
  })

  it('on: offers stims 1-6, 8, 9, 10 and not the standard potions', () => {
    expect(on.startingStims.map((s) => s.id)).toEqual(['stim-1', 'stim-2', 'stim-3', 'stim-4', 'stim-5', 'stim-6', 'stim-8', 'stim-9', 'stim-10'])
    expect(equipmentIssues(withPotion('stim-8'), on)).toEqual([])
    expect(equipmentIssues(withPotion('health'), on).length).toBeGreaterThan(0)
    expect(equipmentIssues(withPotion('stim-7'), on).length).toBeGreaterThan(0)
  })

  it('the chosen stim goes into the kit', () => {
    const kit = deriveStats(withPotion('stim-8'), on).kit
    expect(kit.some((k) => /Minor Health Stim \(Clear 1d4 HP\.\)/.test(k))).toBe(true)
  })
})
