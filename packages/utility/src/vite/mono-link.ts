import { remoteGate, type MonoRemoteGateOptions } from './remote-matcher'
import type { Plugin } from 'vite'
import type { MonoPageMetaPluginOptions } from './mono-pagemeta'

export interface MonoLinkPluginOptions extends MonoPageMetaPluginOptions {
  /**
   * Give an external link `rel="noopener noreferrer"` when it has no `rel` of its
   * own (what `<NuxtLink external>` does). Default true; `no-rel` on the source
   * tag opts out per-link.
   */
  externalRel?: boolean
}

/** `<Tag` / `</Tag` for the tags we rewrite — the lookahead keeps `<NuxtLinkFoo` out. */
const tagRe = (names: string[]) =>
  new RegExp(`<(/?)(${names.join('|')})(?=[\\s/>])`, 'g')

/** One attribute: `name`, `name="v"`, `:name="v"`, `@click.prevent="v"`, `v-if="v"`. */
const ATTR_RE = /([^\s"'=<>/]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g

/** `https:` / `mailto:` / `tel:` / `//cdn…` — anything vue-router would mangle into a path. */
const ABSOLUTE_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

/** Nuxt-only props: meaningless on `<RouterLink>`, and worse on a plain `<a>` (they'd render as DOM attributes). */
const NUXT_ONLY = ['external', 'prefetch', 'noprefetch', 'prefetchon', 'prefetchedclass', 'norel', 'trailingslash']

/** Router props on top of those — a plain `<a>` understands none of them. */
const ROUTER_ONLY = ['replace', 'activeclass', 'exactactiveclass', 'ariacurrentvalue', 'custom', 'viewtransition']

interface Attr {
  /** Exact source text, e.g. `:to="path"`. */
  raw: string
  /** Offsets of `raw` within the tag's attribute source. */
  start: number
  end: number
  /** Everything before the bare prop: `''`, `':'`, `'.'`, `'v-bind:'`. */
  prefix: string
  /** The bare prop name as written, e.g. `to`, `active-class`. */
  prop: string
  /** Trailing modifiers incl. the dot, e.g. `.prevent`. */
  suffix: string
  /** `="…"` (or `=v`) exactly as written; `''` for a valueless attribute. */
  valuePart: string
  /** Case/dash-insensitive prop key for matching; `''` for directives/events/slots. */
  key: string
  /** `:x` / `v-bind:x` / `.x` — the value is an expression, not a literal. */
  bound: boolean
}

/**
 * Vite plugin: `<NuxtLink>` -> `<RouterLink>` (or `<a>`) for a Vue/Vite host.
 *
 * A synced Nuxt remote links with `<NuxtLink to="/x">`, which Nuxt auto-imports.
 * The Vue host has no such component, so Vue logs `Failed to resolve component:
 * NuxtLink` and renders nothing. This rewrites the tag in remote templates:
 *
 *  - `<NuxtLink to="/x">`          -> `<RouterLink to="/x">`
 *  - `<NuxtLink external to="/x">` -> `<RouterLink to="/x" target="_blank" rel="noopener noreferrer">`
 *  - `<NuxtLink to="https://…">`   -> `<a href="https://…" rel="noopener noreferrer">`
 *
 * `external` stays a RouterLink because vue-router's `guardEvent` won't intercept
 * a click on a targeted anchor — the browser navigates for real, which is what
 * `external` means, and `to` still resolves as a route. An ABSOLUTE `to` is the
 * one case that can't: `router.resolve('https://x.dev')` treats it as a path and
 * renders `href="/https://x.dev"`, so those become a real `<a>` (with
 * `target="_blank"` too when the tag also said `external`).
 *
 * Nuxt-only props (`prefetch`, `no-rel`, `trailing-slash`, …) are dropped rather
 * than passed through, or they'd land on the DOM as literal attributes. `href` is
 * renamed to `to` (NuxtLink accepts both), and for the `<a>` form `to` becomes
 * `href`. Everything else — `class`, `target`, `@click`, `v-if`, slots — is left
 * exactly as written, and `</NuxtLink>` follows whatever its opening tag became.
 *
 * Case is preserved: `<nuxt-link>` -> `<router-link>`. `RouterLink` is registered
 * globally by `app.use(router)`, so nothing needs importing.
 *
 * LIMITS (both warn at build time rather than mis-compiling): a computed
 * `:external="cond"` can't be resolved here, so the link stays in-app (no
 * `target`); and a `custom` NuxtLink gets neither treatment, since it renders no
 * element of its own — only the `v-slot="{ href, navigate }"` content.
 *
 * `enforce: 'pre'` — the SFC must still be raw source, so register before
 * `@vitejs/plugin-vue` (`monoVue()` / `monoRepo().nuxt().hostResolver()` do).
 */
export function monoNuxtLinkToRouterLink(options: MonoLinkPluginOptions = {}): Plugin {
  const isRemote = remoteGate(options)
  const externalRel = options.externalRel !== false

  return {
    name: 'mono-nuxt-link-to-router-link',
    enforce: 'pre',
    transform(code: string, id: string) {
      const file = id?.split('?')[0]?.replace(/\\/g, '/')
      if (!file || !file.endsWith('.vue') || !isRemote(file)) return
      if (!/<\/?(?:NuxtLink|nuxt-link)[\s/>]/.test(code)) return

      const warn = (message: string) => this.warn(`[mono-link] ${file}: ${message}`)
      const out = rewriteTags(code, ['NuxtLink', 'nuxt-link'], (name, attrsSrc) =>
        renderNuxtLink(name, attrsSrc, externalRel, warn),
      )
      return out === code ? undefined : { code: out, map: null }
    },
  }
}

/**
 * Vite plugin (Nuxt host): `<RouterLink>` -> `<NuxtLink>` for synced **Vue**
 * remotes — the mirror of {@link monoNuxtLinkToRouterLink}, registered by
 * `@mono-lit/utility/nuxt`.
 *
 * `<RouterLink>` does resolve under Nuxt (vue-router registers it), so this isn't
 * a fix for a broken render — it's so remote links behave like the host's own:
 * route prefetching, external/absolute-URL handling, and `trailingSlash`
 * normalisation, none of which RouterLink does. Every RouterLink prop (`to`,
 * `replace`, `active-class`, `exact-active-class`, `custom`, `aria-current-value`)
 * is a NuxtLink prop too, so this is a pure tag rename — attributes, slots and
 * `v-slot` bindings pass through untouched. Case is preserved:
 * `<router-link>` -> `<nuxt-link>`.
 */
export function monoRouterLinkToNuxtLink(options: MonoLinkPluginOptions = {}): Plugin {
  const isRemote = remoteGate(options)

  return {
    name: 'mono-router-link-to-nuxt-link',
    enforce: 'pre',
    transform(code: string, id: string) {
      const file = id?.split('?')[0]?.replace(/\\/g, '/')
      if (!file || !file.endsWith('.vue') || !isRemote(file)) return
      if (!/<\/?(?:RouterLink|router-link)[\s/>]/.test(code)) return

      const out = rewriteTags(code, ['RouterLink', 'router-link'], (name, attrsSrc) => ({
        tag: name === 'router-link' ? 'nuxt-link' : 'NuxtLink',
        attrs: attrsSrc,
      }))
      return out === code ? undefined : { code: out, map: null }
    },
  }
}

/** Clearer aliases. */
export const monoNuxtLink = monoNuxtLinkToRouterLink
export const monoRouterLink = monoRouterLinkToNuxtLink

/**
 * Replace every `<name …>`/`</name>` pair using `render`, which returns the new
 * tag name and attribute text for an opening tag. A stack carries each opening
 * tag's replacement to its `</…>`, so a tag that became `<a>` closes as `</a>`
 * while its sibling closes as `</RouterLink>`. Returns the input untouched if the
 * markup is malformed (unterminated tag) rather than emitting half a rewrite.
 */
function rewriteTags(
  code: string,
  names: string[],
  render: (name: string, attrsSrc: string) => { tag: string; attrs: string },
): string {
  const re = tagRe(names)
  const stack: string[] = []
  let out = ''
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(code))) {
    const closing = match[1] === '/'
    const name = match[2]!
    out += code.slice(last, match.index)

    if (closing) {
      const gt = code.indexOf('>', match.index)
      if (gt === -1) return code
      // Unbalanced (a stray `</NuxtLink>`) falls back to the plain rename.
      out += `</${stack.pop() ?? render(name, '').tag}>`
      last = gt + 1
      re.lastIndex = last
      continue
    }

    const gt = findTagEnd(code, match.index + match[0].length)
    if (gt === -1) return code
    const selfClosing = code[gt - 1] === '/'
    const attrsSrc = code.slice(match.index + match[0].length, selfClosing ? gt - 1 : gt)

    const { tag, attrs } = render(name, attrsSrc)
    // Every attribute dropped: `<a >` / `<a  />` -> `<a>` / `<a />`. Left alone
    // when the leftover spans lines, so the tag's line count survives.
    const text = attrs.trim() || attrs.includes('\n') ? attrs : selfClosing ? ' ' : ''
    out += `<${tag}${text}${selfClosing ? '/>' : '>'}`
    if (!selfClosing) stack.push(tag)
    last = gt + 1
    re.lastIndex = last
  }

  out += code.slice(last)
  return out
}

