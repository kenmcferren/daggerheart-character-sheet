import { useMemo, useState } from 'react'
import { TRAITS, type AdvancementRecord, type Character, type LevelRecord, type Trait } from '../engine/character'
import {
  ADVANCEMENTS_PER_LEVEL, COMPANION_SUBCLASS, STANCE_SUBCLASS, afterAdvancements, applyLevelUp, companionOptionCount, domainCardProblem, extrasOf, levelUpStages, optionAvailability,
  progressOf, slotsLeft, validateLevelUp,
} from '../engine/levelup'
import { tierOf } from '../engine/rules'
import { CardPicker, Details, Feature, PickGrid, Rules } from './common'
import { describeAdvancement } from './describe'
import { setupOf, store } from './data'
import { titleCase } from './util'

const RANK_NAMES = ['foundation', 'specialization', 'mastery']

interface Props { from: Character; onDone: (c: Character) => void; onCancel: () => void }

export function LevelUp({ from, onDone, onCancel }: Props) {
  const reg = useMemo(() => setupOf(from).registry, [from])
  const prev = useMemo(() => progressOf(from, reg), [from, reg])
  const level = from.level + 1
  const tier = tierOf(level)
  const cls = reg.classes.get(from.choices.classId ?? '') as any
  const all = useMemo(() => [...reg.levelUpOptions.values()] as any[], [reg])
  const achievement = all.find((o) => o.kind === 'tier-achievement' && o.level === level)

  const [draft, setDraft] = useState<LevelRecord>({ level, advancements: [], newCardId: '' })
  const [at, setAt] = useState(0)
  const [busy, setBusy] = useState('')
  const change = (p: Partial<LevelRecord>) => setDraft((d) => ({ ...d, ...p }))
  const after = useMemo(() => afterAdvancements(prev, level, draft.advancements, from, reg, draft.newExperience), [prev, level, draft.advancements, draft.newExperience, from, reg])
  const { stanceClass, companionClass } = extrasOf(after.subclassRanks, reg)
  const startStances = !!stanceClass && !(STANCE_SUBCLASS in prev.subclassRanks)
  const startCompanion = !!companionClass && !(COMPANION_SUBCLASS in prev.subclassRanks)
  const stanceStep = all.find((o) => o.effect === 'stance'), companionStep = all.find((o) => o.effect === 'companion-option')
  const steps = ['achievement', 'advancements', 'cards', 'class', 'review'].filter((s) => (s === 'achievement' ? achievement : s === 'class' ? stanceClass || companionClass : true))
  const step = steps[at]
  const stages = useMemo(() => levelUpStages(from, draft, reg), [from, draft, reg])
  const errors = useMemo(() => validateLevelUp(from, draft, reg), [from, draft, reg])
  const stepOk = step === 'review' ? errors.length === 0 : step !== undefined && stages[step as 'achievement'].length === 0
  const titles: Record<string, string> = { achievement: 'Tier achievement', advancements: 'Advancements', cards: 'Domain cards', class: 'Class extras', review: 'Review' }

  const cardChoices = (st: typeof after, cap: number, owned: string[]) =>
    ([...reg.domainCards.values()] as any[])
      .filter((c) => domainCardProblem(st, level, cls, reg, c.id, cap, owned) === null)
      .sort((a, b) => a.level - b.level || a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name))
  const domainOrder = [...(cls?.domains ?? []), ...(prev.multiclass ? [prev.multiclass.domainId] : [])]

  async function confirm() {
    setBusy('Saving…')
    try {
      const next = applyLevelUp(from, draft, reg, crypto.randomUUID())
      await store.save(next)
      onDone(next)
    } catch (e) { setBusy(e instanceof Error ? e.message : String(e)) }
  }

  return (
    <div className="wizard">
      <header className="bar">
        <button type="button" onClick={onCancel}>← Cancel</button>
        <strong>{from.name || 'Unnamed character'}: level {from.level} → {level}</strong>
        <span className="status">Tier {tier}. Level {from.level} stays saved as its own version.</span>
      </header>
      <div className="layout">
        <nav aria-label="Level-up steps">
          <ol>
            {steps.map((s, i) => (
              <li key={s}>
                <button type="button" className={`step ${i === at ? 'current' : i < at ? 'done' : 'todo'}`} disabled={i > at} aria-current={i === at ? 'step' : undefined} onClick={() => setAt(i)}>
                  <span className="dot" aria-hidden>{i < at ? '✓' : i + 1}</span>{titles[s]}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <main>
          <h2>{titles[step]}</h2>

          {step === 'achievement' && (
            <>
              <p>{achievement.rules}</p>
              <ul>
                <li>Proficiency goes from {prev.proficiency} to {prev.proficiency + (achievement.proficiency ?? 0)}.</li>
                {achievement.clearTraitMarks && <li>All marked traits are cleared{prev.markedTraits.length ? ` (${prev.markedTraits.map(titleCase).join(', ')})` : ''}.</li>}
              </ul>
              <label>New Experience (+{achievement.newExperience})
                <input type="text" value={draft.newExperience ?? ''} onChange={(e) => change({ newExperience: e.target.value })} />
              </label>
            </>
          )}

          {step === 'advancements' && (
            <Advancements
              draft={draft} change={change} prevState={prev} level={level} from={from} reg={reg} all={all}
              cardChoices={cardChoices} domainOrder={domainOrder}
            />
          )}
          {step === 'advancements' && draft.advancements.some((a) => a.cardId === 'vitality') && (
            <VitalityPicker choice={draft.vitalityChoice} onChange={(vitalityChoice) => change({ vitalityChoice })} />
          )}

          {step === 'cards' && (
            <>
              <p>{(all.find((o) => o.effect === 'level-domain-card') as any)?.rules}</p>
              <h3>New domain card</h3>
              <CardPicker domainOrder={domainOrder} cards={cardChoices(after, level, after.domainCardIds)} selected={[draft.newCardId]} onPick={(id) => change({ newCardId: id })} />
              <fieldset>
                <legend>Exchange a card (optional)</legend>
                <p className="hint">Give back a card you held before this level for a different card of the same level or lower. Pick the card to give back again to cancel.</p>
                <CardPicker domainOrder={domainOrder} cards={prev.domainCardIds.map((id) => reg.domainCards.get(id) as any)} selected={draft.swap ? [draft.swap.out] : []}
                  onPick={(id) => change({ swap: draft.swap?.out === id ? undefined : { out: id, in: '' } })} />
                {draft.swap && (
                  <>
                    <h3>Take instead</h3>
                    <CardPicker domainOrder={domainOrder} selected={[draft.swap.in]} onPick={(id) => change({ swap: { out: draft.swap!.out, in: id } })}
                      cards={cardChoices(after, (reg.domainCards.get(draft.swap.out) as any).level, [...after.domainCardIds, draft.newCardId].filter((x) => x !== draft.swap!.out))} />
                  </>
                )}
              </fieldset>
              {(draft.newCardId === 'vitality' || draft.swap?.in === 'vitality') && (
                <VitalityPicker choice={draft.vitalityChoice} onChange={(vitalityChoice) => change({ vitalityChoice })} />
              )}
            </>
          )}

          {step === 'class' && stanceClass && (
            <fieldset>
              <legend>{startStances ? 'Martial Stances: starting stances' : stanceStep?.name}</legend>
              <Rules text={stanceStep?.rules} />
              {startStances ? (() => {
                const chosen = draft.startStanceIds ?? [], want = stanceClass.knownStancesAtCreation ?? 2
                return (
                  <>
                    <p className="hint">Choose {want} Tier 1 stances ({chosen.length} chosen).</p>
                    <PickGrid selected={chosen} onPick={(id) => change({ startStanceIds: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id].slice(-want) })}
                      items={(stanceClass.stances as any[]).filter((s) => s.tier === 1).map((s) => ({ id: s.id, title: s.name, meta: 'Tier 1', details: <Rules text={s.rules} /> }))} />
                  </>
                )
              })() : (
                <PickGrid selected={draft.stanceId ? [draft.stanceId] : []} onPick={(id) => change({ stanceId: draft.stanceId === id ? undefined : id })}
                  items={(stanceClass.stances as any[]).filter((s) => s.tier <= tier && !after.stanceIds.includes(s.id)).map((s) => ({ id: s.id, title: s.name, meta: `Tier ${s.tier}`, details: <Rules text={s.rules} /> }))} />
              )}
            </fieldset>
          )}
          {step === 'class' && companionClass && (
            <fieldset>
              <legend>{startCompanion ? 'Ranger companion' : companionStep?.name}</legend>
              <Rules text={companionStep?.rules} />
              {startCompanion ? (() => {
                const comp = companionClass.companion
                const c = draft.newCompanion ?? { name: '', experiences: ['', ''], attack: '', damageType: null }
                const set = (patch: Partial<typeof c>) => change({ newCompanion: { ...c, ...patch } })
                return (
                  <>
                    <p className="hint">Evasion starts at {comp.startingEvasion}. Damage die {comp.startingDamageDie}, range {comp.startingRange}.</p>
                    <label>Name<input value={c.name} onChange={(e) => set({ name: e.target.value })} /></label>
                    {[0, 1].map((i) => (
                      <label key={i}>Companion Experience {i + 1} (+{comp.experiences.bonus})
                        <input value={c.experiences[i] ?? ''} onChange={(e) => { const ex = [...c.experiences]; ex[i] = e.target.value; set({ experiences: ex }) }} />
                      </label>
                    ))}
                    <label>Standard attack<input value={c.attack} onChange={(e) => set({ attack: e.target.value })} /></label>
                    <fieldset><legend>Damage type</legend>
                      {(['physical', 'magic'] as const).map((t) => (
                        <label key={t} className="inline"><input type="radio" name="ctype" checked={c.damageType === t} onChange={() => set({ damageType: t })} />{titleCase(t)}</label>
                      ))}
                    </fieldset>
                  </>
                )
              })() : (() => {
                const n = companionOptionCount(prev, after, reg, companionClass)
                const chosen = draft.companionOptionIds ?? []
                return (
                  <>
                    <p className="hint">Choose {n} option{n > 1 ? 's' : ''} ({chosen.length} chosen).</p>
                    <PickGrid selected={chosen} onPick={(id) => change({ companionOptionIds: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id] })}
                      items={(companionClass.companion.levelUpOptions as any[]).map((c) => {
                        const taken = after.companionOptionIds.includes(c.id)
                        return { id: c.id, title: c.name, meta: taken ? 'Already taken' : undefined, details: <Rules text={c.rules} />, disabled: taken || (!chosen.includes(c.id) && chosen.length >= n) }
                      })} />
                    {chosen.includes('vicious') && (
                      <>
                        <p className="hint">Vicious: raise the companion’s damage die or its range one step?</p>
                        <PickGrid selected={draft.viciousChoice ? [draft.viciousChoice] : []} onPick={(id) => change({ viciousChoice: id as 'die' | 'range' })}
                          items={[{ id: 'die', title: 'Damage die' }, { id: 'range', title: 'Range' }]} />
                      </>
                    )}
                    {chosen.includes('intelligent') && (
                      <>
                        <p className="hint">Intelligent: which Companion Experience gets +1?</p>
                        <PickGrid selected={draft.companionExperience === undefined ? [] : [String(draft.companionExperience)]} onPick={(id) => change({ companionExperience: Number(id) })}
                          items={(after.companion?.experiences ?? []).map((e, i) => ({ id: String(i), title: e || `Experience ${i + 1}` }))} />
                      </>
                    )}
                  </>
                )
              })()}
            </fieldset>
          )}

          {step === 'review' && (
            <>
              <dl className="summary">
                <div><dt>Level</dt><dd>{from.level} → {level} (tier {tier})</dd></div>
                {achievement && <div><dt>Tier achievement</dt><dd>New Experience “{draft.newExperience}” (+{achievement.newExperience}); Proficiency {prev.proficiency} → {after.proficiency}{achievement.clearTraitMarks ? '; trait marks cleared' : ''}</dd></div>}
                <div><dt>Advancements</dt><dd>{draft.advancements.map((a, i) => <div key={i}>{describeAdvancement(a, afterAdvancements(prev, level, draft.advancements.slice(0, i), from, reg, draft.newExperience), reg)}</div>)}</dd></div>
                <div><dt>Damage thresholds</dt><dd>All increase by 1 (automatic).</dd></div>
                <div><dt>New domain card</dt><dd>{(reg.domainCards.get(draft.newCardId) as any)?.name}{draft.swap ? `; swap ${(reg.domainCards.get(draft.swap.out) as any)?.name} for ${(reg.domainCards.get(draft.swap.in) as any)?.name}` : ''}</dd></div>
                {draft.stanceId && <div><dt>Stance</dt><dd>{titleCase(draft.stanceId)}</dd></div>}
                {draft.startStanceIds?.length ? <div><dt>Stances</dt><dd>{draft.startStanceIds.map(titleCase).join(', ')}</dd></div> : null}
                {draft.newCompanion ? <div><dt>Companion</dt><dd>{draft.newCompanion.name}</dd></div> : null}
                {draft.companionOptionIds?.length ? <div><dt>Companion</dt><dd>{draft.companionOptionIds.map(titleCase).join(', ')}</dd></div> : null}
                {draft.vitalityChoice?.length ? <div><dt>Vitality</dt><dd>{draft.vitalityChoice.map((c) => VITALITY_OPTIONS.find((o) => o.id === c)?.title ?? c).join(', ')}</dd></div> : null}
              </dl>
              {errors.length > 0 && <ul className="issues" role="alert">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
              {busy && <p className="hint" role="status">{busy}</p>}
              <button type="button" className="primary" disabled={errors.length > 0 || busy === 'Saving…'} onClick={() => void confirm()}>Level up to {level}</button>
            </>
          )}

          <div className="nav">
            <button type="button" disabled={at === 0} onClick={() => setAt(at - 1)}>Back</button>
            {step !== 'review' && <button type="button" className="primary" disabled={!stepOk} onClick={() => setAt(at + 1)}>Next</button>}
          </div>
        </main>
      </div>
    </div>
  )
}

type VitalityOption = NonNullable<LevelRecord['vitalityChoice']>[number]
const VITALITY_OPTIONS: { id: VitalityOption; title: string }[] = [
  { id: 'hitPoint', title: 'One Hit Point slot' },
  { id: 'stress', title: 'One Stress slot' },
  { id: 'thresholds', title: '+2 damage thresholds' },
]

/** Vitality: a one-time permanent choice of 2 of 3 benefits, made the level the card is taken. Cannot be changed later. */
function VitalityPicker({ choice, onChange }: { choice: VitalityOption[] | undefined; onChange: (c: VitalityOption[]) => void }) {
  const chosen = choice ?? []
  const toggle = (id: VitalityOption) => onChange(chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id])
  return (
    <fieldset>
      <legend>Vitality: choose 2 (permanent, cannot be changed later)</legend>
      <p className="hint">{chosen.length} of 2 chosen.</p>
      <PickGrid selected={chosen} onPick={(id) => toggle(id as VitalityOption)}
        items={VITALITY_OPTIONS.map((o) => ({ ...o, disabled: !chosen.includes(o.id) && chosen.length >= 2 }))} />
    </fieldset>
  )
}

