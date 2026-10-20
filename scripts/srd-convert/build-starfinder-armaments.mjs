// Builds packs/core/starfinder-armaments.json from scripts/srd-convert/starfinder/armaments-armor.csv
// and Docs/armaments-weapons.csv (owner's working file; only tiers up to MAX_WEAPON_TIER are imported). The pack supplies the `pools` of the starfinder-armaments supplement, whose
// replace-pool ops (in starfinder.json) make these lists replace the core lists.
// Run after build-starfinder-pack.mjs: node scripts/srd-convert/build-starfinder-armaments.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Minimal CSV reader: quoted fields may hold commas and "" escapes.
function csv(text) {
  const rows = []
  let row = [], cur = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cur); cur = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((x) => x !== '')) rows.push(row); row = [] }
    else cur += c
  }
  row.push(cur); if (row.some((x) => x !== '')) rows.push(row)
  const [head, ...body] = rows
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

// Feature text: capitalise the start of each sentence (including after "Name: ") and end sentences with a period.
// Pure stat modifiers ("Heavy: -1 to Evasion") keep the SRD's bare style.
const tidy = (t) => {
  let x = t.replace(/^([^:]+: )([a-z])/, (_, a, c) => a + c.toUpperCase()).replace(/([.!?] )([a-z])/g, (_, a, c) => a + c.toUpperCase())
  if (!/[.!?)]$/.test(x) && !/^[^:]+: [+-]/.test(x)) x += '.'
  return x
}
const fail = (m) => { throw new Error(`starfinder-armaments: ${m}`) }
const num = (v, what, name) => { const n = Number(v); if (v === '' || !Number.isInteger(n) || n < 0) fail(`${name}: bad ${what} "${v}"`); return n }

const armor = csv(readFileSync('scripts/srd-convert/starfinder/armaments-armor.csv', 'utf8').replace(/^\uFEFF/, '')).map((r) => {
  if (!r.name) fail('armor row without a name')
  const tier = num(r.tier, 'tier', r.name)
  if (tier < 1 || tier > 4) fail(`${r.name}: tier ${tier} outside 1-4`)
  return { id: slug(r.name), name: r.name, tier, majorThreshold: num(r.majorThreshold, 'majorThreshold', r.name), severeThreshold: num(r.severeThreshold, 'severeThreshold', r.name), armorScore: num(r.armorScore, 'armorScore', r.name), ...(r.feature ? { feature: tidy(r.feature) } : {}) }
})
const ids = armor.map((a) => a.id)
if (new Set(ids).size !== ids.length) fail(`duplicate armor id ${ids.find((x, i) => ids.indexOf(x) !== i)}`)

// ---- Weapons. Tier 3 and 4 are still in progress in the CSV, so they are skipped until MAX_WEAPON_TIER is raised.
const MAX_WEAPON_TIER = 2
const WEAPON_SLOTS = ['primary', 'secondary', 'wheelchair']
const TRAITS = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge', 'spellcast']
const RANGES = ['melee', 'very-close', 'close', 'far', 'very-far']
const DAMAGE_TYPES = ['physical', 'magic', 'tech'] // CSV says "magical" for magic
const BURDENS = { 0: 'no-hands', 1: 'one-handed', 2: 'two-handed' }
const title = (n) => n.replace(/(^|[ -])([a-z])/g, (_, p, c) => p + c.toUpperCase())
// Obvious spelling fixes in rules text (owner approved this kind of fix for armor).
const spelling = (t) => t.replace(/profiency/g, 'proficiency').replace(/Versitile/g, 'Versatile')
const csvWeapons = csv(readFileSync('Docs/armaments-weapons.csv', 'utf8').replace(/^﻿/, '')).filter((r) => Number(r.tier) <= MAX_WEAPON_TIER).map((r) => {
  const name = title(r.name)
  const pick = (v, list, what) => { const x = v.toLowerCase().replace(/\s+/g, '-'); if (!list.includes(x)) fail(`${name}: ${what} "${v}" not one of ${list.join(', ')}`); return x }
  const dt = r.damageType.toLowerCase() === 'magical' ? 'magic' : r.damageType.toLowerCase()
  if (!BURDENS[r.burden]) fail(`${name}: burden "${r.burden}" must be 0, 1 or 2`)
  if (!/^d\d+(\+\d+)?$/.test(r.damage)) fail(`${name}: damage "${r.damage}"`)
  return { id: slug(name), name, weaponSlot: pick(r.weaponSlot, WEAPON_SLOTS, 'weaponSlot'), tier: num(r.tier, 'tier', name), trait: pick(r.trait, TRAITS, 'trait'), range: pick(r.range, RANGES, 'range'), damage: r.damage, damageType: pick(dt, DAMAGE_TYPES, 'damageType'), burden: BURDENS[r.burden], ...(r.feature ? { feature: tidy(spelling(r.feature)) } : {}) }
})
// SRD magic weapons (same tiers) are offered too: the Starfinder replace would otherwise drop them. Wheelchair weapons are left out for now.
const srdMagic = JSON.parse(readFileSync('packs/core/srd-armaments.json', 'utf8')).content.equipment
  .filter((e) => e.category === 'weapon' && e.damageType === 'magic' && e.tier <= MAX_WEAPON_TIER && e.weaponSlot !== 'wheelchair')
  .map(({ category, ...w }) => w)
const weapons = [...csvWeapons, ...srdMagic]
const wids = weapons.map((w) => w.id)
if (new Set(wids).size !== wids.length) fail(`duplicate weapon id ${wids.find((x, i) => wids.indexOf(x) !== i)}`)

const pack = { schemaVersion: 1, id: 'starfinder-armaments', name: 'Starfinder (weapons and armor)', version: '1.0.0', publisher: 'Owner (house rules)', extends: ['starfinder', 'srd-armaments'], overrides: { campaignFrames: { 'starfinder-armaments': { pools: { weapons, armor } } } } }
writeFileSync('packs/core/starfinder-armaments.json', JSON.stringify(pack, null, 2) + '\n')
console.log(`starfinder armaments: ${weapons.length} weapons (${csvWeapons.length} Starfinder + ${srdMagic.length} SRD magic; T1 ${weapons.filter((w) => w.tier === 1).length}, T2 ${weapons.filter((w) => w.tier === 2).length}), ${armor.length} armor (${[1, 2, 3, 4].map((t) => `T${t} ${armor.filter((a) => a.tier === t).length}`).join(', ')})`)
