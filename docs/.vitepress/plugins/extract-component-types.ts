import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import ts from 'typescript'

/**
 * Extracts a props-reference table for every @mono-lit/helper component straight from
 * source, using the TypeScript compiler API. For each custom element (every
 * class decorated with `@customElement('mono-…')`) it finds the matching
 * `…Props` interface and emits one row per prop:
 *   - prop:        canonical camelCase name (the 3 attribute variants are merged)
 *   - value:       resolved type — union aliases are expanded to their literals
 *   - default:     read from the Lit class (field initializer or constructor)
 *   - description:  the prop's JSDoc comment on the interface field
 *
 * Components with several elements (table, breadcrumb, menu, chip) produce one
 * group per element. The result is consumed by the `virtual:mono-component-types`
 * Vite module (for <DemoTypes>) and by the llms-text injector.
 */

export interface TypeRow {
  prop: string
  value: string
  default: string
  description: string
}

export interface TypeGroup {
  /** Custom element tag, e.g. "mono-button", "mono-table-search". */
  element: string
  /** The props interface name, exported from '@mono-lit/helper' (e.g. "ButtonProps"). */
  interfaceName: string
  rows: TypeRow[]
}

export interface ComponentTypeDoc {
  groups: TypeGroup[]
}

const pluginDir = fileURLToPath(new URL('.', import.meta.url))
// plugins → .vitepress → docs → (repo root) → packages/helper
const monoHelperRoot = path.resolve(pluginDir, '../../../packages/helper')
const srcRoot = path.resolve(monoHelperRoot, 'src')
const componentsRoot = path.resolve(srcRoot, 'components')
const tsconfigPath = path.resolve(monoHelperRoot, 'tsconfig.json')

let cache: Record<string, ComponentTypeDoc> | null = null

/**
 * Folders that export a composable instead of a custom element, so the
 * `@customElement` scan below finds nothing for them. Each entry names the
 * interfaces to document and the label to show for the group — `controlMonoForm(options)`
 * rather than a tag, since there is no tag.
 */
const HEADLESS_GROUPS: Record<string, { label: string; interfaceName: string }[]> = {
  form: [
    { label: 'controlMonoForm(options)', interfaceName: 'MonoFormOptions' },
    { label: 'inputs[key]', interfaceName: 'MonoFormInput' },
    // `validates[]` is intentionally absent: MonoFormRule is a discriminated
    // union, not an interface, so a props table would show only the shared base
    // (timing/message/schema) and hide `type`, `value` and `validate`.
    { label: 'watcher(ctx)', interfaceName: 'MonoFormWatcherCtx' },
    { label: 'items()[key]', interfaceName: 'MonoFormItem' },
    { label: 'controller', interfaceName: 'MonoFormController' },
  ],
  modal: [
    { label: 'controlMonoModal(options)', interfaceName: 'MonoModalOptions' },
    { label: 'options.dialog', interfaceName: 'MonoDialogOptions' },
    { label: 'dialog.buttons[]', interfaceName: 'MonoDialogButton' },
    { label: 'controller', interfaceName: 'MonoModalController' },
    { label: 'controller.dialog', interfaceName: 'MonoDialogController' },
  ],
}

/**
 * Tags whose docs page is NOT named after their source folder. Keyed by tag so a
 * folder hosting several components can still document each one separately.
 */
const TAG_DOC_KEY: Record<string, string> = {
  'mono-button-dropdown': 'button-dropdown',
}

