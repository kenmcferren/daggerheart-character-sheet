import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { validatePack, PackError, loadPacks } from '../src/engine/packs'
import { buildCreation } from '../src/engine/creation'
import { ARMS, SF_ARMS } from './lib/packs'
import { archetypeOf, newShip, shipRulesFrom, shipProblems, shipStats, systemRollLines, primarySystems, validateShip, ShipError, type Ship } from '../src/engine/ship'
import { ShipStore, CharacterStore, importSaveFile, type KeyValueStore } from '../src/engine/saves'
import { newCharacter, exportCharacter } from '../src/engine/character'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const SF = pack('starfinder')
const PACKS = [pack('srd-core'), pack('srd-frames'), SF, ...ARMS, SF_ARMS]
const shipsFrame = () => SF.content.campaignFrames.find((f: any) => f.id === 'starheart-ships')
const SYS = ['transport', 'weapons', 'science', 'engineering']

describe('[s14] Starheart ships data', () => {
  it('the Starheart Ships supplement carries 108 cards: 18 per domain, 27 per system, every domain in every system', () => {
    const s = shipsFrame().ships
    expect(shipsFrame()).toMatchObject({ name: 'Starheart Ships', frameKind: 'supplement', group: 'Starheart - Starfinder Conversion' })
    expect(s.cards).toHaveLength(108)
    for (const d of s.domains) expect(s.cards.filter((c: any) => c.domain === d.id), d.id).toHaveLength(18)
    for (const y of SYS) expect(s.cards.filter((c: any) => c.system === y), y).toHaveLength(27)
    for (const d of s.domains) for (const y of SYS) expect(s.cards.some((c: any) => c.domain === d.id && c.system === y), `${d.id} ${y}`).toBe(true)
  })
  it('creation tables match the final text: sizes, configurations (two primaries each), frames', () => {
    const s = shipsFrame().ships
    expect(s.sizes.map((z: any) => z.name)).toEqual(['Drone', 'Solo Flier', 'Catamaran', 'Cruiser', 'Dreadnought'])
    expect(s.startingSizes).toEqual({ flier: 2, hub: 3 })
    expect(s.configurations.map((c: any) => c.id)).toEqual(['interceptor', 'scout', 'sapper', 'surgeon', 'bandit', 'warden'])
    for (const c of s.configurations) expect(SYS.filter((y) => c.caps[y] === 4), c.id).toHaveLength(2)
    expect(s.frames.find((f: any) => f.id === 'standard')).toMatchObject({ freeHp: 2, stress: 7, evasion: 13, thresholds: [9, 20] })
    expect(s.build).toEqual({ domains: 2, cards: 7, primaryCap: 4, baseHp: 1, hpPerCard: 1, maxHpPerSystem: 7 })
    expect(s.tokenCaps).toEqual({ analysis: 12, power: 12 })
  })
  it('card extras: While Available grants, Reload Tokens, own tokens, once-per uses, token trackers', () => {
    const c = (id: string) => shipsFrame().ships.cards.find((x: any) => x.id === id)
    const cards = shipsFrame().ships.cards
    expect(cards.filter((x: any) => x.grants?.stress)).toHaveLength(6)
    expect(cards.filter((x: any) => x.grants?.hp)).toHaveLength(6)
    expect(c('ramming-cap').grants).toEqual({ hp: 'weapons' })
    expect(cards.filter((x: any) => x.reloadTokens).map((x: any) => `${x.id}:${x.reloadTokens}`).sort()).toEqual(['cold-steel:2', 'counterfire:2', 'gatling-autoturret:4', 'plutonium-railgun:3', 'seeking-missile:3'])
    expect(c('position-scrambler').cardTokens).toEqual({ name: 'Scrambler', max: 3 })
    expect(c('shrapnel-mine').cardTokens).toEqual({ name: 'Shrapnel Mine', max: 1 })
    expect(c('self-repair').usesPer).toBe('refuel')
    expect(c('defensive-sync').usesPer).toBe('scene')
    expect(c('veil-of-night').tokens).toEqual(['analysis'])
    expect(cards.filter((x: any) => x.tokens?.includes('power'))).toHaveLength(12)
  })
  it('card rules match Docs/starheart-ships/v-final.md word for word once marks are removed, with no Spellcast Rolls', () => {
    const md = readFileSync('Docs/starheart-ships/v-final.md', 'utf8')
    const text = new Map([...md.matchAll(/^\*\*(.+?),\*\* \*\w+, \w+ Domain\.\* (.+)$/gm)].map((m) => [m[1], m[2].replace(/\r$/, '').replaceAll('**', '').replace(/\*([^*]+)\*/g, '$1')]))
    const unmark = (s: string) => s.replaceAll('**', '').replace(/\*([^*]+)\*/g, '$1')
    for (const c of shipsFrame().ships.cards) {
      expect(unmark(c.rules), c.name).toBe(text.get(c.name))
      expect(c.rules, c.name).not.toMatch(/(?<!in place of the )Spellcast Roll/)
    }
    expect(text.size).toBe(108)
  })
  it('the schema rejects a ship card with an unknown system', () => {
    const bad = structuredClone(SF)
    bad.content.campaignFrames.find((f: any) => f.id === 'starheart-ships').ships.cards[0].system = 'shields'
    expect(() => validatePack(bad)).toThrow(PackError)
  })
  it('choosing the supplement loads cleanly beside the other Starheart options', () => {
    expect(() => loadPacks(PACKS)).not.toThrow()
    const s = buildCreation(PACKS, { supplements: ['starfinder-classes', 'starheart-ships'] })
    expect(s.conflicts).toEqual([])
  })
})

