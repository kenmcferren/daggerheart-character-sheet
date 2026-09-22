import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation, type CreationSetup } from '../src/engine/creation'
import { newCharacter, creationOf, type Character } from '../src/engine/character'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'

const packs = [JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))]
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}

import { withRecording, outside } from './lib/record'

function base(setup: CreationSetup, classId: string, tweak: (c: Character) => void = () => {}): Character {
  const reg: any = setup.registry
  const ch = newCharacter('p1', '2026-01-01T00:00:00.000Z')
  const cls = reg.classes.get(classId)
  const eq = [...reg.equipment.values()] as any[]
  ch.name = 'Test Hero'
  ch.choices.classId = classId
  ch.choices.subclassId = cls.subclasses[0]
  ch.choices.ancestryId = 'human'
  ch.choices.communityId = 'wanderborne'
  ch.traits = { agility: 0, strength: 0, finesse: 1, instinct: -1, presence: 1, knowledge: 2 }
  ch.choices.equipmentIds = [eq.find((e) => e.weaponSlot === 'primary' && e.tier === 1).id, eq.find((e) => e.category === 'armor' && e.tier === 1).id]
  ch.choices.domainCardIds = [...reg.domainCards.values()].filter((c: any) => c.level === 1 && cls.domains.includes(c.domain)).slice(0, 2).map((c: any) => c.id)
  ch.creation = { ...creationOf(ch), potion: 'health', classItem: 'A book', experiences: ['Sailor', 'Liar'] }
  tweak(ch)
  return ch
}

const scenarios: { name: string; setup: () => CreationSetup; ch: (s: CreationSetup) => Character }[] = [
  { name: 'every class', setup: () => buildCreation(packs), ch: (s) => base(s, 'wizard') },
  { name: 'all supplements', setup: () => buildCreation(packs, { supplements: ['witherwild', 'tech', 'grimdark', 'feasts'] }), ch: (s) => base(s, 'ranger') },
  { name: 'oversized text', setup: () => buildCreation(packs), ch: (s) => base(s, 'bard', (c) => {
    c.name = 'Sir Bartholomew Featherstonehaugh-Cholmondeley the Third of Nowhere In Particular'
    c.creation = { ...creationOf(c), pronouns: 'they/them/theirs/themselves/and so on', classItem: 'X'.repeat(90),
      experiences: ['A very long experience name that goes on and on and on for far too long to fit', 'Another extremely long experience name that also refuses to stop', 'c', 'd', 'e', 'f', 'g'] }
    c.notes = Array(40).fill('A long line of notes that keeps going and going across the page.').join('\n') + '\n' + 'Supercalifragilisticexpialidocious'.repeat(6)
  }) },
  { name: 'many cards', setup: () => buildCreation(packs), ch: (s) => base(s, 'wizard', (c) => {
    c.choices.domainCardIds = ([...(s.registry.domainCards as Map<string, any>).values()] as any[]).filter((d) => ['codex', 'splendor'].includes(d.domain)).slice(0, 14).map((d) => d.id)
  }) },
]

describe('[s4] print checks', () => {
  for (const sc of scenarios) {
    it(`${sc.name}: everything stays inside the 0.5" margins and prints in grayscale`, { timeout: 60000 }, async () => {
      const setup = sc.setup()
      const cls = sc.name === 'every class' ? [...(setup.registry.classes as Map<string, unknown>).keys()] : [null]
      for (const id of cls) {
        const ch = id ? base(setup, id) : sc.ch(setup)
        const marks = await withRecording(() => renderSheet(ch, setup, fonts))
        const bad = marks.filter(outside).slice(0, 5).map((m) => `${m.kind} ${m.text ?? ''} x ${m.x0.toFixed(1)}..${m.x1.toFixed(1)} y ${m.y0.toFixed(1)}..${m.y1.toFixed(1)}`)
        expect(bad, `${id ?? sc.name}`).toEqual([])
        const colour = marks.flatMap((m) => m.colors).filter((c) => c && (c.red !== c.green || c.green !== c.blue))
        expect(colour, `${id ?? sc.name} colour`).toEqual([])
      }
    })
  }
})
