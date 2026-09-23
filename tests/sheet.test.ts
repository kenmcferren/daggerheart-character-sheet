import { describe, it, expect } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { buildCreation, type CreationSetup } from '../src/engine/creation'
import { newCharacter, creationOf, type Character } from '../src/engine/character'
import { withRecording, outside } from './lib/record'
import { renderSheet, damageText, type SheetFonts } from '../src/pdf/sheet'

const packs = [JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))]
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = { body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'), italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'), heading: font('cinzel-latin-700-normal.woff') }

function character(setup: CreationSetup, classId: string, tweak: (c: Character) => void = () => {}): Character {
  const reg: any = setup.registry
  const ch = newCharacter('t1', '2026-01-01T00:00:00.000Z')
  const cls = reg.classes.get(classId)
  const eq = [...reg.equipment.values()] as any[]
  ch.name = 'Test Hero'
  ch.choices.classId = classId
  ch.choices.subclassId = cls.subclasses[0]
  ch.choices.ancestryId = 'human'
  ch.choices.communityId = 'wanderborne'
  ch.traits = { agility: 0, strength: 0, finesse: 1, instinct: -1, presence: 1, knowledge: 2 }
  ch.choices.equipmentIds = [
    eq.find((e) => e.weaponSlot === 'primary' && e.tier === 1).id,
    eq.find((e) => e.category === 'armor' && e.tier === 1).id,
  ]
  ch.choices.domainCardIds = [...reg.domainCards.values()].filter((c: any) => c.level === 1 && cls.domains.includes(c.domain)).slice(0, 2).map((c: any) => c.id)
  ch.creation = { ...creationOf(ch), potion: 'health', classItem: 'A book', experiences: ['Sailor', 'Liar'] }
  tweak(ch)
  return ch
}

async function render(ch: Character, setup: CreationSetup, name: string) {
  const bytes = await renderSheet(ch, setup, fonts)
  mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
  writeFileSync(`TestArtifacts/sheet-samples/${name}.pdf`, bytes)
  return PDFDocument.load(bytes)
}

describe('[s4] sheet renderer', () => {
  it('puts Proficiency dice in front of weapon damage only when above 1', () => {
    expect(damageText('d8+3', 1)).toBe('d8+3')
    expect(damageText('d8+3', 2)).toBe('2d8+3')
    expect(damageText('d6+0', 3)).toBe('3d6')
    expect(damageText('d12', 2)).toBe('2d12')
    expect(damageText('something odd', 2)).toBe('something odd')
  })
  const plain = buildCreation(packs)
  it('renders front, back and a separate domain-card sheet for a level 1 wizard', async () => {
    const doc = await render(character(plain, 'wizard'), plain, 'wizard')
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(3)
    expect(doc.getPage(0).getSize()).toEqual({ width: 612, height: 792 })
  })
  it('renders every class without error', { timeout: 60000 }, async () => {
    for (const id of (plain.registry.classes as Map<string, unknown>).keys()) {
      const doc = await render(character(plain, id), plain, `class-${id}`)
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(3)
    }
  })
  it('renders an empty character', async () => {
    const doc = await render(newCharacter('x'), plain, 'empty')
    expect(doc.getPageCount()).toBe(3)
  })
  it('adds overflow pages for very long notes', async () => {
    const ch = character(plain, 'bard', (c) => { c.notes = Array(120).fill('A long line of notes that keeps going and going across the page.').join('\n') })
    const doc = await render(ch, plain, 'long-notes')
    expect(doc.getPageCount()).toBeGreaterThan(3)
  })
  it('renders supplements with trackers and back-sheet rules', async () => {
    const setup = buildCreation(packs, { supplements: ['witherwild', 'tech', 'grimdark'] })
    const doc = await render(character(setup, 'ranger'), setup, 'supplements')
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(3)
  })
})

