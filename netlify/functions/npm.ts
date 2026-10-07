// Netlify Function (v2) exposing the npm registry — for the packages it OWNS.
//
// Mounted on the owned names and the admin endpoint only, never on `/npm/*`:
// a consumer's `.npmrc` points its global `registry=` here (the packages are
// unscoped, so there is no narrower way), which sends every PUBLIC package in
// their tree to this host too. Those must not become function invocations —
// with the function on `/npm/*` each one was a Lambda round trip to npmjs,
// hundreds per install. Off these paths, netlify.toml's `/npm/*` redirect
// answers them at the edge with a 302 to registry.npmjs.org, which pnpm
// follows (and drops this host's token on the way — verified).
//
// The path list is derived from `MONO_PACKAGES`; netlify.toml carries the
// matching rewrites. All logic lives in netlify/registry/handler.ts, shared
// with the local dev server (scripts/registry/local-server.mjs).

import { handleRegistryRequest } from '../registry/handler.ts'
import { monoFunctionPaths } from '../registry/packages.ts'

export default async (req: Request): Promise<Response> => handleRegistryRequest(req)

export const config = { path: monoFunctionPaths() }
