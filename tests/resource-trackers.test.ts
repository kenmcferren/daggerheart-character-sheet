import { describe, it, expect } from 'vitest'
import { sheetView } from '../src/engine/sheetView'
import { buildCreation } from '../src/engine/creation'
import type { Character } from '../src/engine/character'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { level1, equipped, reg } from './lib/levelup-paths'

const setup = buildCreation([JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))])
const withSub = (classId: string, subclassId: string): Character => { const c = level1(classId); return { ...c, choices: { ...c.choices, subclassId } } }
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = { body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'), italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'), heading: font('cinzel-latin-700-normal.woff') }
const rows = (ch: Character) => sheetView(ch, setup).resourceTrackers

describe('[s5] resource trackers (tokens and counters with an upper limit)', () => {
  it('Warlock tracks Favor (max 6)', () => {
    expect(rows(level1('warlock'))).toEqual([{ label: 'Favor (max 6)', count: 6 }])
  })

  it('Assassin tracks Toxic Concoction tokens only with the Poisoners Guild', () => {
    expect(rows(withSub('assassin', 'assassin.poisoners-guild'))).toEqual([{ label: 'Toxic tokens (max 5)', count: 5 }])
    expect(rows(withSub('assassin', 'assassin.executioners-guild'))).toEqual([])
  })

  it('Witch counts Hex and token rows from the Spellcast trait', () => {
    const ch = withSub('witch', 'witch.hedge')
    const trait = (reg.subclasses.get('witch.hedge') as any).spellcastTrait as keyof Character['traits']
    const n = Math.max(1, ch.traits[trait] ?? 1)
    expect(rows(ch)).toEqual([{ label: 'Hexed (max Spellcast)', count: n }, { label: 'Talisman tokens (max Hope)', count: 6 }])
  })

  it('classes without a limited resource show none', () => {
    for (const id of ['bard', 'guardian', 'wizard', 'sorcerer']) expect(rows(level1(id)), id).toEqual([])
  })

  it('sample sheets render inside the margins (TestArtifacts/sheet-samples)', async () => {
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    const mk = (classId: string, subclassId: string): Character => { const c = equipped(classId); return { ...c, choices: { ...c.choices, subclassId } } }
    for (const [name, ch] of [['warlock', mk('warlock', 'warlock.pact-of-the-endless')], ['assassin-poisoners', mk('assassin', 'assassin.poisoners-guild')], ['witch-hedge', mk('witch', 'witch.hedge')]] as const) {
      let bytes = new Uint8Array()
      const marks = await withRecording(async () => { bytes = await renderSheet(ch, setup, fonts) })
      writeFileSync(`TestArtifacts/sheet-samples/resource-trackers-${name}.pdf`, bytes)
      expect(marks.filter(outside), name).toEqual([])
    }
  })

  it('once-per-rest features get a circle inline after the phrase (one per use)', async () => {
    const circlesAfter = async (ch: Character, phrase: RegExp) => {
      let bytes = new Uint8Array()
      const marks = await withRecording(async () => { bytes = await renderSheet(ch, setup, fonts); return bytes })
      expect(marks.some((m) => m.text?.includes(''))).toBe(false)
      const at = marks.filter((m) => m.kind === 'text' && phrase.test(m.text ?? ''))
      expect(at.length).toBeGreaterThan(0)
      return at.map((a) => marks.filter((m) => m.kind === 'circle' && Math.abs((m.y0 + m.y1) / 2 - (a.y0 + a.y1) / 2) < 8 && m.x0 >= a.x1 - 1).length)
    }
    expect(Math.max(...(await circlesAfter(equipped('bard'), /^session[,.:;]?$/i)))).toBeGreaterThanOrEqual(1)
    expect(Math.max(...(await circlesAfter(equipped('guardian'), /^rest[,.:;]?$/i)))).toBeGreaterThanOrEqual(1)
  })
})
