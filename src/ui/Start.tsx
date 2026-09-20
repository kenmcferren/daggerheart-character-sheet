import { useEffect, useMemo, useState } from 'react'
import type { Character } from '../engine/character'
import { importCharacter } from '../engine/character'
import { allFrames, setupFor, store } from './data'

const CHECK_BLOCKED = 'Fix the conflicts above (deselect one of the sources) to start.'

export function Start({ onStart, onOpen }: { onStart: (frame: string | null, supplements: string[]) => void; onOpen: (c: Character) => void }) {
  const { frames, supplements } = useMemo(() => allFrames(), [])
  const [frame, setFrame] = useState<string | null>(null)
  const [supps, setSupps] = useState<string[]>([])
  const [saved, setSaved] = useState<Character[]>([])
  const [corrupt, setCorrupt] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const setup = useMemo(() => setupFor(frame, supps), [frame, supps])
  const refresh = () => store.list().then((r) => { setSaved(r.characters); setCorrupt(r.corruptIds) }).catch((e) => setMsg(String(e)))
  useEffect(() => { void refresh() }, [])

  const toggle = (id: string) => setSupps((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const blocked = setup.conflicts.length > 0
  const nameOf = (id: string | null) => frames.find((f) => f.id === id)?.name ?? null

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
          <legend>Campaign frame</legend>
          <label className="inline"><input type="radio" name="frame" checked={frame === null} onChange={() => setFrame(null)} />No campaign frame</label>
          {frames.map((f) => (
            <label key={f.id} className="inline"><input type="radio" name="frame" checked={frame === f.id} onChange={() => setFrame(f.id)} />{f.name}</label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Campaign supplements (optional)</legend>
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
        <button type="button" className="primary" disabled={blocked} onClick={() => onStart(frame, supps)}>Start creating</button>
        {blocked && <p className="hint">{CHECK_BLOCKED}</p>}
      </section>

      <section className="panel">
        <h2>Saved characters</h2>
        {msg && <p className="issues" role="alert">{msg}</p>}
        {saved.length === 0 && <p className="hint">None yet.</p>}
        <ul className="saved">
          {saved.map((c) => (
            <li key={c.id}>
              <button type="button" className="link" onClick={() => onOpen(c)}>{c.name || 'Unnamed character'}</button>
              <span className="meta">{c.choices.classId ?? 'no class yet'} · {nameOf(c.sources.campaignFrameId) ?? 'no frame'} · {new Date(c.updatedAt).toLocaleString()}</span>
              <button type="button" onClick={async () => { if (confirm(`Delete ${c.name || 'this character'}?`)) { await store.remove(c.id); await refresh() } }}>Delete</button>
            </li>
          ))}
        </ul>
        {corrupt.length > 0 && <p className="hint">{corrupt.length} saved record(s) could not be read and were skipped.</p>}
        <label className="file">Import a character JSON file<input type="file" accept="application/json,.json" onChange={(e) => void importFile(e.target.files?.[0])} /></label>
      </section>
    </div>
  )
}
