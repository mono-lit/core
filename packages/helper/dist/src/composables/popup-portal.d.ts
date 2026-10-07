import { ReactiveController, ReactiveControllerHost } from 'lit';
import { PopupLayer } from './popup-stack';
type PopupHost = ReactiveControllerHost & HTMLElement & {
    readonly renderRoot: HTMLElement | DocumentFragment;
};
export type PopupSide = 'top' | 'bottom' | 'left' | 'right';
export type PopupAlign = 'start' | 'center' | 'end';
export interface PopupPortalOptions {
    /** Locate the panel element (searched in the host's render root). */
    getPanel: () => HTMLElement | null;
    /** Element the panel is anchored to (the trigger / field). */
    getAnchor: () => HTMLElement | null;
    /**
     * Element whose class list AND `mono-*` attributes are mirrored onto the portal
     * so the relocated panel keeps its theme CSS variables and state-dependent
     * styles — the legacy `.mono-select.open .mono-select-dropdown` rule and the
     * Basecoat-ported `[mono-select][mono-open] > [mono-dropdown]` one alike, with
     * the `--_mono-<c>-*` resolvers declared on `[mono-<c>]` re-resolving on the
     * portal. Usually the host or its inner wrapper `<div>`.
     */
    getStyleScope: () => HTMLElement | null;
    /**
     * The component's PUBLIC custom-property names, so a relocated panel keeps
     * overrides an ancestor of the host set.
     *
     * Class and attribute mirroring is not enough for these: a custom property is
     * inherited, and a portaled panel is a child of `<body>`, so
     * `--mono-dropdown-radius` set on a wrapper around the host simply is not in
     * its inheritance chain any more. `getComputedStyle` cannot enumerate custom
     * properties (Chromium lists none of them), so the component has to name the
     * ones it reads; each is resolved on the scope and copied onto the portal when
     * it differs from what the portal already resolves.
     */
    styleVars?: () => readonly string[];
    /** Whether the popup is currently open. */
    isOpen: () => boolean;
    side?: () => PopupSide;
    align?: () => PopupAlign;
    offset?: () => number;
    flip?: () => boolean;
    shift?: () => boolean;
    /** Panel width tracks the anchor's width (select / tag-input full-width drop). */
    /**
     * Stretch the panel to the anchor's width on every reposition.
     *
     * A GETTER as well as a plain boolean, because a component may want it to follow a prop: a
     * consumer that sets an explicit panel width needs this off, or the write below overwrites it
     * on the next open / scroll / resize.
     */
    matchWidth?: boolean | (() => boolean);
    /**
     * Publish the room available on the resolved side as `--mono-popup-avail-h`
     * (main axis) / `--mono-popup-avail-w` (cross axis) on the panel, so its CSS
     * can shrink instead of spilling off-screen. See {@link applyPopupPlacement}.
     */
    constrainSize?: () => boolean;
    /** Notified when the resolved side changes after flipping. */
    onSideResolved?: (side: PopupSide) => void;
}
export interface PopupPlacementOptions {
    side?: PopupSide;
    align?: PopupAlign;
    offset?: number;
    flip?: boolean;
    shift?: boolean;
    /** Gap kept between the panel and the viewport edge. */
    margin?: number;
    /**
     * The caller will clamp the panel to `availableMain` (see `constrainSize`), so
     * anchor a flipped/`top`-side panel to the CLAMPED extent rather than its
     * natural one. Off by default: an unconstrained panel keeps its natural size,
     * and pretending otherwise would slide it over its own trigger.
     */
    constrain?: boolean;
}
export interface PopupPlacement {
    top: number;
    left: number;
    /** The side actually used (may differ from the preferred one after flipping). */
    side: PopupSide;
    /**
     * Room between the anchor and the viewport edge along the panel's main axis
     * on the resolved side — height for top/bottom, width for left/right.
     */
    availableMain: number;
}
/**
 * True when an event's composed path passes through any of `roots` — directly,
 * or through a body-level popup portal whose OWNER lives inside one of them (at
 * any depth: a select inside a header filter inside a dropdown-table resolves
 * all the way up).
 *
 * The one "is this click inside me?" test the library uses. Popups ask it
 * through `PopupPortalController.containsInPath`; `mono-modal` / `mono-drawer`
 * — which portal themselves, not through this controller — ask it directly with
 * their host + render root, so a click in a select's option list opened from
 * inside a no-overlay dialog counts as inside the dialog.
 */
export declare function pathOwnedBy(path: EventTarget[], roots: readonly Element[]): boolean;
/**
 * Nearest ancestor of the panel that establishes a containing block for
 * `position: fixed` descendants. A body-portaled panel has none (the portal is
 * a direct child of `<body>`), but a shadow-root panel usually sits under app
 * chrome that does.
 */
export declare function findFixedContainingBlock(panel: HTMLElement): HTMLElement | null;
/**
 * Resolve where `panel` should sit relative to `anchor`, in viewport
 * coordinates (i.e. what `position: fixed` wants, before any containing-block
 * compensation — that's {@link applyPopupPlacement}'s job).
 *
 * IMPORTANT — the panel is measured at its NATURAL size: any previously
 * published `--mono-popup-avail-*` constraint is cleared first. A constrained
 * panel is exactly as tall as the room we gave it, so measuring it that way
 * would make the flip test (`spaceBelow < panelH`) always report "it fits" and
 * the panel would oscillate between sides on every scroll tick.
 */
