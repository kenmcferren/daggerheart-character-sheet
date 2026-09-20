import { exportCharacter } from '../engine/character'
import { ancestryFeatures, deriveStats, weaponPool, armorPool, type Issue } from '../engine/rules'
import type { WizardStep } from '../engine/creation'
import type { Ctx } from './common'
import { issueStep, titleCase } from './util'

type A = any

export function Review({ ctx, issues, steps, onJump }: { ctx: Ctx; issues: Issue[]; steps: WizardStep[]; onJump: (id: string) => void }) {
  const { ch, cr, setup } = ctx
  const reg = setup.registry
  const stats = deriveStats(ch, setup)
  const name = (kind: 'classes' | 'subclasses' | 'communities' | 'ancestries' | 'domainCards', id: string | null) => (id ? (reg[kind].get(id) as A)?.name ?? id : '—')
  const pool = [...weaponPool(setup).entries, ...armorPool(setup)]
  const gear = ch.choices.equipmentIds.map((id) => (pool.find((p) => p.id === id) as A)?.name ?? id)
  const built = Object.entries(cr.frameChoices).filter(([, v]) => typeof v === 'object').map(([k, v]) => `${titleCase(k)}: ${(v as A).name ?? ''}`)
  const jump = (id: string, label: string) => <button type="button" className="link" onClick={() => onJump(id)}>{label}</button>

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportCharacter(ch)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url; a.download = `${(ch.name || 'character').replace(/[^\w-]+/g, '-')}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  const ancestry = cr.mixedAncestry ? ancestryFeatures(ch, setup).map((f) => f.from).join(' / ') : name('ancestries', ch.choices.ancestryId)
  const rows: [string, string, string][] = [
    ['class', 'Class', name('classes', ch.choices.classId)],
    ['subclass', 'Subclass', name('subclasses', ch.choices.subclassId)],
    ['ancestry', 'Ancestry', ancestry],
    ['community', 'Community', name('communities', ch.choices.communityId)],
    ['traits', 'Traits', Object.entries(ch.traits).map(([t, v]) => `${titleCase(t)} ${(v as number) > 0 ? '+' : ''}${v}`).join(', ') || '—'],
    ['equipment', 'Equipment', [...gear, ...built].join(', ') || '—'],
    ['background', 'Name / pronouns', [ch.name, cr.pronouns].filter(Boolean).join(' · ') || '—'],
    ['experiences', 'Experiences', cr.experiences.filter(Boolean).map((e) => `${e} +2`).join(', ') || '—'],
    ['domain-cards', 'Domain cards', ch.choices.domainCardIds.map((id) => name('domainCards', id)).join(', ') || '—'],
  ]
  return (
    <>
      {issues.length ? (
        <section className="panel warn">
          <h3>Still to fix</h3>
          <ul>{issues.map((i, n) => <li key={n}>{i.message} {jump(issueStep(i, steps), 'Go to step')}</li>)}</ul>
        </section>
      ) : <p className="ok">Everything is filled in and legal.</p>}
      <dl className="summary">
        {rows.map(([id, k, v]) => <div key={id}><dt>{k}</dt><dd>{v} {jump(id, 'Edit')}</dd></div>)}
      </dl>
      <section className="panel">
        <h3>Starting numbers</h3>
        <p>Level {stats.level} · Evasion {stats.evasion} · Hit Points {stats.hitPoints} · Stress {stats.stress} · Hope {stats.hope} · Proficiency {stats.proficiency}</p>
        <p>Thresholds {stats.majorThreshold} / {stats.severeThreshold} · Armor Score {stats.armorScore}</p>
        <p>Kit: {stats.kit.join('; ')}</p>
        <p>Downtime moves: {stats.downtimeMoves.map((m) => m.name).join(', ')}</p>
      </section>
      <div className="nav">
        <button type="button" onClick={download}>Export JSON</button>
        <button type="button" className="primary" disabled title="PDF output arrives in Series 4">Make PDF (coming)</button>
      </div>
      <p className="hint">The character sheet PDF is built in Series 4; your character is saved on this device and can be exported as JSON.</p>
    </>
  )
}
