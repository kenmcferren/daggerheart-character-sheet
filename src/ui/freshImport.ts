const STALE_CHUNK = /dynamically imported module|module script failed|Failed to fetch|Load failed/i
const RELOAD_FLAG = 'dh-reloaded-for-stale-chunk'

/**
 * A redeploy overwrites dist/ with new hashed filenames, so a tab left open across a deploy holds
 * references to chunk URLs the server no longer has. Reload once (picks up the fresh build via the
 * service worker's updated cache) rather than surfacing a dead-end "module not found" error.
 */
export async function freshImport<T>(loader: () => Promise<T>): Promise<T> {
  try {
    return await loader()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (STALE_CHUNK.test(msg) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1')
      window.location.reload()
      return new Promise<T>(() => {})
    }
    throw e
  }
}
