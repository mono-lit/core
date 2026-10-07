// Storage layer for the registry.
//
// On Netlify: two site-scoped Netlify Blobs stores with STRONG consistency
// (reads see the latest publish immediately):
//   - store "tarballs":  key "<name>/<version>.tgz"  → binary tarball
//   - store "metadata":  key "<name>.json"           → packument JSON
// Blobs' conditional writes give the registry its correctness guarantees:
//   - onlyIfNew  → tarball immutability (duplicate publish = 409)
//   - onlyIfMatch (ETag) → optimistic concurrency for metadata merges
//
// Locally (plain `node`, no Netlify CLI): an in-memory store implementing the
// same semantics, so the whole registry can be exercised end to end.

export interface StoreGetOptions {
  type?: 'text' | 'json' | 'arrayBuffer' | 'blob' | 'stream'
}

export interface StoreSetOptions {
  metadata?: Record<string, unknown>
  onlyIfMatch?: string
  onlyIfNew?: boolean
}

export interface StoreSetResult {
  modified: boolean
  etag?: string
}

export interface KeyValueStore {
  get(key: string, opts?: StoreGetOptions): Promise<unknown>
  getWithMetadata(
    key: string,
    opts?: StoreGetOptions,
  ): Promise<{ data: unknown; etag: string; metadata: Record<string, unknown> } | null>
  set(key: string, value: ArrayBuffer | string, opts?: StoreSetOptions): Promise<StoreSetResult>
  setJSON(key: string, value: unknown, opts?: StoreSetOptions): Promise<StoreSetResult>
  delete(key: string): Promise<void>
}

export interface RegistryStores {
  tarballs: KeyValueStore
  metadata: KeyValueStore
}

let cached: Promise<RegistryStores> | null = null

export function getRegistryStores(): Promise<RegistryStores> {
  if (!cached) {
    cached = createStores()
  }
  return cached
}

async function createStores(): Promise<RegistryStores> {
  // Memory store is an OPT-IN fallback for plain local `node` runs only
  // (scripts/registry/local-server.mjs sets this flag). Production functions
  // must always use real Blobs — a silent memory fallback there would lose
  // data whenever Lambda recycles the instance.
  if (process.env.MONO_REGISTRY_MEMORY === '1') {
    return { tarballs: memoryStore(), metadata: memoryStore() }
  }

  const blobs = await import('@netlify/blobs')
  const tarballs = blobs.getStore({ name: 'tarballs', consistency: 'strong' }) as unknown as KeyValueStore
  const metadata = blobs.getStore({ name: 'metadata', consistency: 'strong' }) as unknown as KeyValueStore
  return { tarballs, metadata }
}

/** In-memory store mirroring the Blobs API subset used by the registry. */
export function memoryStore(): KeyValueStore {
  interface Entry {
    value: ArrayBuffer | string
    etag: string
    metadata: Record<string, unknown>
  }
  const map = new Map<string, Entry>()
  let counter = 0

  function asType(entry: Entry, opts?: StoreGetOptions): unknown {
    if (opts?.type === 'arrayBuffer') {
      return typeof entry.value === 'string' ? new TextEncoder().encode(entry.value).buffer : entry.value
    }
    if (opts?.type === 'json') {
      const text = typeof entry.value === 'string' ? entry.value : new TextDecoder().decode(entry.value)
      return JSON.parse(text)
    }
    return typeof entry.value === 'string' ? entry.value : new TextDecoder().decode(entry.value)
  }

  return {
    async get(key, opts) {
      const entry = map.get(key)
      return entry ? asType(entry, opts) : null
    },
    async getWithMetadata(key, opts) {
      const entry = map.get(key)
      return entry ? { data: asType(entry, opts), etag: entry.etag, metadata: entry.metadata } : null
    },
    async set(key, value, opts) {
      const existing = map.get(key)
      if (opts?.onlyIfNew && existing) return { modified: false }
      if (opts?.onlyIfMatch && (!existing || existing.etag !== opts.onlyIfMatch)) return { modified: false }
      const etag = `"mem-${++counter}"`
      map.set(key, { value, etag, metadata: opts?.metadata ?? {} })
      return { modified: true, etag }
    },
    async setJSON(key, value, opts) {
      return this.set(key, JSON.stringify(value), opts)
    },
    async delete(key) {
      map.delete(key)
    },
  }
}
