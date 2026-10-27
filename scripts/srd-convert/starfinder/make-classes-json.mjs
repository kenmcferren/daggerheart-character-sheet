// One-off: turns Docs/starheart-classes/v4-final.md (Series 12 final text) into scripts/srd-convert/starfinder/classes.json.
// After the first run, hand-edit classes.json; rerunning overwrites it (pass --force).
// Run: node scripts/srd-convert/starfinder/make-classes-json.mjs --force
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
const OUT = 'scripts/srd-convert/starfinder/classes.json'
if (existsSync(OUT) && !process.argv.includes('--force')) throw new Error(`${OUT} exists; hand-edit it, or pass --force to regenerate`)
const md = readFileSync('Docs/starheart-classes/v4-final.md', 'utf8').split(/\r?\n/)
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const PLACEHOLDER = 'Placeholder question'
const unbold = (s) => s.replaceAll('**', '')

// Per-class extras the prose states as rules the engine applies (owner decisions 2026-10-26, Series 13).
// cardWords: word swaps printed on that class's domain cards (whole words, plurals and capitals kept); `type` relabels the card type.
const EXTRAS = {
  operative: {
    startingDomainCards: 3, // Tech Savvy
    cardWords: [
      { from: 'spell', to: 'Tech' }, { from: 'magic', to: 'Tech' }, { from: 'grimoire', to: 'Kit' },
    ],
    cardTypes: { spell: 'tech', grimoire: 'kit' },
  },
  technomancer: {
    cardWords: [{ domains: ['codex'], from: 'book', to: 'program' }, { domains: ['codex'], from: 'grimoire', to: 'program' }],
    cardTypes: { grimoire: 'program' },
    cardTypeDomains: ['codex'],
  },
  soldier: {
    cardWords: [
      { domains: ['dread'], from: 'Spellcast Roll', to: 'Strength Roll' },
      { domains: ['dread'], from: 'Spellcast trait', to: 'Strength' },
      { domains: ['dread'], from: 'spell', to: 'ability' },
    ],
    cardTypes: { spell: 'ability' },
    cardTypeDomains: ['dread'],
  },
  witchwarper: { allowedCardTypes: ['spell'] }, // Quantum Field: only Spell domain cards
}
const SUB_EXTRAS = { 'witchwarper.neutronic': { extraDomain: 'splendor' }, 'witchwarper.electronic': { extraDomain: 'arcana' } }
// Counters printed as rows of boxes (see resource-trackers.mjs for the core ones). `tier: true` adds the character's Tier.
const TRACKERS = {
  'envoy/Tactical Mind': { id: 'envoy-tokens', label: 'Envoy Tokens (max 6)', count: 6 },
  'mystic/Vitality Network': { id: 'vitality-points', label: 'VP (max Spellcast + Tier)', count: { trait: 'spellcast', tier: true } },
  'operative.technologist/Collector': { id: 'collector-tokens', label: 'Collector tokens (max 6)', count: 6 },
  'mechanic/Trusty Sidekick': { id: 'sidekick-armor', label: 'Sidekick Armor Slots (4 + Tier)', count: { base: 4, tier: true } },
  'technomancer.tinker/Always Working': { id: 'tinker-objects', label: 'Held objects (max 4)', count: 4 },
  'technomancer.tinker/Storage Improvement': { id: 'tinker-objects', label: 'Held objects (max 6)', count: 6 },
  'technomancer.overwatch/Magical Battery': { id: 'battery-tokens', label: 'Battery tokens (max 6)', count: 6 },
  'technomancer.overwatch/Capacitance': { id: 'battery-tokens', label: 'Battery tokens (max 8)', count: 8 },
  'biohacker/Serum Pool': { id: 'serum-tokens', label: 'Serum Tokens (max Tier + Spellcast)', count: { trait: 'spellcast', tier: true } },
}