const memKv = (): KeyValueStore & { m: Map<string, unknown> } => {
  const m = new Map<string, unknown>()
  return { m, get: async (k) => m.get(k), set: async (k, v) => void m.set(k, v), del: async (k) => void m.delete(k), keys: async () => [...m.keys()] }
}
const RULES = shipRulesFrom(loadPacks(PACKS))!
/** Interceptor (Transport and Weapons primary), Agility/Finesse, Standard frame, Flesh + Energy, 2/2/1/1 cards, Free HP 2 Transport + 1 Weapons. */
function legalShip(): Ship {
  const s = newShip('ship-1', 'flier', RULES, '2026-11-07T00:00:00.000Z')
  s.name = 'Kestrel'
  s.choices = {
    configurationId: 'interceptor', primaryTrait: 'agility', secondaryTrait: 'finesse', frameId: 'standard', domainIds: ['flesh', 'energy'],
    cardIds: ['prey-drive', 'writhe', 'self-repair', 'volley-fire', 'erratic-pulse', 'innervation', 'siphon-array'],
    freeHp: { transport: 1, weapons: 1, science: 0, engineering: 0 },
  }
  return s
}

describe('[s14] Ship engine', () => {
  it('new ships: a Solo Flier is size 2, the Hub Ship size 3, both marked kind ship with the supplement on', () => {
    expect(newShip('a', 'flier', RULES)).toMatchObject({ kind: 'ship', size: 2, characterLineageId: null, sources: { supplementIds: ['starheart-ships'] } })
    expect(newShip('b', 'hub', RULES).size).toBe(3)
  })
  it('a legal ship has no problems; HP = 1 + cards + grants + Free HP per system; Stress = frame + grants; Power tracker only', () => {
    const s = legalShip()
    expect(shipProblems(RULES, s)).toEqual([])
    expect(primarySystems(RULES, s)).toEqual(['transport', 'weapons'])
    const st = shipStats(RULES, s)
    expect(st.hp).toEqual({ transport: 5, weapons: 4, science: 2, engineering: 2 })
    expect(st).toMatchObject({ sizeName: 'Solo Flier', totalHp: 13, stress: 9, evasion: 13, thresholds: [9, 20], tokenTrackers: [{ token: 'power', max: 12 }] })
  })
  it('roll lines use the linked pilot trait values: "Transport (Agility): +2"; no pilot, no value', () => {
    const lines = systemRollLines(RULES, legalShip(), { agility: 2, finesse: -1 })
    expect(lines.map((l) => l.text)).toEqual(['Transport (Agility): +2', 'Weapons (Agility): +2', 'Science (Finesse): -1', 'Engineering (Finesse): -1'])
    expect(systemRollLines(RULES, legalShip())[0]).toMatchObject({ text: 'Transport (Agility)', value: null })
  })
  it('problems: same trait twice, card caps, off-domain cards, card count, Free HP total, more than 7 HP in a system, no name', () => {
    const msgs = (f: (s: Ship) => void) => { const s = legalShip(); f(s); return shipProblems(RULES, s).map((p) => `${p.step}: ${p.message}`) }
    expect(msgs((s) => { s.choices.secondaryTrait = 'agility' })).toEqual(['traits: The Primary and Secondary Traits must be different.'])
    expect(msgs((s) => { s.choices.cardIds = ['prey-drive', 'writhe', 'slighted-spite', 'innervation', 'manual-inspection', 'siphon-array', 'volley-fire'] })).toEqual(['cards: Science can hold at most 2 cards (3 chosen).'])
    expect(msgs((s) => { s.choices.cardIds[6] = 'pulsar-mine'; s.choices.domainIds = ['flesh', 'metal'] })).toEqual(expect.arrayContaining(['cards: Volley Fire is not from your domains.']))
    expect(msgs((s) => { s.choices.cardIds.pop() })).toContain('cards: Choose 7 cards (6 chosen).')
    expect(msgs((s) => { s.choices.freeHp.science = 1 })).toEqual(['hull: Place 2 Free HP (3 placed).'])
    expect(msgs((s) => { s.choices.frameId = 'bulky'; s.choices.freeHp = { transport: 4, weapons: 0, science: 0, engineering: 0 } })).toEqual(['hull: Transport has 8 HP; the most is 7.'])
    expect(msgs((s) => { s.name = ' ' })).toEqual(['name: Name your ship.'])
  })
  it('store: ships and characters keep separate lists; link, find by character lineage, unlink when the character goes', async () => {
    const kv = memKv()
    const ships = new ShipStore(kv), chars = new CharacterStore(kv)
    await chars.save(newCharacter('c-1'))
    await ships.save(legalShip())
    expect((await chars.list()).characters.map((c) => c.id)).toEqual(['c-1'])
    expect((await ships.list()).ships.map((s) => s.id)).toEqual(['ship-1'])
    await ships.link('ship-1', 'c-1')
    expect((await ships.forCharacter('c-1')).map((s) => s.id)).toEqual(['ship-1'])
    expect(await ships.unlinkCharacter('c-1')).toBe(1)
    expect((await ships.load('ship-1'))!.characterLineageId).toBeNull()
    kv.m.set('ship:bad', { kind: 'ship', schemaVersion: 1 })
    expect((await ships.list()).corruptIds).toEqual(['bad'])
  })
  it('export files: importSaveFile tells ships from characters; a character is not a ship', () => {
    expect(importSaveFile(JSON.stringify(legalShip())).kind).toBe('ship')
    expect(importSaveFile(exportCharacter(newCharacter('c-2'))).kind).toBe('character')
    expect(() => validateShip(newCharacter('c-3'))).toThrow(ShipError)
  })
})

