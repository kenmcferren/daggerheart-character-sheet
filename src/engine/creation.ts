import { loadPacks, type Entry, type Registry } from './packs'

/** SRD character creation order. Frames may insert steps before any of these. */
export const BASE_STEPS = [
  { id: 'class', title: 'Class' },
  { id: 'subclass', title: 'Subclass' },
  { id: 'ancestry', title: 'Ancestry' },
  { id: 'community', title: 'Community' },
  { id: 'traits', title: 'Traits' },
  { id: 'equipment', title: 'Starting equipment' },
  { id: 'background', title: 'Background' },
  { id: 'experiences', title: 'Experiences' },
  { id: 'domain-cards', title: 'Domain cards' },
  { id: 'connections', title: 'Connections' },
] as const

/** Pseudo step id: an inserted step "before creation" comes ahead of every base step. */
export const BEFORE_CREATION = 'creation'

export interface FrameOp { op: string; [field: string]: unknown }
type SourcedOp = FrameOp & { source: string }

export interface FrameEntry extends Entry {
  frameKind?: 'frame' | 'supplement'
  pools?: Record<string, Entry[]>
  creation?: { choices?: { id: string; type: string; [f: string]: unknown }[]; ops?: FrameOp[] }
  sessionZeroQuestions?: string[]
}

export interface WizardStep {
  id: string
  title: string
  text?: string
  choice?: string
  /** Frame id that inserted the step; absent for base steps. */
  source?: string
}

export interface Conflict {
  kind:
    | 'pool-replaced-twice' | 'pool-replace-and-add' | 'resource-set-twice'
    | 'step-duplicate' | 'tracker-duplicate' | 'move-conflict'
  key: string
  frames: string[]
  message: string
}

export interface CreationSetup {
  frame?: FrameEntry
  supplements: FrameEntry[]
  registry: Registry
  /** Every op in application order: frame first, then supplements in the order given. */
  ops: SourcedOp[]
  conflicts: Conflict[]
  steps: WizardStep[]
  /** Annotation text per target ("classes.druid"), each with its source frame. */
  annotations: Map<string, { source: string; text: string }[]>
  /** Item pool contributions per pool name, in application order (a replace resets the list). */
  pools: Map<string, PoolContribution[]>
}

export interface PoolContribution {
  source: string
  mode: 'replace' | 'add'
  entries: Entry[]
  /** Set when the pool is built by a frame choice (e.g. Tech's Iconic Weapon) rather than listed entries. */
  choice?: string
}

export class CreationError extends Error {}

const poolEntries = (f: FrameEntry, ref: unknown): Entry[] => {
  const s = String(ref ?? '')
  return s.startsWith('pools.') ? f.pools?.[s.slice(6)] ?? [] : []
}

/**
 * Merges enabled packs with one frame and any number of supplements into the
 * options and ordered step list the wizard walks. Pure function of its inputs.
 */
export function buildCreation(
  packs: unknown[],
  selection: { frame?: string; supplements?: string[] } = {},
): CreationSetup {
  const registry = loadPacks(packs)
  const get = (id: string, want: 'frame' | 'supplement'): FrameEntry => {
    const f = registry.campaignFrames.get(id) as FrameEntry | undefined
    if (!f) throw new CreationError(`Unknown campaign frame "${id}"`)
    if ((f.frameKind ?? 'frame') !== want) throw new CreationError(`"${id}" is a ${f.frameKind}, not a ${want}`)
    return f
  }
  const frame = selection.frame ? get(selection.frame, 'frame') : undefined
  const ids = selection.supplements ?? []
  if (new Set(ids).size !== ids.length) throw new CreationError('Supplement listed twice')
  const supplements = ids.map((id) => get(id, 'supplement'))
  const active = [...(frame ? [frame] : []), ...supplements]

  const ops: SourcedOp[] = active.flatMap((f) => (f.creation?.ops ?? []).map((o) => ({ ...o, source: f.id })))

  const annotations = new Map<string, { source: string; text: string }[]>()
  const pools = new Map<string, PoolContribution[]>()
  for (const o of ops) {
    const f = active.find((a) => a.id === o.source)!
    if (o.op === 'annotate') {
      const key = String(o.target)
      annotations.set(key, [...(annotations.get(key) ?? []), { source: f.id, text: String(o.text) }])
    } else if (o.op === 'replace-pool' || o.op === 'add-to-pool') {
      const name = String(o.pool)
      const cur = o.op === 'replace-pool' ? [] : pools.get(name) ?? []
      const ref = String(o.with ?? '')
      const choice = ref.startsWith('choices.') ? ref.slice(8) : undefined
      pools.set(name, [...cur, { source: f.id, mode: o.op === 'replace-pool' ? 'replace' : 'add', entries: poolEntries(f, ref), ...(choice ? { choice } : {}) }])
    }
  }

  return { frame, supplements, registry, ops, conflicts: detectConflicts(ops, Object.fromEntries(active.map((f) => [f.id, f.name]))), steps: deriveSteps(ops), annotations, pools }
}

