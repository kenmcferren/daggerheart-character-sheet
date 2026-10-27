// Series 12 power model. Usage: node scripts/starheart-power.mjs [--uf1 3.5 --uf2 7 --uptime 0.7 --csv path]
// Expected damage per round (DPR) of one character in a 4-round fight against one Tier-typical adversary,
// for a core baseline and for the Starheart classes' damage-relevant features at Tier 1 (level 1) and
// Tier 2 (level 5, specialization unlocked). Assumptions are listed in reports/power-model.md.
// Ally buffs and extra ally attacks are counted as party damage ("party"), conditional effects get an uptime factor.
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const UF = { 1: arg('uf1', 3.5), 2: arg('uf2', 7) };   // typical core class damage feature, per hit
const U = arg('uptime', 0.7);                           // uptime of conditional effects (ally in range, enemy cluster, etc.)
const TPROF = process.argv.includes('--tprof');   // weapons that use a Trait as Proficiency (Hammer T1, Phase Cutlass T2)
const TUNE = new Set((process.argv.includes('--tune') ? process.argv[process.argv.indexOf('--tune') + 1] : '').split(',').filter(Boolean));  // sq2,prec2,gb,pc2,ow2,ph2
const ALLIES = 3, ROUNDS = 4, STRESS_PER_ROUND = 0.75, START_HOPE = 2;

// Tier parameters. T1 = level 1 character, T2 = level 5 (Proficiency 3).
const T = {
  1: { P: 1, mod: 2, D: 12, tier: 1, trait: 2, armor: 4, wDie: 10, wFlat: 3 },
  2: { P: 3, mod: 3, D: 14, tier: 2, trait: 3, armor: 5, wDie: 10, wFlat: 6 },
};

// 2d12 + mod + bonus (+ optional extra die) against Difficulty D. Crit (doubles) always succeeds.
function roll(mod, D, bonus = 0, extraDie = 0) {
  let hit = 0, crit = 0, hope = 0, n = 0;
  const extras = extraDie ? Array.from({ length: extraDie }, (_, i) => i + 1) : [0];
  for (let h = 1; h <= 12; h++) for (let f = 1; f <= 12; f++) for (const x of extras) {
    n++;
    const c = h === f;
    if (c || h + f + mod + bonus + x >= D) hit++;
    if (c) crit++;
    if (c || h > f) hope++;
  }
  return { hit: hit / n, crit: crit / n, hope: hope / n };
}
const avgDice = (P, die, flat = 0) => (P * (die + 1)) / 2 + flat;
const dpr = (r, avg, maxDice) => r.hit * avg + r.crit * maxDice;

function base(t) {
  const p = T[t];
  const r = roll(p.mod, p.D);
  const wp = TPROF ? (t === 1 ? 2 : 3) : p.P, wd = TPROF ? (t === 1 ? 12 : 8) : p.wDie, wf = TPROF ? (t === 1 ? 3 : 8) : p.wFlat;
  const W = avgDice(wp, wd, wf);
  const maxd = wp * wd;
  const spDpr = dpr(r, avgDice(p.P, p.wDie, p.wFlat), p.P * p.wDie);   // spells keep Proficiency dice
  const hopeBudget = (START_HOPE + ROUNDS * r.hope) / ROUNDS;
  return { p, r, W, maxd, wp, spDpr, wDpr: dpr(r, W, maxd), hopeBudget, B: dpr(r, W + UF[t], maxd) };
}
// An ally's DPR (weapon + the typical core feature) with an attack-roll bonus.
const allyDpr = (b, bonus = 0, extraDie = 0) => dpr(roll(b.p.mod, b.p.D, bonus, extraDie), b.W + UF[b.p.tier], b.maxd);

const rows = [];
const add = (cls, sub, t, self, party, notes) => rows.push({ cls, sub, t, self, party, notes });

