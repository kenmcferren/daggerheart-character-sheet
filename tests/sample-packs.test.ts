import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { loadPacks } from '../src/engine/packs'
import { newCharacter, exportCharacter, importCharacter } from '../src/engine/character'

const dir = 'packs/sample'
const raw = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')))

describe('[s1] Sample packs end to end', () => {
  it('load through the same loader as any pack', () => {
    const r = loadPacks(raw)
    expect(r.classes.size).toBe(1)
    expect(r.ancestries.size).toBe(2)
  })
  it('extension overrides core content and tags its source', () => {
    const r = loadPacks(raw)
    expect(r.equipment.get('sample-staff')).toMatchObject({ name: 'Ash Staff', sourcePack: 'sample-extension' })
    expect(r.ancestries.get('sample-hollowfolk')?.sourcePack).toBe('sample-core')
  })
  it('a character built from pack ids resolves back against the registry', () => {
    const r = loadPacks(raw)
    const c = newCharacter('c1')
    c.sources.enabledPacks = ['sample-core', 'sample-extension']
    c.sources.campaignFrameId = 'sample-frame'
    c.choices = { ...c.choices, classId: 'sample-warden', subclassId: 'sample-warden-stone', ancestryId: 'sample-emberkin', domainCardIds: ['sample-bone-ward'] }
    const back = importCharacter(exportCharacter(c))
    expect(r.classes.has(back.choices.classId!)).toBe(true)
    expect(r.subclasses.has(back.choices.subclassId!)).toBe(true)
    expect(r.ancestries.has(back.choices.ancestryId!)).toBe(true)
    expect(back.choices.domainCardIds.every((id) => r.domainCards.has(id))).toBe(true)
    expect(r.campaignFrames.has(back.sources.campaignFrameId!)).toBe(true)
  })
})
