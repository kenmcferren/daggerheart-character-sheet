// Builds packs/core/srd-frames.json (Witherwild frame + SRD supplements) from the SRD Markdown.
// Rules text only. Run after build-core-pack.mjs: node scripts/srd-convert/build-frame-pack.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRD = 'Daggerheart SRD Files'
const rd = (p) => readFileSync(join(SRD, p), 'utf8').replace(/\r\n/g, '\n')
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const para = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')

// Body of an H2/H3 section by title (up to the next heading of the same or higher level).
function section(md, title, level = 2) {
  const lines = md.split('\n')
  const mark = '#'.repeat(level) + ' '
  const i = lines.findIndex((l) => l === mark + title)
  if (i < 0) throw new Error(`section not found: ${title}`)
  let j = i + 1
  while (j < lines.length && !(lines[j].startsWith('#') && lines[j].match(/^#+/)[0].length <= level)) j++
  return para(lines.slice(i + 1, j).join('\n'))
}
function tables(md) {
  const rows = []
  const lines = md.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('|') && /^\|[-| ]+\|$/.test(lines[i + 1] || '')) {
      const head = lines[i].split('|').slice(1, -1).map((h) => h.trim())
      const tbl = []
      for (i += 2; lines[i]?.startsWith('|'); i++) {
        const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim())
        tbl.push(Object.fromEntries(head.map((h, k) => [h, cells[k]])))
      }
      rows.push(tbl)
    }
  }
  return rows
}
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '—' && v !== ''))
const dmg = (s) => { const m = s.match(/^(\S+)(?: (phy|mag))?$/); return { damage: m[1], damageType: m[2] === 'mag' ? 'magic' : 'physical' } }
const tiered = (s, re) => Object.fromEntries([...s.matchAll(re)].map((m) => [m[1], m.slice(2)]))

function weapon(r, slot) {
  const base = { id: slug(r.Name), name: r.Name, weaponSlot: slot, trait: r.Trait.toLowerCase(), range: slug(r.Range), burden: slug(r.Burden), feature: r.Feature }
  if (/^Tier 1/.test(r.Damage)) {
    const t = tiered(r.Damage, /Tier (\d): (\S+) (phy|mag)/g)
    const tiers = Object.fromEntries(Object.entries(t).map(([k, [d]]) => [k, { damage: d }]))
    return clean({ ...base, damageType: Object.values(t)[0][1] === 'mag' ? 'magic' : 'physical', tiers })
  }
  return clean({ ...base, ...dmg(r.Damage) })
}
function armor(r, tierCol) {
  const base = { id: slug(r.Name), name: r.Name, feature: r.Feature }
  if (/^Tier 1/.test(r.Thresholds)) {
    const th = tiered(r.Thresholds, /Tier (\d): (\d+)\/(\d+)/g), sc = tiered(r.Score, /Tier (\d): (\d+)/g)
    return clean({ ...base, tiers: Object.fromEntries(Object.keys(th).map((k) => [k, { majorThreshold: +th[k][0], severeThreshold: +th[k][1], armorScore: +sc[k][0] }])) })
  }
  const [maj, sev] = r.Thresholds.split('/').map((n) => +n.trim())
  return clean({ ...base, majorThreshold: maj, severeThreshold: sev, armorScore: +r.Score })
}
const weaponsFrom = (md, headTitle, slot, lvl = 3) => {
  const at = md.indexOf(`${'#'.repeat(lvl)} ${headTitle}`)
  return tables(md.slice(at))[0].map((r) => weapon(r, slot))
}
const armorFrom = (md) => tables(md.slice(md.indexOf('### Armor')))[0].map(armor)

const S = (f) => rd(`Supplemental Campaign Mechanics/${f}.md`)
const C = (f) => rd(`Campaign Frames/${f}.md`)

