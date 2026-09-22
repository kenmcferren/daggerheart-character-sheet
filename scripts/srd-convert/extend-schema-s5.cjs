// One-off: schema additions for Series 5, step 1 (level-up rules as data).
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const d = s.definitions
const tierKeyed = (extra) => ({ type: 'object', additionalProperties: false, patternProperties: { '^[234]$': extra } })
d.levelUpOption = {
  description: 'A level-up rule: a tier achievement, a choosable advancement (slots per tier), a fixed per-level step, or a class-specific one (classId).',
  allOf: [{ $ref: '#/definitions/entry' }, {
    type: 'object',
    required: ['kind', 'rules'],
    properties: {
      kind: { enum: ['tier-achievement', 'advancement', 'level-step'] },
      rules: { type: 'string', minLength: 1 },
      classId: { $ref: '#/definitions/id' },
      effect: { enum: ['traits', 'hit-point', 'stress', 'experience', 'domain-card', 'evasion', 'subclass-upgrade', 'proficiency', 'multiclass', 'combo-die', 'thresholds', 'level-domain-card', 'stance', 'companion-option'] },
      slots: tierKeyed({ type: 'integer', minimum: 1 }),
      cost: { type: 'integer', minimum: 1, maximum: 2 },
      minLevel: { type: 'integer', minimum: 1, maximum: 10 },
      marksTraits: { type: 'boolean' },
      crossesOut: { type: 'array', items: { type: 'object', required: ['option', 'scope'], additionalProperties: false, properties: { option: { $ref: '#/definitions/id' }, scope: { enum: ['tier', 'one', 'all'] } } } },
      count: { type: 'integer', minimum: 1 },
      level: { type: 'integer', minimum: 2, maximum: 10 },
      newExperience: { type: 'integer' },
      proficiency: { type: 'integer' },
      clearTraitMarks: { type: 'boolean' },
    },
  }],
}
const content = s.properties.content.properties
content.levelUpOptions = { type: 'array', items: { $ref: '#/definitions/levelUpOption' } }
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
