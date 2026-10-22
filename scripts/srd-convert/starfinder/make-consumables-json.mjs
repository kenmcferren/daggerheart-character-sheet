// One-off: merges the owner's category/number CSV (Cypher text kept as is) with the approved rename/condense
// table in Docs/starheart-consumables-proposal.md into consumables.json. After this the JSON is hand-edited.
// Run: node scripts/srd-convert/starfinder/make-consumables-json.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const csv = readFileSync('Docs/starheart consumables.csv', 'utf8')
const rows = []
let f = [], cur = '', q = false
for (let i = 0; i < csv.length; i++) {
  const c = csv[i]
  if (q) { if (c === '"' && csv[i + 1] === '"') { cur += '"'; i++ } else if (c === '"') q = false; else cur += c }
  else if (c === '"') q = true
  else if (c === ',') { f.push(cur); cur = '' }
  else if (c === '\n' || c === '\r') { if (c === '\r' && csv[i + 1] === '\n') i++; f.push(cur); cur = ''; if (f.some(Boolean)) rows.push(f); f = [] }
  else cur += c
}
if (cur || f.length) { f.push(cur); rows.push(f) }
const prop = {}
let section = ''
for (const l of readFileSync('Docs/starheart-consumables-proposal.md', 'utf8').split('\n')) {
  if (l.startsWith('## ')) { section = l.slice(3).trim().toLowerCase(); continue }
  const c = l.split('|').slice(1, -1).map((s) => s.trim())
  if (c.length >= 4 && /^\d+$/.test(c[0])) prop[`${section}-${c[0]}`] = { name: c[2], rules: c[3] }
}
const out = []
for (const [set, roll, name, rules, type] of rows.slice(1)) {
  const t = type.toLowerCase()
  const n = Number(roll)
  const p = t === 'cypher' ? { name: name.trim(), rules: rules.trim() } : prop[`${t}-${n}`]
  if (!p) throw new Error(`no proposal for ${t} ${n}`)
  out.push({ id: `${t}-${n}`, type: t, number: n, name: p.name, rules: p.rules, source: set, oldName: name.trim() })
}
out.sort((a, b) => a.type.localeCompare(b.type) || a.number - b.number)
const startingStims = [1, 2, 3, 4, 5, 6, 8, 9, 10].map((n) => `stim-${n}`)
writeFileSync('scripts/srd-convert/starfinder/consumables.json', JSON.stringify({ startingStims, items: out }, null, 2) + '\n')
console.log(out.length, 'items', Object.keys(prop).length, 'renamed')