import { mkdirSync, writeFileSync } from 'node:fs'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { renderShipSheet, addShipPages, cardSegs } from '../src/pdf/shipPage'
import { withRecording, outside } from './lib/record'
import { PDFDocument } from 'pdf-lib'

const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const FONTS: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'), display: font('audiowide-latin-400-normal.woff'),
}
const PILOT = { name: 'Vesk', traits: { agility: 2, strength: 0, finesse: -1, instinct: 1, presence: 0, knowledge: 1 }, proficiency: 2 }
/** Bandit (Weapons and Engineering primary), Void + Energy, the longest cards: the most text a front page has to hold. */
function longShip(): Ship {
  const s = legalShip()
  s.name = 'The Long Dark'
  s.role = 'hub'; s.size = 3
  s.choices = { ...s.choices, configurationId: 'bandit', frameId: 'bulky', domainIds: ['void', 'energy'], cardIds: ['graviton-mine', 'veil-of-night', 'pulsar-mine', 'cloaking-field', 'plasma-caster', 'spacetime-chasm', 'electrified-field'], freeHp: { transport: 2, weapons: 1, science: 1, engineering: 0 } }
  return s
}
const pages = async (b: Uint8Array) => (await PDFDocument.load(b)).getPageCount()
const SAMPLES = 'TestArtifacts/ship-samples'

