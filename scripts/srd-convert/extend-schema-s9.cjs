// One-off: schema additions for Starfinder ancestries (Series 9): feature mechanics.
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const f = s.definitions.feature.properties
f.experienceStart = { type: 'integer', description: 'Starting bonus for new Experiences (Android: 3 instead of 2).' }
f.extraSecondaryWeapon = { type: 'boolean', description: 'The character may wield one more secondary weapon (Kasatha).' }
f.weapon = {
  type: 'object', required: ['name', 'traits', 'range', 'damage', 'damageType'],
  description: 'A natural weapon granted by the feature (claws, bite); printed as a weapon line using the character Proficiency.',
  properties: { name: { type: 'string' }, traits: { type: 'array', items: { type: 'string' }, minItems: 1 }, range: { type: 'string' }, damage: { type: 'string' }, damageType: { enum: ['physical', 'magic'] } },
}
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
{
  const s2 = JSON.parse(fs.readFileSync(p, 'utf8'))
  const en = s2.definitions.frameOp.properties.op.enum
  for (const o of ['list-ancestries-first', 'hide-ancestries', 'disable-mixed-ancestry']) if (!en.includes(o)) en.push(o)
  fs.writeFileSync(p, JSON.stringify(s2, null, 2) + '\n')
}
{
  const s3 = JSON.parse(fs.readFileSync(p, 'utf8'))
  s3.definitions.ancestry.allOf[1].properties.onlyWith = { type: 'string', description: 'Id of the campaign frame or supplement that must be selected for this ancestry to be offered.' }
  fs.writeFileSync(p, JSON.stringify(s3, null, 2) + '\n')
}
