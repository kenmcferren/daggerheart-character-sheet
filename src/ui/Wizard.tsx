import { useMemo, useState } from 'react'
import { validateCreation } from '../engine/rules'
import type { CreationSetup, WizardStep } from '../engine/creation'
import type { Character } from '../engine/character'
import { StepIssues, type Ctx } from './common'
import { Review } from './Review'
import { REVIEW, issueStep } from './util'
import {
  AncestryStep, BackgroundStep, ClassStep, CommunityStep, ConnectionsStep, DomainCardsStep,
  EquipmentStep, ExperiencesStep, FrameStep, SubclassStep, TraitsStep,
} from './steps'

const BODY: Record<string, (c: Ctx) => React.ReactNode> = {
  class: ClassStep, subclass: SubclassStep, ancestry: AncestryStep, community: CommunityStep, traits: TraitsStep,
  equipment: EquipmentStep, background: BackgroundStep, experiences: ExperiencesStep, 'domain-cards': DomainCardsStep,
  connections: ConnectionsStep,
}

export function Wizard({ ch, setup, update, saveStatus, onHome, opened }: {
  ch: Character; setup: CreationSetup; update: Ctx['update']; saveStatus: string; onHome: () => void; opened: boolean
}) {
  const steps = setup.steps
  const all = [...steps, { id: REVIEW, title: 'Review' } as WizardStep]
  const [at, setAt] = useState(opened ? all.length - 1 : 0) // a reopened character lands on Review, not back at step one
  const [furthest, setFurthest] = useState(opened ? all.length - 1 : 0)
  const issues = useMemo(() => validateCreation(ch, setup), [ch, setup])
  const by = (id: string) => issues.filter((i) => issueStep(i, steps) === id)
  const cur = all[at]
  const cr = ch.creation!
  const ctx: Ctx = { ch, cr, setup, update, issues }

  const go = (i: number) => { setAt(i); setFurthest((f) => Math.max(f, i)) }
  const state = (i: number) => (i === at ? 'current' : i > furthest ? 'todo' : by(all[i].id).length ? 'issue' : 'done')
  const doneCount = steps.filter((s, i) => i <= furthest && !by(s.id).length).length
  const canNext = cur.id === REVIEW || by(cur.id).length === 0
  const withQuestions = [setup.frame, ...setup.supplements].filter((f) => f?.sessionZeroQuestions?.length)

  return (
    <div className="wizard">
      <header className="bar">
        <button type="button" onClick={onHome}>← Characters</button>
        <strong>{ch.name || 'Unnamed character'}</strong>
        <span className="status" aria-live="polite">{saveStatus}</span>
      </header>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount} aria-label="Creation progress">
        <div style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <div className="layout">
        <nav aria-label="Steps">
          <ol>
            {all.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={`step ${state(i)}`} title={s.title} aria-label={`${i + 1}. ${s.title}`} disabled={i > furthest} aria-current={i === at ? 'step' : undefined} onClick={() => go(i)}>
                  <span className="dot" aria-hidden>{state(i) === 'done' ? '✓' : state(i) === 'issue' ? '!' : i + 1}</span><span className="label">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <main>
          <h2>{cur.title}</h2>
          {at === 0 && withQuestions.map((f) => (
            <details key={f!.id} className="details"><summary>{f!.name}: session zero questions</summary>
              <ul>{f!.sessionZeroQuestions!.map((q, i) => <li key={i}>{q}</li>)}</ul>
            </details>
          ))}
          {cur.id === REVIEW ? <Review ctx={ctx} issues={issues} steps={steps} onJump={(id) => go(all.findIndex((s) => s.id === id))} onHome={onHome} />
            : cur.source ? <FrameStep {...ctx} step={cur} /> : BODY[cur.id](ctx)}
          {cur.id !== REVIEW && furthest >= at && <StepIssues issues={by(cur.id)} />}
          <div className="nav">
            <button type="button" disabled={at === 0} onClick={() => go(at - 1)}>Back</button>
            {cur.id !== REVIEW && <button type="button" className="primary" disabled={!canNext} onClick={() => go(at + 1)}>{at === all.length - 2 ? 'Review' : 'Next'}</button>}
          </div>
        </main>
      </div>
    </div>
  )
}
