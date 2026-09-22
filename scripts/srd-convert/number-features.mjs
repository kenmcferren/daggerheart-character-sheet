// Series 7 step 1: find every feature/card/item whose rules text changes a *character stat* number
// (Evasion, damage/Severe/Major thresholds, Proficiency, HP/Stress/Armor slots) but isn't applied to
// the sheet's numbers today (deriveStats/sheetView only read base stats + level-up progress).
// Run: node scripts/srd-convert/number-features.mjs > TestArtifacts/rules-math/candidates.md
import { readFileSync } from 'node:fs'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')).content
const frames = JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8')).content

const STAT_WORDS = /(evasion|damage threshold|major threshold|severe threshold|proficiency|hit point slot|stress slot|armor slot)/i
// A "bonus" phrasing: +N, permanent/gain a bonus, reduce/increase by N. Excludes pure damage-roll dice text
// (e.g. "deal d8+3 damage") by requiring a stat word nearby.
const BONUS = /(\+\s?\d+\s*(permanent\s+)?bonus|permanent\s+\+\s?\d+|gain(?:s)?\s+a\s+\+\s?\d+|\d+\s*bonus to|reduce[sd]?\s+.{0,20}\bby\s+\d+|increase[sd]?\s+.{0,20}\bby\s+\d+)/i

function hit(text) {
  if (!text) return false
  return STAT_WORDS.test(text) && BONUS.test(text)
}

const rows = []
const add = (kind, from, name, text) => rows.push({ kind, from, name: name || '(unnamed)', text: text.replace(/\s+/g, ' ').trim() })

for (const c of core.classes ?? []) for (const f of c.features ?? []) if (hit(f.rules)) add('class feature', c.name, f.name, f.rules)
for (const s of core.subclasses ?? []) for (const f of s.features ?? []) if (hit(f.rules)) add('subclass feature', s.name, f.name, f.rules)
for (const a of core.ancestries ?? []) for (const f of a.features ?? []) if (hit(f.rules)) add('ancestry feature', a.name, f.name, f.rules)
for (const co of core.communities ?? []) for (const f of co.features ?? []) if (hit(f.rules)) add('community feature', co.name, f.name, f.rules)
for (const d of core.domainCards ?? []) if (hit(d.rules ?? d.text)) add('domain card', d.domain, d.name, d.rules ?? d.text)
for (const e of core.equipment ?? []) if (hit(e.feature ?? e.rules)) add('equipment', e.category, e.name, e.feature ?? e.rules)
for (const fr of frames.campaignFrames ?? []) {
  for (const op of fr.ops ?? []) {
    const text = op.rules ?? op.text
    if (hit(text)) add('frame op', fr.name, op.id ?? op.target, text)
  }
}

console.log(`# Rules-math candidates (Series 7, step 1)\n`)
console.log(`${rows.length} entries whose rules text changes Evasion, a damage threshold, Proficiency, or an HP/Stress/Armor slot count, found by pattern match. This is a first pass for the owner to prune, not a final list: it will include false positives (dice/attack text) and can miss phrasings the pattern doesn't cover.\n`)
console.log('| kind | from | name | text |')
console.log('|---|---|---|---|')
for (const r of rows) console.log(`| ${r.kind} | ${r.from} | ${r.name} | ${r.text.slice(0, 200)} |`)
