import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { extractComponentTypes } from './extract-component-types'

const vitepressDir = fileURLToPath(new URL('..', import.meta.url))
// this file is docs/.vitepress/plugins/patch-llms-demo-source.ts
// vitepressDir = docs/.vitepress

// Demos live in docs/demos (one level ABOVE .vitepress), not docs/.vitepress/demos.
const demosRoot = path.resolve(vitepressDir, '..', 'demos')

function readIfExists(file: string) {
  return fs.existsSync(file)
    ? fs.readFileSync(file, 'utf-8').trim()
    : ''
}

function fence(code: string, lang = 'vue') {
  return `\`\`\`${lang}
${code.replaceAll('```', '``\\`')}
\`\`\``
}

function readDemoSource(name: string, id: string) {
  const vuePath = path.join(demosRoot, name, 'vue', `${id}.vue`)
  const cssPath = path.join(demosRoot, name, 'css', `${id}.vue`)

  const vueCode = readIfExists(vuePath)
  const cssCode = readIfExists(cssPath)

  const blocks: string[] = []

  if (vueCode) {
    blocks.push(`Vue demo source:\n\n${fence(vueCode, 'vue')}`)
  }

  if (cssCode) {
    blocks.push(`CSS/native demo source:\n\n${fence(cssCode, 'vue')}`)
  }

  if (!blocks.length) {
    console.warn('[llms-demo-source] source not found', {
      name,
      id,
      vuePath,
      cssPath,
    })
  }

  return blocks.join('\n\n')
}

/**
 * Replace every `<DemoSingle name="…" id="…" />` tag in `content` with the
 * actual Vue (and CSS) demo source read from docs/demos/<name>/{vue,css}/<id>.vue.
 * The tag itself is dropped — only the fenced source remains. When no source is
 * found the tag is left in place so the omission is visible rather than silent.
 */
export function injectDemoSource(content: string) {
  const demoSingleRE =
    /<DemoSingle\b(?=[^>]*\bname=["']([^"']+)["'])(?=[^>]*\bid=["']([^"']+)["'])[^>]*\/>/g

  return content.replace(demoSingleRE, (full, name, demoId) => {
    const demoSource = readDemoSource(name, demoId)
    return demoSource || full
  })
}

function mdCell(text: string) {
  // Escape table-breaking characters for a GFM cell.
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

/**
 * Replace every `<DemoTypes name="…" />` tag with a GFM props table built from
 * the same metadata <DemoTypes> renders (prop | value | default | description).
 * Multi-element components get one `### <element>` heading + table per group.
 */
export function injectTypesTable(content: string) {
  const demoTypesRE = /<DemoTypes\b(?=[^>]*\bname=["']([^"']+)["'])[^>]*\/>/g

  return content.replace(demoTypesRE, (full, name) => {
    const doc = extractComponentTypes()[name]
    if (!doc?.groups.length) return full

    const grouped = doc.groups.length > 1
    const ifaceNames = [...new Set(doc.groups.map((g) => g.interfaceName))]
    const importBlock = `\`\`\`ts\nimport { ${ifaceNames.join(', ')} } from '@mono-lit/helper'\n\`\`\``
    const blocks = doc.groups.map((group) => {
      const head = grouped ? `### \`<${group.element}>\`\n\n` : ''
      const rows = group.rows
        .map(
          (r) =>
            `| \`${mdCell(r.prop)}\` | \`${mdCell(r.value)}\` | ${
              r.default === '—' ? '—' : `\`${mdCell(r.default)}\``
            } | ${mdCell(r.description)} |`,
        )
        .join('\n')
      return `${head}| Prop | Value | Default | Description |\n| --- | --- | --- | --- |\n${rows}`
    })

    return `${importBlock}\n\n${blocks.join('\n\n')}`
  })
}

/**
 * `transform` hook for vitepress-plugin-llmstxt. Runs once per generated output
 * page — including the concatenated `llms-full.txt` — so demo source and props
 * tables land in every LLM artifact. Must return the (possibly modified) page.
 */
export function llmsDemoTransform({ page }: { page: { content: string; [k: string]: any } }) {
  return { ...page, content: injectTypesTable(injectDemoSource(page.content)) }
}
