// One-off: schema additions for Starfinder communities (Series 10): community list op, onlyWith on communities, level-based tracker count.
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const en = s.definitions.frameOp.properties.op.enum
if (!en.includes('list-communities-first')) en.push('list-communities-first')
s.definitions.community.allOf[1].properties.onlyWith = { type: 'string', description: 'Id of the campaign frame or supplement that must be selected for this community to be offered.' }
const one = s.definitions.count.oneOf
if (!one.some((o) => o.properties && o.properties.level)) {
  one.push({ type: 'object', required: ['level'], additionalProperties: false, properties: { level: { const: true } } })
  s.definitions.count.description = 'Fixed number, derived from a trait modifier, or equal to the character level (used for circles/boxes printed with rule text).'
}
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
// Also added (run by hand 2026-10-18): feature.countBox = { label } (write-in count, no cap).
