import { useEffect, useState } from 'react'

type Theme = 'auto' | 'light' | 'dark'
const KEY = 'dh-theme'
const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' }
const LABEL: Record<Theme, string> = { auto: 'Theme: auto', light: 'Theme: light', dark: 'Theme: dark' }

function read(): Theme {
  try { const v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v } catch { /* ignore */ }
  return 'auto'
}

export function applyTheme(t: Theme) {
  if (t === 'auto') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = t
}

/** Small fixed button that cycles auto, light, dark. Auto follows the device setting. */
export function ThemeToggle() {
  const [t, setT] = useState<Theme>(read)
  useEffect(() => { applyTheme(t) }, [t])
  const click = () => {
    const n = NEXT[t]
    setT(n)
    try { if (n === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, n) } catch { /* ignore */ }
  }
  return <button type="button" className="theme-toggle" onClick={click} title={LABEL[t]} aria-label={LABEL[t]}>{t === 'dark' ? '☾' : t === 'light' ? '☀' : '◐'}</button>
}
