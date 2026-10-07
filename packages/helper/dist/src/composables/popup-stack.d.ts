/** First layer's z-index. Each subsequent open layer sits one STEP higher. */
export declare const POPUP_Z_BASE = 1000;
/** Gap between adjacent layers — leaves room for overlay(z) + panel(z+1) pairs. */
export declare const POPUP_Z_STEP = 10;
export interface PopupLayer {
    /**
     * Apply the z-index for this layer's current slot in the stack.
     * `isTopBackdrop` is true when no other *backdrop-bearing* layer (modal /
     * drawer) sits above this one. Backdrop layers use it to dim their own
     * overlay only when another overlay already covers them; lightweight popups
     * (which render no backdrop) ignore it.
     */
    setStackZ(z: number, isTopBackdrop: boolean): void;
    /** True while this layer wants the document body scroll locked (modal/drawer). */
    readonly lockBodyScroll?: boolean;
    /**
     * True when this layer renders its own dim backdrop / overlay (modal, drawer).
     * Only these layers participate in the `isTopBackdrop` computation, so opening
     * a backdrop-less popup (dropdown/select/…) above a modal never hides the
     * modal's backdrop.
     */
    readonly hasBackdrop?: boolean;
    /**
     * Called when Escape is pressed and this layer is the topmost one. Layers that
     * own their own Escape handling (dropdown/select/…) simply don't implement it,
     * in which case Escape is a no-op at the stack level.
     */
    onStackEscape?(event: KeyboardEvent): void;
    /**
     * The level this layer actually paints at when it refuses the slot it is
     * handed — modal / drawer's `z-index` prop. `undefined` (the default) means
     * "use the slot", which is every other layer.
     *
     * The chain RESUMES from this value rather than from the slot index, because
     * layers opened above a pinned one have to clear it. Without that, a dialog
     * pinned to 10_000_000 leaves the select opened inside it at 1010 — painted
     * underneath the very dialog it belongs to.
     */
    readonly pinnedZ?: number;
}
/** Add a layer to the top of the stack (call on open). */
export declare function registerPopupLayer(layer: PopupLayer): void;
/** Remove a layer from the stack (call on close / disconnect). */
export declare function unregisterPopupLayer(layer: PopupLayer): void;
/**
 * Recompute every open layer's level without touching the membership.
 *
 * For a layer whose `pinnedZ` changed while it was open — a bound `:z-index` on a
 * modal that is already showing. The dialog's own level is republished by its
 * `updated()` either way; this is what moves the layers stacked ABOVE it.
 *
 * Re-runs the scroll lock as well, because `lockScroll` can flip on an overlay that is
 * ALREADY open: membership has not changed, so neither register nor unregister fires,
 * and without this the page stays locked until the overlay closes.
 */
export declare function refreshPopupStack(): void;
/**
 * Take or release a share of the page-scroll lock from OUTSIDE the stack.
 *
 * For an overlay that manages its own z-index and Escape handling and so does not belong
 * in the stack, but must still share the one lock — `mono-sidebar`. Idempotent per owner;
 * the lock lifts only when the last owner (stack layer or otherwise) lets go.
 */
export declare function setExternalScrollLock(owner: object, wanted: boolean): void;
/**
 * Currently-open layers in open order (topmost last). Used by exclusive
 * (non-stackable) modal/drawer logic that must close *other* instances of its
 * own type — filter the returned list by `instanceof`.
 */
export declare function getOpenPopupLayers(): readonly PopupLayer[];
