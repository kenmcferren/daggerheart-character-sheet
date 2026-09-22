// Series 7 step 1b: find every feature/card/item whose rules text sizes something (a count, a die,
// a duration) by a character trait — "equal to your Spellcast trait", "a number of times equal to
// your Instinct", etc. Separate sweep from number-features.mjs, which only catches literal +N text.
// Run: node scripts/srd-convert/trait-features.mjs > TestArtifacts/rules-math/trait-candidates.md
import { readFileSync } from 'node:fs'

const core = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')).content
const frames = JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8')).content

const TRAITS = ['Agility', 'Strength', 'Finesse', 'Instinct', 'Presence', 'Knowledge', 'Spellcast trait', 'Spellcast']
const TRAIT_RE = new RegExp(`(equal to|matching|using) (your |the )?(${TRAITS.join('|')})\\b`, 'i')

function hit(text) {
  if (!text) return false
  return TRAIT_RE.test(text)
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

console.log(`# Trait-referencing candidates (Series 7, step 1b)\n`)
console.log(`${rows.length} entries whose rules text sizes something (a count, uses, a die, damage) by one of the character's own traits. Already handled: the once-per-rest/uses circles (Series 5) don't count these; the resource trackers built in Series 5 (Favor, Hex, tokens) already read a trait where the pack says so (\`trackers[].count.trait\`) — some rows below may already be covered there and are listed again for a fresh check.\n`)
console.log('| kind | from | name | text |')
console.log('|---|---|---|---|')
for (const r of rows) console.log(`| ${r.kind} | ${r.from} | ${r.name} | ${r.text.slice(0, 220)} |`)
