// @vitest-environment jsdom
//
// The light build paints `i-mdi-*` as a UnoCSS mask; a shadow root cannot use
// that mask (shadow-css.ts deliberately keeps icon rules out of utility
// adoption), so the shadow build draws the glyph inline. This asserts the two
// carriers hold the SAME artwork — the drift that made one `icon` prop show a
// different picture in each build.
//
// Drives the BUILT artifacts so it exercises what a consumer installs.
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { MDI_GLYPHS } from '../src/composables/mdi-glyphs'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('<mono-file-upload> glyph parity, light vs shadow', () => {
  beforeAll(async () => {
    await import('../dist/ui/file-upload.js')
    await import('../dist/ui/shadow/file-upload.js')
  })

  const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms))

  async function mount(tag: string, props: Record<string, unknown> = {}): Promise<any> {
    const el = document.createElement(tag) as any
    document.body.appendChild(el)
    for (const [k, v] of Object.entries(props)) el[k] = v
    await tick()
    return el
  }

  const rootOf = (el: any) =>
    (el.shadowRoot ?? el).querySelector('[mono-file-upload]') as HTMLElement

  /** The glyph's artwork: the mask's icon name (light) or the inline path (shadow). */
  function artwork(el: any, within: string): string {
    const glyph = rootOf(el).querySelector(`${within} [mono-glyph]`) as HTMLElement
    expect(glyph, `${el.tagName} ${within} has a glyph`).not.toBeNull()
    const svg = glyph.querySelector('svg')
    if (svg) return svg.innerHTML.replace(/<!--[^>]*-->/g, '').replace(/\s+/g, ' ').trim()
    const cls = [...glyph.classList].find((c) => c.startsWith('i-'))
    expect(cls, 'the light glyph carries an i-* class').toBeTruthy()
    return (MDI_GLYPHS[cls as string] ?? `(not bundled: ${cls})`).replace(/\s+/g, ' ').trim()
  }

  /** jsdom keeps attribute quoting/self-closing; compare the path data alone. */
  const paths = (markup: string) =>
    [...markup.matchAll(/\sd="([^"]*)"/g)].map((m) => m[1]).join('|')

  it('the dropzone prompt is the same drawing in both builds', async () => {
    const light = await mount('mono-file-upload', { placeholder: 'Drop' })
    const shadow = await mount('mono-shadow-file-upload', { placeholder: 'Drop' })
    const a = artwork(light, '[mono-icon]')
    const b = artwork(shadow, '[mono-icon]')
    expect(a).not.toMatch(/not bundled/)
    expect(paths(b)).toBe(paths(a))
    light.remove()
    shadow.remove()
  })

  it('a bundled iconify `icon` prop paints in the shadow build too', async () => {
    const light = await mount('mono-file-upload', { icon: 'i-mdi-cloud-upload' })
    const shadow = await mount('mono-shadow-file-upload', { icon: 'i-mdi-cloud-upload' })
    expect(paths(artwork(shadow, '[mono-icon]'))).toBe(paths(artwork(light, '[mono-icon]')))
    light.remove()
    shadow.remove()
  })

  it('the file-type thumb and the remove ✕ match, per file type', async () => {
    const files = [
      { id: 'a', name: 'spec.pdf', size: 1024, type: 'application/pdf' },
      { id: 'b', name: 'shot.png', size: 2048, type: 'image/png' },
      { id: 'c', name: 'book.xlsx', size: 4096, type: 'application/vnd.ms-excel' },
      { id: 'd', name: 'notes.txt', size: 8192, type: 'text/plain' },
    ]
    const light = await mount('mono-file-upload', { modelValue: files })
    const shadow = await mount('mono-shadow-file-upload', { modelValue: files })

    const rows = (el: any) => [...rootOf(el).querySelectorAll('[mono-item]')]
    expect(rows(light)).toHaveLength(files.length)
    expect(rows(shadow)).toHaveLength(files.length)

    for (let i = 0; i < files.length; i++) {
      const lg = rows(light)[i].querySelector('[mono-thumb] [mono-glyph]') as HTMLElement
      const sg = rows(shadow)[i].querySelector('[mono-thumb] [mono-glyph]') as HTMLElement
      const cls = [...lg.classList].find((c) => c.startsWith('i-')) as string
      const bundled = MDI_GLYPHS[cls]
      expect(bundled, `${files[i].name} → ${cls} is bundled`).toBeTruthy()
      expect(paths(sg.innerHTML), files[i].name).toBe(paths(bundled))
    }

    const lr = rows(light)[0].querySelector('[mono-remove] [mono-glyph]') as HTMLElement
    const sr = rows(shadow)[0].querySelector('[mono-remove] [mono-glyph]') as HTMLElement
    const rcls = [...lr.classList].find((c) => c.startsWith('i-')) as string
    expect(paths(sr.innerHTML)).toBe(paths(MDI_GLYPHS[rcls]))

    light.remove()
    shadow.remove()
  })

  it('the generated glyph map is in step with @iconify-json/mdi', () => {
    execFileSync(process.execPath, [path.join(PKG, 'scripts/mdi-glyphs.mjs'), '--check'], {
      cwd: PKG,
      stdio: 'pipe',
    })
  })
})
