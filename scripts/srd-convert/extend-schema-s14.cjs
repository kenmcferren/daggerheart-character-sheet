// One-off: schema for Starheart ships (Series 14). A supplement can carry `ships`: the ship creation rules and ship domain cards.
// Run: node scripts/srd-convert/extend-schema-s14.cjs
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const d = s.definitions
const id = { $ref: '#/definitions/id' }
const int = (min, max) => ({ type: 'integer', minimum: min, ...(max != null ? { maximum: max } : {}) })
const str = { type: 'string', minLength: 1 }
const obj = (required, properties) => ({ type: 'object', required, additionalProperties: false, properties })
const SYS = ['transport', 'weapons', 'science', 'engineering']
const perSystem = (v) => obj(SYS, Object.fromEntries(SYS.map((k) => [k, v])))

d.shipCard = obj(['id', 'name', 'system', 'domain', 'rules'], {
  id, name: str, system: { enum: SYS }, domain: id, rules: str,
  grants: { type: 'object', additionalProperties: false, minProperties: 1, maxProperties: 1, properties: { stress: int(1), hp: { enum: SYS } }, description: 'While Available bonus: one extra Stress slot, or one extra Hull Point in a system.' },
  reloadTokens: { ...int(1), description: 'Reload Tokens the card holds (full on a new ship).' },
  cardTokens: obj(['name', 'max'], { name: str, max: int(1) }),
  usesPer: { enum: ['refuel', 'scene'], description: 'Once-per use worth a printed checkbox.' },
  tokens: { type: 'array', items: { enum: ['analysis', 'power'] }, description: 'Ship-wide tokens the card gains or spends (prints that tracker).' },
})
d.shipRules = obj(['sizes', 'startingSizes', 'systems', 'configurations', 'frames', 'build', 'tokenCaps', 'domains', 'cards'], {
  frame: obj(['id', 'name'], { id, name: str }),
  source: { type: 'string' },
  sizes: { type: 'array', minItems: 1, items: obj(['size', 'name'], { size: int(1), name: str, short: str }) },
  startingSizes: obj(['flier', 'hub'], { flier: int(1), hub: int(1) }),
  systems: { type: 'array', minItems: 4, maxItems: 4, items: obj(['id', 'name'], { id: { enum: SYS }, name: str, covers: str }) },
  configurations: { type: 'array', minItems: 1, items: obj(['id', 'name', 'caps'], { id, name: str, caps: perSystem(int(0)) }) },
  frames: { type: 'array', minItems: 1, items: obj(['id', 'name', 'freeHp', 'stress', 'evasion', 'thresholds'], { id, name: str, freeHp: int(0), stress: int(1), evasion: int(1), thresholds: { type: 'array', minItems: 2, maxItems: 2, items: int(1) } }) },
  build: obj(['domains', 'cards', 'primaryCap', 'baseHp', 'hpPerCard', 'maxHpPerSystem'], { domains: int(1), cards: int(1), primaryCap: int(1), baseHp: int(0), hpPerCard: int(0), maxHpPerSystem: int(1) }),
  tokenCaps: obj(['analysis', 'power'], { analysis: int(1), power: int(1) }),
  domains: { type: 'array', minItems: 1, items: obj(['id', 'name', 'description'], { id, name: str, focus: str, description: { type: 'string', description: 'Shown in the creator only, never printed.' } }) },
  keywords: { type: 'array', items: obj(['name', 'rules'], { name: str, rules: str }) },
  rulesSections: { type: 'array', items: obj(['title', 'text'], { title: str, text: { type: 'string', description: 'Markdown.' } }) },
  cards: { type: 'array', minItems: 1, items: { $ref: '#/definitions/shipCard' } },
})
d.campaignFrame.allOf[1].properties.ships = { $ref: '#/definitions/shipRules', description: 'Starheart ship creation rules and ship domain cards (Series 14).' }
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
console.log('schema: shipRules and shipCard added; campaignFrame.ships')
