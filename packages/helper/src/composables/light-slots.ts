import { monoHostChildNodes, monoHostChildren } from './mono-skeleton'
// light-slots.ts
//
// Slot emulation for the light-DOM builds.
//
// A light-DOM component renders into its own host (`createRenderRoot()` → `this`),
// so it cannot use native `<slot>`: Lit owns the host's children. The strategy is
// to capture the consumer's children on connect, let the template render empty
// `[data-mono-slot]` regions, then re-insert the captured nodes into them.
//
// The subtlety this module exists to get right: **those nodes usually belong to a
// framework, and moving or dropping the wrong one corrupts its virtual DOM.**
//
// Vue marks positions in the DOM with nodes that render nothing:
//   - `v-if` without an else branch  → a real `<!--v-if-->` comment
//   - any Fragment (`<template v-if>`, `v-for`, multi-root) → ZERO-LENGTH text nodes
//   - `<Teleport>`                    → an anchor comment
//
// Vue then patches against them: `patchBlockChildren` resolves its container as
// `hostParentNode(oldVNode.el)` for Fragments, Teleports and type changes, and
// `removeFragment` walks `nextSibling` from the start anchor. If an anchor has been
// removed from the document, `parentNode`/`nextSibling` are `null` and Vue dies with
// `Cannot read properties of null (reading 'insertBefore' / 'nextSibling')`.
//
// So the rules are:
//   1. **Never remove a node that will not be re-inserted.** Deleting an anchor is
//      what breaks the consumer's framework.
//   2. **Keep anchors with the content they mark.** An anchor moved into the same
//      region as its siblings keeps a live `parentNode`, so patches work — and
//      content toggled on later is inserted INTO that region rather than beside it.
//   3. **Leave formatting whitespace alone.** It carries no meaning, and dragging it
//      into a region would defeat the `:empty` rules used to collapse blank regions.
//   4. **The host's `textContent` belongs to the consumer, not to us.** In a light
//      build the host IS Lit's render root, so a framework writing text to it wipes
//      the entire component. Vue does exactly that for a lone interpolation
//      (`<mono-button>{{ label }}</mono-button>` compiles to the `TEXT` patch flag →
//      `el.textContent = next`), which destroyed the rendered markup and Lit's part
//      markers with it. `guardHostTextContent` redirects those writes into the
//      default region — see it for the full story.

/** Captured nodes, keyed by slot name, in document order. */
export type LightSlotBuckets = Map<string, Node[]>

export interface CaptureLightSlotsOptions {
  /** Named `slot="…"` values this component lays out. */
  names: readonly string[]
  /** Bucket for unnamed content and framework anchors. Default `'default'`. */
  fallback?: string
  /**
   * Install the `textContent` guard on the host (default `true`). Opt out only for
   * a component that never renders a `[data-mono-slot]` region for `fallback`.
   */
  guardTextContent?: boolean
}

/**
 * Take ownership of the host's current children. Run **once**, from
 * `connectedCallback`, before the first render.
 *
 * Only nodes that were bucketed are detached from the host — anything left
 * unclaimed stays exactly where the consumer put it.
 */
export function captureLightSlots(
  host: HTMLElement,
  options: CaptureLightSlotsOptions,
): LightSlotBuckets {
  const { names, fallback = 'default' } = options

  const buckets: LightSlotBuckets = new Map()
  const claimed: Node[] = []

  const push = (name: string, node: Node): void => {
    const list = buckets.get(name)
    if (list) list.push(node)
    else buckets.set(name, [node])
  }

  for (const node of monoHostChildNodes(host)) {
    let name = fallback

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const explicit = element.getAttribute('slot')

      // An unrecognised `slot` name falls through to the default region with its
      // attribute intact, so a nested custom element can still consume it.
      if (explicit && names.includes(explicit)) {
        name = explicit
        element.removeAttribute('slot')
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''

      // Whitespace between tags: not ours, leave it in the host.
      // A ZERO-LENGTH text node is different — that's a Fragment anchor, and it
      // must travel with its siblings.
      if (text !== '' && !text.trim()) continue
      if (text.trim()) node.textContent = text.trim()
    } else if (node.nodeType !== Node.COMMENT_NODE) {
      // Comments are carried (framework anchors). Anything else is never ours.
      continue
    }

    push(name, node)
    claimed.push(node)
  }

  for (const node of claimed) {
    if (node.parentNode === host) host.removeChild(node)
  }

  // Capture alone isn't enough: the consumer's framework can still write text
  // straight onto the host afterwards, which in a light build overwrites the whole
  // render. Guard the host so those writes land in the default region instead.
  if (options.guardTextContent !== false) {
    guardHostTextContent(host, buckets, {
      fallback,
      onWrite: () => (host as { requestUpdate?: () => void }).requestUpdate?.(),
    })
  }

  return buckets
}

/** Hosts already carrying the accessor — the guard must never stack on itself. */
const guardedHosts = new WeakSet<HTMLElement>()

