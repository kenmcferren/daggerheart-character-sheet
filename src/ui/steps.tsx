import { useState } from 'react'
import { TRAITS } from '../engine/character'
import { TRAIT_MODIFIERS, armorPool, frameChoiceDefs, weaponPool, ancestryFeatures, tierOf } from '../engine/rules'
import type { WizardStep } from '../engine/creation'
import { Choice, Details, Feature, GearRow, Notes, Rules, Section, type Ctx } from './common'
import { titleCase } from './util'

type A = any
const sorted = (m: Map<string, A>) => [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
const fmt = (n: number) => (n >= 0 ? `+${n}` : String(n))

export function ClassStep({ ch, setup, update }: Ctx) {
  return (
    <div className="grid">
      {sorted(setup.registry.classes).map((c: A) => (
        <Choice key={c.id} title={c.name} selected={ch.choices.classId === c.id}
          meta={`${c.domains.map(titleCase).join(' & ')} · Evasion ${c.startingEvasion} · HP ${c.startingHitPoints}`}
          onPick={() => update((x, cr) => {
            if (x.choices.classId === c.id) return
            x.choices.classId = c.id; x.choices.subclassId = null; x.choices.domainCardIds = []
            cr.companion = null; cr.stanceIds = []
          })}>
          <Notes setup={setup} target={`classes.${c.id}`} />
          <Details>
            <h4>Hope feature</h4><Feature f={c.hopeFeature} />
            <h4>Class features</h4>{c.features.map((f: A, i: number) => <Feature key={i} f={f} />)}
          </Details>
        </Choice>
      ))}
    </div>
  )
}

export function SubclassStep({ ch, cr, setup, update }: Ctx) {
  const cls: A = ch.choices.classId ? setup.registry.classes.get(ch.choices.classId) : null
  if (!cls) return <p className="hint">Choose a class first.</p>
  const sub = ch.choices.subclassId
  return (
    <>
      <div className="grid">
        {cls.subclasses.map((id: string) => {
          const s: A = setup.registry.subclasses.get(id)
          return (
            <Choice key={id} title={s.name} selected={sub === id} meta={s.spellcastTrait ? `Spellcast: ${titleCase(s.spellcastTrait)}` : undefined}
              onPick={() => update((x, c) => { x.choices.subclassId = id; c.companion = null; c.stanceIds = [] })}>
              <Notes setup={setup} target={`subclasses.${id}`} />
              <Details>{s.features.map((f: A, i: number) => <Feature key={i} f={{ ...f, name: `${titleCase(f.level)}: ${f.name}` }} />)}</Details>
            </Choice>
          )
        })}
      </div>
      {sub === 'ranger.beastbound' && <Companion ctx={{ ch, cr, setup, update, issues: [] }} cls={cls} />}
      {sub === 'brawler.martial-artist' && <Stances ctx={{ ch, cr, setup, update, issues: [] }} cls={cls} />}
    </>
  )
}

function Companion({ ctx: { cr, update }, cls }: { ctx: Ctx; cls: A }) {
  const c = cr.companion ?? { name: '', experiences: ['', ''], attack: '', damageType: null }
  const set = (patch: Partial<typeof c>) => update((_, x) => { x.companion = { ...c, ...patch } })
  const comp = cls.companion
  return (
    <section className="panel">
      <h3>Ranger companion</h3>
      <p className="hint">Evasion starts at {comp.startingEvasion}. Damage die {comp.startingDamageDie}, range {comp.startingRange}.</p>
      <label>Name<input value={c.name} onChange={(e) => set({ name: e.target.value })} /></label>
      {[0, 1].map((i) => (
        <label key={i}>Companion Experience {i + 1} (+{comp.experiences.bonus})
          <input value={c.experiences[i] ?? ''} onChange={(e) => { const ex = [...c.experiences]; ex[i] = e.target.value; set({ experiences: ex }) }} />
        </label>
      ))}
      <Details title="Example Experiences"><p>{comp.exampleExperiences.join(', ')}</p></Details>
      <label>Standard attack<input value={c.attack} onChange={(e) => set({ attack: e.target.value })} /></label>
      <fieldset><legend>Damage type</legend>
        {(['physical', 'magic'] as const).map((t) => (
          <label key={t} className="inline"><input type="radio" name="ctype" checked={c.damageType === t} onChange={() => set({ damageType: t })} />{titleCase(t)}</label>
        ))}
      </fieldset>
    </section>
  )
}

function Stances({ ctx: { cr, update }, cls }: { ctx: Ctx; cls: A }) {
  const want = cls.knownStancesAtCreation
  const tier1 = cls.stances.filter((s: A) => s.tier === 1)
  const toggle = (id: string) => update((_, x) => {
    x.stanceIds = x.stanceIds.includes(id) ? x.stanceIds.filter((s) => s !== id) : [...x.stanceIds, id].slice(-want)
  })
  return (
    <section className="panel">
      <h3>Martial stances</h3>
      <p className="hint">Choose {want} Tier 1 stances ({cr.stanceIds.length} chosen). Focus holds up to {cls.focusMax}.</p>
      <div className="grid">
        {tier1.map((s: A) => (
          <Choice key={s.id} title={s.name} selected={cr.stanceIds.includes(s.id)} onPick={() => toggle(s.id)}>
            <Details><Rules text={s.rules} /></Details>
          </Choice>
        ))}
      </div>
    </section>
  )
}

export function AncestryStep({ ch, cr, setup, update }: Ctx) {
  const list = sorted(setup.registry.ancestries)
  const mixed = cr.mixedAncestry
  const feats = ancestryFeatures(ch, setup)
  return (
    <>
      <label className="inline">
        <input type="checkbox" checked={!!mixed} onChange={(e) => update((_, x) => { x.mixedAncestry = e.target.checked ? { first: '', second: '' } : null })} />
        Mixed Ancestry (first feature from one ancestry, second feature from another)
      </label>
      {mixed ? (
        <section className="panel">
          {(['first', 'second'] as const).map((k, i) => (
            <label key={k}>{i === 0 ? 'First feature from' : 'Second feature from'}
              <select value={mixed[k]} onChange={(e) => update((_, x) => { x.mixedAncestry = { ...mixed, [k]: e.target.value } })}>
                <option value="">Choose…</option>
                {list.map((a: A) => <option key={a.id} value={a.id}>{a.name}: {a.features[i]?.name}</option>)}
              </select>
            </label>
          ))}
          {feats.map((f, i) => <Feature key={i} f={{ name: `${f.name} (${f.from})`, rules: f.rules }} />)}
        </section>
      ) : (
        <div className="grid">
          {list.map((a: A) => (
            <Choice key={a.id} title={a.name} selected={ch.choices.ancestryId === a.id} onPick={() => update((x) => { x.choices.ancestryId = a.id })}>
              <Notes setup={setup} target={`ancestries.${a.id}`} />
              <Details>{a.features.map((f: A, i: number) => <Feature key={i} f={f} />)}</Details>
            </Choice>
          ))}
        </div>
      )}
    </>
  )
}

export function CommunityStep({ ch, setup, update }: Ctx) {
  return (
    <div className="grid">
      {sorted(setup.registry.communities).map((c: A) => (
        <Choice key={c.id} title={c.name} selected={ch.choices.communityId === c.id} onPick={() => update((x) => { x.choices.communityId = c.id })}>
          <Notes setup={setup} target={`communities.${c.id}`} />
          <Details>{c.features.map((f: A, i: number) => <Feature key={i} f={f} />)}</Details>
        </Choice>
      ))}
    </div>
  )
}

export function TraitsStep({ ch, update }: Ctx) {
  // Values still unassigned (a list, so +1 and +0 appear twice until both are used).
  const left = [...TRAIT_MODIFIERS]
  for (const t of TRAITS) { const v = ch.traits[t]; if (v === undefined) continue; const i = left.indexOf(v); if (i >= 0) left.splice(i, 1) }
  return (
    <>
      <p className="hint">Assign +2, +1, +1, +0, +0, −1 in any order. Left to assign: {left.length ? left.map(fmt).join(', ') : 'none'}.</p>
      <div className="traits">
        {TRAITS.map((t) => {
          // What this trait can take: everything still unassigned, plus its own current value.
          const own = ch.traits[t]
          const options = [...left, ...(own === undefined ? [] : [own])].sort((a, b) => b - a)
          return (
            <label key={t}>{titleCase(t)}
              <select value={own ?? ''} onChange={(e) => update((x) => {
                if (e.target.value === '') delete x.traits[t]; else x.traits[t] = Number(e.target.value)
              })}>
                <option value="">—</option>
                {options.map((v, i) => <option key={`${v}-${i}`} value={v}>{fmt(v)}</option>)}
              </select>
            </label>
          )
        })}
      </div>
    </>
  )
}

/** Weapon and armor pickers. Shows the character's tier (plus anything already chosen) unless "all tiers" is ticked; "No weapon" / "No armor" are real choices. */
export function GearPicker(ctx: Ctx) {
  const { ch, setup, update } = ctx
  const tier = tierOf(ch.level)
  const [allTiers, setAllTiers] = useState(false)
  const { entries: weapons, builder } = weaponPool(setup)
  const armor = armorPool(setup)
  const ids = ch.choices.equipmentIds
  const has = (id: string) => ids.includes(id)
  const shown = (e: A) => allTiers || e.tier === undefined || e.tier === tier || has(e.id)
  const byTier = (x: A, y: A) => (x.tier ?? 0) - (y.tier ?? 0)
  const noWeapon = !weapons.some((w) => has(w.id))
  const noArmor = !armor.some((a) => has(a.id))
  const tierMeta = (e: A) => (allTiers && e.tier ? `Tier ${e.tier}` : '')
  const toggleW = (w: A) => update((x) => {
    const inPool = new Set(weapons.map((e) => e.id))
    let cur = x.choices.equipmentIds.filter((i) => inPool.has(i))
    const rest = x.choices.equipmentIds.filter((i) => !inPool.has(i))
    const slot = (e: A) => (e.weaponSlot === 'secondary' ? 'secondary' : 'primary')
    const byId = (i: string) => weapons.find((e) => e.id === i)!
    if (!w) cur = []
    else if (cur.includes(w.id)) cur = cur.filter((i) => i !== w.id)
    else if (w.burden === 'two-handed') cur = [w.id]
    else {
      cur = cur.filter((i) => byId(i).burden !== 'two-handed' && slot(byId(i)) !== slot(w))
      cur.push(w.id)
    }
    x.choices.equipmentIds = [...cur, ...rest]
  })
  const pickArmor = (id: string | null) => update((x) => {
    const inPool = new Set(armor.map((e) => e.id))
    x.choices.equipmentIds = [...x.choices.equipmentIds.filter((i) => !inPool.has(i)), ...(id ? [id] : [])]
  })
  // The section header already says Primary / Secondary / Wheelchair, so the slot is not repeated in the row.
  const wRow = (w: A) => (
    <GearRow key={w.id} name={w.name} selected={has(w.id)} onPick={() => toggleW(w)}
      meta={[tierMeta(w), w.burden, w.trait && `${titleCase(w.trait)} ${titleCase(String(w.range ?? ''))}`, w.damage && `${w.damage} ${w.damageType === 'magic' ? 'mag' : 'phy'}`].filter(Boolean).join(' · ')}
      detail={w.feature}>
      <Notes setup={setup} target={`equipment.${w.id}`} />
    </GearRow>
  )
  const slotOf = (w: A) => (w.weaponSlot === 'secondary' ? 'secondary' : w.weaponSlot === 'wheelchair' ? 'wheelchair' : 'primary')
  const list = (slot: string) => weapons.filter((w) => slotOf(w) === slot && shown(w)).sort(byTier)
  return (
    <>
      <label className="check"><input type="checkbox" checked={allTiers} onChange={(e) => setAllTiers(e.target.checked)} /> Show every tier{allTiers ? '' : ` (now only Tier ${tier}, plus anything already chosen)`}</label>
      <h3>Weapons</h3>
      <p className="hint">Choose no weapon, one two-handed primary weapon, or a one-handed primary and a one-handed secondary.</p>
      {builder ? <Builder ctx={ctx} id={builder} /> : (
        <>
          <div className="gearlist"><GearRow name="No weapon" selected={noWeapon} onPick={() => toggleW(null as unknown as A)} /></div>
          <Section title="Primary"><div className="gearlist">{list('primary').map(wRow)}</div></Section>
          <Section title="Secondary"><div className="gearlist">{list('secondary').map(wRow)}</div></Section>
          {list('wheelchair').length > 0 && <Section title="Wheelchair"><div className="gearlist">{list('wheelchair').map(wRow)}</div></Section>}
        </>
      )}
      <Section title="Armor">
        <div className="gearlist">
          <GearRow name="No armor" selected={noArmor} onPick={() => pickArmor(null)} />
          {armor.filter(shown).sort(byTier).map((a: A) => (
            <GearRow key={a.id} name={a.name} selected={has(a.id)} onPick={() => pickArmor(a.id)}
              meta={[tierMeta(a), `Thresholds ${a.majorThreshold}/${a.severeThreshold} (+level) · Armor Score ${a.armorScore}`].filter(Boolean).join(' · ')} detail={a.feature} />
          ))}
        </div>
      </Section>
    </>
  )
}

export function EquipmentStep(ctx: Ctx) {
  const { ch, cr, setup, update } = ctx
  const cls: A = ch.choices.classId ? setup.registry.classes.get(ch.choices.classId) : null
  return (
    <>
      <GearPicker {...ctx} />
      <Section title="Starting potion">
        <div className="grid">
          <Choice title="Minor Health Potion" meta="Clear 1d4 Hit Points" selected={cr.potion === 'health'} onPick={() => update((_, x) => { x.potion = 'health' })} />
          <Choice title="Minor Stamina Potion" meta="Clear 1d4 Stress" selected={cr.potion === 'stamina'} onPick={() => update((_, x) => { x.potion = 'stamina' })} />
        </div>
      </Section>
      <h3>Class item</h3>
      {cls && <p className="hint">Options for {cls.name}: {cls.classItems}</p>}
      <label>Your class item<input value={cr.classItem} onChange={(e) => update((_, x) => { x.classItem = e.target.value })} /></label>
      <p className="hint">You also start with a torch, 50 feet of rope, basic supplies and a handful of gold (or the frame's currency).</p>
    </>
  )
}

/** Frame-defined builder, e.g. Tech's Iconic Weapon. */
function Builder({ ctx: { cr, setup, update }, id }: { ctx: Ctx; id: string }) {
  const def: A = frameChoiceDefs(setup).find((d) => d.id === id)
  if (!def) return null
  const v = (typeof cr.frameChoices[id] === 'object' ? cr.frameChoices[id] : {}) as Record<string, string>
  const set = (k: string, val: string) => update((_, x) => { x.frameChoices[id] = { ...v, [k]: val } })
  return (
    <section className="panel">
      <h4>{titleCase(id)}</h4>
      {def.fields.map((f: A) => f.free
        ? <label key={f.key}>{titleCase(f.key)}<input value={v[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} /></label>
        : (
          <label key={f.key}>{titleCase(f.key)}
            <select value={v[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
              <option value="">Choose…</option>
              {f.options.map((o: string) => <option key={o} value={o}>{titleCase(o)}</option>)}
            </select>
          </label>
        ))}
      <p className="hint">Fixed: {Object.entries(def.fixed ?? {}).map(([k, val]) => `${titleCase(k)} — ${val}`).join('; ')}</p>
    </section>
  )
}

export function BackgroundStep({ ch, cr, setup, update }: Ctx) {
  const cls: A = ch.choices.classId ? setup.registry.classes.get(ch.choices.classId) : null
  return (
    <>
      <section className="panel">
        <h3>About your character</h3>
        <label>Name<input value={ch.name} onChange={(e) => update((x) => { x.name = e.target.value })} /></label>
        <label>Pronouns<input value={cr.pronouns} onChange={(e) => update((_, x) => { x.pronouns = e.target.value })} /></label>
        <label>Description<textarea value={cr.description} onChange={(e) => update((_, x) => { x.description = e.target.value })} /></label>
      </section>
      <h3>Background questions</h3>
      <p className="hint">Answers are optional; modify or replace the questions as you like.</p>
      {cls?.backgroundQuestions.map((q: string, i: number) => (
        <label key={i}>{q}
          <textarea value={cr.backgroundAnswers[i] ?? ''} onChange={(e) => update((_, x) => { const a = [...x.backgroundAnswers]; a[i] = e.target.value; x.backgroundAnswers = a })} />
        </label>
      )) ?? <p className="hint">Choose a class to see its questions.</p>}
    </>
  )
}

export function ExperiencesStep({ cr, update }: Ctx) {
  return (
    <>
      <p className="hint">Two Experiences, each with a +2 modifier.</p>
      {[0, 1].map((i) => (
        <label key={i}>Experience {i + 1} (+2)
          <input value={cr.experiences[i] ?? ''} onChange={(e) => update((_, x) => { const a = [...x.experiences]; a[i] = e.target.value; x.experiences = a.slice(0, 2) })} />
        </label>
      ))}
    </>
  )
}

export function DomainCardsStep({ ch, setup, update }: Ctx) {
  const cls: A = ch.choices.classId ? setup.registry.classes.get(ch.choices.classId) : null
  if (!cls) return <p className="hint">Choose a class first.</p>
  const chosen = ch.choices.domainCardIds
  const toggle = (id: string) => update((x) => {
    const c = x.choices.domainCardIds
    x.choices.domainCardIds = c.includes(id) ? c.filter((i) => i !== id) : [...c, id].slice(-2)
  })
  return (
    <>
      <p className="hint">Choose two level 1 cards: one from each domain, or two from one ({chosen.length} chosen).</p>
      {cls.domains.map((d: string) => (
        <section key={d}>
          <h3>{titleCase(d)}</h3>
          <div className="grid">
            {[...setup.registry.domainCards.values()].filter((c: A) => c.domain === d && c.level === 1).map((c: A) => (
              <Choice key={c.id} title={c.name} selected={chosen.includes(c.id)} onPick={() => toggle(c.id)} meta={`${titleCase(c.type)} · Recall ${c.recallCost}`}>
                <Details><Rules text={c.rules} /></Details>
              </Choice>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export function ConnectionsStep({ ch, cr, setup, update }: Ctx) {
  const cls: A = ch.choices.classId ? setup.registry.classes.get(ch.choices.classId) : null
  return (
    <>
      <p className="hint">Connections are worked out with the other players at the table. Jot ideas here; all optional.</p>
      {cls?.connections.map((q: string, i: number) => (
        <label key={i}>{q}
          <textarea value={cr.connections[i] ?? ''} onChange={(e) => update((_, x) => { const a = [...x.connections]; a[i] = e.target.value; x.connections = a })} />
        </label>
      )) ?? <p className="hint">Choose a class to see its questions.</p>}
    </>
  )
}

/** Frame-inserted step: a text choice, or plain guidance text. */
export function FrameStep({ step, cr, update }: Ctx & { step: WizardStep }) {
  return (
    <>
      {step.text && <p>{step.text}</p>}
      {step.choice && (
        <label>Your answer
          <textarea value={typeof cr.frameChoices[step.choice] === 'string' ? (cr.frameChoices[step.choice] as string) : ''}
            onChange={(e) => update((_, x) => { x.frameChoices[step.choice!] = e.target.value })} />
        </label>
      )}
    </>
  )
}
