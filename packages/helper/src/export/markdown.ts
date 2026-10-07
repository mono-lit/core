/**
 * Markdown stage — turn the rendered template into an mdast tree that renderers
 * can walk, and flatten inline nodes back into text + formatting flags.
 */

import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import type { Root, RootContent, PhrasingContent } from 'mdast'
import { extractDirectives, type MonoExportDirective } from './sentinel'

export type { Root, RootContent }

/**
 * One processor for the whole module. `.parse()` is stateless, and building a
 * remark pipeline is not free — the old code built a fresh one on every call.
 */
const processor = remark().use(remarkGfm)

/** A table row: up to three leading spaces, then a pipe. */
const TABLE_ROW_RE = /^ {0,3}\|/
/** The delimiter row under a table's header (`| --- | ---: |`). */
const DELIMITER_RE = /^ {0,3}\|?(?: *:?-+:? *\|)+ *:?-+:? *\|? *$/
/**
 * Characters that make a cell worth handing to the real inline parser.
 *
 * Everything else — the overwhelming majority of report cells — is literal text
 * and can skip it. The sentinel codepoints (U+E000/U+E001) are deliberately NOT
 * here: they are extracted downstream by `flattenInline`, straight off a plain
 * text node's value.
 */
const INLINE_SYNTAX_RE = /[\\`*_[\]<>~&]/

/**
 * Parse rendered Markdown into an mdast tree, with GFM tables enabled.
 *
 * ── Why the table body does not go through remark ────────────────────────────
 *
 * remark-gfm's table parsing degrades super-linearly on the tables a REPORT
 * produces. Measured on a 13-column export: 500 rows took 3.8s, 1 000 took 13.5s
 * and 2 000 took 86s — doubling the rows more than quadrupled the time, and a
 * 7 000-row export never finished at all. It is the whole of the export's cost;
 * ExcelJS serialises the same workbook in ~200ms.
 *
 * The markdown a template produces is not arbitrary CommonMark, though: it is
 * machine-generated and line-regular, one row per line, and the report helpers
 * already escape any `|` inside a value (see `escapeCellText`). So table blocks
 * are read line-by-line here — linear, and no micromark involved — while every
 * other construct (headings, paragraphs, lists) is still handed to remark, which
 * is both correct and cheap because those parts are tiny.
 *
 * Inline fidelity is kept per cell: a cell containing markdown syntax
 * (`**bold**`, `[text](url)`, an image) is still parsed by remark, so links and
 * emphasis behave exactly as before. Only plain cells take the fast path.
 */
export function parseMarkdown(md: string): Root {
  const lines = md.split('\n')
  const children: RootContent[] = []
  /** Non-table lines waiting to be handed to remark in one batch. */
  let buffer: string[] = []

  const flushBuffer = (): void => {
    if (!buffer.length) return
    const text = buffer.join('\n')
    buffer = []
    if (!text.trim()) return
    children.push(...(processor.parse(text) as Root).children)
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    // A table starts at a pipe row whose NEXT line is a delimiter. Anything else
    // beginning with a pipe is just text, and remark should have it.
    const isTableStart =
      TABLE_ROW_RE.test(line) &&
      i + 1 < lines.length &&
      DELIMITER_RE.test(lines[i + 1])

    if (!isTableStart) {
      buffer.push(line)
      continue
    }

    flushBuffer()

    const align = readAlignments(lines[i + 1])
    const rows: string[] = [line]
    let j = i + 2
    for (; j < lines.length && TABLE_ROW_RE.test(lines[j]); j += 1) rows.push(lines[j])
    i = j - 1

    children.push({
      type: 'table',
      align,
      children: rows.map((row, index) => ({
        type: 'tableRow',
        children: splitCells(row).map((cell) => ({
          type: 'tableCell',
          children: parseCell(cell),
        })),
        // mdast has no header flag — the first row IS the header, as in remark.
        ...(index === 0 ? {} : {}),
      })),
    } as unknown as RootContent)
  }

  flushBuffer()
  return { type: 'root', children } as Root
}

/** `| :--- | ---: | :---: |` → the per-column alignment mdast records. */
function readAlignments(delimiter: string): Array<'left' | 'right' | 'center' | null> {
  return splitCells(delimiter).map((cell) => {
    const text = cell.trim()
    const left = text.startsWith(':')
    const right = text.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    if (left) return 'left'
    return null
  })
}

/**
 * Split one table row into its cells on UNESCAPED pipes.
 *
 * The leading and trailing pipes a GFM row is written with produce empty edge
 * fields, which are dropped — a cell that is genuinely empty still survives
 * because only the outermost pair goes.
 */
function splitCells(row: string): string[] {
  const cells: string[] = []
  let current = ''

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i]
    if (char === '\\' && i + 1 < row.length) {
      // Keep the escape; `parseCell` unescapes once, the way remark does.
      current += char + row[i + 1]
      i += 1
      continue
    }
    if (char === '|') {
      cells.push(current)
      current = ''
      continue
    }
    current += char
  }
  cells.push(current)

  if (cells.length && !cells[0].trim()) cells.shift()
  if (cells.length && !cells[cells.length - 1].trim()) cells.pop()
  return cells
}

/**
 * One cell's inline children.
 *
 * Plain text — which is nearly every cell in a report — becomes a single text
 * node with the backslash escapes resolved, exactly what remark would have
 * produced. A cell carrying real markdown is parsed properly instead.
 */
function parseCell(cell: string): PhrasingContent[] {
  const text = cell.trim()
  if (!text) return []

  if (!INLINE_SYNTAX_RE.test(text)) {
    return [{ type: 'text', value: text }]
  }

  const root = processor.parse(text) as Root
  const first = root.children[0]
  if (first && first.type === 'paragraph') return first.children as PhrasingContent[]

  // Not phrasing content (a cell that looks like a block) — keep it as text
  // rather than dropping it.
  return [{ type: 'text', value: unescapeCell(text) }]
}

/** Resolve the backslash escapes the report helpers added, as remark does. */
function unescapeCell(text: string): string {
  return text.replace(/\\([\\`*_[\]<>~|])/g, '$1')
}

