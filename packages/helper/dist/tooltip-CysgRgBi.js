import { n as unwrapReactive, t as resolveMaybeReactive } from "./reactive-D3EERqgO.js";
import { a as unregisterPopupLayer, r as registerPopupLayer } from "./popup-stack-CEEMib__.js";
//#region src/components/tooltip/tooltip-config.ts
var DEFAULT_TOOLTIP_OPTIONS = {
	allowHTML: false,
	placement: "top",
	offset: 6,
	padding: 8,
	flip: true,
	shift: true,
	arrow: true,
	trigger: ["hover", "focus"],
	delay: [100, 0],
	interactive: false,
	variant: "inverted",
	size: "md",
	disabled: false,
	hideOnClick: true
};
var globalOptions = null;
/** @internal — written by `createMonoTooltip` / `resetMonoTooltip`. */
function setMonoTooltipGlobal(options) {
	globalOptions = options ? { ...options } : null;
}
/** The current global options, or `null` when none were set. */
function getMonoTooltipGlobal() {
	return globalOptions;
}
/** Keys of the global object that configure the addon, not a tooltip. */
var NOT_TOOLTIP_OPTIONS = new Set(["attributes"]);
/**
* `DEFAULTS ← local ← global ← anchor`, key by key; `undefined` never
* overwrites. `anchor` is the options read off the element's own attributes.
*/
function resolveTooltipOptions(local, anchor) {
	const out = { ...DEFAULT_TOOLTIP_OPTIONS };
	for (const layer of [
		local,
		globalOptions,
		anchor
	]) {
		if (!layer) continue;
		for (const [key, value] of Object.entries(layer)) if (value !== void 0 && !NOT_TOOLTIP_OPTIONS.has(key)) out[key] = value;
	}
	return out;
}
//#endregion
//#region src/components/tooltip/tooltip-loader.ts
/**
* Cached loader for the OPTIONAL `@floating-ui/dom` peer (which itself depends on
* `@floating-ui/core` — both are the consumer's to install).
*
* Loaded on the FIRST show, never at import: registering a tooltip in
* `<script setup>` costs nothing until somebody actually hovers. Externalized in
* both vite configs, so the consumer's bundler resolves and splits it.
*/
var _floatingPromise = null;
function loadFloatingUi() {
	_floatingPromise ??= import("@floating-ui/dom").catch((err) => {
		_floatingPromise = null;
		throw new Error("[mono-tooltip] needs the optional peer dependencies \"@floating-ui/dom\" and \"@floating-ui/core\". Install them in your app: pnpm add @floating-ui/dom @floating-ui/core" + (err?.message ? ` (original error: ${err.message})` : ""));
	});
	return _floatingPromise;
}
//#endregion
//#region src/components/tooltip/control-tooltip.ts
/** Grace period so an INTERACTIVE tooltip can be reached across the offset gap. */
var INTERACTIVE_HIDE_GRACE = 120;
/** Longest the exit transition may take before the element is removed anyway. */
var EXIT_FALLBACK_MS = 200;
var nextId = 0;
var live = /* @__PURE__ */ new Set();
var bound = false;
function each(fn) {
	for (const inst of Array.from(live)) fn(inst);
}
var onPointerOver = (e) => {
	const path = e.composedPath();
	each((i) => i._pointerOver(path, e));
};
var onPointerOut = (e) => {
	if (!e.relatedTarget) each((i) => i._pointerOver([], e));
};
var onFocusIn = (e) => {
	const path = e.composedPath();
	each((i) => i._focusIn(path));
};
var onFocusOut = (e) => {
	if (!e.relatedTarget) each((i) => i._focusIn([]));
};
var onClick = (e) => {
	const path = e.composedPath();
	each((i) => i._click(path));
};
/**
* A REAL document. `typeof document` is not enough on the server: Lit's SSR DOM shim (loaded by
* VitePress / Nuxt SSR through @mono-lit/helper's server entries) defines a global `document` stub with no
* `addEventListener`, so a `typeof` guard passed and `createMonoTooltip()` in an app's setup threw
* "document.addEventListener is not a function" during server render.
*/
function hasLiveDocument() {
	return typeof document !== "undefined" && typeof document.addEventListener === "function";
}
function bindDocument() {
	if (bound || !hasLiveDocument()) return;
	document.addEventListener("pointerover", onPointerOver, true);
	document.addEventListener("pointerout", onPointerOut, true);
	document.addEventListener("focusin", onFocusIn, true);
	document.addEventListener("focusout", onFocusOut, true);
	document.addEventListener("click", onClick, true);
	bound = true;
}
function unbindDocument() {
	if (!bound || live.size > 0 || !hasLiveDocument()) return;
	document.removeEventListener("pointerover", onPointerOver, true);
	document.removeEventListener("pointerout", onPointerOut, true);
	document.removeEventListener("focusin", onFocusIn, true);
	document.removeEventListener("focusout", onFocusOut, true);
	document.removeEventListener("click", onClick, true);
	bound = false;
}
var warnedSelectors = /* @__PURE__ */ new Set();
function safeMatches(el, selector) {
	try {
		return el.matches(selector);
	} catch {
		if (!warnedSelectors.has(selector)) {
			warnedSelectors.add(selector);
			console.warn(`[mono-tooltip] invalid selector: ${JSON.stringify(selector)}`);
		}
		return false;
	}
}
/** Every element a non-selector target names (refs / proxies unwrapped). */
function toElements(value) {
	if (!value || typeof value === "string") return [];
	if (value instanceof Element) return [value];
	const out = [];
	const list = typeof value[Symbol.iterator] === "function" ? Array.from(value) : Array.from(value);
	for (const item of list) {
		const raw = unwrapReactive(item);
		const el = raw instanceof Element ? raw : raw?.$el;
		if (el instanceof Element) out.push(el);
	}
	return out;
}
function unwrapTarget(target) {
	const value = resolveMaybeReactive(target);
	if (value && !(value instanceof Element) && typeof value === "object" && value.$el instanceof Element) return value.$el;
	return value;
}
/** Composed-tree parent — crosses shadow boundaries (cf. `popup-portal.ts`). */
function flatTreeParent(node) {
	const slot = node.assignedSlot;
	if (slot) return slot;
	const parent = node.parentNode;
	if (parent instanceof ShadowRoot) return parent.host;
	return parent;
}
/**
* The theme classes of the NEAREST scoped theme wrapper above the anchor.
*
* The tooltip lives on `<body>`, so it already inherits the page-level theme
* (`applyTheme` writes to body). A section themed on its own — `<div class="mono-theme
* dark theme-color-rose">` — is not in its inheritance chain any more; copying that
* wrapper's theme classes onto the tooltip re-resolves the same tokens there.
*/
function scopedThemeClasses(anchor) {
	const stop = new Set([
		document.body,
		document.documentElement,
		null
	]);
	for (let n = anchor; !stop.has(n); n = flatTreeParent(n)) {
		if (!(n instanceof Element)) continue;
		const found = Array.from(n.classList).filter((c) => c === "mono-theme" || c === "dark" || c === "light" || c.startsWith("theme-"));
		if (found.length) return found;
	}
	return [];
}
function isFocusVisible(el) {
	if (!(el instanceof Element)) return false;
	try {
		return el.matches(":focus-visible");
	} catch {
		return true;
	}
}
/**
* How far the arrow must stay from the bubble's corners: past the rounding, on the
* straight part of the edge. A fixed 4px let a `-start` / `-end` arrow land on the
* curve of a well-rounded flavor (a pill, in the extreme), where the edge has
* already pulled away and the diamond hung off the corner.
*
* Read from the PAINTED radius, so every flavor and radius preset is covered.
* CSS scales radii that overflow the box down to fit it (a `9999px` pill paints
* half its height), hence the clamp to half the smaller side. The diamond is the
* arrow box rotated 45°: where it meets the edge it is `size·√2` wide, so it
* overhangs its own box by `size·(√2−1)/2` on each side. Floating UI caps the
* padding itself when the bubble is too short for it — the arrow then centres on
* the edge and the bubble shifts so it still points at the trigger.
*/
function arrowPadding(bubble, arrowEl) {
	const cs = getComputedStyle(bubble);
	const half = Math.min(bubble.offsetWidth, bubble.offsetHeight) / 2;
	const radius = Math.max(...[
		cs.borderTopLeftRadius,
		cs.borderTopRightRadius,
		cs.borderBottomRightRadius,
		cs.borderBottomLeftRadius
	].map((v) => {
		const n = parseFloat(v) || 0;
		return v.trim().endsWith("%") ? n / 100 * half * 2 : n;
	}));
	const overhang = arrowEl.offsetWidth * (Math.SQRT2 - 1) / 2;
	return Math.max(4, Math.ceil(Math.min(radius, half) + overhang) + 1);
}
function toDelays(delay) {
	if (Array.isArray(delay)) return [Number(delay[0]) || 0, Number(delay[1]) || 0];
	const d = Number(delay) || 0;
	return [d, d];
}
function toTriggers(trigger) {
	return new Set(Array.isArray(trigger) ? trigger : [trigger]);
}
/**
* The anchor's own text, when no `content` option is given: the declarative
* `mono-tooltip-content` / `mono-tooltip-message`, then a native `title` (moved to
* `data-mono-title` while open), then `aria-label`.
*/
function anchorText(anchor) {
	const attr = (name) => anchor.getAttribute(name)?.trim() || null;
	return attr("mono-tooltip-content") ?? attr("mono-tooltip-message") ?? attr("data-mono-title") ?? attr("title") ?? attr("aria-label");
}
function resolveContent(content, anchor) {
	const value = typeof content === "function" ? content(anchor) : content;
	if (value instanceof Node) return value;
	if (value !== void 0 && value !== null && String(value).trim() !== "") return String(value);
	if (content !== void 0) return null;
	return anchorText(anchor);
}
var TooltipInstance = class {
	constructor(_target, options, _anchorOptions) {
		this._target = _target;
		this._anchorOptions = _anchorOptions;
		this._open = null;
		this._reasons = /* @__PURE__ */ new Set();
		this._token = 0;
		this._pending = null;
		this._suppressed = null;
		this._lastPath = [];
		this._destroyed = false;
		this._id = `mono-tooltip-${++nextId}`;
		this._options = { ...options };
		if (!hasLiveDocument()) {
			this._destroyed = true;
			return;
		}
		live.add(this);
		bindDocument();
	}
	get isOpen() {
		return !!this._open;
	}
	get anchor() {
		return this._open?.anchor ?? null;
	}
	get tooltip() {
		return this._open?.el ?? null;
	}
	async show(anchor) {
		const el = anchor ?? this._firstTarget();
		if (!el) return;
		this._lastPath = [];
		await this._openOn(el, "manual", 0);
	}
	hide() {
		this._close(false);
	}
	async toggle(anchor) {
		if (this._open && (!anchor || anchor === this._open.anchor)) this.hide();
		else await this.show(anchor);
	}
	update(options) {
		this._options = {
			...this._options,
			...options
		};
		this._refresh();
	}
	/** Re-apply the resolved options to an open tooltip (or close it when now disabled). */
	_refresh() {
		const o = this._resolved(this._open?.anchor);
		if (o.disabled) return this._close(true);
		if (this._open) {
			this._applyAppearance(this._open.el, o);
			this._renderBody(this._open, o);
		}
	}
	setContent(content) {
		this.update({ content });
	}
	enable() {
		this.update({ disabled: false });
	}
	disable() {
		this.update({ disabled: true });
	}
	destroy() {
		if (this._destroyed) return;
		this._close(true);
		this._destroyed = true;
		live.delete(this);
		unbindDocument();
	}
	/** @internal — pointer entered something (or `[]`: left the window). */
	_pointerOver(path, e) {
		if (e.pointerType === "touch") return;
		const candidate = this._findAnchor(path);
		const o = this._resolved(candidate ?? this._open?.anchor);
		const anchor = candidate && toTriggers(o.trigger).has("hover") ? candidate : null;
		if (this._suppressed && anchor !== this._suppressed) this._suppressed = null;
		if (anchor) {
			if (anchor === this._suppressed || o.disabled) return;
			this._lastPath = path;
			if (this._open?.anchor === anchor) {
				this._cancelHide();
				this._reasons.add("hover");
				return;
			}
			if (this._pending === anchor) return;
			this._openOn(anchor, "hover", toDelays(o.delay)[0]);
			return;
		}
		if (o.interactive && this._open && path.includes(this._open.el)) {
			this._cancelHide();
			return;
		}
		this._dropReason("hover");
	}
	/** @internal — focus landed somewhere (or `[]`: focus left the document). */
	_focusIn(path) {
		const candidate = this._findAnchor(path);
		const o = this._resolved(candidate);
		const anchor = candidate && toTriggers(o.trigger).has("focus") ? candidate : null;
		if (anchor && !o.disabled && isFocusVisible(path[0])) {
			this._lastPath = path;
			if (this._open?.anchor === anchor) {
				this._cancelHide();
				this._reasons.add("focus");
			} else this._openOn(anchor, "focus", toDelays(o.delay)[0]);
			return;
		}
		if (this._open && path.includes(this._open.el)) return;
		this._dropReason("focus");
	}
	/** @internal */
	_click(path) {
		const anchor = this._findAnchor(path);
		const o = this._resolved(anchor ?? this._open?.anchor);
		const triggers = toTriggers(o.trigger);
		const inTooltip = !!this._open && path.includes(this._open.el);
		if (triggers.has("click") && !o.disabled) {
			if (anchor) {
				if (this._open?.anchor === anchor && this._reasons.has("click")) this._close(false);
				else {
					this._lastPath = path;
					this._openOn(anchor, "click", 0);
				}
				return;
			}
			if (!inTooltip && this._reasons.has("click")) this._close(false);
			return;
		}
		if (anchor && o.hideOnClick) {
			this._suppressed = anchor;
			if (this._pending === anchor) this._cancelShow();
			if (this._open?.anchor === anchor && !this._reasons.has("manual")) this._close(false);
		}
	}
	_resolved(anchor) {
		const own = anchor && this._anchorOptions ? this._anchorOptions(anchor) : null;
		return resolveTooltipOptions(this._options, own);
	}
	/** The innermost element on the path this controller's target names. */
	_findAnchor(path) {
		if (!path.length) return null;
		const value = unwrapTarget(this._target);
		if (!value) return null;
		if (typeof value === "string") {
			for (const node of path) if (node instanceof Element && safeMatches(node, value)) return node;
			return null;
		}
		const set = new Set(toElements(value));
		if (!set.size) return null;
		for (const node of path) if (set.has(node)) return node;
		return null;
	}
	_firstTarget() {
		const value = unwrapTarget(this._target);
		if (typeof value === "string") try {
			return document.querySelector(value);
		} catch {
			return null;
		}
		return toElements(value)[0] ?? null;
	}
	_cancelShow() {
		clearTimeout(this._showTimer);
		this._showTimer = void 0;
		this._pending = null;
	}
	_cancelHide() {
		clearTimeout(this._hideTimer);
		this._hideTimer = void 0;
	}
	/** One reason to stay open went away — close once none is left. */
	_dropReason(reason) {
		if (this._pending && !this._open) {
			this._cancelShow();
			this._token++;
		}
		if (!this._open || !this._reasons.has(reason)) return;
		this._reasons.delete(reason);
		if (this._reasons.size) return;
		const o = this._resolved(this._open.anchor);
		let delay = toDelays(o.delay)[1];
		if (o.interactive) delay = Math.max(delay, INTERACTIVE_HIDE_GRACE);
		this._cancelHide();
		if (delay > 0) this._hideTimer = setTimeout(() => this._close(false), delay);
		else this._close(false);
	}
	async _openOn(anchor, reason, delay) {
		if (this._destroyed) return;
		this._cancelHide();
		this._cancelShow();
		if (this._open?.anchor === anchor) {
			this._reasons.add(reason);
			return;
		}
		const token = ++this._token;
		if (delay > 0) {
			this._pending = anchor;
			await new Promise((resolve) => {
				this._showTimer = setTimeout(resolve, delay);
			});
			if (token !== this._token) return;
		}
		this._pending = null;
		await this._mount(anchor, reason, token);
	}
	async _mount(anchor, reason, token) {
		const o = this._resolved(anchor);
		if (o.disabled || !anchor.isConnected) return;
		const content = resolveContent(o.content, anchor);
		if (content === null) return;
		let floating;
		try {
			floating = await loadFloatingUi();
		} catch (err) {
			console.error(err);
			return;
		}
		if (token !== this._token || this._destroyed || !anchor.isConnected) return;
		if (this._open) this._teardown(this._open);
		const el = document.createElement("div");
		el.id = this._id;
		el.setAttribute("role", "tooltip");
		el.setAttribute("mono-tooltip", "");
		const body = document.createElement("div");
		body.setAttribute("mono-tooltip-body", "");
		const arrow = document.createElement("div");
		arrow.setAttribute("mono-tooltip-arrow", "");
		el.append(body, arrow);
		this._applyAppearance(el, o, anchor);
		if (o.onShow?.(anchor, el) === false) return;
		const state = {
			anchor,
			el,
			body,
			arrow,
			stopAutoUpdate: () => {},
			layer: {
				setStackZ: (z) => el.style.setProperty("--mono-popup-z", String(z)),
				onStackEscape: () => this._close(false)
			},
			stashed: [],
			describedBy: anchor.getAttribute("aria-describedby"),
			observer: null
		};
		if (this._anchorOptions && typeof MutationObserver !== "undefined") {
			state.observer = new MutationObserver((records) => {
				if (this._open !== state) return;
				if (records.some((r) => r.attributeName?.startsWith("mono-tooltip-"))) this._refresh();
			});
			state.observer.observe(anchor, { attributes: true });
		}
		this._open = state;
		this._reasons = new Set([reason]);
		this._renderContent(body, content, o.allowHTML);
		((typeof o.appendTo === "function" ? o.appendTo() : o.appendTo) ?? document.body).appendChild(el);
		this._stashTitles(state);
		const ids = (state.describedBy ?? "").split(/\s+/).filter(Boolean);
		if (!ids.includes(this._id)) anchor.setAttribute("aria-describedby", [...ids, this._id].join(" "));
		registerPopupLayer(state.layer);
		const reposition = () => void this._position(floating, state);
		state.stopAutoUpdate = floating.autoUpdate(anchor, el, reposition);
		await this._position(floating, state);
		if (this._open === state) requestAnimationFrame(() => {
			if (this._open === state) el.setAttribute("data-open", "");
		});
	}
	async _position(floating, state) {
		if (this._open !== state) return;
		if (!state.anchor.isConnected) {
			this._close(true);
			return;
		}
		const o = this._resolved(state.anchor);
		const { computePosition, offset, flip, shift, arrow, hide } = floating;
		const middleware = [offset(o.offset)];
		if (o.flip) middleware.push(flip({ padding: o.padding }));
		if (o.shift) middleware.push(shift({ padding: o.padding }));
		if (o.arrow) middleware.push(arrow({
			element: state.arrow,
			padding: arrowPadding(state.el, state.arrow)
		}));
		middleware.push(hide());
		const { x, y, placement, middlewareData } = await computePosition(state.anchor, state.el, {
			placement: o.placement,
			strategy: "fixed",
			middleware
		});
		if (this._open !== state) return;
		state.el.style.left = `${x}px`;
		state.el.style.top = `${y}px`;
		const [side, align] = placement.split("-");
		state.el.setAttribute("data-side", side);
		if (align) state.el.setAttribute("data-align", align);
		else state.el.removeAttribute("data-align");
		const a = middlewareData.arrow;
		state.arrow.style.left = a?.x != null ? `${a.x}px` : "";
		state.arrow.style.top = a?.y != null ? `${a.y}px` : "";
		state.el.style.visibility = middlewareData.hide?.referenceHidden ? "hidden" : "";
	}
	/** Attributes + classes the CSS keys on. Re-run by `update()` on an open tooltip. */
	_applyAppearance(el, o, anchor) {
		el.className = [
			"mono-tooltip",
			...scopedThemeClasses(anchor ?? this._open?.anchor ?? el),
			...o.class ? o.class.split(/\s+/) : []
		].filter(Boolean).join(" ");
		const attr = (name, value) => value === null ? el.removeAttribute(name) : el.setAttribute(name, value);
		attr("mono-variant", o.variant && o.variant !== "inverted" ? o.variant : null);
		attr("mono-color", o.color ?? null);
		attr("mono-size", o.size && o.size !== "md" ? o.size : null);
		attr("mono-interactive", o.interactive ? "" : null);
		attr("mono-arrow", o.arrow ? "" : null);
		if (o.maxWidth) el.style.setProperty("--mono-tooltip-max-width", o.maxWidth);
		else el.style.removeProperty("--mono-tooltip-max-width");
	}
	_renderBody(state, o) {
		const content = resolveContent(o.content, state.anchor);
		if (content === null) return this._close(true);
		this._renderContent(state.body, content, o.allowHTML);
	}
	_renderContent(body, content, allowHTML) {
		if (content instanceof Node) body.replaceChildren(content);
		else if (allowHTML) body.innerHTML = content;
		else body.textContent = content;
	}
	/**
	* Move `title`s aside while open — the anchor's, and any between the pointer
	* and the anchor (a component may render one on an inner element) — or the
	* browser shows its own tooltip on top of ours.
	*/
	_stashTitles(state) {
		const chain = [];
		for (const node of this._lastPath) {
			if (node instanceof Element) chain.push(node);
			if (node === state.anchor) break;
		}
		if (!chain.includes(state.anchor)) chain.push(state.anchor);
		for (const el of chain) {
			const title = el.getAttribute("title");
			if (title === null) continue;
			state.stashed.push([el, title]);
			el.setAttribute("data-mono-title", title);
			el.removeAttribute("title");
		}
	}
	_close(force) {
		this._cancelShow();
		this._cancelHide();
		this._token++;
		const state = this._open;
		if (!state) return;
		if (!force && this._resolved(state.anchor).onHide?.(state.anchor, state.el) === false) return;
		this._teardown(state);
	}
	_teardown(state) {
		state.stopAutoUpdate();
		state.observer?.disconnect();
		unregisterPopupLayer(state.layer);
		for (const [el, title] of state.stashed) {
			if (el.getAttribute("title") === null) el.setAttribute("title", title);
			el.removeAttribute("data-mono-title");
		}
		const ids = (state.anchor.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((id) => id && id !== this._id);
		if (ids.length) state.anchor.setAttribute("aria-describedby", ids.join(" "));
		else if (state.describedBy === null) state.anchor.removeAttribute("aria-describedby");
		else state.anchor.setAttribute("aria-describedby", state.describedBy);
		if (this._open === state) {
			this._open = null;
			this._reasons.clear();
		}
		const el = state.el;
		el.removeAttribute("data-open");
		el.removeAttribute("id");
		let done = false;
		const remove = () => {
			if (done) return;
			done = true;
			el.remove();
		};
		el.addEventListener("transitionend", remove, { once: true });
		setTimeout(remove, EXIT_FALLBACK_MS);
	}
};
/**
* Attach a tooltip to every element `target` names — now or later.
*
* ```ts
* // <script setup> — the elements need not exist yet
* const tip = controlMonoTooltip('.save-btn', { content: 'Save changes', placement: 'bottom' })
* onBeforeUnmount(() => tip.destroy())
* ```
*
* `target` is a CSS selector, an element, a list of elements, or a Vue ref /
* getter of any of those. Light `<mono-*>` elements, shadow `<mono-shadow-*>`
* hosts and elements inside open shadow roots all match.
*
* Needs the optional peers `@floating-ui/dom` + `@floating-ui/core`, loaded on
* the first show. Options set with `createMonoTooltip` override these.
*/
function controlMonoTooltip(target, options = {}) {
	return new TooltipInstance(target, options);
}
/**
* @internal — a controller with a per-anchor options layer. Used by the
* declarative `mono-tooltip-*` attributes (`tooltip-declarative.ts`).
*/
function createTooltipController(target, options, anchorOptions) {
	return new TooltipInstance(target, options, anchorOptions);
}
/** Alias, matching the `monoX` / `controlMonoX` pairs of the other controllers. */
var monoTooltip = controlMonoTooltip;
/** @internal — close and forget every live controller. Public as `destroyAllMonoTooltips`. */
function destroyAllTooltipControllers() {
	each((i) => i.destroy());
}
//#endregion
//#region src/components/tooltip/tooltip-declarative.ts
/** The two text attributes — `message` is an alias of `content`. */
var TOOLTIP_ATTRIBUTE_SELECTOR = "[mono-tooltip-content], [mono-tooltip-message]";
var declarative = null;
/**
* Per-element options, from `mono-tooltip-<option>` attributes:
*
* | attribute | option |
* | --- | --- |
* | `mono-tooltip-content` / `-message` | `content` (text) |
* | `mono-tooltip-placement` / `-variant` / `-color` / `-size` | same name |
* | `mono-tooltip-trigger` | `"hover focus"`, `"click"`, … |
* | `mono-tooltip-delay` | `"300"` or `"300 100"` |
* | `mono-tooltip-offset` / `-padding` | numbers |
* | `mono-tooltip-max-width` / `-class` | strings |
* | `mono-tooltip-arrow` / `-flip` / `-shift` / `-interactive` / `-html` / `-disabled` / `-hide-on-click` | booleans — present = on, `"false"` = off |
*/
function readTooltipAttributes(el) {
	const get = (name) => el.getAttribute(`mono-tooltip-${name}`);
	const str = (name) => get(name)?.trim() || void 0;
	const bool = (name) => {
		const v = get(name);
		return v === null ? void 0 : v.trim() !== "false";
	};
	const num = (name) => {
		const v = str(name);
		const n = v === void 0 ? NaN : Number(v);
		return Number.isFinite(n) ? n : void 0;
	};
	const list = (name) => str(name)?.split(/[\s,]+/).filter(Boolean);
	const content = get("content") ?? get("message") ?? void 0;
	const delay = list("delay")?.map(Number).filter(Number.isFinite);
	return {
		content,
		placement: str("placement"),
		variant: str("variant"),
		color: str("color"),
		size: str("size"),
		trigger: list("trigger"),
		delay: delay?.length ? delay.length > 1 ? [delay[0], delay[1]] : delay[0] : void 0,
		offset: num("offset"),
		padding: num("padding"),
		maxWidth: str("max-width"),
		class: str("class"),
		arrow: bool("arrow"),
		flip: bool("flip"),
		shift: bool("shift"),
		interactive: bool("interactive"),
		allowHTML: bool("html"),
		disabled: bool("disabled"),
		hideOnClick: bool("hide-on-click")
	};
}
/**
* Set the app-wide tooltip options AND switch on the `mono-tooltip-*` attributes.
* Call once — usually in `main.ts`:
*
* ```ts
* app.use(createMonoTooltip({ delay: [300, 0] }))
* // or simply
* createMonoTooltip()
* ```
*
* The options WIN over the ones passed to `controlMonoTooltip`; an element's own
* `mono-tooltip-*` attributes win over them. A later call replaces the previous
* global options wholesale. `attributes: false` keeps the options but turns the
* declarative attributes off.
*/
function createMonoTooltip(options = {}) {
	setMonoTooltipGlobal(options);
	const wantAttributes = options.attributes !== false;
	if (wantAttributes && !declarative && hasLiveDocument()) declarative = createTooltipController(TOOLTIP_ATTRIBUTE_SELECTOR, {}, readTooltipAttributes);
	else if (!wantAttributes && declarative) {
		declarative.destroy();
		declarative = null;
	}
	return {
		options: { ...options },
		install() {}
	};
}
/**
* Close and forget every live tooltip controller — the attribute one included
* (a later `createMonoTooltip()` turns the attributes back on). For tests and a
* full app teardown; the global options are kept.
*/
function destroyAllMonoTooltips() {
	destroyAllTooltipControllers();
	declarative = null;
}
/** Drop the global options and turn the attributes off (tests, runtime reconfiguration). */
function resetMonoTooltip() {
	setMonoTooltipGlobal(null);
	declarative?.destroy();
	declarative = null;
}
//#endregion
export { resetMonoTooltip as a, loadFloatingUi as c, resolveTooltipOptions as d, readTooltipAttributes as i, DEFAULT_TOOLTIP_OPTIONS as l, createMonoTooltip as n, controlMonoTooltip as o, destroyAllMonoTooltips as r, monoTooltip as s, TOOLTIP_ATTRIBUTE_SELECTOR as t, getMonoTooltipGlobal as u };