describe('[s14] Ship card markup', () => {
  const rules = (id: string) => shipsFrame().ships.cards.find((c: any) => c.id === id).rules
  it('keywords and costs are bold, consequences are not, card conditions are italic', () => {
    expect(rules('fire-gout')).toContain('**Mark a Hull Point**')
    expect(rules('spore-cloud')).toMatch(/^\*\*Mark a Stress\*\* to create a \*\*Cloud\*\*/)
    expect(rules('engine-sync')).toMatch(/^\*\*With Lock:\*\*/)
    expect(rules('prey-drive')).toContain('**While Available:**')
    expect(rules('volley-fire')).toContain('**spend a Power Token**')
    expect(rules('entropic-beam')).toContain('to make the target mark a Stress') // a consequence: plain
    expect(rules('warp-draw')).toContain('mark a Hull Point if they move')
    expect(rules('flechette-spines')).toContain('damage and mark a Stress')
    expect(rules('cloaking-field')).toContain('the GM can spend a Fear') // the GM's spend, not the card's cost
    expect(rules('spacetime-chasm')).toContain('**the GM gains a Fear**')
    expect(rules('engulf')).toContain('*Engulfed*')
  })
  it('sheet runs: style per word, "Pd8+4" becomes the pilot dice (bold blue) only when Proficiency is known', () => {
    const segs = cardSegs(rules('defensive-sync'))
    expect(segs.find((g) => g.t.includes("Target's"))?.f).toBe('bold')
    expect(cardSegs(rules('spearhead-charge'), 3).some((g) => g.t === '§3d8')).toBe(true)
    expect(cardSegs(rules('spearhead-charge')).some((g) => g.t.includes('Pd8'))).toBe(true)
  })
})

describe('[s14] Ship sheet PDF', () => {
  it('a ship on its own: two pages inside the margins; Evasion and thresholds stacked; Hope, system HP and Stress rows with pilot trait and value; Power tracker; notice on the back', async () => {
    const ship = legalShip()
    expect(shipProblems(RULES, ship)).toEqual([])
    let bytes!: Uint8Array
    const marks = await withRecording(async () => (bytes = await renderShipSheet(ship, RULES, FONTS, PILOT)))
    expect(await pages(bytes)).toBe(2)
    expect(marks.filter(outside)).toEqual([])
    const text = marks.filter((m) => m.kind === 'text').map((m) => m.text).join(' | ')
    for (const t of ['Kestrel', 'Pilot: Vesk', 'Evasion', 'Major', 'Severe', 'Hope', 'Transport | Agility | +2', 'Science | Finesse | -1', 'Stress', 'Power Tokens (up to 12)', 'TRANSPORT', 'WEAPONS', 'SCIENCE', 'ENGINEERING', 'Prey Drive', 'Siphon Array', '2d8+4', 'Keywords', 'Refuel', 'Notices'])
      expect(text, t).toContain(t)
    // Track boxes, as on the character sheet: dark = earned (6 Hope + 13 HP + 9 Stress), faint = room to the cap (7 per system, 12 Stress).
    const box = (w: number) => marks.filter((m) => m.kind === 'rect' && Math.abs(m.x1 - m.x0 - w) < 0.01).length
    expect(box(13.1)).toBe(28)
    expect(box(12.6)).toBe(4 * 7 - 13 + 12 - 9)
    mkdirSync(SAMPLES, { recursive: true })
    writeFileSync(`${SAMPLES}/kestrel-solo-flier.pdf`, bytes)
  }, 60_000)
  it('the longest cards still fit one front page; no pilot linked leaves the trait values blank', async () => {
    const ship = longShip()
    expect(shipProblems(RULES, ship)).toEqual([])
    let bytes!: Uint8Array
    const marks = await withRecording(async () => (bytes = await renderShipSheet(ship, RULES, FONTS, null)))
    expect(await pages(bytes)).toBe(2)
    expect(marks.filter(outside)).toEqual([])
    const text = marks.filter((m) => m.kind === 'text').map((m) => m.text).join(' | ')
    expect(text).toContain('Agility | ___')
    expect(text).toContain('Pd10+4') // no pilot: Proficiency stays as Pd
    expect(text).not.toContain('TRANSPORT') // no Transport cards, no Transport box
    expect(text).toContain('Used (once per Refuel)')
    writeFileSync(`${SAMPLES}/long-dark-hub-ship.pdf`, bytes)
  }, 60_000)
  it('a linked ship prints after the character\'s sheet, starting on a fresh sheet of paper', async () => {
    const setup = buildCreation(PACKS, { supplements: ['starheart-ships'] })
    const reg: any = setup.registry
    const ch = newCharacter('pilot-1', '2026-11-07T00:00:00.000Z')
    const cls = reg.classes.get('guardian')
    ch.name = 'Vesk'
    Object.assign(ch.choices, { classId: 'guardian', subclassId: cls.subclasses[0], ancestryId: 'human', communityId: 'wanderborne' })
    ch.traits = PILOT.traits
    const alone = await pages(await renderSheet(ch, setup, FONTS))
    let shipStart = -1
    const both = await renderSheet(ch, setup, FONTS, (s, at) => { addShipPages(s, RULES, legalShip(), { name: at.name, traits: at.traits }); shipStart = s.doc.getPageCount() - 2 })
    const n = await pages(both)
    expect(n - alone).toBeGreaterThanOrEqual(2)
    expect(shipStart % 2).toBe(0)
    writeFileSync(`${SAMPLES}/vesk-with-kestrel.pdf`, both)
  }, 60_000)
})

