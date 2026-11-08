// Starheart ship power model (Series 14). Expected HP marked per use of a ship card.
// Usage: node scripts/starheart-ship-power.mjs [--system Weapons] [--fear 3] [--tokens 3] [--stress 2] [--targets 2] [--ticks 2]
// Assumptions (see Docs/starheart-ships/batches/batch-1.md):
//   Tier 1 pilot: Proficiency 1, trait +2; target Difficulty 12, thresholds 6/12 (SRD Tier 1 adversary averages).
//   Tier 2 pilot: Proficiency 3, trait +3; target Difficulty 14, thresholds 11/22 (SRD Tier 2 adversary averages).
//   Same-size target (no size change). Advantage = +d6, disadvantage = -d6. Doubles = critical: always hits, adds max dice.
//   Damage below the Major threshold marks 1 HP, Major 2, Severe 3; 0 damage marks nothing.
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []))
const FEAR = +(args.fear ?? 3), TOKENS = +(args.tokens ?? 3), STRESS = +(args.stress ?? 2), TARGETS = +(args.targets ?? 2), TICKS = +(args.ticks ?? 2)
const TIERS = { T1: { prof: 1, mod: 2, diff: 12, thr: [6, 12] }, T2: { prof: 3, mod: 3, diff: 14, thr: [11, 22] } }

const conv = (a, b) => { const r = new Map(); for (const [x, p] of a) for (const [y, q] of b) r.set(x + y, (r.get(x + y) ?? 0) + p * q); return r }
const die = (s) => new Map(Array.from({ length: s }, (_, i) => [i + 1, 1 / s]))
function dmgDist(n, s, flat) { let d = new Map([[flat, 1]]); for (let i = 0; i < n; i++) d = conv(d, die(s)); return d }
const hp = (d, thr) => (d <= 0 ? 0 : d < thr[0] ? 1 : d < thr[1] ? 2 : 3)
function eHP(dist, thr, bonus = 0) { let e = 0; for (const [d, p] of dist) e += p * hp(d + bonus, thr); return e }

// Hit and crit chance for 2d12 + mod (+/- d6) against a Difficulty.
function roll(mod, diff, adv = 0) {
  let hit = 0, crit = 0
  const extra = adv === 0 ? [[0, 1]] : Array.from({ length: 6 }, (_, i) => [adv * (i + 1), 1 / 6])
  for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) for (const [x, px] of extra) {
    const p = px / 144
    if (a === b) crit += p
    else if (a + b + mod + x >= diff) hit += p
  }
  return { hit, crit }
}

// One damage packet: { n: 'P' | number, s, flat }. Returns expected HP on a normal hit and on a critical.
function packet(t, pk) {
  const n = pk.n === 'P' ? t.prof : pk.n
  const normal = dmgDist(n, pk.s, pk.flat ?? 0)
  return { normal: eHP(normal, t.thr, pk.bonus ?? 0), crit: eHP(normal, t.thr, (pk.bonus ?? 0) + n * pk.s), auto: eHP(normal, t.thr, pk.bonus ?? 0) }
}

