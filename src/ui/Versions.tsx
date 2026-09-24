import { useMemo } from 'react'
import type { Character } from '../engine/character'
import { branchDifferences } from '../engine/branches'
import { MAX_LEVEL } from '../engine/levelup'
import { validateCreation } from '../engine/rules'
import { setupOf, store } from './data'

const blockReason = (c: Character) => (validateCreation(c, setupOf(c)).length ? 'Finish creation first' : '')
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** One character's saved versions as a tree: a version sits under the one it was leveled up from, joined by a guide line.
 *  Each row: level, when it was saved, what differs from its siblings (as chips), and its actions on the right. */
export function Versions({ versions, currentId, onOpen, onLevelUp, onChanged }: { versions: Character[]; currentId?: string; onOpen: (c: Character) => void; onLevelUp: (c: Character) => void; onChanged: () => void }) {
  const diffs = useMemo(() => (versions.length ? branchDifferences(versions, setupOf(versions[0]).registry) : new Map()), [versions])
  const ids = new Set(versions.map((v) => v.id))
  const kids = (parent: string | null) => versions.filter((v) => (v.parentId && ids.has(v.parentId) ? v.parentId : null) === parent)
  const node = (v: Character): React.ReactNode => {
    const d: { area: string; value: string }[] = diffs.get(v.id) ?? []
    const children = kids(v.id)
    return (
      <li key={v.id}>
        <div className={`vrow${v.id === currentId ? ' current' : ''}`}>
          <div className="vmain">
            <button type="button" className="link" onClick={() => onOpen(v)}>Level {v.level}</button>
            {v.id === currentId && <span className="badge">open</span>}
            <span className="meta">saved {when(v.updatedAt)}</span>
          </div>
          {d.length > 0 && <div className="vdiffs">{d.map((x) => <span key={x.area} className="chip"><strong>{x.area}:</strong> {x.value}</span>)}</div>}
          <div className="vactions">
            <button type="button" disabled={v.level >= MAX_LEVEL || !!blockReason(v)} title={blockReason(v)} onClick={() => onLevelUp(v)}>Level up from here</button>
            <button type="button" onClick={async () => { if (confirm(`Delete this level ${v.level} version?`)) { await store.remove(v.id); onChanged() } }}>Delete</button>
          </div>
        </div>
        {children.length > 0 && <ul className="vtree">{children.map(node)}</ul>}
      </li>
    )
  }
  return <ul className="vtree vroot">{kids(null).map(node)}</ul>
}
