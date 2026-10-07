import { describe, expect, it } from 'vitest'
import { parse, compileScript } from '@vue/compiler-sfc'
import { monoClientOnlyPlugin } from '../src/vite/mono-client-only'

async function transform(code: string): Promise<string> {
  const plugin = [monoClientOnlyPlugin({})].flat()[0] as any
  const fn = typeof plugin.transform === 'function' ? plugin.transform : plugin.transform.handler
  const out = await fn.call({ warn() {}, error(e: unknown) { throw e } }, code, '/app/Comp.vue')
  return typeof out === 'string' ? out : (out?.code ?? code)
}

const sfc = (template: string) => `<script setup lang="ts">\nconst a = true\nconst b = false\n</script>\n\n<template>\n${template}\n</template>\n`

function compiles(code: string): void {
  const { descriptor, errors } = parse(code, { filename: '/app/Comp.vue' })
  expect(errors).toEqual([])
  compileScript(descriptor, {
    id: 'x',
    inlineTemplate: true,
    templateOptions: { compilerOptions: { isCustomElement: (t) => t.startsWith('mono-') } },
  })
}

describe('mono-client-only: v-if chains', () => {
  it('keeps a v-else after a comment inside the same <ClientOnly>', async () => {
    const out = await transform(sfc(`<div>
  <template v-if="a">A</template>
  <mono-chip v-else-if="b">B</mono-chip>
  <!-- a note between branches -->
  <template v-else>C</template>
</div>`))
    const tpl = out.slice(out.indexOf('<template>\n'))
    // exactly one wrap, closing AFTER the v-else branch
    expect(tpl.match(/<ClientOnly>/g)?.length).toBe(1)
    expect(tpl.indexOf('</ClientOnly>')).toBeGreaterThan(tpl.indexOf('<template v-else>'))
    compiles(out)
  })

  it('still wraps a chain without comments as one unit', async () => {
    const out = await transform(sfc(`<div>
  <mono-chip v-if="a">A</mono-chip>
  <span v-else>B</span>
</div>`))
    const tpl = out.slice(out.indexOf('<template>\n'))
    expect(tpl.match(/<ClientOnly>/g)?.length).toBe(1)
    expect(tpl.indexOf('</ClientOnly>')).toBeGreaterThan(tpl.indexOf('<span v-else>'))
    compiles(out)
  })
})
