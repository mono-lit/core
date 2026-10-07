import { a as unregisterPopupLayer, r as registerPopupLayer } from "./popup-stack-CEEMib__.js";
import { isServer } from "lit";
//#region src/composables/popup-portal.ts
/** Smallest height we will ever constrain a panel to — below this it's unusable. */
var MIN_CONSTRAINED = 96;
/** Composed-tree parent — crosses shadow boundaries. */
function flatTreeParent(node) {
	const slot = node.assignedSlot;
	if (slot) return slot;
	const parent = node.parentNode;
	if (parent instanceof ShadowRoot) return parent.host;
	return parent;
}
/** Composed-tree containment — `root.contains(node)` that crosses shadow roots and slots. */
function flatTreeContains(root, node) {
	for (let n = node; n; n = flatTreeParent(n)) if (n === root) return true;
	return false;
}
/**
* Which element OPENED a body-level portal.
*
* Every portal is a direct child of `<body>`, so the DOM says nothing about
* where its popup came from — and a popup opened from inside another popup's
* panel (a header filter inside a dropdown-table, a select inside a modal) is
* then "outside" to that panel's own dismiss test, which closes it under the
* user's hands. This map is the missing link, kept off the DOM (no attribute,
* nothing to serialise) and weak so a torn-down portal is not held.
*/
var portalOwner = /* @__PURE__ */ new WeakMap();
/** The portal `node` currently lives in (composed tree), or `null` when it is not inside one. */
function flatTreeClosestPortal(node) {
	for (let n = flatTreeParent(node); n; n = flatTreeParent(n)) if (n instanceof Element && n.hasAttribute("data-mono-popup-portal")) return n;
	return null;
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
function pathOwnedBy(path, roots) {
	if (path.some((node) => node instanceof Element && roots.includes(node))) return true;
	return nestedPortalInPath(path, roots);
}
/**
* The portal half of `pathOwnedBy`: true when the path passes through a
* `[data-mono-popup-portal]` whose owner chain lands in one of `roots` — the
* roots themselves being in the path does NOT count. That distinction is what
* `ownsNestedInPath` is built on: an Escape with focus on a dropdown's own
* trigger is the dropdown's to close, not a nested popup's.
*/
function nestedPortalInPath(path, roots) {
	for (const node of path) {
		if (!(node instanceof Element) || !node.hasAttribute("data-mono-popup-portal")) continue;
		let owner = portalOwner.get(node);
		const seen = /* @__PURE__ */ new Set();
		while (owner && !seen.has(owner)) {
			seen.add(owner);
			if (roots.some((root) => root === owner || flatTreeContains(root, owner))) return true;
			const outer = flatTreeClosestPortal(owner);
			owner = outer ? portalOwner.get(outer) : void 0;
		}
	}
	return false;
}
/**
* Nearest ancestor of the panel that establishes a containing block for
* `position: fixed` descendants. A body-portaled panel has none (the portal is
* a direct child of `<body>`), but a shadow-root panel usually sits under app
* chrome that does.
*/
function findFixedContainingBlock(panel) {
	let node = flatTreeParent(panel);
	while (node && node !== document.body && node !== document.documentElement) {
		if (node instanceof HTMLElement) {
			const cs = getComputedStyle(node);
			if (cs.transform && cs.transform !== "none") return node;
			if (cs.perspective && cs.perspective !== "none") return node;
			if (cs.filter && cs.filter !== "none") return node;
			const backdrop = cs.backdropFilter || cs.webkitBackdropFilter;
			if (backdrop && backdrop !== "none") return node;
			const willChange = cs.willChange || "";
			if (willChange.includes("transform") || willChange.includes("perspective") || willChange.includes("filter")) return node;
			const contain = cs.contain || "";
			if (contain.includes("paint") || contain.includes("layout") || contain.includes("strict") || contain.includes("content")) return node;
		}
		node = flatTreeParent(node);
	}
	return null;
}
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
function computePopupPlacement(anchor, panel, o = {}) {
	panel.style.removeProperty("--mono-popup-avail-h");
	panel.style.removeProperty("--mono-popup-avail-w");
	const triggerRect = anchor.getBoundingClientRect();
	const panelRect = panel.getBoundingClientRect();
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const margin = o.margin ?? 4;
	const cs = getComputedStyle(panel);
	const borderX = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
	const borderY = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
	const boxW = panelRect.width || panel.offsetWidth;
	const boxH = panelRect.height || panel.offsetHeight;
	const panelW = cs.overflowX === "visible" ? Math.max(boxW, panel.scrollWidth + borderX) : boxW;
	const panelH = cs.overflowY === "visible" ? Math.max(boxH, panel.scrollHeight + borderY) : boxH;
	let side = o.side ?? "bottom";
	let align = o.align ?? "start";
	const offset = o.offset ?? 6;
	const flip = o.flip ?? false;
	const shift = o.shift ?? false;
	const constrain = o.constrain ?? false;
	/** Extent the panel will actually occupy along the main axis once clamped. */
	const clamped = (natural, available) => constrain ? Math.min(natural, Math.max(MIN_CONSTRAINED, available)) : natural;
	if (flip) {
		if (side === "bottom") {
			const below = vh - triggerRect.bottom - offset;
			const above = triggerRect.top - offset;
			if (below < panelH && above > below) side = "top";
		} else if (side === "top") {
			const above = triggerRect.top - offset;
			const below = vh - triggerRect.bottom - offset;
			if (above < panelH && below > above) side = "bottom";
		} else if (side === "right") {
			const right = vw - triggerRect.right - offset;
			const left = triggerRect.left - offset;
			if (right < panelW && left > right) side = "left";
		} else if (side === "left") {
			const left = triggerRect.left - offset;
			const right = vw - triggerRect.right - offset;
			if (left < panelW && right > left) side = "right";
		}
	}
	if (flip && align !== "center") {
		const fitsStart = side === "bottom" || side === "top" ? triggerRect.left + panelW + margin <= vw : triggerRect.top + panelH + margin <= vh;
		const fitsEnd = side === "bottom" || side === "top" ? triggerRect.right - panelW - margin >= 0 : triggerRect.bottom - panelH - margin >= 0;
		if (align === "start" && !fitsStart && fitsEnd) align = "end";
		else if (align === "end" && !fitsEnd && fitsStart) align = "start";
	}
	let top = 0;
	let left = 0;
	let availableMain = 0;
	if (side === "bottom" || side === "top") {
		if (align === "start") left = triggerRect.left;
		else if (align === "end") left = triggerRect.right - panelW;
		else left = triggerRect.left + triggerRect.width / 2 - panelW / 2;
		if (shift) {
			const minLeft = margin;
			const maxLeft = vw - panelW - margin;
			if (maxLeft >= minLeft) {
				if (left < minLeft) left = minLeft;
				if (left > maxLeft) left = maxLeft;
			}
		}
		availableMain = side === "bottom" ? vh - triggerRect.bottom - offset - margin : triggerRect.top - offset - margin;
		top = side === "bottom" ? triggerRect.bottom + offset : triggerRect.top - clamped(panelH, availableMain) - offset;
	} else {
		if (align === "start") top = triggerRect.top;
		else if (align === "end") top = triggerRect.bottom - panelH;
		else top = triggerRect.top + triggerRect.height / 2 - panelH / 2;
		if (shift) {
			const minTop = margin;
			const maxTop = vh - panelH - margin;
			if (maxTop >= minTop) {
				if (top < minTop) top = minTop;
				if (top > maxTop) top = maxTop;
			}
		}
		availableMain = side === "right" ? vw - triggerRect.right - offset - margin : triggerRect.left - offset - margin;
		left = side === "right" ? triggerRect.right + offset : triggerRect.left - clamped(panelW, availableMain) - offset;
	}
	return {
		top,
		left,
		side,
		availableMain
	};
}
/**
* Commit a {@link computePopupPlacement} result to the panel. Compensates for a
* transformed / contained ancestor that has become the fixed panel's containing
* block (a no-op for a body-portaled panel), and — when `constrain` is set —
* publishes the available room so the panel's own CSS can clamp itself.
*/
function applyPopupPlacement(panel, placement, constrain = false) {
	let { top, left } = placement;
	const cb = findFixedContainingBlock(panel);
	if (cb) {
		const cbRect = cb.getBoundingClientRect();
		top -= cbRect.top;
		left -= cbRect.left;
	}
	panel.style.position = "fixed";
	const grid = typeof window !== "undefined" && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
	const snap = (v) => Math.round(v * grid) / grid;
	panel.style.top = `${snap(top)}px`;
	panel.style.left = `${snap(left)}px`;
	panel.style.right = "auto";
	panel.style.bottom = "auto";
	panel.style.transform = "none";
	if (constrain) {
		const avail = `${Math.round(Math.max(MIN_CONSTRAINED, placement.availableMain))}px`;
		const vertical = placement.side === "bottom" || placement.side === "top";
		panel.style.setProperty(vertical ? "--mono-popup-avail-h" : "--mono-popup-avail-w", avail);
	}
}
var PopupPortalController = class {
	constructor(host, opts) {
		this.host = host;
		this.opts = opts;
		this._portal = null;
		this._panel = null;
		this._adopted = false;
		this._registered = false;
		this._resolvedSide = "bottom";
		this._classObserver = null;
		this._viewportBound = false;
		this._viewportFrame = 0;
		this._onViewport = () => {
			if (!this.opts.isOpen() || this._viewportFrame) return;
			this._viewportFrame = requestAnimationFrame(() => {
				this._viewportFrame = 0;
				if (this.opts.isOpen()) this.reposition();
			});
		};
		host.addController(this);
	}
	hostConnected() {
		if (isServer) return;
		if (this.opts.isOpen()) {
			this._adopt();
			this._enterStack();
			this._syncPortalClass();
			this.reposition();
		}
	}
	hostDisconnected() {
		this._unbindViewport();
		this._leaveStack();
		this._classObserver?.disconnect();
		this._classObserver = null;
		if (this._portal?.parentNode) this._portal.parentNode.removeChild(this._portal);
		this._portal = null;
		this._adopted = false;
	}
	hostUpdated() {
		if (isServer) return;
		if (this.opts.isOpen()) {
			this._adopt();
			this._enterStack();
			this._syncPortalClass();
			this.reposition();
		} else {
			this._leaveStack();
			this._syncPortalClass();
		}
	}
	/**
	* Only relocate to `<body>` when the host renders into light DOM
	* (`renderRoot === host`). Shadow hosts keep the panel in their shadow root.
	*/
	get _canPortal() {
		return !isServer && this.host.renderRoot === this.host;
	}
	_ensurePortal() {
		if (this._portal) return this._portal;
		if (typeof document === "undefined") return null;
		const portal = document.createElement("div");
		portal.setAttribute("data-mono-popup-portal", "");
		portal.style.display = "contents";
		document.body.appendChild(portal);
		portalOwner.set(portal, this.host);
		this._portal = portal;
		return portal;
	}
	/** Move the panel into the body portal on first open; keep it there after. */
	_adopt() {
		if (this._adopted) return;
		if (!this._canPortal) {
			this._panel = this.opts.getPanel();
			return;
		}
		const panel = this.opts.getPanel() ?? this._panel;
		if (!panel) return;
		const portal = this._ensurePortal();
		if (!portal) return;
		this._syncPortalClass();
		this._observeStyleScope();
		portal.appendChild(panel);
		this._panel = panel;
		this._adopted = true;
	}
	/** Mirror the style-scope element's classes and `mono-*` attributes onto the portal. */
	_syncPortalClass() {
		if (!this._portal) return;
		const scope = this.opts.getStyleScope();
		const cls = scope?.getAttribute("class") ?? "";
		if (this._portal.getAttribute("class") !== cls) this._portal.setAttribute("class", cls);
		const mirrored = (name) => name.startsWith("mono-") && !name.startsWith("mono-tooltip-");
		const wanted = /* @__PURE__ */ new Map();
		if (scope) {
			for (const a of Array.from(scope.attributes)) if (mirrored(a.name)) wanted.set(a.name, a.value);
		}
		for (const a of Array.from(this._portal.attributes)) if (mirrored(a.name) && !wanted.has(a.name)) this._portal.removeAttribute(a.name);
		for (const [name, value] of wanted) if (this._portal.getAttribute(name) !== value) this._portal.setAttribute(name, value);
		this._syncPortalVars(scope);
	}
	/**
	* Carry the component's public custom properties across the portal (see
	* `styleVars`). Only values that DIFFER from the portal's own resolution are
	* written, so a theme-level token stays inherited and only a real override
	* (an ancestor of the host, or an inline style on it) is copied.
	*/
	_syncPortalVars(scope) {
		const names = this.opts.styleVars?.();
		if (!this._portal || !scope || !names?.length) return;
		const from = getComputedStyle(scope);
		const here = getComputedStyle(this._portal);
		for (const name of names) {
			const value = from.getPropertyValue(name);
			if (!value) {
				if (this._portal.style.getPropertyValue(name)) this._portal.style.removeProperty(name);
				continue;
			}
			if ((this._portal.style.getPropertyValue(name) || here.getPropertyValue(name)) !== value) this._portal.style.setProperty(name, value);
		}
	}
	/**
	* Watch the style-scope's `class` attribute so the portal stays in sync even
	* when the host toggles state classes (e.g. `open`) imperatively in
	* `updated()`, which runs after the controller's `hostUpdated`.
	*/
	_observeStyleScope() {
		if (this._classObserver || typeof MutationObserver === "undefined") return;
		const scope = this.opts.getStyleScope();
		if (!scope) return;
		this._classObserver = new MutationObserver((records) => {
			if (records.some((r) => r.attributeName === "class" || r.attributeName?.startsWith("mono-"))) this._syncPortalClass();
		});
		this._classObserver.observe(scope, { attributes: true });
	}
	_enterStack() {
		this._bindViewport();
		if (this._registered) return;
		registerPopupLayer(this);
		this._registered = true;
	}
	_leaveStack() {
		this._unbindViewport();
		if (!this._registered) return;
		unregisterPopupLayer(this);
		this._registered = false;
	}
	/** PopupLayer hook — write the chained z onto the portal (root context). */
	setStackZ(z) {
		(this._portal ?? this.host).style.setProperty("--mono-popup-z", String(z));
	}
	/** Where panel-internal elements live now (portal while adopted, else host). */
	get panelRoot() {
		return this._adopted && this._portal ? this._portal : this.host.renderRoot;
	}
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
	containsInPath(path) {
		if (this._portal && path.includes(this._portal)) return true;
		return this.ownsNestedInPath(path);
	}
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
	ownsNestedInPath(path) {
		const roots = this._portal ? [this.host, this._portal] : [this.host];
		return nestedPortalInPath(path.filter((n) => n !== this._portal), roots);
	}
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
	_bindViewport() {
		if (isServer || this._viewportBound) return;
		window.addEventListener("scroll", this._onViewport, {
			capture: true,
			passive: true
		});
		window.addEventListener("resize", this._onViewport, { passive: true });
		this._viewportBound = true;
	}
	_unbindViewport() {
		if (isServer) return;
		if (this._viewportFrame) {
			cancelAnimationFrame(this._viewportFrame);
			this._viewportFrame = 0;
		}
		if (!this._viewportBound) return;
		window.removeEventListener("scroll", this._onViewport, true);
		window.removeEventListener("resize", this._onViewport);
		this._viewportBound = false;
	}
	reposition() {
		if (isServer) return;
		if (!this._canPortal) return;
		const panel = this._panel ?? this.opts.getPanel();
		if (!panel) return;
		const anchor = this.opts.getAnchor();
		if (!anchor || !anchor.isConnected) return;
		if (typeof this.opts.matchWidth === "function" ? this.opts.matchWidth() : this.opts.matchWidth) panel.style.width = `${anchor.getBoundingClientRect().width}px`;
		const constrain = this.opts.constrainSize?.() ?? false;
		const placement = computePopupPlacement(anchor, panel, {
			side: this.opts.side?.(),
			align: this.opts.align?.(),
			offset: this.opts.offset?.(),
			flip: this.opts.flip?.(),
			shift: this.opts.shift?.(),
			constrain
		});
		applyPopupPlacement(panel, placement, constrain);
		if (this._resolvedSide !== placement.side) {
			this._resolvedSide = placement.side;
			this.opts.onSideResolved?.(placement.side);
		}
	}
};
//#endregion
export { pathOwnedBy as i, applyPopupPlacement as n, computePopupPlacement as r, PopupPortalController as t };
