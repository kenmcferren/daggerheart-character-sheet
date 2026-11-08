// One-off: turns Docs/starheart-ships/v-final.md (Series 14 final text) into scripts/srd-convert/starfinder/ships.json.
// After the first run, hand-edit ships.json; rerunning overwrites it (pass --force), then run mark-ship-cards.mjs to put the print markup back.
// Run: node scripts/srd-convert/starfinder/make-ships-json.mjs --force
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
const OUT = 'scripts/srd-convert/starfinder/ships.json'
if (existsSync(OUT) && !process.argv.includes('--force')) throw new Error(`${OUT} exists; hand-edit it, or pass --force to regenerate`)
const text = readFileSync('Docs/starheart-ships/v-final.md', 'utf8').replace(/\r/g, '')
const md = text.split('\n')
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// Plain rules text, like the SRD cards in the core pack: bold and italic marks removed.
const unbold = (s) => s.replaceAll('**', '').replace(/\*([^*\n]+)\*/g, '$1')
const fail = (m) => { throw new Error(`make-ships-json: ${m}`) }

// Lines of a "## Title" section, up to the next "## " heading or design notes.
function section(title) {
  const i = md.indexOf(`## ${title}`)
  if (i < 0) fail(`no section ${title}`)
  const out = []
  for (let j = i + 1; j < md.length && !md[j].startsWith('## ') && !md[j].startsWith('> **Design notes'); j++) out.push(md[j])
  return out
}
const rows = (lines) => lines.filter((l) => l.startsWith('|')).map((l) => l.split('|').slice(1, -1).map((c) => c.trim())).filter((r) => !r.every((c) => /^:?-+:?$/.test(c))).slice(1)

const sizes = rows(section('Ships')).map(([n, name]) => {
  const m = name.match(/^(.+?) \((.+)\)$/)
  return { size: +n, name: m ? m[1] : name, ...(m ? { short: m[2] } : {}) }
})
const SYS = ['Transport', 'Weapons', 'Science', 'Engineering']
const systems = section('Ships').filter((l) => /^- \*\*\w+:\*\*/.test(l)).map((l) => {
  const m = l.match(/^- \*\*(\w+):\*\* (.+)$/)
  return { id: slug(m[1]), name: m[1], covers: m[2].replace(/\.$/, '') }
})
const create = section('Creating a Ship')
const tables = []
let cur = null
for (const l of create) { if (l.startsWith('|')) { if (!cur) tables.push((cur = [])); cur.push(l) } else cur = null }
const configurations = rows(tables[0]).map(([name, ...caps]) => ({ id: slug(name), name, caps: Object.fromEntries(SYS.map((s, i) => [slug(s), +caps[i]])) }))
const frames = rows(tables[1]).map(([name, freeHp, stress, evasion, thr]) => ({ id: slug(name), name, freeHp: +freeHp, stress: +stress, evasion: +evasion, thresholds: thr.split('/').map(Number) }))
const domains = create.filter((l) => /^ +- \*\*\w+\*\* \(/.test(l)).map((l) => {
  const m = l.match(/\*\*(\w+)\*\* \((.+?)\): (.+)$/)
  return { id: slug(m[1]), name: m[1], focus: m[2], description: m[3] }
})

// Keywords: "- **Name:** rules", sub-bullets kept as "- " lines.
const keywords = []
for (const l of section('Keywords')) {
  const m = l.match(/^- \*\*(.+?):\*\* (.+)$/)
  if (m) keywords.push({ name: m[1], rules: unbold(m[2]) })
  else if (/^ +- /.test(l)) keywords.at(-1).rules += '\n' + unbold(l.trim())
}

// Printed rules sections, kept as Markdown (headings, bullets, tables) for a rules page.
const RULES = ['Characters and Ships', 'Ranges and Moving', 'Resting', 'Locks', 'Attacking', 'Damage', 'Docking', 'Boarding', 'Undocking', 'Adversary Ships', 'Chases']
const rulesSections = RULES.map((title) => ({ title, text: section(title).join('\n').trim() }))

// Cards: "### System", "#### Domain", "**Name,** *System, Domain Domain.* rules".
const cards = []
let sys = null
for (const l of md.slice(md.indexOf('## Ship Domain Cards'))) {
  const h = l.match(/^### (\w+)$/)
  if (h) sys = h[1]
  const m = l.match(/^\*\*(.+?),\*\* \*(\w+), (\w+) Domain\.\* (.+)$/)
  if (!m) continue
  const [, name, system, domain, raw] = m
  if (system !== sys) fail(`${name} listed under ${sys}`)
  const rules = unbold(raw)
  const card = { id: slug(name), name, system: slug(system), domain: slug(domain), rules }
  const grant = rules.match(/While Available: You have an extra (Stress slot|(\w+) Hull Point)\./)
  if (grant) card.grants = grant[2] ? { hp: slug(grant[2]) } : { stress: 1 }
  const reload = rules.match(/holds (\d+) Reload Tokens/)
  if (reload) card.reloadTokens = +reload[1]
  const own = rules.match(/put (\d+|an?) (\w+(?: \w+)?) Tokens? on this card(?: \(up to (\d+)\))?/)
  if (own) card.cardTokens = { name: own[2], max: +(own[3] ?? (/^\d/.test(own[1]) ? own[1] : 1)) }
  const per = rules.match(/Once per (Refuel|scene)\b/)
  if (per) card.usesPer = per[1].toLowerCase()
  const tokens = ['Analysis', 'Power'].filter((t) => rules.includes(`${t} Token`)).map((t) => t.toLowerCase())
  if (tokens.length) card.tokens = tokens
  cards.push(card)
}
if (cards.length !== 108) fail(`expected 108 cards, found ${cards.length}`)

const out = {
  frame: { id: 'starheart-ships', name: 'Starheart Ships' },
  source: 'Docs/starheart-ships/v-final.md (Series 14)',
  sizes,
  startingSizes: { flier: 2, hub: 3 },
  systems,
  configurations,
  frames,
  build: { domains: 2, cards: 6, primaryCap: 4, baseHp: 1, hpPerCard: 1, maxHpPerSystem: 7 },
  tokenCaps: { analysis: 12, power: 12 },
  domains,
  keywords,
  rulesSections,
  cards,
}
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
const n = (f) => cards.filter(f).length
console.log(`ships.json: ${sizes.length} sizes, ${systems.length} systems, ${configurations.length} configurations, ${frames.length} frames, ${domains.length} domains, ${keywords.length} keywords, ${rulesSections.length} rules sections, ${cards.length} cards`)
console.log(`  grants ${n((c) => c.grants)}, reload ${n((c) => c.reloadTokens)}, card tokens ${cards.filter((c) => c.cardTokens).map((c) => `${c.name} (${c.cardTokens.name} ${c.cardTokens.max})`).join(', ')}`)
console.log(`  usesPer ${cards.filter((c) => c.usesPer).map((c) => `${c.name}:${c.usesPer}`).join(', ')}`)
console.log(`  analysis ${n((c) => c.tokens?.includes('analysis'))}, power ${n((c) => c.tokens?.includes('power'))}`)
