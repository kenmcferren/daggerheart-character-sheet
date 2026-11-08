// Starheart ship combo check (Series 14, Batch 5). Expected HP per use for stacked cards, against the Weapons benchmark.
// Usage: node scripts/starheart-ship-combos.mjs > Docs/starheart-ships/reports/combos.md
// Same model as starheart-ship-power.mjs: 2d12 + mod vs Difficulty, advantage +d6, doubles crit (max dice added),
// below Major 1 HP, Major 2, Severe 3. Tier 1: Prof 1, +2, Diff 12, 6/12. Tier 2: Prof 3, +3, Diff 14, 11/22.
const TIERS = { T1: { prof: 1, mod: 2, diff: 12, thr: [6, 12], bench: 1.17 }, T2: { prof: 3, mod: 3, diff: 14, thr: [11, 22], bench: 1.39 } }
const conv = (a, b) => { const r = new Map(); for (const [x, p] of a) for (const [y, q] of b) r.set(x + y, (r.get(x + y) ?? 0) + p * q); return r }
const dice = (n, s, flat = 0) => { let d = new Map([[flat, 1]]); for (let i = 0; i < n; i++) d = conv(d, new Map(Array.from({ length: s }, (_, k) => [k + 1, 1 / s]))); return d }
const hp = (d, thr) => (d <= 0 ? 0 : d < thr[0] ? 1 : d < thr[1] ? 2 : 3)
function roll(mod, diff, adv = 0) {
  let hit = 0, crit = 0
  const extra = adv === 0 ? [[0, 1]] : Array.from({ length: 6 }, (_, i) => [adv * (i + 1), 1 / 6])
  for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) for (const [x, px] of extra) {
    if (a === b) crit += px / 144
    else if (a + b + mod + x >= diff) hit += px / 144
  }
  return { hit, crit }
}
// parts: [[n|'P', sides, flat]]; opts: adv, twoPlus (+1 HP if 2+), sizeUp (+1 HP marked), noRoll
function use(t, parts, opts = {}) {
  let dist = new Map([[0, 1]]), max = 0
  for (const [n0, s, flat = 0] of parts) { const n = n0 === 'P' ? t.prof + (opts.profUp ?? 0) : n0; dist = conv(dist, dice(n, s, flat)); max += n * s }
  const onHit = (bonus) => { let e = 0; for (const [d, p] of dist) { let h = hp(d + bonus, t.thr); if (opts.twoPlus && h >= 2) h++; if (opts.sizeUp && h > 0) h++; e += p * h } return e }
  if (opts.noRoll) return onHit(0)
  const r = roll(t.mod, t.diff, opts.adv ?? 0)
  return r.hit * onHit(0) + r.crit * onHit(max)
}
const rows = []
const add = (name, cost, f, note = '') => rows.push({ name, cost, t1: f(TIERS.T1), t2: f(TIERS.T2), note })

// Baseline
add('Benchmark (median free Pd card)', '', (t) => t.bench, 'from power-weapons.md')
// A. Dissection Ray stack
add('Dissection Ray, Studied only', '', (t) => use(t, [['P', 4, 6]], { twoPlus: true }))
add('Dissection Ray, Studied + Lock', '', (t) => use(t, [['P', 8, 6]], { twoPlus: true }))
add('Dissection Ray + Critical Point Tracking (Lock)', '', (t) => use(t, [['P', 8, 6], [2, 6]], { twoPlus: true }), 'two cards')
add('Eldritch Lance (Stress, Lock) + Critical Point Tracking', '1 Stress', (t) => use(t, [['P', 10, 10], [2, 6]]), 'needs Studied Target too')
add('Resonant Echo, 3 Stress, Studied (adv) + Lock (size up)', '3 Stress', (t) => use(t, [[5, 8]], { adv: 1, sizeUp: true }))
add('Resonant Echo, 3 Stress, Studied + Lock + Critical Point Tracking', '3 Stress', (t) => use(t, [[5, 8], [2, 6]], { adv: 1, sizeUp: true }), 'three Glass/Weapons cards')
// B. Critical Point Tracking on repeating damage
add('Seeking Missile tick (no roll on apply; Reaction Roll each tick)', '3 Reload / 2 ticks', (t) => 2 * use(t, [['P', 12]]))
add('Seeking Missile ticks + Critical Point Tracking', '3 Reload / 2 ticks', (t) => 2 * use(t, [['P', 12], [2, 6]]))
add('Engulf ticks (Pd6, no roll) x2', '1 Hope', (t) => 2 * use(t, [['P', 6]], { noRoll: true }))
add('Engulf ticks + Critical Point Tracking x2', '1 Hope', (t) => 2 * use(t, [['P', 6], [2, 6]], { noRoll: true }))
// C. Vulnerable / advantage on an ally's benchmark-style attack (Pd8+4 stands in for a typical card)
add('Ally attack Pd8+4, no advantage', '', (t) => use(t, [['P', 8, 4]]))
add('Ally attack Pd8+4, with advantage (Vulnerable)', '', (t) => use(t, [['P', 8, 4]], { adv: 1 }))
// D. Gravitational Lens Drive (+1 Proficiency)
add('Ally attack Pd8+4, +1 Proficiency (Lens Drive)', '', (t) => use(t, [['P', 8, 4]], { profUp: 1 }))
// E. Electrified Field (+1d8)
add('Ally attack Pd8+4, +1d8 (Electrified Field)', '', (t) => use(t, [['P', 8, 4], [1, 8]]))

console.log('# Ship combo check (Batch 5)\n')
console.log('Made by `node scripts/starheart-ship-combos.mjs`. Expected HP marked per use against a same-size target. x = times the Weapons benchmark (T1 1.17, T2 1.39).\n')
console.log('| Combo | Cost | T1 HP | T1 x | T2 HP | T2 x | Note |')
console.log('| :-- | :-- | :-: | :-: | :-: | :-: | :-- |')
for (const r of rows) console.log(`| ${r.name} | ${r.cost} | ${r.t1.toFixed(2)} | ${(r.t1 / TIERS.T1.bench).toFixed(2)} | ${r.t2.toFixed(2)} | ${(r.t2 / TIERS.T2.bench).toFixed(2)} | ${r.note} |`)
