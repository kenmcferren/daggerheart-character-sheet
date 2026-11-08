// Adds print markup to the ship card rules in scripts/srd-convert/starfinder/ships.json (owner, 2026-11-07):
//   **bold** for keywords (With Lock:, While Available:, Lock, Cloud, Studied Target, tokens...) and for the card's costs
//   (mark a Stress, spend a Hope, Mark a Hull Point, the GM gains a Fear...), never for consequences ("make it mark a Stress");
//   *italic* for conditions a card defines (Engulfed, Jammed, Cloaked...).
// Starts from the plain text, so it can be rerun. Writes Docs/starheart-ships/reports/card-markup.md for review.
// Run: node scripts/srd-convert/starfinder/mark-ship-cards.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const P = 'scripts/srd-convert/starfinder/ships.json'
const data = JSON.parse(readFileSync(P, 'utf8'))
const plain = (s) => s.replaceAll('**', '').replace(/\*([^*\n]+)\*/g, '$1')

const KEYWORDS = [
  /With Lock:/g, /While Available:/g, /Forward Facing\./g, /Aft Facing\./g, /\bLock(?:s|ed)?\b/g, /\bStudied Target\b/g,
  /\bBreached\b/g, /\bDisabl(?:ed|es)\b/g, /\bVulnerable\b/g, /\bRestrained\b/g, /\bHidden\b/g, /\bClouds?\b/g, /\bmake contact\b/g,
  /\bForced Docking\b/g, /\bRefuel\b/g, /\bRefit\b/g, /\b(?:Reload|Analysis|Power) Tokens?\b/g, /\bObserving\b/g, /\bChase\b/g,
]
const CONDITIONS = /\b(?:Engulfed|Jammed|Sought|Cloaked|Highlighted|Overloaded|Burning|Electrified|Unfair Winds|Veil of Night|Boarding Glyph|Pulse Beacon|Orbiting Plate|Graviton Mine|Pulsar Mine|Shrapnel Mine Token|Scrambler Tokens?|Inversion Tokens?)\b/g
// Costs: what you pay. Spending is always yours (the GM's Fear spend in Cloaking Field is not matched: Fear is not listed).
const COSTS = [
  /\b[Ss]pend (?:a|an|any number of|up to \d+|\d+) (?:Hope|Stress|Power Tokens?|Analysis Tokens?|Reload Tokens?|Scrambler Token|Inversion Token)\b/g,
  /\b[Ss]pend Hope\b/g,
  /\b[Mm]ark (?:a|another|up to \d+|\d+) (?:Stress|Hull Points?)(?: or \d+ Hull Points)?\b/g,
  /\bthe GM gains a Fear\b/g,
]
// A lowercase "mark" is a consequence after "make <someone>", or a trigger after "When you".
const consequence = (text, i) => /\bmake\s+(?:\S+\s+){0,6}$/.test(text.slice(Math.max(0, i - 40), i)) || /When you $/.test(text.slice(Math.max(0, i - 9), i))
// Per-card fixes the rules can't see: [card id, phrase, 'bold' | 'none'].
const EXTRA = [
  ['empathic-network', 'mark one of them instead', 'bold'],
  ['orbiting-plate', 'destroy the Plate', 'bold'],
  ['shrapnel-mine', 'discard the token', 'bold'],
  ['shrapnel-mine', 'spend the token', 'bold'],
  ['flechette-spines', 'mark a Stress', 'none'], // the targets mark it
  ['warp-draw', 'mark a Hull Point', 'none'], // the ships in the Cloud mark it
]

function markup(id, text) {
  const t = plain(text)
  const kind = new Array(t.length).fill('') // '' | 'b' | 'i'
  const set = (a, b, k) => { for (let i = a; i < b; i++) if (kind[i] !== 'b') kind[i] = k }
  for (const re of KEYWORDS) for (const m of t.matchAll(re)) set(m.index, m.index + m[0].length, 'b')
  for (const m of t.matchAll(CONDITIONS)) set(m.index, m.index + m[0].length, 'i')
  for (const re of COSTS) for (const m of t.matchAll(re)) {
    if (/^mark/.test(m[0]) && consequence(t, m.index)) continue
    set(m.index, m.index + m[0].length, 'b')
  }
  for (const [cid, phrase, how] of EXTRA) if (cid === id) {
    if (!t.includes(phrase)) throw new Error(`mark-ship-cards: ${id} has no "${phrase}"`)
    for (let i = t.indexOf(phrase); i >= 0; i = t.indexOf(phrase, i + 1)) {
      if (how === 'bold') set(i, i + phrase.length, 'b')
      else for (let k = i; k < i + phrase.length; k++) if (kind[k] === 'b' && !/^(?:Cloud|Lock)/.test(phrase)) kind[k] = ''
    }
  }
  // Join runs; a space between two bold runs stays outside the marks.
  let out = '', cur = ''
  for (let i = 0; i <= t.length; i++) {
    const k = i < t.length ? kind[i] : ''
    if (k !== cur) { out += cur === 'b' ? '**' : cur === 'i' ? '*' : ''; out += k === 'b' ? '**' : k === 'i' ? '*' : ''; cur = k }
    if (i < t.length) out += t[i]
  }
  return out.replace(/\*\*(\s+)\*\*/g, '$1').replace(/\*\*\*\*/g, '')
}

const report = ['# Ship card markup (for review)', '', 'Made by `node scripts/srd-convert/starfinder/mark-ship-cards.mjs`. **Bold** = keyword or cost; *italic* = a condition or object the card defines.', '']
let sys = ''
for (const c of data.cards) {
  c.rules = markup(c.id, c.rules)
  if (c.system !== sys) { sys = c.system; report.push(`## ${sys[0].toUpperCase()}${sys.slice(1)}`, '') }
  report.push(`- **${c.name}** (${c.domain}): ${c.rules.replace(/\*\*/g, '__')}`)
}
writeFileSync(P, JSON.stringify(data, null, 2) + '\n')
writeFileSync('Docs/starheart-ships/reports/card-markup.md', report.join('\n') + '\n')
console.log(`marked ${data.cards.length} cards; report Docs/starheart-ships/reports/card-markup.md`)
