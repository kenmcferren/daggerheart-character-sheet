import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { validateCreation } from '../src/engine/rules'
import { classCard, classList, startingCardRule, swapWords, cardTypeProblem } from '../src/engine/classCards'
import { domainCardProblem, progressOf } from '../src/engine/levelup'
import { sheetView } from '../src/engine/sheetView'
import { validatePack } from '../src/engine/packs'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { equipped } from './lib/levelup-paths'
import { ARMS } from './lib/packs'
import { describeRecord } from '../src/ui/describe'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const PACKS = [pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS]
const plain = buildCreation(PACKS)
const sh = buildCreation(PACKS, { supplements: ['starfinder-classes'] })
const reg = sh.registry
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}
const STARHEART = ['envoy', 'mystic', 'operative', 'solarian', 'soldier', 'witchwarper', 'mechanic', 'technomancer', 'biohacker', 'aspis-sleeper']
const cls = (id: string) => reg.classes.get(id) as any
const card = (id: string) => reg.domainCards.get(id) as any

/** A valid level 1 character of the class: first subclass (or the one given), cards picked to fit the class's card rules. */
function hero(classId: string, subclassId?: string) {
  const ch = equipped('wizard')
  ch.sources.supplementIds = ['starfinder-classes']
  const c = cls(classId), sub = reg.subclasses.get(subclassId ?? c.subclasses[0]) as any
  ch.choices.classId = classId; ch.choices.subclassId = sub.id
  const { count, extraDomain } = startingCardRule(c, sub)
  const pool = ([...reg.domainCards.values()] as any[]).filter((d) => d.level === 1 && !cardTypeProblem(c, d))
  const extra = extraDomain ? [pool.find((d) => d.domain === extraDomain).id] : []
  ch.choices.domainCardIds = [...extra, ...pool.filter((d) => c.domains.includes(d.domain)).slice(0, count - extra.length).map((d) => d.id)]
  ch.creation = { ...ch.creation!, potion: 'health', classItem: c.classItems }
  return ch
}

