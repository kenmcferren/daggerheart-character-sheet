// One-off: schema for ship archetypes (Series 15). A ship's two domains give it an archetype: a name and its features.
// Run: node scripts/srd-convert/extend-schema-s15.cjs
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const str = { type: 'string', minLength: 1 }
s.definitions.shipArchetype = {
  type: 'object', required: ['id', 'name', 'domains', 'features'], additionalProperties: false,
  properties: {
    id: { $ref: '#/definitions/id' }, name: str,
    domains: { type: 'array', minItems: 2, maxItems: 2, items: { $ref: '#/definitions/id' }, description: 'The two ship domains that give this archetype, either order.' },
    features: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1, description: 'Rules text with **bold** keywords and costs, *italic* conditions.' } },
    tokens: { type: 'array', items: { enum: ['analysis', 'power'] }, description: 'Ship-wide tokens the features use (prints that tracker).' },
  },
}
s.definitions.shipRules.properties.archetypes = { type: 'array', items: { $ref: '#/definitions/shipArchetype' } }
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
console.log('schema: shipArchetype added; shipRules.archetypes')
