// @vitest-environment node
//
// The Basecoat port's provenance guard.
//
// @mono-lit/helper's component CSS is a port of Basecoat UI (vega). The vendor source
// we mirror is tracked under `src/data/theme/vendor/basecoat/` so a version bump
// is a readable diff, and every ported rule cites the upstream block it carries.
// This spec keeps those three things honest:
//   1. the tracked copy equals what `basecoat-css` (exact devDependency) installs,
//   2. the pin in package.json is exact and equals the vendored version,
//   3. every citation resolves to a real block at that version.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { check, readManifest } from '../scripts/basecoat-sync.mjs'
import { verify } from '../scripts/basecoat-cite.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('basecoat vendor tracking', () => {
  it('tracked copy matches the installed basecoat-css', () => {
    expect(check()).toEqual([])
  })

  it('basecoat-css is an exact devDependency pinned to the vendored version', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    const spec = pkg.devDependencies?.['basecoat-css']
    expect(spec, 'basecoat-css must be a devDependency').toBeTruthy()
    expect(spec, 'pin must be exact (no ^ or ~)').toMatch(/^\d+\.\d+\.\d+/)
    expect(spec).toBe(readManifest().version)
    expect(pkg.dependencies?.['basecoat-css']).toBeUndefined()
    expect(pkg.peerDependencies?.['basecoat-css']).toBeUndefined()
  })

  it('every basecoat citation resolves against the vendored version', () => {
    expect(verify()).toEqual([])
  })
})
