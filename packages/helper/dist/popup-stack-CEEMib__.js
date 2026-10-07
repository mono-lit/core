//#region src/composables/popup-stack.ts
/** First layer's z-index. Each subsequent open layer sits one STEP higher. */
var POPUP_Z_BASE = 1e3;
/** Open layers in open order; the last entry is the topmost. */
var stack = [];
/**
* Inline styles captured once when the stack first locks scroll, restored when the
* last locking owner leaves. `null` doubles as the "not currently locked" sentinel.
*/
var savedRootOverflow = null;
var savedRootPriority = "";
var savedBodyOverflow = null;
var savedBodyPriority = "";
var savedBodyPadRight = null;
/**
* Lock holders that are NOT stack layers — `mono-sidebar`, which owns its own
* z-index and Escape handling and so has no business in the stack, but must share
* the lock. Without one shared owner set the two save/restore pairs interleave and
* a sidebar closing under an open modal restores an overflow the modal still needs
* — leaving the page locked for good once the modal closes.
*/
var externalLockOwners = /* @__PURE__ */ new Set();
/** Whether the shared Escape listener is currently attached. */
var escBound = false;
/**
* Reassign every open layer's z-index.
*
* A running cursor rather than `BASE + i * STEP`, so a PINNED layer (see
* `PopupLayer.pinnedZ`) lifts the levels of everything opened above it. With no
* pinned layer in the stack the cursor produces exactly the old sequence —
* 1000, 1010, 1020 … — so nothing that worked before moves.
*/
function applyStackOrder() {
	let z = POPUP_Z_BASE;
	stack.forEach((layer, i) => {
		const pinned = Number(layer.pinnedZ);
		if (Number.isFinite(pinned) && pinned > z) z = pinned;
		const hasBackdropAbove = stack.slice(i + 1).some((above) => above.hasBackdrop);
		layer.setStackZ(z, !hasBackdropAbove);
		z += 10;
	});
}
/**
* Hold / release the page scroll for every owner that wants it.
*
* ── Why the ROOT and not just the body ──
*
* The body's `overflow` only reaches the viewport while the ROOT element's computed
* overflow is `visible` (CSS Overflow §3.5, "viewport propagation"). Any reset that
* gives `html` an explicit overflow cancels that — Vuetify's ships
* `html { overflow-y: scroll }`, and ress / sanitize.css do the same — and from then on
* `body { overflow: hidden }` clips nothing: the body is `height: auto`, already tall
* enough for its own content, so it never becomes a scrollport. The page kept scrolling
* behind every modal, and no static style check caught it, because the body attribute
* this used to set was there all along.
*
* The body is still locked as well. It costs nothing, it is what the e2e check asserts,
* and in a quirks-mode document the body IS the scroller.
*
* ── Why the declaration is `!important` ──
*
* Because a plain inline style LOSES to a consumer stylesheet that claims the root's overflow
* with `!important`, and doing so is common — Vuetify writes its own scroll block that way
* (`.v-overlay-scroll-blocked:not(html) { overflow-y: hidden !important }`), and an app that
* drives `<html class>` from its layout (`.overflow-auto { overflow: auto !important }`) pins
* it permanently. The symptom is silent and deeply confusing: `documentElement.style.overflow`
* reads `"hidden"`, every style assertion passes, and the page scrolls anyway, because the
* COMPUTED value is still `auto`. An important declaration in the style attribute outranks an
* important one from a selector, so this is the one write that cannot be out-cascaded.
*
* ── Why the gutter is measured, and paid for with padding ──
*
* With `overflow-y: scroll` the scrollbar is rendered even on a short page, so locking
* takes it away and everything shifts sideways by its width. The width is measured before
* the lock and handed back to the body as `padding-right`, so nothing moves.
*
* NOT `scrollbar-gutter: stable` on the root, which reserves the same space in one
* declaration and would hold `position: fixed` chrome still too: Chrome paints the empty
* scrollbar TRACK in a stable gutter, so the page still looks like it has a scrollbar —
* which is the thing being complained about. Padding leaves no track.
*
* Measured rather than assumed, because on a system with overlay scrollbars there is no
* gutter at all and compensating would itself be the shift.
*/
function syncScrollLock() {
	if (typeof document === "undefined") return;
	const body = document.body;
	if (!body) return;
	const root = document.documentElement;
	const wantLock = externalLockOwners.size > 0 || stack.some((l) => l.lockBodyScroll);
	if (wantLock && savedRootOverflow === null) {
		const gutter = Math.max(0, window.innerWidth - root.clientWidth);
		savedRootOverflow = root.style.getPropertyValue("overflow");
		savedRootPriority = root.style.getPropertyPriority("overflow");
		savedBodyOverflow = body.style.getPropertyValue("overflow");
		savedBodyPriority = body.style.getPropertyPriority("overflow");
		root.style.setProperty("overflow", "hidden", "important");
		body.style.setProperty("overflow", "hidden", "important");
		if (gutter > 0) {
			savedBodyPadRight = body.style.paddingRight;
			body.style.paddingRight = `${gutter}px`;
		}
	} else if (!wantLock && savedRootOverflow !== null) {
		restoreOverflow(root, savedRootOverflow, savedRootPriority);
		restoreOverflow(body, savedBodyOverflow, savedBodyPriority);
		if (savedBodyPadRight !== null) body.style.paddingRight = savedBodyPadRight;
		savedRootOverflow = null;
		savedRootPriority = "";
		savedBodyOverflow = null;
		savedBodyPriority = "";
		savedBodyPadRight = null;
	}
}
/** Put an element's inline `overflow` back exactly as it was — value, priority, or absent. */
function restoreOverflow(el, value, priority) {
	if (value) el.style.setProperty("overflow", value, priority);
	else el.style.removeProperty("overflow");
}
function onStackKeydown(event) {
	if (event.key !== "Escape") return;
	stack[stack.length - 1]?.onStackEscape?.(event);
}
function ensureEscapeListener() {
	if (typeof document === "undefined") return;
	if (stack.length > 0 && !escBound) {
		document.addEventListener("keydown", onStackKeydown);
		escBound = true;
	} else if (stack.length === 0 && escBound) {
		document.removeEventListener("keydown", onStackKeydown);
		escBound = false;
	}
}
/** Add a layer to the top of the stack (call on open). */
function registerPopupLayer(layer) {
	if (typeof document === "undefined") return;
	if (stack.includes(layer)) return;
	stack.push(layer);
	applyStackOrder();
	syncScrollLock();
	ensureEscapeListener();
}
/** Remove a layer from the stack (call on close / disconnect). */
function unregisterPopupLayer(layer) {
	const idx = stack.indexOf(layer);
	if (idx === -1) return;
	stack.splice(idx, 1);
	applyStackOrder();
	syncScrollLock();
	ensureEscapeListener();
}
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
function refreshPopupStack() {
	if (typeof document === "undefined") return;
	applyStackOrder();
	syncScrollLock();
}
/**
* Take or release a share of the page-scroll lock from OUTSIDE the stack.
*
* For an overlay that manages its own z-index and Escape handling and so does not belong
* in the stack, but must still share the one lock — `mono-sidebar`. Idempotent per owner;
* the lock lifts only when the last owner (stack layer or otherwise) lets go.
*/
function setExternalScrollLock(owner, wanted) {
	if (typeof document === "undefined") return;
	if (wanted) externalLockOwners.add(owner);
	else externalLockOwners.delete(owner);
	syncScrollLock();
}
/**
* Currently-open layers in open order (topmost last). Used by exclusive
* (non-stackable) modal/drawer logic that must close *other* instances of its
* own type — filter the returned list by `instanceof`.
*/
function getOpenPopupLayers() {
	return stack;
}
//#endregion
export { unregisterPopupLayer as a, setExternalScrollLock as i, refreshPopupStack as n, registerPopupLayer as r, getOpenPopupLayers as t };
