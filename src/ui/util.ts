import type { Issue } from '../engine/rules'
import type { WizardStep } from '../engine/creation'

export const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export const REVIEW = 'review'

/** Which visible step an engine issue belongs to (frame choices map to the step that asks for them, else equipment). */
export function issueStep(issue: Issue, steps: WizardStep[]): string {
  if (steps.some((s) => s.id === issue.step)) return issue.step
  return steps.find((s) => s.choice === issue.step)?.id ?? 'equipment'
}

/** Saves text as a file through the browser. */
export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name.replace(/[^w.-]+/g, '-')
  a.click()
  URL.revokeObjectURL(url)
}
