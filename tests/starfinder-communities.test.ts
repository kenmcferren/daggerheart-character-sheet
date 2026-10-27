import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { communityList, validateCreation } from '../src/engine/rules'
import { sheetView } from '../src/engine/sheetView'
import { validatePack } from '../src/engine/packs'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { withRecording, outside } from './lib/record'
import { equipped } from './lib/levelup-paths'
import { ARMS, SF_ARMS } from './lib/packs'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const PACKS = [pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS, SF_ARMS]
const plain = buildCreation(PACKS)
const sf = buildCreation(PACKS, { supplements: ['starfinder-communities'] })
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}
const withCommunity = (id: string) => { const ch = equipped('wizard'); ch.choices.communityId = id; return ch }

describe('[s10] Starfinder communities option', () => {
  it('the pack validates against the schema', () => {
    expect(() => validatePack(pack('starfinder'))).not.toThrow()
  })

  it('off: the standard community list is unchanged and Starfinder communities are refused', () => {
    const names = communityList(plain).map((c) => c.name)
    expect(names).toContain('Wildborne')
    expect(names).not.toContain('Hubborne')
    expect(validateCreation(withCommunity('sf-hubborne'), plain).some((i) => i.step === 'community' && /not available/.test(i.message))).toBe(true)
  })

  it('on: the 15 Starfinder communities come first in the owner order, then the standard ones alphabetically', () => {
    const names = communityList(sf).map((c) => c.name)
    expect(names.slice(0, 15)).toEqual(['Hubborne', 'Spikeborn', 'Scrapborn', 'Townbound', 'Asanan', 'Wardenborn', 'Hivebound', 'Ringborn', 'Fringeborn', 'Legionborn', 'Cloudborn', 'Moonbound', 'Roselit', 'Domeborn', 'Beltborn'])
    const rest = names.slice(15)
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)))
    expect(rest.length).toBe(communityList(plain).length)
    expect(validateCreation(withCommunity('sf-hubborne'), sf).some((i) => i.step === 'community')).toBe(false)
  })

  it('every Starfinder community has a description and one feature with rules and short wording', () => {
    for (const c of communityList(sf).slice(0, 15)) {
      expect(c.description, c.id).toBeTruthy()
      expect(c.features, c.id).toHaveLength(1)
      expect(c.features[0].rules && c.features[0].short, c.id).toBeTruthy()
      expect(c.features[0].short.length, c.id).toBeLessThanOrEqual(c.features[0].rules.length)
    }
  })

  it('Wildsense is a situational Evasion footnote, not baked in', () => {
    const base = sheetView(withCommunity('wildborne'), sf).stats.evasion
    const v = sheetView(withCommunity('sf-wardenborn'), sf)
    expect(v.stats.evasion).toBe(base)
    expect(v.statNotes.some((n) => n.name === 'Wildsense' && n.kind === 'situational' && n.stats.includes('evasion'))).toBe(true)
  })

  it('Self Contained prints a Rose token tracker equal to the character level', () => {
    const v = sheetView(withCommunity('sf-roselit'), sf)
    expect(v.resourceTrackers).toContainEqual({ label: 'Rose tokens (max level)', count: v.progress.level })
    expect(sheetView(withCommunity('sf-hubborne'), sf).resourceTrackers.some((t) => /Rose/.test(t.label))).toBe(false)
  })

  it('every Starfinder community renders inside the margins with its feature text', async () => {
    for (const c of communityList(sf).slice(0, 15)) {
      const marks = await withRecording(async () => renderSheet(withCommunity(c.id), sf, fonts))
      expect(marks.filter(outside), c.id).toHaveLength(0)
      expect(marks.filter((m) => m.kind === 'text').map((m) => m.text).join(' '), c.id).toContain(c.features[0].name)
    }
  }, 120_000)

  it('Scrapborn prints a Junk Count box on the inventory row, clear of the title and the gold shapes (also with Tech credits)', async () => {
    const tech = buildCreation(PACKS, { supplements: ['starfinder-communities', 'tech'] })
    for (const setup of [sf, tech]) {
      const ch = withCommunity('sf-scrapborn')
      expect(sheetView(ch, setup).countBoxes).toEqual(['Junk Count'])
      const marks = await withRecording(async () => renderSheet(ch, setup, fonts))
      expect(marks.filter(outside)).toHaveLength(0)
      const texts = marks.filter((m) => m.kind === 'text')
      const title = texts.find((m) => m.text === 'Inventory / Notes')!, junk = texts.find((m) => m.text === 'Junk Count')!
      expect(junk.x0).toBeGreaterThan(title.x1 + 4)
      const hand = texts.find((m) => m.text === 'Handfuls' || m.text === 'Credits')!
      expect(junk.x1 + 50).toBeLessThan(hand.x0)
    }
    expect(sheetView(withCommunity('sf-hubborne'), sf).countBoxes).toEqual([])
  }, 60_000)

  it('the Starfinder supplements belong to the Starheart group, and no other supplement does', () => {
    const frames = [...plain.registry.campaignFrames.values()] as any[]
    expect(frames.filter((f) => f.group === 'Starheart - Starfinder Conversion').map((f) => f.id).sort()).toEqual(['starfinder-ancestries', 'starfinder-armaments', 'starfinder-classes', 'starfinder-communities', 'starfinder-consumables'])
    expect(frames.filter((f) => f.group && f.group !== 'Starheart - Starfinder Conversion')).toHaveLength(0)
  })
})
