import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { applyLevelUp, applyRecord, initialProgress, progressOf, type Progress } from '../src/engine/levelup'
import { startingCardRule, cardTypeProblem } from '../src/engine/classCards'
import { equipped } from './lib/levelup-paths'
import { ARMS } from './lib/packs'
import { sheetView } from '../src/engine/sheetView'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { withRecording } from './lib/record'
import type { AdvancementRecord, LevelRecord } from '../src/engine/character'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const setup = buildCreation([pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS], { supplements: ['starfinder-classes'] })
const reg = setup.registry, reg2 = setup
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}
const cls = (id: string) => reg.classes.get(id) as any

function hero(classId: string, subclassId: string) {
  const ch = equipped('wizard')
  ch.sources.supplementIds = ['starfinder-classes']
  const c = cls(classId), sub = reg.subclasses.get(subclassId) as any
  ch.choices.classId = classId; ch.choices.subclassId = sub.id
  const { count, extraDomain } = startingCardRule(c, sub)
  const pool = ([...reg.domainCards.values()] as any[]).filter((d) => d.level === 1 && !cardTypeProblem(c, d))
  const extra = extraDomain ? [pool.find((d) => d.domain === extraDomain).id] : []
  ch.choices.domainCardIds = [...extra, ...pool.filter((d) => c.domains.includes(d.domain)).slice(0, count - extra.length).map((d) => d.id)]
  ch.creation = { ...ch.creation!, potion: 'health', classItem: c.classItems }
  return ch
}

/** One level on a progress state; returns the new state and any error text. */
function step(ch: ReturnType<typeof hero>, p: Progress, advancements: AdvancementRecord[]) {
  const level = p.level + 1
  const c = cls(ch.choices.classId!)
  const card = ([...reg.domainCards.values()] as any[]).find((d) => c.domains.includes(d.domain) && d.level <= level && !p.domainCardIds.includes(d.id) && !cardTypeProblem(c, d))
  const r: LevelRecord = { level, advancements, newCardId: card.id }
  if ([2, 5, 8].includes(level)) r.newExperience = `Exp ${level}`
  const out = applyRecord(p, r, ch, reg)
  return { p: out.progress, errors: out.errors }
}
const hp = (t: number): AdvancementRecord => ({ option: 'hit-point', fromTier: t })
const stressAdv = (t: number): AdvancementRecord => ({ option: 'stress', fromTier: t })
const expAdv = (...ix: number[]): AdvancementRecord => ({ option: 'experience', fromTier: 2, experienceIndexes: ix })
const at = (p: Progress, level: number): Progress => ({ ...structuredClone(p), level })
const upgrade = (t: number): AdvancementRecord => ({ option: 'subclass-upgrade', fromTier: t })
const bp = (p: Progress) => p.experiences.find((e) => e.text === 'Buried Protocols')