function pascalFromTag(tag: string) {
  return tag
    .replace(/^mono-/, '')
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

/** Component folder a source file belongs to (segment right after /components/). */
function folderOf(fileName: string): string | null {
  const norm = fileName.replaceAll('\\', '/')
  const marker = '/components/'
  const i = norm.indexOf(marker)
  if (i === -1) return null
  return norm.slice(i + marker.length).split('/')[0] || null
}

function getCustomElementTag(node: ts.ClassDeclaration): string | null {
  const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined
  if (!decorators) return null

  for (const dec of decorators) {
    if (!ts.isCallExpression(dec.expression)) continue
    const callee = dec.expression.expression
    if (ts.isIdentifier(callee) && callee.text === 'customElement') {
      const arg = dec.expression.arguments[0]
      if (arg && ts.isStringLiteralLike(arg)) return arg.text
    }
  }
  return null
}

/** Map of prop name → default-value text, from field initializers + constructor. */
function readDefaults(node: ts.ClassDeclaration): Record<string, string> {
  const defaults: Record<string, string> = {}

  const record = (name: string, init: ts.Expression | undefined) => {
    if (!init) return
    const text = init.getText().trim()
    if (text === 'undefined' || text === 'null') return
    defaults[name] = text
  }

  for (const member of node.members) {
    // class field: `size: AccordionSize = 'md'`
    if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
      record(member.name.text, member.initializer)
    }

    // constructor body: `this.size = 'md'`
    if (ts.isConstructorDeclaration(member) && member.body) {
      for (const stmt of member.body.statements) {
        if (!ts.isExpressionStatement(stmt)) continue
        const expr = stmt.expression
        if (
          ts.isBinaryExpression(expr) &&
          expr.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(expr.left) &&
          expr.left.expression.kind === ts.SyntaxKind.ThisKeyword
        ) {
          record(expr.left.name.text, expr.right)
        }
      }
    }
  }

  return defaults
}

/** Merge the camelCase / kebab / lowercase attribute variants down to one key. */
function canonicalKey(keys: string[]): string {
  // Prefer a camelCase form (has an interior uppercase letter).
  const camel = keys.find((k) => /[a-z][A-Z]/.test(k))
  if (camel) return camel
  // Otherwise prefer a single non-hyphenated word.
  const plain = keys.find((k) => !k.includes('-'))
  return plain ?? keys[0]
}

function formatType(type: ts.Type, checker: ts.TypeChecker): string {
  const parts = type.isUnion() ? type.types : [type]

  const strs: string[] = []
  for (const t of parts) {
    if (t.flags & ts.TypeFlags.Undefined) continue
    if (t.isStringLiteral()) strs.push(`'${t.value}'`)
    else if (t.isNumberLiteral()) strs.push(String(t.value))
    else if (t.flags & ts.TypeFlags.BooleanLiteral) {
      strs.push((t as any).intrinsicName) // 'true' | 'false'
    } else if (t.flags & ts.TypeFlags.Boolean) {
      strs.push('boolean')
    } else {
      // Strip `import("/abs/path").` prefixes that the checker emits for
      // types declared in other files (e.g. MonoTableController).
      const printed = checker
        .typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)
        .replace(/import\("[^"]*"\)\./g, '')
      strs.push(printed)
    }
  }

  // Collapse true | false → boolean.
  const set = new Set(strs)
  if (set.has('true') && set.has('false')) {
    set.delete('true')
    set.delete('false')
    set.add('boolean')
  }

  return [...set].join(' | ') || 'unknown'
}

function buildRows(
  iface: ts.InterfaceDeclaration,
  checker: ts.TypeChecker,
  defaults: Record<string, string>,
): TypeRow[] {
  const ifaceSymbol = iface.symbol ?? checker.getSymbolAtLocation(iface.name)
  if (!ifaceSymbol) return []

  // getPropertiesOfType includes inherited members (e.g. `dataGrid` from
  // TableControlBase), unlike iface.members which only has own declarations.
  const type = checker.getDeclaredTypeOfSymbol(ifaceSymbol)
  const props = checker.getPropertiesOfType(type)

  // Bucket by normalized name so the camelCase / kebab / lowercase attribute
  // variants collapse to a single canonical row.
  const buckets = new Map<string, { keys: string[]; symbol: ts.Symbol }>()

  for (const sym of props) {
    const name = sym.name
    const norm = name.replaceAll('-', '').toLowerCase()

    const bucket = buckets.get(norm)
    if (bucket) {
      bucket.keys.push(name)
      // Keep the symbol whose key wins as canonical (carries JSDoc/type).
      if (/[a-z][A-Z]/.test(name)) bucket.symbol = sym
    } else {
      buckets.set(norm, { keys: [name], symbol: sym })
    }
  }

  const rows: TypeRow[] = []
  for (const { keys, symbol } of buckets.values()) {
    const prop = canonicalKey(keys)
    const decl = symbol.valueDeclaration ?? symbol.declarations?.[0]
    if (!decl) continue

    const value = formatType(checker.getTypeOfSymbolAtLocation(symbol, decl), checker)
    const description = ts
      .displayPartsToString(symbol.getDocumentationComment(checker))
      .trim()

    rows.push({
      prop,
      value,
      default: defaults[prop] ?? '—',
      description: description || '—',
    })
  }

  return rows
}

