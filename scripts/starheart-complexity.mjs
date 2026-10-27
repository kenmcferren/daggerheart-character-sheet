// Series 12 complexity heuristic. Usage: node scripts/starheart-complexity.mjs [draft.md]
// Counts "moving parts" in rules text with the same regexes for the 13 core classes (rules text from
// packs/core/srd-core.json) and the draft classes, and writes the table to stdout.
// It is a rough proxy (keyword counts), used to compare, not to grade. The report adds a manual pass.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2] ?? 'Docs/starheart-classes/v2-reduced.md';

const PARTS = {
  // new resources: capitalised "<Name> Token(s)/Pool/Points" or "token(s)" on a card, counted as distinct names
  resources: (t) => new Set([...t.matchAll(/\b([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)? (?:Tokens?|Pool|Points))\b/g)].map((m) => m[1].replace(/s$/, ''))).size
    + new Set([...t.matchAll(/\b(tokens?|counters?)\b/gi)].map(() => 'tok')).size,
  // modes, states, conditions, summoned things
  states: (t) => new Set([...t.matchAll(/\b(Suppressed|Restrained|Vulnerable|Hidden|Graviton|Photon|Sidekick|Quantum Field|Mote|Aura|Mystic Bond|Conjurations?|Primary (?:Target|Threat)|Studied Adversary|mode|stance|form)\b/g)].map((m) => m[1])).size,
  // trigger clauses
  triggers: (t) => (t.match(/\b(when|whenever|at the start|at the end|once per|each (?:rest|long rest|scene|spotlight)|per spotlight|after you|before you|before damage)\b/gi) ?? []).length,
  // rules that edit other rules
  editors: (t) => (t.match(/\b(replace|instead of|can no longer|as though|is instead|are now|now uses|now costs|ignore any|may make a|rather than)\b/gi) ?? []).length,
  // lists, options, tables
  lists: (t) => (t.match(/\(A\)|\bchoose (?:one|up to)|following|d20 on|roll 3d20|track:/gi) ?? []).length,
  // must remember out of turn / reactions
  reactions: (t) => (t.match(/\bas a reaction|reaction roll|before damage|before consequences|when an? (?:ally|adversary|creature)\b|another player/gi) ?? []).length,
};
const KEYS = Object.keys(PARTS);

const core = JSON.parse(readFileSync(resolve(root, 'packs/core/srd-core.json'), 'utf8')).content;
const subs = new Map(core.subclasses.map((s) => [s.id, s]));
const coreText = core.classes.map((k) => ({
  name: k.name,
  text: [k.hopeFeature?.rules, ...(k.features ?? []).map((f) => f.rules),
    ...(k.subclasses ?? []).flatMap((id) => (subs.get(id)?.features ?? []).map((f) => f.rules))].filter(Boolean).join('\n'),
}));

const md = readFileSync(resolve(root, file), 'utf8');
const draftText = md.split(/^## /m).slice(1).map((blk) => {
  const [head, ...rest] = blk.split('\n');
  return { name: head.trim(), text: rest.filter((l) => !/^(Evasion:|Spellcast Trait:|#|Notation|Same rules|Word-pass)/.test(l)).join('\n').replace(/\*\*/g, '') };
}).filter((c) => c.text.trim());

const score = (c) => { const p = Object.fromEntries(KEYS.map((k) => [k, PARTS[k](c.text)])); return { name: c.name, ...p, total: KEYS.reduce((a, k) => a + p[k], 0) }; };
const C = coreText.map(score), D = draftText.map(score);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r1 = (n) => Math.round(n * 10) / 10;
const row = (s) => `| ${s.name} | ${KEYS.map((k) => s[k]).join(' | ')} | ${s.total} |`;
const head = `| Class | ${KEYS.join(' | ')} | total |\n|---|${KEYS.map(() => '---|').join('')}---|`;
const cm = Object.fromEntries([...KEYS, 'total'].map((k) => [k, mean(C.map((s) => s[k]))]));
const cx = Object.fromEntries([...KEYS, 'total'].map((k) => [k, Math.max(...C.map((s) => s[k]))]));

console.log('## Core (13)\n\n' + head + '\n' + C.map(row).join('\n'));
console.log(`| **mean** | ${[...KEYS, 'total'].map((k) => r1(cm[k])).join(' | ')} |`);
console.log(`| **max** | ${[...KEYS, 'total'].map((k) => cx[k]).join(' | ')} |`);
console.log(`\n## Draft: ${file}\n\n` + head + '\n' + D.map(row).join('\n'));
console.log(`| **mean** | ${[...KEYS, 'total'].map((k) => r1(mean(D.map((s) => s[k])))).join(' | ')} |`);
console.log('\n## Draft total vs core mean / max\n\n| Class | total | x core mean | x core max |\n|---|---|---|---|\n' +
  D.map((s) => `| ${s.name} | ${s.total} | ${r1(s.total / cm.total)} | ${r1(s.total / cx.total)} |`).join('\n'));