// Card models. roll: 'attack' (vs target Difficulty) | number (fixed Difficulty) | 'none' (no roll).
// on: damage packet on a hit; targets: how many ships it hits; ticks: repeat packets with no roll after a hit; extraHP: flat HP added on a hit.
const P = 'P'
const CARDS = [
  // Flesh
  { name: 'Spearhead Charge', dom: 'Flesh', on: { n: P, s: 8 }, lockAdv: true, note: 'Far; moves you to Melee' },
  { name: 'Flechette Spines', dom: 'Flesh', cost: '1 Hope', targets: TARGETS, on: { n: 0, s: 1, flat: 1 }, inflict: '1 Stress each', note: 'Close, all targets; Hope back if it disables' },
  { name: 'Leeching Strike', dom: 'Flesh', on: { n: P, s: 4, flat: 3 }, note: 'Melee; clear a Stress if they mark HP' },
  { name: 'Engulf', dom: 'Flesh', cost: '1 Hope', on: { n: 0, s: 1, flat: 0 }, ticks: { n: P, s: 6 }, note: `Close, size <= yours; no damage on hit, then ${TICKS} ticks of Pd6; controls target` },
  // Mind
  { name: 'Tracer Fire', dom: 'Mind', on: { n: P, s: 6, flat: 4 }, note: 'Far; Lock or +1 Analysis Token on hit' },
  { name: 'Breaching Curse', dom: 'Mind', needsLock: true, on: { n: 2, s: 6, extra: { n: TOKENS, s: 6 } }, cost: `${TOKENS} Analysis Tokens spent`, note: 'Close; 2d6 + 1d6 per token spent, no Proficiency' },
  { name: 'Eldritch Lance (free)', dom: 'Mind', on: { n: P, s: 6 }, lockOn: { n: P, s: 6, flat: 4 }, note: 'Far; With Lock +4' },
  { name: 'Eldritch Lance (Stress)', dom: 'Mind', cost: '1 Stress', on: { n: P, s: 10, flat: 6 }, lockOn: { n: P, s: 10, flat: 10 }, note: 'Far; With Lock +4 (Pd10+10)' },
  { name: 'Eldritch Lance (Stress, Lock Pd10+12)', dom: 'Mind', cost: '1 Stress', on: { n: P, s: 10, flat: 6 }, lockOn: { n: P, s: 10, flat: 12 }, note: 'owner alternative: With Lock Pd10+12' },
  // Void
  { name: 'Spacetime Chasm', dom: 'Void', cost: 'GM +1 Fear; 1/Refuel', targets: TARGETS, on: { n: P, s: 8, flat: 2 }, inflict: '1 Stress each', note: 'line damage on a hit; no range given' },
  { name: 'Entropic Beam', dom: 'Void', on: { n: P, s: 10, flat: 4 }, note: 'Close, Forward Facing; optional Stress: they mark Stress, Difficulty -1 for scene' },
  { name: 'Tether', dom: 'Energy', on: { n: P, s: 4 }, lockAdv: true, note: 'Melee; Stress swing if they mark HP' },
  { name: 'Null Sphere', dom: 'Void', cost: '1 Stress', roll: 15, targets: TARGETS, on: { n: P, s: 6, flat: 4 }, note: 'Far point, Very Close area; Restrained if 2+ HP' },
  { name: 'Blacklight Laser', dom: 'Void', on: { n: P, s: 6, flat: 4 }, lockOn: { n: P, s: 6, flat: 4 + FEAR }, note: `Far; With Lock + Fear pool (${FEAR})` },
  { name: 'Annihilation Beam', dom: 'Void', cost: '1 Hope; 1/Refuel', on: { n: FEAR, s: 8 }, note: `Very Far; ${FEAR}d8 (Fear pool), no Proficiency` },
  // Energy
  { name: 'Plasma Caster (no token)', dom: 'Energy', adv: -1, on: { n: P, s: 6 }, lockAdvCancel: true, inflict: '1 Stress per ship on the line', note: 'Far; disadvantage unless Locked' },
  { name: 'Plasma Caster (Power)', dom: 'Energy', cost: '1 Power', adv: -1, on: { n: P, s: 6, extra: { n: 1, s: 6, flat: 10 } }, lockAdvCancel: true, inflict: '1 Stress per ship on the line', note: '1d6+10 to each adversary on the line you succeed against (target only counted)' },
  { name: 'Volley Fire', dom: 'Energy', cost: '1 Stress or 1 Power', targets: TARGETS, on: { n: 2, s: 6 }, note: 'Close, all targets; 2d6 flat' },
  { name: 'Erratic Pulse', dom: 'Energy', on: { n: P, s: 8, flat: 4 }, note: 'Close; Power (free With Lock): Vulnerable' },
  { name: 'Jamming Blast (Power)', dom: 'Energy', cost: '1 Power', on: { n: P, s: 6 }, lockAdv: true, note: 'Far; Jammed (disadvantage on attacks) even without Power' },
  { name: 'Fire Gout', dom: 'Energy', cost: '1 HP, gain 1 Power', targets: TARGETS, on: { n: P, s: 6, flat: 4 }, inflict: 'Burning: 1 Stress per their spotlight', note: 'Melee, roll against each target' },
  { name: 'Warp Cascade', dom: 'Void', cost: '1 Stress', on: { n: P, s: 10, flat: 4 }, note: 'teleport Far, then Very Close attack; Restrained' },
  // Metal
  { name: 'Plutonium Railgun', dom: 'Metal', cost: '2 Reload (3 held)', on: { n: P, s: 10, flat: 4 }, lockAdv: true, note: 'Far; owner change d10+4 -> Pd10+4' },
  { name: 'Gatling Autoturret', dom: 'Metal', cost: '1 Reload (4 held)', on: { n: P, s: 4, flat: 6 }, note: 'reaction when a ship enters Very Close; owner change d4+6 -> Pd4+6' },
  { name: 'Seeking Missile', dom: 'Metal', cost: '3 Reload (3 held)', needsLock: true, roll: 'none', on: { n: 0, s: 1 }, sought: { n: P, s: 12 }, note: `no roll to apply; then a Weapons roll each of their spotlights (${TICKS})` },
  { name: 'Ramming Cap', dom: 'Metal', on: { n: P, s: 8 }, note: 'Close -> Melee; optional 1 HP for 1 HP trade; +1 Weapons HP' },
  // Glass
  { name: 'Destructive Scan', dom: 'Glass', on: { n: P, s: 6 }, note: 'Very Far; optional Stress: Lock' },
  { name: 'Dissection Ray', dom: 'Glass', needsStudied: true, on: { n: P, s: 4, flat: 6 }, lockOn: { n: P, s: 8, flat: 6 }, twoPlus: true, note: 'Studied Target only; +1 HP if 2+ HP' },
  { name: 'Resonant Echo', dom: 'Glass', cost: `${STRESS} Stress (max 3; Hope to clear)`, studiedAdv: true, on: { n: 2, s: 8, extra: { n: STRESS, s: 8 } }, note: `Close; 2d8 + 1d8 per Stress (${STRESS}), no Proficiency` },
  { name: 'Critical Point Tracking (+ Destructive Scan)', dom: 'Glass', needsLock: true, needsStudied: true, on: { n: P, s: 6, extra: { n: 2, s: 6 } }, note: 'passive +2d6 shown on a Pd6 attack (Destructive Scan alone: see its row)' },
]