function compute(): Record<string, ComponentTypeDoc> {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config ?? {},
    ts.sys,
    monoHelperRoot,
  )

  const program = ts.createProgram(parsed.fileNames, parsed.options)
  const checker = program.getTypeChecker()

  // Index every exported interface by name (across the whole src tree).
  const interfaces = new Map<string, ts.InterfaceDeclaration>()
  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile) continue
    if (!sf.fileName.replaceAll('\\', '/').includes('/src/')) continue
    ts.forEachChild(sf, (node) => {
      if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node)
    })
  }

  const result: Record<string, ComponentTypeDoc> = {}

  for (const sf of program.getSourceFiles()) {
    const folder = folderOf(sf.fileName)
    if (!folder) continue

    ts.forEachChild(sf, (node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return
      const tag = getCustomElementTag(node)
      if (!tag) return

      const className = node.name.text // e.g. "MonoButton"
      const rest = className.replace(/^Mono/, '') // "Button"
      const candidates = [
        `${rest}Props`,
        `Mono${rest}Props`,
        `${pascalFromTag(tag)}Props`,
        `Mono${pascalFromTag(tag)}Props`,
      ]

      const ifaceName = candidates.find((c) => interfaces.has(c))
      if (!ifaceName) return // no props interface — skip (e.g. helper-only elements)

      const rows = buildRows(interfaces.get(ifaceName)!, checker, readDefaults(node))
      if (!rows.length) return

      // Docs are keyed by folder, but a folder can host more than one component
      // — `mono-button-dropdown` lives in `components/button/` yet documents
      // itself on its own page. Route those to their own key so each page's
      // `<DemoTypes name="…">` finds only its own element.
      const docKey = TAG_DOC_KEY[tag] ?? folder

      ;(result[docKey] ??= { groups: [] }).groups.push({
        element: tag,
        interfaceName: ifaceName,
        rows,
      })
    })
  }

  // Stable group order: shorter tags (base elements) first, then alphabetical.
  for (const doc of Object.values(result)) {
    doc.groups.sort(
      (a, b) => a.element.length - b.element.length || a.element.localeCompare(b.element),
    )
  }

  // Composable-only folders. Appended AFTER the sort so their declared order is
  // preserved — these read as a narrative (options → inputs → rules → watcher →
  // items → controller), which alphabetising would scramble.
  for (const [folder, groups] of Object.entries(HEADLESS_GROUPS)) {
    for (const { label, interfaceName } of groups) {
      const iface = interfaces.get(interfaceName)
      if (!iface) {
        console.warn(`[extract-component-types] interface not found: ${interfaceName}`)
        continue
      }
      // No backing class, so there are no field initialisers to read defaults
      // from; the `default` column stays empty and the JSDoc carries the meaning.
      // `_`-prefixed members are the element-facing plumbing (`_report`,
      // `_register`, …) — internal, so keep them out of the public table.
      const rows = buildRows(iface, checker, {}).filter((r) => !r.prop.startsWith('_'))
      if (!rows.length) continue
      ;(result[folder] ??= { groups: [] }).groups.push({ element: label, interfaceName, rows })
    }
  }

  return result
}

export function extractComponentTypes(): Record<string, ComponentTypeDoc> {
  if (!cache) {
    if (!fs.existsSync(componentsRoot)) {
      console.warn('[extract-component-types] components root not found:', componentsRoot)
      cache = {}
    } else {
      cache = compute()
    }
  }
  return cache
}
