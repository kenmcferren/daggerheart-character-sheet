// One-off: schema additions for Series 3, step 3 (class extras, per-rest uses).
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const d = s.definitions
const per = { enum: ['short-rest', 'long-rest', 'rest', 'scene', 'session'] }
d.feature.properties.usesPer = per
const card = d.domainCard.allOf[1].properties
card.usesPer = per
const cls = d.class.allOf[1].properties
const range = { enum: ['melee', 'very-close', 'close', 'far', 'very-far'] }
const trait = { enum: ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'] }
const featList = { type: 'array', items: { type: 'object', required: ['name', 'rules'], properties: { name: { type: 'string' }, rules: { type: 'string' } } } }
cls.beastforms = {
  type: 'array',
  items: {
    type: 'object', required: ['id', 'name', 'tier', 'features'],
    properties: {
      id: { $ref: '#/definitions/id' }, name: { type: 'string' }, tier: { type: 'integer', minimum: 1, maximum: 4 },
      examples: { type: 'string' },
      traitBonus: { type: 'object', required: ['trait', 'bonus'], properties: { trait, bonus: { type: 'integer' } } },
      evasionBonus: { type: 'integer' },
      attack: { type: 'object', required: ['range', 'trait', 'damage', 'damageType'], properties: { range, trait, damage: { type: 'string' }, damageType: { enum: ['physical', 'magic'] } } },
      advantages: { type: 'array', items: { type: 'string' } },
      features: featList,
    },
  },
}
cls.companion = {
  type: 'object', required: ['startingEvasion', 'experiences', 'levelUpOptions'],
  properties: {
    startingEvasion: { type: 'integer' },
    experiences: { type: 'object', required: ['count', 'bonus'], properties: { count: { type: 'integer' }, bonus: { type: 'integer' } } },
    startingDamageDie: { type: 'string' }, startingRange: range, damageTypes: { type: 'array', items: { enum: ['physical', 'magic'] } },
    exampleExperiences: { type: 'array', items: { type: 'string' } },
    levelUpOptions: { type: 'array', items: { type: 'object', required: ['id', 'name', 'rules'], properties: { id: { $ref: '#/definitions/id' }, name: { type: 'string' }, rules: { type: 'string' } } } },
  },
}
cls.stances = { type: 'array', items: { type: 'object', required: ['id', 'name', 'tier', 'rules'], properties: { id: { $ref: '#/definitions/id' }, name: { type: 'string' }, tier: { type: 'integer', minimum: 1, maximum: 4 }, rules: { type: 'string' } } } }
cls.focusMax = { type: 'integer' }
cls.knownStancesAtCreation = { type: 'integer' }
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
