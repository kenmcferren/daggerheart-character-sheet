import { describe, it, expect } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { renderSheet, type SheetFonts } from '../src/pdf/sheet'
import { buildCreation } from '../src/engine/creation'
import { progressOf } from '../src/engine/levelup'
import { sheetView } from '../src/engine/sheetView'
import { adv, hp, problems, reg, toLevel, up } from './lib/levelup-paths'

const setup = buildCreation([JSON.parse(readFileSync('packs/core/srd-core.json', 'utf8')), JSON.parse(readFileSync('packs/core/srd-frames.json', 'utf8'))])
const font = (f: string) => new Uint8Array(readFileSync(`assets/fonts/${f}`))
const fonts: SheetFonts = {
  body: font('source-sans-3-latin-400-normal.woff'), bold: font('source-sans-3-latin-700-normal.woff'),
  italic: font('source-sans-3-latin-400-italic.woff'), boldItalic: font('source-sans-3-latin-700-italic.woff'),
  heading: font('cinzel-latin-700-normal.woff'),
}
const mc = (classId: string, subclassId: string) => ({ classId, domainId: (reg.classes.get(classId) as any).domains[0], subclassId })
const l4 = () => toLevel(4)
const t1 = () => (reg.classes.get('brawler') as any).stances.filter((s: any) => s.tier === 1).map((s: any) => s.id)
const companion = { name: 'Rex', experiences: ['Scout', 'Loyal'], attack: 'Bite', damageType: 'physical' as const }

describe('[s5] multiclass extras (stances and companion follow the subclass)', () => {
  it('multiclass into Martial Artist: two Tier 1 stances now, one more per level after', () => {
    const m = mc('brawler', 'brawler.martial-artist')
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: m })]).join()).toMatch(/2 different Tier 1 stances/)
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: m })], { startStanceIds: [t1()[0], t1()[0]] }).join()).toMatch(/2 different Tier 1 stances/)
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: m })], { startStanceIds: t1().slice(0, 2) })
    expect(progressOf(l5, reg).stanceIds).toEqual(t1().slice(0, 2))
    expect(problems(l5, [hp(3), hp(3)]).join()).toMatch(/choose a stance/)
    const l6 = up(l5, [hp(3), hp(3)], { stanceId: t1()[2] })
    expect(progressOf(l6, reg).stanceIds).toHaveLength(3)
    expect(sheetView(l6, setup).stances.map((s: any) => s.id)).toEqual(expect.arrayContaining(t1().slice(0, 3)))
  })
  it('multiclass into Juggernaut asks for no stances; a Juggernaut Brawler is never asked either', () => {
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: mc('brawler', 'brawler.juggernaut') })])
    expect(progressOf(l5, reg).stanceIds).toEqual([])
    expect(problems(l5, [hp(3), hp(3)]).join()).toBe('')
  })
  it('multiclass into Beastbound: the companion sheet now, one option per level after', () => {
    const m = mc('ranger', 'ranger.beastbound')
    expect(problems(l4(), [adv('multiclass', 3, { multiclass: m })]).join()).toMatch(/name the companion/)
    const l5 = up(l4(), [adv('multiclass', 3, { multiclass: m })], { newCompanion: companion })
    expect(progressOf(l5, reg).companion).toEqual(companion)
    expect(problems(l5, [hp(3), hp(3)]).join()).toMatch(/choose 1 companion option/)
    const l6 = up(l5, [hp(3), hp(3)], { companionOptionIds: ['aware'] })
    const v = sheetView(l6, setup)
    expect(v.companion?.name).toBe('Rex')
    expect(v.companion?.evasion).toBe(12)
  })
  it('a Wayfinder Ranger has no companion steps', () => {
    const ch = { ...toLevel(1), choices: { ...toLevel(1).choices, classId: 'ranger', subclassId: 'ranger.wayfinder' } }
    expect(progressOf(ch, reg).companion).toBeNull()
  })
  it('sample sheets: a Wizard multiclassed into Martial Artist (stances) and into Beastbound (companion) print their blocks', async () => {
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    const a = up(up(l4(), [adv('multiclass', 3, { multiclass: mc('brawler', 'brawler.martial-artist') })], { startStanceIds: t1().slice(0, 2) }), [hp(3), hp(3)], { stanceId: t1()[2] })
    const b = up(up(l4(), [adv('multiclass', 3, { multiclass: mc('ranger', 'ranger.beastbound') })], { newCompanion: companion }), [hp(3), hp(3)], { companionOptionIds: ['aware'] })
    writeFileSync('TestArtifacts/sheet-samples/wizard-multiclass-martial-artist.pdf', await renderSheet(a, setup, fonts))
    writeFileSync('TestArtifacts/sheet-samples/wizard-multiclass-beastbound.pdf', await renderSheet(b, setup, fonts))
  }, 60_000)
})
