import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildCreation } from '../src/engine/creation'
import { ancestryList, communityList } from '../src/engine/rules'
import { classList } from '../src/engine/classCards'
import { ARMS, SF_ARMS } from './lib/packs'

const pack = (f: string) => JSON.parse(readFileSync(`packs/core/${f}.json`, 'utf8'))
const PACKS = [pack('srd-core'), pack('srd-frames'), pack('starfinder'), ...ARMS, SF_ARMS]
const ALL = ['starfinder-ancestries', 'starfinder-communities', 'starfinder-classes']

describe('[s14] Starheart exclusive option', () => {
  it('on: only Starheart classes, ancestries and communities are listed', () => {
    const s = buildCreation(PACKS, { supplements: [...ALL, 'starheart-exclusive'] })
    expect(classList(s).every((c) => c.onlyWith === 'starfinder-classes')).toBe(true)
    expect(ancestryList(s).map((a) => a.id)).toEqual(s.ancestryFirst)
    expect(communityList(s).map((c) => c.id)).toEqual(s.communityFirst)
  })
  it('on without a Starheart option: that list stays standard', () => {
    const s = buildCreation(PACKS, { supplements: ['starheart-exclusive'] })
    expect(classList(s).some((c) => c.id === 'wizard')).toBe(true)
    expect(communityList(s).length).toBeGreaterThan(5)
  })
  it('off: standard entries still appear beside Starheart ones', () => {
    const s = buildCreation(PACKS, { supplements: ALL })
    expect(classList(s).some((c) => c.id === 'wizard')).toBe(true)
  })
})
