import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { armorPool, weaponPool } from '../src/engine/rules'
import { sheetView } from '../src/engine/sheetView'
import { gearEffect, proficiencyTrait } from '../src/engine/gearEffects'
import { equipped } from './lib/levelup-paths'
import { ARMS, SF_ARMS } from './lib/packs'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const sf = buildCreation([pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS, SF_ARMS], { supplements: ['starfinder-armaments'] })

/** Same character, once with the named armor and once with no armor at all (both without the unarmored stand-in thresholds). */
function wearing(armorId: string, extra: string[] = []) {
  const bare = equipped('guardian')
  bare.choices.equipmentIds = bare.choices.equipmentIds.filter((id) => !armorPool(sf).some((a) => a.id === id)).concat(extra)
  const worn = JSON.parse(JSON.stringify(bare))
  worn.choices.equipmentIds.push(armorId)
  worn.traits = { agility: 1, strength: 2, finesse: 3, instinct: 0, presence: 0, knowledge: 0 }
  bare.traits = { ...worn.traits }
  return { bare: sheetView(bare, sf), worn: sheetView(worn, sf), armor: armorPool(sf).find((a) => a.id === armorId) as any }
}

describe('[s11] gear effects: armor and weapon feature text feeds the printed numbers', () => {
  it('parses the stat clauses and ignores costs, triggers and attack-roll bonuses', () => {
    expect(gearEffect('Flexible: +1 to Evasion').evasion).toBe(1)
    expect(gearEffect('Very Heavy: -2 to Evasion; -1 to Agility')).toMatchObject({ evasion: -2, traits: { agility: -1 } })
    expect(gearEffect('Barrier: +2 to Armor Score; −1 to Evasion')).toMatchObject({ armorScore: 2, evasion: -1 })
    expect(gearEffect('Brave: −1 to Evasion; +3 to Severe damage threshold')).toMatchObject({ evasion: -1, severeThreshold: 3 })
    expect(gearEffect('Padded: +2 to damage thresholds')).toMatchObject({ majorThreshold: 2, severeThreshold: 2 })
    expect(gearEffect('Plated: Add your Strength Trait to your armor score.').armorScoreTrait).toBe('strength')
    expect(gearEffect('Natural: Add your Finesse to your evasion.').evasionTrait).toBe('finesse')
    expect(gearEffect('Difficult: −1 to all character traits and Evasion')).toMatchObject({ evasion: -1, traits: { agility: -1, presence: -1 } })
    expect(gearEffect('Reliable: +1 to attack rolls')).toMatchObject({ evasion: 0, armorScore: 0 })
    expect(gearEffect('Tracer Fire: Add +2 to your attack roll with this weapon.').evasion).toBe(0)
    expect(gearEffect('Deflecting: When you are attacked, you can mark an Armor Slot to gain a bonus to your Evasion equal to your Armor Score against the attack.').evasion).toBe(0)
    expect(proficiencyTrait('Flashy: Use your Presence as your proficiency with this weapon.')).toBe('presence')
    expect(proficiencyTrait('Deadly Accuracy: This weapon uses your Finesse as its proficiency level.')).toBe('finesse')
    expect(proficiencyTrait('Hammer: Use your strength as your proficiency value.')).toBe('strength')
  })

  it('Carbon Skin adds +1 Evasion; Civilian Clothing +2; Freebooter Armor -1', () => {
    for (const [id, d] of [['carbon-skin', 1], ['civilian-clothing', 2], ['freebooter-armor', -1]] as const) {
      const { bare, worn } = wearing(id)
      expect(worn.stats.evasion - bare.stats.evasion, id).toBe(d)
    }
  })

  it('Defiance Series: -2 Evasion and -1 Agility on the printed traits', () => {
    const { bare, worn } = wearing('defiance-series')
    expect(worn.stats.evasion - bare.stats.evasion).toBe(-2)
    expect(worn.traits.agility).toBe((bare.traits.agility ?? 0) - 1)
  })

  it('Veskarium Imperial Plate adds Strength to Armor Score; Second Skin adds Finesse to Evasion', () => {
    const a = wearing('veskarium-imperial-plate')
    expect(a.worn.stats.armorScore - a.bare.stats.armorScore).toBe(a.armor.armorScore + 2)
    const b = wearing('second-skin')
    expect(b.worn.stats.evasion - b.bare.stats.evasion).toBe(3)
  })

  it('a shield-type secondary weapon adds its Armor Score', () => {
    const shield = (weaponPool(sf).entries as any[]).find((w) => /Protective: \+1 to Armor Score/.test(w.feature ?? '') && w.weaponSlot === 'secondary')
    expect(shield).toBeTruthy()
    const ch = equipped('guardian'), before = sheetView(ch, sf).stats.armorScore
    ch.choices.equipmentIds.push(shield.id)
    expect(sheetView(ch, sf).stats.armorScore).toBe(before + 1)
  })
})
