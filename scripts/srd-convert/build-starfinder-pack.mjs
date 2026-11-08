// Builds packs/core/starfinder.json (Starfinder ancestries, communities, consumables, classes and ships supplements) from
// scripts/srd-convert/starfinder/ancestries.json, communities.json, consumables.json, classes.json and ships.json.
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

// Starheart classes (Series 12 design, Series 13 build): hand-edited classes.json, first made by make-classes-json.mjs from v4-final.md.
const cls = JSON.parse(readFileSync('scripts/srd-convert/starfinder/classes.json', 'utf8'))
const domains = new Set(core.content.domains.map((d) => d.id))
const coreClassIds = new Set(core.content.classes.map((c) => c.id))
for (const c of cls.classes) {
  if (coreClassIds.has(c.id)) throw new Error(`starfinder: class ${c.id} clashes with a core class`)
  for (const d of c.domains) if (!domains.has(d)) throw new Error(`starfinder: ${c.id} unknown domain ${d}`)
  for (const f of [c.hopeFeature, ...c.features]) if (!f.name || !f.rules) throw new Error(`starfinder: ${c.id} feature needs name and rules`)
}
for (const s of cls.subclasses) {
  if (!cls.classes.some((c) => c.id === s.class && c.subclasses.includes(s.id))) throw new Error(`starfinder: subclass ${s.id} not listed by ${s.class}`)
  if (s.extraDomain && !domains.has(s.extraDomain)) throw new Error(`starfinder: ${s.id} unknown domain ${s.extraDomain}`)
}

const cons = JSON.parse(readFileSync('scripts/srd-convert/starfinder/consumables.json', 'utf8'))
const stims = cons.startingStims.map((id) => {
  const it = cons.items.find((x) => x.id === id)
  if (!it) throw new Error(`starfinder: unknown starting stim ${id}`)
  return { id: it.id, name: it.name, rules: it.rules }
})

// Starheart ships (Series 14): hand-edited ships.json, first made by make-ships-json.mjs from Docs/starheart-ships/v-final.md.
const { frame: shipFrame, ...ships } = JSON.parse(readFileSync('scripts/srd-convert/starfinder/ships.json', 'utf8'))
{
  const sys = ships.systems.map((s) => s.id), doms = new Set(ships.domains.map((d) => d.id)), ids = new Set()
  for (const c of ships.configurations) {
    const caps = sys.map((s) => c.caps[s])
    if (caps.filter((n) => n === ships.build.primaryCap).length !== 2) throw new Error(`ships: ${c.id} needs exactly two primary systems`)
    if (caps.reduce((a, b) => a + b) < ships.build.cards) throw new Error(`ships: ${c.id} can't hold ${ships.build.cards} cards`)
  }
  for (const c of ships.cards) {
    if (ids.has(c.id)) throw new Error(`ships: duplicate card ${c.id}`)
    ids.add(c.id)
    if (!doms.has(c.domain) || !sys.includes(c.system)) throw new Error(`ships: ${c.id} has unknown domain or system`)
    // Rules carry print markup (**bold** keywords and costs, *italic* card conditions; mark-ship-cards.mjs): it must pair up.
    const bare = c.rules.replace(/\*\*[^*]+\*\*/g, '').replace(/\*[^*]+\*/g, '')
    if (bare.includes('*') || /(?<!in place of the )Spellcast Roll/.test(c.rules)) throw new Error(`ships: ${c.id} has unpaired markup or calls for a Spellcast Roll`)
  }
  for (const d of doms) for (const s of sys) if (!ships.cards.some((c) => c.domain === d && c.system === s)) throw new Error(`ships: no ${d} ${s} cards`)
  for (const s of [ships.startingSizes.flier, ships.startingSizes.hub]) if (!ships.sizes.some((z) => z.size === s)) throw new Error(`ships: unknown starting size ${s}`)
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
}, {
  // Full consumables list (120 items) is in scripts/srd-convert/starfinder/consumables.json: the starting stims plus the inventory picker (`consumables` op, with roll numbers).
  id: 'starfinder-consumables', name: 'Starheart Consumables', frameKind: 'supplement', group: GROUP,
  creation: { ops: [{ op: 'starting-stims', items: stims }, { op: 'consumables', items: cons.items.map(({ id, type, number, name, rules }) => ({ id, type, number, name, rules })) }] },
}, {
  id: cls.frame.id, name: cls.frame.name, frameKind: 'supplement', group: GROUP,
}, {
  // Restricts the class, ancestry and community lists to Starheart ones.
  id: 'starheart-exclusive', name: 'Treat Starheart elements as exclusive', frameKind: 'supplement', group: GROUP,
  creation: { ops: [{ op: 'starheart-exclusive' }] },
}, {
  // Ship rules and the 108 ship domain cards; the ship creator (Series 14) reads this frame's `ships`.
  id: shipFrame.id, name: shipFrame.name, frameKind: 'supplement', group: GROUP, ships,
}]
const pack = { schemaVersion: 1, id: 'starfinder', name: 'Starfinder', version: '1.4.0', publisher: 'Owner (house rules)', extends: ['srd-core'], content: { ancestries: src.ancestries.map((a) => ({ ...a, onlyWith: src.frame.id })), communities: com.communities.map((c) => ({ ...c, onlyWith: com.frame.id })), classes: cls.classes.map((c) => ({ ...c, onlyWith: cls.frame.id })), subclasses: cls.subclasses, campaignFrames } }
writeFileSync('packs/core/starfinder.json', JSON.stringify(pack, null, 2) + '\n')
console.log(`starfinder pack: ${src.ancestries.length} ancestries, ${com.communities.length} communities, ${cls.classes.length} classes, ${campaignFrames.length} supplements, ${stims.length} starting stims, ${ships.cards.length} ship cards`)
