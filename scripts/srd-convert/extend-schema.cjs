// One-off: adds kind-specific definitions to schema/source-pack.schema.json (Series 2, step 2).
const fs = require('fs')
const p = 'schema/source-pack.schema.json'
const s = JSON.parse(fs.readFileSync(p, 'utf8'))
const ref = (n) => ({ type: 'array', items: { $ref: '#/definitions/' + n } })
const c = s.properties.content.properties
c.classes = ref('class'); c.subclasses = ref('subclass'); c.ancestries = ref('ancestry'); c.communities = ref('community')
c.domains = ref('domain'); c.domainCards = ref('domainCard'); c.equipment = ref('equipmentItem'); c.campaignFrames = ref('campaignFrame')
const d = s.definitions
const traits = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge']
const ext = (props, req = []) => ({ allOf: [{ $ref: '#/definitions/entry' }, { type: 'object', required: req, properties: props }] })
d.entry.description = 'Base entry. Kind definitions add typed fields; unknown extra fields are allowed so third-party packs can carry their own data. Rules fields hold SRD rules text only (no flavor).'
d.count = { description: 'Fixed number, or derived from a trait modifier (used for circles printed with rule text).', oneOf: [{ type: 'integer', minimum: 0 }, { type: 'object', required: ['trait'], additionalProperties: false, properties: { trait: { enum: [...traits, 'spellcast'] } } }] }
d.feature = { type: 'object', required: ['rules'], properties: { name: { type: 'string' }, rules: { type: 'string', minLength: 1 }, level: { enum: ['foundation', 'specialization', 'mastery'] }, uses: { $ref: '#/definitions/count' } } }
d.features = { type: 'array', items: { $ref: '#/definitions/feature' } }
d.tracker = { description: 'Printed marks only, never stored. box = HP/Armor/Stress/frame counters; circle = uses tied to a trait.', type: 'object', required: ['id', 'shape', 'count', 'label'], additionalProperties: false, properties: { id: { $ref: '#/definitions/id' }, shape: { enum: ['box', 'circle'] }, count: { $ref: '#/definitions/count' }, label: { type: 'string' }, placement: { enum: ['front', 'back'] }, attachTo: { type: 'string' } } }
d.choice = { description: 'A choice the wizard asks the player.', type: 'object', required: ['id', 'type'], properties: { id: { $ref: '#/definitions/id' }, type: { enum: ['pick', 'text', 'roll-table', 'builder', 'pick-one-each-from'] }, min: { type: 'integer' }, max: { type: 'integer' }, pool: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } }, fields: { type: 'array', items: { type: 'object', required: ['key'], properties: { key: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, free: { type: 'boolean' } } } }, fixed: { type: 'object' } } }
d.frameOp = { description: 'One ordered operation a campaign frame applies to character creation. Per-op fields are validated when frame packs are built (step 3).', type: 'object', required: ['op'], properties: { op: { enum: ['replace-pool', 'add-to-pool', 'insert-step', 'set-resource', 'grant', 'annotate', 'remove-move', 'add-move', 'add-tracker', 'add-levelup-option', 'back-sheet'] } } }
d.class = ext({ domains: { type: 'array', items: { $ref: '#/definitions/id' }, minItems: 2, maxItems: 2 }, startingEvasion: { type: 'integer' }, startingHitPoints: { type: 'integer' }, classItems: { type: 'string' }, hopeFeature: { $ref: '#/definitions/feature' }, features: { $ref: '#/definitions/features' }, subclasses: { type: 'array', items: { $ref: '#/definitions/id' } }, backgroundQuestions: { type: 'array', items: { type: 'string' } }, connections: { type: 'array', items: { type: 'string' } }, supplements: { type: 'array', items: { type: 'object', required: ['title', 'rules'], properties: { title: { type: 'string' }, rules: { type: 'string' } } } } })
d.subclass = ext({ class: { $ref: '#/definitions/id' }, spellcastTrait: { enum: traits }, features: { $ref: '#/definitions/features' } }, ['class'])
d.ancestry = ext({ features: { $ref: '#/definitions/features' } })
d.community = ext({ features: { $ref: '#/definitions/features' } })
d.domain = ext({ classes: { type: 'array', items: { $ref: '#/definitions/id' } } })
d.domainCard = ext({ domain: { $ref: '#/definitions/id' }, level: { type: 'integer', minimum: 1, maximum: 10 }, type: { type: 'string' }, recallCost: { type: 'integer', minimum: 0 }, rules: { type: 'string' }, uses: { $ref: '#/definitions/count' }, trackers: { type: 'array', items: { $ref: '#/definitions/tracker' } } }, ['domain', 'level'])
d.equipmentItem = ext({ category: { enum: ['weapon', 'armor', 'item', 'consumable'] }, tier: { type: 'integer', minimum: 1, maximum: 4 }, weaponSlot: { enum: ['primary', 'secondary', 'wheelchair'] }, trait: { enum: [...traits, 'spellcast'] }, range: { type: 'string' }, damage: { type: 'string' }, damageType: { enum: ['physical', 'magic'] }, burden: { type: 'string' }, majorThreshold: { type: 'integer' }, severeThreshold: { type: 'integer' }, armorScore: { type: 'integer' }, feature: { type: 'string' }, roll: { type: 'integer' }, rules: { type: 'string' }, tiers: { type: 'object' } })
d.campaignFrame = ext({ creation: { type: 'object', properties: { choices: { type: 'array', items: { $ref: '#/definitions/choice' } }, ops: { type: 'array', items: { $ref: '#/definitions/frameOp' } } } }, trackers: { type: 'array', items: { $ref: '#/definitions/tracker' } } })
fs.writeFileSync(p, JSON.stringify(s, null, 2) + '\n')
// Step 3 additions (applied separately): campaignFrame.frameKind/sessionZeroQuestions/pools, tracker.perTier.