describe('[s15] Ship archetypes', () => {
  const archetypes = () => shipsFrame().ships.archetypes as { id: string; name: string; domains: string[]; features: string[]; tokens?: string[] }[]
  it('all 15 domain pairs have exactly one archetype, with balanced markup and the right token trackers', () => {
    const list = archetypes()
    expect(list).toHaveLength(15)
    const pairs = list.map((a) => [...a.domains].sort().join('+'))
    expect(new Set(pairs).size).toBe(15)
    const domains = shipsFrame().ships.domains.map((d: any) => d.id)
    for (const a of list) {
      expect(a.domains.every((d) => domains.includes(d)), a.name).toBe(true)
      for (const f of a.features) expect((f.match(/\*\*/g) ?? []).length % 2, `${a.name}: ${f}`).toBe(0)
      const text = a.features.join(' ')
      expect(a.tokens ?? [], a.name).toEqual((['analysis', 'power'] as const).filter((t) => new RegExp(`${t} tokens?`, 'i').test(text)))
    }
    expect(list.find((a) => a.name === 'Chirurgeon')).toBeTruthy()
    expect(list.find((a) => a.name === 'Specter')!.features).toHaveLength(1)
  })
  it('archetypeOf: either domain order, none until two domains; archetype tokens add their tracker', () => {
    const s = legalShip() // Flesh + Energy
    expect(archetypeOf(RULES, s)?.name).toBe('Drake')
    s.choices.domainIds = ['energy', 'flesh']
    expect(archetypeOf(RULES, s)?.name).toBe('Drake')
    s.choices.domainIds = ['flesh']
    expect(archetypeOf(RULES, s)).toBeNull()
    s.choices.domainIds = ['mind', 'metal']
    expect(archetypeOf(RULES, s)?.name).toBe('Golem')
    expect(shipStats(RULES, s).tokenTrackers.map((t) => t.token)).toContain('analysis')
  })
  it('every archetype prints on the front page beside the tracks: two pages, inside the margins, text no smaller than 6.5 pt', async () => {
    const sizes: Record<string, number> = {}
    for (const a of archetypes()) {
      const ship = legalShip()
      ship.choices.domainIds = [...a.domains]
      let bytes!: Uint8Array
      const marks = await withRecording(async () => (bytes = await renderShipSheet(ship, RULES, FONTS, PILOT)))
      expect(await pages(bytes), a.name).toBe(2)
      expect(marks.filter(outside), a.name).toEqual([])
      const texts = marks.filter((m) => m.kind === 'text')
      const head = texts.find((m) => m.text === 'Archetype:')!
      expect(head, a.name).toBeTruthy()
      expect(texts.some((m) => m.text === a.name), a.name).toBe(true)
      const note = texts.find((m) => m.text === 'A' && m.x0 < 40)!
      const body = texts.filter((m) => m.x0 >= head.x0 - 1 && m.y0 > note.y0 + 0.5)
      sizes[a.name] = Math.min(...body.map((m) => (m.y1 - m.y0) / 0.75))
      expect(sizes[a.name], a.name).toBeGreaterThanOrEqual(6.5 - 0.01)
    }
    mkdirSync(SAMPLES, { recursive: true }); writeFileSync(`${SAMPLES}/archetype-sizes.json`, JSON.stringify(sizes, null, 1))
    const alchemist = legalShip(); alchemist.name = 'Alembic'; alchemist.choices.domainIds = ['mind', 'glass']
    mkdirSync(SAMPLES, { recursive: true })
    writeFileSync(`${SAMPLES}/alembic-alchemist.pdf`, await renderShipSheet(alchemist, RULES, FONTS, PILOT))
  }, 120_000)
  it('the longest cards plus an archetype still fit one front page', async () => {
    for (const pair of [['void', 'energy'], ['mind', 'glass']]) {
      const ship = longShip()
      ship.choices.domainIds = pair
      const bytes = await renderShipSheet(ship, RULES, FONTS, null)
      expect(await pages(bytes), pair.join('+')).toBe(2)
    }
  }, 60_000)
})
