// Adds new tests (default run=1), drops stale rows, preserves existing flags.
// Fails on ungoverned top-level suites.
import { discover, readList, writeList, GOVERNANCE } from './test-lib.mjs'

const tests = discover()
const bad = [...new Set(tests.filter((t) => !GOVERNANCE.test(t.top)).map((t) => t.top))]
if (bad.length) {
  console.error(`UNGOVERNED suites (prefix with [evergreen] or [sN]): ${bad.join(', ')}`)
  process.exit(1)
}
const old = readList()
const next = new Map()
let added = 0
for (const t of tests) {
  if (!old.has(t.id)) added++
  next.set(t.id, old.get(t.id) ?? '1')
}
const removed = [...old.keys()].filter((k) => !next.has(k)).length
writeList(next)
console.log(`Test list synced: ${next.size} tests, ${added} added, ${removed} removed.`)
