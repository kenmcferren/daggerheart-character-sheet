import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PDFPage } from 'pdf-lib'
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

// US Letter with 0.5" margins; printers commonly lose about 0.25" at the edge, so 0.5" is safe.
const PW = 612, PH = 792, M = 36, TOL = 1
interface Mark { kind: string; x0: number; y0: number; x1: number; y1: number; colors: any[]; text?: string }

/** Records every draw call so tests can check geometry and colour without rasterizing. */
async function withRecording(run: () => Promise<Uint8Array>) {
  const marks: Mark[] = []
  const proto = PDFPage.prototype as any
  const orig = { text: proto.drawText, line: proto.drawLine, rect: proto.drawRectangle, circle: proto.drawCircle }
  proto.drawText = function (text: string, o: any) {
    const w = o.font.widthOfTextAtSize(text, o.size)
    marks.push({ kind: 'text', x0: o.x, y0: o.y, x1: o.x + w, y1: o.y + o.size * 0.75, colors: [o.color], text })
    return orig.text.call(this, text, o)
  }
  proto.drawLine = function (o: any) {
    const t = (o.thickness ?? 1) / 2
    marks.push({ kind: 'line', x0: Math.min(o.start.x, o.end.x) - t, y0: Math.min(o.start.y, o.end.y) - t, x1: Math.max(o.start.x, o.end.x) + t, y1: Math.max(o.start.y, o.end.y) + t, colors: [o.color] })
    return orig.line.call(this, o)
  }
  proto.drawRectangle = function (o: any) {
    const b = (o.borderWidth ?? 0) / 2
    marks.push({ kind: 'rect', x0: o.x - b, y0: o.y - b, x1: o.x + o.width + b, y1: o.y + o.height + b, colors: [o.color, o.borderColor] })
    return orig.rect.call(this, o)
  }
  proto.drawCircle = function (o: any) {
    const b = (o.borderWidth ?? 0) / 2
    marks.push({ kind: 'circle', x0: o.x - o.size - b, y0: o.y - o.size - b, x1: o.x + o.size + b, y1: o.y + o.size + b, colors: [o.color, o.borderColor] })
    return orig.circle.call(this, o)
  }
  try { await run() } finally { proto.drawText = orig.text; proto.drawLine = orig.line; proto.drawRectangle = orig.rect; proto.drawCircle = orig.circle }
  return marks
}

const outside = (m: Mark) =>
  m.x0 < M - TOL || m.x1 > PW - M + TOL || m.y0 < M - TOL || m.y1 > PH - M + TOL

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
