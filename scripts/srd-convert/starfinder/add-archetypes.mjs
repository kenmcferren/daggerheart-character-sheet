// One-off (Series 15): writes the ship archetypes into scripts/srd-convert/starfinder/ships.json from the owner's list
// (Docs/starheart-ships/ship-archetypes-source.md), reworded with the ship keywords and print markup (**bold** keywords and costs,
// *italic* conditions the text defines). After this run, hand-edit ships.json; rerunning replaces `archetypes`.
// Owner rulings 2026-11-08: Elemental chooses a damage type each Refuel (SRD resistance); Necromancer's HP clear works on that ship or the
// Necromancer's own; Alchemist gains its token only on a success with Hope; Champion's redirect stays unlimited; Golem and Hydra unchanged; character tier = the pilot's tier;
// "Hydra" is the spelling; Specter has one feature on purpose.
// Run: node scripts/srd-convert/starfinder/add-archetypes.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const P = 'scripts/srd-convert/starfinder/ships.json'
const data = JSON.parse(readFileSync(P, 'utf8'))

const A = [
  ['Leviathan', 'flesh', 'mind', [
    'While you have any Hope, gain +1 to all system Action Rolls.',
    'While you have no Hope, gain +1 to all system Reaction Rolls.']],
  ['Necromancer', 'flesh', 'void', [
    'Once per scene, as a reaction, when a ship within Very Close range becomes **Disabled**, you can **spend a Hope** to clear 1 HP on that ship or on your own ship.',
    'Once per scene, you can **spend a GM Fear** as though it were your own Hope.']],
  ['Drake', 'flesh', 'energy', [
    'When you damage an enemy within Very Close range, gain a **Power Token**.',
    'Once per spotlight, you can **spend 2 Power Tokens** in place of 1 Hope.']],
  ['Champion', 'flesh', 'metal', [
    'Once per scene, when you mark a single Hull Point, you can **spend a Hope** instead.',
    'When an ally within Very Close range would take damage from a direct attack, you can take that damage instead, as a reaction.']],
  ['Direwolf', 'flesh', 'glass', [
    'Once per scene, when your **Studied Target** becomes **Disabled**, gain 3 Hope. Choose a new Studied Target immediately.']],
  ['Wraith', 'mind', 'void', [
    'If you have no **Analysis Tokens**, gain an Analysis Token when the GM spends a Fear to activate an adversary.',
    'Before a ship system roll, you can **discard all Analysis Tokens** to gain a bonus to the roll equal to the number discarded.']],
  ['Elemental', 'mind', 'energy', [
    'Once per spotlight, you can convert an **Analysis Token** to a **Power Token**, or a Power Token to an Analysis Token.',
    'Each **Refuel**, choose a damage type. **Spend a Power Token** to gain resistance to that damage type against one instance of damage.']],
  ['Golem', 'mind', 'metal', [
    'When you mark any number of HP from an adversary\'s attack, gain 1 **Analysis Token**.',
    'When you would take damage, you can **discard any number of Analysis Tokens** to reduce the damage by your pilot\'s tier for each token discarded.']],
  ['Alchemist', 'mind', 'glass', [
    'Before you make an Action Roll against your **Studied Target**, you can **spend up to 3 Analysis Tokens**. For each token spent, choose a different benefit: (A) convert the damage type to any damage type; (B) increase the attack\'s Proficiency by 1; (C) extend the attack\'s range by one band, to a maximum of Very Far.',
    'When an Action Roll against your Studied Target succeeds with Hope, gain an **Analysis Token**.']],
  ['Specter', 'void', 'energy', [
    '**Spend 3 Power Tokens** to become *transdimensional* until the start of your next spotlight. While transdimensional, you can move through solid objects, take no damage, and cannot cause damage. If you end this state in contact with a physical object, mark 3 HP and a Stress and place your ship adjacent to it.']],
  ['Revenant', 'void', 'metal', [
    'When you mark any number of Hull Points, you can also refill one card\'s **Reload Tokens**.',
    'Your Proficiency increases by the number of your systems that are **Breached**.']],
  ['Lich', 'void', 'glass', [
    'While you are within Close range of your **Studied Target**, each time the GM spends a Fear to spotlight it, they must also mark an unmarked Stress on it.',
    'Once per **Refuel**, clear Stress equal to the GM\'s Fear pool.']],
  ['Phoenix', 'energy', 'metal', [
    'When you mark any number of HP, gain that many **Power Tokens**.',
    'Once per spotlight, when you would mark HP, **spend 3 Power Tokens** to reduce the number by 1.']],
  ['Raiju', 'energy', 'glass', [
    '**Spend 2 Power Tokens** to move a Far distance directly toward your **Studied Target** before making an Action Roll. If this roll deals damage to your target, it also marks a Stress. **With Lock:** up to Very Far instead.',
    'When you move closer to your Studied Target, or it moves closer to you, gain a **Power Token**.']],
  ['Hydra', 'metal', 'glass', [
    'If your attack against your **Studied Target** would fail, **mark a Hull Point** to make it succeed with Fear instead.',
    'Once per **Refuel**, when your Studied Target marks Hull Points within Very Close range, clear a number of the Hull Points it marked.']],
]

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const known = new Set(data.domains.map((d) => d.id))
data.archetypes = A.map(([name, d1, d2, features]) => {
  if (!known.has(d1) || !known.has(d2)) throw new Error(`add-archetypes: unknown domain in ${name}`)
  const text = features.join(' ')
  const tokens = ['analysis', 'power'].filter((t) => new RegExp(`\\b${t} tokens?\\b`, 'i').test(text))
  return { id: slug(name), name, domains: [d1, d2], features, ...(tokens.length ? { tokens } : {}) }
})
// 6 domains give 15 pairs; every pair exactly once.
const pairs = new Set(data.archetypes.map((a) => [...a.domains].sort().join('+')))
if (pairs.size !== 15 || data.archetypes.length !== 15) throw new Error('add-archetypes: need all 15 domain pairs once')

// Keep the new key next to `domains`.
const out = {}
for (const [k, v] of Object.entries(data)) { if (k === 'archetypes') continue; out[k] = v; if (k === 'domains') out.archetypes = data.archetypes }
writeFileSync(P, JSON.stringify(out, null, 2) + '\n')
console.log(`ships.json: ${data.archetypes.length} archetypes`)
