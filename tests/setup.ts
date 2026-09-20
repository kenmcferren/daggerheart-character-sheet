// Applies TestPolicy/test-master-list.csv: rows flagged 0 are skipped.
import { beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

const skip = new Set<string>()
for (const line of readFileSync('TestPolicy/test-master-list.csv', 'utf8').split(/\r?\n/).slice(1)) {
  const i = line.lastIndexOf(',')
  if (i > 0 && line.slice(i + 1).trim() === '0') skip.add(line.slice(0, i))
}

beforeEach((ctx) => {
  const file = basename(ctx.task.file.name).replace(/\.test\.tsx?$/, '')
  const names: string[] = []
  for (let s = ctx.task.suite; s && s.name; s = s.suite) names.unshift(s.name)
  if (skip.has([file, ...names, ctx.task.name].join('.'))) ctx.skip()
})
