// Word and feature counts for Starheart class markdown vs the 13 core classes.
// Usage: node scripts/starheart-metrics.mjs [markdown-file] [--factor 1.15]
// Default file: Docs/starheart-classes/source-v0.md. Prints markdown tables.
//
// Counting rule (same for core and draft):
//  - words = whitespace tokens containing a letter or digit, in rules text only
//    (feature names, stat lines, Spellcast Trait lines and headings are excluded);
//  - a feature = a named entry; unnamed paragraphs, sub-bullets and the bold-led
//    bullets inside a class-level feature (Twin Energies' Mote/Weapon/Aura) belong
//    to the feature above them (core: unnamed `features` entries, same idea);
//  - class level = hope feature + class features; subclass ranks are
//    foundation / specialization / mastery;
//  - core class `supplements` (stances, companion, beastforms) are not counted.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RANKS = ['foundation', 'specialization', 'mastery'];
const args = process.argv.slice(2);
const fi = args.indexOf('--factor');
const FACTOR = fi >= 0 ? Number(args[fi + 1]) : 1.15;
const file = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--factor')
  ?? 'Docs/starheart-classes/source-v0.md';

export const words = (s) => (s.match(/\S+/g) ?? []).filter((t) => /[A-Za-z0-9]/.test(t)).length;
const clean = (s) => s.replace(/\\/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

const blank = () => ({ words: 0, features: 0 });
const add = (b, w, f) => { b.words += w; b.features += f; };

export function parseDraft(md) {
  const classes = [];
  let cls = null, sub = null, rank = null, feat = false;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    if (/^#\s/.test(line)) { cls = null; sub = null; rank = null; continue; }
    if (/^##\s/.test(line) && !/^###/.test(line)) {
      cls = { name: clean(line.replace(/^#+/, '')), class: blank(), subs: [] };
      classes.push(cls); sub = null; rank = null; continue;
    }
    if (!cls) continue;
    if (/^#{3,4}\s/.test(line)) {
      sub = { name: clean(line.replace(/^#+/, '')).replace(/^Subclass:\s*/, ''), ranks: { foundation: blank(), specialization: blank(), mastery: blank() } };
      cls.subs.push(sub); rank = null; continue;
    }
    const body = line.replace(/^\s*[*-]\s+/, '');
    if (/^\W*\*\*\s*(foundation|specializ|specialist|mastery)[^*]*\*\*[:\s]*$/i.test(body)) {
      rank = /found/i.test(body) ? 'foundation' : /mastery/i.test(body) ? 'mastery' : 'specialization';
      continue;
    }
    if (/^(evasion|spellcast(ing)? trait)\b/i.test(clean(body))) continue;
    const bucket = sub ? sub.ranks[rank ?? 'foundation'] : cls.class;
    const indented = /^\s+[*-]\s/.test(line);
    const isBullet = /^\s*[*-]\s/.test(line);
    const m = body.match(/^\*\*([^*]+?)\*\*[:.]?\s*(.*)$/);
    // A new feature: bold-led paragraph at class level, or bold-led top-level bullet in a subclass.
    const newFeature = m && !indented && (sub ? true : !isBullet);
    if (newFeature) { add(bucket, words(clean(m[2])), 1); feat = true; }
    else add(bucket, words(clean(m ? m[2] : body)), 0);
  }
  return classes;
}

export function parseCore() {
  const c = JSON.parse(readFileSync(resolve(root, 'packs/core/srd-core.json'), 'utf8')).content;
  const subs = new Map(c.subclasses.map((s) => [s.id, s]));
  return c.classes.map((k) => {
    const cls = { name: k.name, class: blank(), subs: [] };
    if (k.hopeFeature) add(cls.class, words(k.hopeFeature.rules), 1);
    for (const f of k.features ?? []) add(cls.class, words(f.rules), f.name ? 1 : 0);
    for (const id of k.subclasses ?? []) {
      const s = subs.get(id);
      const sub = { name: s.name, ranks: { foundation: blank(), specialization: blank(), mastery: blank() } };
      for (const f of s.features ?? []) add(sub.ranks[f.level] ?? sub.ranks.foundation, words(f.rules), f.name ? 1 : 0);
      cls.subs.push(sub);
    }
    return cls;
  });
}

const subTotal = (s) => RANKS.reduce((t, r) => { add(t, s.ranks[r].words, s.ranks[r].features); return t; }, blank());
export function totals(cls) {
  const t = blank(); add(t, cls.class.words, cls.class.features);
  const subs = blank();
  for (const s of cls.subs) { const x = subTotal(s); add(subs, x.words, x.features); }
  add(t, subs.words, subs.features);
  return { total: t, class: cls.class, subs };
}

const stat = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { mean, med, min: s[0], max: s[s.length - 1] };
};
const r1 = (n) => Math.round(n * 10) / 10;
const r5 = (n) => Math.round(n / 5) * 5;

function classTable(list) {
  const rows = list.map((c) => {
    const t = totals(c);
    return `| ${c.name} | ${t.class.words} / ${t.class.features} | ${t.subs.words} / ${t.subs.features} | ${t.total.words} / ${t.total.features} |`;
  });
  return ['| Class | Class level (words / features) | Both subclasses | Total |', '|---|---|---|---|', ...rows].join('\n');
}
function subTable(list) {
  const rows = [];
  for (const c of list) for (const s of c.subs) {
    const cells = RANKS.map((r) => `${s.ranks[r].words} / ${s.ranks[r].features}`);
    const t = subTotal(s);
    rows.push(`| ${c.name}: ${s.name} | ${cells.join(' | ')} | ${t.words} / ${t.features} |`);
  }
  return ['| Subclass | Foundation | Specialization | Mastery | Total |', '|---|---|---|---|---|', ...rows].join('\n');
}
function statRows(list) {
  const tt = list.map(totals);
  const subs = list.flatMap((c) => c.subs);
  const lines = [];
  const m = (label, xs) => { const s = stat(xs); lines.push(`| ${label} | ${r1(s.mean)} | ${s.med} | ${s.min}-${s.max} |`); };
  m('Class level words', tt.map((t) => t.class.words));
  m('Class level features', tt.map((t) => t.class.features));
  m('Class total words (class + 2 subclasses)', tt.map((t) => t.total.words));
  m('Class total features', tt.map((t) => t.total.features));
  m('Subclass words (all ranks)', subs.map((s) => subTotal(s).words));
  m('Subclass features (all ranks)', subs.map((s) => subTotal(s).features));
  for (const r of RANKS) {
    m(`Subclass ${r} words`, subs.map((s) => s.ranks[r].words));
    m(`Subclass ${r} features`, subs.map((s) => s.ranks[r].features));
  }
  return ['| Measure | Mean | Median | Range |', '|---|---|---|---|', ...lines].join('\n');
}

export function budget(core, factor = FACTOR) {
  const subs = core.flatMap((c) => c.subs);
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const tt = core.map(totals);
  return {
    classWords: r5(mean(tt.map((t) => t.class.words)) * factor),
    classFeatures: Math.round(mean(tt.map((t) => t.class.features)) * factor * 2) / 2,
    subWords: r5(mean(subs.map((s) => subTotal(s).words)) * factor),
    subFeatures: Math.round(mean(subs.map((s) => subTotal(s).features)) * factor * 2) / 2,
    rankWords: Object.fromEntries(RANKS.map((r) => [r, r5(mean(subs.map((s) => s.ranks[r].words)) * factor)])),
    rankFeatures: Object.fromEntries(RANKS.map((r) => [r, Math.round(mean(subs.map((s) => s.ranks[r].features)) * factor * 2) / 2])),
    classTotalWords: r5(mean(tt.map((t) => t.total.words)) * factor),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const core = parseCore();
  const draft = parseDraft(readFileSync(resolve(root, file), 'utf8'));
  const b = budget(core);
  console.log(`## Core classes (13), words / features\n\n${classTable(core)}\n\n${subTable(core)}\n\n### Core summary (per class or per subclass)\n\n${statRows(core)}`);
  console.log(`\n## Draft: ${file}, words / features\n\n${classTable(draft)}\n\n${subTable(draft)}\n\n### Draft summary\n\n${statRows(draft)}`);
  console.log(`\n## Proposed budget (core mean x ${FACTOR})\n`);
  console.log(`- Class level: ${b.classWords} words, ${b.classFeatures} features`);
  console.log(`- One subclass (all ranks): ${b.subWords} words, ${b.subFeatures} features`);
  for (const r of RANKS) console.log(`- Subclass ${r}: ${b.rankWords[r]} words, ${b.rankFeatures[r]} features`);
  console.log(`- Whole class (class + 2 subclasses): ${b.classTotalWords} words`);
}
