// One-time (Series 16): adds the `advancement` block to ships.json from Docs/starheart-ships/advancement-design.md.
// Safe to rerun: it replaces the block. ships.json is hand-edited; this only touches `advancement`.
import { readFileSync, writeFileSync } from 'node:fs'
const path = 'scripts/srd-convert/starfinder/ships.json'
const ships = JSON.parse(readFileSync(path, 'utf8'))
ships.advancement = {
  vault: { base: 0, boxesPerExtraSlot: 2 },
  options: [
    { id: 'hull', name: 'Gain a Hull Point', boxes: 2, gains: [{ hp: 1 }] },
    { id: 'stress-or-hull', name: 'Gain a Stress Slot or a Hull Point', boxes: 2, gains: [{ stress: 1 }, { hp: 1 }] },
    { id: 'thresholds-major', name: 'Add +1/+2 to your thresholds', boxes: 4, gains: [{ thresholds: [1, 2] }], alternatesWith: 'thresholds-minor' },
    { id: 'thresholds-minor', name: 'Add +1/+1 to your thresholds', boxes: 3, gains: [{ thresholds: [1, 1] }], alternatesWith: 'thresholds-major' },
    { id: 'evasion-or-hull', name: 'Gain +1 Evasion or a Hull Point', boxes: 1, gains: [{ evasion: 1 }, { hp: 1 }] },
    { id: 'compartment', name: 'Add a compartment', boxesFromSize: true, compartment: true },
  ],
  compartments: [
    { id: 'personal-armory', name: 'Personal Armory', rules: 'Holds up to 4 weapons, conveniently placed where you need them.' },
    { id: 'stim-lab', name: 'Stim Lab', rules: 'Each rest, roll 1d30 on the Stims list and gain that consumable.', rollsOn: 'stim' },
    { id: 'stasis-chamber', name: 'Stasis Chamber', rules: 'When you rest in your ship and **Tend Wounds**, you always tend all wounds.' },
    { id: 'meditation-room', name: 'Meditation Room', rules: 'When you rest in your ship and **Clear Stress**, you always clear all Stress.' },
    { id: 'suit-locker', name: 'Suit Locker', rules: 'Keep up to 2 spare suits of armor on board. Their marked slots are not cleared automatically, but they can be swapped out in a few minutes. During a rest, clear only one suit; during a refit, clear all.', spareSuits: { count: 2, slots: 12 } },
    { id: 'war-room', name: 'War Room', rules: 'When you **Prepare**, you always gain 2 Hope. Each other person in your party gains a Hope each rest if they do not Prepare.' },
    { id: 'gym', name: 'Gym', rules: 'When you rest in your ship, gain a +1 to a physical trait until your next rest.' },
    { id: 'library', name: 'Library', rules: 'When you rest in your ship, gain a +1 to a mental trait until your next rest.' },
  ],
}
writeFileSync(path, JSON.stringify(ships, null, 2) + '\n')
console.log(`advancement: ${ships.advancement.options.length} options, ${ships.advancement.compartments.length} compartments`)
