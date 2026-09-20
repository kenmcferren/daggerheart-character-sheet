// Pack validation report: counts, schema errors, missing references, empty rules text.
// Usage: node scripts/validate-packs.mjs [dir ...]   (default: packs/core)
// Writes TestArtifacts/pack-report/report.md and report.json; prints a short summary; exit 1 on problems.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import Ajv from 'ajv'

const schema = JSON.parse(readFileSync('schema/source-pack.schema.json', 'utf8'))
const check = new Ajv({ allErrors: true }).compile(schema)
const dirs = process.argv.length > 2 ? process.argv.slice(2) : ['packs/core']
const packs = dirs.flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => ({ file: join(d, f), data: JSON.parse(readFileSync(join(d, f), 'utf8')) })))

const problems = []
const bad = (pack, msg) => problems.push(`${pack}: ${msg}`)
const counts = {}
const reg = {} // kind -> Map(id -> entry)

for (const { file, data } of packs) {
  if (!check(data)) for (const e of check.errors) bad(file, `schema ${e.instancePath || '/'} ${e.message}`)
  for (const dep of data.extends ?? []) if (!packs.some((p) => p.data.id === dep)) bad(file, `extends missing pack "${dep}"`)
  for (const [kind, list] of Object.entries(data.content ?? {})) {
    reg[kind] ??= new Map()
    counts[data.id] ??= {}
    counts[data.id][kind] = list.length
    for (const e of list) {
      if (reg[kind].has(e.id)) bad(file, `duplicate ${kind} id "${e.id}"`)
      reg[kind].set(e.id, e)
    }
  }
}
const has = (kind, id) => reg[kind]?.has(id)
const all = (kind) => [...(reg[kind]?.values() ?? [])]

// Cross-references
for (const c of all('classes')) {
  for (const d of c.domains ?? []) if (!has('domains', d)) bad('core', `class ${c.id}: unknown domain "${d}"`)
  for (const s of c.subclasses ?? []) if (!has('subclasses', s)) bad('core', `class ${c.id}: unknown subclass "${s}"`)
  if ((c.subclasses ?? []).length !== 2) bad('core', `class ${c.id}: ${(c.subclasses ?? []).length} subclasses (expected 2)`)
}
for (const s of all('subclasses')) {
  if (!has('classes', s.class)) bad('core', `subclass ${s.id}: unknown class "${s.class}"`)
  else if (!(reg.classes.get(s.class).subclasses ?? []).includes(s.id)) bad('core', `subclass ${s.id}: not listed by class ${s.class}`)
}
for (const d of all('domains')) {
  for (const c of d.classes ?? []) {
    if (!has('classes', c)) bad('core', `domain ${d.id}: unknown class "${c}"`)
    else if (!reg.classes.get(c).domains.includes(d.id)) bad('core', `domain ${d.id} lists class ${c}, which does not list the domain`)
  }
  const n = all('domainCards').filter((k) => k.domain === d.id).length
  if (n !== 21) bad('core', `domain ${d.id}: ${n} cards (expected 21)`)
}
for (const k of all('domainCards')) if (!has('domains', k.domain)) bad('core', `card ${k.id}: unknown domain "${k.domain}"`)

// Campaign frames
for (const f of all('campaignFrames')) {
  for (const op of f.creation?.ops ?? []) {
    if (op.op === 'annotate') {
      const [kind, ...rest] = op.target.split('.')
      if (!has(kind, rest.join('.'))) bad(f.id, `annotate target "${op.target}" not found`)
    }
    for (const key of ['with', 'attachTo']) {
      if (op[key]?.startsWith('pools.')) {
        const [, pool, id] = op[key].split('.')
        if (!f.pools?.[pool]) bad(f.id, `${op.op}: pool "${pool}" missing`)
        else if (id && !f.pools[pool].some((e) => e.id === id)) bad(f.id, `${op.op}: pool item "${id}" missing`)
      }
      if (op[key]?.startsWith('choices.') && !f.creation.choices?.some((c) => c.id === op[key].slice(8))) bad(f.id, `${op.op}: choice "${op[key]}" missing`)
    }
  }
}
// Two frames (not supplements) in one load, and pool conflicts between supplements: report as notes, not errors.
const notes = []
const poolOps = {}
for (const f of all('campaignFrames')) for (const op of f.creation?.ops ?? []) if (op.op === 'replace-pool') (poolOps[op.pool] ??= []).push(f.id)
for (const [pool, ids] of Object.entries(poolOps)) if (ids.length > 1) notes.push(`pool "${pool}" is replaced by ${ids.join(', ')} (the wizard must flag this if both are enabled)`)
if (all('campaignFrames').filter((f) => f.frameKind === 'frame').length > 1) notes.push('more than one campaign frame is defined; only one can be chosen per character')

// Rules text present
const empty = (where) => bad('core', `empty rules text: ${where}`)
for (const kind of ['classes', 'subclasses', 'ancestries', 'communities'])
  for (const e of all(kind)) {
    if (kind === 'classes' && !e.hopeFeature?.rules) empty(`${e.id} hope feature`)
    if (!(e.features ?? []).length) empty(`${e.id} has no features`)
    for (const f of e.features ?? []) if (!f.rules?.trim()) empty(`${e.id} feature ${f.name}`)
  }
for (const k of all('domainCards')) if (!k.rules?.trim()) empty(`card ${k.id}`)
for (const e of all('equipment')) if (['item', 'consumable'].includes(e.category) && !e.rules?.trim()) empty(`equipment ${e.id}`)

// Report
const kinds = [...new Set(Object.values(counts).flatMap((c) => Object.keys(c)))]
const md = [
  '# Pack validation report', '',
  `Packs: ${packs.map((p) => p.data.id).join(', ')}`, '',
  '## Counts', '', `| Pack | ${kinds.join(' | ')} |`, `|---|${kinds.map(() => '---').join('|')}|`,
  ...Object.entries(counts).map(([id, c]) => `| ${id} | ${kinds.map((k) => c[k] ?? 0).join(' | ')} |`), '',
  `## Problems (${problems.length})`, '', ...(problems.length ? problems.map((p) => `- ${p}`) : ['None.']), '',
  `## Notes (${notes.length})`, '', ...(notes.length ? notes.map((p) => `- ${p}`) : ['None.']), '',
].join('\n')
mkdirSync('TestArtifacts/pack-report', { recursive: true })
writeFileSync('TestArtifacts/pack-report/report.md', md)
writeFileSync('TestArtifacts/pack-report/report.json', JSON.stringify({ counts, problems, notes }, null, 2))
console.log(Object.entries(counts).map(([id, c]) => `${id}: ${Object.entries(c).map(([k, n]) => `${k} ${n}`).join(', ')}`).join('\n'))
console.log(`${problems.length} problem(s), ${notes.length} note(s). Report: TestArtifacts/pack-report/report.md`)
if (problems.length) { console.log(problems.slice(0, 10).join('\n')); process.exit(1) }