describe('[s17] Experience grants', () => {
  it('the three granting features carry their data', () => {
    const f = (id: string, n: string) => ((cls(id) ?? reg.subclasses.get(id)) as any).features.find((x: any) => x.name === n)
    expect(f('aspis-sleeper', 'Buried Protocols').experience).toEqual({ text: 'Buried Protocols', start: 1, perTier: 1, max: 7 })
    expect(f('biohacker.gene-splicer', 'Creature Feature').experience).toEqual({ text: 'Form of _______', start: 3 })
    expect(f('aspis-sleeper.infiltrator', 'Desperation').experience).toEqual({ text: 'Desperation', note: 'marked HP' })
  })

  it('Buried Protocols is on the sheet at level 1 as a third Experience at +1', () => {
    const ch = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    const p = initialProgress(ch, reg)
    expect(p.experiences).toHaveLength(ch.creation!.experiences.filter(Boolean).length + 1)
    expect(bp(p)).toMatchObject({ bonus: 1, max: 7, perTier: 1, grant: 'Buried Protocols' })
  })

  it('other classes get no granted Experience', () => {
    const p = initialProgress(hero('biohacker', 'biohacker.gene-splicer'), reg)
    expect(p.experiences.every((e) => !e.grant)).toBe(true)
  })

  it('Buried Protocols rises +1 at each tier achievement (levels 2, 5, 8), and not in between', () => {
    const ch = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    let p = initialProgress(ch, reg)
    const seen: number[] = []
    for (let lv = 2; lv <= 8; lv++) {
      const r = step(ch, p, [hp(Math.min(3, Math.ceil(lv / 3) + 0)), stressAdv(Math.min(3, Math.ceil(lv / 3)))].slice(0, 2))
      p = r.p; seen.push(bp(p)!.bonus)
    }
    expect(seen).toEqual([2, 2, 2, 3, 3, 3, 4])
  })

  it('an Experience advancement can raise Buried Protocols, and stops at +7', () => {
    const ch = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    const p = initialProgress(ch, reg)
    const i = p.experiences.findIndex((e) => e.grant) + 1 // the level 2 Experience goes in above it
    const r = step(ch, p, [expAdv(0, i), hp(2)])
    expect(r.errors).toEqual([])
    expect(bp(r.p)!.bonus).toBe(1 + 1 + 1) // tier achievement at level 2, then the advancement
    const capped = structuredClone(p); capped.experiences[i - 1].bonus = 7
    const r2 = step(ch, capped, [expAdv(0, i), hp(2)])
    expect(r2.errors.join(' ')).toContain('already at +7')
  })

  it('the tier bump stops at the maximum', () => {
    const ch = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    const p = initialProgress(ch, reg)
    p.experiences.find((e) => e.grant)!.bonus = 7
    expect(bp(step(ch, p, [hp(2), stressAdv(2)]).p)!.bonus).toBe(7)
  })

  it('Creature Feature arrives with the specialization card as "Form of _______ +3"; Desperation with the mastery card, as a note', () => {
    const gs = hero('biohacker', 'biohacker.gene-splicer')
    let p = initialProgress(gs, reg)
    expect(p.experiences.some((e) => e.grant === 'Creature Feature')).toBe(false)
    p = step(gs, at(p, 4), [upgrade(3), hp(3)]).p
    expect(p.experiences.find((e) => e.grant === 'Creature Feature')).toMatchObject({ text: 'Form of _______', bonus: 3 })

    const inf = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    let q = initialProgress(inf, reg)
    q = step(inf, at(q, 4), [upgrade(3), hp(3)]).p
    expect(q.experiences.some((e) => e.grant === 'Desperation')).toBe(false)
    q = step(inf, at(q, 7), [upgrade(4), hp(4)]).p
    expect(q.experiences.find((e) => e.grant === 'Desperation')).toMatchObject({ text: 'Desperation', bonus: 0, note: 'marked HP' })
  })

  it('Desperation cannot be raised by an Experience advancement', () => {
    const inf = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    let q = initialProgress(inf, reg)
    q = step(inf, at(q, 4), [upgrade(3), hp(3)]).p
    q = step(inf, at(q, 7), [upgrade(4), hp(4)]).p
    const i = q.experiences.findIndex((e) => e.grant === 'Desperation')
    const r = step(inf, at(q, 8), [expAdv(0, i), hp(4)])
    expect(r.errors.join(' ')).toContain('cannot be raised')
  })

  it('a grant is added once, even if the subclass is upgraded again', () => {
    const gs = hero('biohacker', 'biohacker.gene-splicer')
    let p = initialProgress(gs, reg)
    p = step(gs, at(p, 4), [upgrade(3), hp(3)]).p
    p = step(gs, at(p, 7), [upgrade(4), hp(4)]).p
    expect(p.experiences.filter((e) => e.grant === 'Creature Feature')).toHaveLength(1)
  })

  it('the printed sheet lists Buried Protocols with its bonus among the Experiences', async () => {
    const ch = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    const marks = await withRecording(async () => renderSheet(ch, reg2, fonts))
    const texts = marks.filter((m) => m.kind === 'text')
    const line = texts.find((m) => m.text === 'Buried Protocols' && m.x0 < 230)
    expect(line).toBeTruthy()
    expect(texts.some((m) => m.text === '+1' && Math.abs(m.y0 - line!.y0) < 1)).toBe(true)
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    writeFileSync('TestArtifacts/sheet-samples/starheart-aspis-sleeper-experiences.pdf', await renderSheet(ch, reg2, fonts))
  })

  it('a level 8 Infiltrator prints seven Experiences, Desperation with its note after the name, granted ones last, inside the margins', async () => {
    let ch = hero('aspis-sleeper', 'aspis-sleeper.infiltrator')
    const c = cls('aspis-sleeper')
    const plan: AdvancementRecord[][] = [
      [hp(2), hp(2)], [stressAdv(2), stressAdv(2)], [], [upgrade(3), hp(3)], [stressAdv(3), stressAdv(3)], [], [upgrade(4), hp(4)],
    ]
    for (let n = 0; n < plan.length; n++) {
      const p = progressOf(ch, reg), level = p.level + 1
      const i = p.experiences.findIndex((e) => e.grant === 'Buried Protocols')
      const advs = level === 4 ? [expAdv(0, i), { option: 'evasion', fromTier: 2 }] : level === 7 ? [{ option: 'experience', fromTier: 3, experienceIndexes: [0, i] }, hp(3)] : plan[n]
      const card = ([...reg.domainCards.values()] as any[]).find((d) => c.domains.includes(d.domain) && d.level <= level && !p.domainCardIds.includes(d.id) && !cardTypeProblem(c, d))
      const rec: LevelRecord = { level, advancements: advs, newCardId: card.id, ...([2, 5, 8].includes(level) ? { newExperience: `Exp ${level}` } : {}) }
      ch = applyLevelUp(ch, rec, reg, `lv${level}`)
    }
    const view = sheetView(ch, setup)
    expect(view.experiences.map((e) => e.text).slice(2)).toEqual(['Exp 2', 'Exp 5', 'Exp 8', 'Buried Protocols', 'Desperation'])
    expect(view.experiences.at(-1)!.note).toBe('marked HP')
    const marks = await withRecording(async () => renderSheet(ch, setup, fonts))
    expect(marks.some((m) => m.kind === 'text' && m.text === 'Desperation (marked HP)')).toBe(true)
    writeFileSync('TestArtifacts/sheet-samples/starheart-infiltrator-l8-experiences.pdf', await renderSheet(ch, setup, fonts))
  })
})
