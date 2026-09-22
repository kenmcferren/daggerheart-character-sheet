import { PDFPage } from 'pdf-lib'

// US Letter with 0.5" margins; printers commonly lose about 0.25" at the edge, so 0.5" is safe.
export const PW = 612, PH = 792, M = 36, TOL = 1
export interface Mark { kind: string; x0: number; y0: number; x1: number; y1: number; colors: any[]; text?: string }

/** Records every draw call so tests can check geometry and colour without rasterizing. */
export async function withRecording(run: () => Promise<Uint8Array>) {
  const marks: Mark[] = []
  const proto = PDFPage.prototype as any
  const orig = { text: proto.drawText, line: proto.drawLine, rect: proto.drawRectangle, circle: proto.drawCircle }
  proto.drawText = function (text: string, o: any) {
    const w = o.font.widthOfTextAtSize(text, o.size)
    marks.push({ kind: 'text', x0: o.x, y0: o.y, x1: o.x + w, y1: o.y + o.size * 0.75, colors: [o.color], text })
    return orig.text.call(this, text, o)
  }
  proto.drawLine = function (o: any) {
    const t = (o.thickness ?? 1) / 2
    marks.push({ kind: 'line', x0: Math.min(o.start.x, o.end.x) - t, y0: Math.min(o.start.y, o.end.y) - t, x1: Math.max(o.start.x, o.end.x) + t, y1: Math.max(o.start.y, o.end.y) + t, colors: [o.color] })
    return orig.line.call(this, o)
  }
  proto.drawRectangle = function (o: any) {
    const b = (o.borderWidth ?? 0) / 2
    marks.push({ kind: 'rect', x0: o.x - b, y0: o.y - b, x1: o.x + o.width + b, y1: o.y + o.height + b, colors: [o.color, o.borderColor] })
    return orig.rect.call(this, o)
  }
  proto.drawCircle = function (o: any) {
    const b = (o.borderWidth ?? 0) / 2
    marks.push({ kind: 'circle', x0: o.x - o.size - b, y0: o.y - o.size - b, x1: o.x + o.size + b, y1: o.y + o.size + b, colors: [o.color, o.borderColor] })
    return orig.circle.call(this, o)
  }
  try { await run() } finally { proto.drawText = orig.text; proto.drawLine = orig.line; proto.drawRectangle = orig.rect; proto.drawCircle = orig.circle }
  return marks
}

export const outside = (m: Mark) =>
  m.x0 < M - TOL || m.x1 > PW - M + TOL || m.y0 < M - TOL || m.y1 > PH - M + TOL
