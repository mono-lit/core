// Post-processor for `/llms.txt`. `vitepress-plugin-llmstxt` emits a flat,
// alphabetical list of bare `- [Title](url)` links. This runs AFTER it writes
// the file and:
//   1. appends each doc's summary → `- [Title](url): <summary>`,
//   2. regroups the links under the SAME sections as the site sidebar
//      (Mono-Repo → Mono-AI → Mono-UI → Example), in the sidebar's order,
//      so the index mirrors the on-site menu, and
//   3. keeps ONLY the `## LLMs links` section — an AI reads the raw `.md`, so the
//      parallel `## Web links` list of HTML pages is duplication. (llmstxt is also
//      configured with `llmsFile.indexTOC: 'only-llms'` so it never emits it; the
//      drop here is the belt-and-braces half.)
//   4. drops the `example/` demo pages entirely (EXCLUDED) — they stay on the
//      site, but a `### Example` group never reaches the llms.txt index.
//   5. puts the READ_FIRST doc (the migration guide) first: a notice at the top,
//      rank #1 in the reading order, its group leading the index — and moves
//      that page to the top of llms-full.txt too.
//
// The summary is the doc's frontmatter `description` if present, else the whole
// intro: every line from the top of the page up to (not including) the FIRST
// `##` heading — e.g. repo/config.md's summary ends right before `## Setup`.
// No length cap; structural noise inside the intro (fence / admonition markers,
// comments, HTML/component tags, list/quote prefixes) is dropped or unwrapped.
// So: NEW DOCS SHOULD OPEN WITH A CLEAR INTRO SECTION BEFORE THE FIRST `##`
// (or set a `description:` frontmatter). Runs only at build; idempotent (llmstxt
// rewrites a fresh flat file each build, this regroups it).
import type { Plugin, ResolvedConfig } from 'vite'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// This plugin lives at .vitepress/plugins/ → the docs source root is ../.. .
const DOCS_DIR = fileURLToPath(new URL('../..', import.meta.url))

/** `- [Title](url)` — optional trailing `): …` that may already hold a description. */
const LINK_RE = /^(\s*-\s+\[[^\]]+\]\()([^)]+)(\))(.*)$/

/**
 * Recommended reading order for an AI (normalized doc paths, most important first).
 * Index + 1 = the priority rank — reorder / extend this one list to change it. Docs
 * not listed here stay unflagged (reachable via the grouped index, read on demand).
 */
const READING_ORDER: string[] = [
  'migration', // package rename (mono-* → @mono-lit/*) — everything else assumes the new names
  'ai/template', // the contract the AI follows when writing code
  'ai/ref-llms', // read a library's official llms-full.txt before coding
  'repo/getting-started', // what the mono-repo is
  'repo/setup', // Host vs Remote roles
  'repo/config', // config file (cookies, JWT, deploy)
  'repo/env', // secrets in .env vs non-secret config in mono.env.ts; PORT/HTTPS in vite config
  'repo/data-fetching', // fetching setup
  'odata/datasource', // the reactive DataSource concept
  'repo/resolvers', // host-side stopgaps for a broken / not-ready remote
  'repo/template-changelog', // recent template changes (deps, env) + commits to pull
  'ui/getting-started', // Lit web-components intro
  'ui/theme', // theme + theme-color axes
  'ui/color', // the palette: color slots, tones, all six theme colors
  'ui/dom-type', // light vs shadow DOM builds
  'ai/skills', // the app's own knowledge/history repo (`skill` in mono.config.ts)
  'ai/prompting', // how to drive the assistant
]
const priorityMap = new Map<string, number>(READING_ORDER.map((p, i) => [p, i + 1]))

/**
 * The doc an AI must read before anything else. llms.txt gets a notice above
 * the reading order and lists its sidebar group first; llms-full.txt moves the
 * page to the very top, so a model reading either file top-down meets the
 * package rename before any page that uses the new names.
 */
const READ_FIRST = 'migration'
const READ_FIRST_GROUP = 'Migration'

