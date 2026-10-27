// One-off: schema additions for the Starheart classes (Series 13): onlyWith and domain-card rules on classes, extra domain on subclasses, Tier-based tracker counts.
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const d = s.definitions
const types = { type: 'object', additionalProperties: { type: 'string' } }
Object.assign(d.class.allOf[1].properties, {
  onlyWith: { type: 'string', description: 'Id of the campaign frame or supplement that must be selected for this class to be offered.' },
  startingDomainCards: { type: 'integer', minimum: 1, description: 'Level 1 domain cards at creation (default 2).' },
  allowedCardTypes: { type: 'array', items: { type: 'string' }, description: 'Only domain cards of these types can be taken (Witchwarper: spell).' },
  cardWords: { type: 'array', description: 'Word swaps printed on this class\'s domain cards (whole words; plurals and capitals kept).', items: { type: 'object', required: ['from', 'to'], additionalProperties: false, properties: { from: { type: 'string' }, to: { type: 'string' }, domains: { type: 'array', items: { $ref: '#/definitions/id' } } } } },
  cardTypes: { ...types, description: 'Card type relabels for this class (spell -> tech).' },
  cardTypeDomains: { type: 'array', items: { $ref: '#/definitions/id' }, description: 'Domains cardTypes applies to (default all).' },
})
d.subclass.allOf[1].properties.extraDomain = { $ref: '#/definitions/id', description: 'Domain this subclass adds, with one extra level 1 card from it at creation.' }
const one = d.count.oneOf
if (!one.some((o) => o.properties && o.properties.tier)) {
  one.push({ type: 'object', required: ['tier'], additionalProperties: false, properties: { tier: { const: true }, base: { type: 'integer' }, trait: one[1].properties.trait } })
  d.count.description = 'Fixed number, derived from a trait modifier, equal to the character level, or Tier plus a base and/or trait (used for circles/boxes printed with rule text).'
}
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