/** Inline formatting collected while flattening a run of phrasing content. */
export interface InlineText {
  text: string
  bold: boolean
  italic: boolean
  code: boolean
  strike: boolean
  /** Directives found anywhere in the run. */
  directives: MonoExportDirective[]
  /** Images found in the run (from `![alt](src)` — `{{image}}` is a directive). */
  images: Array<{ url: string; alt?: string }>
  /** The first link URL in the run, if any. */
  link?: string
}

/**
 * Flatten phrasing content (the inline children of a cell, heading, paragraph
 * or list item) into one string plus the formatting that applies to it.
 *
 * Excel styles a cell as a whole rather than per character run, so mixed
 * emphasis collapses to "was there any bold/italic in here" — matching what a
 * report author actually expects from `| **Total** | 123 |`.
 */
export function flattenInline(nodes: readonly PhrasingContent[] | undefined): InlineText {
  const acc: InlineText = {
    text: '',
    bold: false,
    italic: false,
    code: false,
    strike: false,
    directives: [],
    images: [],
  }
  walkInline(nodes ?? [], acc)
  const { text, directives } = extractDirectives(acc.text)
  acc.text = unescapeMarkdown(text)
  acc.directives = directives
  return acc
}

function walkInline(nodes: readonly PhrasingContent[], acc: InlineText): void {
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        acc.text += node.value
        break
      case 'inlineCode':
        acc.code = true
        acc.text += node.value
        break
      case 'strong':
        acc.bold = true
        walkInline(node.children, acc)
        break
      case 'emphasis':
        acc.italic = true
        walkInline(node.children, acc)
        break
      case 'delete':
        acc.strike = true
        walkInline(node.children, acc)
        break
      case 'link':
        acc.link ??= node.url
        walkInline(node.children, acc)
        break
      case 'image':
        acc.images.push({ url: node.url, alt: node.alt ?? undefined })
        break
      case 'break':
        acc.text += '\n'
        break
      default:
        if ('children' in node) walkInline(node.children as PhrasingContent[], acc)
        else if ('value' in node) acc.text += String(node.value)
    }
  }
}

/**
 * Undo the escaping the `esc` helper applied for the Markdown layer. remark
 * already resolves `\|` inside table cells, but a `<br>` we inserted for a
 * newline has to come back as a real line break for Excel's wrap-text.
 */
function unescapeMarkdown(text: string): string {
  return text
    // The fast table path keeps a cell's backslash escapes in its text node, so
    // they are resolved here — remark used to do it during parsing.
    .replace(/\\([\\`*_[\]<>~|])/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
}
