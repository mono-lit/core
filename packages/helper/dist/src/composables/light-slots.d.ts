/** Captured nodes, keyed by slot name, in document order. */
export type LightSlotBuckets = Map<string, Node[]>;
export interface CaptureLightSlotsOptions {
    /** Named `slot="…"` values this component lays out. */
    names: readonly string[];
    /** Bucket for unnamed content and framework anchors. Default `'default'`. */
    fallback?: string;
    /**
     * Install the `textContent` guard on the host (default `true`). Opt out only for
     * a component that never renders a `[data-mono-slot]` region for `fallback`.
     */
    guardTextContent?: boolean;
}
/**
 * Take ownership of the host's current children. Run **once**, from
 * `connectedCallback`, before the first render.
 *
 * Only nodes that were bucketed are detached from the host — anything left
 * unclaimed stays exactly where the consumer put it.
 */
export declare function captureLightSlots(host: HTMLElement, options: CaptureLightSlotsOptions): LightSlotBuckets;
export interface HostTextGuardOptions {
    /** Bucket a bare text write lands in. Default `'default'`. */
    fallback?: string;
    /**
     * Ran after a write that changed the captured content — normally
     * `requestUpdate()`, because slot emptiness is read during render and is not
     * itself reactive.
     */
    onWrite?: () => void;
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
export declare function guardHostTextContent(host: HTMLElement, buckets: LightSlotBuckets, options?: HostTextGuardOptions): void;
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
export declare function placeSlotNode(target: Element, node: Node): void;
/**
 * Move captured nodes into their `[data-mono-slot]` regions. Run from `updated()`,
 * after Lit has rendered them.
 *
 * Nodes already sitting in the right region are left untouched — that guard is
 * what stops a re-render from re-ordering content the consumer's framework
 * inserted after capture. See {@link placeSlotNode} for why "not in the target"
 * is not enough on its own.
 */
export declare function placeLightSlots(host: HTMLElement, buckets: LightSlotBuckets): void;
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
export declare function parkDetachedNodes(holder: HTMLElement | undefined, nodes: Iterable<Node>): HTMLElement | undefined;
/**
 * Whether a bucket holds anything the user can actually see — used to decide
 * whether a region is worth rendering.
 *
 * Comments are explicitly excluded: an anchor like `<!--v-if-->` has a non-blank
 * `textContent`, so a naive check would report an empty region as occupied.
 */
export declare function bucketHasContent(nodes: Node[] | undefined): boolean;
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
export declare class LateSlotWatcher {
    private readonly host;
    private readonly name;
    private readonly onFound;
    private _observer?;
    constructor(host: Element, name: string, onFound: () => void);
    /**
     * The host's own child carrying `slot="<name>"`, or `null`.
     *
     * Walks `children` rather than running a `:scope >` selector — only a DIRECT child is
     * assignable to a slot, and this way the check is one cheap loop over a handful of nodes with
     * no selector engine involved.
     */
    find(): Element | null;
    start(): void;
    stop(): void;
}