function evaluate(card, t, withLock) {
  if (!card.on) return 0
  const adv = (card.adv ?? 0) + ((withLock && card.lockAdv) || card.studiedAdv ? 1 : 0) + (withLock && card.lockAdvCancel ? 1 : 0)
  const pk = withLock && card.lockOn ? card.lockOn : card.on
  const n = pk.n === 'P' ? t.prof : pk.n
  // Combine main packet and extra dice into one distribution.
  let dist = dmgDist(n, pk.s, pk.flat ?? 0)
  let maxDice = n * pk.s
  if (pk.extra) { const en = pk.extra.n === 'P' ? t.prof : pk.extra.n; dist = conv(dist, dmgDist(en, pk.extra.s, pk.extra.flat ?? 0)); maxDice += en * pk.extra.s }
  const onHit = (bonus) => { let e = 0; for (const [d, p] of dist) { let h = hp(d + bonus, t.thr); if (card.twoPlus && h >= 2) h += 1; e += p * h } return e }
  let r
  if (card.roll === 'none') r = { hit: 1, crit: 0 }
  else r = roll(t.mod, typeof card.roll === 'number' ? card.roll : t.diff, Math.max(-1, Math.min(1, adv)))
  let e = r.hit * onHit(0) + r.crit * onHit(maxDice)
  if (card.missAuto) e += (1 - r.hit - r.crit) * packet(t, card.missAuto).auto
  const pHit = r.hit + r.crit
  if (card.ticks) e += pHit * TICKS * packet(t, card.ticks).auto
  if (card.sought) { const rr = roll(t.mod, t.diff, 0); const s = packet(t, card.sought); e += TICKS * (rr.hit * s.normal + rr.crit * s.crit) }
  return e * (card.targets ?? 1)
}

const sys = args.system ?? 'Weapons'
const rows = CARDS.map((c) => ({ c, t1: evaluate(c, TIERS.T1, false), t2: evaluate(c, TIERS.T2, false), t1L: c.lockOn || c.lockAdv || c.lockAdvCancel ? evaluate(c, TIERS.T1, true) : null, t2L: c.lockOn || c.lockAdv || c.lockAdvCancel ? evaluate(c, TIERS.T2, true) : null }))
const free = rows.filter((r) => !r.c.cost && !r.c.needsLock && !r.c.needsStudied && !r.c.targets && r.c.on && r.c.on.n === 'P').map((r) => r)
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2 }
const b1 = med(free.map((r) => r.t1)), b2 = med(free.map((r) => r.t2))
const f = (x) => (x == null ? '' : x.toFixed(2))
console.log(`${sys} cards. Benchmark = median of free single-target Pd cards (${free.map((r) => r.c.name).join(', ')}): T1 ${b1.toFixed(2)} HP, T2 ${b2.toFixed(2)} HP per use.`)
console.log(`Assumptions: Fear pool ${FEAR}, tokens held ${TOKENS}, Stress spent ${STRESS}, area targets ${TARGETS}, ticks ${TICKS}.\n`)
console.log('| Card | Domain | Cost | T1 HP | T1 x | With Lock T1 | T2 HP | T2 x | With Lock T2 | Also | Notes |')
console.log('| :-- | :-- | :-- | :-: | :-: | :-: | :-: | :-: | :-: | :-- | :-- |')
for (const r of rows) console.log(`| ${r.c.name} | ${r.c.dom} | ${r.c.cost ?? ''}${r.c.needsLock ? ' (needs Lock)' : ''}${r.c.needsStudied ? ' (needs Studied Target)' : ''} | ${f(r.t1)} | ${f(r.t1 / b1)} | ${f(r.t1L)} | ${f(r.t2)} | ${f(r.t2 / b2)} | ${f(r.t2L)} | ${r.c.inflict ?? ''} | ${r.c.note ?? ''} |`)