const classes = []
let cls = null, sub = null, level = null, last = null
const feature = (name, rules) => {
  const f = { name, rules: unbold(rules) }
  if (sub) f.level = level
  ;(sub ?? cls).features.push(f)
  last = f
}
for (const raw of md) {
  const line = raw.trimEnd()
  let m
  if (/^# /.test(line)) { cls = null; sub = null; last = null; continue }
  if ((m = /^## (.+)$/.exec(line))) {
    const id = slug(m[1])
    cls = { id, name: m[1], subclasses: [], domains: [], startingEvasion: 0, startingHitPoints: 0, classItems: 'Placeholder item', hopeFeature: null, features: [],
      backgroundQuestions: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER], connections: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER], subs: [] }
    classes.push(cls); sub = null; last = null; continue
  }
  if (!cls) continue
  if ((m = /^### (.+)$/.exec(line))) {
    sub = { id: `${cls.id}.${slug(m[1])}`, name: m[1], class: cls.id, features: [] }
    cls.subs.push(sub); cls.subclasses.push(sub.id); level = null; last = null; continue
  }
  if ((m = /^Evasion: (\d+); HP: (\d+); Stress: (\d+); Domains: (\w+) & (\w+)$/.exec(line))) {
    cls.startingEvasion = +m[1]; cls.startingHitPoints = +m[2]; cls.domains = [m[4].toLowerCase(), m[5].toLowerCase()]
    if (m[3] !== '6') throw new Error(`${cls.id}: Stress ${m[3]} (only 6 is supported)`)
    continue
  }
  if ((m = /^Spellcast Trait: \*\*(\w+)\*\*$/.exec(line))) { sub.spellcastTrait = m[1].toLowerCase(); continue }
  if ((m = /^\*\*(Foundation|Specialization|Mastery) Features?\*\*$/.exec(line))) { level = m[1].toLowerCase(); last = null; continue }
  if ((m = /^\*\*(.+) Hope Feature:\*\* (.+)$/.exec(line))) { cls.hopeFeature = { name: `${m[1]} Hope Feature`, rules: m[2] }; last = null; continue }
  if ((m = /^(?:- )?\*\*([^*]+):\*\* (.+)$/.exec(line)) && (sub ? line.startsWith('- ') : !line.startsWith('- '))) { feature(m[1], m[2]); continue }
  if ((m = /^\s*- (.+)$/.exec(line)) && last) { last.rules += `\n- ${unbold(m[1])}`; continue }
  if (line.trim() && !/^Notation|^Typos|^Word-pass/.test(line)) throw new Error(`unparsed line: ${line}`)
}

const subclasses = []
for (const c of classes) {
  if (!c.hopeFeature || c.domains.length !== 2 || c.subs.length !== 2) throw new Error(`${c.id}: incomplete`)
  Object.assign(c, EXTRAS[c.id] ?? {})
  for (const s of c.subs) {
    Object.assign(s, SUB_EXTRAS[s.id] ?? {})
    if (!s.features.every((f) => f.level)) throw new Error(`${s.id}: feature without a level`)
    subclasses.push(s)
  }
  delete c.subs
}
for (const [key, t] of Object.entries(TRACKERS)) {
  const [owner, name] = key.split('/')
  const f = (classes.find((c) => c.id === owner) ?? subclasses.find((s) => s.id === owner))?.features.find((x) => x.name === name)
  if (!f) throw new Error(`tracker: ${owner} has no feature "${name}"`)
  f.trackers = [{ ...t, shape: 'box', placement: 'front' }]
}
writeFileSync(OUT, JSON.stringify({ frame: { id: 'starfinder-classes', name: 'Starheart Classes' }, classes, subclasses }, null, 2) + '\n')
console.log(`${classes.length} classes, ${subclasses.length} subclasses, ${subclasses.reduce((n, s) => n + s.features.length, 0) + classes.reduce((n, c) => n + c.features.length, 0)} features -> ${OUT}`)
