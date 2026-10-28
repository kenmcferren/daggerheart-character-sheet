import { describe, it, expect } from 'vitest'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { addConsumablesPages } from '../src/pdf/consumablesPage'

describe('[s14] consumables printout', () => {
  it('sets all 120 consumables on two landscape pages, three fitted columns each', async () => {
    const items = JSON.parse(readFileSync('scripts/srd-convert/starfinder/consumables.json', 'utf8')).items
    const doc = await PDFDocument.create()
    doc.registerFontkit(fontkit)
    const e = async (n: string) => doc.embedFont(new Uint8Array(readFileSync(`assets/fonts/${n}`)), { subset: true })
    const f = { body: await e('source-sans-3-latin-400-normal.woff'), bold: await e('source-sans-3-latin-700-normal.woff'), head: await e('cinzel-latin-700-normal.woff') }
    const r = addConsumablesPages(doc, f, items)
    mkdirSync('TestArtifacts/sheet-samples', { recursive: true })
    writeFileSync('TestArtifacts/sheet-samples/consumables-page.pdf', await doc.save())
    writeFileSync('TestArtifacts/sheet-samples/consumables-page.json', JSON.stringify(r))
    expect(items.length).toBe(120)
    expect(r.pages).toBe(2)
    expect(r.size).toBeGreaterThanOrEqual(5)
  })
})
