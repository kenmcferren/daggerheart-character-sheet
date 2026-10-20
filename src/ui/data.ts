import core from '../../packs/core/srd-core.json'
import frames from '../../packs/core/srd-frames.json'
import starfinder from '../../packs/core/starfinder.json'
import armaments from '../../packs/core/srd-armaments.json'
import everydayHeroArms from '../../packs/core/everyday-hero-armaments.json'
import westernArms from '../../packs/core/western-armaments.json'
import monsterHuntingArms from '../../packs/core/monster-hunting-armaments.json'
import starfinderArms from '../../packs/core/starfinder-armaments.json'
import { buildCreation, type CreationSetup, type FrameEntry } from '../engine/creation'
import { CharacterStore } from '../engine/saves'
import { idbStore } from '../engine/idbStore'
import { creationOf, newCharacter, type Character } from '../engine/character'

/** Packs loaded at build time. Ids go into each saved character. */
export const PACKS: unknown[] = [core, armaments, frames, everydayHeroArms, westernArms, monsterHuntingArms, starfinder, starfinderArms]
export const PACK_IDS = (PACKS as { id: string }[]).map((p) => p.id)

export const store = new CharacterStore(idbStore)

export const setupFor = (frame: string | null | undefined, supplements: string[] = []): CreationSetup =>
  buildCreation(PACKS, { frame: frame || undefined, supplements })

/** There is no separate frame choice; an older save's frame id is treated as a supplement. */
export const setupOf = (c: Character) => {
  const legacy = c.sources.campaignFrameId
  const supps = c.sources.supplementIds ?? []
  return setupFor(null, legacy && !supps.includes(legacy) ? [legacy, ...supps] : supps)
}

export function allSupplements() {
  const all = [...setupFor(null).registry.campaignFrames.values()] as FrameEntry[]
  return all.filter((f) => f.frameKind === 'supplement')
}

export function startCharacter(supplements: string[]): Character {
  const c = newCharacter(crypto.randomUUID())
  c.sources = { enabledPacks: PACK_IDS, campaignFrameId: null, supplementIds: supplements }
  return c
}

/** Older saves may lack the creation block; fill it so the UI can assume it exists. */
export const normalize = (c: Character): Character => ({ ...c, creation: creationOf(c) })
