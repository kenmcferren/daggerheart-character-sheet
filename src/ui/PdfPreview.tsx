import { useEffect, useRef, useState } from 'react'
import type { Character } from '../engine/character'
import type { CreationSetup } from '../engine/creation'

/** Live preview of the printable sheet: draws the real PDF's pages onto canvases a moment after the character changes. Works on phones, unlike an embedded PDF viewer. */
export function PdfPreview({ ch, setup }: { ch: Character; setup: CreationSetup }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState(false)
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDrawing(true)
    const timer = setTimeout(async () => {
      try {
        const bytes = await (await import('../pdf/browser')).previewSheetBytes(ch, setup)
        const pdfjs = await import('pdfjs-dist')
        const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjs.GlobalWorkerOptions.workerSrc = worker
        const task = pdfjs.getDocument({ data: bytes })
        const doc = await task.promise
        const width = host.current?.clientWidth || 600
        const canvases: HTMLCanvasElement[] = []
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n)
          const base = page.getViewport({ scale: 1 })
          // Narrow screens draw extra pixels so pinch-zoom on the small page stays legible
        const density = Math.max(window.devicePixelRatio || 1, width < 600 ? 3 : 1)
        const viewport = page.getViewport({ scale: (width / base.width) * density })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = 'pdf-page'
          await page.render({ canvas, viewport }).promise
          canvases.push(canvas)
        }
        await task.destroy()
        if (cancelled) return
        host.current?.replaceChildren(...canvases)
        setError('')
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setDrawing(false)
      }
    }, 400)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [open, ch, setup])

  return (
    <section className="panel">
      <h3>Sheet preview</h3>
      <button type="button" onClick={() => setOpen((v) => !v)}>{open ? 'Hide preview' : 'Show preview'}</button>
      {open && error && <p className="hint">The sheet can't be drawn yet: {error}</p>}
      {open && drawing && !error && <p className="hint">Drawing the sheet…</p>}
      {open && <div ref={host} className="pdf-pages" />}
    </section>
  )
}
