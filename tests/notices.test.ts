import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { renderSheet, lastLayout, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { level1 } from './lib/levelup-paths'
import { ARMS, SF_ARMS } from './lib/packs'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const PACKS = [pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS, SF_ARMS]
const plain = buildCreation(PACKS)
const sf = buildCreation(PACKS, { supplements: ['starfinder-ancestries'] })
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}
const texts = (marks: { kind: string; text?: string }[]) => marks.filter((m) => m.kind === 'text').map((m) => m.text ?? '')

describe('[evergreen] Licence notices print once, on the back of the domain card sheet', () => {
  it('Daggerheart notice appears once, on the page after the first domain card page; no Paizo notice without Starfinder', async () => {
    const marks = await withRecording(() => renderSheet(level1('wizard'), plain, fonts))
    const t = texts(marks)
    expect(t.filter((x) => x === 'Notices')).toHaveLength(1)
    expect(t.some((x) => x.includes('Critical Role'))).toBe(true)
    expect(t.some((x) => x.includes('Paizo'))).toBe(false)
    expect(lastLayout.noticePage).toBe(lastLayout.frontPages + lastLayout.blankPages + 1)
    expect(marks.filter(outside)).toEqual([])
  }, 60_000)

  it('Starfinder option adds the Paizo disclaimer to the same page', async () => {
    const marks = await withRecording(() => renderSheet(level1('wizard'), sf, fonts))
    const t = texts(marks)
    expect(t.filter((x) => x === 'Notices')).toHaveLength(1)
    expect(t.some((x) => x.includes('Paizo'))).toBe(true)
    expect(t.some((x) => x.includes('Critical Role'))).toBe(true)
    expect(marks.filter(outside)).toEqual([])
  }, 60_000)
})
