import { readFileSync } from 'node:fs'

/** Weapons and armor live in their own packs: the SRD set, plus one per frame that adds or replaces gear. */
export const ARMS = ['srd-armaments', 'everyday-hero-armaments', 'western-armaments', 'monster-hunting-armaments'].map(
  (id) => JSON.parse(readFileSync(`packs/core/${id}.json`, 'utf8')),
)

/** Starfinder gear; extends the `starfinder` pack, so load it only alongside that pack. */
export const SF_ARMS = JSON.parse(readFileSync('packs/core/starfinder-armaments.json', 'utf8'))
