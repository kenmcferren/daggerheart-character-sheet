import { useEffect, useMemo, useState } from 'react'
import type { Character } from '../engine/character'
import { exportCharacter } from '../engine/character'
import { MAX_LEVEL, progressOf } from '../engine/levelup'
import { describeHistory } from './describe'
import { setupOf, store } from './data'
import { download } from './util'
import { Versions } from './Versions'

/** A saved character above level 1: what was gained at each level, all saved versions, and the way to level up again. */
export function CharacterView({ ch, onLevelUp, onOpen, onHome }: { ch: Character; onLevelUp: (c: Character) => void; onOpen: (c: Character) => void; onHome: () => void }) {
  const reg = useMemo(() => setupOf(ch).registry, [ch])
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
