// Builds packs/core/starfinder.json (Starfinder ancestries and communities supplements) from
// scripts/srd-convert/starfinder/ancestries.json and communities.json.
// Run: node scripts/srd-convert/build-starfinder-pack.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const src = JSON.parse(readFileSync('scripts/srd-convert/starfinder/ancestries.json', 'utf8'))
const com = JSON.parse(readFileSync('scripts/srd-convert/starfinder/communities.json', 'utf8'))
const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const known = new Set([...core.content.ancestries.map((a) => a.id), ...src.ancestries.map((a) => a.id)])
for (const id of [...src.frame.listFirst, ...src.frame.hide]) if (!known.has(id)) throw new Error(`starfinder: unknown ancestry ${id}`)
for (const a of src.ancestries) for (const f of a.features) if (!f.rules || !f.short) throw new Error(`starfinder: ${a.id} ${f.name} needs rules and short`)
const comIds = new Set(com.communities.map((c) => c.id))
for (const id of com.frame.listFirst) if (!comIds.has(id)) throw new Error(`starfinder: unknown community ${id}`)
for (const c of com.communities) {
  if (!c.description || c.features.length !== 1) throw new Error(`starfinder: ${c.id} needs a description and one feature`)
  for (const f of c.features) if (!f.rules || !f.short) throw new Error(`starfinder: ${c.id} ${f.name} needs rules and short`)
}

const GROUP = 'Starheart - Starfinder Conversion'
const campaignFrames = [{
  id: src.frame.id, name: src.frame.name, frameKind: 'supplement', group: GROUP,
  creation: { ops: [
    { op: 'list-ancestries-first', ids: src.frame.listFirst },
    { op: 'hide-ancestries', ids: src.frame.hide },
    { op: 'disable-mixed-ancestry' },
  ] },
}, {
  id: com.frame.id, name: com.frame.name, frameKind: 'supplement', group: GROUP,
  creation: { ops: [{ op: 'list-communities-first', ids: com.frame.listFirst }] },
}, {
  // Gear lists live in starfinder-armaments.json (build-starfinder-armaments.mjs), which supplies this frame's `pools`.
  id: 'starfinder-armaments', name: 'Starfinder Weapons and Armor', frameKind: 'supplement', group: GROUP,
  creation: { ops: [{ op: 'replace-pool', pool: 'weapons', with: 'pools.weapons' }, { op: 'replace-pool', pool: 'armor', with: 'pools.armor' }] },
}]
const pack = { schemaVersion: 1, id: 'starfinder', name: 'Starfinder', version: '1.1.0', publisher: 'Owner (house rules)', extends: ['srd-core'], content: { ancestries: src.ancestries.map((a) => ({ ...a, onlyWith: src.frame.id })), communities: com.communities.map((c) => ({ ...c, onlyWith: com.frame.id })), campaignFrames } }
writeFileSync('packs/core/starfinder.json', JSON.stringify(pack, null, 2) + '\n')
console.log(`starfinder pack: ${src.ancestries.length} ancestries, ${com.communities.length} communities, ${campaignFrames.length} supplements`)