describe('[s4] sheet details', () => {
  const plain = buildCreation(packs)
  it('renders grimoire and once-per-rest cards', async () => {
    const ch = character(plain, 'wizard', (c) => { c.choices.domainCardIds = ['book-of-illiat', 'book-of-vagras', 'premonition', 'rune-ward'].filter((id) => (plain.registry.domainCards as Map<string, unknown>).has(id)) })
    const doc = await render(ch, plain, 'grimoire')
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(3)
  })
  it('renders the Tech credit box in place of gold circles', async () => {
    const setup = buildCreation(packs, { supplements: ['tech'] })
    const doc = await render(character(setup, 'wizard'), setup, 'tech')
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(3)
  })
})

describe('[s7] campaign rule tables', () => {
  it('renders condensed campaign rules with zebra tables (Tech + Floating Magic School; Feasts + Witherwild + Fairy Tale + Grimdark)', async () => {
    const a = buildCreation(packs, { supplements: ['tech', 'floating-magic-school'] })
    expect((await render(character(a, 'wizard'), a, 'campaign-tables-tech')).getPageCount()).toBeGreaterThanOrEqual(3)
    const b = buildCreation(packs, { supplements: ['feasts', 'witherwild', 'fairy-tale', 'grimdark'] })
    expect((await render(character(b, 'ranger'), b, 'campaign-tables-feasts')).getPageCount()).toBeGreaterThanOrEqual(3)
  })
})

describe('[s7] zebra table words', () => {
  it('never breaks a table word into pieces (Aluminum, Capacitor, Components, Knowledge, Roll, 10)', async () => {
    const setup = buildCreation(packs, { supplements: ['tech', 'floating-magic-school'] })
    const marks = await withRecording(() => renderSheet(character(setup, 'wizard'), setup, fonts))
    const drawn = marks.filter((m) => m.kind === 'text').map((m) => (m.text ?? '').trim())
    expect(marks.filter(outside).map((m) => m.text ?? m.kind), 'marks outside the margins').toEqual([])
    for (const w of ['Aluminum', 'Platinum', 'Capacitor', 'Components', 'Knowledge', 'Instinct', 'Roll', '10']) expect(drawn, w).toContain(w)
  })
})

describe('[s7] substituted card numbers', () => {
  it('substitute() puts the character value in, or the SRD wording when it has none', async () => {
    const { substitute } = await import('../src/pdf/sheet')
    const t = 'place {{spellcast|# tokens|tokens equal to your Spellcast trait}} now'
    expect(substitute(t, { spellcast: 3 })).toBe('place \u00a73\u00a7 tokens now')
    expect(substitute(t, {})).toBe('place tokens equal to your Spellcast trait now')
  })
  it('Arcana cards print the numbers in bold blue', async () => {
    const setup = buildCreation(packs)
    const ch = character(setup, 'sorcerer', (c) => { c.choices.domainCardIds = ['unleash-chaos', 'flight', 'telekinesis', 'rune-ward']; c.traits = { agility: 2, strength: 0, finesse: 1, instinct: 1, presence: 0, knowledge: -1 } })
    await render(ch, setup, 'arcana-substituted')
    const marks = await withRecording(() => renderSheet(ch, setup, fonts))
    const blue = marks.filter((m) => m.kind === 'text' && m.colors.some((c: any) => c && c.blue === 0.75 && c.red === 0.1)).map((m) => (m.text ?? '').trim())
    expect(blue.length, JSON.stringify(blue)).toBeGreaterThanOrEqual(3)
    expect(blue.every((t) => /\d/.test(t)), JSON.stringify(blue)).toBe(true)
  })
})

describe('[s7] domain card tables', () => {
  it('renders cards with tables (Teleport, Forager, Tempest, Bare Bones) inside the margins', async () => {
    const setup = buildCreation(packs)
    const ch = character(setup, 'wizard', (c) => { c.choices.domainCardIds = ['teleport', 'forager', 'tempest', 'bare-bones', 'rage-up', 'cruel-precision', 'sigil-of-retribution', 'inspirational-words'] })
    const bytes = await renderSheet(ch, setup, fonts)
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    writeFileSync('TestArtifacts/sheet-samples/domain-card-tables.pdf', bytes)
    const marks = await withRecording(() => renderSheet(ch, setup, fonts))
    expect(marks.filter(outside).map((m) => m.text ?? m.kind)).toEqual([])
  })
})
