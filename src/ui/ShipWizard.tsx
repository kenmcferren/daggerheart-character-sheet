import { useEffect, useMemo, useState } from 'react'
import { TRAITS, type Character, type Trait } from '../engine/character'
import {
  SYSTEMS, archetypeOf, cardsPerSystem, exportShip, hullBeforeFree, hullPoints, primarySystems, shipConfiguration, shipFrame, shipProblems, shipStats,
  systemRollLines, systemTrait, type Ship, type ShipStep, type System,
} from '../engine/ship'
import { Choice, Details } from './common'
import { SHIP_RULES as R, pilotOf, shipLabel, store } from './data'
import { freshImport } from './freshImport'
import { ShipPdfPreview } from './PdfPreview'
import { CardText, ShipRefit } from './ShipRefit'
import { download, titleCase } from './util'

const STEPS: { id: ShipStep | 'review'; title: string }[] = [
  { id: 'configuration', title: 'Configuration' },
  { id: 'traits', title: 'Traits' },
  { id: 'frame', title: 'Frame' },
  { id: 'domains', title: 'Domains' },
  { id: 'cards', title: 'Domain cards' },
  { id: 'hull', title: 'Hull Points' },
  { id: 'name', title: 'Name and pilot' },
  { id: 'review', title: 'Review' },
]
const sysName = (y: System) => R.systems.find((s) => s.id === y)?.name ?? titleCase(y)
const roleName = (s: Ship) => (s.role === 'hub' ? 'Hub Ship' : 'Solo Flier')
const sign = (n: number) => `${n >= 0 ? '+' : ''}${n}`

export type ShipUpdate = (fn: (s: Ship) => void) => void

/** Ship creation, one step per rule in the Creating a Ship section, then a review. A reopened ship lands on Review. */
export function ShipWizard({ ship, update, saveStatus, onHome, opened }: { ship: Ship; update: ShipUpdate; saveStatus: string; onHome: () => void; opened: boolean }) {
  const last = STEPS.length - 1
  const [at, setAt] = useState(opened ? last : 0)
  const [furthest, setFurthest] = useState(opened ? last : 0)
  const [pilots, setPilots] = useState<Character[]>([])
  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [refit, setRefit] = useState(false)
  useEffect(() => { void store.lineages().then((l) => setPilots(l.map((x) => x.latest))) }, [])
  useEffect(() => { void pilotOf(ship.characterLineageId).then(setPilot) }, [ship.characterLineageId])
  const problems = useMemo(() => shipProblems(R, ship), [ship])
  const by = (id: string) => problems.filter((p) => p.step === id)
  const cur = STEPS[at]
  const go = (i: number) => { setAt(i); setFurthest((f) => Math.max(f, i)) }
  const state = (i: number) => (i === at ? 'current' : i > furthest ? 'todo' : by(STEPS[i].id).length ? 'issue' : 'done')
  const doneCount = STEPS.slice(0, last).filter((s, i) => i <= furthest && !by(s.id).length).length
  const ctx: StepCtx = { ship, update, pilot, pilots }

  return (
    <div className="wizard">
      <header className="bar">
        <button type="button" onClick={onHome}>← Back</button>
        <strong>{ship.name || `Unnamed ${roleName(ship)}`}</strong>
        <span className="status" aria-live="polite">{saveStatus}</span>
      </header>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={last} aria-valuenow={doneCount} aria-label="Ship creation progress">
        <div style={{ width: `${(doneCount / last) * 100}%` }} />
      </div>
      <div className="layout">
        <nav aria-label="Steps">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={`step ${state(i)}`} title={s.title} aria-label={`${i + 1}. ${s.title}`} disabled={i > furthest} aria-current={i === at ? 'step' : undefined} onClick={() => go(i)}>
                  <span className="dot" aria-hidden>{state(i) === 'done' ? '✓' : state(i) === 'issue' ? '!' : i + 1}</span><span className="label">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {refit ? (
          <main>
            <h2>Refit and advancement</h2>
            <ShipRefit ship={ship} update={update} onClose={() => setRefit(false)} />
          </main>
        ) : (
        <main>
          <h2>{cur.title}</h2>
          {cur.id === 'review' ? <ShipReview {...ctx} onJump={(id) => go(STEPS.findIndex((s) => s.id === id))} onHome={onHome} onRefit={() => setRefit(true)} /> : BODY[cur.id](ctx)}
          {cur.id !== 'review' && by(cur.id).length > 0 && <ul className="issues" role="alert">{by(cur.id).map((p, n) => <li key={n}>{p.message}</li>)}</ul>}
          <div className="nav">
            <button type="button" disabled={at === 0} onClick={() => go(at - 1)}>Back</button>
            {cur.id !== 'review' && <button type="button" className="primary" disabled={by(cur.id).length > 0} onClick={() => go(at + 1)}>{at === last - 1 ? 'Review' : 'Next'}</button>}
          </div>
        </main>
        )}
      </div>
    </div>
  )
}

