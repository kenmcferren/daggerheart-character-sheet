import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Emits sw.js with the full list of built files, so the app installs and works offline after the first visit. */
function offlineWorker(): Plugin {
  return {
    name: 'offline-worker',
    apply: 'build',
    generateBundle(_o, bundle) {
      const files = ['./', ...Object.keys(bundle), 'manifest.webmanifest', 'favicon.svg']
      const version = Date.now().toString(36)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = 'dh-sheet-${version}'
const FILES = ${JSON.stringify(files)}
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())) })
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)))
})
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), offlineWorker()],
})
