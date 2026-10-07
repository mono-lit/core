// Web Crypto helpers (plain Web APIs — run on Netlify Functions and Node).

export async function sha1Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', normalize(bytes))
  return toHex(digest)
}

export async function sha512Sri(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-512', normalize(bytes))
  return `sha512-${toBase64(digest)}`
}

/** crypto.subtle.digest requires a plain ArrayBuffer view without byte offsets. */
function normalize(bytes: Uint8Array): Uint8Array {
  if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
    return bytes
  }
  return new Uint8Array(bytes)
}

export function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0')
  }
  return out
}

export function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * Chunked base64 decoder. npm publish attachments carry base64 tarballs that
 * can reach several MB; decoding in chunks of characters avoids building one
 * huge intermediate binary string via a single atob() call.
 */
export function decodeBase64(input: string): Uint8Array {
  const clean = input.replace(/\s+/g, '')
  if (clean.length === 0) return new Uint8Array(0)
  if (clean.length % 4 !== 0) {
    throw new Error('invalid base64: length must be a multiple of 4')
  }

  let size = Math.floor(clean.length / 4) * 3
  if (clean.endsWith('==')) size -= 2
  else if (clean.endsWith('=')) size -= 1

  const out = new Uint8Array(size)
  const CHUNK_CHARS = 4 * 8192 // multiple of 4
  let pos = 0
  for (let i = 0; i < clean.length; i += CHUNK_CHARS) {
    const bin = atob(clean.slice(i, Math.min(i + CHUNK_CHARS, clean.length)))
    for (let j = 0; j < bin.length; j++) {
      out[pos++] = bin.charCodeAt(j)
    }
  }
  if (pos !== size) {
    throw new Error('invalid base64: decoded size mismatch')
  }
  return out
}
