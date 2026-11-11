import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadPacks } from '../src/engine/packs'
import { ARMS, SF_ARMS } from './lib/packs'
import {
  newShip, shipRulesFrom, shipProblems, shipStats, validateShip, ShipError, takeAdvancement, addToVault, swapLoadoutVault, changeFrame,
  vaultCapacity, compartmentsOf, boxesChecked, optionBoxes, nextThresholdOption, advancementOption, type Ship, type AdvancementTake,
} from '../src/engine/ship'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const SF = pack('starfinder')
const PACKS = [pack('srd-core'), pack('srd-frames'), SF, ...ARMS, SF_ARMS]
const RULES = shipRulesFrom(loadPacks(PACKS))!

/** Same legal ship as the Series 14 tests: Interceptor, Standard frame, Flesh + Energy, 2/2/1/1 cards. */
function legalShip(): Ship {
  const s = newShip('ship-1', 'flier', RULES, '2026-11-09T00:00:00.000Z')
  s.name = 'Kestrel'
  s.choices = {
    configurationId: 'interceptor', primaryTrait: 'agility', secondaryTrait: 'finesse', frameId: 'standard', domainIds: ['flesh', 'energy'],
    cardIds: ['prey-drive', 'writhe', 'self-repair', 'volley-fire', 'erratic-pulse', 'innervation', 'siphon-array'],
    freeHp: { transport: 1, weapons: 1, science: 0, engineering: 0 },
  }
  return s
}

/** Takes advancements in order; fails the test if one is refused. */
function take(s: Ship, ...takes: AdvancementTake[]): Ship {
  for (const t of takes) {
    const r = takeAdvancement(RULES, s, t)
    if (!r.ok) throw new Error(r.reason)
    s = r.ship
  }
  return s
}

describe('[s16] Ship advancement data', () => {
  it('six options and eight compartments; box counts match the owner list; compartments take their boxes from the ship size', () => {
    const o = (id: string) => advancementOption(RULES, id)!
    expect(RULES.advancement!.options.map((x) => x.id)).toEqual(['hull', 'stress-or-hull', 'thresholds-major', 'thresholds-minor', 'evasion-or-hull', 'compartment'])
    expect([o('hull').boxes, o('stress-or-hull').boxes, o('thresholds-major').boxes, o('thresholds-minor').boxes, o('evasion-or-hull').boxes]).toEqual([2, 2, 4, 3, 1])
    expect(optionBoxes({ ...legalShip(), size: 2 }, o('compartment'))).toBe(2)
    expect(optionBoxes({ ...legalShip(), size: 3 }, o('compartment'))).toBe(3)
    expect(RULES.advancement!.compartments.map((c) => c.id)).toEqual(['personal-armory', 'stim-lab', 'stasis-chamber', 'meditation-room', 'suit-locker', 'war-room', 'gym', 'library'])
  })
  it('the Stim Lab rolls on a Stims list that has 30 entries; the Suit Locker holds 2 suits of 12 slots', () => {
    const items = JSON.parse(readFileSync('scripts/srd-convert/starfinder/consumables.json', 'utf8')).items as { type: string }[]
    const lab = RULES.advancement!.compartments.find((c) => c.id === 'stim-lab')!
    expect(items.filter((i) => i.type === lab.rollsOn)).toHaveLength(30)
    expect(RULES.advancement!.compartments.find((c) => c.id === 'suit-locker')!.spareSuits).toEqual({ count: 2, slots: 12 })
  })
})

