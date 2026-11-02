import { g as monoHostChildNodes } from "../mono-ui-jtBvJ9d5.js";
import { n as detachEventHandlers, t as applyProps } from "../element-props-xvw0EB7H.js";
import { t as monoModal } from "../mono-modal-controller-ClObbHUs.js";
import { i as registerPopupLayer, o as unregisterPopupLayer, r as refreshPopupStack, t as getOpenPopupLayers } from "../popup-stack-C64WCuXq.js";
import { t as customElement } from "../mono-element-9uQRbp5X.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, r as booleanStringConverter, s as optionalNumberConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { a as parkDetachedNodes, i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B980aknU.js";
import "../mono-button-DT6otWqs.js";
import { i as pathOwnedBy } from "../popup-portal-CINuVjNY.js";
import { n as isBelowBreakpoint, r as resolveAutoFullscreen, t as autoFullscreenConverter } from "../breakpoints-DllybT82.js";
import { LitElement, html, isServer, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/modal/modal-core.ts
/** Per-instance id seed for the light build's heading ids (they live in the
*  document, so they must be unique). The shadow build scopes ids to its own
*  root and uses a constant — see `_headingIdBase`. */
let modalIdSeq = 0;
/**
* Named dimension presets for the sizing props — `width="lg"`, `max-height="sm"`.
*
* Deliberately the same six tokens the `size` prop uses, but a different axis:
* `size` is the CONTENT scale (padding, type, close button, radius) and never
* touches the panel's box, while these name a MEASURE. `size="sm" width="xl"` is a
* compact, wide dialog — mixing the two is the point.
*
* Widths carry the same viewport clamp as the default `min(90vw, 520px)`, so a
* preset can never overflow a phone; `md` reproduces that default exactly. Heights
* are viewport-relative and match the drawer's top/bottom ladder, so one token means
* the same thing on both components.
*/
const WIDTH_PRESETS = {
	xs: "min(90vw, 300px)",
	sm: "min(90vw, 380px)",
	md: "min(90vw, 520px)",
	lg: "min(90vw, 680px)",
	xl: "min(95vw, 880px)",
	xxl: "min(95vw, 1080px)"
};
const HEIGHT_PRESETS = {
	xs: "22vh",
	sm: "30vh",
	md: "50vh",
	lg: "70vh",
	xl: "85vh",
	xxl: "95vh"
};
/**
* Normalize a sizing prop to a CSS length string.
* - a preset token (`"xs"`…`"xxl"`) → the ladder for `axis`
* - `number` (or numeric string) → `${n}px`
* - any other non-empty string → passed through verbatim (`"12rem"`, `"80%"`, …)
* - `null` / `undefined` / `''` → `undefined` (treated as "not set")
*
* The token lookup runs before the numeric/passthrough branches, which is safe:
* no CSS length is spelled `xs`…`xxl`, so there is nothing for it to shadow.
*/
function toCssSize(value, axis) {
	if (value === null || value === void 0) return void 0;
	if (typeof value === "number") return Number.isFinite(value) ? `${value}px` : void 0;
	const trimmed = String(value).trim();
	if (trimmed === "") return void 0;
	const preset = (axis === "width" ? WIDTH_PRESETS : HEIGHT_PRESETS)[trimmed.toLowerCase()];
	if (preset) return preset;
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
	return trimmed;
}
/**
* `MonoModalCore` — render-mode-agnostic logic for `mono-modal`: props/hybrid
* aliases, the open/close model (`show`/`hide`/`toggle` + `mno-*` events), the
* `PopupLayer` surface (shared z-stack / scroll-lock / topmost-Escape via the
* SSR-safe `popup-stack`), draggable-header logic, sizing, and the shared modal
* markup (`_renderModalBody`). SSR-safe: `popup-stack` no-ops server-side and the
* `window`/drag access is `isServer`-guarded.
*
* Each build supplies the render root + slot/icon strategy:
*  - light (`mono-modal.ts`): renders into a `<body>` portal that IS the
*    `.mono-modal` root, `data-mono-slot` placeholders, UnoCSS `.i-mdi-close`.
*  - shadow (`mono-modal.shadow.ts`): a real shadow root with an inner
*    `.mono-modal` root, native `<slot>`s, inline-SVG ✕ (mirrors dropdown).
*/
const MonoModalCore = (superClass) => {
	class MonoModalCoreClass extends superClass {
		static {
			this.monoPendingAuto = "never";
		}
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.title = "";
			this.subtitle = "";
			this.modelValue = false;
			this.dismissible = true;
			this.persistent = false;
			this.overlay = true;
			this.closeOnEscape = true;
			this.closeOnOverlay = true;
			this.lockScroll = true;
			this.draggable = false;
			this.stackable = false;
			this.autoFullscreen = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._slotsCaptured = false;
			this._hasHeadSlotState = false;
			this._hasTitleSlotState = false;
			this._hasSubtitleSlotState = false;
			this._hasBodySlotState = false;
			this._hasFootSlotState = false;
			this._hasModalAbove = false;
			this._dragging = false;
			this._modalZ = 600;
			this._dragX = 0;
			this._dragY = 0;
			this._dragStartX = 0;
			this._dragStartY = 0;
			this._dragOriginX = 0;
			this._dragOriginY = 0;
			this._rootEl = null;
			this.bindRoot = (el) => {
				this._rootEl = el ?? null;
				this._applyRootAttrs(this._rootEl);
			};
			this._outsideBound = false;
			this._outsideArm = null;
			this._openedAt = 0;
			this._onOutsideClick = (event) => {
				if (!this.modelValue || this.overlay) return;
				if (!this.closeOnOverlay || !this.dismissible || this.persistent) return;
				if (event.timeStamp <= this._openedAt) return;
				const layers = getOpenPopupLayers();
				if (layers[layers.length - 1] !== this) return;
				const root = this.renderRoot instanceof Element ? this.renderRoot : null;
				const path = event.composedPath();
				if (pathOwnedBy(path, root ? [this, root] : [this])) return;
				this.hide("overlay", event);
			};
			this._onHeaderPointerDown = (event) => {
				if (isServer || typeof window === "undefined") return;
				if (!this.draggable || this._isFullscreen || this._autoFullscreenActive) return;
				if (event.button !== 0) return;
				if (event.target?.closest?.(".mono-modal-close")) return;
				event.preventDefault();
				this._dragging = true;
				this._dragStartX = event.clientX;
				this._dragStartY = event.clientY;
				this._dragOriginX = this._dragX;
				this._dragOriginY = this._dragY;
				window.addEventListener("pointermove", this._onPointerMove);
				window.addEventListener("pointerup", this._onPointerUp, { once: true });
				window.addEventListener("pointercancel", this._onPointerUp, { once: true });
			};
			this._onPointerMove = (event) => {
				this._dragX = this._dragOriginX + (event.clientX - this._dragStartX);
				this._dragY = this._dragOriginY + (event.clientY - this._dragStartY);
				this._applyDragVars();
			};
			this._onPointerUp = () => {
				if (typeof window !== "undefined") window.removeEventListener("pointermove", this._onPointerMove);
				this._clampIntoViewport();
				this._dragging = false;
			};
			defineHybridPropAliases(this, [
				"modelValue",
				"cssClass",
				"closeOnEscape",
				"closeOnOverlay",
				"lockScroll",
				"autoFullscreen",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight",
				"zIndex",
				"dataModal"
			]);
			defineHybridPropAlias(this, "controlModal", "dataModal");
			Object.defineProperty(this, "css-class", {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "cssclass", {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = booleanStringConverter.fromAttribute(newValue);
				return;
			}
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		_bindController() {
			const next = this.dataModal;
			if (this._boundController === next) return;
			this._unbindController();
			if (!next) return;
			this._boundController = next;
			next._register(this);
			this._controllerUnsub = next.subscribe(() => this._applyControllerProps());
			this._applyControllerProps();
		}
		_unbindController() {
			this._controllerUnsub?.();
			this._controllerUnsub = void 0;
			this._boundController?._unregister(this);
			this._boundController = void 0;
			detachEventHandlers(this);
		}
		_applyControllerProps() {
			const props = this._boundController?.props();
			if (!props) return;
			const { modelValue: _m, "model-value": _mv, modelvalue: _mvl, ...rest } = props;
			applyProps(this, rest);
			this.requestUpdate();
		}
		/** Duck-type marker so the exclusive-close logic targets only OTHER modals in
		*  the shared stack (not drawers/dropdowns) without an `instanceof` that the
		*  light + shadow builds — distinct classes — would each fail. */
		get _isMonoModal() {
			return true;
		}
		connectedCallback() {
			super.connectedCallback();
			this._bindController();
			if (this.modelValue) this._applyOpenSideEffects();
		}
		disconnectedCallback() {
			this._unbindController();
			this._releaseSideEffects();
			this._teardownDrag();
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			for (const key of [
				"modelValue",
				"dismissible",
				"persistent",
				"overlay",
				"closeOnEscape",
				"closeOnOverlay",
				"lockScroll",
				"draggable",
				"stackable"
			]) if (typeof this[key] === "string") this[key] = this._toBoolean(this[key]);
			if (changed.has("dataModal")) this._bindController();
			if (changed.has("modelValue")) {
				if (this.modelValue) {
					this._resetDrag();
					this._applyOpenSideEffects();
				} else this._releaseSideEffects();
			}
			super.willUpdate?.(changed);
		}
		updated(changed) {
			super.updated?.(changed);
			if (changed.has("zIndex") && this.modelValue) refreshPopupStack();
			if (changed.has("lockScroll") && this.modelValue) refreshPopupStack();
			if (changed.has("overlay") && this.modelValue) {
				this._syncOutsideClick();
				refreshPopupStack();
			}
		}
		/**
		* Full-screen is value-driven: there's no separate flag. Passing both
		* `width` and `height` as `"100%"` means "fill the viewport", which CSS can't
		* do edge-to-edge on its own (the wrap has padding), so we tag the portal and
		* let the `.fullscreen` rules take over.
		*/
		get _isFullscreen() {
			return toCssSize(this.width, "width") === "100%" && toCssSize(this.height, "height") === "100%";
		}
		/** `auto-fullscreen-<bp>` for the CSS to key its media blocks on, else null. */
		get _autoFullscreenClass() {
			const bp = resolveAutoFullscreen(this.autoFullscreen);
			return bp ? `auto-fullscreen-${bp}` : null;
		}
		/**
		* Whether auto-fullscreen is in force RIGHT NOW. Only for pointer handlers that
		* CSS cannot reach — never for rendering, which would reintroduce the SSR
		* viewport-guess problem the `@media` approach exists to avoid.
		*/
		get _autoFullscreenActive() {
			const bp = resolveAutoFullscreen(this.autoFullscreen);
			return !!bp && isBelowBreakpoint(bp);
		}
		/** Inline sizing for the panel, overriding the `size` preset / default max-height. */
		_panelSizeStyle() {
			if (this._isFullscreen) return {};
			const style = {};
			const width = toCssSize(this.width, "width");
			const height = toCssSize(this.height, "height");
			const minWidth = toCssSize(this.minWidth, "width");
			const maxWidth = toCssSize(this.maxWidth, "width");
			const minHeight = toCssSize(this.minHeight, "height");
			const maxHeight = toCssSize(this.maxHeight, "height");
			if (width) style.width = width;
			if (height) style.height = height;
			if (minWidth) style["min-width"] = minWidth;
			if (maxWidth) style["max-width"] = maxWidth;
			if (minHeight) style["min-height"] = minHeight;
			if (maxHeight) style["max-height"] = maxHeight;
			return style;
		}
		/** The state-class list for the `.mono-modal` root (light: on the portal;
		*  shadow: on the inner root). */
		_computeModalClasses() {
			return [
				"mono-modal",
				this.size,
				this.color,
				this.modelValue ? "open" : "closed",
				this.overlay ? null : "no-overlay",
				this.persistent ? "persistent" : null,
				this.dismissible ? null : "no-dismiss",
				this._isFullscreen ? "fullscreen" : null,
				this._autoFullscreenClass,
				this._hasModalAbove ? "has-modal-above" : null,
				this.draggable ? "draggable" : null,
				this._dragging ? "dragging" : null,
				...(this.cssClassName ?? "").split(/\s+/),
				...(this.cssClass?.root ?? "").split(/\s+/)
			].filter((c) => Boolean(c));
		}
		/**
		* The prop mirrors and the states, for the same root the classes go on — the
		* `<body>` portal in the light build, the inner root in the shadow one. Each
		* is omitted at its default so `:not([mono-size])` means "md" for
		* hand-written markup exactly as it does for the element.
		*/
		_computeRootAttrs() {
			return {
				"mono-size": this.size === "md" ? null : this.size,
				"mono-color": this.color === "primary" ? null : this.color,
				"mono-open": this.modelValue ? "" : null,
				"mono-no-overlay": this.overlay ? null : "",
				"mono-persistent": this.persistent ? "" : null,
				"mono-no-dismiss": this.dismissible ? null : "",
				"mono-fullscreen": this._isFullscreen ? "" : null,
				"mono-auto-fullscreen": this._autoFullscreenClass ? this._autoFullscreenClass.replace("auto-fullscreen-", "") : null,
				"mono-has-modal-above": this._hasModalAbove ? "" : null,
				"mono-draggable": this.draggable ? "" : null,
				"mono-dragging": this._dragging ? "" : null,
				"mono-dialog": this.cssClassName?.split(/\s+/).includes("mono-modal-dialog") ? "" : null
			};
		}
		_applyRootAttrs(root) {
			if (!root) return;
			if (!root.hasAttribute("mono-modal")) root.setAttribute("mono-modal", "");
			for (const [name, value] of Object.entries(this._computeRootAttrs())) if (value === null) root.removeAttribute(name);
			else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
		}
		_setCssClass(value) {
			if (value == null) {
				this.cssClass = {};
				this.cssClassName = "";
				return;
			}
			if (typeof value === "object") {
				this.cssClass = value;
				return;
			}
			if (typeof value === "string") {
				const trimmed = value.trim();
				if (!trimmed) {
					this.cssClass = {};
					this.cssClassName = "";
					return;
				}
				if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					this.cssClass = JSON.parse(trimmed);
					return;
				} catch {}
				this.cssClassName = trimmed;
			}
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		/**
		* Join the shared stack: assigns z-order, coordinates body-scroll lock, and
		* arms the shared Escape listener. Per-modal scroll-lock / Escape behaviour
		* is owned by the stack manager so nesting works (see composables/popup-stack).
		*/
		_applyOpenSideEffects() {
			if (!this.stackable) {
				for (const other of [...getOpenPopupLayers()]) if (other !== this && other._isMonoModal) other.hide?.("manual");
			}
			registerPopupLayer(this);
			this._syncOutsideClick();
		}
		_releaseSideEffects() {
			unregisterPopupLayer(this);
			this._unbindOutsideClick();
		}
		/** Bind when open without an overlay, unbind otherwise — safe to call repeatedly. */
		_syncOutsideClick() {
			if (isServer) return;
			const wanted = this.modelValue && !this.overlay;
			if (wanted && !this._outsideBound && !this._outsideArm) {
				this._openedAt = performance.now();
				this._outsideArm = setTimeout(() => {
					this._outsideArm = null;
					if (!this.modelValue || this.overlay) return;
					document.addEventListener("click", this._onOutsideClick);
					this._outsideBound = true;
				}, 0);
			} else if (!wanted) this._unbindOutsideClick();
		}
		_unbindOutsideClick() {
			if (this._outsideArm) {
				clearTimeout(this._outsideArm);
				this._outsideArm = null;
			}
			if (this._outsideBound) {
				document.removeEventListener("click", this._onOutsideClick);
				this._outsideBound = false;
			}
		}
		/**
		* PopupLayer hook — the path lands in this dialog: the host, its render root,
		* or a popup opened from within. The same test `_onOutsideClick` uses; the stack
		* asks it so a dropdown open BELOW this dialog leaves its clicks alone.
		*/
		containsEventPath(path) {
			const root = this.renderRoot instanceof Element ? this.renderRoot : null;
			return pathOwnedBy(path, root ? [this, root] : [this]);
		}
		/** Body-scroll lock is wanted while this modal is open and `lockScroll` is set. */
		get lockBodyScroll() {
			return this.lockScroll;
		}
		/**
		* Whether this modal dims what is beneath it — see `isTopBackdrop` in popup-stack.
		* Only while `overlay` is on: an `overlay="false"` modal stacked above another
		* used to count as a backdrop, so the one below hid its overlay and nothing
		* dimmed the page at all.
		*/
		get hasBackdrop() {
			return this.overlay;
		}
		/** Topmost-only Escape from the shared stack — close unless persistent. */
		onStackEscape(event) {
			if (this.closeOnEscape && !this.persistent) this.hide("escape", event);
		}
		/**
		* Called by the stack manager whenever stack order changes. `z` raises this
		* modal above the ones below; when another backdrop layer sits above it
		* (`isTopBackdrop` is false) its own backdrop is hidden so stacked overlays
		* don't compound. A backdrop-less popup above it does not count — nor does an
		* `overlay="false"` modal/drawer (see `hasBackdrop`). Both builds
		* read `_modalZ` into the `.mono-modal` root's `--modal-z`.
		*/
		setStackZ(z, isTopBackdrop) {
			this._modalZ = z;
			this._hasModalAbove = !isTopBackdrop;
		}
		/**
		* PopupLayer hook — the level this modal pins itself to, or `undefined` to take
		* the stack's slot. The stack reads it so layers opened ABOVE a pinned modal
		* clear it instead of landing back at the base (see popup-stack).
		*
		* Coerced through `Number` rather than read directly because the prop can arrive
		* as a numeric STRING — a plain `z-index="1500"` attribute goes through the
		* converter, but `el.zIndex = '1500'` (or a framework binding that stringifies)
		* does not.
		*
		* `null` and `''` are screened out FIRST, and that guard is load-bearing:
		* `Number(null)` and `Number('')` are both `0` and both finite, so `:z-index="null"`
		* — Vue's ordinary spelling for "no value" — used to pin the modal to `z-index: 0`
		* and drop it behind the page. Only the attribute path was safe, because
		* `optionalNumberConverter` maps `''`/`null` to `undefined`; the PROPERTY path,
		* which is what Vue actually uses (the hybrid alias makes `'z-index' in el` true),
		* was not.
		*/
		get pinnedZ() {
			const raw = this.zIndex;
			if (raw === null || raw === void 0) return void 0;
			if (typeof raw === "string" && raw.trim() === "") return void 0;
			const manual = Number(raw);
			return Number.isFinite(manual) ? manual : void 0;
		}
		/**
		* The level actually published to CSS: the `zIndex` prop when the consumer set
		* one, otherwise the stack's slot.
		*/
		get _effectiveZ() {
			return this.pinnedZ ?? this._modalZ;
		}
		/** Push the current offset onto the panel as CSS vars (no Lit re-render). */
		_applyDragVars() {
			const panel = this._panelEl;
			if (!panel) return;
			panel.style.setProperty("--drag-x", `${this._dragX}px`);
			panel.style.setProperty("--drag-y", `${this._dragY}px`);
		}
		/** Recenter the panel — called on each open so drags don't persist. */
		_resetDrag() {
			this._dragX = 0;
			this._dragY = 0;
			this._applyDragVars();
		}
		/**
		* After a drop, pull the panel back so it sits fully inside the viewport
		* ("the maximum location is the inner window"). If the panel is larger than
		* the viewport, pin its top-left corner.
		*/
		_clampIntoViewport() {
			const panel = this._panelEl;
			if (!panel || typeof window === "undefined") return;
			const rect = panel.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			let dx = 0;
			if (rect.width >= vw) dx = -rect.left;
			else if (rect.left < 0) dx = -rect.left;
			else if (rect.right > vw) dx = vw - rect.right;
			let dy = 0;
			if (rect.height >= vh) dy = -rect.top;
			else if (rect.top < 0) dy = -rect.top;
			else if (rect.bottom > vh) dy = vh - rect.bottom;
			if (dx === 0 && dy === 0) return;
			this._dragX += dx;
			this._dragY += dy;
			this._applyDragVars();
		}
		_teardownDrag() {
			if (typeof window === "undefined") return;
			window.removeEventListener("pointermove", this._onPointerMove);
			window.removeEventListener("pointerup", this._onPointerUp);
			window.removeEventListener("pointercancel", this._onPointerUp);
		}
		/**
		* Every open-state change emits `toggle` (historically `mno-click`, which is
		* kept), then the transition-specific `open` / `close`. `toggle` rather than
		* a plain `click`: a real click from inside the panel already bubbles to the
		* host on its own, and this is not one — it is a state change.
		* Mirrors mono-drawer's event surface. Note: only programmatic state changes
		* (`show`/`hide`/`toggle` and the overlay/✕/Escape handlers) call this —
		* parent-driven opens via `model-value` go through `willUpdate` and emit
		* nothing, so a controlled parent never gets an echo of its own change.
		*/
		_emitChange(detail) {
			this._boundController?._report(detail.value, detail.source);
			dispatchMonoEvent(this, "click", detail, { alias: "toggle" });
			if (detail.value && !detail.oldValue) dispatchMonoEvent(this, "open", detail);
			else if (!detail.value && detail.oldValue) dispatchMonoEvent(this, "close", detail);
		}
		show(source = "manual", sourceEvent) {
			if (this.modelValue) return;
			const oldValue = this.modelValue;
			this.modelValue = true;
			this._emitChange({
				modelValue: true,
				currentValue: true,
				oldValue,
				value: true,
				source,
				sourceEvent
			});
		}
		hide(source = "manual", sourceEvent) {
			if (!this.modelValue) return;
			const oldValue = this.modelValue;
			this.modelValue = false;
			this._emitChange({
				modelValue: false,
				currentValue: false,
				oldValue,
				value: false,
				source,
				sourceEvent
			});
		}
		toggle(source = "manual", sourceEvent) {
			if (this.modelValue) this.hide(source, sourceEvent);
			else this.show(source, sourceEvent);
		}
		_handleClose(event) {
			if (!this.dismissible) return;
			this.hide("close", event);
		}
		_handleOverlayClick(event) {
			if (!this.closeOnOverlay || !this.dismissible || this.persistent || !this.overlay) return;
			this.hide("overlay", event);
		}
		/** Title / subtitle / heading-column presence, shared by the head render and
		*  the dialog's `aria-labelledby` / `aria-describedby`. */
		get _headingState() {
			const title = !!this.title || this._hasTitleSlotState;
			const subtitle = !!this.subtitle || this._hasSubtitleSlotState;
			return {
				title,
				subtitle,
				heading: this._hasHeadSlotState || title || subtitle
			};
		}
		/**
		* Prefix of the heading ids (`<base>-heading` / `-title` / `-subtitle`). The
		* light build's panel lives in the document, so the ids must be unique per
		* instance; the shadow build overrides this with a constant (ids are scoped to
		* its own root, and a counter would differ between server and client).
		*/
		get _headingIdBase() {
			this._idSeq ??= ++modalIdSeq;
			return `mono-modal-${this._idSeq}`;
		}
		/** `aria-labelledby` / `aria-describedby` for the `role="dialog"` root. A
		*  `slot="header"` labels the dialog with its whole column; otherwise the
		*  title labels it and the subtitle describes it. */
		_headingAria() {
			const s = this._headingState;
			const base = this._headingIdBase;
			if (this._hasHeadSlotState) return { labelledby: `${base}-heading` };
			return {
				labelledby: s.title ? `${base}-title` : void 0,
				describedby: s.subtitle ? `${base}-subtitle` : void 0
			};
		}
		_renderHead() {
			const s = this._headingState;
			const hasDefaultHeader = s.heading || this.dismissible;
			if (!hasDefaultHeader && !this._slotsAlwaysRender) return nothing;
			const base = this._headingIdBase;
			const heading = html`
      <div
        class=${this._cls("mono-modal-title", "title")}
        mono-title
        id=${`${base}-title`}
        ?mono-empty=${!s.title}
      >${this._slotOutlet("title", this.title || nothing)}</div>
      <div
        class=${this._cls("mono-modal-subtitle", "subtitle")}
        mono-subtitle
        id=${`${base}-subtitle`}
        ?mono-empty=${!s.subtitle}
      >${this._slotOutlet("subtitle", this.subtitle || nothing)}</div>
    `;
			return html`
      <div
        class=${this._cls("mono-modal-head", "head")}
        mono-header
        ?mono-empty=${!hasDefaultHeader}
        ?mono-no-subtitle=${!s.subtitle && !this._hasHeadSlotState}
        @pointerdown=${this._onHeaderPointerDown}
      >
        <div
          class=${this._cls("mono-modal-heading", "heading")}
          mono-heading
          id=${`${base}-heading`}
          ?mono-empty=${!s.heading}
        >
          ${this._slotOutlet("head", heading)}
        </div>
        ${this.dismissible ? html`
              <button
                type="button"
                class=${this._cls("mono-modal-close", "close")}
                mono-close
                aria-label="Close"
                @click=${this._handleClose}
              >
                ${this.renderIcon("close")}
              </button>
            ` : nothing}
      </div>
    `;
		}
		_renderFoot() {
			if (!this._hasFootSlotState && !this._slotsAlwaysRender) return nothing;
			return html`
      <div
        class=${this._cls("mono-modal-foot", "foot")}
        mono-footer
        ?mono-empty=${!this._hasFootSlotState}
      >
        ${this._slotOutlet("foot")}
      </div>
    `;
		}
		/** Shared modal markup (overlay + panel-wrap + panel + head/body/foot). The
		*  light build renders this directly into the portal (which IS `.mono-modal`);
		*  the shadow build wraps it in an inner `.mono-modal` root. */
		_renderModalBody() {
			return html`
      <div
        class=${this._cls("mono-modal-overlay", "overlay")}
        mono-overlay
        @click=${this._handleOverlayClick}
      ></div>
      <div class="mono-modal-panel-wrap" mono-panel-wrap @click=${this._handleOverlayClick}>
        <div
          class=${this._cls("mono-modal-panel", "panel")}
          mono-panel
          style=${styleMap(this._panelSizeStyle())}
          role="document"
          @click=${(e) => e.stopPropagation()}
        >
          ${this._renderHead()}
          <div class=${this._cls("mono-modal-body", "body")} mono-body>
            ${this._slotOutlet("body")}
          </div>
          ${this._renderFoot()}
        </div>
      </div>
    `;
		}
		/** Whether the slot regions render even when empty. Light: no (omit empty
		*  regions). Shadow: yes — the native `<slot>`s must exist to project DSD
		*  content + be scanned (hidden via `[data-empty]` when empty). */
		get _slotsAlwaysRender() {
			return false;
		}
		_hasSlot(name) {
			return name === "head" ? this._hasHeadSlotState : name === "title" ? this._hasTitleSlotState : name === "subtitle" ? this._hasSubtitleSlotState : name === "body" ? this._hasBodySlotState : this._hasFootSlotState;
		}
		_setSlotState(name, has) {
			if (name === "head") this._hasHeadSlotState = has;
			else if (name === "title") this._hasTitleSlotState = has;
			else if (name === "subtitle") this._hasSubtitleSlotState = has;
			else if (name === "body") this._hasBodySlotState = has;
			else this._hasFootSlotState = has;
		}
		/**
		* Slot outlet. Light build (default): a `data-mono-slot` placeholder the
		* captured light-DOM nodes are re-parented into when present, else the
		* `fallback`. Shadow build overrides this with a native `<slot name>`.
		*/
		_slotOutlet(name, fallback = nothing) {
			return this._hasSlot(name) ? html`<span data-mono-slot=${name}></span>` : html`${fallback}`;
		}
		/** Close ✕. Light (default): UnoCSS icon span. Shadow overrides → inline SVG
		*  (global `.i-mdi-close` can't reach a shadow root). */
		renderIcon(_name) {
			return html`<span class="mono-icon i-mdi-close" aria-hidden="true"></span>`;
		}
	}
	__decorate([property({ type: String })], MonoModalCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoModalCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoModalCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoModalCoreClass.prototype, "subtitle", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "dismissible", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "persistent", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "overlay", void 0);
	__decorate([property({
		attribute: "close-on-escape",
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "closeOnEscape", void 0);
	__decorate([property({
		attribute: "close-on-overlay",
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "closeOnOverlay", void 0);
	__decorate([property({
		attribute: "lock-scroll",
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "lockScroll", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "draggable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoModalCoreClass.prototype, "stackable", void 0);
	__decorate([property({
		attribute: "auto-fullscreen",
		converter: autoFullscreenConverter
	})], MonoModalCoreClass.prototype, "autoFullscreen", void 0);
	__decorate([property({ attribute: false })], MonoModalCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoModalCoreClass.prototype, "cssClassName", void 0);
	__decorate([property({ attribute: false })], MonoModalCoreClass.prototype, "dataModal", void 0);
	__decorate([property({ type: String })], MonoModalCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoModalCoreClass.prototype, "height", void 0);
	__decorate([property({
		attribute: "z-index",
		converter: optionalNumberConverter
	})], MonoModalCoreClass.prototype, "zIndex", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoModalCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoModalCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoModalCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoModalCoreClass.prototype, "maxHeight", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_slotsCaptured", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_hasHeadSlotState", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_hasTitleSlotState", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_hasSubtitleSlotState", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_hasBodySlotState", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_hasFootSlotState", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_hasModalAbove", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_dragging", void 0);
	__decorate([state()], MonoModalCoreClass.prototype, "_modalZ", void 0);
	__decorate([query(".mono-modal-panel")], MonoModalCoreClass.prototype, "_panelEl", void 0);
	return MonoModalCoreClass;
};

//#endregion
//#region src/components/modal/mono-modal.ts
let MonoModal = class MonoModal extends MonoModalCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._portal = null;
		this._appliedPortalClasses = /* @__PURE__ */ new Set();
		this._slotHead = [];
		this._slotTitle = [];
		this._slotSubtitle = [];
		this._slotBody = [];
		this._slotFoot = [];
		this._slotHeaderAlias = [];
		this._slotFooterAlias = [];
	}
	createRenderRoot() {
		if (this._portal) return this._portal;
		if (typeof document === "undefined") return this;
		const portal = document.createElement("div");
		portal.setAttribute("data-mono-modal-portal", "");
		const initialClasses = this._computeModalClasses();
		portal.className = initialClasses.join(" ");
		this._appliedPortalClasses = new Set(initialClasses);
		this._portal = portal;
		document.body.appendChild(portal);
		return portal;
	}
	connectedCallback() {
		super.connectedCallback();
		if (this._portal && !this._portal.isConnected && typeof document !== "undefined") document.body.appendChild(this._portal);
		this._captureSlots();
		this._updatePortalClasses();
		this._updatePortalAttributes();
		if (this.isConnected) this.performUpdate();
	}
	disconnectedCallback() {
		if (this._portal && this._portal.parentNode) this._portal.parentNode.removeChild(this._portal);
		super.disconnectedCallback();
	}
	updated(changed) {
		super.updated(changed);
		this._updatePortalClasses();
		this._updatePortalAttributes();
		this._placeSlot("head", this._slotHead);
		this._placeSlot("title", this._slotTitle);
		this._placeSlot("subtitle", this._slotSubtitle);
		this._placeSlot("body", this._slotBody);
		this._placeSlot("foot", this._slotFoot);
		this._orphanHolder = parkDetachedNodes(this._orphanHolder, [...this._slotTitle, ...this._slotSubtitle]);
	}
	_updatePortalClasses() {
		if (!this._portal) return;
		const next = new Set(this._computeModalClasses());
		for (const cls of this._appliedPortalClasses) if (!next.has(cls)) this._portal.classList.remove(cls);
		for (const cls of next) if (!this._appliedPortalClasses.has(cls)) this._portal.classList.add(cls);
		this._appliedPortalClasses = next;
	}
	_updatePortalAttributes() {
		if (!this._portal) return;
		this._portal.style.setProperty("--mono-modal-z", String(this._effectiveZ));
		for (let i = 0; i < this.style.length; i++) {
			const prop = this.style.item(i);
			if (prop.startsWith("--mono-modal-")) this._portal.style.setProperty(prop, this.style.getPropertyValue(prop));
		}
		this._applyRootAttrs(this._portal);
		this._portal.setAttribute("role", "dialog");
		this._portal.setAttribute("title", "");
		const aria = this._headingAria();
		for (const [attr, value] of [["aria-labelledby", aria.labelledby], ["aria-describedby", aria.describedby]]) if (value) this._portal.setAttribute(attr, value);
		else this._portal.removeAttribute(attr);
		this._portal.setAttribute("aria-modal", this.overlay ? "true" : "false");
		this._portal.setAttribute("aria-hidden", this.modelValue ? "false" : "true");
		if (!this._portal.hasAttribute("tabindex")) this._portal.setAttribute("tabindex", "-1");
	}
	render() {
		return this._renderModalBody();
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		let unslottedSeen = false;
		for (const node of captured) {
			if (!(node instanceof Element)) {
				if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
					this._slotBody.push(node);
					capturedSlotNodes.add(node);
					unslottedSeen = true;
				}
				continue;
			}
			const slotName = node.getAttribute("slot");
			if (slotName === "head" || slotName === "header") {
				node.removeAttribute("slot");
				(slotName === "header" ? this._slotHeaderAlias : this._slotHead).push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "title" || slotName === "subtitle") {
				node.removeAttribute("slot");
				(slotName === "title" ? this._slotTitle : this._slotSubtitle).push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "foot" || slotName === "footer") {
				node.removeAttribute("slot");
				(slotName === "footer" ? this._slotFooterAlias : this._slotFoot).push(node);
				capturedSlotNodes.add(node);
				continue;
			}
			if (slotName === "body" || slotName === null) {
				if (slotName === "body") node.removeAttribute("slot");
				this._slotBody.push(node);
				capturedSlotNodes.add(node);
				unslottedSeen = true;
				continue;
			}
		}
		if (this._slotHeaderAlias.length) {
			this._orphanHolder = parkDetachedNodes(this._orphanHolder, this._slotHead);
			this._slotHead = this._slotHeaderAlias;
		}
		if (this._slotFooterAlias.length) {
			this._orphanHolder = parkDetachedNodes(this._orphanHolder, this._slotFoot);
			this._slotFoot = this._slotFooterAlias;
		}
		this._hasHeadSlotState = this._slotHead.length > 0;
		this._hasTitleSlotState = this._slotTitle.length > 0;
		this._hasSubtitleSlotState = this._slotSubtitle.length > 0;
		this._hasFootSlotState = this._slotFoot.length > 0;
		this._hasBodySlotState = unslottedSeen && this._slotBody.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["head", this._slotHead],
			["title", this._slotTitle],
			["subtitle", this._slotSubtitle],
			["body", this._slotBody],
			["foot", this._slotFoot]
		]), {
			fallback: "body",
			onWrite: () => {
				this._hasBodySlotState = this._slotBody.length > 0;
				this.requestUpdate();
			}
		});
	}
	_placeSlot(name, nodes) {
		if (!nodes.length || !this._portal) return;
		const target = this._portal.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoModal = __decorate([customElement("mono-modal")], MonoModal);

//#endregion
export { MonoModal, monoModal as controlMonoModal, monoModal };