/** Index of the `>` ending a tag, skipping quoted attribute values. */
function findTagEnd(code: string, from: number): number {
  let quote = ''
  for (let i = from; i < code.length; i++) {
    const c = code[i]!
    if (quote) {
      if (c === quote) quote = ''
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '>') return i
  }
  return -1
}

/** The `<NuxtLink>` -> `<RouterLink>` / `<a>` decision for one opening tag. */
function renderNuxtLink(
  name: string,
  attrsSrc: string,
  externalRel: boolean,
  warn: (message: string) => void,
): { tag: string; attrs: string } {
  const routerTag = name === 'nuxt-link' ? 'router-link' : 'RouterLink'
  const attrs = parseAttrs(attrsSrc)
  const find = (key: string) => attrs.find((a) => a.key === key)

  const custom = find('custom')
  const external = staticFlag(find('external'))
  const absolute = isAbsoluteTarget(find('to') ?? find('href'))

  if (find('external') && external === undefined && !custom) {
    warn(
      `<${name} :external="…"> can't be resolved at build time, so no target="_blank" was added — ` +
        `it stays an in-app <${routerTag}>. Use a literal \`external\`, or an absolute URL in \`to\`.`,
    )
  }

  // `custom` exposes `v-slot="{ href, navigate }"`, and renders no element of its
  // own — so there's nothing to put a target on, and no anchor to become.
  if (custom) {
    if (external || absolute) {
      warn(`<${name} custom external> stays an in-app link — it renders no element to target. Handle the external href yourself.`)
    }
    return { tag: routerTag, attrs: buildRouterLink(attrsSrc, attrs, false, externalRel) }
  }

  // An absolute `to` can't ride on a RouterLink: vue-router resolves it as a
  // path, so `https://x.dev` renders as href="/https://x.dev". Only a real anchor
  // carries it correctly.
  if (absolute) return { tag: 'a', attrs: buildAnchor(attrsSrc, attrs, externalRel, external === true) }

  return { tag: routerTag, attrs: buildRouterLink(attrsSrc, attrs, external === true, externalRel) }
}

