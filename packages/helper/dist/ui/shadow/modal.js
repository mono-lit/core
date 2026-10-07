import { a as __decorate, c as defineHybridPropAlias, d as optionalNumberConverter, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as detachEventHandlers, t as applyProps } from "../../element-props-CLB6yvbm.js";
import { n as isBelowBreakpoint, r as resolveAutoFullscreen, t as autoFullscreenConverter } from "../../breakpoints-CAbhDUht.js";
import { a as unregisterPopupLayer, n as refreshPopupStack, r as registerPopupLayer, t as getOpenPopupLayers } from "../../popup-stack-CEEMib__.js";
import { i as pathOwnedBy } from "../../popup-portal-BziRX1yG.js";
import "../../mono-button.shadow-FfP_hMH4.js";
import { t as createNotifier } from "../../notifier-CE4yxMUQ.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/modal/modal-core.ts
/** Per-instance id seed for the light build's heading ids (they live in the
*  document, so they must be unique). The shadow build scopes ids to its own
*  root and uses a constant — see `_headingIdBase`. */
var modalIdSeq = 0;
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
var WIDTH_PRESETS = {
	xs: "min(90vw, 300px)",
	sm: "min(90vw, 380px)",
	md: "min(90vw, 520px)",
	lg: "min(90vw, 680px)",
	xl: "min(95vw, 880px)",
	xxl: "min(95vw, 1080px)"
};
var HEIGHT_PRESETS = {
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
var MonoModalCore = (superClass) => {
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
				if (pathOwnedBy(event.composedPath(), root ? [this, root] : [this])) return;
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
			if (changed.has("modelValue")) if (this.modelValue) {
				this._resetDrag();
				this._applyOpenSideEffects();
			} else this._releaseSideEffects();
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
//#region src/components/modal/modal.css?raw
var modal_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-modal — a port of Basecoat's `.dialog` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-modal size=\"lg\" color=\"success\" model-value title=\"Settings\">\r\n     <div mono-modal mono-size=\"lg\" mono-color=\"success\" mono-open\r\n          role=\"dialog\" aria-modal=\"true\">\r\n       <div mono-overlay></div>\r\n       <div mono-panel-wrap>\r\n         <div mono-panel role=\"document\">\r\n           <div mono-header>\r\n             <div mono-heading>\r\n               <div mono-title>Settings</div>\r\n               <div mono-subtitle>Manage your account</div>\r\n             </div>\r\n             <button mono-close type=\"button\" aria-label=\"Close\">…</button>\r\n           </div>\r\n           <div mono-body>…</div>\r\n           <div mono-footer>…</div>\r\n         </div>\r\n       </div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary). The element writes them on its ROOT — the\r\n   `<body>` portal in the light build, an inner root `<div>` in the shadow one —\r\n   along with every state below. The old classes (`.mono-modal.md.primary.open`)\r\n   are still emitted as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-modal]        ≡ .dialog (the <dialog> itself) — DEVIATION: a fixed\r\n                           full-viewport wrapper, because this component predates\r\n                           `<dialog>` support and owns its own stacking through\r\n                           `composables/popup-stack`\r\n     [mono-overlay]      ≡ .dialog::backdrop (bg-black/10 backdrop-blur-xs) — the\r\n                           fill is `--mono-mode-backdrop`, a token, since a\r\n                           pseudo-element cannot be reached from a shadow sheet\r\n     [mono-panel-wrap]   ≡ EXTENSION (upstream centres the panel itself with\r\n                           `fixed top-1/2 left-1/2 -translate-1/2`; a flex wrap\r\n                           centres a DRAGGED panel correctly, which that cannot)\r\n     [mono-panel]        ≡ .dialog > * (bg-popover text-popover-foreground ring-1\r\n                           ring-foreground/10 rounded-xl p-6 gap-6 text-sm\r\n                           max-w-[calc(100%-2rem)] max-h-[calc(100%-2rem)]\r\n                           flex flex-col sm:max-w-md)\r\n     [mono-header]         ≡ .dialog > * > header (flex flex-col gap-2) — DEVIATION:\r\n                           a ROW, because the ✕ lives inside it (see below)\r\n     [mono-heading]      ≡ upstream's header column itself (flex flex-col gap-2)\r\n                           — the ✕'s row-mate; `slot=\"header\"` replaces it\r\n     [mono-title]        ≡ .dialog > * > header > h2 (leading-none font-medium)\r\n     [mono-subtitle]     ≡ .dialog > * > header > p (text-muted-foreground text-sm\r\n                           leading-normal)\r\n     [mono-body]         ≡ .dialog > * > section (flex-1)\r\n     [mono-footer]         ≡ .dialog > * > footer (flex flex-col-reverse gap-2,\r\n                           sm:flex-row sm:justify-end)\r\n     [mono-close]        ≡ .dialog > * > button (opacity-70 hover:opacity-100,\r\n                           svg size-4) — DEVIATION: in flow inside the head\r\n                           rather than `absolute top-4 end-4`, because the head is\r\n                           also the drag handle; a `slot=\"header\"` replaces only\r\n                           the heading column, never the ✕\r\n     [mono-size]         ≡ EXTENSION. Upstream's `data-size` is a WIDTH; ours is\r\n                           the content scale (padding, type, radius, close box).\r\n                           Width is its own prop — a compact `sm` can still be\r\n                           wide — and defaults to `--mono-container-md`, which is\r\n                           upstream's `sm:max-w-md`.\r\n     [mono-color]        ≡ EXTENSION (upstream's dialog has no colour)\r\n\r\n   THE TINTED HEADER IS GONE. Upstream's dialog is one padded box: the panel\r\n   carries `p-6` and `gap-6`, and header / section / footer are unpadded,\r\n   unbordered, untinted regions inside it. The gradient head bar, the tinted\r\n   footer and both divider rules went with it — `--mono-modal-header-bg` and\r\n   `-foot-bg` remain as knobs, defaulting to `transparent`, so a consumer who\r\n   wants the bar back sets those two.\r\n\r\n   PART NAMES ARE PATH-SCOPED. `[mono-panel]`, `[mono-body]`, `[mono-title]` and\r\n   `[mono-close]` are also dropdown's, card's and input's part names, and a modal\r\n   BODY is where consumers put all three. Every rule here is written as an\r\n   explicit child path from the root, with `:where()` keeping the resting weight\r\n   at (0,1,0) so a `cssClass` utility still wins by source order.\r\n\r\n   FLAVORS set `--mono-modal-{radius,padding,gap,ring-color,shadow,width,\r\n   title-font,overlay-bg,overlay-backdrop-filter,close-*}` (+ the per-size\r\n   forms); every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"dialog\"` prints the matrix).\r\n   ========================================================================= */\r\n\r\nmono-modal {\r\n  display: contents;\r\n}\r\n\r\n/* =========================================\r\n   Root — the layer\r\n   ========================================= */\r\n\r\n[mono-modal] {\r\n  /* ── the six roles, each a public knob over a Basecoat token ───────────── */\r\n  --_mono-modal-primary: var(--mono-modal-primary, var(--primary));\r\n  --_mono-modal-secondary: var(--mono-modal-secondary, var(--secondary-foreground));\r\n  --_mono-modal-success: var(--mono-modal-success, var(--success));\r\n  --_mono-modal-danger: var(--mono-modal-danger, var(--destructive));\r\n  --_mono-modal-warning: var(--mono-modal-warning, var(--warning));\r\n  --_mono-modal-info: var(--mono-modal-info, var(--info));\r\n  --_mono-modal-teal: var(--mono-modal-teal, var(--teal));\r\n  --_mono-modal-purple: var(--mono-modal-purple, var(--purple));\r\n  --_mono-modal-neutral: var(--mono-modal-neutral, var(--neutral));\r\n  --_mono-modal-dark: var(--mono-modal-dark, var(--dark));\r\n  /* the colour in play — `primary` unless a [mono-color] rule re-points it */\r\n  --_mono-modal-accent: var(--mono-modal-accent, var(--_mono-modal-accent-preset, var(--_mono-modal-primary)));\r\n\r\n  /* ── panel paint — `bg-popover text-popover-foreground ring-foreground/10` ── */\r\n  --_mono-modal-bg: var(--mono-modal-bg, var(--mono-modal-surface, var(--popover)));\r\n  --_mono-modal-text: var(--mono-modal-text, var(--popover-foreground));\r\n  --_mono-modal-border: var(--mono-modal-border, var(--border));\r\n  --_mono-modal-ring-width: var(--mono-modal-ring-width, var(--mono-border-width));\r\n  --_mono-modal-ring-color: var(--mono-modal-ring-color,\r\n    color-mix(in oklab, var(--foreground) 10%, transparent));\r\n  --_mono-modal-shadow: var(--mono-modal-shadow, var(--mono-shadow-lg));\r\n  /* a faint halo of the accent under the elevation — nothing until `color` is set */\r\n  --_mono-modal-glow: var(--mono-modal-glow, 0 0 #0000);\r\n\r\n  /* The tinted head / foot bars of the pre-port modal. Upstream has neither —\r\n     its dialog is ONE padded box — so both default to nothing, and a consumer\r\n     who wants the bar back sets the pair (and `-head-border` for the rule). */\r\n  --_mono-modal-header-bg: var(--mono-modal-header-bg, var(--mono-modal-head-bg, transparent));\r\n  --_mono-modal-footer-bg: var(--mono-modal-footer-bg, transparent);\r\n  --_mono-modal-header-border: var(--mono-modal-header-border, transparent);\r\n  --_mono-modal-footer-border: var(--mono-modal-footer-border, transparent);\r\n  /* 0, not a transparent hairline: upstream has no divider, and a transparent\r\n     one would still take a pixel of layout. Restoring the bar means setting the\r\n     width with the colour. */\r\n  --_mono-modal-header-border-width: var(--mono-modal-header-border-width, 0);\r\n  --_mono-modal-footer-border-width: var(--mono-modal-footer-border-width, 0);\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .dialog > * — rounded-xl p-6 gap-6 text-sm */\r\n  --_mono-modal-radius: var(--mono-modal-radius, var(--_mono-modal-radius-preset, var(--mono-modal-radius-md, var(--mono-radius-xl))));\r\n  --_mono-modal-pad: var(--mono-modal-pad, var(--_mono-modal-pad-preset, var(--mono-modal-pad-md, calc(var(--mono-spacing) * 6))));\r\n  --_mono-modal-gap: var(--mono-modal-gap, var(--_mono-modal-gap-preset, var(--mono-modal-gap-md, calc(var(--mono-spacing) * 6))));\r\n  --_mono-modal-header-gap: var(--mono-modal-header-gap, var(--_mono-modal-header-gap-preset, var(--mono-modal-header-gap-md, calc(var(--mono-spacing) * 2))));\r\n  --_mono-modal-footer-gap: var(--mono-modal-footer-gap, var(--_mono-modal-footer-gap-preset, var(--mono-modal-footer-gap-md, calc(var(--mono-spacing) * 2))));\r\n  --_mono-modal-body-font: var(--mono-modal-body-font, var(--_mono-modal-body-font-preset, var(--mono-modal-body-font-md, var(--mono-text-sm))));\r\n  --_mono-modal-body-line-height: var(--mono-modal-body-line-height, var(--_mono-modal-body-line-height-preset, var(--mono-text-sm--lh)));\r\n  /* `leading-none font-medium`, at the panel's own size — four of the eight\r\n     flavors bump it to `text-base` and sera to `text-lg`. */\r\n  --_mono-modal-title-font: var(--mono-modal-title-font, var(--_mono-modal-title-font-preset, var(--mono-modal-title-font-md, var(--mono-text-sm))));\r\n  --_mono-modal-title-weight: var(--mono-modal-title-weight, var(--mono-font-weight-medium));\r\n  --_mono-modal-title-color: var(--mono-modal-title-color, var(--_mono-modal-text));\r\n  /* the description line — `text-muted-foreground text-sm leading-normal`; the\r\n     font follows the body's per-size step, which is `text-sm` at md */\r\n  --_mono-modal-subtitle-font: var(--mono-modal-subtitle-font, var(--_mono-modal-body-font));\r\n  --_mono-modal-subtitle-color: var(--mono-modal-subtitle-color, var(--muted-foreground));\r\n\r\n  /* ── the close ✕ — `opacity-70 hover:opacity-100`, glyph `size-4` ───────── */\r\n  --_mono-modal-close-size: var(--mono-modal-close-size, var(--_mono-modal-close-size-preset, var(--mono-modal-close-size-md, calc(var(--mono-spacing) * 7))));\r\n  --_mono-modal-close-glyph: var(--mono-modal-close-glyph, var(--_mono-modal-close-glyph-preset, calc(var(--mono-spacing) * 4)));\r\n  --_mono-modal-close-radius: var(--mono-modal-close-radius, var(--mono-radius-sm));\r\n  --_mono-modal-close-bg: var(--mono-modal-close-bg, transparent);\r\n  --_mono-modal-close-color: var(--mono-modal-close-color, var(--_mono-modal-text));\r\n  --_mono-modal-close-opacity: var(--mono-modal-close-opacity, 0.7);\r\n  --_mono-modal-close-hover-opacity: var(--mono-modal-close-hover-opacity, 1);\r\n  --_mono-modal-close-hover-bg: var(--mono-modal-close-hover-bg, transparent);\r\n\r\n  /* ── the backdrop — `bg-black/10 backdrop-blur-xs` ─────────────────────── */\r\n  --_mono-modal-overlay-bg: var(--mono-modal-overlay-bg, var(--mono-mode-backdrop));\r\n  /* Public so a flavor can drop the blur; a descendant rule would not reach the\r\n     shadow build's overlay. */\r\n  --_mono-modal-overlay-backdrop-filter: var(--mono-modal-overlay-backdrop-filter, blur(var(--mono-blur-xs)));\r\n\r\n  --_mono-modal-z: var(--mono-modal-z, 600);\r\n\r\n  /* `max-w-[calc(100%-2rem)] sm:max-w-md` — the width is a PROP here (a dialog's\r\n     measure and its density are independent choices, which is why `size` does\r\n     not touch it), so the default is upstream's `md` container. */\r\n  --_mono-modal-width: var(--mono-modal-width, min(calc(100% - 2rem), var(--mono-container-md)));\r\n\r\n  /* Open/close animation duration. One source of truth for the panel's opacity +\r\n     transform AND the delayed `visibility` / `content-visibility` flips, which have\r\n     to stay in lockstep with them — they used to be six hand-maintained `0.22s`\r\n     literals. Set `--mono-modal-duration: 0s` for an instant, animation-free modal;\r\n     worth doing when the modal body holds a lot of components, since that is what\r\n     the open/close frames have to re-measure. */\r\n  --_mono-modal-duration: var(--mono-modal-duration, var(--mono-duration-slow));\r\n  /* The overlay keeps its own default so an explicit `--mono-modal-duration: 0s`\r\n     does not leave the scrim fading on its own. */\r\n  --_mono-modal-overlay-duration: var(--mono-modal-duration, var(--mono-duration-slow));\r\n\r\n  /* Sized in VIEWPORT units, not `inset: 0`/`100%`. Both of those resolve against\r\n     the initial containing block, which a horizontally-overflowing page inflates\r\n     under mobile emulation (measured: 481x1041 on a 390x844 screen) — the panel\r\n     then centres inside an oversized wrap and stops covering the screen. Viewport\r\n     units stay correct there. `dvh`/`dvw` additionally track mobile browser chrome,\r\n     so the `v*` line below is only the pre-2022 fallback. */\r\n  position: fixed;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  width: 100dvw;\r\n  height: 100vh;\r\n  height: 100dvh;\r\n  z-index: var(--_mono-modal-z);\r\n  pointer-events: none;\r\n  font-family: inherit;\r\n  color: var(--_mono-modal-text);\r\n}\r\n\r\n[mono-modal],\r\n:where([mono-modal]) *,\r\n:where([mono-modal]) *::before,\r\n:where([mono-modal]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: upstream's `data-size` is a width; this is the density\r\n   ========================================= */\r\n\r\n[mono-modal][mono-size=\"xs\"] {\r\n  --_mono-modal-radius-preset: var(--mono-modal-radius-xs, var(--mono-radius-md));\r\n  --_mono-modal-pad-preset: var(--mono-modal-pad-xs, calc(var(--mono-spacing) * 3));\r\n  --_mono-modal-gap-preset: var(--mono-modal-gap-xs, calc(var(--mono-spacing) * 3));\r\n  --_mono-modal-header-gap-preset: var(--mono-modal-header-gap-xs, var(--mono-spacing));\r\n  --_mono-modal-footer-gap-preset: var(--mono-modal-footer-gap-xs, var(--mono-spacing));\r\n  --_mono-modal-title-font-preset: var(--mono-modal-title-font-xs, var(--mono-text-xs));\r\n  --_mono-modal-body-font-preset: var(--mono-modal-body-font-xs, var(--mono-text-xs));\r\n  --_mono-modal-body-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-modal-close-size-preset: var(--mono-modal-close-size-xs, calc(var(--mono-spacing) * 5));\r\n  --_mono-modal-close-glyph-preset: calc(var(--mono-spacing) * 3);\r\n}\r\n\r\n[mono-modal][mono-size=\"sm\"] {\r\n  --_mono-modal-radius-preset: var(--mono-modal-radius-sm, var(--mono-radius-lg));\r\n  --_mono-modal-pad-preset: var(--mono-modal-pad-sm, calc(var(--mono-spacing) * 4));\r\n  --_mono-modal-gap-preset: var(--mono-modal-gap-sm, calc(var(--mono-spacing) * 4));\r\n  --_mono-modal-header-gap-preset: var(--mono-modal-header-gap-sm, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-modal-footer-gap-preset: var(--mono-modal-footer-gap-sm, calc(var(--mono-spacing) * 2));\r\n  --_mono-modal-title-font-preset: var(--mono-modal-title-font-sm, var(--mono-text-sm));\r\n  --_mono-modal-body-font-preset: var(--mono-modal-body-font-sm, var(--mono-text-xs));\r\n  --_mono-modal-body-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-modal-close-size-preset: var(--mono-modal-close-size-sm, calc(var(--mono-spacing) * 6));\r\n  --_mono-modal-close-glyph-preset: calc(var(--mono-spacing) * 3.5);\r\n}\r\n\r\n[mono-modal][mono-size=\"lg\"] {\r\n  --_mono-modal-radius-preset: var(--mono-modal-radius-lg, var(--mono-radius-2xl));\r\n  --_mono-modal-pad-preset: var(--mono-modal-pad-lg, calc(var(--mono-spacing) * 7));\r\n  --_mono-modal-gap-preset: var(--mono-modal-gap-lg, calc(var(--mono-spacing) * 7));\r\n  --_mono-modal-header-gap-preset: var(--mono-modal-header-gap-lg, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-modal-footer-gap-preset: var(--mono-modal-footer-gap-lg, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-modal-title-font-preset: var(--mono-modal-title-font-lg, var(--mono-text-base));\r\n  --_mono-modal-body-font-preset: var(--mono-modal-body-font-lg, var(--mono-text-sm));\r\n  --_mono-modal-close-size-preset: var(--mono-modal-close-size-lg, calc(var(--mono-spacing) * 8));\r\n  --_mono-modal-close-glyph-preset: calc(var(--mono-spacing) * 4.5);\r\n}\r\n\r\n[mono-modal][mono-size=\"xl\"] {\r\n  --_mono-modal-radius-preset: var(--mono-modal-radius-xl, var(--mono-radius-2xl));\r\n  --_mono-modal-pad-preset: var(--mono-modal-pad-xl, calc(var(--mono-spacing) * 8));\r\n  --_mono-modal-gap-preset: var(--mono-modal-gap-xl, calc(var(--mono-spacing) * 8));\r\n  --_mono-modal-header-gap-preset: var(--mono-modal-header-gap-xl, calc(var(--mono-spacing) * 3));\r\n  --_mono-modal-footer-gap-preset: var(--mono-modal-footer-gap-xl, calc(var(--mono-spacing) * 3));\r\n  --_mono-modal-title-font-preset: var(--mono-modal-title-font-xl, var(--mono-text-lg));\r\n  --_mono-modal-body-font-preset: var(--mono-modal-body-font-xl, var(--mono-text-base));\r\n  --_mono-modal-body-line-height-preset: var(--mono-text-base--lh);\r\n  --_mono-modal-close-size-preset: var(--mono-modal-close-size-xl, calc(var(--mono-spacing) * 9));\r\n  --_mono-modal-close-glyph-preset: calc(var(--mono-spacing) * 5);\r\n}\r\n\r\n[mono-modal][mono-size=\"xxl\"] {\r\n  --_mono-modal-radius-preset: var(--mono-modal-radius-xxl, var(--mono-radius-4xl));\r\n  --_mono-modal-pad-preset: var(--mono-modal-pad-xxl, calc(var(--mono-spacing) * 9));\r\n  --_mono-modal-gap-preset: var(--mono-modal-gap-xxl, calc(var(--mono-spacing) * 9));\r\n  --_mono-modal-header-gap-preset: var(--mono-modal-header-gap-xxl, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-modal-footer-gap-preset: var(--mono-modal-footer-gap-xxl, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-modal-title-font-preset: var(--mono-modal-title-font-xxl, var(--mono-text-xl));\r\n  --_mono-modal-body-font-preset: var(--mono-modal-body-font-xxl, var(--mono-text-lg));\r\n  --_mono-modal-body-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-modal-close-size-preset: var(--mono-modal-close-size-xxl, calc(var(--mono-spacing) * 10));\r\n  --_mono-modal-close-glyph-preset: calc(var(--mono-spacing) * 5.5);\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the role tints the ring and whatever the consumer\r\n   turns back on (the head bar, the close hover)\r\n   ========================================= */\r\n\r\n[mono-modal][mono-color=\"primary\"] { --_mono-modal-accent-preset: var(--_mono-modal-primary); }\r\n[mono-modal][mono-color=\"secondary\"] { --_mono-modal-accent-preset: var(--_mono-modal-secondary); }\r\n[mono-modal][mono-color=\"success\"] { --_mono-modal-accent-preset: var(--_mono-modal-success); }\r\n[mono-modal][mono-color=\"danger\"] { --_mono-modal-accent-preset: var(--_mono-modal-danger); }\r\n[mono-modal][mono-color=\"warning\"] { --_mono-modal-accent-preset: var(--_mono-modal-warning); }\r\n[mono-modal][mono-color=\"info\"] { --_mono-modal-accent-preset: var(--_mono-modal-info); }\r\n[mono-modal][mono-color=\"teal\"] { --_mono-modal-accent-preset: var(--_mono-modal-teal); }\r\n[mono-modal][mono-color=\"purple\"] { --_mono-modal-accent-preset: var(--_mono-modal-purple); }\r\n[mono-modal][mono-color=\"neutral\"] { --_mono-modal-accent-preset: var(--_mono-modal-neutral); }\r\n[mono-modal][mono-color=\"dark\"] { --_mono-modal-accent-preset: var(--_mono-modal-dark); }\r\n\r\n/* An explicit `color` shows on the panel itself, not only in the ✕ hover: a\r\n   thin line of the accent sits ON the ring and a faint halo of it under the\r\n   elevation — \"bordered green, glowing green just a little\". Both live in the\r\n   glow layer (first in the shadow list, so the translucent foreground/10 ring\r\n   does not muddy the line, and a flavour's own `--mono-modal-ring-color` is\r\n   left alone). Without `color` the layer is nothing. `--mono-modal-glow`\r\n   replaces the whole layer; `--mono-modal-accent-ring` recolours the line. */\r\n[mono-modal][mono-color] {\r\n  --_mono-modal-glow: var(--mono-modal-glow,\r\n    0 0 0 var(--_mono-modal-ring-width) var(--mono-modal-accent-ring, color-mix(in oklab, var(--_mono-modal-accent) 35%, var(--_mono-modal-border))),\r\n    0 0 24px -4px color-mix(in oklab, var(--_mono-modal-accent) 45%, transparent));\r\n}\r\n\r\n/* =========================================\r\n   Overlay — `::backdrop`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .dialog::backdrop, .alert-dialog::backdrop, .command-dialog::backdrop\r\n   — bg-black/10 backdrop-blur-xs duration-100. A real `::backdrop` cannot be\r\n   reached from a shadow sheet and cannot stack with this component's own layer\r\n   manager, so it is an element — the fill is upstream's, through the mode token. */\r\n:where([mono-modal]) > [mono-overlay] {\r\n  /* Viewport units, not `inset: 0` — see the note on the root. */\r\n  position: fixed;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  width: 100dvw;\r\n  height: 100vh;\r\n  height: 100dvh;\r\n  background: var(--_mono-modal-overlay-bg);\r\n  opacity: 0;\r\n  pointer-events: none;\r\n\r\n  /* The blur is applied only while open; it used to be declared unconditionally with\r\n     `opacity: 0` as the only thing hiding it. Hygiene rather than a measured win —\r\n     `backdrop-filter` is a paint/composite cost, and the layout+style metrics used to\r\n     validate the `content-visibility` change below cannot attribute anything to it\r\n     either way. Kept because a filter on a never-shown full-viewport element is work\r\n     the browser should never be asked to consider, and the change is free.\r\n\r\n     Removal is DELAYED by the fade duration (the same idiom this file already uses\r\n     for `visibility` below): drop it immediately and the backdrop snaps sharp while\r\n     the scrim is still fading out. `backdrop-filter` is animatable, so a plain\r\n     delayed transition does the job — no `allow-discrete` needed. */\r\n  backdrop-filter: none;\r\n  -webkit-backdrop-filter: none;\r\n  transition:\r\n    opacity var(--_mono-modal-overlay-duration) var(--mono-ease),\r\n    backdrop-filter 0s linear var(--_mono-modal-overlay-duration),\r\n    -webkit-backdrop-filter 0s linear var(--_mono-modal-overlay-duration);\r\n}\r\n\r\n[mono-modal][mono-open] > [mono-overlay] {\r\n  opacity: 1;\r\n  pointer-events: auto;\r\n  backdrop-filter: var(--_mono-modal-overlay-backdrop-filter);\r\n  -webkit-backdrop-filter: var(--_mono-modal-overlay-backdrop-filter);\r\n  transition:\r\n    opacity var(--_mono-modal-overlay-duration) var(--mono-ease),\r\n    backdrop-filter 0s linear 0s,\r\n    -webkit-backdrop-filter 0s linear 0s;\r\n}\r\n\r\n[mono-modal][mono-no-overlay] > [mono-overlay] {\r\n  display: none;\r\n}\r\n\r\n/* Stacked modals: when another modal or drawer WITH an overlay is open above\r\n   this one, hide this backdrop so dim layers don't compound — the topmost\r\n   overlay alone dims everything beneath it. An `overlay=\"false\"` dialog above\r\n   does not count, so this one keeps dimming the page. */\r\n[mono-modal][mono-open][mono-has-modal-above] > [mono-overlay] {\r\n  opacity: 0;\r\n}\r\n\r\n/* =========================================\r\n   Panel — `.dialog > *`\r\n   ========================================= */\r\n\r\n/* EXTENSION — the centring box. Upstream centres the panel itself\r\n   (`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`), which this\r\n   component cannot: the drag offset is a `translate` too, and the two would\r\n   fight. A flex wrap centres without spending the transform. */\r\n:where([mono-modal]) > [mono-panel-wrap] {\r\n  /* Viewport units, not `inset: 0` — see the note on the root. This is the box\r\n     the panel centres in, so an inflated one offsets the panel off-screen. */\r\n  position: fixed;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  width: 100dvw;\r\n  height: 100vh;\r\n  height: 100dvh;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 1rem;\r\n  pointer-events: none;\r\n  z-index: calc(var(--_mono-modal-z) + 1);\r\n}\r\n\r\n/* basecoat@1.0.2 components/dialog.css .dialog, .alert-dialog >> > * — fixed z-50\r\n   flex max-h-[calc(100%_-_2rem)] w-full flex-col transition-all outline-hidden */\r\n/* basecoat@1.0.2 styles/vega.css .dialog > * — bg-popover text-popover-foreground\r\n   ring-foreground/10 max-w-[calc(100%-2rem)] gap-6 rounded-xl p-6 text-sm ring-1\r\n   duration-100 sm:max-w-md */\r\n:where([mono-modal] > [mono-panel-wrap]) > [mono-panel] {\r\n  position: relative;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--_mono-modal-gap);\r\n  width: var(--_mono-modal-width);\r\n  max-width: calc(100% - 2rem);\r\n  max-height: calc(100vh - 2rem);\r\n  max-height: calc(100dvh - 2rem);\r\n  padding: var(--_mono-modal-pad);\r\n  border-radius: var(--_mono-modal-radius);\r\n  background: var(--_mono-modal-bg);\r\n  color: var(--_mono-modal-text);\r\n  box-shadow:\r\n    var(--_mono-modal-glow),\r\n    0 0 0 var(--_mono-modal-ring-width) var(--_mono-modal-ring-color),\r\n    var(--_mono-modal-shadow);\r\n  overflow: hidden;\r\n  outline: none;\r\n  pointer-events: auto;\r\n\r\n  /* Closed state: invisible (hides shadow halo) + scaled-down, which is\r\n     upstream's `@starting-style` pair (`opacity-0` + `scale-95`) written as a\r\n     class transition — a `<dialog>`'s discrete open/close is not available to a\r\n     component that manages its own layer. The visibility flip is delayed on\r\n     close so the scale-out animation plays first. */\r\n  opacity: 0;\r\n  transform: translate(var(--drag-x, 0px), var(--drag-y, 0px)) scale(0.95);\r\n  visibility: hidden;\r\n  transition:\r\n    opacity var(--_mono-modal-duration) var(--mono-ease),\r\n    transform var(--_mono-modal-duration) var(--mono-ease),\r\n    visibility 0s linear var(--_mono-modal-duration);\r\n}\r\n\r\n[mono-modal][mono-open] > [mono-panel-wrap] > [mono-panel] {\r\n  opacity: 1;\r\n  transform: translate(var(--drag-x, 0px), var(--drag-y, 0px)) scale(1);\r\n  visibility: visible;\r\n  transition:\r\n    opacity var(--_mono-modal-duration) var(--mono-ease),\r\n    transform var(--_mono-modal-duration) var(--mono-ease),\r\n    visibility 0s linear 0s;\r\n}\r\n\r\n/* Draggable: the head is the drag handle; suppress the transform transition while\r\n   dragging so the panel tracks the pointer 1:1 and snaps instantly on drop. */\r\n[mono-modal][mono-draggable] > [mono-panel-wrap] > [mono-panel] > [mono-header] {\r\n  cursor: move;\r\n  touch-action: none;\r\n  user-select: none;\r\n}\r\n\r\n[mono-modal][mono-draggable] > [mono-panel-wrap] > [mono-panel] > [mono-header] [mono-close] {\r\n  cursor: pointer;\r\n}\r\n\r\n[mono-modal][mono-dragging] > [mono-panel-wrap] > [mono-panel] {\r\n  transition: none;\r\n}\r\n\r\n/* =========================================\r\n   Head — `> header`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/dialog.css .dialog >> > * > header — flex flex-col */\r\n/* basecoat@1.0.2 styles/vega.css .dialog > * > header — gap-2\r\n   DEVIATION: a ROW. Upstream's header is a column of title + description with the\r\n   ✕ absolutely positioned beside it; ours holds the ✕ because the head is the\r\n   drag handle. Upstream's column is `[mono-heading]` below, the ✕'s row-mate —\r\n   and all a `slot=\"header\"` replaces. */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-header] {\r\n  display: flex;\r\n  align-items: flex-start;\r\n  justify-content: space-between;\r\n  gap: var(--_mono-modal-header-gap);\r\n  flex-shrink: 0;\r\n  padding: var(--mono-modal-header-pad, 0);\r\n  border-bottom: var(--_mono-modal-header-border-width) solid var(--_mono-modal-header-border);\r\n  background: var(--_mono-modal-header-bg);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .dialog > * > header > h2, .dialog > * > [data-title]\r\n   — leading-none font-medium */\r\n/* basecoat@1.0.2 components/dialog.css .dialog >> > * > header — flex flex-col\r\n   (+ vega's gap-2): the title / subtitle column, taking the row beside the ✕. */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-header]) > [mono-heading] {\r\n  flex: 1;\r\n  min-width: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--mono-modal-heading-gap, var(--_mono-modal-header-gap));\r\n}\r\n\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-header]) [mono-title] {\r\n  min-width: 0;\r\n  font-size: var(--_mono-modal-title-font);\r\n  font-weight: var(--_mono-modal-title-weight);\r\n  line-height: var(--mono-leading-none, 1);\r\n  color: var(--_mono-modal-title-color);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .dialog > * > header > p, .dialog > * > [data-description]\r\n   — text-muted-foreground text-sm leading-normal */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-header]) [mono-subtitle] {\r\n  min-width: 0;\r\n  font-size: var(--_mono-modal-subtitle-font);\r\n  line-height: var(--mono-modal-subtitle-line-height, var(--mono-leading-normal));\r\n  color: var(--_mono-modal-subtitle-color);\r\n}\r\n\r\n/* Empty regions. The light build omits them; the shadow build always renders\r\n   them (its native `<slot>`s must exist to be scanned) and marks them\r\n   [mono-empty]. The heading parts are matched as descendants because the shadow\r\n   build nests them inside the `header` slot's fallback. */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > :is([mono-header], [mono-footer])[mono-empty],\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-header]) > [mono-heading][mono-empty],\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-header] > [mono-heading]) :is([mono-title], [mono-subtitle])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Close — `> button`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/dialog.css .dialog >> > * > :is(button, form[method='dialog'] > button)\r\n   — inline-flex items-center justify-center opacity-70 transition-opacity\r\n   hover:opacity-100 focus-visible:outline-hidden disabled:pointer-events-none\r\n   DEVIATION: in flow inside the head rather than `absolute top-4 end-4` — see\r\n   the header note above. */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-header]) [mono-close] {\r\n  flex-shrink: 0;\r\n  /* stays at the end even when the heading column is empty (hidden) */\r\n  margin-inline-start: auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-modal-close-size);\r\n  height: var(--_mono-modal-close-size);\r\n  padding: 0;\r\n  border: none;\r\n  border-radius: var(--_mono-modal-close-radius);\r\n  background: var(--_mono-modal-close-bg);\r\n  color: var(--_mono-modal-close-color);\r\n  opacity: var(--_mono-modal-close-opacity);\r\n  cursor: pointer;\r\n  appearance: none;\r\n  transition:\r\n    opacity var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-modal] [mono-close]:hover {\r\n    opacity: var(--_mono-modal-close-hover-opacity);\r\n    background: var(--_mono-modal-close-hover-bg);\r\n  }\r\n}\r\n\r\n[mono-modal] [mono-close]:focus-visible {\r\n  outline: none;\r\n  box-shadow: 0 0 0 var(--mono-ring-width)\r\n    color-mix(in oklab, var(--ring) var(--mono-ring-alpha), transparent);\r\n}\r\n\r\n/* basecoat@1.0.2 components/dialog.css .dialog >> > * > :is(button, form[method='dialog'] > button) > svg:not([class*='size-'])\r\n   — size-4 */\r\n[mono-modal] [mono-close] > :is(svg, span) {\r\n  display: block;\r\n  width: var(--_mono-modal-close-glyph);\r\n  height: var(--_mono-modal-close-glyph);\r\n}\r\n\r\n/* =========================================\r\n   Body — `> section`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/dialog.css .dialog >> > * > section — flex-1\r\n   The panel's own `p-6` is the padding; `--mono-modal-body-pad` restores an\r\n   inner one for a body that scrolls under a restored head bar. */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-body] {\r\n  flex: 1;\r\n  min-height: 0;\r\n  overflow-y: auto;\r\n  padding: var(--mono-modal-body-pad, 0);\r\n  font-size: var(--_mono-modal-body-font);\r\n  line-height: var(--_mono-modal-body-line-height);\r\n  color: var(--_mono-modal-text);\r\n}\r\n\r\n/* =========================================\r\n   Foot — `> footer`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/dialog.css .dialog >> > * > footer\r\n   — flex flex-col-reverse sm:flex-row sm:justify-end */\r\n/* basecoat@1.0.2 styles/vega.css .alert-dialog > * > footer, .dialog > * > footer — gap-2 */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel]) > [mono-footer] {\r\n  display: flex;\r\n  flex-direction: column-reverse;\r\n  gap: var(--_mono-modal-footer-gap);\r\n  flex-shrink: 0;\r\n  margin: var(--mono-modal-footer-margin, 0);\r\n  padding: var(--mono-modal-footer-pad, 0);\r\n  border-top: var(--_mono-modal-footer-border-width) solid var(--_mono-modal-footer-border);\r\n  border-end-start-radius: var(--mono-modal-footer-radius, 0);\r\n  border-end-end-radius: var(--mono-modal-footer-radius, 0);\r\n  background: var(--_mono-modal-footer-bg);\r\n}\r\n\r\n@media (width >= 40rem) {\r\n  [mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-footer] {\r\n    flex-direction: row;\r\n    align-items: center;\r\n    justify-content: flex-end;\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Full screen — both width and height passed as \"100%\"\r\n   ========================================= */\r\n\r\n[mono-modal][mono-fullscreen] > [mono-panel-wrap] {\r\n  padding: 0;\r\n}\r\n\r\n[mono-modal][mono-fullscreen] > [mono-panel-wrap] > [mono-panel] {\r\n  width: 100vw;\r\n  width: 100dvw;\r\n  height: 100vh;\r\n  height: 100dvh;\r\n  max-width: 100vw;\r\n  max-width: 100dvw;\r\n  max-height: 100vh;\r\n  max-height: 100dvh;\r\n  border-radius: 0;\r\n}\r\n\r\n/* A closed modal is hidden with `visibility: hidden`, which skips PAINT but not\r\n   LAYOUT — so the panel and everything slotted into it kept generating boxes and\r\n   being measured even for a modal the user never opened. That cost is paid at mount:\r\n   `mono-modal.ts` builds the <body> portal in `createRenderRoot()`, moves the\r\n   consumer's children into it, and forces a synchronous `performUpdate()` from\r\n   `connectedCallback`. `content-visibility: hidden` drops the closed subtree\r\n   entirely, so a heavy modal costs nothing until it is opened.\r\n\r\n   Measured (Chromium, ~400-node panels, 10 modal+drawer pairs, 20k DOM nodes):\r\n     layout objects: 12281 → 81 (−99.3%); with a single pair, 1237 → 18\r\n     mount layout+style: 94.6ms → 14.9ms, and flat in the number of modals\r\n   The trade, same as the accordion's: one open+close costs MORE (2.1ms → 8.0ms),\r\n   because an opening panel is laid out from scratch instead of incrementally. Worth\r\n   it — you mount once and toggle rarely — and `--mono-modal-duration: 0s` claws the\r\n   toggle back if a body is heavy enough to notice.\r\n\r\n   `allow-discrete` is what makes it safe to animate. Opening flips the property to\r\n   `visible` at 0%, so the scale/opacity animation has something to composite;\r\n   closing holds it `visible` until 100%, so the panel scales out instead of\r\n   vanishing on the first frame.\r\n\r\n   Gated behind @supports deliberately: `content-visibility … allow-discrete` inside\r\n   the `transition` SHORTHAND is a parse error to a browser without the feature, and\r\n   one bad entry drops the WHOLE declaration — which would take the modal's fade and\r\n   scale with it. Inside the guard the shorthand is known to parse, so the list is\r\n   restated in full. Browsers without support keep exactly the previous behaviour.\r\n\r\n   Must stay ABOVE the reduced-motion block below: that block wins on `!important`,\r\n   but @supports adds no specificity, so source order is what keeps it winning. */\r\n@supports (transition-behavior: allow-discrete) {\r\n  :where([mono-modal] > [mono-panel-wrap]) > [mono-panel] {\r\n    content-visibility: hidden;\r\n    contain-intrinsic-size: 0;\r\n    transition:\r\n      opacity var(--_mono-modal-duration) var(--mono-ease),\r\n      transform var(--_mono-modal-duration) var(--mono-ease),\r\n      visibility 0s linear var(--_mono-modal-duration),\r\n      content-visibility var(--_mono-modal-duration) allow-discrete;\r\n  }\r\n\r\n  [mono-modal][mono-open] > [mono-panel-wrap] > [mono-panel] {\r\n    content-visibility: visible;\r\n  }\r\n}\r\n\r\n/* Reduced motion */\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-modal] > [mono-overlay],\r\n  [mono-modal] > [mono-panel-wrap] > [mono-panel] {\r\n    transition: opacity 0.01s linear, visibility 0s linear !important;\r\n    transform: none !important;\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Auto full-screen (`auto-fullscreen` prop)\r\n   =========================================\r\n\r\n   Fill the screen at a Tailwind breakpoint and below. The boundaries are\r\n   `<breakpoint> - 0.02px` so they match Tailwind's `max-*` variants exactly: at\r\n   exactly 640px `sm:` applies, so auto-fullscreen must NOT.\r\n\r\n   Two things to know before editing:\r\n\r\n   1. `!important` is required here, unlike `[mono-fullscreen]` above.\r\n      `_panelSizeStyle()` writes `width`/`height`/`min-*`/`max-*` as INLINE styles\r\n      whenever the consumer sets a sizing prop, and inline beats any selector —\r\n      without it `<mono-modal auto-fullscreen width=\"720\">` would stay 720px on a\r\n      phone. The `min-*` resets matter too: a `min-width` larger than `width` still\r\n      wins.\r\n   2. The five near-identical blocks are unavoidable — a media query cannot be\r\n      parameterised by an attribute or a custom property, so each breakpoint needs\r\n      its own. Keep them in sync.\r\n*/\r\n\r\n@media (max-width: 639.98px) {\r\n  [mono-modal][mono-auto-fullscreen=\"sm\"] > [mono-panel-wrap] {\r\n    padding: 0;\r\n  }\r\n\r\n  [mono-modal][mono-auto-fullscreen=\"sm\"] > [mono-panel-wrap] > [mono-panel] {\r\n    width: 100vw !important;\r\n    width: 100dvw !important;\r\n    height: 100vh !important;\r\n    height: 100dvh !important;\r\n    min-width: 0 !important;\r\n    min-height: 0 !important;\r\n    max-width: 100vw !important;\r\n    max-width: 100dvw !important;\r\n    max-height: 100vh !important;\r\n    max-height: 100dvh !important;\r\n    border-radius: 0;\r\n  }\r\n}\r\n\r\n@media (max-width: 767.98px) {\r\n  [mono-modal][mono-auto-fullscreen=\"md\"] > [mono-panel-wrap] {\r\n    padding: 0;\r\n  }\r\n\r\n  [mono-modal][mono-auto-fullscreen=\"md\"] > [mono-panel-wrap] > [mono-panel] {\r\n    width: 100vw !important;\r\n    width: 100dvw !important;\r\n    height: 100vh !important;\r\n    height: 100dvh !important;\r\n    min-width: 0 !important;\r\n    min-height: 0 !important;\r\n    max-width: 100vw !important;\r\n    max-width: 100dvw !important;\r\n    max-height: 100vh !important;\r\n    max-height: 100dvh !important;\r\n    border-radius: 0;\r\n  }\r\n}\r\n\r\n@media (max-width: 1023.98px) {\r\n  [mono-modal][mono-auto-fullscreen=\"lg\"] > [mono-panel-wrap] {\r\n    padding: 0;\r\n  }\r\n\r\n  [mono-modal][mono-auto-fullscreen=\"lg\"] > [mono-panel-wrap] > [mono-panel] {\r\n    width: 100vw !important;\r\n    width: 100dvw !important;\r\n    height: 100vh !important;\r\n    height: 100dvh !important;\r\n    min-width: 0 !important;\r\n    min-height: 0 !important;\r\n    max-width: 100vw !important;\r\n    max-width: 100dvw !important;\r\n    max-height: 100vh !important;\r\n    max-height: 100dvh !important;\r\n    border-radius: 0;\r\n  }\r\n}\r\n\r\n@media (max-width: 1279.98px) {\r\n  [mono-modal][mono-auto-fullscreen=\"xl\"] > [mono-panel-wrap] {\r\n    padding: 0;\r\n  }\r\n\r\n  [mono-modal][mono-auto-fullscreen=\"xl\"] > [mono-panel-wrap] > [mono-panel] {\r\n    width: 100vw !important;\r\n    width: 100dvw !important;\r\n    height: 100vh !important;\r\n    height: 100dvh !important;\r\n    min-width: 0 !important;\r\n    min-height: 0 !important;\r\n    max-width: 100vw !important;\r\n    max-width: 100dvw !important;\r\n    max-height: 100vh !important;\r\n    max-height: 100dvh !important;\r\n    border-radius: 0;\r\n  }\r\n}\r\n\r\n@media (max-width: 1535.98px) {\r\n  [mono-modal][mono-auto-fullscreen=\"2xl\"] > [mono-panel-wrap] {\r\n    padding: 0;\r\n  }\r\n\r\n  [mono-modal][mono-auto-fullscreen=\"2xl\"] > [mono-panel-wrap] > [mono-panel] {\r\n    width: 100vw !important;\r\n    width: 100dvw !important;\r\n    height: 100vh !important;\r\n    height: 100dvh !important;\r\n    min-width: 0 !important;\r\n    min-height: 0 !important;\r\n    max-width: 100vw !important;\r\n    max-width: 100dvw !important;\r\n    max-height: 100vh !important;\r\n    max-height: 100dvh !important;\r\n    border-radius: 0;\r\n  }\r\n}\r\n\r\n/* ── Programmatic dialog (`controlMonoModal().dialog`) ─────────────────────────\r\n   The compact question box the controller builds by code — upstream's\r\n   `.alert-dialog`: the text centred, the actions centred under it, and a lighter\r\n   scrim, because what the question is about should stay readable behind it.\r\n   `mono-dialog` is set through `cssClassName` on the dialog's own modal, so an\r\n   ordinary <mono-modal> is untouched. */\r\n[mono-modal][mono-dialog] {\r\n  --_mono-modal-overlay-backdrop-filter: var(--mono-modal-overlay-backdrop-filter, none);\r\n  --_mono-modal-overlay-bg: var(--mono-modal-overlay-bg,\r\n    color-mix(in oklab, black 22%, transparent));\r\n}\r\n\r\n/* basecoat@1.0.2 components/dialog.css .alert-dialog >> > * > header — grid\r\n   place-items-center text-center sm:place-items-start sm:text-start\r\n   DEVIATION: centred at EVERY width. This box is one question and two buttons —\r\n   upstream's `sm:` left-align belongs to the icon+title+description layout its\r\n   alert dialog builds, which the controller does not produce. */\r\n[mono-modal][mono-dialog] > [mono-panel-wrap] > [mono-panel] > [mono-body] {\r\n  text-align: center;\r\n}\r\n\r\n/* basecoat@1.0.2 components/dialog.css .alert-dialog >> &:is([data-size='sm']) > * > footer, > [data-size='sm'] > footer\r\n   — grid grid-cols-2. The controller's dialog is that `sm` alert: its actions sit\r\n   together under the question rather than trailing to the end. */\r\n[mono-modal][mono-dialog] > [mono-panel-wrap] > [mono-panel] > [mono-footer] {\r\n  justify-content: center;\r\n  flex-wrap: wrap;\r\n}\r\n\r\n/* The light build re-appends slotted nodes into a `[data-mono-slot]` outlet.\r\n   Left inline, that outlet is ONE flex child, so the footer's gap and\r\n   justification apply to IT rather than to the buttons inside it — while the\r\n   shadow build's `<slot>` is `display: contents` per the UA sheet and the\r\n   hand-written markup has no wrapper at all. Dissolving the outlet is what\r\n   makes the three agree, and it is what a consumer writing\r\n   `<button slot=\"footer\">` twice expects. */\r\n:where([mono-modal] > [mono-panel-wrap] > [mono-panel] > [mono-footer]) > [data-mono-slot] {\r\n  display: contents;\r\n}\r\n\r\n/* The captured footer lands in an inline `<span data-mono-slot=\"foot\">` outlet, so\r\n   the buttons would otherwise sit in a LINE box — baseline-aligned, a solid button\r\n   with an icon a few px lower than an outline one beside it, with line-height air\r\n   underneath. The outlet becomes the flex row instead, and the actions wrapper\r\n   dissolves into it. */\r\n[mono-modal][mono-dialog] > [mono-panel-wrap] > [mono-panel] > [mono-footer] > [data-mono-slot=\"foot\"] {\r\n  display: flex;\r\n  flex: 1 1 auto;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--_mono-modal-footer-gap);\r\n  line-height: 1;\r\n}\r\n\r\n[mono-modal][mono-dialog] .mono-modal-dialog-actions {\r\n  display: contents;\r\n}\r\n";
//#endregion
//#region src/components/modal/mono-modal.shadow.ts
/**
* Alias each region also answers to. `header`/`footer` mirror the drawer's slot
* vocabulary and OUTRANK the original `head`/`foot` when both are supplied.
*/
var ALIAS_OF = {
	head: "header",
	foot: "footer"
};
var MonoModalShadow = class MonoModalShadow extends withShadowUtilityStyles(MonoModalCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(modal_default, { host: "mono-modal" }))];
	}
	get _slotsAlwaysRender() {
		return true;
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._scanSlots();
	}
	updated(changed) {
		super.updated(changed);
		this._applyRootAttrs(this._rootEl);
		if (!isServer) this._scanSlots();
	}
	/** `string`, not `ModalSlotName` — this also resolves the alias names. */
	_slotFor(name) {
		return this.renderRoot.querySelector(`slot[name="${name}"]`);
	}
	_defaultSlot() {
		return this.renderRoot.querySelector("slot:not([name])");
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes().length > 0 && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	/**
	* Does this region have content under EITHER of its names? `head`/`foot` each
	* also answer to an alias (`header`/`footer`), so presence is the union.
	*/
	_regionHasContent(name) {
		const alias = ALIAS_OF[name];
		return this._slotHasContent(this._slotFor(name)) || !!alias && this._slotHasContent(this._slotFor(alias));
	}
	/** Reconcile the 4 slot-presence flags from their slots' assigned content.
	*  Body is the default (unnamed) slot OR an explicit `slot="body"`. */
	_scanSlots() {
		for (const name of [
			"head",
			"title",
			"subtitle",
			"foot"
		]) {
			const has = this._regionHasContent(name);
			if (has !== this._hasSlot(name)) this._setSlotState(name, has);
		}
		const bodyHas = this._slotHasContent(this._slotFor("body")) || this._slotHasContent(this._defaultSlot());
		if (bodyHas !== this._hasSlot("body")) this._setSlotState("body", bodyHas);
	}
	/**
	* Native `<slot>`. Body accepts both the default (unnamed) slot and an
	* explicit `slot="body"` — matching the light build's capture, which treats
	* unslotted children and `slot="body"` alike.
	*/
	_slotOutlet(name, fallback = nothing) {
		if (name === "body") return html`<slot
          name="body"
          @slotchange=${(e) => this._onSlotChange("body", e)}
        ></slot
        ><slot @slotchange=${() => this._scanSlots()}>${fallback}</slot>`;
		const alias = ALIAS_OF[name];
		if (alias) {
			const sync = () => this._setSlotState(name, this._regionHasContent(name));
			return html`<slot name=${alias} @slotchange=${sync}
        ><slot name=${name} @slotchange=${sync}>${fallback}</slot></slot
      >`;
		}
		return html`<slot
      name=${name}
      @slotchange=${(e) => this._onSlotChange(name, e)}
      >${fallback}</slot
    >`;
	}
	/** Inline SVG — the global `.mono-icon`/`i-mdi-close` UnoCSS icon can't reach
	*  a shadow root. */
	renderIcon(_name) {
		return html`<svg
      class="mono-icon"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      ></path>
    </svg>`;
	}
	/** Ids are scoped to this shadow root, so a constant is unique enough — and,
	*  unlike a counter, the same on the server and the client. */
	get _headingIdBase() {
		return "mono-modal";
	}
	render() {
		const aria = this._headingAria();
		return html`
      <div
        class=${this._computeModalClasses().join(" ")}
        mono-modal
        ${ref(this.bindRoot)}
        role="dialog"
        title=""
        aria-labelledby=${ifDefined(aria.labelledby)}
        aria-describedby=${ifDefined(aria.describedby)}
        aria-modal=${this.overlay ? "true" : "false"}
        aria-hidden=${this.modelValue ? "false" : "true"}
        style=${styleMap({ "--mono-modal-z": String(this._effectiveZ) })}
      >
        ${this._renderModalBody()}
      </div>
    `;
	}
};
MonoModalShadow = __decorate([customElement("mono-shadow-modal")], MonoModalShadow);
//#endregion
//#region src/components/modal/mono-modal-controller.ts
/**
* The dialog's `<mono-modal>` defaults. `dialog.props` is merged over these; the
* dismissal locks are re-applied after that merge in `buildDialogElement` and
* cannot be turned off — a dialog is a question, and the only way past it is one
* of its own buttons.
*/
var DIALOG_MODAL_DEFAULTS = {
	size: "xs",
	color: "primary",
	width: "fit-content",
	minWidth: "16rem",
	maxWidth: "min(92vw, 480px)",
	stackable: true,
	draggable: true,
	cssClassName: "mono-modal-dialog"
};
/** Everything a dialog must refuse. Applied last, so `dialog.props` cannot undo it. */
var DIALOG_LOCKS = {
	persistent: true,
	dismissible: false,
	closeOnEscape: false,
	closeOnOverlay: false
};
/** How long a closed dialog's element lingers for the close transition (`--mono-modal-duration` is 0.22s). */
var DIALOG_REMOVE_DELAY = 320;
/** Light tag first; the shadow build registers its own name. */
var resolveTag = (light, shadow) => {
	if (typeof customElements === "undefined") return null;
	if (customElements.get(light)) return light;
	if (customElements.get(shadow)) return shadow;
	return null;
};
function monoModal(options = {}) {
	const notifier = createNotifier();
	const notify = notifier.notify;
	const elementProps = { ...options.props ?? {} };
	const elements = /* @__PURE__ */ new Set();
	let wantOpen = false;
	let isOpen = false;
	const setOpen = (next) => {
		wantOpen = next;
		for (const el of elements) if (next) el.show("manual");
		else el.hide("manual");
		if (!elements.size && isOpen !== next) {
			isOpen = next;
			notify();
		}
	};
	let dialogDefaults = { ...options.dialog ?? {} };
	let dialogEl = null;
	let dialogResolve = null;
	let dialogOpen = false;
	/** Resolve the pending `show()` and start the teardown. */
	const closeDialog = (value) => {
		const el = dialogEl;
		const resolve = dialogResolve;
		dialogEl = null;
		dialogResolve = null;
		dialogOpen = false;
		if (el) {
			el.hide("manual");
			setTimeout(() => el.remove(), DIALOG_REMOVE_DELAY);
		}
		resolve?.(value ?? false);
		notify();
	};
	const buildButton = (tag, item, owner) => {
		const el = document.createElement(tag);
		el.setAttribute("data-mono-dialog-button", "");
		if (item.className) el.className = item.className;
		if (item.icon) {
			const icon = document.createElement("span");
			icon.setAttribute("slot", "icon");
			icon.className = `mono-icon ${item.icon}`;
			el.appendChild(icon);
		}
		if (item.label) el.appendChild(document.createTextNode(item.label));
		const { label: _l, icon: _i, className: _n, onClick, value, ...rest } = item;
		applyProps(el, {
			size: "xs",
			...rest
		});
		el.handler = async (event) => {
			if (onClick) await onClick(event, {
				dialog,
				button: el
			});
			if (value !== void 0 && dialogEl && dialogEl === owner()) closeDialog(value);
		};
		el.addEventListener("mno-click", (e) => e.stopPropagation());
		el.addEventListener("mnoClick", (e) => e.stopPropagation());
		return el;
	};
	const buildDialogElement = (opts, modalTag, buttonTag) => {
		const el = document.createElement(modalTag);
		el.setAttribute("data-mono-dialog", "");
		const body = document.createElement("div");
		body.className = "mono-modal-dialog-body";
		if (opts.body instanceof Node) body.appendChild(opts.body);
		else if (opts.body != null) body.innerHTML = String(opts.body);
		el.appendChild(body);
		const buttons = opts.buttons ?? [];
		if (buttons.length) {
			const foot = document.createElement("span");
			foot.setAttribute("slot", "footer");
			foot.className = "mono-modal-dialog-actions";
			for (const item of buttons) foot.appendChild(buildButton(buttonTag, item, () => el));
			el.appendChild(foot);
		}
		applyProps(el, {
			...DIALOG_MODAL_DEFAULTS,
			...opts.props ?? {},
			...opts.title != null ? { title: opts.title } : {},
			...opts.subtitle != null ? { subtitle: opts.subtitle } : {},
			...DIALOG_LOCKS
		});
		return el;
	};
	const focusButton = async (el, index) => {
		if (index === "none") return;
		const i = typeof index === "number" ? index : 0;
		await el.updateComplete;
		const root = el.renderRoot;
		const target = el.querySelectorAll("[data-mono-dialog-button]")[i] ?? root?.querySelectorAll("[data-mono-dialog-button]")[i];
		if (!target) return;
		await target.updateComplete;
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		if (dialogEl === el) target.focus?.();
	};
	const dialog = {
		show(override) {
			if (typeof document === "undefined") return Promise.reject(/* @__PURE__ */ new Error("[mono-modal] dialog.show() needs a document — call it on the client"));
			const modalTag = resolveTag("mono-modal", "mono-shadow-modal");
			const buttonTag = resolveTag("mono-button", "mono-shadow-button");
			if (!modalTag || !buttonTag) return Promise.reject(/* @__PURE__ */ new Error("[mono-modal] dialog.show(): <mono-modal> and <mono-button> are not registered — import '@mono-lit/helper/ui/modal' (it registers both) before showing a dialog."));
			if (dialogOpen) closeDialog(false);
			const opts = {
				...dialogDefaults,
				...override ?? {},
				props: {
					...dialogDefaults.props ?? {},
					...override?.props ?? {}
				}
			};
			const el = buildDialogElement(opts, modalTag, buttonTag);
			dialogEl = el;
			dialogOpen = true;
			const promise = new Promise((resolve) => {
				dialogResolve = resolve;
			});
			document.body.appendChild(el);
			el.show("manual");
			focusButton(el, opts.focus);
			notify();
			return promise;
		},
		close(value) {
			if (!dialogOpen) return;
			closeDialog(value);
		},
		get isOpen() {
			return dialogOpen;
		},
		get element() {
			return dialogEl;
		},
		setProps(patch) {
			dialogDefaults = {
				...dialogDefaults,
				...patch,
				props: {
					...dialogDefaults.props ?? {},
					...patch.props ?? {}
				}
			};
		}
	};
	return {
		props: () => elementProps,
		setProps(patch) {
			Object.assign(elementProps, patch);
			notify();
		},
		open: () => setOpen(true),
		close: () => setOpen(false),
		toggle: () => setOpen(!isOpen),
		get isOpen() {
			return isOpen;
		},
		get element() {
			return elements.values().next().value ?? null;
		},
		dialog,
		subscribe: notifier.subscribe,
		dispose() {
			if (dialogOpen) closeDialog(false);
			notifier.clear();
			elements.clear();
		},
		_register(el) {
			elements.add(el);
			if (wantOpen && !el.modelValue) el.show("manual");
			else if (isOpen !== el.modelValue) {
				isOpen = el.modelValue;
				notify();
			}
		},
		_unregister(el) {
			elements.delete(el);
		},
		_report(open, _source) {
			wantOpen = open;
			if (isOpen === open) return;
			isOpen = open;
			notify();
		}
	};
}
//#endregion
export { MonoModalCore, MonoModalShadow, monoModal as controlMonoModal, monoModal };