function deriveSteps(ops: SourcedOp[]): WizardStep[] {
  const steps: WizardStep[] = BASE_STEPS.map((s) => ({ ...s }))
  const front: WizardStep[] = []
  for (const o of ops) {
    if (o.op !== 'insert-step') continue
    const step: WizardStep = {
      id: String(o.step), title: String(o.title ?? o.step), source: o.source,
      ...(o.text ? { text: String(o.text) } : {}), ...(o.choice ? { choice: String(o.choice) } : {}),
    }
    if (steps.some((s) => s.id === step.id) || front.some((s) => s.id === step.id)) continue // reported as a conflict
    if (o.before === BEFORE_CREATION) { front.push(step); continue }
    const at = steps.findIndex((s) => s.id === o.before)
    if (at < 0) throw new CreationError(`Frame "${o.source}" inserts step "${step.id}" before unknown step "${o.before}"`)
    steps.splice(at, 0, step)
  }
  return [...front, ...steps]
}

/** `names` maps frame ids to display names for the messages. */
export function detectConflicts(ops: SourcedOp[], names: Record<string, string> = {}): Conflict[] {
  const out: Conflict[] = []
  const uniq = (a: string[]) => [...new Set(a)]
  const nm = (a: string[]) => uniq(a).map((id) => names[id] ?? id)
  const group = (op: string, key: string) => {
    const m = new Map<string, string[]>()
    for (const o of ops) if (o.op === op) m.set(String(o[key]), [...(m.get(String(o[key])) ?? []), o.source])
    return m
  }

  const replaced = group('replace-pool', 'pool')
  for (const [pool, frames] of replaced) {
    if (uniq(frames).length > 1) out.push({
      kind: 'pool-replaced-twice', key: pool, frames: uniq(frames),
      message: `${nm(frames).join(' and ')} both replace the ${pool} pool; only one can apply.`,
    })
  }
  for (const [pool, frames] of group('add-to-pool', 'pool')) {
    const r = replaced.get(pool)
    if (r) out.push({
      kind: 'pool-replace-and-add', key: pool, frames: uniq([...r, ...frames]),
      message: `${nm(r).join(', ')} replaces the ${pool} pool while ${nm(frames).join(', ')} adds to it.`,
    })
  }
  for (const [res, frames] of group('set-resource', 'resource')) {
    if (uniq(frames).length > 1) out.push({
      kind: 'resource-set-twice', key: res, frames: uniq(frames),
      message: `${nm(frames).join(' and ')} both set the ${res} resource.`,
    })
  }
  for (const [step, frames] of group('insert-step', 'step')) {
    if (frames.length > 1) out.push({
      kind: 'step-duplicate', key: step, frames: uniq(frames),
      message: `Step "${step}" is inserted more than once (${nm(frames).join(', ')}).`,
    })
  }
  for (const [id, frames] of group('add-tracker', 'id')) {
    if (frames.length > 1) out.push({
      kind: 'tracker-duplicate', key: id, frames: uniq(frames),
      message: `Tracker "${id}" is added more than once (${nm(frames).join(', ')}).`,
    })
  }
  const removed = group('remove-move', 'move')
  for (const [move, frames] of group('add-move', 'id')) {
    const r = removed.get(move)
    if (r) out.push({
      kind: 'move-conflict', key: move, frames: uniq([...r, ...frames]),
      message: `Move "${move}" is both removed and added.`,
    })
  }
  return out
}