export interface HostTextGuardOptions {
  /** Bucket a bare text write lands in. Default `'default'`. */
  fallback?: string
  /**
   * Ran after a write that changed the captured content — normally
   * `requestUpdate()`, because slot emptiness is read during render and is not
   * itself reactive.
   */
  onWrite?: () => void
}

/**
 * Redirect `host.textContent = …` into the captured default region.
 *
 * A light-DOM component renders into its own host, so the host's children are the
 * component. Vue compiles a lone interpolation to a `TEXT`-flagged vnode and
 * patches it with `el.textContent = next` (`runtime-dom`'s `setElementText`) —
 * on the HOST. That single assignment removes every rendered node, Lit's
 * `<!--lit-part-->` markers included, and replaces them with one bare text node:
 * the component visually disappears and no later render repairs it, because
 * Lit's parts now point at detached nodes. `patchChildren` does the same when
 * children go array→text or are cleared, and so does `v-text`.
 *
 * Static text never hit this (Vue skips the write when the string is unchanged),
 * which is why it only showed up on dynamic captions. Shadow builds are immune —
 * there the host's children really are slotted content.
 *
 * So the write is intercepted and applied to the text node the consumer already
 * owns inside `[data-mono-slot="<fallback>"]`, which is what the framework meant
 * by it anyway. Framework anchors (zero-length text nodes, comments) and element
 * children are left alone — repurposing an anchor would break the consumer's next
 * patch just as badly as dropping one.
 *
 * `innerHTML` is deliberately not guarded: only `v-html` on the host reaches it,
 * and that is a consumer asking to own the element outright.
 */
export function guardHostTextContent(
  host: HTMLElement,
  buckets: LightSlotBuckets,
  options: HostTextGuardOptions = {},
): void {
  if (guardedHosts.has(host)) return
  guardedHosts.add(host)

  const { fallback = 'default', onWrite } = options

  // Resolved lazily: this module is reachable from node/SSR entries, where
  // `Node` doesn't exist until something actually calls in from a browser.
  const nativeTextContent = Object.getOwnPropertyDescriptor(
    Node.prototype,
    'textContent',
  )

  /** The text node this guard writes to, kept across writes so it stays stable. */
  let owned: Text | null = null
  let holder: HTMLElement | undefined

  const isText = (node: Node): node is Text => node.nodeType === Node.TEXT_NODE

  const fallbackBucket = (): Node[] => {
    const existing = buckets.get(fallback)
    if (existing) return existing

    const created: Node[] = []
    buckets.set(fallback, created)
    return created
  }

  /**
   * Read back the *consumer's* content, not the rendered element. Component chrome
   * (a badge, a separator) is excluded, so Vue's hydration comparison against the
   * vnode's text still matches after capture has moved things into a region.
   */
  const read = (): string => {
    let text = ''
    let captured = false

    for (const nodes of buckets.values()) {
      for (const node of nodes) {
        captured = true
        if (isText(node)) text += node.data
        else if (node.nodeType === Node.ELEMENT_NODE) text += node.textContent ?? ''
      }
    }

    if (captured) return text
    return (nativeTextContent?.get?.call(host) as string | null) ?? ''
  }

  /**
   * The node to write into: the one we already own, else the first text node
   * carrying actual text — never a zero-length one, that's a Fragment anchor —
   * else a fresh node placed in the region (or parked until the region renders).
   */
  const resolveTarget = (): Text => {
    const nodes = fallbackBucket()

    if (owned && nodes.includes(owned)) return owned

    for (const node of nodes) {
      if (isText(node) && node.data !== '') {
        owned = node
        return node
      }
    }

    const created = document.createTextNode('')
    nodes.push(created)

    const region = host.querySelector(`[data-mono-slot="${fallback}"]`)
    if (region) region.appendChild(created)
    else holder = parkDetachedNodes(holder, [created])

    owned = created
    return created
  }

  const write = (value: unknown): void => {
    const node = resolveTarget()
    node.data = value == null ? '' : String(value)

    // `textContent =` replaces *all* children natively, so any other text the
    // consumer had is gone too. Only text is blanked: anchors are already empty
    // and elements stay put, since dropping either corrupts the consumer's vdom.
    for (const other of fallbackBucket()) {
      if (other !== node && isText(other) && other.data !== '') other.data = ''
    }

    onWrite?.()
  }

  Object.defineProperty(host, 'textContent', {
    configurable: true,
    enumerable: false,
    get: read,
    set: write,
  })
}

/** Nodes that have been placed into a region at least once. */
const placedNodes = new WeakSet<Node>()

/** One of our own `[data-mono-slot]` regions (possibly a detached, superseded one). */
function isSlotRegion(node: ParentNode | null): boolean {
  return node instanceof Element && node.hasAttribute('data-mono-slot')
}