describe('[s13] Starheart classes', () => {
  it('the pack validates; ten classes with two subclasses each', () => {
    expect(() => validatePack(pack('starfinder'))).not.toThrow()
    for (const id of STARHEART) expect(cls(id).subclasses).toHaveLength(2)
  })

  it('offered only with the Starheart Classes option, alphabetical with the core classes', () => {
    expect(classList(plain).map((c) => c.id)).not.toContain('envoy')
    const on = classList(sh).map((c) => c.id)
    for (const id of STARHEART) expect(on).toContain(id)
    expect(on).toHaveLength(13 + 10)
    const off = hero('envoy'); off.sources.supplementIds = []
    expect(validateCreation(off, plain).some((i) => i.step === 'class' && /not available/.test(i.message))).toBe(true)
  })

  it('every class and subclass validates at level 1 and prints inside the margins', async () => {
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    for (const id of STARHEART) for (const sid of cls(id).subclasses) {
      const ch = hero(id, sid)
      expect(validateCreation(ch, sh), sid).toEqual([])
      const marks = await withRecording(async () => renderSheet(ch, sh, fonts))
      expect(marks.filter(outside), sid).toHaveLength(0)
      if (sid === cls(id).subclasses[0]) writeFileSync(`TestArtifacts/sheet-samples/starheart-${id}.pdf`, await renderSheet(ch, sh, fonts))
    }
  }, 120_000)

  it('card rules: Operative takes 3 cards, Witchwarper spells only, Neutronic adds a Splendor card', () => {
    const op = hero('operative')
    expect(op.choices.domainCardIds).toHaveLength(3)
    op.choices.domainCardIds = op.choices.domainCardIds.slice(0, 2)
    expect(validateCreation(op, sh).some((i) => i.step === 'domain-cards')).toBe(true)

    const ww = hero('witchwarper', 'witchwarper.electronic')
    ww.choices.domainCardIds = ['pick-and-pull', 'rain-of-blades', 'rune-ward']
    expect(validateCreation(ww, sh).some((i) => /only take spell/.test(i.message))).toBe(true)
    const neu = hero('witchwarper', 'witchwarper.neutronic')
    expect(neu.choices.domainCardIds.some((id) => card(id).domain === 'splendor')).toBe(true)
    neu.choices.domainCardIds = ['blighting-strike', 'umbral-veil', 'rain-of-blades']
    expect(validateCreation(neu, sh).some((i) => /Splendor/.test(i.message))).toBe(true)
    // Level up: the extra domain stays open, ability cards stay closed.
    const st = progressOf(hero('witchwarper', 'witchwarper.neutronic'), reg)
    expect(domainCardProblem(st, 2, cls('witchwarper'), reg, 'mending-touch', 2)).toBeNull()
    expect(domainCardProblem(st, 2, cls('witchwarper'), reg, 'reassurance', 2)).toMatch(/spell/)
  })

  it('word swaps on domain cards: Operative Spell/Magic -> Tech, Technomancer Codex Book -> Program, Soldier Dread Spellcast -> Strength', () => {
    expect(swapWords('Spells and spell, Spellcast Roll, magical', [{ from: 'spell', to: 'Tech' }])).toBe('Techs and Tech, Spellcast Roll, magical')
    const rune = classCard(card('rune-ward'), cls('operative'))
    expect(rune.rules).toContain('protective Tech')
    expect(rune.typeLabel).toBe('tech')
    const ava = classCard(card('book-of-ava'), cls('technomancer'))
    expect(ava.name).toBe('Program of Ava')
    expect(ava.typeLabel).toBe('program')
    expect(classCard(card('rune-ward'), cls('technomancer'))).toBe(card('rune-ward'))
    const strike = classCard(card('blighting-strike'), cls('soldier'))
    expect(strike.short ?? strike.rules).toMatch(/Strength Roll/)
    expect(strike.typeLabel).toBe('ability')
    expect(classCard(card('book-of-ava'), cls('wizard'))).toBe(card('book-of-ava'))
  })

  it('the printed card uses the swapped name and type', async () => {
    const ch = hero('technomancer')
    ch.choices.domainCardIds = ['book-of-ava', 'gifted-tracker']
    expect(validateCreation(ch, sh)).toEqual([])
    const text = (await withRecording(async () => renderSheet(ch, sh, fonts))).filter((m) => m.kind === 'text').map((m) => m.text).join(' ')
    expect(text).toContain('Program of Ava')
    expect(text).not.toContain('Book of Ava')
  }, 30_000)

  it('trackers: VP and Serum Tokens = Spellcast + Tier, Sidekick armor 4 + Tier, Envoy Tokens 6', () => {
    // Test traits: Presence +1, Knowledge +2; level 1 = Tier 1.
    const count = (classId: string, label: RegExp, sub?: string) => sheetView(hero(classId, sub), sh).resourceTrackers.find((t) => label.test(t.label))?.count
    expect(count('mystic', /^VP/, 'mystic.bondsmage')).toBe(1 + 1)
    expect(count('biohacker', /^Serum/)).toBe(2 + 1)
    expect(count('mechanic', /^Sidekick/)).toBe(4 + 1)
    expect(count('envoy', /^Envoy Tokens/)).toBe(6)
  })

  it('level-up history names cards as the class prints them (Technomancer: Program of Ava)', () => {
    const st = progressOf(hero('technomancer'), reg)
    const rec = { level: 2, advancements: [{ option: 'domain-card', fromTier: 2, cardId: 'book-of-ava' }], newCardId: 'book-of-ava', swap: { out: 'book-of-ava', in: 'book-of-ava' } } as any
    const lines = describeRecord(rec, st, reg, cls('technomancer')).join(' | ')
    expect(lines).toContain('Program of Ava')
    expect(lines).not.toContain('Book of Ava')
  })

  it('a later tracker with the same id replaces the earlier one (Tinker held objects 4 -> 6)', () => {
    const ch = hero('technomancer', 'technomancer.tinker')
    const view = sheetView(ch, sh)
    expect(view.resourceTrackers.filter((t) => /Held objects/.test(t.label)).map((t) => t.count)).toEqual([4])
  })
})
