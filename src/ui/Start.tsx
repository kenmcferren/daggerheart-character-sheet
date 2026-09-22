import { useEffect, useMemo, useState } from 'react'
import type { Character } from '../engine/character'
import { importCharacter } from '../engine/character'
import { validateCreation } from '../engine/rules'
import { MAX_LEVEL } from '../engine/levelup'
import { allSupplements, setupFor, setupOf, store } from './data'
import { Versions } from './Versions'

const CHECK_BLOCKED = 'Fix the conflicts above (deselect one of the sources) to start.'

export function Start({ onStart, onOpen, onLevelUp }: { onStart: (supplements: string[]) => void; onOpen: (c: Character) => void; onLevelUp: (c: Character) => void }) {
  const supplements = useMemo(() => allSupplements(), [])
  const [supps, setSupps] = useState<string[]>([])
  const [saved, setSaved] = useState<{ latest: Character; versionCount: number }[]>([])
  const [showVersions, setShowVersions] = useState<string | null>(null)
  const [versions, setVersions] = useState<Character[]>([])
  const [corrupt, setCorrupt] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const setup = useMemo(() => setupFor(null, supps), [supps])
  const refresh = () => Promise.all([store.lineages(), store.list()]).then(([l, r]) => { setSaved(l); setCorrupt(r.corruptIds) }).catch((e) => setMsg(String(e)))
  const openVersions = async (lineageId: string | null) => { setShowVersions(lineageId); setVersions(lineageId ? await store.versionsOf(lineageId) : []) }
  /** Level 1 characters can level up once creation is complete; the reason is shown otherwise. */
  const blockReason = (c: Character) => (c.level >= MAX_LEVEL ? 'Highest level reached' : validateCreation(c, setupOf(c)).length ? 'Finish creation first' : '')
  useEffect(() => { void refresh() }, [])

  const toggle = (id: string) => setSupps((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const blocked = setup.conflicts.length > 0
  const namesOf = (c: Character) => [c.sources.campaignFrameId, ...(c.sources.supplementIds ?? [])].map((id) => supplements.find((f) => f.id === id)?.name).filter(Boolean).join(', ')

  async function importFile(file: File | undefined) {
    if (!file) return
    try {
      const c = importCharacter(await file.text())
      await store.save(c)
      await refresh()
      onOpen(c)
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)) }
  }

  return (
    <div className="start">
      <h1>Daggerheart character creator</h1>
      <p className="hint">Guided character creation from the SRD. Your characters are saved on this device.</p>

      <section className="panel">
        <h2>New character</h2>
        <fieldset>
          <legend>Campaign options (optional)</legend>
          {supplements.map((s) => (
            <label key={s.id} className="inline"><input type="checkbox" checked={supps.includes(s.id)} onChange={() => toggle(s.id)} />{s.name}</label>
          ))}
        </fieldset>
        {blocked && (
          <div className="panel warn" role="alert">
            <h3>Conflicts</h3>
            <ul>{setup.conflicts.map((c, i) => <li key={i}>{c.message}</li>)}</ul>
          </div>
        )}
        <button type="button" className="primary" disabled={blocked} onClick={() => onStart(supps)}>Start creating</button>
        {blocked && <p className="hint">{CHECK_BLOCKED}</p>}
      </section>

      <section className="panel">
        <h2>Saved characters</h2>
        {msg && <p className="issues" role="alert">{msg}</p>}
        {saved.length === 0 && <p className="hint">None yet.</p>}
        <ul className="saved">
          {saved.map(({ latest: c, versionCount }) => (
            <li key={c.lineageId}>
              <button type="button" className="link" onClick={() => onOpen(c)}>{c.name || 'Unnamed character'}</button>
              <span className="meta">{c.choices.classId ?? 'no class yet'} · level {c.level} · {namesOf(c) || 'no campaign options'} · {new Date(c.updatedAt).toLocaleString()}</span>
              <button type="button" className="primary" disabled={!!blockReason(c)} title={blockReason(c)} onClick={() => onLevelUp(c)}>Level up</button>
              {versionCount > 1 && <button type="button" onClick={() => void openVersions(showVersions === c.lineageId ? null : c.lineageId)}>{versionCount} versions</button>}
              <button type="button" onClick={async () => { if (confirm(`Delete ${c.name || 'this character'} and all ${versionCount} saved version(s)?`)) { await store.removeLineage(c.lineageId); await refresh() } }}>Delete</button>
              {showVersions === c.lineageId && <div style={{ flexBasis: '100%' }}><Versions versions={versions} onOpen={onOpen} onLevelUp={onLevelUp} onChanged={() => { void refresh(); void openVersions(c.lineageId) }} /></div>}
            </li>
          ))}
        </ul>
        {corrupt.length > 0 && <p className="hint">{corrupt.length} saved record(s) could not be read and were skipped.</p>}
        <label className="file">Import a character JSON file<input type="file" accept="application/json,.json" onChange={(e) => void importFile(e.target.files?.[0])} /></label>
      </section>
    </div>
  )
}
