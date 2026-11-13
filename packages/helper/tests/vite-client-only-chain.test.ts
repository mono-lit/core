import { describe, expect, it } from 'vitest'
import { parse, compileScript } from 'vue/compiler-sfc'
import { NodeTypes as VueNodeTypes } from '@vue/compiler-dom'
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

describe('mono-client-only: AST contract', () => {
  it('Vue NodeTypes still match the values the plugin inlines', () => {
    const { ELEMENT, TEXT, COMMENT, ATTRIBUTE, DIRECTIVE } = VueNodeTypes
    expect({ ELEMENT, TEXT, COMMENT, ATTRIBUTE, DIRECTIVE }).toEqual({ ELEMENT: 1, TEXT: 2, COMMENT: 3, ATTRIBUTE: 6, DIRECTIVE: 7 })
  })

  it('wraps at the right offsets after a long <script> (template AST offsets are SFC-absolute)', async () => {
    const code = `<script setup lang="ts">\n${'// padding\n'.repeat(50)}const a = true\n</script>\n\n<template>\n<div>\n  <mono-chip/>\n  <mono-button>Go</mono-button>\n</div>\n</template>\n`
    const out = await transform(code)
    const tpl = out.slice(out.indexOf('<template>\n'))
    expect(tpl).toContain('<ClientOnly><mono-chip/>')
    expect(tpl).toContain('<ClientOnly><mono-button>Go</mono-button>')
    compiles(out)
  })
})
