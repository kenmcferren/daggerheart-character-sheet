import { useState } from 'react'
import {
  SYSTEMS, addToVault, advancementOf, boxesChecked, changeFrame, compartmentsOf, nextThresholdOption, optionBoxes, shipProblems, shipStats, swapLoadoutVault,
  takeAdvancement, totalChecked, vaultCapacity, type AdvancementOption, type AdvancementTake, type Ship, type ShipCard, type System,
} from '../engine/ship'
import { Choice, Details } from './common'
import { SHIP_RULES as R } from './data'
import { titleCase } from './util'

type Update = (fn: (s: Ship) => void) => void
const ADV = R.advancement!
const sysName = (y: System) => R.systems.find((s) => s.id === y)?.name ?? titleCase(y)
const cardOf = (id: string) => R.cards.find((c) => c.id === id)
const ZERO_HP = { transport: 0, weapons: 0, science: 0, engineering: 0 }

/** Ship card text with its print markup: **keywords and costs** bold, *card conditions* italic. */
export function CardText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).filter(Boolean)
  return <p>{parts.map((s, i) => (s.startsWith('**') ? <strong key={i}>{s.slice(2, -2)}</strong> : s.startsWith('*') ? <em key={i}>{s.slice(1, -1)}</em> : s))}</p>
}

const gainText = (g: NonNullable<AdvancementOption['gains']>[number]) => [
  g.hp && `${g.hp} Hull Point`, g.stress && `${g.stress} Stress slot`, g.evasion && `+${g.evasion} Evasion`, g.thresholds && `thresholds +${g.thresholds[0]}/+${g.thresholds[1]}`,
].filter(Boolean).join(' ')

/**
 * Refit and advancement (Series 16). Advancement happens only at a refit, at the GM's pace. Each box checked is one take of an option;
 * new cards go to the vault, and only a refit swaps vault and loadout. The frame may change; configuration and domains may not.
 */