/** Strip inline markdown to plain text and collapse to a single line. */
function clean(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links / images → text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/_([^_]+)_/g, '$1') // underscore emphasis
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A doc's summary: frontmatter `description`, else the whole intro — every line
 * from the top of the page up to (not including) the FIRST `##` heading (e.g.
 * repo/config.md's summary ends right before `## Setup`). Code blocks inside
 * the intro are NOT included — fenced ``` markers and their content are both
 * skipped. Structural noise (comments, HTML/component tags, admonition markers,
 * list/quote prefixes) is dropped or unwrapped; everything else is plain text.
 */
function extractSummary(md: string): string {
  let body = md

  // 1) Peel YAML frontmatter; prefer an explicit `description:`.
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/)
  if (fm) {
    const desc = fm[1].match(/^description:[ \t]*(.+?)[ \t]*$/m)
    if (desc) {
      const val = desc[1].replace(/^["']|["']$/g, '').trim()
      if (val) return clean(val)
    }
    body = body.slice(fm[0].length)
  }

  // 2) The intro: collect lines until the first `##` (or deeper) heading.
  //    Code-fence blocks are skipped entirely — marker lines AND content.
  const para: string[] = []
  let inFence = false
  for (const raw of body.split(/\r?\n/)) {
    const t = raw.trim()
    if (t.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue // inside a code block — not "text"
    if (/^#{2,}\s/.test(t)) break // first section heading — end of the intro
    if (!t || t.startsWith('#')) continue // blank line + the H1 itself
    if (t.startsWith('<!--')) continue // invisible comments
    if (t.startsWith('<')) continue // HTML / component tags render no prose
    if (t.startsWith('|') || t.startsWith('[[')) continue // tables / wikilinks
    if (t.startsWith(':::')) {
      // Admonition marker — keep a trailing custom title, drop the rest.
      const title = t.replace(/^::+\s*\w*\s*:?\s*/, '').trim()
      if (title) para.push(title)
      continue
    }
    // Unwrap structural prefixes: blockquotes, bullets, numbered items.
    const unwrapped = t.replace(/^(?:>\s*|[-*+]\s+|\d+[.)]\s+)+/i, '')
    para.push(unwrapped || t)
  }
  return clean(para.join(' '))
}

/** Doc paths dropped from the llms.txt index entirely (they stay on the site). */
const EXCLUDED = /^(example)(\/|$)/ // visual demo canvases — not AI reading material

/** True when a doc path is dropped from the llms.txt index. */
const isExcluded = (path: string): boolean => EXCLUDED.test(path)

/** Normalize a link/URL path to a comparable key (no host, no `.md`, no slashes). */
function normPath(p: string): string {
  return (
    p
      .replace(/\\/g, '/') // win32 join artifact
      .replace(/^\/+/, '')
      .replace(/\.md$/i, '')
      .replace(/\/+$/, '') || 'index'
  )
}

/** The path key for an llms.txt link URL (matches sidebar link paths). */
function urlToPath(url: string): string | null {
  try {
    return normPath(new URL(url.replace(/\\/g, '/')).pathname)
  } catch {
    return null
  }
}

/** Clean an llms.txt URL (win32 `\` join artifact → real path slashes). */
function fixUrl(url: string): string {
  return url.replace(/\\/g, '/').replace(/([^:])\/{2,}/g, '$1/')
}

/** Extract `{ title, url, path }` from a `- [Title](url)` line. */
function parseLink(line: string): { title: string; url: string; path: string } | null {
  const m = line.match(/^\s*-\s+\[([^\]]+)\]\(([^)]+)\)/)
  if (!m) return null
  const path = urlToPath(m[2])
  return path ? { title: m[1], url: m[2], path } : null
}

type SidebarItem = { text?: string; link?: string; items?: SidebarItem[] }

/** Flatten one sidebar group into its ordered leaf paths (depth-first). */
function collectPaths(items: SidebarItem[] | undefined, acc: string[]): void {
  for (const it of items ?? []) {
    if (it.link) acc.push(normPath(it.link))
    if (it.items) collectPaths(it.items, acc)
  }
}

/** Ordered top-level sidebar groups → their ordered doc paths. */
function sidebarGroups(sidebar: unknown): Array<{ text: string; paths: string[] }> {
  let groups: SidebarItem[] = []
  if (Array.isArray(sidebar)) groups = sidebar as SidebarItem[]
  else if (sidebar && typeof sidebar === 'object')
    groups = Object.values(sidebar as Record<string, SidebarItem[]>).flat()
  const out = groups.map((g) => {
    const paths: string[] = []
    if (g.link) paths.push(normPath(g.link))
    collectPaths(g.items, paths)
    return { text: g.text ?? '', paths }
  })
  // The read-first group leads the index, whatever its place in the sidebar.
  const first = out.findIndex((g) => g.text === READ_FIRST_GROUP)
  if (first > 0) out.unshift(...out.splice(first, 1))
  return out
}