/**
 * Move one captured node into its region — unless the consumer has taken it back.
 *
 * The obvious form of this, `if (node.parentNode !== target) target.appendChild(node)`,
 * cannot tell "not placed yet" from "the framework DELETED this". A child behind a
 * `v-if` that flips false ends up with `parentNode === null`, looks unplaced, and the
 * very next render puts it straight back: the element **resurrects** and no amount of
 * consumer state removes it. That was reproduced in `mono-accordion` and `mono-input`
 * and the same loop was copied into every light-DOM component.
 *
 * So: place freely until a node has been placed once. After that, only re-home it
 * while it is still inside one of OUR regions — which is what happens when a
 * re-render swaps the region element, the case the original guard existed for. A
 * null parent means deleted and any other parent means the consumer moved it; both
 * are left alone.
 */
export function placeSlotNode(target: Element, node: Node): void {
  if (node.parentNode === target) {
    placedNodes.add(node)
    return
  }
  if (placedNodes.has(node) && !isSlotRegion(node.parentNode)) return

  target.appendChild(node)
  placedNodes.add(node)
}

/**
 * Move captured nodes into their `[data-mono-slot]` regions. Run from `updated()`,
 * after Lit has rendered them.
 *
 * Nodes already sitting in the right region are left untouched — that guard is
 * what stops a re-render from re-ordering content the consumer's framework
 * inserted after capture. See {@link placeSlotNode} for why "not in the target"
 * is not enough on its own.
 */
export function placeLightSlots(host: HTMLElement, buckets: LightSlotBuckets): void {
  for (const [name, nodes] of buckets) {
    if (!nodes.length) continue

    const target = host.querySelector(`[data-mono-slot="${name}"]`)
    if (!target) continue

    for (const node of nodes) placeSlotNode(target, node)
  }
}

/**
 * Park captured nodes that couldn't be placed — because their `[data-mono-slot]`
 * target isn't rendered (a slot naming an item that doesn't exist *yet*, e.g. one
 * bound to async-loaded data) — in a detached holder so they always keep a live
 * parent. A captured node left with `parentNode === null` crashes the consumer
 * framework's next patch (`Cannot read properties of null`); any parent avoids that
 * while keeping the node invisible until its real target appears and placement moves
 * it out. Returns the holder (created lazily on first orphan) so the caller can cache
 * it. Pass the previously-returned holder back in on later calls.
 */
export function parkDetachedNodes(
  holder: HTMLElement | undefined,
  nodes: Iterable<Node>,
): HTMLElement | undefined {
  for (const node of nodes) {
    if (node.parentNode === null) {
      if (!holder) {
        holder = document.createElement('div')
        holder.hidden = true
      }
      holder.appendChild(node)
    }
  }
  return holder
}

/**
 * Whether a bucket holds anything the user can actually see — used to decide
 * whether a region is worth rendering.
 *
 * Comments are explicitly excluded: an anchor like `<!--v-if-->` has a non-blank
 * `textContent`, so a naive check would report an empty region as occupied.
 */
export function bucketHasContent(nodes: Node[] | undefined): boolean {
  return Boolean(
    nodes?.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE ||
        (node.nodeType === Node.TEXT_NODE && Boolean((node.textContent ?? '').trim())),
    ),
  )
}

/**
 * Watches a host for a named slot child that arrives AFTER `connectedCallback`.
 *
 * The one-shot capture the light builds do at connect is right for the common case — a framework
 * mounts an element's children before inserting it — but it is not the only case. A `<ClientOnly>`
 * boundary, a hydration pass, or a `v-if` flipping later all append the child to an element that
 * is already connected, and a capture that has already run will never see it. In the light build
 * that leaves the node sitting in the host's own flow, visible OUTSIDE the region it was meant
 * for; in the shadow build the flag that renders the `<slot>` never turns on, so nothing projects.
 *
 * Deliberately not a Lit controller: it has to work from inside a mixin whose host may be either
 * build, and all it needs is connect/disconnect.
 */
export class LateSlotWatcher {
  private _observer?: MutationObserver

  constructor(
    private readonly host: Element,
    private readonly name: string,
    private readonly onFound: () => void,
  ) {}

  /**
   * The host's own child carrying `slot="<name>"`, or `null`.
   *
   * Walks `children` rather than running a `:scope >` selector — only a DIRECT child is
   * assignable to a slot, and this way the check is one cheap loop over a handful of nodes with
   * no selector engine involved.
   */
  find(): Element | null {
    for (const child of monoHostChildren(this.host)) {
      if (child.getAttribute('slot') === this.name) return child
    }
    return null
  }

  start(): void {
    if (this._observer || typeof MutationObserver === 'undefined') return

    this._observer = new MutationObserver(() => this.onFound())
    // `childList` only, and not `subtree`: what we are waiting for is a direct child appearing.
    // The consumer's own churn INSIDE that child — every `v-for` insert and removal — must not
    // wake this up, which a subtree observer would do on every keystroke of a search box.
    this._observer.observe(this.host, { childList: true })
  }

  stop(): void {
    this._observer?.disconnect()
    this._observer = undefined
  }
}