/**
 * Keep the router props, drop the Nuxt-only ones, fold `href` into `to`.
 *
 * An `external` link gets `target="_blank"` instead of becoming an `<a>`:
 * vue-router's `guardEvent` refuses to intercept a click on an anchor with a
 * `target`, so the browser navigates for real — a full page load out of the SPA,
 * which is what `external` means — while `to` keeps working as a route.
 */
function buildRouterLink(
  src: string,
  attrs: Attr[],
  external: boolean,
  externalRel: boolean,
): string {
  const hasTo = attrs.some((a) => a.key === 'to')
  return edit(
    src,
    attrs,
    (a) => {
      if (NUXT_ONLY.includes(a.key)) return ''
      if (a.key === 'href' && !hasTo) return rename(a, 'to')
      return undefined
    },
    external ? externalAttrs(attrs, externalRel) : '',
  )
}

/**
 * `target="_blank"` + `rel="noopener noreferrer"` for an external link — each
 * skipped if the author wrote their own (or opted out via `no-rel` /
 * `externalRel: false`). Both fall through to the anchor RouterLink renders.
 */
function externalAttrs(attrs: Attr[], externalRel: boolean): string {
  const has = (key: string) => attrs.some((a) => a.key === key)
  const target = has('target') ? '' : ' target="_blank"'
  const rel = externalRel && !has('norel') && !has('rel') ? ' rel="noopener noreferrer"' : ''
  return `${target}${rel}`
}

/**
 * Keep the DOM/Vue attrs, drop every link-component prop, fold `to` into `href`.
 * `blank` adds `target="_blank"` — for a link that said `external` outright, not
 * for one we only inferred from an absolute URL.
 */
function buildAnchor(src: string, attrs: Attr[], externalRel: boolean, blank: boolean): string {
  const hasHref = attrs.some((a) => a.key === 'href')
  const noRel = attrs.some((a) => a.key === 'norel')
  const hasRel = attrs.some((a) => a.key === 'rel')

  // The same default NuxtLink applies to the anchors it renders — an external
  // target opened in a `_blank` tab can otherwise script `window.opener`.
  const rel = externalRel && !noRel && !hasRel ? ' rel="noopener noreferrer"' : ''
  const target = blank && !attrs.some((a) => a.key === 'target') ? ' target="_blank"' : ''

  return edit(
    src,
    attrs,
    (a) => {
      if (NUXT_ONLY.includes(a.key) || ROUTER_ONLY.includes(a.key)) return ''
      if (a.key === 'to') return hasHref ? '' : rename(a, 'href') // an explicit href wins
      return undefined
    },
    `${target}${rel}`,
  )
}

