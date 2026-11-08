import core from '../../packs/core/srd-core.json'
import frames from '../../packs/core/srd-frames.json'
import starfinder from '../../packs/core/starfinder.json'
import armaments from '../../packs/core/srd-armaments.json'
import everydayHeroArms from '../../packs/core/everyday-hero-armaments.json'
import westernArms from '../../packs/core/western-armaments.json'
import monsterHuntingArms from '../../packs/core/monster-hunting-armaments.json'
import starfinderArms from '../../packs/core/starfinder-armaments.json'
import { buildCreation, type CreationSetup, type FrameEntry } from '../engine/creation'
import { CharacterStore, ShipStore } from '../engine/saves'
import { newShip, shipRulesFrom, SHIP_FRAME_ID, type Ship, type ShipRole, type ShipRules } from '../engine/ship'
import { idbStore } from '../engine/idbStore'
import { creationOf, newCharacter, type Character } from '../engine/character'
import { sheetView } from '../engine/sheetView'

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

/** Starheart ships (Series 14): saved beside characters; rules from the Starheart Ships supplement. */
export const shipStore = new ShipStore(idbStore)
export const SHIP_RULES: ShipRules = (() => {
  const r = shipRulesFrom(setupFor(null).registry)
  if (!r) throw new Error('Starheart Ships rules are missing from the loaded packs')
  return r
})()

export function startShip(role: ShipRole, characterLineageId: string | null = null): Ship {
  const s = newShip(crypto.randomUUID(), role, SHIP_RULES)
  s.sources = { enabledPacks: PACK_IDS, supplementIds: [SHIP_FRAME_ID] }
  s.characterLineageId = characterLineageId
  return s
}

/** "Solo Flier", or "Hub Ship · Catamaran": the role, plus the size name when it says something new. */
export function shipLabel(s: Ship): string {
  const role = s.role === 'hub' ? 'Hub Ship' : 'Solo Flier'
  const size = SHIP_RULES.sizes.find((z) => z.size === s.size)?.name ?? `size ${s.size}`
  return size === role ? role : `${role} · ${size}`
}

/** A ship's pilot: the linked character's newest version, with its traits at that level (base plus trait advancements). */
export async function pilotOf(lineageId: string | null): Promise<{ character: Character; name: string; traits: Character['traits']; proficiency?: number } | null> {
  const c = lineageId ? await latestOf(lineageId) : null
  if (!c) return null
  let traits = c.traits, proficiency: number | undefined
  try { const v = sheetView(c, setupOf(c)); traits = v.traits; proficiency = v.stats.proficiency } catch { /* an unfinished character: base traits */ }
  return { character: c, name: c.name, traits, proficiency }
}

/** The newest saved version of a character lineage (the pilot whose traits a linked ship prints). */
export async function latestOf(lineageId: string): Promise<Character | null> {
  const vs = await store.versionsOf(lineageId)
  return vs.at(-1) ?? null
}