type Pilot = { character: Character; name: string; traits: Character['traits'] }
interface StepCtx { ship: Ship; update: ShipUpdate; pilot: Pilot | null; pilots: Character[] }

const BODY: Record<ShipStep, (c: StepCtx) => React.ReactNode> = {
  configuration: ({ ship, update }) => (
    <>
      <p className="hint">A configuration sets the most domain cards each system can hold. The two systems that hold 4 are your primary systems.</p>
      <div className="grid">
        {R.configurations.map((c) => (
          <Choice key={c.id} title={c.name} selected={ship.choices.configurationId === c.id} onPick={() => update((s) => { s.choices.configurationId = c.id })}
            meta={SYSTEMS.map((y) => `${sysName(y)} ${c.caps[y]}`).join(' · ')} />
        ))}
      </div>
    </>
  ),
  traits: ({ ship, update, pilot }) => {
    const prim = primarySystems(R, ship)
    const row = (label: string, key: 'primaryTrait' | 'secondaryTrait', other: Trait | null) => (
      <div className="traitgrid-row" role="group" aria-label={label}>
        <span className="traitgrid-name">{label}</span>
        {TRAITS.map((t) => (
          <button key={t} type="button" className={`traitgrid-cell${ship.choices[key] === t ? ' selected' : ''}`} disabled={other === t} aria-pressed={ship.choices[key] === t}
            onClick={() => update((s) => { s.choices[key] = t })}>
            {titleCase(t)}{pilot && Number.isInteger(pilot.traits[t]) ? ` ${sign(pilot.traits[t]!)}` : ''}
          </button>
        ))}
      </div>
    )
    return (
      <>
        <p className="hint">Rolls for your primary systems{prim.length ? ` (${prim.map(sysName).join(' and ')})` : ''} use the pilot's Primary Trait; the other two systems use the Secondary Trait. A different pilot uses their own trait values.{pilot ? ` Values shown are ${pilot.name || 'the linked character'}'s.` : ''}</p>
        <div className="traitgrid">
          {row('Primary', 'primaryTrait', ship.choices.secondaryTrait)}
          {row('Secondary', 'secondaryTrait', ship.choices.primaryTrait)}
        </div>
      </>
    )
  },
  frame: ({ ship, update }) => (
    <>
      <p className="hint">A frame sets your Free HP, Stress slots, Evasion and damage thresholds.</p>
      <div className="grid">
        {R.frames.map((f) => (
          <Choice key={f.id} title={f.name} selected={ship.choices.frameId === f.id} meta={`Free HP ${f.freeHp} · Stress ${f.stress} · Evasion ${f.evasion} · Thresholds ${f.thresholds.join('/')}`}
            onPick={() => update((s) => { if (s.choices.frameId !== f.id) s.choices.freeHp = { transport: 0, weapons: 0, science: 0, engineering: 0 }; s.choices.frameId = f.id })} />
        ))}
      </div>
    </>
  ),
  domains: ({ ship, update }) => {
    const chosen = ship.choices.domainIds
    const arch = archetypeOf(R, ship)
    const toggle = (id: string) => update((s) => {
      const d = s.choices.domainIds
      s.choices.domainIds = d.includes(id) ? d.filter((x) => x !== id) : [...d, id].slice(-R.build.domains)
      s.choices.cardIds = s.choices.cardIds.filter((c) => s.choices.domainIds.includes(R.cards.find((x) => x.id === c)?.domain ?? ''))
    })
    return (
      <>
        <p className="hint">Choose {R.build.domains} domains ({chosen.length} chosen). Changing a domain drops its cards.</p>
        <div className="grid">
          {R.domains.map((d) => (
            <Choice key={d.id} title={d.name} meta={d.focus} selected={chosen.includes(d.id)} onPick={() => toggle(d.id)}>
              <p className="domain-blurb">{d.description}</p>
            </Choice>
          ))}
        </div>
        {arch && (
          <section className="panel">
            <h3>Archetype: {arch.name}</h3>
            <ul>{arch.features.map((f, i) => <li key={i}>{f.replace(/\*/g, '')}</li>)}</ul>
          </section>
        )}
      </>
    )
  },
  cards: ({ ship, update }) => {
    const cfg = shipConfiguration(R, ship)
    const n = cardsPerSystem(R, ship)
    const chosen = ship.choices.cardIds
    if (ship.choices.domainIds.length < R.build.domains) return <p className="hint">Choose your domains first.</p>
    const toggle = (id: string) => update((s) => { const c = s.choices.cardIds; s.choices.cardIds = c.includes(id) ? c.filter((x) => x !== id) : [...c, id] })
    return (
      <>
        <p className="hint">Choose {R.build.cards} cards from your domains ({chosen.length} chosen). All of them are in your loadout. Each card adds 1 HP to its system.</p>
        {SYSTEMS.map((y) => {
          const cap = cfg?.caps[y]
          const full = cap !== undefined && n[y] >= cap
          return (
            <section key={y}>
              <h3>{sysName(y)} · {n[y]}{cap !== undefined ? ` of ${cap}` : ''}</h3>
              <div className="grid">
                {R.cards.filter((c) => c.system === y && ship.choices.domainIds.includes(c.domain)).map((c) => {
                  const on = chosen.includes(c.id)
                  return (
                    <Choice key={c.id} title={c.name} meta={titleCase(c.domain)} selected={on} disabled={!on && (full || chosen.length >= R.build.cards)} onPick={() => toggle(c.id)}>
                      <Details><CardText text={c.rules} /></Details>
                    </Choice>
                  )
                })}
              </div>
            </section>
          )
        })}
      </>
    )
  },
  hull: ({ ship, update }) => {
    const fr = shipFrame(R, ship)
    if (!fr) return <p className="hint">Choose a frame first.</p>
    const before = hullBeforeFree(R, ship)
    const total = hullPoints(R, ship)
    const placed = SYSTEMS.reduce((a, y) => a + ship.choices.freeHp[y], 0)
    const bump = (y: System, d: number) => update((s) => { s.choices.freeHp[y] = Math.max(0, s.choices.freeHp[y] + d) })
    return (
      <>
        <p className="hint">Each system starts with 1 HP, plus 1 for each of its cards, plus any HP a card grants. Place your {fr.freeHp} Free HP ({fr.freeHp - placed} left). No system can have more than {R.build.maxHpPerSystem} HP.</p>
        <table className="hull">
          <thead><tr><th>System</th><th>From cards</th><th>Free HP</th><th>Total</th></tr></thead>
          <tbody>
            {SYSTEMS.map((y) => (
              <tr key={y}>
                <th scope="row">{sysName(y)}</th>
                <td>{before[y]}</td>
                <td className="stepper">
                  <button type="button" aria-label={`Remove a Free HP from ${sysName(y)}`} disabled={ship.choices.freeHp[y] === 0} onClick={() => bump(y, -1)}>−</button>
                  <span>{ship.choices.freeHp[y]}</span>
                  <button type="button" aria-label={`Add a Free HP to ${sysName(y)}`} disabled={placed >= fr.freeHp || total[y] >= R.build.maxHpPerSystem} onClick={() => bump(y, 1)}>+</button>
                </td>
                <td><strong>{total[y]}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  },
  name: ({ ship, update, pilots }) => (
    <>
      <label>Ship name<input type="text" value={ship.name} onChange={(e) => update((s) => { s.name = e.target.value })} /></label>
      <label>How did you come by it?<textarea value={ship.description} onChange={(e) => update((s) => { s.description = e.target.value })} /></label>
      <label>{ship.role === 'hub' ? 'Usual pilot (optional)' : 'Owner and pilot'}
        <select value={ship.characterLineageId ?? ''} onChange={(e) => update((s) => { s.characterLineageId = e.target.value || null })}>
          <option value="">{ship.role === 'hub' ? 'No pilot (opens on its own)' : 'No character linked'}</option>
          {pilots.map((c) => <option key={c.lineageId} value={c.lineageId}>{c.name || 'Unnamed character'} (level {c.level})</option>)}
        </select>
      </label>
      <p className="hint">The linked character's traits print with the ship's rolls. A {roleName(ship)} is size {ship.size}.</p>
    </>
  ),
}

function ShipReview({ ship, pilot, onJump, onHome, onRefit }: StepCtx & { onJump: (id: string) => void; onHome: () => void; onRefit: () => void }) {
  const problems = shipProblems(R, ship)
  const st = shipStats(R, ship)
  const cfg = shipConfiguration(R, ship)
  const fr = shipFrame(R, ship)
  const lines = systemRollLines(R, ship, pilot?.traits)
  const cards = ship.choices.cardIds.map((id) => R.cards.find((c) => c.id === id)).filter((c) => !!c)
  const jump = (id: string, label: string) => <button type="button" className="link" onClick={() => onJump(id)}>{label}</button>
  const extras = (c: (typeof cards)[number]) => [
    c.reloadTokens && `${c.reloadTokens} Reload Tokens`, c.cardTokens && `${c.cardTokens.max} ${c.cardTokens.name} Token${c.cardTokens.max > 1 ? 's' : ''}`,
    c.usesPer && `once per ${c.usesPer === 'refuel' ? 'Refuel' : 'scene'}`,
  ].filter(Boolean).join(' · ')
  return (
    <>
      {problems.length ? (
        <section className="panel warn">
          <h3>Still to fix</h3>
          <ul>{problems.map((p, n) => <li key={n}>{p.message} {jump(p.step, 'Go to step')}</li>)}</ul>
        </section>
      ) : <p className="ok">Everything is filled in and legal.</p>}
      <dl className="summary">
        <div><dt>Ship</dt><dd>{ship.name || '—'} · {shipLabel(ship)} (size {ship.size}) {jump('name', 'Edit')}</dd></div>
        <div><dt>Pilot</dt><dd>{pilot ? `${pilot.name || 'Unnamed character'} (level ${pilot.character.level})` : 'None linked'} {jump('name', 'Edit')}</dd></div>
        <div><dt>Configuration</dt><dd>{cfg?.name ?? '—'}{cfg ? ` · primary: ${primarySystems(R, ship).map(sysName).join(', ')}` : ''} {jump('configuration', 'Edit')}</dd></div>
        <div><dt>Rolls</dt><dd>{lines.map((l) => l.text).join(' · ')} {jump('traits', 'Edit')}</dd></div>
        <div><dt>Frame</dt><dd>{fr?.name ?? '—'} {jump('frame', 'Edit')}</dd></div>
        <div><dt>Domains</dt><dd>{ship.choices.domainIds.map((d) => R.domains.find((x) => x.id === d)?.name ?? d).join(' and ') || '—'}{archetypeOf(R, ship) ? ` · ${archetypeOf(R, ship)?.name}` : ''} {jump('domains', 'Edit')}</dd></div>
        <div><dt>Hull Points</dt><dd>{SYSTEMS.map((y) => `${sysName(y)} ${st.hp[y]}`).join(' · ')} (total {st.totalHp}) {jump('hull', 'Edit')}</dd></div>
      </dl>
      <section className="panel">
        <h3>Ship numbers</h3>
        <p>Evasion {st.evasion ?? '—'} · Thresholds {st.thresholds?.join(' / ') ?? '—'} · Stress {st.stress}</p>
        {st.tokenTrackers.length > 0 && <p>Token trackers: {st.tokenTrackers.map((t) => `${titleCase(t.token)} Tokens (up to ${t.max})`).join(', ')}</p>}
      </section>
      <section className="panel">
        <h3>Domain cards</h3>
        {cards.length === 0 && <p className="hint">None chosen yet. {jump('cards', 'Choose cards')}</p>}
        {SYSTEMS.map((y) => cards.filter((c) => c.system === y)).filter((g) => g.length).map((g) => (
          <div key={g[0].system}>
            <h4>{sysName(g[0].system)} ({systemTrait(R, ship, g[0].system) ? titleCase(systemTrait(R, ship, g[0].system)!) : '—'})</h4>
            {g.map((c) => (
              <div key={c.id} className="feature"><strong>{c.name}</strong> <span className="meta-inline">· {titleCase(c.domain)}{extras(c) ? ` · ${extras(c)}` : ''}</span>{' '}<CardText text={c.rules} /></div>
            ))}
          </div>
        ))}
      </section>
      <ShipPdfPreview ship={ship} />
      <div className="nav">
        <button type="button" onClick={() => download(`${ship.name || 'ship'}.json`, exportShip(ship))}>Export JSON</button>
        <button type="button" className="primary" onClick={() => void freshImport(async () => (await import('../pdf/browser')).downloadShipSheet(ship))}>Make PDF</button>
        {R.advancement && <button type="button" onClick={onRefit}>Refit and advance</button>}
        <button type="button" onClick={onHome}>Done</button>
      </div>
      <p className="hint">Your ship is saved on this device. Make PDF downloads a double-sided ship sheet (the ship, then its rules on the back). A ship linked to a character also prints after that character's sheet.</p>
    </>
  )
}
