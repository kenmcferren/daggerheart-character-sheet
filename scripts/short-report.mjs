// Words saved by the condensed sheet wording, per class. Writes TestArtifacts/short-report/report.md and prints a summary.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const c = JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')).content
const w = (t) => (t ?? '').split(/\s+/).filter(Boolean).length
const use = (f) => (f.short !== undefined ? w(f.short) : w(f.rules))
const rows = c.classes.map((k) => {
  const feats = [k.hopeFeature, ...k.features, ...c.subclasses.filter((s) => s.class === k.id).flatMap((s) => s.features), ...(k.stances ?? []), ...(k.companion?.levelUpOptions ?? [])]
  const before = feats.reduce((n, f) => n + w(f.rules), 0), after = feats.reduce((n, f) => n + use(f), 0)
  return { id: k.id, before, after, done: feats.some((f) => f.short !== undefined) }
})
const total = rows.reduce((t, r) => ({ before: t.before + r.before, after: t.after + r.after }), { before: 0, after: 0 })
const lines = ['# Condensed wording: words per class', '', '| class | SRD words | sheet words | saved | condensed |', '|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.before} | ${r.after} | ${r.before - r.after} (${Math.round(100 * (1 - r.after / r.before))}%) | ${r.done ? 'yes' : 'not yet'} |`),
  `| **total** | ${total.before} | ${total.after} | ${total.before - total.after} | |`]
mkdirSync('TestArtifacts/short-report', { recursive: true })
writeFileSync('TestArtifacts/short-report/report.md', lines.join('\n') + '\n')
console.log(lines.join('\n'))

// Side-by-side review file per condensed class: SRD wording next to the sheet wording.
mkdirSync('TestArtifacts/short-review', { recursive: true })
const esc = (t) => (t ?? '').replace(/\|/g, '\|').replace(/\n/g, '<br>')
for (const k of c.classes) {
  const sections = [['Class', [k.hopeFeature, ...k.features]], ...c.subclasses.filter((s) => s.class === k.id).map((s) => [s.name, s.features]), ['Stances', k.stances ?? []], ['Companion options', k.companion?.levelUpOptions ?? []]]
    .filter(([, l]) => l.some((f) => f.short !== undefined))
  if (!sections.length) continue
  const out = [`# ${k.name}: SRD wording vs sheet wording`, '', 'Sheet wording is what prints; the Creator keeps the SRD wording. "(folded)" = merged into the feature above.', '']
  for (const [title, list] of sections) {
    out.push(`## ${title}`, '', '| feature | SRD wording | sheet wording |', '|---|---|---|')
    for (const f of list) out.push(`| ${f.name ?? f.id ?? '(continued)'} | ${esc(f.rules)} | ${f.short === '' ? '(folded)' : esc(f.short ?? f.rules)} |`)
    out.push('')
  }
  writeFileSync(`TestArtifacts/short-review/${k.id}.md`, out.join('\n'))
}