interface AdvProps {
  draft: LevelRecord; change: (p: Partial<LevelRecord>) => void; prevState: ReturnType<typeof progressOf>; level: number; from: Character
  reg: ReturnType<typeof setupOf>['registry']; all: any[]
  cardChoices: (st: ReturnType<typeof progressOf>, cap: number, owned: string[]) => any[]; domainOrder: string[]
}

function Advancements({ draft, change, prevState, level, from, reg, all, cardChoices, domainOrder }: AdvProps) {
  const cls = reg.classes.get(from.choices.classId ?? '') as any
  const advs = draft.advancements
  const set = (next: AdvancementRecord[]) => change({ advancements: next })
  const costOf = (id: string) => (reg.levelUpOptions.get(id) as any)?.cost ?? 1
  const spent = advs.reduce((n, a) => n + costOf(a.option), 0)
  const before = (i: number) => afterAdvancements(prevState, level, advs.slice(0, i), from, reg, draft.newExperience)
  const now = before(advs.length)
  const options = all.filter((o) => o.kind === 'advancement' && (!o.classId || o.classId === from.choices.classId))
  const patch = (i: number, p: Partial<AdvancementRecord>) => set(advs.map((a, k) => (k === i ? { ...a, ...p } : a)))

  return (
    <>
      <p>Choose advancements worth {ADVANCEMENTS_PER_LEVEL} ({spent} chosen). Options from your tier or below are open while they have unmarked slots.</p>

      {advs.map((a, i) => {
        const opt = reg.levelUpOptions.get(a.option) as any
        const st = before(i)
        const tiers = optionAvailability(st, level, opt, reg, 99).tiers
        return (
          <fieldset key={i}>
            <legend>{opt.name}{opt.cost > 1 ? ' (costs both)' : ''}</legend>
            {tiers.length > 1 && (
              <>
                <p className="hint">Mark a slot in the box for:</p>
                <PickGrid selected={[String(a.fromTier)]} onPick={(id) => patch(i, { fromTier: Number(id) })} items={tiers.map((t) => ({ id: String(t), title: `Tier ${t}`, meta: `${slotsLeft(st, opt, t)} unmarked` }))} />
              </>
            )}
            <AdvancementDetail a={a} opt={opt} st={st} patch={(p) => patch(i, p)} level={level} from={from} reg={reg} cls={cls} cardChoices={cardChoices} domainOrder={domainOrder} />
            <button type="button" onClick={() => set(advs.filter((_, k) => k !== i))}>Remove</button>
          </fieldset>
        )
      })}

      <div className="grid">
        {options.map((o) => {
          const av = optionAvailability(now, level, o, reg, ADVANCEMENTS_PER_LEVEL - spent)
          const left = [2, 3, 4].filter((t) => o.slots?.[t] && t <= tierOf(level)).map((t) => slotsLeft(now, o, t))
          return (
            <div key={o.id} className="choice">
              <button type="button" className="pick" disabled={!!av.reason}
                onClick={() => set([...advs, { option: o.id, fromTier: av.tiers.includes(tierOf(level)) ? tierOf(level) : av.tiers[0] }])}>
                <span className="title">{o.name}{o.cost > 1 ? ' (costs both)' : ''}</span>
                <span className="meta">{av.reason ?? `Unmarked slots by tier: ${left.join(' / ')}`}</span>
              </button>
              <Details title="Rules"><Rules text={o.rules} /></Details>
            </div>
          )
        })}
      </div>
    </>
  )
}

