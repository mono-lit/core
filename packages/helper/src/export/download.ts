/**
 * Browser download helper. Kept separate (and DOM-guarded) so the report engine
 * can still render on a server — where `download()` is simply a no-op warning
 * rather than a crash.
 */

/** MIME type per output format. */
export const MIME: Record<string, string> = {
  md: 'text/markdown;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/** Save a Blob to disk via a transient `<a download>`. Browser only. */
export function downloadBlob(blob: Blob, fileName: string): void {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    console.warn('[mono-export] download() needs a browser environment — skipped.')
    return
  }
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Revoke on the next frame — revoking synchronously can cancel the download
  // in Safari before it has read the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