/**
 * Move the READ_FIRST page to the top of llms-full.txt. llmstxt concatenates
 * every page as `---\nURL: "…"\n…\n---\n<page>`, so a page runs from its
 * `URL:` block's opening `---` up to the next page's.
 */
function moveReadFirstToTop(fullTxt: string): void {
  if (!existsSync(fullTxt)) return
  const lines = readFileSync(fullTxt, 'utf8').split(/\r?\n/)
  const starts: number[] = []
  for (let i = 1; i < lines.length; i++) {
    if (lines[i - 1].trim() === '---' && /^URL:\s*"/.test(lines[i])) starts.push(i - 1)
  }
  const idx = starts.findIndex((s) => {
    const url = lines[s + 1].match(/^URL:\s*"([^"]+)"/)?.[1]
    return url ? urlToPath(url) === READ_FIRST : false
  })
  if (idx <= 0) return // missing, or already first
  const from = starts[idx]
  const to = starts[idx + 1] ?? lines.length
  const page = lines.slice(from, to)
  while (page.length && page[page.length - 1].trim() === '') page.pop()
  const rest = [...lines.slice(0, from), ...lines.slice(to)]
  const head = rest.slice(0, starts[0])
  const out = [...head, ...page, '', '', ...rest.slice(starts[0])]
  writeFileSync(fullTxt, out.join('\n'), 'utf8')
}

