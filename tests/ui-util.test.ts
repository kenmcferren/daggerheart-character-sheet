import { describe, it, expect } from 'vitest'
import { issueStep, titleCase } from '../src/ui/util'
import { normalize } from '../src/ui/data'
import { newCharacter } from '../src/engine/character'

const steps = [
  { id: 'class', title: 'Class' },
  { id: 'flight-artifact', title: 'Flight', choice: 'flight-artifact', source: 'x' },
  { id: 'equipment', title: 'Equipment' },
]

describe('[s3] ui helpers', () => {
  it('issues map to the step that asks for the choice, else to equipment', () => {
    expect(issueStep({ step: 'class', message: '' }, steps)).toBe('class')
    expect(issueStep({ step: 'iconic-weapon', message: '' }, steps)).toBe('equipment')
    expect(issueStep({ step: 'artifact', message: '' }, [{ id: 's', title: 'S', choice: 'artifact', source: 'x' }])).toBe('s')
  })
  it('titleCase', () => expect(titleCase('very-close')).toBe('Very close'))
  it('normalize fills the creation block on older saves', () => {
    const c = newCharacter('a')
    delete c.creation
    expect(normalize(c).creation).toMatchObject({ experiences: [], potion: null, companion: null })
  })
})
