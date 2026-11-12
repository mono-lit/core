import { i as registerPopupLayer, o as unregisterPopupLayer, r as refreshPopupStack, t as getOpenPopupLayers } from "./popup-stack-C64WCuXq.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, s as optionalNumberConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-CAZf0F_k.js";
import { i as pathOwnedBy } from "./popup-portal-CINuVjNY.js";
import { n as isBelowBreakpoint, r as resolveAutoFullscreen, t as autoFullscreenConverter } from "./breakpoints-DllybT82.js";
import { html, isServer, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";

//#region src/components/drawer/drawer-core.ts
/** Per-instance id seed for the light build's heading ids (they live in the
*  document, so they must be unique). The shadow build scopes ids to its own
*  root and uses a constant — see `_headingIdBase`. */
let drawerIdSeq = 0;
/**
* Named dimension presets for `width` / `height` — `width="lg"`, `height="sm"`.
*
* The same six tokens the `size` prop uses, on a different axis: `size` is the
* CONTENT scale (padding, type, close icon) and never touches the panel's box, while
* these name a MEASURE. `size="sm" width="xl"` is a compact, wide drawer.
*
* These are the dimensions the drawer has always shipped — `md` reproduces the
* stylesheet defaults (`420px` / `50vh`) exactly. Only the axis `position` leaves
* free is ever read, so a token on the pinned axis is simply inert.
*/
const WIDTH_PRESETS = {
	xs: "220px",
	sm: "280px",
	md: "420px",
	lg: "560px",
	xl: "720px",
	xxl: "900px"
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
* Normalize a dimension prop to a CSS length.
* - a preset token (`"xs"`…`"xxl"`) → the ladder for `axis`
* - `number` (or a numeric string) → `${n}px`
* - any other non-empty string → passed through (`"80%"`, `"100vw"`, `"32rem"`)
* - `null` / `undefined` / `''` → `undefined` ("not set", fall back to the var)
*
* Mirrors `toCssSize` in modal-core.ts, ladders included.
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
* `MonoDrawerCore` — render-mode-agnostic logic for `mono-drawer`: props/hybrid
* aliases, the open/close model (`show`/`hide`/`toggle` + `mno-*` events), the
* `PopupLayer` surface (shared z-stack / scroll-lock / topmost-Escape via the
* SSR-safe `popup-stack`), resizeable-edge logic, and the shared drawer markup
* (`_renderDrawerBody`). SSR-safe: `popup-stack` no-ops server-side and the
* `window`/resize access is `isServer`-guarded. Mirrors `modal-core.ts`.
*
* Each build supplies the render root + slot/icon strategy:
*  - light (`mono-drawer.ts`): a `<body>` portal that IS the `.mono-drawer` root,
*    `data-mono-slot` placeholders, UnoCSS `.i-mdi-close`.
*  - shadow (`mono-drawer.shadow.ts`): a real shadow root with an inner
*    `.mono-drawer` root, native `<slot>`s, inline-SVG ✕.
*/
const MonoDrawerCore = (superClass) => {
	class MonoDrawerCoreClass extends superClass {
		static {
			this.monoPendingAuto = "never";
		}
		constructor(...args) {
			super(...args);
			this.position = "right";
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
			this.resizeable = false;
			this.autoFullscreen = false;
			this.stackable = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._slotsCaptured = false;
			this._hasHeaderSlotState = false;
			this._hasTitleSlotState = false;
			this._hasSubtitleSlotState = false;
			this._hasBodySlotState = false;
			this._hasFooterSlotState = false;
			this._hasDrawerAbove = false;
			this._resizing = false;
			this._drawerZ = 9990;
			this._resizeStartX = 0;
			this._resizeStartY = 0;
			this._resizeBaseW = 0;
			this._resizeBaseH = 0;
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
			this._onResizeStart = (event) => {
				if (isServer || typeof window === "undefined") return;
				if (!this.resizeable || event.button !== 0) return;
				if (this._autoFullscreenActive) return;
				event.preventDefault();
				event.stopPropagation();
				const rect = this._panelEl?.getBoundingClientRect();
				this._resizeBaseW = rect?.width ?? 0;
				this._resizeBaseH = rect?.height ?? 0;
				this._resizeStartX = event.clientX;
				this._resizeStartY = event.clientY;
				this._resizing = true;
				window.addEventListener("pointermove", this._onResizeMove);
				window.addEventListener("pointerup", this._onResizeEnd, { once: true });
				window.addEventListener("pointercancel", this._onResizeEnd, { once: true });
			};
			this._onResizeMove = (event) => {
				if (typeof window === "undefined") return;
				const MIN = 200;
				if (this._isHorizontal) {
					const delta = this.position === "right" ? this._resizeStartX - event.clientX : event.clientX - this._resizeStartX;
					const next = Math.max(MIN, Math.min(this._resizeBaseW + delta, window.innerWidth));
					this._setDrawerSizeVar("--mono-drawer-width", `${next}px`);
				} else {
					const delta = this.position === "top" ? event.clientY - this._resizeStartY : this._resizeStartY - event.clientY;
					const next = Math.max(MIN, Math.min(this._resizeBaseH + delta, window.innerHeight));
					this._setDrawerSizeVar("--mono-drawer-height", `${next}px`);
				}
			};
			this._onResizeEnd = () => {
				if (typeof window !== "undefined") window.removeEventListener("pointermove", this._onResizeMove);
				this._resizing = false;
			};
			defineHybridPropAliases(this, [
				"modelValue",
				"cssClass",
				"closeOnEscape",
				"closeOnOverlay",
				"lockScroll",
				"autoFullscreen",
				"zIndex"
			]);
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
		/** Duck-type marker so the exclusive-close logic targets only OTHER drawers in
		*  the shared stack (not modals/dropdowns) without an `instanceof` that the
		*  light + shadow builds — distinct classes — would each fail. */
		get _isMonoDrawer() {
			return true;
		}
		connectedCallback() {
			super.connectedCallback();
			if (this.modelValue) this._applyOpenSideEffects();
		}
		disconnectedCallback() {
			this._releaseSideEffects();
			this._teardownResize();
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
				"resizeable",
				"stackable"
			]) if (typeof this[key] === "string") this[key] = this._toBoolean(this[key]);
			if (changed.has("modelValue")) {
				if (this.modelValue) this._applyOpenSideEffects();
				else this._releaseSideEffects();
			}
			super.willUpdate?.(changed);
		}
		updated(changed) {
			super.updated?.(changed);
			if (isServer) return;
			if (changed.has("width") || changed.has("height")) this._applyDimensionProps();
			if (changed.has("zIndex") && this.modelValue) refreshPopupStack();
			if (changed.has("lockScroll") && this.modelValue) refreshPopupStack();
			if (changed.has("overlay") && this.modelValue) {
				this._syncOutsideClick();
				refreshPopupStack();
			}
		}
		/**
		* Publish `width`/`height` as the public sizing vars.
		*
		* Deliberately the same vars the resize handle writes (`_setDrawerSizeVar`) rather
		* than an inline panel style: that keeps one channel for dimensions, so dragging
		* still works and a later prop change simply re-asserts. Clearing a prop removes
		* the var so the stylesheet default comes back.
		*/
		_applyDimensionProps() {
			const width = toCssSize(this.width, "width");
			const height = toCssSize(this.height, "height");
			if (width) this._setDrawerSizeVar("--mono-drawer-width", width);
			else this._removeDrawerSizeVar("--mono-drawer-width");
			if (height) this._setDrawerSizeVar("--mono-drawer-height", height);
			else this._removeDrawerSizeVar("--mono-drawer-height");
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
		/** The state-class list for the `.mono-drawer` root (light: on the portal;
		*  shadow: on the inner root). */
		_computeDrawerClasses() {
			return [
				"mono-drawer",
				this.size,
				this.color,
				`position-${this.position}`,
				this.modelValue ? "open" : "closed",
				this.overlay ? null : "no-overlay",
				this.persistent ? "persistent" : null,
				this.dismissible ? null : "no-dismiss",
				this._hasDrawerAbove ? "has-drawer-above" : null,
				this.resizeable ? "resizeable" : null,
				this._autoFullscreenClass,
				this._resizing ? "resizing" : null,
				this.cssClassName || null,
				this.cssClass?.root || null
			].filter((c) => Boolean(c));
		}
		/**
		* The prop mirrors and the states, for the same root the classes go on — the
		* `<body>` portal in the light build, the inner root in the shadow one. Each
		* is omitted at its default so `:not([mono-size])` means "md" and
		* `:not([mono-position])` means RIGHT for hand-written markup exactly as they
		* do for the element.
		*/
		_computeRootAttrs() {
			return {
				"mono-size": this.size === "md" ? null : this.size,
				"mono-color": this.color === "primary" ? null : this.color,
				"mono-position": this.position === "right" ? null : this.position,
				"mono-open": this.modelValue ? "" : null,
				"mono-no-overlay": this.overlay ? null : "",
				"mono-persistent": this.persistent ? "" : null,
				"mono-no-dismiss": this.dismissible ? null : "",
				"mono-has-drawer-above": this._hasDrawerAbove ? "" : null,
				"mono-resizeable": this.resizeable ? "" : null,
				"mono-resizing": this._resizing ? "" : null,
				"mono-auto-fullscreen": this._autoFullscreenClass ? this._autoFullscreenClass.replace("auto-fullscreen-", "") : null
			};
		}
		_applyRootAttrs(root) {
			if (!root) return;
			if (!root.hasAttribute("mono-drawer")) root.setAttribute("mono-drawer", "");
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
		* arms the shared Escape listener. Per-drawer scroll-lock / Escape behaviour
		* is owned by the stack manager so nesting works (see composables/popup-stack).
		*/
		_applyOpenSideEffects() {
			if (!this.stackable) {
				for (const other of [...getOpenPopupLayers()]) if (other !== this && other._isMonoDrawer) other.hide?.("manual");
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
		* PopupLayer hook — the path lands in this drawer: the host, its render root,
		* or a popup opened from within. The same test `_onOutsideClick` uses; the stack
		* asks it so a dropdown open BELOW this drawer leaves its clicks alone.
		*/
		containsEventPath(path) {
			const root = this.renderRoot instanceof Element ? this.renderRoot : null;
			return pathOwnedBy(path, root ? [this, root] : [this]);
		}
		/** Body-scroll lock is wanted while this drawer is open and `lockScroll` is set. */
		get lockBodyScroll() {
			return this.lockScroll;
		}
		/**
		* Whether this drawer dims what is beneath it — see `isTopBackdrop` in popup-stack.
		* Only while `overlay` is on: an `overlay="false"` drawer stacked above another
		* dialog used to count as a backdrop, so the one below hid its overlay and
		* nothing dimmed the page at all.
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
		* drawer's overlay + panel above the ones below; when another backdrop layer
		* sits above it (`isTopBackdrop` is false) its own backdrop is hidden so
		* stacked overlays don't compound. An `overlay="false"` modal/drawer above
		* does not count (see `hasBackdrop`). Both builds read `_drawerZ` into the
		* `.mono-drawer` root's `--drawer-z`.
		*/
		setStackZ(z, isTopBackdrop) {
			this._drawerZ = z;
			this._hasDrawerAbove = !isTopBackdrop;
		}
		/**
		* PopupLayer hook — the level this drawer pins itself to, or `undefined` to take
		* the stack's slot. The stack reads it so layers opened ABOVE a pinned drawer
		* clear it instead of landing back at the base (see popup-stack).
		*
		* Coerced through `Number` rather than read directly because the prop can arrive
		* as a numeric STRING — a plain `z-index="1500"` attribute goes through the
		* converter, but `el.zIndex = '1500'` (or a framework binding that stringifies)
		* does not.
		*
		* `null` and `''` are screened out FIRST, and that guard is load-bearing:
		* `Number(null)` and `Number('')` are both `0` and both finite, so `:z-index="null"`
		* — Vue's ordinary spelling for "no value" — used to pin the drawer to `z-index: 0`
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
			return this.pinnedZ ?? this._drawerZ;
		}
		get _isHorizontal() {
			return this.position === "left" || this.position === "right";
		}
		/**
		* Apply a sizing CSS var to the `.mono-drawer` root. Build hook: light writes
		* to the portal; shadow (default here) writes to the inner root element.
		*/
		_setDrawerSizeVar(name, value) {
			this.renderRoot.querySelector(".mono-drawer")?.style.setProperty(name, value);
		}
		/** Counterpart of {@link _setDrawerSizeVar} — same build hook, same root. */
		_removeDrawerSizeVar(name) {
			this.renderRoot.querySelector(".mono-drawer")?.style.removeProperty(name);
		}
		_teardownResize() {
			if (typeof window === "undefined") return;
			window.removeEventListener("pointermove", this._onResizeMove);
			window.removeEventListener("pointerup", this._onResizeEnd);
			window.removeEventListener("pointercancel", this._onResizeEnd);
		}
		/**
		* Every open-state change emits `toggle` (historically `mno-click`, which is
		* kept), then the transition-specific `open` / `close`. `toggle` rather than
		* a plain `click`: a real click from inside the panel already bubbles to the
		* host on its own, and this is not one — it is a state change.
		*/
		_emitChange(detail) {
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
			if (!this.closeOnOverlay || !this.dismissible || this.persistent) return;
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
				heading: this._hasHeaderSlotState || title || subtitle
			};
		}
		/**
		* Prefix of the heading ids (`<base>-heading` / `-title` / `-subtitle`). The
		* light build's panel lives in the document, so the ids must be unique per
		* instance; the shadow build overrides this with a constant (ids are scoped to
		* its own root, and a counter would differ between server and client).
		*/
		get _headingIdBase() {
			this._idSeq ??= ++drawerIdSeq;
			return `mono-drawer-${this._idSeq}`;
		}
		/** `aria-labelledby` / `aria-describedby` for the `role="dialog"` root. A
		*  `slot="header"` labels the dialog with its whole column; otherwise the
		*  title labels it and the subtitle describes it. */
		_headingAria() {
			const s = this._headingState;
			const base = this._headingIdBase;
			if (this._hasHeaderSlotState) return { labelledby: `${base}-heading` };
			return {
				labelledby: s.title ? `${base}-title` : void 0,
				describedby: s.subtitle ? `${base}-subtitle` : void 0
			};
		}
		_renderHead() {
			const s = this._headingState;
			const hasContent = s.heading || this.dismissible;
			if (!hasContent && !this._slotsAlwaysRender) return nothing;
			const base = this._headingIdBase;
			const heading = html`
      <div
        class=${this._cls("mono-drawer-title", "title")}
        mono-title
        id=${`${base}-title`}
        ?mono-empty=${!s.title}
      >${this._slotOutlet("title", this.title || nothing)}</div>
      <div
        class=${this._cls("mono-drawer-subtitle", "subtitle")}
        mono-subtitle
        id=${`${base}-subtitle`}
        ?mono-empty=${!s.subtitle}
      >${this._slotOutlet("subtitle", this.subtitle || nothing)}</div>
    `;
			return html`
      <div
        class=${this._cls("mono-drawer-head", "head")}
        mono-header
        ?mono-empty=${!hasContent}
      >
        <div
          class=${this._cls("mono-drawer-heading", "heading")}
          mono-heading
          id=${`${base}-heading`}
          ?mono-empty=${!s.heading}
        >
          ${this._slotOutlet("header", heading)}
        </div>
        ${this.dismissible ? html`
              <button
                type="button"
                class=${this._cls("mono-drawer-close", "close")}
                mono-close
                aria-label="Close drawer"
                @click=${this._handleClose}
              >
                ${this.renderIcon("close")}
              </button>
            ` : nothing}
      </div>
    `;
		}
		_renderFoot() {
			if (!this._hasFooterSlotState && !this._slotsAlwaysRender) return nothing;
			return html`
      <div
        class=${this._cls("mono-drawer-foot", "foot")}
        mono-footer
        ?mono-empty=${!this._hasFooterSlotState}
      >
        ${this._slotOutlet("footer")}
      </div>
    `;
		}
		/** Shared drawer markup (overlay + panel[resizer + head + body + foot]). The
		*  light build renders this directly into the portal (which IS `.mono-drawer`);
		*  the shadow build wraps it in an inner `.mono-drawer` root. */
		_renderDrawerBody() {
			return html`
      <div
        class=${this._cls("mono-drawer-overlay", "overlay")}
        mono-overlay
        @click=${this._handleOverlayClick}
      ></div>
      <div
        class=${this._cls("mono-drawer-panel", "panel")}
        mono-panel
        role="document"
        @click=${(e) => e.stopPropagation()}
      >
        ${this.resizeable ? html`<div
              class=${this._cls("mono-drawer-resizer", "resizer")}
              mono-resizer
              role="separator"
              aria-orientation=${this._isHorizontal ? "vertical" : "horizontal"}
              @pointerdown=${this._onResizeStart}
            ></div>` : nothing}
        ${this._renderHead()}
        <div class=${this._cls("mono-drawer-body", "body")} mono-body>
          ${this._slotOutlet("body")}
        </div>
        ${this._renderFoot()}
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
			return name === "header" ? this._hasHeaderSlotState : name === "title" ? this._hasTitleSlotState : name === "subtitle" ? this._hasSubtitleSlotState : name === "body" ? this._hasBodySlotState : this._hasFooterSlotState;
		}
		_setSlotState(name, has) {
			if (name === "header") this._hasHeaderSlotState = has;
			else if (name === "title") this._hasTitleSlotState = has;
			else if (name === "subtitle") this._hasSubtitleSlotState = has;
			else if (name === "body") this._hasBodySlotState = has;
			else this._hasFooterSlotState = has;
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
	__decorate([property({ type: String })], MonoDrawerCoreClass.prototype, "position", void 0);
	__decorate([property({ type: String })], MonoDrawerCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoDrawerCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoDrawerCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoDrawerCoreClass.prototype, "subtitle", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: true,
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "dismissible", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "persistent", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "overlay", void 0);
	__decorate([property({
		attribute: "close-on-escape",
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "closeOnEscape", void 0);
	__decorate([property({
		attribute: "close-on-overlay",
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "closeOnOverlay", void 0);
	__decorate([property({
		attribute: "lock-scroll",
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "lockScroll", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "resizeable", void 0);
	__decorate([property({
		attribute: "auto-fullscreen",
		converter: autoFullscreenConverter
	})], MonoDrawerCoreClass.prototype, "autoFullscreen", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDrawerCoreClass.prototype, "stackable", void 0);
	__decorate([property({ type: String })], MonoDrawerCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoDrawerCoreClass.prototype, "height", void 0);
	__decorate([property({
		attribute: "z-index",
		converter: optionalNumberConverter
	})], MonoDrawerCoreClass.prototype, "zIndex", void 0);
	__decorate([property({ attribute: false })], MonoDrawerCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoDrawerCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_slotsCaptured", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_hasHeaderSlotState", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_hasTitleSlotState", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_hasSubtitleSlotState", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_hasBodySlotState", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_hasFooterSlotState", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_hasDrawerAbove", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_resizing", void 0);
	__decorate([state()], MonoDrawerCoreClass.prototype, "_drawerZ", void 0);
	__decorate([query(".mono-drawer-panel")], MonoDrawerCoreClass.prototype, "_panelEl", void 0);
	return MonoDrawerCoreClass;
};

//#endregion
export { MonoDrawerCore as t };