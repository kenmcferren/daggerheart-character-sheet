import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Character } from '../engine/character'
import { exportCharacter } from '../engine/character'
import { MAX_LEVEL, progressOf } from '../engine/levelup'
import { describeHistory } from './describe'
import { normalize, setupOf, store } from './data'
import type { Creation } from '../engine/character'
import { armorPool, weaponPool } from '../engine/rules'
import { GearPicker } from './steps'
import { download } from './util'
import { PdfPreview } from './PdfPreview'
import { Versions } from './Versions'

/** A saved character above level 1: what was gained at each level, all saved versions, and the way to level up again. */
export function CharacterView({ ch: saved, onLevelUp, onOpen, onHome }: { ch: Character; onLevelUp: (c: Character) => void; onOpen: (c: Character) => void; onHome: () => void }) {
  const [ch, setCh] = useState<Character>(() => normalize(saved))
  const [editingGear, setEditingGear] = useState(false)
  const setup = useMemo(() => setupOf(ch), [ch.sources])
  const reg = setup.registry
  // Gear edits change this version in place (they are not a level-up), saved at once.
  const update = useCallback((fn: (c: Character, cr: Creation) => void) => {
    setCh((prev) => {
      const next = structuredClone(prev)
      fn(next, next.creation!)
      void store.save(next).catch(() => {})
      return next
    })
  }, [])
  const gearNames = ch.choices.equipmentIds.map((id) => ([...weaponPool(setup).entries, ...armorPool(setup)].find((e) => e.id === id) as { name?: string } | undefined)?.name ?? id)
  const weaponNames = ch.choices.equipmentIds.filter((id) => weaponPool(setup).entries.some((e) => e.id === id)).map((id) => gearNames[ch.choices.equipmentIds.indexOf(id)])
  const armorNames = ch.choices.equipmentIds.filter((id) => armorPool(setup).some((e) => e.id === id)).map((id) => gearNames[ch.choices.equipmentIds.indexOf(id)])
  const progress = useMemo(() => progressOf(ch, reg), [ch, reg])
  const history = useMemo(() => describeHistory(ch, reg), [ch, reg])
  const [versions, setVersions] = useState<Character[]>([])
  useEffect(() => { void store.versionsOf(ch.lineageId).then(setVersions) }, [ch])
  const cls = (reg.classes.get(ch.choices.classId ?? '') as { name?: string } | undefined)?.name

  return (
    <div className="wizard">
      <header className="bar">
        <button type="button" onClick={onHome}>← Characters</button>
        <strong>{ch.name || 'Unnamed character'}</strong>
        <span className="status">{cls} · level {ch.level}</span>
      </header>
      <section className="panel">
        <h2>Level {ch.level}</h2>
        <p className="hint">Proficiency {progress.proficiency}. Extra Hit Point slots {progress.hitPointSlots}, Stress slots {progress.stressSlots}, Evasion +{progress.evasionBonus}. The printable sheet at this level comes in a later step.</p>
        <button type="button" className="primary" disabled={ch.level >= MAX_LEVEL} onClick={() => onLevelUp(ch)}>{ch.level >= MAX_LEVEL ? 'Highest level reached' : `Level up to ${ch.level + 1}`}</button>{' '}
        <button type="button" onClick={async () => (await import('../pdf/browser')).downloadSheet(ch, setupOf(ch))}>Make PDF</button>{' '}
        <button type="button" onClick={() => download(`${ch.name || 'character'}-level-${ch.level}.json`, exportCharacter(ch))}>Export this version (JSON)</button>
      </section>
      <PdfPreview ch={ch} setup={setup} />
      <section className="panel">
        <h2>Weapons and armor</h2>
        <dl className="summary">
          <div><dt>Weapons</dt><dd>{weaponNames.join(', ') || 'No weapon'}</dd></div>
          <div><dt>Armor</dt><dd>{armorNames.join(', ') || 'No armor'}</dd></div>
        </dl>
        <button type="button" onClick={() => setEditingGear((v) => !v)}>{editingGear ? 'Done' : 'Edit'}</button>
        {editingGear && <GearPicker ch={ch} cr={ch.creation!} setup={setup} update={update} issues={[]} />}
      </section>
      <section className="panel">
        <h2>What was chosen, level by level</h2>
        {history.length === 0 && <p className="hint">Level 1 only: see the creation choices.</p>}
        <ol className="history">
          {history.map((h) => (
            <li key={h.level}><strong>Level {h.level}</strong><ul>{h.lines.map((l, i) => <li key={i}>{l}</li>)}</ul></li>
          ))}
        </ol>
      </section>
      <section className="panel">
        <h2>Saved versions</h2>
        <p className="hint">Each level is saved as its own version. Open an earlier one and level up again to try a different path; nothing is overwritten.</p>
        <Versions versions={versions} currentId={ch.id} onOpen={onOpen} onLevelUp={onLevelUp} onChanged={() => store.versionsOf(ch.lineageId).then(setVersions)} />
      </section>
    </div>
  )
}
