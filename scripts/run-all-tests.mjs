// Sync list, run suite with JSON output, write TestArtifacts/<run-id>/report.html, open it.
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const sync = spawnSync('node', ['scripts/sync-test-list.mjs'], { stdio: 'inherit' })
if (sync.status !== 0) process.exit(1)

const id = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const dir = `TestArtifacts/${id}`
mkdirSync(dir, { recursive: true })
const run = spawnSync('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${dir}/results.json`], { shell: true, stdio: 'ignore' })

const r = JSON.parse(readFileSync(`${dir}/results.json`, 'utf8'))
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const rows = r.testResults.flatMap((f) => f.assertionResults.map((a) => ({ name: `${f.name.split(/[\/]/).pop()} › ${a.fullName}`, status: a.status, msg: (a.failureMessages ?? []).join('\n') })))
const n = (s) => rows.filter((x) => x.status === s).length
const color = { passed: '#3b8f5a', failed: '#c0392b', skipped: '#8a8a8a', pending: '#8a8a8a' }
const html = `<!doctype html><meta charset="utf-8"><title>Test report ${id}</title>
<style>body{font:15px Georgia,serif;background:#1c1712;color:#e8dcc4;max-width:900px;margin:2rem auto;padding:0 1rem}
h1{color:#d4a94a;font-variant:small-caps}table{width:100%;border-collapse:collapse}td{padding:.4rem .6rem;border-bottom:1px solid #3a3025}
pre{white-space:pre-wrap;color:#e07a6a;margin:.3rem 0 0}.s{font-weight:bold}</style>
<h1>Test report</h1><p>${id} — <b>${n('passed')}</b> passed, <b>${n('failed')}</b> failed, <b>${n('skipped') + n('pending')}</b> skipped</p>
<table>${rows.map((x) => `<tr><td class="s" style="color:${color[x.status] ?? '#fff'}">${x.status}</td><td>${esc(x.name)}${x.msg ? `<pre>${esc(x.msg)}</pre>` : ''}</td></tr>`).join('')}</table>`
writeFileSync(`${dir}/report.html`, html)
console.log(`${n('passed')} passed, ${n('failed')} failed, ${n('skipped') + n('pending')} skipped. Report: ${dir}/report.html`)
if (!process.env.NO_OPEN) spawnSync('cmd', ['/c', 'start', '', `${dir}\report.html`])
process.exit(run.status ?? 1)