for (const t of [1, 2]) {
  const b = base(t), { p, r } = b;
  rows.push({ cls: 'Core baseline', sub: 'weapon + typical feature', t, self: b.B, party: 0, notes: `weapon only ${b.wDpr.toFixed(2)}`, base: true });

  // ---- Envoy (both subclasses share the damage-relevant features at Tiers 1-2)
  {
    const spend = Math.min(b.hopeBudget, 2);
    const buff = 0.9 * (allyDpr(b, 2 + spend) - allyDpr(b, 0));       // Hope Feature on one ally per round
    const squad = Math.min(STRESS_PER_ROUND / (TUNE.has('sq2') ? 2 : 1), 1) * U * allyDpr(b, 0);                    // Squad Goals: ally reaction attack
    for (const sub of ['Commander', 'Spymaster'])
      add('Envoy', sub, t, b.wDpr, buff + squad, `Hope Feature +${(2 + spend).toFixed(1)} on one ally roll; Squad Goals extra ally attack at ${STRESS_PER_ROUND} Stress/round`);
  }

  // ---- Mystic
  {
    const vpMax = p.trait + p.tier;
    const vpBudget = (vpMax + ROUNDS * 1) / ROUNDS;                                     // Arcane Font: 1 VP per cast
    let extra = 0, note = 'no damage feature';
    if (t === 1) { const use = Math.min(1, vpBudget / 3); extra = use * r.hit * p.P * 1; note = `Eldritch option A (+1 die size) at ${use.toFixed(2)} uses/round`; }
    else {
      const use = Math.min(1, vpBudget / 2);
      extra = use * (r.hit * 5.5 + r.crit * 10);                                          // Crimson Rite: +1 Proficiency on the attack = +1 die (avg 5.5, crit adds a max die)
      note = `Crimson Rite (+1 Proficiency) at ${use.toFixed(2)} uses/round`;
    }
    add('Mystic', 'Spellweaver', t, b.spDpr + extra, 0, note + '; VP not spent on healing (upper bound)');
    add('Mystic', 'Bondsmage', t, b.spDpr, 0, 'support: VP healing and Stress clearing, listed qualitatively');
  }

  // ---- Operative (Weapons Specialist; Technologist is gadget/utility)
  {
    const c = Math.min(1, STRESS_PER_ROUND);                                           // Called Shot rate (Stress limited)
    const hopeBudget = (START_HOPE + ROUNDS * r.hope * (1 + c)) / ROUNDS;              // Pride in Your Work: extra Hope
    const u = Math.min(c, hopeBudget / 2);                                              // Hope Feature on Called Shots
    const exNo = t === 1 ? b.wp * 2.5 : b.wp * 3.5, exExp = t === 1 ? b.wp * 3.5 : b.wp * (TUNE.has('prec2') ? 3.5 : 4.5);
    const rh = roll(p.mod, p.D, 2, 6);                                                  // +2 Experience, advantage d6
    const self = (1 - c) * b.wDpr + (c - u) * (b.wDpr + r.hit * exNo) + u * (dpr(rh, b.W, b.maxd) + rh.hit * exExp);
    add('Operative', 'Weapons Specialist', t, self, 0, `Called Shot ${c.toFixed(2)}/round, Hope Feature ${u.toFixed(2)}/round (Pd4/Pd6/Pd8 per Precision)`);
    add('Operative', 'Technologist', t, b.wDpr + (t === 2 ? 0 : 0), 0, 'gadgets/ordnance (consumables) and Extra Juice Stress, listed qualitatively');
  }

  // ---- Solarian
  {
    const avg = (die, flat) => avgDice(p.P, die, flat + p.tier + p.trait);
    const mote = 0.5 * r.hit * 3.5;                                                     // Solar Mote +1d6 on ranged attacks only
    const d10 = dpr(r, avg(10, 2), p.P * 10);
    add('Solarian', 'Sidereal', t, d10 + mote + (t === 2 ? 0.3 * (dpr(roll(p.mod, p.D, 0, 6), avg(10, 2), p.P * 10) - d10) : 0), 0,
      `Solar Weapon d10+2 (+Tier+trait), Mote +1d6 half the rounds${t === 2 ? ', Alignment advantage 30%' : ''}; control effects qualitative`);
    const expulse = 0.5 * 0.6 * 0.55 * b.W;                                            // Expulse: switch each round, 60% fail, Photon marks 1 HP half the time
    if (t === 1) add('Solarian', 'Coronal', t, d10 + mote + expulse, 0, 'Solar Weapon d10+2, Mote, Expulse 1 HP on half the switches');
    else {
      const gb = dpr(r, avg(12, TUNE.has('gb') ? 2 : 4), p.P * 12);
      const aura = (1 / ROUNDS) * U * 2 * dpr(r, p.P * 2.5 + 6, p.P * 4);              // Radiant Aura once per fight, 2 targets
      add('Solarian', 'Coronal', t, gb + mote + aura + expulse, 0, 'Gleaming Blade d12+4, Radiant Aura once per fight on two targets');
    }
  }

  // ---- Soldier
  {
    const adv = roll(p.mod, p.D, 0, 6);
    add('Soldier', 'Tactician', t, t === 1 ? b.wDpr : (1 - U) * b.wDpr + U * dpr(adv, b.W, b.maxd), 0,
      t === 1 ? 'Suppression is defensive control; Primary Target Hope income' : 'Relentless Pursuit advantage while Primary Target is Suppressed (uptime)');
    add('Soldier', 'Armor Storm', t, t === 1 ? b.wDpr : dpr(r, b.W + p.armor, b.maxd), 0,
      t === 1 ? 'defensive: Armor Master, Imposition, Quick Stitch' : `Heavyweight adds Armor Score ${p.armor} per hit`);
  }

  // ---- Witchwarper (spells use Proficiency dice; 1 Hit Point marked is valued at 0.55 of an average hit)
  {
    const hpv = 0.55 * b.W;
    const uses = Math.min(1, b.hopeBudget / 3);                                        // Hope Feature: spell hits every target in the Field
    const aoe = (n) => uses * U * (n - 1) * b.spDpr;
    add('Witchwarper', 'Neutronic', t, b.spDpr + aoe(t === 1 ? 2 : 3), 0, `Hope Feature AoE ${uses.toFixed(2)}/round on ${t === 1 ? 2 : 3} targets; Soothing Pulse, Strong Force, Slowed Strikes qualitative`);
    const cloud = t === 2 ? (STRESS_PER_ROUND / (TUNE.has('pc2') ? 2 : 1)) * U * (allyDpr(b, 3) - allyDpr(b, 0)) : 0;  // Probability Cloud +-3 on an ally roll
    add('Witchwarper', 'Electronic', t, b.spDpr + aoe(2) + 0.5 * hpv, cloud, `Hope Feature AoE on 2 targets; Violent Frequencies 1 HP at 50% fail${t === 2 ? '; Probability Cloud +-3 on an ally roll' : ''}`);
  }

  // ---- Mechanic (the Sidekick's armor, Evasion and weapon features are defensive; Follow-up counted as an upper bound)
  {
    add('Mechanic', 'Mechsuit', t, b.wDpr, 0, 'Sidekick/mech suit Armor Slots, Targeting Systems (trait swap), Working as Intended: defensive, listed qualitatively');
    add('Mechanic', 'Drone Controller', t, b.wDpr + (t === 2 ? r.hope * U * b.wDpr : 0), 0,
      t === 1 ? 'Transformer, Telecast: utility' : 'Follow-up: extra attack when the Sidekick succeeds with Hope (upper bound, Sidekick acts as well)');
  }

  // ---- Technomancer (Overwatch spends Magical Battery tokens after the roll, only when it turns a miss into a hit)
  {
    add('Technomancer', 'Tinker', t, b.spDpr, 0, 'Cypher/Gadget objects pay spell costs and give advantage: consumables, listed qualitatively');
    const income = t === 1 ? 1.5 : 2.0;                                               // tokens per round (own + ally casts; Capacitance at Tier 2)
    let k = 0, kHit = r.hit;
    for (let kk = 1; kk <= arg('owcap', 10); kk++) {
      let cost = 0, hits = 0, n = 0;
      for (let h = 1; h <= 12; h++) for (let f = 1; f <= 12; f++) {
        n++; const tot = h + f + p.mod;
        if (h === f || tot >= p.D) hits++;
        else if (p.D - tot <= kk) { hits++; cost += p.D - tot; }
      }
      if (ALLIES * U * cost / n <= income) { k = kk; kHit = hits / n; } else break;
    }
    const party = ALLIES * U * (kHit - r.hit) * (b.W + UF[t]);
    add('Technomancer', 'Overwatch', t, b.spDpr, party, `Magical Battery: after-roll bonus up to +${k} on ally rolls (${income} tokens/round)`);
  }

  // ---- Biohacker (a Minor Serum dose lingers for the scene; Difficulty -2 on the focus target)
  {
    const hpv = 0.55 * b.W;
    const pool = p.tier + p.trait;
    const dosesAfterFirst = Math.max(0, Math.min(ROUNDS - 1, pool - 1)) / ROUNDS / (TUNE.has('ph2') ? 2 : 1);
    const upDiff = ((ROUNDS - 0.5) / ROUNDS) * 0.8;                                    // lingers from the first dose; 20% negated by a reaction
    const selfMod = p.mod + 1;                                                          // Self Help (+1 trait)
    const selfRoll = (bonus) => roll(selfMod, p.D, bonus);
    const selfBase = (bonus = 0) => dpr(selfRoll(bonus), b.W, b.maxd);
    const gsSelf = t === 1 ? selfBase() : 0.5 * dpr(roll(selfMod, p.D, 3), b.W, b.maxd) + 0.5 * selfBase();   // Creature Feature +3 half the rounds
    const diffSelf = upDiff * (t === 1 ? selfBase(2) - selfBase() : 0.5 * (dpr(roll(selfMod, p.D, 5), b.W, b.maxd) - dpr(roll(selfMod, p.D, 3), b.W, b.maxd)) + 0.5 * (selfBase(2) - selfBase()));
    const partyDiff = upDiff * U * ALLIES * (allyDpr(b, 2) - allyDpr(b, 0));
    add('Biohacker', 'Gene Splicer', t, gsSelf + diffSelf, partyDiff, 'Self Help +1 trait, Difficulty -2 serum on the focus target' + (t === 2 ? ', Creature Feature +3 half the rounds' : '') + '; Mutative Effect qualitative');
    const phys = t === 1 ? selfBase() + (selfBase(2) - selfBase()) * upDiff + dosesAfterFirst * 0.8 * hpv : selfBase() + (selfBase(2) - selfBase()) * upDiff + dosesAfterFirst * 0.8 * hpv * 1.0;
    add('Biohacker', 'Physiologist', t, phys, partyDiff, `Difficulty -2 serum, then "marks 1 HP" doses (${(dosesAfterFirst * 0.8).toFixed(2)}/round)${t === 2 ? '; Ample Ampules/Extra Strength' : ''}`);
  }

  // ---- Aspis Sleeper (Buried Protocols Experience: +1 at Tier 1, +2 at Tier 2, 1 Hope per use)
  {
    const bp = t, x = Math.min(1, b.hopeBudget);
    const withBp = dpr(roll(p.mod, p.D, bp), b.W, b.maxd);
    const inf = x * withBp + (1 - x) * b.wDpr + (t === 2 ? (1 / ROUNDS) * (dpr(roll(p.mod, p.D, 0, 6), b.W, b.maxd) - b.wDpr) : 0);
    add('Aspis Sleeper', 'Infiltrator', t, inf, 0, `Buried Protocols +${bp} on the attack ${x.toFixed(2)}/round${t === 2 ? ', Quickdraw advantage on the first attack' : ''}; stealth/utility qualitative`);
    const exe = x * (withBp + roll(p.mod, p.D, bp).hit * bp) + (1 - x) * b.wDpr + STRESS_PER_ROUND * r.hit * 0.55 * b.W;
    add('Aspis Sleeper', 'Executioner', t, exe, 0, `Contract adds +${bp} damage with the Experience, Brutal Assault +1 HP at ${STRESS_PER_ROUND} Stress/round${t === 2 ? '; Take Down burst (ends an adversary on Severe damage) not counted' : ''}`);
  }
}

