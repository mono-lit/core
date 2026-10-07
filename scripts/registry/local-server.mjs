// Local registry server: mounts the SAME handler as the Netlify function
// (lib/registry/handler.ts) on a plain Node HTTP server. Storage falls back
// to an in-memory store (see lib/registry/storage.ts), so local runs are
// fully hermetic. `netlify dev` uses the real Blobs API instead.

import { createServer } from 'node:http'

// Opt the shared handler into the in-memory store for plain local runs
// (production functions always use real Netlify Blobs).
process.env.MONO_REGISTRY_MEMORY = '1'

import { handleRegistryRequest } from '../../netlify/registry/handler.ts'

export function startLocalRegistry({ port = 8873, host = '127.0.0.1' } = {}) {
  const server = createServer((req, res) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('error', () => res.destroy())
    req.on('end', () => {
      const url = `http://${req.headers.host ?? `${host}:${port}`}${req.url ?? '/'}`
      const headers = new Headers()
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') headers.set(key, value)
        else if (Array.isArray(value)) headers.set(key, value.join(', '))
      }
      const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
      const request = new Request(url, {
        method: req.method,
        headers,
        body: body && methodHasBody(req.method) ? body : undefined,
        redirect: 'manual',
      })

      void handleRegistryRequest(request)
        .then(async (response) => {
          const buffer = Buffer.from(await response.arrayBuffer())
          const headersOut = {}
          response.headers.forEach((value, key) => {
            headersOut[key] = value
          })
          // `MONO_REGISTRY_LOG=1`: one line per request — what a client asked
          // for and what it got, redirects included. A failing install is only
          // diagnosable from this side.
          if (process.env.MONO_REGISTRY_LOG) {
            const to = headersOut.location ? ` → ${headersOut.location}` : ''
            console.log(`[registry] ${req.method} ${req.url} → ${response.status}${to}`)
          }
          res.writeHead(response.status, headersOut)
          res.end(buffer)
        })
        .catch((err) => {
          res.writeHead(502, { 'content-type': 'text/plain' })
          res.end(`registry error: ${err.message}`)
        })
    })
  })

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      console.log(`[registry] local server at http://${host}:${port}/npm/ (in-memory Blobs)`)
      resolvePromise(server)
    })
  })
}

function methodHasBody(method) {
  return method !== 'GET' && method !== 'HEAD'
}
