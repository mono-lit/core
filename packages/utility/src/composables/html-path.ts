import fs from 'node:fs'
import path, { resolve } from 'node:path'

export function htmlPath({ dir, dirname }: { dir: string; dirname: string }) {
  const absDir = resolve(dirname, dir)
  const entries: Record<string, string> = {}

  for (const name of fs.readdirSync(absDir)) {
    if (!name.endsWith('.html')) continue
    const full = path.join(absDir, name)
    const key = name.replace(/\.html$/, '')
    entries[key] = full
  }

  return entries
}