export function ShipRefit({ ship, update, onClose }: { ship: Ship; update: Update; onClose: () => void }) {
  const [msg, setMsg] = useState('')
  const [draft, setDraft] = useState<Record<string, { gain?: number; system?: System; compartmentId?: string }>>({})
  const st = shipStats(R, ship)
  const adv = advancementOf(ship)
  const cap = vaultCapacity(R, ship)
  const problems = shipProblems(R, ship)
  const set = (id: string, patch: Partial<AdvancementTake>) => setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }))
  const apply = (fn: (s: Ship) => Ship) => update((s) => { Object.assign(s, fn(s)) })

  const take = (o: AdvancementOption) => {
    const d = draft[o.id] ?? {}
    const r = takeAdvancement(R, ship, { optionId: o.id, gain: d.gain ?? 0, system: d.system, compartmentId: d.compartmentId })
    if (!r.ok) { setMsg(r.reason); return }
    setMsg('')
    update((s) => { Object.assign(s, r.ship) })
    setDraft((x) => ({ ...x, [o.id]: {} }))
  }
  const undo = () => update((s) => { s.advancement?.taken.pop() })

  const vaultCards = adv.vaultCardIds.map(cardOf).filter((c): c is ShipCard => !!c)
  const loadout = ship.choices.cardIds.map(cardOf).filter((c): c is ShipCard => !!c)
  const onShip = new Set([...ship.choices.cardIds, ...adv.vaultCardIds])
  const eligible = R.cards.filter((c) => ship.choices.domainIds.includes(c.domain) && !onShip.has(c.id))
  const have = new Set(compartmentsOf(R, ship).map((c) => c.id))

  return (
    <>
      <p className="hint">Advancement and card swaps happen only during a refit, at the pace your GM sets. You can choose a new frame, but the configuration and domains stay as they are unless your GM gives special permission.</p>
      <p><strong>Now:</strong> Evasion {st.evasion ?? '—'} · Thresholds {st.thresholds?.join(' / ') ?? '—'} · Stress {st.stress} · HP {SYSTEMS.map((y) => `${sysName(y)} ${st.hp[y]}`).join(', ')}</p>

      <section className="panel">
        <h3>Advancements · {totalChecked(ship)} boxes checked</h3>
        <p className="hint">Each advancement, choose one option and check one of its boxes. Your loadout holds 7 cards. Every 2 boxes checked add 1 more card, which goes in the vault.</p>
        {ADV.options.map((o) => {
          const boxes = optionBoxes(ship, o)
          const used = boxesChecked(ship, o.id)
          const d = draft[o.id] ?? {}
          const g = o.gains?.[d.gain ?? 0]
          const turn = o.alternatesWith ? nextThresholdOption(R, ship) === o.id : true
          const full = used >= boxes
          return (
            <div key={o.id} className="adv-option">
              <div className="adv-head">
                <strong>{o.name}</strong>
                <span className="adv-boxes" role="img" aria-label={`${used} of ${boxes} boxes checked`}>
                  {Array.from({ length: boxes }, (_, i) => <span key={i} className={`adv-box${i < used ? ' on' : ''}`} aria-hidden>{i < used ? '☒' : '☐'}</span>)}
                </span>
              </div>
              {(o.gains?.length ?? 0) > 1 && (
                <div role="radiogroup" aria-label={`How to take ${o.name}`} className="adv-pick">
                  {o.gains!.map((x, i) => (
                    <label key={i}><input type="radio" name={`gain-${o.id}`} checked={(d.gain ?? 0) === i} onChange={() => set(o.id, { gain: i })} /> {gainText(x)}</label>
                  ))}
                </div>
              )}
              {g?.hp && (
                <label className="adv-pick">Hull Point goes to
                  <select value={d.system ?? ''} onChange={(e) => set(o.id, { system: (e.target.value || undefined) as System | undefined })}>
                    <option value="">Choose a system</option>
                    {SYSTEMS.map((y) => <option key={y} value={y} disabled={st.hp[y] >= R.build.maxHpPerSystem}>{sysName(y)} ({st.hp[y]} HP)</option>)}
                  </select>
                </label>
              )}
              {o.compartment && (
                <label className="adv-pick">Compartment
                  <select value={d.compartmentId ?? ''} onChange={(e) => set(o.id, { compartmentId: e.target.value || undefined })}>
                    <option value="">Choose a compartment</option>
                    {ADV.compartments.map((c) => <option key={c.id} value={c.id} disabled={have.has(c.id)}>{c.name}{have.has(c.id) ? ' (have it)' : ''}</option>)}
                  </select>
                </label>
              )}
              <button type="button" disabled={full || !turn || (!!g?.hp && !d.system) || (!!o.compartment && !d.compartmentId)} onClick={() => take(o)}>
                {full ? 'All boxes checked' : !turn ? 'Not your turn (thresholds alternate)' : 'Check a box'}
              </button>
            </div>
          )
        })}
        <div className="nav"><button type="button" disabled={adv.taken.length === 0} onClick={undo}>Undo last advancement</button></div>
        {msg && <p className="issues" role="alert">{msg}</p>}
      </section>

      {have.size > 0 && (
        <section className="panel">
          <h3>Compartments</h3>
          {compartmentsOf(R, ship).map((c) => <div key={c.id} className="feature"><strong>{c.name}.</strong> <CardText text={c.rules} /></div>)}
        </section>
      )}

      <section className="panel">
        <h3>Frame</h3>
        <p className="hint">Your advancements stay and stack on the new frame. A new frame means placing its Free HP again (Hull Points step).</p>
        <div className="grid">
          {R.frames.map((f) => (
            <Choice key={f.id} title={f.name} selected={ship.choices.frameId === f.id} meta={`Free HP ${f.freeHp} · Stress ${f.stress} · Evasion ${f.evasion} · Thresholds ${f.thresholds.join('/')}`}
              onPick={() => update((s) => { if (s.choices.frameId !== f.id) { const n = changeFrame(s, f.id); s.choices = { ...n.choices, freeHp: { ...ZERO_HP } } } })} />
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Loadout and vault</h3>
        <p className="hint">Loadout {loadout.length} of {R.build.cards}. Vault {vaultCards.length} of {cap}. Vaulted cards' While Available effects are always active. Only a refit swaps cards between the two.</p>
        <h4>Vault</h4>
        {vaultCards.length === 0 && <p className="hint">Empty. New cards go here.</p>}
        {vaultCards.map((c) => (
          <div key={c.id} className="feature">
            <strong>{c.name}</strong> <span className="meta-inline">· {sysName(c.system)} · {titleCase(c.domain)}</span>
            <Details><CardText text={c.rules} /></Details>
            <label className="adv-pick">Swap with loadout card
              <select value="" onChange={(e) => e.target.value && apply((s) => swapLoadoutVault(s, e.target.value, c.id))}>
                <option value="">Choose a loadout card</option>
                {loadout.map((l) => <option key={l.id} value={l.id}>{l.name} ({sysName(l.system)})</option>)}
              </select>
            </label>
            <button type="button" onClick={() => update((s) => { if (s.advancement) s.advancement.vaultCardIds = s.advancement.vaultCardIds.filter((x) => x !== c.id) })}>Remove from vault</button>
          </div>
        ))}
        <h4>Add a card to the vault ({cap - vaultCards.length} slot{cap - vaultCards.length === 1 ? '' : 's'} free)</h4>
        {SYSTEMS.map((y) => {
          const cards = eligible.filter((c) => c.system === y)
          return cards.length === 0 ? null : (
            <section key={y}>
              <h5>{sysName(y)}</h5>
              <div className="grid">
                {cards.map((c) => (
                  <Choice key={c.id} title={c.name} meta={titleCase(c.domain)} selected={false} disabled={vaultCards.length >= cap}
                    onPick={() => { const r = addToVault(R, ship, c.id); if (!r.ok) setMsg(r.reason); else { setMsg(''); apply(() => r.ship) } }}>
                    <Details><CardText text={c.rules} /></Details>
                  </Choice>
                ))}
              </div>
            </section>
          )
        })}
      </section>

      {problems.length > 0 && (
        <section className="panel warn">
          <h3>Still to fix</h3>
          <ul>{problems.map((p, n) => <li key={n}>{p.message}</li>)}</ul>
        </section>
      )}
      <div className="nav"><button type="button" className="primary" onClick={onClose}>Done with refit</button></div>
    </>
  )
}