export function llmsDescriptionsPlugin(): Plugin {
  const cache = new Map<string, string>() // source file → summary
  let wrapped = false

  const summaryFor = (file: string): string => {
    if (cache.has(file)) return cache.get(file)!
    let s = ''
    try {
      s = extractSummary(readFileSync(file, 'utf8'))
    } catch {
      /* unreadable — leave blank */
    }
    cache.set(file, s)
    return s
  }

  /**
   * Normalize a link line: fix the win32 `\` path-join artifact in the URL
   * (`/\ui\switch.md` → `/ui/switch.md`), add a `[read #N]` reading-priority flag
   * (if the doc is in READING_ORDER), and append a `: summary`. Unchanged if not a
   * link or already processed (but the URL is still fixed).
   */
  const describe = (line: string, srcDir: string): string => {
    const m = line.match(LINK_RE)
    if (!m) return line
    const [, head, url, close, rest] = m
    const base = `${head}${fixUrl(url)}${close}`
    // Already processed (carries a `[read #…]` flag and/or `: description`) → just
    // fix the URL; never double-append.
    if (rest.trim()) return `${base}${rest}`
    const path = urlToPath(url)
    if (!path) return base
    const rank = priorityMap.get(path)
    const flag = rank ? ` [read #${rank}]` : ''
    const file = join(srcDir, `${path}.md`)
    if (!existsSync(file)) return `${base}${flag}`
    const summary = summaryFor(file)
    return summary ? `${base}${flag}: ${summary}` : `${base}${flag}`
  }

  /**
   * The top "Recommended reading order (for AI)" section, from READING_ORDER.
   * Built from the `## LLMs links` bodies so it points at the raw `.md` URLs an
   * AI actually fetches (not the human web pages).
   */
  const buildReadingOrder = (llmBody: string[], srcDir: string): string[] => {
    const byPath = new Map<string, { title: string; url: string }>()
    for (const line of llmBody) {
      const p = parseLink(line)
      if (p && !byPath.has(p.path)) byPath.set(p.path, { title: p.title, url: p.url })
    }
    const items: string[] = []
    for (const path of READING_ORDER) {
      const link = byPath.get(path)
      if (!link) continue
      const rank = priorityMap.get(path)! // path is from READING_ORDER → always ranked
      const file = join(srcDir, `${path}.md`)
      const summary = existsSync(file) ? summaryFor(file) : ''
      items.push(`${rank}. [${link.title}](${fixUrl(link.url)})${summary ? `: ${summary}` : ''}`)
    }
    return items.length
      ? ['## Recommended reading order (for AI)', '', 'Read these first, in order:', '', ...items]
      : []
  }

  /** Reorder a section's link lines into sidebar groups (with `### <group>` headers). */
  const regroup = (
    bodyLines: string[],
    groups: Array<{ text: string; paths: string[] }>,
    srcDir: string,
  ): string[] => {
    const byPath = new Map<string, string>()
    const order: string[] = []
    for (const line of bodyLines) {
      const m = line.match(LINK_RE)
      if (!m) continue
      const path = urlToPath(m[2])
      if (!path || byPath.has(path)) continue
      if (isExcluded(path)) continue // dropped sections — never reach the index
      byPath.set(path, describe(line, srcDir))
      order.push(path)
    }
    const used = new Set<string>()
    const out: string[] = []
    // Ungrouped links (e.g. home) first, keeping their original order.
    for (const p of order) {
      if (!groups.some((g) => g.paths.includes(p))) {
        out.push(byPath.get(p)!)
        used.add(p)
      }
    }
    // Then each sidebar group, in sidebar order.
    for (const g of groups) {
      const lines: string[] = []
      for (const p of g.paths) {
        if (byPath.has(p) && !used.has(p)) {
          lines.push(byPath.get(p)!)
          used.add(p)
        }
      }
      if (lines.length) out.push('', `### ${g.text}`, '', ...lines)
    }
    return out
  }

  const postProcess = (outDir: string, srcDir: string, sidebar: unknown): void => {
    try {
      moveReadFirstToTop(join(outDir, 'llms-full.txt'))
    } catch {
      /* ignore — non-fatal for the build */
    }
    const txt = join(outDir, 'llms.txt')
    if (!outDir || !srcDir || !existsSync(txt)) return
    try {
      const lines = readFileSync(txt, 'utf8').split(/\r?\n/)
      const groups = sidebarGroups(sidebar).filter((g) => g.paths.length)
      const webIdx = lines.findIndex((l) => l.trim() === '## Web links')
      const llmIdx = lines.findIndex((l) => l.trim() === '## LLMs links')

      // Fallback: no sidebar or no LLMs section → just add descriptions in place
      // (excluded paths are dropped outright).
      if (!groups.length || llmIdx === -1) {
        const out = lines
          .filter((l) => {
            const p = parseLink(l)
            return !p || !isExcluded(p.path)
          })
          .map((l) => describe(l, srcDir))
        writeFileSync(txt, out.join('\n'), 'utf8')
        return
      }

      // `## Web links` is dropped (see the file header). It should not be emitted
      // at all (`llmsFile.indexTOC: 'only-llms'`), but if it is, it precedes the
      // LLMs section — cut the header at whichever heading comes first.
      const headEnd = webIdx !== -1 && webIdx < llmIdx ? webIdx : llmIdx
      const header = lines.slice(0, headEnd)
      while (header.length && header[header.length - 1].trim() === '') header.pop()
      const llmBody = lines.slice(llmIdx + 1)

      const readingOrder = buildReadingOrder(llmBody, srcDir)

      // A notice above everything else, pointing at the read-first doc.
      const readFirst = llmBody.map(parseLink).find((p) => p?.path === READ_FIRST)
      const notice = readFirst
        ? [
            '',
            `> **Read first:** [${readFirst.title}](${fixUrl(readFirst.url)}). The packages were renamed ` +
              '(`mono-helper` → `@mono-lit/helper`, `mono-utils` → `@mono-lit/utility`, ' +
              '`mono-devextreme` → `@mono-lit/devextreme`) and every page below uses the new names. ' +
              'If the code you are working on still imports `mono-*`, migrate it before following any other page.',
          ]
        : []

      const out = [
        ...header,
        ...notice,
        ...(readingOrder.length ? ['', ...readingOrder] : []),
        '',
        '## LLMs links',
        ...regroup(llmBody, groups, srcDir),
        '',
      ]
      // Collapse any accidental blank runs.
      writeFileSync(txt, out.join('\n').replace(/\n{3,}/g, '\n\n'), 'utf8')
    } catch {
      /* ignore — non-fatal for the build */
    }
  }

  return {
    name: 'mono-llms-descriptions',
    // llmstxt writes llms.txt inside a wrapped VitePress `buildEnd`. Since this
    // plugin is registered LAST, its `configResolved` runs after llmstxt's, so
    // `vp.buildEnd` is already llmstxt's writer — wrap it once more to run our
    // post-process AFTER the index is written.
    configResolved(config: ResolvedConfig) {
      const vp = (config as any).vitepress
      if (!vp || wrapped) return
      wrapped = true
      const srcDir: string = vp.srcDir || DOCS_DIR
      const prev = vp.buildEnd as ((siteConfig: any) => unknown) | undefined
      vp.buildEnd = async (siteConfig: any) => {
        await prev?.(siteConfig) // llmstxt writes llms.txt here
        const sidebar = siteConfig?.site?.themeConfig?.sidebar ?? vp?.site?.themeConfig?.sidebar
        postProcess(siteConfig?.outDir ?? vp.outDir ?? '', srcDir, sidebar)
      }
    },
  }
}