export declare function computePopupPlacement(anchor: HTMLElement, panel: HTMLElement, o?: PopupPlacementOptions): PopupPlacement;
/**
 * Commit a {@link computePopupPlacement} result to the panel. Compensates for a
 * transformed / contained ancestor that has become the fixed panel's containing
 * block (a no-op for a body-portaled panel), and — when `constrain` is set —
 * publishes the available room so the panel's own CSS can clamp itself.
 */
export declare function applyPopupPlacement(panel: HTMLElement, placement: PopupPlacement, constrain?: boolean): void;
export declare class PopupPortalController implements ReactiveController, PopupLayer {
    private readonly host;
    private readonly opts;
    private _portal;
    /** Cached panel reference (it leaves the render root once adopted). */
    private _panel;
    private _adopted;
    private _registered;
    private _resolvedSide;
    /** Keeps the portal's mirrored class current even when the host applies its
     *  state classes imperatively in `updated()` (which runs *after* the
     *  controller's `hostUpdated`). */
    private _classObserver;
    /** Whether the viewport listeners are currently attached (open-only, see
     *  `_bindViewport`). Keeps the add/remove pair balanced across the several
     *  paths that can open or close a popup. */
    private _viewportBound;
    /** Pending reposition frame, so a scroll burst costs one layout, not one per event. */
    private _viewportFrame;
    constructor(host: PopupHost, opts: PopupPortalOptions);
    hostConnected(): void;
    hostDisconnected(): void;
    hostUpdated(): void;
    /**
     * Only relocate to `<body>` when the host renders into light DOM
     * (`renderRoot === host`). Shadow hosts keep the panel in their shadow root.
     */
    private get _canPortal();
    private _ensurePortal;
    /** Move the panel into the body portal on first open; keep it there after. */
    private _adopt;
    /** Mirror the style-scope element's classes and `mono-*` attributes onto the portal. */
    private _syncPortalClass;
    /**
     * Carry the component's public custom properties across the portal (see
     * `styleVars`). Only values that DIFFER from the portal's own resolution are
     * written, so a theme-level token stays inherited and only a real override
     * (an ancestor of the host, or an inline style on it) is copied.
     */
    private _syncPortalVars;
    /**
     * Watch the style-scope's `class` attribute so the portal stays in sync even
     * when the host toggles state classes (e.g. `open`) imperatively in
     * `updated()`, which runs after the controller's `hostUpdated`.
     */
    private _observeStyleScope;
    private _enterStack;
    private _leaveStack;
    /** PopupLayer hook — write the chained z onto the portal (root context). */
    setStackZ(z: number): void;
    /** Where panel-internal elements live now (portal while adopted, else host). */
    get panelRoot(): ParentNode;
    /**
     * True when an event's composed path passes through this popup — its own
     * portaled panel, OR any popup that was opened from inside it.
     *
     * The second half is what keeps a nested popup from dismissing its parent:
     * a header filter opened from a `<mono-table-th>` in a dropdown-table's
     * panel, a select's option list inside a modal — each lives in a portal of
     * its own on `<body>`, so a click in it is nowhere near the parent in the
     * DOM. It IS inside by ownership, and that is what every outside-click test
     * in the library asks this method.
     */
    containsInPath(path: EventTarget[]): boolean;
    /**
     * True when the path passes through a popup opened from INSIDE this one
     * (at any depth) — not this popup's own panel.
     *
     * Walks each portal in the path back to its owner and asks whether that
     * owner lives in this host or this panel; an owner that is itself inside
     * another popup climbs to that popup's owner, so a select inside a filter
     * inside a dropdown-table resolves all the way up. Composed-tree
     * containment throughout: the owner may sit behind a slot or a shadow root.
     */
    ownsNestedInPath(path: EventTarget[]): boolean;
    /**
     * Listen for viewport movement — but ONLY while this popup is open.
     *
     * These used to be bound in `hostConnected`, which meant one capture-phase
     * `scroll` listener on `window` per popup-capable element on the page, open or
     * not: every select, every table header filter, every search box — and one per
     * ROW on a grid that puts a `mono-button-dropdown` in each. `_onViewport` bails
     * when closed, so the handler was free; the *dispatch* was not, and a
     * non-passive capture listener on `window` also disqualifies the whole page's
     * scrolling from running off the compositor thread.
     *
     * `passive` because nothing here calls `preventDefault`.
     */
    private _bindViewport;
    private _unbindViewport;
    /**
     * Coalesced to one frame: `reposition()` writes then reads
     * (`getBoundingClientRect` on anchor and panel) and walks the ancestors with
     * `getComputedStyle`, i.e. it forces a synchronous layout. Running that once per
     * scroll event rather than once per frame is what made scrolling a modal body
     * with an open dropdown stutter.
     */
    private _onViewport;
    reposition(): void;
}
export {};
