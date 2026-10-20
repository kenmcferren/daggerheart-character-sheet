// Moves each frame's `pools` (weapons, armor, consumables) out of packs/core/srd-frames.json into
// packs/core/<frame>-armaments.json. Run after build-frame-pack.mjs (idempotent: frames without `pools` are skipped).
// The armaments pack overrides the frame's `pools`; the frame's ops stay in srd-frames.json:
//   replace-pool = the frame's list replaces the core list; add-to-pool = it supplements the core list.
import { readFileSync, writeFileSync } from 'node:fs'

const file = 'packs/core/srd-frames.json'
const pack = JSON.parse(readFileSync(file, 'utf8'))
for (const f of pack.content.campaignFrames) {
  if (!f.pools) continue
  const id = `${f.id}-armaments`
  const out = { schemaVersion: 1, id, name: `${f.name} (weapons and armor)`, version: pack.version, publisher: pack.publisher, extends: [pack.id, 'srd-armaments'], overrides: { campaignFrames: { [f.id]: { pools: f.pools } } } }
  writeFileSync(`packs/core/${id}.json`, JSON.stringify(out, null, 2) + '\n')
  delete f.pools
  console.log(`${id}: ${Object.entries(out.overrides.campaignFrames[f.id].pools).map(([k, v]) => `${k} ${v.length}`).join(', ')}`)
}
writeFileSync(file, JSON.stringify(pack, null, 2) + '\n')