// ---- Remaining five classes, appended below
const byT = (t) => rows.find((x) => x.base && x.t === t).self;
const out = rows.map((x) => {
  const total = x.self + x.party, B = byT(x.t);
  const ratio = total / B, flag = x.base ? '' : ratio >= 1.5 ? 'OVER 1.5' : ratio > 1.3 ? 'over 1.3' : '';
  return { ...x, total, ratio, selfRatio: x.self / B, flag };
});
const f2 = (n) => n.toFixed(2);
const csv = [`# ${TPROF ? 'trait-as-Proficiency weapons' : 'standard weapons'}`, 'class,subclass,tier,self_dpr,party_dpr,total_dpr,ratio_total,ratio_self,flag,notes',
  ...out.map((x) => [x.cls, x.sub, x.t, f2(x.self), f2(x.party), f2(x.total), f2(x.ratio), f2(x.selfRatio), x.flag, `"${x.notes}"`].join(','))].join('\n');
const path = process.argv.includes('--csv') ? process.argv[process.argv.indexOf('--csv') + 1] : resolve(root, 'Docs/starheart-classes/reports/power-data.csv');
writeFileSync(path, csv + '\n');
console.log('| Class | Subclass | Tier | Self | Party | Total | x core | x core (self only) | Flag |\n|---|---|---|---|---|---|---|---|---|');
for (const x of out) console.log(`| ${x.cls} | ${x.sub} | ${x.t} | ${f2(x.self)} | ${f2(x.party)} | ${f2(x.total)} | ${x.base ? '-' : f2(x.ratio)} | ${x.base ? '-' : f2(x.selfRatio)} | ${x.flag} |`);
