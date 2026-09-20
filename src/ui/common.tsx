import type { ReactNode } from 'react'
import type { Character, Creation } from '../engine/character'
import type { CreationSetup } from '../engine/creation'
import type { Issue } from '../engine/rules'

export interface Ctx {
  ch: Character
  cr: Creation
  setup: CreationSetup
  /** Mutate a copy of the character; the shell stores the result and autosaves. */
  update: (fn: (c: Character, cr: Creation) => void) => void
  issues: Issue[]
}

export const Rules = ({ text }: { text: string }) => (
  <>{text.split('\n').map((l, i) => (l.startsWith('- ') ? <li key={i}>{l.slice(2)}</li> : <p key={i}>{l}</p>))}</>
)

export const Feature = ({ f }: { f: { name?: string; rules: string } }) => (
  <div className="feature">{f.name && <strong>{f.name}. </strong>}<Rules text={f.rules} /></div>
)

/** Rules text stays behind a details expander. */
export const Details = ({ title = 'Details', children }: { title?: string; children: ReactNode }) => (
  <details className="details"><summary>{title}</summary>{children}</details>
)

/** Frame annotations for one entry, e.g. kind "classes", id "druid". */
export function Notes({ setup, target }: { setup: CreationSetup; target: string }) {
  const notes = setup.annotations.get(target)
  if (!notes?.length) return null
  return <div className="note">{notes.map((n, i) => <p key={i}>{n.text}</p>)}</div>
}

export function Choice({ selected, onPick, title, meta, children }: {
  selected: boolean; onPick: () => void; title: string; meta?: string; children?: ReactNode
}) {
  return (
    <div className={`choice${selected ? ' selected' : ''}`}>
      <button type="button" className="pick" aria-pressed={selected} onClick={onPick}>
        <span className="title">{title}</span>{meta && <span className="meta">{meta}</span>}
      </button>
      {children}
    </div>
  )
}

export const StepIssues = ({ issues }: { issues: Issue[] }) =>
  issues.length ? <ul className="issues" role="alert">{issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul> : null

