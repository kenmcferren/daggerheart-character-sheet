import { rgb, type PDFDocument, type PDFFont, type PDFPage } from 'pdf-lib'
import type { ConsumableDef } from '../engine/creation'
import { CONSUMABLE_LABEL } from '../engine/creation'

// Starheart Consumables reference: landscape Letter, double-sided, two pages of three columns. Cypher and Ordnance take two columns
// (items 1-15, then 16-30), Stim and Gadget one (Cypher + Stim, then Ordnance + Gadget); column widths are fitted to the text so no column has spare room.
const PW = 612, PH = 792, M = 36, FOOT = 19
const INK = rgb(0, 0, 0), SHADE = rgb(0.9, 0.9, 0.9)
const MAX_SIZE = 9
const HEAD = 16, PAD = 1.2

const clean = (s: string) =>
  s.replace(/→/g, '->').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/−/g, '-').replace(/[^ -ɏ‐-›]/g, '?')

interface Fonts { body: PDFFont; bold: PDFFont; head: PDFFont }
interface Line { segs: { t: string; bold: boolean }[] }

const widthCache = new WeakMap<PDFFont, Map<string, number>>()
/** Text width, cached: measuring is slow and the width search repeats the same words. */
function width(font: PDFFont, text: string, size: number): number {
  let m = widthCache.get(font)
  if (!m) widthCache.set(font, (m = new Map()))
  const k = size + '|' + text
  let w = m.get(k)
  if (w === undefined) m.set(k, (w = font.widthOfTextAtSize(text, size)))
  return w
}

/** Greedy word wrap of "N. Name" (bold) followed by the rules text. */
function wrap(d: ConsumableDef, f: Fonts, size: number, w: number): Line[] {
  const words = [...clean(`${d.number}. ${d.name}`).split(/\s+/).map((t) => ({ t, bold: true })), ...clean(d.rules).split(/\s+/).filter(Boolean).map((t) => ({ t, bold: false }))]
  const lines: Line[] = [{ segs: [] }]
  let x = 0
  for (const wd of words) {
    const font = wd.bold ? f.bold : f.body
    const ww = width(font, wd.t, size), sp = width(f.body, ' ', size)
    const cur = lines[lines.length - 1]
    if (cur.segs.length && x + sp + ww > w) { lines.push({ segs: [wd] }); x = ww }
    else { cur.segs.push(wd); x += (cur.segs.length > 1 ? sp : 0) + ww }
  }
  return lines
}

const itemH = (n: number, size: number) => n * size * 1.12 + 2 * PAD

/** Total height of a quadrant's items at this size. */
const fits = (items: ConsumableDef[], f: Fonts, size: number, w: number, h: number) =>
  items.reduce((t, d) => t + itemH(wrap(d, f, size, w - 2 * PAD).length, size), 0) <= h

function drawBlock(page: PDFPage, f: Fonts, label: string, items: ConsumableDef[], x: number, top: number, w: number, size: number) {
  if (label) page.drawText(clean(label), { x, y: top - 11, size: 11, font: f.head, color: INK })
  page.drawLine({ start: { x, y: top - 14 }, end: { x: x + w, y: top - 14 }, thickness: 0.8, color: INK })
  let y = top - HEAD
  items.forEach((d, i) => {
    const lines = wrap(d, f, size, w - 2 * PAD), h = itemH(lines.length, size)
    if (i % 2 === 1) page.drawRectangle({ x, y: y - h, width: w, height: h, color: SHADE, borderWidth: 0 })
    lines.forEach((ln, li) => {
      let lx = x + PAD
      ln.segs.forEach((sg, si) => {
        const font = sg.bold ? f.bold : f.body
        const text = (si ? ' ' : '') + sg.t
        page.drawText(text, { x: lx, y: y - PAD - size * 1.12 * li - size * 0.9, size, font, color: INK })
        lx += font.widthOfTextAtSize(text, size)
      })
    })
    y -= h
  })
}

/** Narrowest column width (to 0.5 pt) at which the items still fit the height at this size. */
function minWidth(items: ConsumableDef[], f: Fonts, size: number, h: number): number {
  let lo = 30, hi = 600
  while (hi - lo > 0.5) { const mid = (lo + hi) / 2; if (fits(items, f, size, mid, h)) hi = mid; else lo = mid }
  return hi
}

/** Adds the consumables reference pages (landscape, three columns per page, widths fitted); returns the pages added and the font size used. */
export function addConsumablesPages(doc: PDFDocument, f: Fonts, defs: ConsumableDef[]): { pages: number; size: number } {
  // Page 1: Cypher (two columns) + Stim (one); page 2: Ordnance (two) + Gadget (one).
  const types = ['cypher', 'stim', 'ordnance', 'gadget'].filter((t) => defs.some((d) => d.type === t))
  const groups = types.map((t) => defs.filter((d) => d.type === t).sort((a, b) => a.number - b.number))
  const LW = PH, LH = PW, CG = 8, TG = 16
  const areaTop = LH - M - 24, h = areaTop - (M + FOOT + 4) - HEAD
  const avail = LW - 2 * M - CG - TG
  // A page is [first half of A, second half of A, all of B]; its minimum widths at a size give the total it needs.
  const pageSets: { i: number; cols: ConsumableDef[][] }[] = []
  for (let i = 0; i < groups.length; i += 2) {
    const a = groups[i], b = groups[i + 1] ?? [], cut = Math.ceil(a.length / 2)
    pageSets.push({ i, cols: [a.slice(0, cut), a.slice(cut), b] })
  }
  const need = (cols: ConsumableDef[][], s: number) => cols.map((c) => (c.length ? minWidth(c, f, s, h) : 0))
  // Feasibility only gets harder as the size grows, so bisect the size (to 0.1 pt) instead of stepping.
  const ok = (s: number) => pageSets.every((p) => need(p.cols, s).reduce((x, y) => x + y, 0) <= avail)
  let lo = 3, hi = MAX_SIZE
  while (hi - lo > 0.1) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid }
  const size = Math.floor(lo * 10) / 10
  let pages = 0
  if (doc.getPageCount() % 2 === 1) { doc.addPage([PW, PH]); pages++ } // keep the pair on one sheet
  for (const ps of pageSets) {
    const page = doc.addPage([LW, LH]); pages++
    page.drawText(clean(`Starheart Consumables (${ps.i / 2 + 1} of ${pageSets.length})`), { x: M, y: LH - M - 14, size: 14, font: f.head, color: INK })
    const min = need(ps.cols, size), slack = avail - min.reduce((x, y) => x + y, 0)
    const widths = min.map((w) => w + slack * (w / min.reduce((x, y) => x + y, 0))) // spare room shared in proportion to need
    let x = M
    ps.cols.forEach((col, c) => {
      drawBlock(page, f, c === 0 ? CONSUMABLE_LABEL[types[ps.i]] : c === 2 ? CONSUMABLE_LABEL[types[ps.i + 1]] : '', col, x, areaTop, widths[c], size)
      x += widths[c] + (c === 0 ? CG : TG)
    })
  }
  return { pages, size }
}
