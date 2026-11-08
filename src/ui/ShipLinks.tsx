import { useEffect, useState } from 'react'
import type { Character } from '../engine/character'
import type { Ship } from '../engine/ship'
import { shipLabel, shipStore } from './data'

/** A character's ships: open a linked ship, make a Solo Flier for this character, or link/unlink a saved ship. Shown for every character, including ones saved before ships existed (a ship does not depend on the character's own options). */
export function ShipLinks({ ch, onOpenShip, onNewShip }: { ch: Character; onOpenShip: (s: Ship) => void; onNewShip: (characterLineageId: string) => void }) {
  const [ships, setShips] = useState<Ship[]>([])
  const [pick, setPick] = useState('')
  const refresh = () => shipStore.list().then((r) => setShips(r.ships)).catch(() => {})
  useEffect(() => { void refresh() }, [ch.lineageId])
  const linked = ships.filter((s) => s.characterLineageId === ch.lineageId)
  const free = ships.filter((s) => !s.characterLineageId)
  const link = async (id: string, to: string | null) => { await shipStore.link(id, to); setPick(''); await refresh() }
  return (
    <section className="panel">
      <h2>Ships</h2>
      {linked.length === 0 && <p className="hint">Optional (Starheart ships): build a Solo Flier for {ch.name || 'this character'}. It prints after the character sheet.</p>}
      <ul className="saved">
        {linked.map((s) => (
          <li key={s.id}>
            <button type="button" className="link" onClick={() => onOpenShip(s)}>{s.name || 'Unnamed ship'}</button>
            <span className="meta">{shipLabel(s)}</span>
            <button type="button" onClick={() => void link(s.id, null)}>Unlink</button>
          </li>
        ))}
      </ul>
      <button type="button" className="primary" onClick={() => onNewShip(ch.lineageId)}>{linked.length === 0 ? `Make a ship for ${ch.name || 'this character'}` : 'Make another ship'}</button>
      {free.length > 0 && (
        <label>Link a saved ship
          <select value={pick} onChange={(e) => { setPick(e.target.value); if (e.target.value) void link(e.target.value, ch.lineageId) }}>
            <option value="">Choose a ship…</option>
            {free.map((s) => <option key={s.id} value={s.id}>{s.name || 'Unnamed ship'} ({shipLabel(s)})</option>)}
          </select>
        </label>
      )}
    </section>
  )
}