describe('[s16] Ship advancement engine', () => {
  it('a ship saved before Series 16 (no advancement) has no vault room and unchanged stats', () => {
    const s = legalShip()
    expect(s.advancement).toBeUndefined()
    expect(vaultCapacity(RULES, s)).toBe(0)
    expect(shipProblems(RULES, s)).toEqual([])
    expect(shipStats(RULES, s)).toMatchObject({ totalHp: 13, stress: 9, evasion: 13, thresholds: [9, 20] })
  })
  it('vault capacity is half the checked boxes, rounded down (the loadout is always 7 cards)', () => {
    let s = legalShip()
    s = take(s, { optionId: 'evasion-or-hull', gain: 0 })
    expect(vaultCapacity(RULES, s)).toBe(0)
    s = take(s, { optionId: 'hull', system: 'science' })
    expect(vaultCapacity(RULES, s)).toBe(1)
    s = take(s, { optionId: 'hull', system: 'science' })
    expect(vaultCapacity(RULES, s)).toBe(1)
    s = take(s, { optionId: 'stress-or-hull', gain: 0 })
    expect(vaultCapacity(RULES, s)).toBe(2)
  })
  it('gains: Hull Point goes to the chosen system, Stress slot, Evasion, thresholds stack on the frame', () => {
    const s = take(legalShip(),
      { optionId: 'hull', system: 'engineering' },
      { optionId: 'stress-or-hull', gain: 0 },
      { optionId: 'stress-or-hull', gain: 1, system: 'transport' },
      { optionId: 'evasion-or-hull', gain: 0 },
      { optionId: 'thresholds-major' },
      { optionId: 'thresholds-minor' })
    expect(shipProblems(RULES, s)).toEqual([])
    expect(shipStats(RULES, s)).toMatchObject({ hp: { transport: 6, weapons: 4, science: 2, engineering: 3 }, stress: 10, evasion: 14, thresholds: [11, 23] })
  })
  it('threshold gains take turns: +1/+2 first, then +1/+1, and no more than the boxes allow', () => {
    let s = legalShip()
    expect(nextThresholdOption(RULES, s)).toBe('thresholds-major')
    expect(takeAdvancement(RULES, s, { optionId: 'thresholds-minor' })).toMatchObject({ ok: false })
    s = take(s, { optionId: 'thresholds-major' })
    expect(nextThresholdOption(RULES, s)).toBe('thresholds-minor')
    expect(takeAdvancement(RULES, s, { optionId: 'thresholds-major' })).toMatchObject({ ok: false })
    s = take(s, { optionId: 'thresholds-minor' }, { optionId: 'thresholds-major' }, { optionId: 'thresholds-minor' }, { optionId: 'thresholds-major' }, { optionId: 'thresholds-minor' }, { optionId: 'thresholds-major' })
    expect(boxesChecked(s, 'thresholds-major')).toBe(4)
    expect(boxesChecked(s, 'thresholds-minor')).toBe(3)
    expect(nextThresholdOption(RULES, s)).toBe('thresholds-minor')
    expect(takeAdvancement(RULES, s, { optionId: 'thresholds-minor' })).toMatchObject({ ok: false })
    expect(shipStats(RULES, s).thresholds).toEqual([9 + 4 + 3, 20 + 8 + 3])
  })
  it('an option refuses more takes than it has boxes; Hull Point needs a system; unknown options are refused', () => {
    let s = take(legalShip(), { optionId: 'evasion-or-hull', gain: 0 })
    expect(takeAdvancement(RULES, s, { optionId: 'evasion-or-hull', gain: 0 })).toMatchObject({ ok: false })
    expect(takeAdvancement(RULES, s, { optionId: 'hull' })).toMatchObject({ ok: false })
    expect(takeAdvancement(RULES, s, { optionId: 'nope' })).toMatchObject({ ok: false })
    s = take(s, { optionId: 'hull', system: 'weapons' }, { optionId: 'hull', system: 'weapons' })
    expect(takeAdvancement(RULES, s, { optionId: 'hull', system: 'weapons' })).toMatchObject({ ok: false })
  })
  it('compartments: a solo flier has 2 boxes, a catamaran 3; each compartment once; full text kept', () => {
    let s = take(legalShip(), { optionId: 'compartment', compartmentId: 'gym' }, { optionId: 'compartment', compartmentId: 'library' })
    expect(compartmentsOf(RULES, s).map((c) => c.name)).toEqual(['Gym', 'Library'])
    expect(takeAdvancement(RULES, s, { optionId: 'compartment', compartmentId: 'war-room' })).toMatchObject({ ok: false })
    const cat = { ...legalShip(), size: 3 }
    s = take(cat, { optionId: 'compartment', compartmentId: 'gym' })
    expect(takeAdvancement(RULES, s, { optionId: 'compartment', compartmentId: 'gym' })).toMatchObject({ ok: false })
    s = take(s, { optionId: 'compartment', compartmentId: 'war-room' }, { optionId: 'compartment', compartmentId: 'stim-lab' })
    expect(compartmentsOf(RULES, s)).toHaveLength(3)
    expect(takeAdvancement(RULES, s, { optionId: 'compartment', compartmentId: 'library' })).toMatchObject({ ok: false })
    expect(compartmentsOf(RULES, s)[1].rules).toContain('always gain 2 Hope')
  })
  it('vault: new cards go in until it is full; While Available effects count while vaulted; domains must match', () => {
    // 4 boxes checked = 2 vault slots. The Hull Point choices keep Stress at 9 before the vaulted card.
    let s = take(legalShip(), { optionId: 'evasion-or-hull', gain: 0 }, { optionId: 'hull', system: 'science' }, { optionId: 'hull', system: 'science' }, { optionId: 'stress-or-hull', gain: 1, system: 'science' })
    expect(vaultCapacity(RULES, s)).toBe(2)
    expect(addToVault(RULES, legalShip(), 'nope')).toMatchObject({ ok: false })
    expect(addToVault(RULES, legalShip(), RULES.cards.find((c) => legalShip().choices.domainIds.includes(c.domain) && !legalShip().choices.cardIds.includes(c.id))!.id)).toMatchObject({ ok: false, reason: 'The vault is full.' })
    // Flesh Transport card with a While Available Stress slot (Prey Drive) is in the loadout already; pick vault cards that are not.
    const spare = RULES.cards.filter((c) => s.choices.domainIds.includes(c.domain) && !s.choices.cardIds.includes(c.id))
    const stressCard = spare.find((c) => c.grants?.stress)!
    const r = addToVault(RULES, s, stressCard.id)
    expect(r.ok).toBe(true)
    if (r.ok) s = r.ship
    expect(shipStats(RULES, s).stress).toBe(10)
    expect(addToVault(RULES, s, stressCard.id)).toMatchObject({ ok: false })
    expect(addToVault(RULES, s, RULES.cards.find((c) => !s.choices.domainIds.includes(c.domain))!.id)).toMatchObject({ ok: false })
    const second = addToVault(RULES, s, spare.find((x) => x.id !== stressCard.id)!.id)
    expect(second.ok).toBe(true)
    if (second.ok) s = second.ship
    expect(s.advancement!.vaultCardIds).toHaveLength(2)
    const next = () => spare.find((x) => !s.advancement!.vaultCardIds.includes(x.id))!.id
    expect(addToVault(RULES, s, next())).toMatchObject({ ok: false, reason: 'The vault is full.' })
    s = take(s, { optionId: 'stress-or-hull', gain: 1, system: 'science' }, { optionId: 'compartment', compartmentId: 'gym' })
    expect(addToVault(RULES, s, next()).ok).toBe(true)
  })
  it('refit swap trades a loadout card with a vaulted one; the frame can change and advancements stack on it', () => {
    let s = take(legalShip(), { optionId: 'evasion-or-hull', gain: 1, system: 'science' }, { optionId: 'compartment', compartmentId: 'gym' })
    const spare = RULES.cards.find((c) => c.domain === 'flesh' && c.system === 'transport' && !s.choices.cardIds.includes(c.id))!
    const r = addToVault(RULES, s, spare.id)
    if (!r.ok) throw new Error(r.reason)
    s = swapLoadoutVault(r.ship, 'prey-drive', spare.id)
    expect(s.choices.cardIds).toContain(spare.id)
    expect(s.choices.cardIds).not.toContain('prey-drive')
    expect(s.advancement!.vaultCardIds).toEqual(['prey-drive'])
    expect(swapLoadoutVault(s, 'nope', 'prey-drive')).toBe(s)
    s = take(changeFrame(s, 'standard'), { optionId: 'thresholds-major' })
    s.choices.freeHp = { transport: 0, weapons: 0, science: 0, engineering: 0 }
    s = changeFrame(s, 'plated')
    s.choices.freeHp = { transport: 2, weapons: 1, science: 0, engineering: 0 }
    expect(shipStats(RULES, s)).toMatchObject({ evasion: 11, thresholds: [12, 26] })
    expect(s.choices.domainIds).toEqual(['flesh', 'energy'])
  })
  it('problems: vault over capacity, off-domain or doubled vault cards, unknown advancement, too many boxes', () => {
    const s = legalShip()
    const spare = RULES.cards.filter((c) => s.choices.domainIds.includes(c.domain) && !s.choices.cardIds.includes(c.id)).slice(0, 3)
    const full = { ...s, advancement: { vaultCardIds: spare.map((c) => c.id), taken: [] } }
    expect(shipProblems(RULES, full).map((p) => p.message)).toContain('The vault holds at most 0 cards (3 stored).')
    const dup = { ...s, advancement: { vaultCardIds: ['prey-drive'], taken: [] } }
    expect(shipProblems(RULES, dup).map((p) => p.message)).toContain('Prey Drive is in both the loadout and the vault.')
    const off = { ...s, advancement: { vaultCardIds: [RULES.cards.find((c) => !s.choices.domainIds.includes(c.domain))!.id], taken: [] } }
    expect(shipProblems(RULES, off).some((p) => p.message.includes('is not from your domains'))).toBe(true)
    const bad = { ...s, advancement: { vaultCardIds: [], taken: [{ optionId: 'nope' }, { optionId: 'evasion-or-hull', gain: 0 }, { optionId: 'evasion-or-hull', gain: 0 }] } }
    const msgs = shipProblems(RULES, bad).map((p) => p.message)
    expect(msgs).toContain('Unknown advancement "nope".')
    expect(msgs).toContain('Gain +1 Evasion or a Hull Point: more boxes checked than it has.')
  })
  it('the save shape check accepts advancement and rejects a malformed one', () => {
    const s = take(legalShip(), { optionId: 'hull', system: 'weapons' })
    expect(validateShip(JSON.parse(JSON.stringify(s)))).toEqual(s)
    expect(() => validateShip({ ...s, advancement: { vaultCardIds: 'x', taken: [] } })).toThrow(ShipError)
    expect(() => validateShip({ ...s, advancement: { vaultCardIds: [], taken: [{ optionId: 'hull', system: 'bridge' }] } })).toThrow(ShipError)
  })
})

import { mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import type { SheetFonts } from '../src/pdf/sheet'
import { renderShipSheet, hasRefitPage } from '../src/pdf/shipPage'
import { withRecording, outside } from './lib/record'

const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const FONTS: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'), display: font('audiowide-latin-400-normal.woff'),
}
const PILOT = { name: 'Vesk', traits: { agility: 2, strength: 0, finesse: -1, instinct: 1, presence: 0, knowledge: 1 }, proficiency: 2 }
const pageCount = async (b: Uint8Array) => (await PDFDocument.load(b)).getPageCount()

describe('[s16] Ship refit page', () => {
  it('a ship with no advancements and no vault prints only its two pages, as before', async () => {
    const ship = legalShip()
    expect(hasRefitPage(ship)).toBe(false)
    expect(await pageCount(await renderShipSheet(ship, RULES, FONTS, PILOT))).toBe(2)
  }, 60_000)
  it('an advanced ship adds a refit page: stat gains on the front, checked boxes dark, vault cards, compartments, Suit Locker spare suits as light grey boxes', async () => {
    let ship = take(legalShip(),
      { optionId: 'thresholds-major' }, { optionId: 'evasion-or-hull', gain: 0 }, { optionId: 'hull', system: 'engineering' },
      { optionId: 'compartment', compartmentId: 'suit-locker' }, { optionId: 'compartment', compartmentId: 'stim-lab' })
    const spare = RULES.cards.filter((c) => ship.choices.domainIds.includes(c.domain) && !ship.choices.cardIds.includes(c.id)).slice(0, 2)
    for (const c of spare) { const r = addToVault(RULES, ship, c.id); if (!r.ok) throw new Error(r.reason); ship = r.ship }
    expect(hasRefitPage(ship)).toBe(true)
    expect(shipProblems(RULES, ship)).toEqual([])
    let bytes!: Uint8Array
    const marks = await withRecording(async () => (bytes = await renderShipSheet(ship, RULES, FONTS, PILOT)))
    expect(await pageCount(bytes)).toBe(3)
    expect(marks.filter(outside)).toEqual([])
    const text = marks.filter((m) => m.kind === 'text').map((m) => m.text).join(' | ')
    for (const t of ['Kestrel: refit and advancement', 'Advancement', 'Gain a Hull Point', 'Add a compartment', 'Vault (2 of 2)', spare[0].name, 'Compartments', 'Locker.', 'Lab.', 'Spare suit 1', 'Spare suit 2', '(Engineering)', '+1/+2'])
      expect(text, t).toContain(t)
    const rect = (w: number) => marks.filter((m) => m.kind === 'rect' && Math.abs(m.x1 - m.x0 - w) < 0.01)
    // Advancement boxes: 2 + 2 + 4 + 3 + 1 + 2 (size 2) = 14, of which 5 are checked (dark).
    expect(rect(10.9)).toHaveLength(14)
    // Suit Locker: 2 spare suits x 12 light grey slots.
    expect(rect(11.9)).toHaveLength(24)
    mkdirSync('TestArtifacts/ship-samples', { recursive: true })
    writeFileSync('TestArtifacts/ship-samples/kestrel-refit.pdf', bytes)
  }, 60_000)
  it('a full vault (7 cards) and three compartments still print inside the margins', async () => {
    let ship = { ...legalShip(), size: 3 }
    ship = take(ship, ...(['suit-locker', 'war-room', 'stim-lab'] as const).map((compartmentId) => ({ optionId: 'compartment', compartmentId })),
      { optionId: 'hull', system: 'weapons' }, { optionId: 'hull', system: 'weapons' }, { optionId: 'stress-or-hull', gain: 0 }, { optionId: 'stress-or-hull', gain: 0 }, { optionId: 'evasion-or-hull', gain: 0 },
      { optionId: 'thresholds-major' }, { optionId: 'thresholds-minor' }, { optionId: 'thresholds-major' }, { optionId: 'thresholds-minor' }, { optionId: 'thresholds-major' }, { optionId: 'thresholds-minor' }, { optionId: 'thresholds-major' })
    expect(vaultCapacity(RULES, ship)).toBe(7)
    const spare = RULES.cards.filter((c) => ship.choices.domainIds.includes(c.domain) && !ship.choices.cardIds.includes(c.id)).sort((a, b) => b.rules.length - a.rules.length).slice(0, 7)
    for (const c of spare) { const r = addToVault(RULES, ship, c.id); if (!r.ok) throw new Error(r.reason); ship = r.ship }
    const marks = await withRecording(async () => { await renderShipSheet(ship, RULES, FONTS, PILOT) })
    expect(marks.filter(outside)).toEqual([])
  }, 60_000)
})
