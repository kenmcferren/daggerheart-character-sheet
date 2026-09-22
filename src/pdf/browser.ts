import bodyUrl from '../../assets/fonts/source-sans-3-latin-400-normal.woff?url'
import boldUrl from '../../assets/fonts/source-sans-3-latin-700-normal.woff?url'
import italicUrl from '../../assets/fonts/source-sans-3-latin-400-italic.woff?url'
import boldItalicUrl from '../../assets/fonts/source-sans-3-latin-700-italic.woff?url'
import headUrl from '../../assets/fonts/cinzel-latin-700-normal.woff?url'
import type { Character } from '../engine/character'
import type { CreationSetup } from '../engine/creation'
import { renderSheet } from './sheet'

const bytes = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer())

/** Renders the sheet in the browser and offers it as a file download. */
export async function downloadSheet(ch: Character, setup: CreationSetup) {
  const pdf = await renderSheet(ch, setup, { body: await bytes(bodyUrl), bold: await bytes(boldUrl), italic: await bytes(italicUrl), boldItalic: await bytes(boldItalicUrl), heading: await bytes(headUrl) })
  const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${(ch.name || 'character').replace(/[^\w-]+/g, '-')}-level-${ch.level}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
