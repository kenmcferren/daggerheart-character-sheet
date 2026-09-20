// Builds packs/core/srd-core.json from the SRD Markdown files.
// Rules text only: flavor paragraphs are dropped. Run: node scripts/srd-convert/build-core-pack.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { structureClassExtras, addUses } from './class-extras.mjs'

const SRD = 'Daggerheart SRD Files'
const rd = (p) => readFileSync(join(SRD, p), 'utf8').replace(/\r\n/g, '\n')
const ls = (d) => readdirSync(join(SRD, d)).filter((f) => f.endsWith('.md'))
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const link = (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')

// Split into H2 sections: [{title, lines}] plus the H1 title.
function sections(md) {
  const lines = md.split('\n')
  const title = (lines.find((l) => l.startsWith('# ')) || '').slice(2).trim()
  const out = []
  let cur = null
  for (const l of lines) {
    if (l.startsWith('## ')) { cur = { title: l.slice(3).trim(), lines: [] }; out.push(cur) }
    else if (cur) cur.lines.push(l)
  }
  return { title, sections: out }
}

// Feature blocks: "Name: rules" followed by bullet lines; blank line ends the block.
function features(lines) {
  const blocks = []
  let cur = []
  for (const l of [...lines, '']) {
    if (l.trim() === '') { if (cur.length) blocks.push(cur); cur = [] } else cur.push(l.trim())
  }
  return blocks.map((b) => {
    const m = b[0].match(/^([^:.]{2,60}): ([\s\S]*)$/)
    const [name, first] = m ? [m[1], m[2]] : [null, b[0]]
    const rules = [first, ...b.slice(1)].join('\n')
    return name ? { name, rules } : { rules }
  })
}
const bullets = (lines) => lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim())
const para = (lines) => lines.map((l) => l.trim()).filter(Boolean).join('\n')

// ---- Classes and subclasses
const classes = []
const subclasses = []
for (const f of ls('Classes').filter((f) => f.endsWith('Class.md'))) {
  const { title, sections: secs } = sections(rd(`Classes/${f}`))
  const cls = { id: slug(title), name: title, subclasses: [] }
  const byTitle = (re) => secs.find((s) => re.test(s.title))
  const qf = byTitle(/^Quick Facts/)
  const fact = (k) => (qf.lines.find((l) => l.startsWith(`- **${k}:**`)) || '').replace(`- **${k}:**`, '').trim()
  cls.domains = link(fact('Domains')).split('&').map((d) => slug(d.trim()))
  cls.startingEvasion = Number(fact('Starting Evasion'))
  cls.startingHitPoints = Number(fact('Starting Hit Points'))
  cls.classItems = fact('Class Items')
  const hope = byTitle(/Hope Feature$/)
  cls.hopeFeature = features(hope.lines)[0]
  cls.features = features(byTitle(/^Class Features?$/).lines)
  const isPart = (t) => t === 'Spellcast Trait' || /^(Foundation|Specialization|Mastery) Features?$/.test(t)
  const start = secs.findIndex((s) => /Subclasses$/.test(s.title)) + 1
  const end = secs.findIndex((s) => s.title === 'Background Questions')
  let sub = null
  for (const s of secs.slice(start, end)) {
    if (!isPart(s.title)) {
      sub = { id: `${cls.id}.${slug(s.title)}`, name: s.title, class: cls.id, features: [] }
      subclasses.push(sub); cls.subclasses.push(sub.id)
    } else if (s.title === 'Spellcast Trait') sub.spellcastTrait = para(s.lines).toLowerCase()
    else for (const ft of features(s.lines)) sub.features.push({ ...ft, level: s.title.split(' ')[0].toLowerCase() })
  }
  const bq = byTitle(/^Background Questions$/), cn = byTitle(/^Connections$/)
  cls.backgroundQuestions = bullets(bq.lines)
  cls.connections = bullets(cn.lines)
  const after = secs.slice(secs.indexOf(cn) + 1)
  if (after.length) cls.supplements = after.map((s) => ({ title: s.title, rules: para(s.lines) })).filter((s) => s.rules)
  classes.push(cls)
}

structureClassExtras(classes)
for (const c of classes) for (const f of [c.hopeFeature, ...c.features]) addUses(f, false)

// ---- Ancestries, communities
const ancestries = ls('Ancestries').filter((f) => !['Ancestries.md', 'Mixed Ancestry.md', 'Elemental Kin.md'].includes(f)).map((f) => {
  const { title, sections: secs } = sections(rd(`Ancestries/${f}`))
  return { id: slug(title), name: title, features: features(secs.find((s) => /^Ancestry Features?$/.test(s.title)).lines) }
})
const communities = ls('Communities').filter((f) => f !== 'Communities.md').map((f) => {
  const { title, sections: secs } = sections(rd(`Communities/${f}`))
  return { id: slug(title), name: title, features: features(secs.find((s) => /^Community Features?$/.test(s.title)).lines) }
})

