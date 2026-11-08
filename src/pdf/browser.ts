import bodyUrl from '../../assets/fonts/source-sans-3-latin-400-normal.woff?url'
import boldUrl from '../../assets/fonts/source-sans-3-latin-700-normal.woff?url'
import italicUrl from '../../assets/fonts/source-sans-3-latin-400-italic.woff?url'
import boldItalicUrl from '../../assets/fonts/source-sans-3-latin-700-italic.woff?url'
import headUrl from '../../assets/fonts/cinzel-latin-700-normal.woff?url'
import displayUrl from '../../assets/fonts/audiowide-latin-400-normal.woff?url'
import type { Character } from '../engine/character'
import type { CreationSetup } from '../engine/creation'
import type { Ship } from '../engine/ship'
import { renderSheet, type SheetFonts } from './sheet'
import { sheetView } from '../engine/sheetView'
import { addShipPages, renderShipSheet } from './shipPage'
import { SHIP_RULES, pilotOf, shipStore } from '../ui/data'

const bytes = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer())
const loadFonts = async (): Promise<SheetFonts> =>
  ({ body: await bytes(bodyUrl), bold: await bytes(boldUrl), italic: await bytes(italicUrl), boldItalic: await bytes(boldItalicUrl), heading: await bytes(headUrl), display: await bytes(displayUrl) })

/** The character's sheet, then a ship sheet for each ship linked to the character (Series 14). */
const renderBytes = async (ch: Character, setup: CreationSetup) => {
  const ships = await shipStore.forCharacter(ch.lineageId).catch(() => [] as Ship[])
  return renderSheet(ch, setup, await loadFonts(), ships.length ? (s, at) => { for (const sh of ships) addShipPages(s, SHIP_RULES, sh, { name: at.name, traits: at.traits, proficiency: sheetView(ch, setup).stats.proficiency }) } : undefined)
}

/** Renders the sheet to PDF bytes; used by the live preview. */
export const previewSheetBytes = renderBytes

function save(name: string, data: Uint8Array) {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/[^\w-]+/g, '-')}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

/** Renders the sheet in the browser and offers it as a file download. */
export async function downloadSheet(ch: Character, setup: CreationSetup) {
  save(`${ch.name || 'character'}-level-${ch.level}`, await renderBytes(ch, setup))
}

/** A ship on its own; the linked character (newest version) is the pilot whose traits print. */
export async function shipSheetBytes(ship: Ship) {
  return renderShipSheet(ship, SHIP_RULES, await loadFonts(), await pilotOf(ship.characterLineageId))
}

export async function downloadShipSheet(ship: Ship) {
  save(ship.name || 'ship', await shipSheetBytes(ship))
}
