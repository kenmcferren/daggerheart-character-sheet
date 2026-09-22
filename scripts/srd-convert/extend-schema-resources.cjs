// One-off: class/subclass features may carry `trackers` (resource counters printed under the Hope / Hit Points / Stress / Armor bands).
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
s.definitions.feature.properties.trackers = { type: 'array', items: { $ref: '#/definitions/tracker' } }
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