// ---- Domains and cards
const domains = []
const domainCards = []
for (const f of ls('Domains').filter((f) => f.endsWith(' Domain.md'))) {
  const md = rd(`Domains/${f}`)
  const { title, sections: secs } = sections(md)
  const id = slug(title.replace(/ Domain$/, ''))
  const access = (md.match(/\*\*Classes with access:\*\* (.*)/) || [, ''])[1]
  domains.push({ id, name: title.replace(/ Domain$/, ''), classes: link(access).split(',').map((c) => slug(c.trim())).filter(Boolean) })
  for (const s of secs) {
    const m = s.lines.find((l) => l.trim()).match(/^\*\*Level (\d+) \S+ (\S+)\*\* · Recall Cost: (\d+)/)
    if (!m) continue
    const body = s.lines.slice(s.lines.findIndex((l) => l.trim()) + 1)
    domainCards.push({ id: slug(s.title), name: s.title, domain: id, level: Number(m[1]), type: m[2].toLowerCase(), recallCost: Number(m[3]), rules: para(body).replace(/\n{2,}/g, '\n') })
  }
}

for (const card of domainCards) addUses(card, true)

// ---- Equipment tables
const camel = (h) => h.replace(/\(.*\)/, '').trim().toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/[^a-z0-9]/g, '')
function tables(md) {
  const rows = []
  const lines = md.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('|') && /^\|[-| ]+\|$/.test(lines[i + 1] || '')) {
      const head = lines[i].split('|').slice(1, -1).map((h) => h.trim())
      const rawHead = head
      for (i += 2; lines[i]?.startsWith('|'); i++) {
        const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim())
        rows.push(Object.fromEntries(rawHead.map((h, k) => [h, cells[k]])))
      }
    }
  }
  return rows
}
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '—' && v !== ''))
const tierOf = (f) => Number((f.match(/Tier (\d)/) || [, 0])[1]) || undefined
const equipment = []
const add = (e) => equipment.push(clean(e))
for (const f of ls('Equipment')) {
  const md = rd(`Equipment/${f}`)
  const tier = tierOf(f)
  for (const r of tables(md)) {
    if (/^Primary Weapons/.test(f) || /^Secondary Weapons/.test(f) || f === 'Combat Wheelchair.md') {
      const kind = f === 'Combat Wheelchair.md' ? 'wheelchair' : /^Primary/.test(f) ? 'primary' : 'secondary'
      const dm = (r.Damage || '').match(/^(\S+)(?: (phy|mag))?$/)
      add({ id: `weapon.${slug(r.Name)}`, name: r.Name, category: 'weapon', weaponSlot: kind, tier: tier || Number(r.Tier), trait: r.Trait?.toLowerCase(), range: slug(r.Range || ''), damage: dm ? dm[1] : r.Damage, damageType: dm?.[2] === 'phy' ? 'physical' : dm?.[2] === 'mag' ? 'magic' : undefined, burden: slug(r.Burden || ''), feature: r.Feature })
    } else if (/^Armor Tier/.test(f)) {
      const th = r['Base Thresholds (Major / Severe)'].split('/').map((n) => Number(n.trim()))
      add({ id: `armor.${slug(r.Name)}`, name: r.Name, category: 'armor', tier, majorThreshold: th[0], severeThreshold: th[1], armorScore: Number(r['Base Armor Score']), feature: r.Feature })
    } else if (/^Items/.test(f) || /^Consumables/.test(f)) {
      const cat = /^Items/.test(f) ? 'item' : 'consumable'
      add({ id: `${cat}.${slug(r.Name)}`, name: r.Name, category: cat, roll: Number(r.Roll), rules: r.Description, expansion: /Expansion/.test(f) ? 'hope-and-fear' : 'core' })
    }
  }
}

// ---- Assemble and check
const dup = (arr, what) => {
  const seen = new Set()
  for (const e of arr) { if (seen.has(e.id)) throw new Error(`duplicate ${what} id ${e.id}`); seen.add(e.id) }
}
const multiclass = { id: 'multiclass', name: 'Multiclass', minLevel: 5, rules: rd('Core Mechanics/Multiclassing.md').split('\n').filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>')).join('\n') }
const content = { classes, subclasses, ancestries, communities, domains, domainCards, equipment, levelUpOptions: [multiclass] }
for (const [k, v] of Object.entries(content)) dup(v, k)
const pack = { schemaVersion: 1, id: 'srd-core', name: 'Daggerheart SRD 2.0 (core)', version: '2.0.0', publisher: 'Darrington Press (SRD)', content }
mkdirSync('packs/core', { recursive: true })
writeFileSync('packs/core/srd-core.json', JSON.stringify(pack, null, 2) + '\n')
console.log(Object.entries(content).map(([k, v]) => `${k}: ${v.length}`).join(', '))
