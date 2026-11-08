import { useEffect, useState } from 'react'
import type { Character } from '../engine/character'
import { SHIP_FRAME_ID, type Ship } from '../engine/ship'
import { shipLabel, shipStore } from './data'

/** A character's ships: open a linked ship, start a Solo Flier for this character, or link/unlink a saved ship. Shown when the character uses Starheart Ships or already has a ship. */
export function ShipLinks({ ch, onOpenShip, onNewShip }: { ch: Character; onOpenShip: (s: Ship) => void; onNewShip: (characterLineageId: string) => void }) {
  const [ships, setShips] = useState<Ship[]>([])
  const [pick, setPick] = useState('')
  const refresh = () => shipStore.list().then((r) => setShips(r.ships)).catch(() => {})
  useEffect(() => { void refresh() }, [ch.lineageId])
  const linked = ships.filter((s) => s.characterLineageId === ch.lineageId)
  const free = ships.filter((s) => !s.characterLineageId)
  if (!(ch.sources.supplementIds ?? []).includes(SHIP_FRAME_ID) && linked.length === 0) return null
  const link = async (id: string, to: string | null) => { await shipStore.link(id, to); setPick(''); await refresh() }
  return (
    <section className="panel">
      <h2>Ships</h2>
      {linked.length === 0 && <p className="hint">No ship linked yet.</p>}
      <ul className="saved">
        {linked.map((s) => (
          <li key={s.id}>
            <button type="button" className="link" onClick={() => onOpenShip(s)}>{s.name || 'Unnamed ship'}</button>
            <span className="meta">{shipLabel(s)}</span>
            <button type="button" onClick={() => void link(s.id, null)}>Unlink</button>
          </li>
        ))}
      </ul>
      <button type="button" className="primary" onClick={() => onNewShip(ch.lineageId)}>New Solo Flier for {ch.name || 'this character'}</button>
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
