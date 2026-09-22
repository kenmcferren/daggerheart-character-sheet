import type { ReactNode } from 'react'
import type { Character, Creation } from '../engine/character'
import type { CreationSetup } from '../engine/creation'
import type { Issue } from '../engine/rules'
import { titleCase } from './util'

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

export function Choice({ selected, onPick, title, meta, disabled, children }: {
  selected: boolean; onPick: () => void; title: string; meta?: string; disabled?: boolean; children?: ReactNode
}) {
  return (
    <div className={`choice${selected ? ' selected' : ''}`}>
      <button type="button" className="pick" aria-pressed={selected} disabled={disabled} onClick={onPick}>
        <span className="title">{title}</span>{meta && <span className="meta">{meta}</span>}
      </button>
      {children}
    </div>
  )
}

export const StepIssues = ({ issues }: { issues: Issue[] }) =>
  issues.length ? <ul className="issues" role="alert">{issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul> : null


export interface PickItem { id: string; title: string; meta?: string; details?: ReactNode; disabled?: boolean }

/** A set of buttons, each with its details in a light dropdown; use instead of a select. */
export function PickGrid({ items, selected, onPick }: { items: PickItem[]; selected: string[]; onPick: (id: string) => void }) {
  return (
    <div className="grid">
      {items.map((i) => (
        <Choice key={i.id} title={i.title} meta={i.meta} disabled={i.disabled} selected={selected.includes(i.id)} onPick={() => onPick(i.id)}>
          {i.details && <Details>{i.details}</Details>}
        </Choice>
      ))}
    </div>
  )
}

/** Domain cards as one section per domain (class domains first), each card a button with its rules in a dropdown. */
export function CardPicker({ cards, selected, onPick, domainOrder = [] }: {
  cards: { id: string; name: string; domain: string; level: number; type: string; recallCost: number; rules: string }[]
  selected: string[]; onPick: (id: string) => void; domainOrder?: string[]
}) {
  const domains = [...new Set([...domainOrder, ...cards.map((c) => c.domain).sort()])].filter((d) => cards.some((c) => c.domain === d))
  if (!cards.length) return <p className="hint">No cards are available.</p>
  return (
    <>
      {domains.map((d) => (
        <section key={d}>
          <h3>{titleCase(d)}</h3>
          <PickGrid selected={selected} onPick={onPick}
            items={cards.filter((c) => c.domain === d).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map((c) => ({
              id: c.id, title: c.name, meta: `Level ${c.level} · ${titleCase(c.type)} · Recall ${c.recallCost}`, details: <Rules text={c.rules} />,
            }))} />
        </section>
      ))}
    </>
  )
}
