// Starheart ship defense yardstick (Series 14). How much an Evasion bonus, resistance or extra HP is worth to a PC ship.
// Usage: node scripts/starheart-ship-defense.mjs [--attacks 8]
// Incoming attacks: every Tier 1 / Tier 2 SRD adversary's standard attack (d20 + ATK against Evasion; a 20 always hits).
// Damage is converted with the frame's thresholds (below Major 1 HP, Major 2, Severe 3). Same-size attacker.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []))
const ATTACKS = +(args.attacks ?? 8) // incoming attacks per scene (4 rounds x 2)
const FRAMES = { Bare: { ev: 15, thr: [7, 16] }, Standard: { ev: 13, thr: [9, 20] }, Plated: { ev: 11, thr: [11, 24] }, Bulky: { ev: 9, thr: [13, 28] } }
const root = 'Daggerheart SRD Files/Adversaries'

function attacks(tier) {
  const out = []
  for (const f of readdirSync(join(root, `Tier ${tier}`))) {
    const m = readFileSync(join(root, `Tier ${tier}`, f), 'utf8').match(/\*\*ATK:\*\* ([+-]\d+) \| [^|]+\| (\d*)d(\d+)(?:\+(\d+))?/)
    if (m) out.push({ atk: +m[1], n: +(m[2] || 1), s: +m[3], flat: +(m[4] || 0) })
  }
  return out
}
const conv = (a, b) => { const r = new Map(); for (const [x, p] of a) for (const [y, q] of b) r.set(x + y, (r.get(x + y) ?? 0) + p * q); return r }
function dist(n, s, flat) { let d = new Map([[flat, 1]]); for (let i = 0; i < n; i++) d = conv(d, new Map(Array.from({ length: s }, (_, k) => [k + 1, 1 / s]))); return d }
const hp = (d, thr) => (d <= 0 ? 0 : d < thr[0] ? 1 : d < thr[1] ? 2 : 3)

// Expected HP per incoming attack, with an Evasion bonus and a damage multiplier (0.5 = resistance).
function perAttack(list, frame, evBonus = 0, mult = 1) {
  let total = 0
  for (const a of list) {
    const dd = dist(a.n, a.s, a.flat)
    let pHit = 0
    for (let r = 1; r <= 20; r++) if (r === 20 || r + a.atk >= frame.ev + evBonus) pHit += 1 / 20
    let e = 0
    for (const [d, p] of dd) e += p * hp(Math.floor(d * mult), frame.thr)
    total += pHit * e
  }
  return total / list.length
}

for (const tier of [1, 2]) {
  const list = attacks(tier)
  const avgAtk = list.reduce((s, a) => s + a.atk, 0) / list.length
  console.log(`\nTier ${tier}: ${list.length} adversary attacks, mean ATK +${avgAtk.toFixed(1)}. ${ATTACKS} incoming attacks per scene.`)
  console.log('| Frame | HP per attack | per scene | +1 Evasion saves | +2 Evasion saves | resistance saves |')
  console.log('| :-- | :-: | :-: | :-: | :-: | :-: |')
  for (const [name, fr] of Object.entries(FRAMES)) {
    const base = perAttack(list, fr)
    const s = (x) => (ATTACKS * (base - x)).toFixed(2)
    console.log(`| ${name} | ${base.toFixed(2)} | ${(ATTACKS * base).toFixed(2)} | ${s(perAttack(list, fr, 1))} | ${s(perAttack(list, fr, 2))} | ${s(perAttack(list, fr, 0, 0.5))} |`)
  }
}
console.log('\n"saves" = HP not marked per scene if every incoming attack is affected. Scale down for partial uptime (one attacker, one damage type).')
