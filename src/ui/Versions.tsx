import { useMemo } from 'react'
import type { Character } from '../engine/character'
import { branchDifferences } from '../engine/branches'
import { MAX_LEVEL } from '../engine/levelup'
import { validateCreation } from '../engine/rules'
import { setupOf, store } from './data'

const blockReason = (c: Character) => (validateCreation(c, setupOf(c)).length ? 'Finish creation first' : '')

/** One character's saved versions as an indented tree: a version sits under the one it was leveled up from. */
export function Versions({ versions, currentId, onOpen, onLevelUp, onChanged }: { versions: Character[]; currentId?: string; onOpen: (c: Character) => void; onLevelUp: (c: Character) => void; onChanged: () => void }) {
  const diffs = useMemo(() => (versions.length ? branchDifferences(versions, setupOf(versions[0]).registry) : new Map()), [versions])
  const ids = new Set(versions.map((v) => v.id))
  const kids = (parent: string | null) => versions.filter((v) => (v.parentId && ids.has(v.parentId) ? v.parentId : null) === parent)
  const row = (v: Character, depth: number): React.ReactNode => (
    <li key={v.id}>
      <div style={{ paddingLeft: depth * 20 }} className="version">
        <button type="button" className="link" onClick={() => onOpen(v)}>Level {v.level}</button>
        {v.id === currentId && <strong> (open)</strong>}
        <span className="meta">saved {new Date(v.updatedAt).toLocaleString()}</span>
        <button type="button" disabled={v.level >= MAX_LEVEL || !!blockReason(v)} title={blockReason(v)} onClick={() => onLevelUp(v)}>Level up from here</button>
        <button type="button" onClick={async () => { if (confirm(`Delete this level ${v.level} version?`)) { await store.remove(v.id); onChanged() } }}>Delete</button>
        {diffs.get(v.id)?.map((d: { area: string; value: string }) => <div key={d.area} className="meta"><strong>{d.area}:</strong> {d.value}</div>)}
      </div>
      {kids(v.id).length > 0 && <ul className="saved">{kids(v.id).map((k) => row(k, depth + 1))}</ul>}
    </li>
  )
  return <ul className="saved">{kids(null).map((v) => row(v, 0))}</ul>
}
