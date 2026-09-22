// One-off: schema addition for condensed sheet wording (`short`) on features, stances and companion options.
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const d = s.definitions
const short = { type: 'string', description: 'Condensed wording for the printed sheet; "" = print nothing (folded into the previous feature).' }
d.feature.properties.short = short
d.feature.properties.sheetCards = {
  type: 'object', required: ['label', 'items'],
  description: 'Items printed as their own blocks on the domain card sheet (e.g. poisons).',
  properties: { label: { type: 'string' }, items: { type: 'array', items: { type: 'object', required: ['name', 'short'], properties: { name: { type: 'string' }, short: { type: 'string' } } } } },
}
d.feature.properties.sheetTable = {
  type: 'object', required: ['title', 'rows'],
  description: 'One column of a table printed across the top of the domain card sheet; the row names are shared by the subclass features.',
  properties: { title: { type: 'string' }, rows: { type: 'array', items: { type: 'object', required: ['name', 'short'], properties: { name: { type: 'string' }, short: { type: 'string' } } } } },
}
const cls = d.class.allOf[1].properties
cls.stances.items.properties.short = short
cls.companion.properties.levelUpOptions.items.properties.short = short
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
