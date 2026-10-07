// CLI wrapper around the local registry server.
//
//   REGISTRY_PUBLISH_TOKEN=dev-token pnpm registry:dev
//
// Storage is in-memory (fresh on each start). Publish against it with:
//   pnpm publish --registry=http://127.0.0.1:8873/npm/ --no-git-checks

import { startLocalRegistry } from './local-server.mjs'

if (!process.env.REGISTRY_PUBLISH_TOKEN) {
  process.env.REGISTRY_PUBLISH_TOKEN = 'dev-token'
  console.log('[registry] REGISTRY_PUBLISH_TOKEN not set — using default "dev-token"')
}

const portArg = process.argv.find((a) => a.startsWith('--port='))
const server = await startLocalRegistry({ port: Number(portArg?.slice(7) ?? 8873) })
console.log('[registry] press Ctrl+C to stop')
void server
