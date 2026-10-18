// Builds packs/core/starfinder.json (Starfinder ancestries supplement) from scripts/srd-convert/starfinder/ancestries.json.
// Run: node scripts/srd-convert/build-starfinder-pack.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const src = JSON.parse(readFileSync('scripts/srd-convert/starfinder/ancestries.json', 'utf8'))
const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8'))
const known = new Set([...core.content.ancestries.map((a) => a.id), ...src.ancestries.map((a) => a.id)])
for (const id of [...src.frame.listFirst, ...src.frame.hide]) if (!known.has(id)) throw new Error(`starfinder: unknown ancestry ${id}`)
for (const a of src.ancestries) for (const f of a.features) if (!f.rules || !f.short) throw new Error(`starfinder: ${a.id} ${f.name} needs rules and short`)

const campaignFrames = [{
  id: src.frame.id, name: src.frame.name, frameKind: 'supplement',
  creation: { ops: [
    { op: 'list-ancestries-first', ids: src.frame.listFirst },
    { op: 'hide-ancestries', ids: src.frame.hide },
    { op: 'disable-mixed-ancestry' },
  ] },
}]
const pack = { schemaVersion: 1, id: 'starfinder', name: 'Starfinder Ancestries', version: '1.0.0', publisher: 'Owner (house rules)', extends: ['srd-core'], content: { ancestries: src.ancestries.map((a) => ({ ...a, onlyWith: src.frame.id })), campaignFrames } }
writeFileSync('packs/core/starfinder.json', JSON.stringify(pack, null, 2) + '\n')
console.log(`starfinder pack: ${src.ancestries.length} ancestries, ${campaignFrames.length} supplement`)