/**
 * Rewrite an attribute source in place: `patch` returns the replacement text for
 * an attribute (`''` deletes it) or `undefined` to leave it exactly as written;
 * `append` is inserted after the LAST attribute (not at the very end, so a
 * multi-line tag doesn't strand it past the closing indentation).
 *
 * Everything between attributes — spaces, newlines, indentation — is untouched, so
 * the tag keeps its shape and the file keeps its line numbering (these plugins
 * emit no sourcemap, so a shifted line would misplace every later Vue error).
 */
function edit(
  src: string,
  attrs: Attr[],
  patch: (attr: Attr) => string | undefined,
  append = '',
): string {
  let out = ''
  let last = 0
  for (const attr of attrs) {
    const replacement = patch(attr)
    if (replacement === undefined) continue
    const [start, end] = replacement === '' ? dropRange(src, attr) : [attr.start, attr.end]
    out += src.slice(last, start) + replacement
    last = end
  }

  if (!append) return out + src.slice(last)

  const at = attrs.length ? attrs[attrs.length - 1]!.end : src.length
  return out + src.slice(last, at) + append + src.slice(at)
}

/**
 * A dropped attribute takes one side's spacing with it, so `<NuxtLink external
 * to="…">` doesn't come out as `<a  href="…">`. Spaces and tabs only — eating a
 * newline would pull the next attribute onto the previous line and shift every
 * line after it. Trailing spacing goes first (keeping the tag-name separator);
 * leading spacing only when nothing follows on the tag.
 */
function dropRange(src: string, attr: Attr): [number, number] {
  const space = (i: number) => src[i] === ' ' || src[i] === '\t'
  let { start, end } = attr

  while (end < src.length && space(end)) end++
  if (!src.slice(end).trim()) {
    while (start > 1 && space(start - 1)) start--
  }
  return [start, end]
}

/** Same binding style and value, different prop name (`:to="x"` -> `:href="x"`). */
function rename(attr: Attr, prop: string): string {
  return `${attr.prefix}${prop}${attr.suffix}${attr.valuePart}`
}

function parseAttrs(src: string): Attr[] {
  const out: Attr[] = []
  for (const match of src.matchAll(ATTR_RE)) {
    const name = match[1]!
    const valuePart = match[2] ?? ''
    const { prefix, prop, suffix, directive } = splitName(name)
    out.push({
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
      prefix,
      prop,
      suffix,
      valuePart,
      key: directive ? '' : prop.replace(/-/g, '').toLowerCase(),
      bound: prefix !== '',
    })
  }
  return out
}

/**
 * Split an attribute name into `prefix + prop + modifiers`. Directives, events and
 * slots (`v-if`, `@click`, `#default`) get `directive: true` — they're never
 * matched, renamed or dropped, just carried through verbatim.
 */
function splitName(name: string): { prefix: string; prop: string; suffix: string; directive: boolean } {
  let prefix = ''
  let rest = name

  if (rest.startsWith('v-bind:')) {
    prefix = 'v-bind:'
    rest = rest.slice(7)
  } else if (rest.startsWith(':') || rest.startsWith('.')) {
    prefix = rest[0]!
    rest = rest.slice(1)
  } else if (/^(?:@|#|v-)/.test(rest)) {
    return { prefix: '', prop: rest, suffix: '', directive: true }
  }

  // `:[key]` — a dynamic argument names no prop we can reason about.
  if (rest.startsWith('[')) return { prefix, prop: rest, suffix: '', directive: true }

  const dot = rest.indexOf('.')
  return {
    prefix,
    prop: dot === -1 ? rest : rest.slice(0, dot),
    suffix: dot === -1 ? '' : rest.slice(dot),
    directive: false,
  }
}

/**
 * Is a boolean-ish prop statically on? `true`/`false` for a decidable literal,
 * `undefined` for a runtime expression (which no build-time rewrite can settle).
 */
function staticFlag(attr?: Attr): boolean | undefined {
  if (!attr) return false
  const value = unquote(attr.valuePart)
  if (!attr.bound) return value === '' || value === 'true' // bare `external` or `external="true"`
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

/** A `to`/`href` whose literal value is an absolute URL vue-router can't route. */
function isAbsoluteTarget(attr?: Attr): boolean {
  if (!attr) return false
  const value = unquote(attr.valuePart)
  if (!attr.bound) return ABSOLUTE_RE.test(value)
  // `:to="'https://…'"` — a string literal is just as decidable as the static form.
  const literal = /^\s*(['"])([^'"]*)\1\s*$/.exec(value)
  return literal ? ABSOLUTE_RE.test(literal[2]!) : false
}

/** `="foo"` -> `foo`; `''` (valueless attribute) -> `''`. */
function unquote(valuePart: string): string {
  const value = valuePart.replace(/^\s*=\s*/, '')
  const quoted = /^(['"])([\s\S]*)\1$/.exec(value)
  return (quoted ? quoted[2]! : value).trim()
}
