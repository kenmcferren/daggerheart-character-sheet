// Shared helpers for the test harness. Test id = <file>.<suite path>.<test name>.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { execFileSync } from 'node:child_process'

export const LIST_PATH = 'TestPolicy/test-master-list.csv'
// Governance: every top-level describe must start with [evergreen] or [sN] (series number).
export const GOVERNANCE = /^\[(evergreen|s\d+)\] /

export function idOf(file, fullName) {
  const base = basename(file).replace(/\.test\.tsx?$/, '')
  return [base, ...fullName.split(' > ')].join('.')
}

export function discover() {
  const out = execFileSync('npx', ['vitest', 'list', '--json'], { encoding: 'utf8', shell: true })
  return JSON.parse(out.slice(out.indexOf('[')))
    .map((t) => ({ id: idOf(t.file, t.name), top: t.name.split(' > ')[0] }))
}

export function readList(path = LIST_PATH) {
  const flags = new Map()
  if (!existsSync(path)) return flags
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/).slice(1)) {
    const i = line.lastIndexOf(',')
    if (i > 0) flags.set(line.slice(0, i), line.slice(i + 1).trim())
  }
  return flags
}

export function writeList(flags, path = LIST_PATH) {
  const rows = [...flags].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k},${v}`)
  writeFileSync(path, ['test,run', ...rows].join('\n') + '\n')
}