// ---- Witherwild
const wwClasses = C('Witherwild Classes'), wwAnc = C('Witherwild Ancestries'), wwCom = C('Witherwild Communities')
const questions = (body) => body.split('\n').filter((l) => /\?$/.test(l))
const notes = (body) => body.split('\n').filter((l) => !/\?$/.test(l)).join('\n')
const ann = (target, body) => ({ op: 'annotate', target, text: notes(body), ...(questions(body).length ? { questions: questions(body) } : {}) })
const comBody = (s) => section(wwCom, s)
const galapaBody = section(wwAnc, 'Galapa and Ribbets').split('\n')
const galapa = galapaBody.filter((l) => !/^Havenites and the Serpent/.test(l)).join('\n')
const serpent = galapaBody.find((l) => /^Havenites and the Serpent/.test(l)).replace(/^Havenites and the Serpent’s Sickness /, '')
const commNames = { Loreborne: 'loreborne', Highborne: 'highborne', Ridgeborne: 'ridgeborne', Underborne: 'underborne', Wildborne: 'wildborne', Orderborne: 'orderborne', Slyborne: 'slyborne', Seaborne: 'seaborne', Wanderborne: 'wanderborne' }
function communityOps() {
  const out = []
  for (const m of wwCom.matchAll(/^## (.+)$/gm)) {
    const title = m[1]
    const body = section(wwCom, title).split('\n')
    if (title === 'Loreborne and Highborne') {
      const hi = body.findIndex((l) => /^In Haven/.test(l))
      out.push(ann('communities.loreborne', body.slice(0, hi).join('\n')), ann('communities.highborne', body.slice(hi).join('\n')))
    } else for (const n of title.split(/, and |, | and /)) out.push(ann('communities.' + commNames[n.trim()], body.join('\n')))
  }
  return out
}
const witherwild = {
  id: 'witherwild', name: 'The Witherwild', frameKind: 'supplement',
  sessionZeroQuestions: para(C('Witherwild Session Zero Questions').split('\n').slice(4).join('\n')).split('\n').filter((q) => q.endsWith('?')),

  creation: {
    ops: [
      ann('classes.druid', 'Druids, rangers, and sorcerers are commonly found throughout Fanewick. If players choose one of these classes, they should consider how their character’s connection to the natural world might be impacted by the Witherwild.'),
      ann('classes.ranger', 'See Druid.'),
      ann('classes.sorcerer', 'See Druid.'),
      ann('classes.warrior', section(wwClasses, 'Warriors and Wizards')),
      ann('classes.wizard', section(wwClasses, 'Warriors and Wizards')),
      ann('subclasses.guardian.vengeance', section(wwClasses, 'Vengeance Guardian')),
      ann('subclasses.rogue.syndicate', section(wwClasses, 'Syndicate Rogue')),
      ann('ancestries.clank', section(wwAnc, 'Clanks')),
      ann('ancestries.fungril', section(wwAnc, 'Fungril')),
      ...['drakona', 'faun', 'firbolg', 'infernis'].map((a) => ann(`ancestries.${a}`, section(wwAnc, 'Drakona, Fauns, Firbolgs, and Infernis'))),
      ann('ancestries.galapa', galapa),
      ann('ancestries.ribbet', galapa),
      ...communityOps(),
      { op: 'back-sheet', title: 'Serpent’s Sickness', body: serpent },
      { op: 'add-tracker', id: 'wither-tokens', shape: 'box', count: 12, label: 'Wither tokens', placement: 'front' },
      { op: 'back-sheet', title: 'Corruption From the Witherwild', body: section(C('Witherwild Campaign Mechanics'), 'Corruption From the Witherwild').split('\n').slice(1).join('\n') },
    ],
  },
}
// Anything in the Witherwild files the ops above did not carry (other communities, Serpent's Sickness) is checked below.

// ---- Supplements
const eh = S('Everyday Hero Starting Equipment')
const everydayHero = {
  id: 'everyday-hero', name: 'Everyday Hero Starting Equipment', frameKind: 'supplement',
  pools: { weapons: [...weaponsFrom(eh, 'Primary Physical Weapons', 'primary'), ...weaponsFrom(eh, 'Primary Magic Weapons', 'primary'), ...weaponsFrom(eh, 'Secondary Weapons', 'secondary')], armor: armorFrom(eh) },
  creation: { ops: [{ op: 'replace-pool', pool: 'weapons', with: 'pools.weapons' }, { op: 'replace-pool', pool: 'armor', with: 'pools.armor' }] },
}
const west = S('Western Campaigns')
const westWeapons = [...weaponsFrom(west, 'Primary Weapons', 'primary'), ...weaponsFrom(west, 'Secondary Weapons', 'secondary')]
const dyn = west.match(/Dynamite: \(Consumable\) (.*)/)[1]
const western = {
  id: 'western', name: 'Western Campaigns', frameKind: 'supplement',
  pools: { weapons: westWeapons, consumables: [{ id: 'dynamite', name: 'Dynamite', category: 'consumable', rules: dyn }] },
  creation: { ops: [{ op: 'add-to-pool', pool: 'weapons', with: 'pools.weapons' }, { op: 'add-to-pool', pool: 'consumables', with: 'pools.consumables' }, { op: 'add-tracker', id: 'revolver-ammo', shape: 'circle', count: 6, label: 'Ammo', attachTo: 'pools.weapons.revolver' }] },
}
const mh = S('Monster Hunting Campaigns')
const monsterHunting = {
  id: 'monster-hunting', name: 'Monster Hunting Campaigns', frameKind: 'supplement',
  pools: { weapons: [...weaponsFrom(mh, 'Primary Weapons', 'primary'), ...weaponsFrom(mh, 'Secondary Weapons', 'secondary')], armor: armorFrom(mh) },
  creation: { ops: [{ op: 'add-to-pool', pool: 'weapons', with: 'pools.weapons' }, { op: 'add-to-pool', pool: 'armor', with: 'pools.armor' }, { op: 'back-sheet', title: 'Reanimated', body: section(mh, 'Reanimated') }] },
}
const tech = S('Tech-Based Campaigns')
const techFrame = {
  id: 'tech', name: 'Tech-Based Campaigns', frameKind: 'supplement',
  creation: {
    choices: [{ id: 'iconic-weapon', type: 'builder', fields: [
      { key: 'trait', options: ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'] },
      { key: 'range', options: ['melee', 'very-close', 'close', 'far', 'very-far'] },
      { key: 'damage', options: ['d6+0', 'd8+0', 'd10+0', 'd12+0'] },
      { key: 'name', free: true }, { key: 'description', free: true }], fixed: { burden: 'two-handed', feature: 'Bonded: Gain a bonus to your damage rolls equal to your level.' } }],
    ops: [
      { op: 'replace-pool', pool: 'weapons', with: 'choices.iconic-weapon' },
      { op: 'set-resource', resource: 'currency', name: 'Credits', start: 5 },
      { op: 'grant', item: 'Tech Link', rules: section(tech, 'Tech Link') },
      { op: 'add-tracker', id: 'upgrade-slots', shape: 'box', count: 2, perTier: 1, label: 'Upgrade slots', attachTo: 'choices.iconic-weapon' },
      { op: 'back-sheet', title: 'Upgrades', body: section(tech, 'Upgrades') },
      { op: 'back-sheet', title: 'Crafting & Trading', body: [section(tech, 'Crafting & Trading'), section(tech, 'Converting Gold to Credits')].join('\n') },
      { op: 'back-sheet', title: 'Scrap', body: [section(tech, 'Gathering Scrap'), tables(tech)[0].map((r) => `${r['Scrap Type (die)']}: ${r.Results}`).join('\n')].join('\n') },
    ],
  },
}
const fe = S('Feasts')
const feasts = {
  id: 'feasts', name: 'Feasts', frameKind: 'supplement',
  creation: { ops: [
    { op: 'remove-move', move: 'tend-to-wounds' }, { op: 'remove-move', move: 'clear-stress' }, { op: 'remove-move', move: 'prepare' },
    { op: 'add-move', id: 'make-a-feast', name: 'Make a Feast', rules: section(fe, 'Make a Feast') },
    { op: 'back-sheet', title: 'Ingredients & Flavors', body: section(fe, 'Ingredients & Flavors').split('\n').filter((l) => !/^- .*\(\d\)/.test(l)).join('\n') },
    { op: 'back-sheet', title: 'Make a Feast', body: ['Preparing the Dish', 'Determining a Meal’s Rating', 'Eating the Meal'].map((t) => `${t}\n${section(fe, t)}`).join('\n') },
  ] },
}
const fairy = {
  id: 'fairy-tale', name: 'Fairy Tale Campaigns', frameKind: 'supplement',
  creation: { ops: [{ op: 'insert-step', before: 'creation', step: 'villain-prompts', title: 'Building the villain collaboratively', text: section(S('Fairy Tale Campaigns'), 'Collaboratively', 2).split('\n').slice(1).join('\n') }, { op: 'back-sheet', title: 'Curses', body: section(S('Fairy Tale Campaigns'), 'Curses') }] },
}
const fl = S('Floating Magic School Campaigns')
const floating = {
  id: 'floating-magic-school', name: 'Floating Magic School Campaigns', frameKind: 'supplement',
  creation: { choices: [{ id: 'flight-artifact', type: 'text' }], ops: [{ op: 'insert-step', before: 'traits', step: 'flight-artifact', choice: 'flight-artifact', title: 'Create a magic artifact you can use to fly' }, { op: 'back-sheet', title: 'Flight', body: section(fl, 'Flight') }, { op: 'back-sheet', title: 'Using Traits for Flight', body: section(fl, 'Using Traits for Flight') }, { op: 'back-sheet', title: 'Less Lethal Campaigns', body: section(fl, 'Less Lethal Campaigns') }] },
}
const gd = S('Grimdark Campaigns')
const grimdark = {
  id: 'grimdark', name: 'Grimdark Campaigns', frameKind: 'supplement',
  creation: { ops: [{ op: 'add-tracker', id: 'scars', shape: 'box', count: 6, label: 'Scars (marked on Hope slots)', placement: 'front' }, { op: 'back-sheet', title: 'Shadow-Touched (PCs)', body: para(section(gd, 'Shadow-Touched').split('\n').filter((l) => /^PCs can also/.test(l)).join('\n')) }] },
}

const campaignFrames = [witherwild, everydayHero, western, monsterHunting, techFrame, feasts, fairy, floating, grimdark]

// Condensed sheet wording and tables for the printed campaign rules (hand-edited): short-heritage/campaign-rules.json
// { "<frameId>": { "<back-sheet title>" | "move:<add-move name>" | "grant:<item>": { "short": "...", "table"?: { "head": [...], "rows": [[...]] } } } }
// The SRD wording stays in `body` / `rules`; the sheet prints `short` (then the table). Every key must match an op, every op with an entry is used once.
const shortRules = JSON.parse(readFileSync('scripts/srd-convert/short-heritage/campaign-rules.json', 'utf8'))
let shortApplied = 0
for (const [frameId, entries] of Object.entries(shortRules)) {
  const frame = campaignFrames.find((f) => f.id === frameId)
  if (!frame) throw new Error(`campaign-rules.json: unknown frame ${frameId}`)
  for (const [key, e] of Object.entries(entries)) {
    const op = frame.creation.ops.find((o) => (o.op === 'back-sheet' && o.title === key) || (o.op === 'add-move' && `move:${o.name}` === key) || (o.op === 'grant' && `grant:${o.item}` === key))
    if (!op) throw new Error(`campaign-rules.json: ${frameId} has no rule "${key}"`)
    op.short = e.short
    if (e.table) op.table = e.table
    shortApplied++
  }
}
console.log(`campaign rule shorts applied: ${shortApplied}`)
const pack = { schemaVersion: 1, id: 'srd-frames', name: 'Daggerheart SRD 2.0 (campaign frames and supplements)', version: '2.0.0', publisher: 'Darrington Press (SRD)', extends: ['srd-core'], content: { campaignFrames } }
writeFileSync('packs/core/srd-frames.json', JSON.stringify(pack, null, 2) + '\n')
console.log(campaignFrames.map((f) => `${f.id}: ${f.creation.ops.length} ops`).join(', '))