interface DetailProps {
  a: AdvancementRecord; opt: any; st: ReturnType<typeof progressOf>; patch: (p: Partial<AdvancementRecord>) => void; level: number
  from: Character; reg: ReturnType<typeof setupOf>['registry']; cls: any
  cardChoices: AdvProps['cardChoices']; domainOrder: string[]
}

function AdvancementDetail({ a, opt, st, patch, level, from, reg, cls, cardChoices, domainOrder }: DetailProps) {
  switch (opt.effect) {
    case 'traits': {
      const picked = a.traits ?? []
      const toggle = (t: Trait) => patch({ traits: picked.includes(t) ? picked.filter((x) => x !== t) : [...picked, t] })
      return (
        <div>
          <p className="hint">Choose two unmarked traits ({picked.length} chosen). They become marked until the next tier achievement that clears them.</p>
          {TRAITS.map((t) => {
            const marked = st.markedTraits.includes(t)
            const value = (from.traits[t] ?? 0) + (st.traitBonus[t] ?? 0)
            return (
              <label key={t} className="inline">
                <input type="checkbox" checked={picked.includes(t)} disabled={marked || (!picked.includes(t) && picked.length >= 2)} onChange={() => toggle(t)} />
                {titleCase(t)} ({value >= 0 ? '+' : ''}{value}){marked ? ' (marked)' : ''}
              </label>
            )
          })}
        </div>
      )
    }
    case 'experience': {
      const picked = a.experienceIndexes ?? []
      const toggle = (i: number) => patch({ experienceIndexes: picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i] })
      return (
        <div>
          <p className="hint">Choose two Experiences ({picked.length} chosen).</p>
          {st.experiences.map((e, i) => (
            <label key={i} className="inline">
              <input type="checkbox" checked={picked.includes(i)} disabled={!picked.includes(i) && picked.length >= 2} onChange={() => toggle(i)} />
              {e.text || `Experience ${i + 1}`} (+{e.bonus})
            </label>
          ))}
        </div>
      )
    }
    case 'domain-card':
      return <CardPicker domainOrder={domainOrder} cards={cardChoices(st, level, st.domainCardIds)} selected={a.cardId ? [a.cardId] : []} onPick={(id) => patch({ cardId: id })} />
    case 'subclass-upgrade': {
      const open = Object.entries(st.subclassRanks).filter(([, r]) => r < RANK_NAMES.length)
      const sid = a.subclassId ?? from.choices.subclassId ?? ''
      const sub = reg.subclasses.get(sid) as any
      const next = RANK_NAMES[(st.subclassRanks[sid] ?? 1)]
      return (
        <div>
          {open.length > 1 && (
            <PickGrid selected={[sid]} onPick={(id) => patch({ subclassId: id })}
              items={open.map(([id, rank]) => {
                const sc = reg.subclasses.get(id) as any
                const to = RANK_NAMES[rank]
                return { id, title: sc.name, meta: `Next: ${to}`, details: (sc.features as any[]).filter((f) => f.level === to).map((f) => <Feature key={f.name} f={f} />) }
              })} />
          )}
          <p className="hint">You take the {next} card of {sub?.name}:</p>
          {(sub?.features ?? []).filter((f: any) => f.level === next).map((f: any) => <Feature key={f.name} f={f} />)}
        </div>
      )
    }
    case 'multiclass': {
      const m = a.multiclass
      const target = m && (reg.classes.get(m.classId) as any)
      const subs = target ? ([...reg.subclasses.values()] as any[]).filter((s) => s.class === m!.classId) : []
      const set = (p: Partial<NonNullable<AdvancementRecord['multiclass']>>) => patch({ multiclass: { classId: '', domainId: '', subclassId: '', ...m, ...p } })
      const crossable = [a.fromTier, a.fromTier + 1].filter((t) => slotsLeft(st, reg.levelUpOptions.get('subclass-upgrade'), t) > 0)
      return (
        <div>
          <h3>Additional class</h3>
          <PickGrid selected={m ? [m.classId] : []} onPick={(id) => set({ classId: id, domainId: '', subclassId: '' })}
            items={([...reg.classes.values()] as any[]).filter((c) => c.id !== cls.id).map((c) => ({
              id: c.id, title: c.name, meta: (c.domains as string[]).map(titleCase).join(' + '), details: (c.features as any[]).map((f) => <Feature key={f.name} f={f} />),
            }))} />
          {target && (
            <>
              <h3>Domain to gain access to</h3>
              <PickGrid selected={m!.domainId ? [m!.domainId] : []} onPick={(id) => set({ domainId: id })} items={(target.domains as string[]).map((d) => ({ id: d, title: titleCase(d) }))} />
              <h3>Foundation card from a subclass</h3>
              <PickGrid selected={m!.subclassId ? [m!.subclassId] : []} onPick={(id) => set({ subclassId: id })}
                items={subs.map((s) => ({ id: s.id, title: s.name, details: (s.features as any[]).filter((f) => f.level === 'foundation').map((f) => <Feature key={f.name} f={f} />) }))} />
            </>
          )}
          {crossable.length > 1 && (
            <>
              <h3>Cross out the upgraded subclass option for</h3>
              <PickGrid selected={[String(a.crossOutTier ?? crossable[0])]} onPick={(id) => patch({ crossOutTier: Number(id) })}
                items={crossable.map((t) => ({ id: String(t), title: `Tier ${t}`, meta: t === a.fromTier ? 'This tier' : 'Next tier' }))} />
            </>
          )}
        </div>
      )
    }
    default:
      return <Details title="Rules"><Rules text={opt.rules} /></Details>
  }
}
