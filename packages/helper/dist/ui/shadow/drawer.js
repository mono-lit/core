import { a as __decorate, d as optionalNumberConverter, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as isBelowBreakpoint, r as resolveAutoFullscreen, t as autoFullscreenConverter } from "../../breakpoints-CAbhDUht.js";
import { a as unregisterPopupLayer, n as refreshPopupStack, r as registerPopupLayer, t as getOpenPopupLayers } from "../../popup-stack-CEEMib__.js";
import { i as pathOwnedBy } from "../../popup-portal-BziRX1yG.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { ref } from "lit/directives/ref.js";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/drawer/drawer-core.ts
/** Per-instance id seed for the light build's heading ids (they live in the
*  document, so they must be unique). The shadow build scopes ids to its own
*  root and uses a constant — see `_headingIdBase`. */
var drawerIdSeq = 0;
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
var WIDTH_PRESETS = {
	xs: "220px",
	sm: "280px",
	md: "420px",
	lg: "560px",
	xl: "720px",
	xxl: "900px"
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
var MonoDrawerCore = (superClass) => {
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
			if (changed.has("modelValue")) if (this.modelValue) this._applyOpenSideEffects();
			else this._releaseSideEffects();
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
//#region src/components/drawer/drawer.css?raw
var drawer_default = "/* @unocss-include */\r\n\r\n/* =========================================================================\r\n   mono-drawer — a port of Basecoat's `.drawer` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-drawer size=\"lg\" color=\"success\" position=\"left\" model-value>\r\n     <div mono-drawer mono-size=\"lg\" mono-color=\"success\" mono-position=\"left\"\r\n          mono-open role=\"dialog\" aria-modal=\"true\">\r\n       <div mono-overlay></div>\r\n       <div mono-panel role=\"document\">\r\n         <div mono-resizer role=\"separator\"></div>\r\n         <div mono-header>\r\n           <div mono-heading>\r\n             <div mono-title>Filters</div>\r\n             <div mono-subtitle>Narrow the results</div>\r\n           </div>\r\n           <button mono-close type=\"button\" aria-label=\"Close drawer\">…</button>\r\n         </div>\r\n         <div mono-body>…</div>\r\n         <div mono-footer>…</div>\r\n       </div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-position])` = RIGHT — upstream's\r\n   unqualified side is `bottom`, ours is `right`). The element writes them on its\r\n   ROOT — the `<body>` portal in the light build, an inner root `<div>` in the\r\n   shadow one — along with every state below. The old classes\r\n   (`.mono-drawer.md.primary.position-right.open`) are still emitted as inert\r\n   hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-drawer]        ≡ .drawer (the <dialog>) — DEVIATION: a var scope, not a\r\n                            `fixed inset-0` box, because the overlay and the panel\r\n                            are each `position: fixed` and this component owns its\r\n                            own layer through `composables/popup-stack`\r\n     [mono-overlay]       ≡ .drawer::backdrop (bg-black/10 backdrop-blur-xs) — the\r\n                            fill is `--mono-mode-backdrop`, a token, since a\r\n                            pseudo-element cannot be reached from a shadow sheet\r\n     [mono-panel]         ≡ .drawer > * (fixed flex h-auto flex-col\r\n                            transition-transform duration-500\r\n                            ease-[cubic-bezier(0.32,0.72,0,1)], bg-popover\r\n                            text-popover-foreground text-sm), plus the per-side\r\n                            inset / measure / translate and the ONE rounded edge\r\n                            and border that face the content\r\n     [mono-position=…]    ≡ [data-side='…'] (left / right / top / bottom)\r\n     [mono-header]        ≡ .drawer > * > header (flex flex-col gap-0.5 p-4\r\n                            text-start, md:gap-1.5) — DEVIATION: a ROW, because\r\n                            the ✕ lives inside it (see below), and NOT centred on\r\n                            the top / bottom sides for the same reason\r\n     [mono-heading]       ≡ upstream's header column itself (flex-col gap-0.5,\r\n                            md:gap-1.5) — the ✕'s row-mate; `slot=\"header\"`\r\n                            replaces it\r\n     [mono-title]         ≡ .drawer > * > header > h2 (text-lg font-semibold\r\n                            leading-none tracking-tight)\r\n     [mono-subtitle]      ≡ .drawer > * > header > p (text-muted-foreground\r\n                            text-sm)\r\n     [mono-body]          ≡ .drawer > * > section (min-h-0 flex-1 overflow-y-auto)\r\n                            — DEVIATION: padded. Upstream leaves the section bare\r\n                            and its own examples pad the content they put in it;\r\n                            here the body is a SLOT a consumer fills with plain\r\n                            text, so it brings the `p-4` itself\r\n                            (`--mono-drawer-body-pad` turns it off)\r\n     [mono-footer]        ≡ .drawer > * > footer (mt-auto flex flex-col gap-2 p-4)\r\n     [mono-close]         ≡ EXTENSION (upstream's drawer has no close button)\r\n     [mono-resizer]       ≡ EXTENSION (the grab bar on the inner edge)\r\n     [mono-size]/[mono-color] ≡ EXTENSION (upstream ships one drawer, no colour)\r\n\r\n   THE TINTED HEADER IS GONE, exactly as in the modal: `--mono-drawer-header-bg`\r\n   and `-footer-bg` remain as knobs, defaulting to transparent, with matching\r\n   `-border` / `-border-width` so a consumer who wants the bars back sets them.\r\n\r\n   THE FOOTER STACKS. Upstream's drawer footer is a COLUMN — it is the mobile\r\n   sheet idiom, where the actions are full-width and stacked — where this\r\n   component's was a right-aligned row. `--mono-drawer-footer-direction: row`\r\n   restores the row, and ONE sets it, so the default flavor is unchanged.\r\n\r\n   PART NAMES ARE PATH-SCOPED. `[mono-panel]`, `[mono-body]` and `[mono-title]`\r\n   are also dropdown's, card's and modal's part names, and a drawer BODY is where\r\n   consumers put all three. Every rule here is written as an explicit child path\r\n   from the root, with `:where()` keeping the resting weight at (0,1,0) so a\r\n   `cssClass` utility still wins by source order.\r\n\r\n   FLAVORS set `--mono-drawer-{radius,shadow,overlay-*,pad,header-gap,footer-gap,\r\n   title-*,body-font,body-line-height,width,height}` (+ the per-size forms), and\r\n   the four that float the panel as a card set the `inset` trio as well\r\n   (`--mono-drawer-{inset,inset-radius,inset-border-width}` with\r\n   `--mono-drawer-panel-pad`). Every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \".drawer\"`).\r\n   ========================================================================= */\r\n\r\nmono-drawer {\r\n  display: contents;\r\n}\r\n\r\n/* =========================================\r\n   Root — the layer\r\n   ========================================= */\r\n\r\n[mono-drawer] {\r\n  /* ── the six roles, each a public knob over a Basecoat token ───────────── */\r\n  --_mono-drawer-primary: var(--mono-drawer-primary, var(--primary));\r\n  --_mono-drawer-secondary: var(--mono-drawer-secondary, var(--secondary-foreground));\r\n  --_mono-drawer-success: var(--mono-drawer-success, var(--success));\r\n  --_mono-drawer-danger: var(--mono-drawer-danger, var(--destructive));\r\n  --_mono-drawer-warning: var(--mono-drawer-warning, var(--warning));\r\n  --_mono-drawer-info: var(--mono-drawer-info, var(--info));\r\n  --_mono-drawer-teal: var(--mono-drawer-teal, var(--teal));\r\n  --_mono-drawer-purple: var(--mono-drawer-purple, var(--purple));\r\n  --_mono-drawer-neutral: var(--mono-drawer-neutral, var(--neutral));\r\n  --_mono-drawer-dark: var(--mono-drawer-dark, var(--dark));\r\n  /* the colour in play — `primary` unless a [mono-color] rule re-points it */\r\n  --_mono-drawer-accent: var(--mono-drawer-accent, var(--_mono-drawer-accent-preset, var(--_mono-drawer-primary)));\r\n\r\n  /* ── panel paint — `bg-popover text-popover-foreground`, one border edge ── */\r\n  --_mono-drawer-bg: var(--mono-drawer-bg, var(--mono-drawer-surface, var(--popover)));\r\n  --_mono-drawer-text: var(--mono-drawer-text, var(--popover-foreground));\r\n  --_mono-drawer-border: var(--mono-drawer-border, var(--border));\r\n  --_mono-drawer-border-width: var(--mono-drawer-border-width, var(--mono-border-width));\r\n  --_mono-drawer-shadow: var(--mono-drawer-shadow, var(--mono-shadow-lg));\r\n  /* a faint halo of the accent under the elevation — nothing until `color` is set */\r\n  --_mono-drawer-glow: var(--mono-drawer-glow, 0 0 #0000);\r\n  /* maia, mira, luma and rhea float the panel as an INSET card (`before:inset-2`\r\n     over a transparent panel); at 0 the card is the panel itself, which is vega. */\r\n  --_mono-drawer-inset: var(--mono-drawer-inset, 0px);\r\n  --_mono-drawer-panel-pad: var(--mono-drawer-panel-pad, 0px);\r\n  /* vega borders the ONE edge that faces the content; an inset card is a free\r\n     floating box, so it borders all four (`before:border`). At 0 the per-side\r\n     rules below are the only edge, which is vega. */\r\n  --_mono-drawer-inset-border-width: var(--mono-drawer-inset-border-width, 0px);\r\n\r\n  /* The tinted head / foot bars of the pre-port drawer. Upstream has neither, so\r\n     both default to nothing — set the pair (and the `-border-width`) to restore. */\r\n  --_mono-drawer-header-bg: var(--mono-drawer-header-bg, var(--mono-drawer-head-bg, transparent));\r\n  --_mono-drawer-footer-bg: var(--mono-drawer-footer-bg, var(--mono-drawer-foot-bg, transparent));\r\n  --_mono-drawer-header-border: var(--mono-drawer-header-border, transparent);\r\n  --_mono-drawer-footer-border: var(--mono-drawer-footer-border, transparent);\r\n  --_mono-drawer-header-border-width: var(--mono-drawer-header-border-width, 0);\r\n  --_mono-drawer-footer-border-width: var(--mono-drawer-footer-border-width, 0);\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE ────────────────────\r\n     basecoat@1.0.2 styles/vega.css .drawer > * > header — gap-0.5 p-4 (md:gap-1.5)\r\n     basecoat@1.0.2 styles/vega.css .drawer > * > footer — gap-2 p-4 */\r\n  --_mono-drawer-radius: var(--mono-drawer-radius, var(--_mono-drawer-radius-preset, var(--mono-drawer-radius-md, var(--mono-radius-xl))));\r\n  --_mono-drawer-pad: var(--mono-drawer-pad, var(--_mono-drawer-pad-preset, var(--mono-drawer-pad-md, calc(var(--mono-spacing) * 4))));\r\n  --_mono-drawer-header-gap: var(--mono-drawer-header-gap, var(--_mono-drawer-header-gap-preset, var(--mono-drawer-header-gap-md, calc(var(--mono-spacing) * 1.5))));\r\n  --_mono-drawer-footer-gap: var(--mono-drawer-footer-gap, var(--_mono-drawer-footer-gap-preset, var(--mono-drawer-footer-gap-md, calc(var(--mono-spacing) * 2))));\r\n  --_mono-drawer-font: var(--mono-drawer-font, var(--_mono-drawer-font-preset, var(--mono-drawer-body-font-md, var(--mono-text-sm))));\r\n  --_mono-drawer-body-line-height: var(--mono-drawer-body-line-height, var(--_mono-drawer-body-line-height-preset, var(--mono-text-sm--lh)));\r\n  /* `text-lg font-semibold leading-none tracking-tight` — the drawer's title is\r\n     the loud one; the dialog's is `font-medium` at the panel's own size. */\r\n  --_mono-drawer-title-font: var(--mono-drawer-title-font, var(--_mono-drawer-title-font-preset, var(--mono-drawer-title-font-md, var(--mono-text-lg))));\r\n  --_mono-drawer-title-weight: var(--mono-drawer-title-weight, var(--mono-font-weight-semibold));\r\n  --_mono-drawer-title-tracking: var(--mono-drawer-title-tracking, -0.015em);\r\n  --_mono-drawer-title-line-height: var(--mono-drawer-title-line-height, var(--mono-leading-none, 1));\r\n  --_mono-drawer-title-transform: var(--mono-drawer-title-transform, none);\r\n  --_mono-drawer-title-color: var(--mono-drawer-title-color, var(--_mono-drawer-text));\r\n  /* the description line — `text-muted-foreground text-sm`; the font follows the\r\n     drawer's per-size body step, which is `text-sm` at md */\r\n  --_mono-drawer-subtitle-font: var(--mono-drawer-subtitle-font, var(--_mono-drawer-font));\r\n  --_mono-drawer-subtitle-color: var(--mono-drawer-subtitle-color, var(--muted-foreground));\r\n\r\n  /* ── the close ✕ — EXTENSION, styled like the dialog's ─────────────────── */\r\n  --_mono-drawer-close-size: var(--mono-drawer-close-size, var(--_mono-drawer-close-size-preset, var(--mono-drawer-close-size-md, calc(var(--mono-spacing) * 7))));\r\n  --_mono-drawer-close-glyph: var(--mono-drawer-close-glyph, var(--_mono-drawer-icon-size-preset, calc(var(--mono-spacing) * 4)));\r\n  --_mono-drawer-close-radius: var(--mono-drawer-close-radius, var(--mono-radius-sm));\r\n  --_mono-drawer-close-bg: var(--mono-drawer-close-bg, transparent);\r\n  --_mono-drawer-close-color: var(--mono-drawer-close-color, var(--_mono-drawer-text));\r\n  --_mono-drawer-close-opacity: var(--mono-drawer-close-opacity, 0.7);\r\n  --_mono-drawer-close-hover-opacity: var(--mono-drawer-close-hover-opacity, 1);\r\n  --_mono-drawer-close-hover-bg: var(--mono-drawer-close-hover-bg, transparent);\r\n\r\n  /* ── the backdrop — `bg-black/10 backdrop-blur-xs` ─────────────────────── */\r\n  --_mono-drawer-overlay-bg: var(--mono-drawer-overlay-bg, var(--mono-mode-backdrop));\r\n  --_mono-drawer-overlay-backdrop-filter: var(--mono-drawer-overlay-backdrop-filter, blur(var(--mono-blur-xs)));\r\n\r\n  --_mono-drawer-z: var(--mono-drawer-z, 9990);\r\n\r\n  /* `w-3/4 max-w-sm` on the side drawers; `max-h-[80vh]` with a content height on\r\n     the sheet ones. Both are PROPS here (`width` / `height`), so these are the\r\n     defaults they override. */\r\n  --_mono-drawer-width: var(--mono-drawer-width, min(75%, var(--mono-container-sm)));\r\n  --_mono-drawer-height: var(--mono-drawer-height, auto);\r\n  --_mono-drawer-max-height: var(--mono-drawer-max-height, 80vh);\r\n\r\n  /* ── the slide — `duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]` ────────\r\n     Open/close animation duration. One source of truth for the panel's slide AND\r\n     the delayed `visibility` / `content-visibility` flips, which have to stay in\r\n     lockstep with it. Set `--mono-drawer-duration: 0s` for an instant,\r\n     animation-free drawer — worth doing when the drawer body holds a lot of\r\n     components, since that is what the open/close frames have to re-measure. */\r\n  --_mono-drawer-duration: var(--mono-drawer-duration, 500ms);\r\n  --_mono-drawer-ease: var(--mono-drawer-ease, cubic-bezier(0.32, 0.72, 0, 1));\r\n  /* The overlay follows the panel unless it is given its own. */\r\n  --_mono-drawer-overlay-duration: var(--mono-drawer-duration, 500ms);\r\n\r\n  font-family: inherit;\r\n  color: var(--_mono-drawer-text);\r\n}\r\n\r\n[mono-drawer],\r\n:where([mono-drawer]) *,\r\n:where([mono-drawer]) *::before,\r\n:where([mono-drawer]) *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: `size` is the CONTENT scale, never the measure\r\n   ========================================= */\r\n\r\n[mono-drawer][mono-size=\"xs\"] {\r\n  --_mono-drawer-radius-preset: var(--mono-drawer-radius-xs, var(--mono-radius-md));\r\n  --_mono-drawer-pad-preset: var(--mono-drawer-pad-xs, calc(var(--mono-spacing) * 2));\r\n  --_mono-drawer-header-gap-preset: var(--mono-drawer-header-gap-xs, calc(var(--mono-spacing) * 0.5));\r\n  --_mono-drawer-footer-gap-preset: var(--mono-drawer-footer-gap-xs, var(--mono-spacing));\r\n  --_mono-drawer-font-preset: var(--mono-drawer-body-font-xs, var(--mono-text-xs));\r\n  --_mono-drawer-body-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-drawer-title-font-preset: var(--mono-drawer-title-font-xs, var(--mono-text-sm));\r\n  --_mono-drawer-close-size-preset: var(--mono-drawer-close-size-xs, calc(var(--mono-spacing) * 5));\r\n  --_mono-drawer-icon-size-preset: calc(var(--mono-spacing) * 3);\r\n}\r\n\r\n[mono-drawer][mono-size=\"sm\"] {\r\n  --_mono-drawer-radius-preset: var(--mono-drawer-radius-sm, var(--mono-radius-lg));\r\n  --_mono-drawer-pad-preset: var(--mono-drawer-pad-sm, calc(var(--mono-spacing) * 3));\r\n  --_mono-drawer-header-gap-preset: var(--mono-drawer-header-gap-sm, var(--mono-spacing));\r\n  --_mono-drawer-footer-gap-preset: var(--mono-drawer-footer-gap-sm, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-drawer-font-preset: var(--mono-drawer-body-font-sm, var(--mono-text-xs));\r\n  --_mono-drawer-body-line-height-preset: var(--mono-text-xs--lh);\r\n  --_mono-drawer-title-font-preset: var(--mono-drawer-title-font-sm, var(--mono-text-base));\r\n  --_mono-drawer-close-size-preset: var(--mono-drawer-close-size-sm, calc(var(--mono-spacing) * 6));\r\n  --_mono-drawer-icon-size-preset: calc(var(--mono-spacing) * 3.5);\r\n}\r\n\r\n[mono-drawer][mono-size=\"lg\"] {\r\n  --_mono-drawer-radius-preset: var(--mono-drawer-radius-lg, var(--mono-radius-2xl));\r\n  --_mono-drawer-pad-preset: var(--mono-drawer-pad-lg, calc(var(--mono-spacing) * 5));\r\n  --_mono-drawer-header-gap-preset: var(--mono-drawer-header-gap-lg, calc(var(--mono-spacing) * 2));\r\n  --_mono-drawer-footer-gap-preset: var(--mono-drawer-footer-gap-lg, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-drawer-font-preset: var(--mono-drawer-body-font-lg, var(--mono-text-base));\r\n  --_mono-drawer-body-line-height-preset: var(--mono-text-base--lh);\r\n  --_mono-drawer-title-font-preset: var(--mono-drawer-title-font-lg, var(--mono-text-xl));\r\n  --_mono-drawer-close-size-preset: var(--mono-drawer-close-size-lg, calc(var(--mono-spacing) * 8));\r\n  --_mono-drawer-icon-size-preset: calc(var(--mono-spacing) * 4.5);\r\n}\r\n\r\n[mono-drawer][mono-size=\"xl\"] {\r\n  --_mono-drawer-radius-preset: var(--mono-drawer-radius-xl, var(--mono-radius-2xl));\r\n  --_mono-drawer-pad-preset: var(--mono-drawer-pad-xl, calc(var(--mono-spacing) * 6));\r\n  --_mono-drawer-header-gap-preset: var(--mono-drawer-header-gap-xl, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-drawer-footer-gap-preset: var(--mono-drawer-footer-gap-xl, calc(var(--mono-spacing) * 3));\r\n  --_mono-drawer-font-preset: var(--mono-drawer-body-font-xl, var(--mono-text-lg));\r\n  --_mono-drawer-body-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-drawer-title-font-preset: var(--mono-drawer-title-font-xl, var(--mono-text-2xl, 1.5rem));\r\n  --_mono-drawer-close-size-preset: var(--mono-drawer-close-size-xl, calc(var(--mono-spacing) * 9));\r\n  --_mono-drawer-icon-size-preset: calc(var(--mono-spacing) * 5);\r\n}\r\n\r\n[mono-drawer][mono-size=\"xxl\"] {\r\n  --_mono-drawer-radius-preset: var(--mono-drawer-radius-xxl, var(--mono-radius-4xl));\r\n  --_mono-drawer-pad-preset: var(--mono-drawer-pad-xxl, calc(var(--mono-spacing) * 7));\r\n  --_mono-drawer-header-gap-preset: var(--mono-drawer-header-gap-xxl, calc(var(--mono-spacing) * 3));\r\n  --_mono-drawer-footer-gap-preset: var(--mono-drawer-footer-gap-xxl, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-drawer-font-preset: var(--mono-drawer-body-font-xxl, var(--mono-text-lg));\r\n  --_mono-drawer-body-line-height-preset: var(--mono-text-lg--lh);\r\n  --_mono-drawer-title-font-preset: var(--mono-drawer-title-font-xxl, 1.75rem);\r\n  --_mono-drawer-close-size-preset: var(--mono-drawer-close-size-xxl, calc(var(--mono-spacing) * 10));\r\n  --_mono-drawer-icon-size-preset: calc(var(--mono-spacing) * 5.5);\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the role tints the resizer and whatever the consumer\r\n   turns back on (the head bar, the close hover)\r\n   ========================================= */\r\n\r\n[mono-drawer][mono-color=\"primary\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-primary); }\r\n[mono-drawer][mono-color=\"secondary\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-secondary); }\r\n[mono-drawer][mono-color=\"success\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-success); }\r\n[mono-drawer][mono-color=\"danger\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-danger); }\r\n[mono-drawer][mono-color=\"warning\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-warning); }\r\n[mono-drawer][mono-color=\"info\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-info); }\r\n[mono-drawer][mono-color=\"teal\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-teal); }\r\n[mono-drawer][mono-color=\"purple\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-purple); }\r\n[mono-drawer][mono-color=\"neutral\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-neutral); }\r\n[mono-drawer][mono-color=\"dark\"] { --_mono-drawer-accent-preset: var(--_mono-drawer-dark); }\r\n\r\n/* An explicit `color` shows on the panel itself: its edge (the one border in\r\n   vega, the whole inset card in maia / mira / luma / rhea) becomes a thin line\r\n   of the accent and a faint halo of it sits under the elevation. Without\r\n   `color` the edge stays `--border` and there is no halo. A consumer's\r\n   `--mono-drawer-border` / `--mono-drawer-glow` still win. */\r\n[mono-drawer][mono-color] {\r\n  --_mono-drawer-border: var(--mono-drawer-border, var(--mono-drawer-accent-border, color-mix(in oklab, var(--_mono-drawer-accent) 35%, var(--border))));\r\n  --_mono-drawer-glow: var(--mono-drawer-glow, 0 0 24px -4px color-mix(in oklab, var(--_mono-drawer-accent) 45%, transparent));\r\n}\r\n\r\n/* =========================================\r\n   Overlay — `::backdrop`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .drawer::backdrop — bg-black/10 backdrop-blur-xs.\r\n   A real `::backdrop` cannot be reached from a shadow sheet and cannot stack with\r\n   this component's own layer manager, so it is an element. */\r\n:where([mono-drawer]) > [mono-overlay] {\r\n  /* Sized in VIEWPORT units, not `inset: 0`. `inset`/`100%` resolve against the\r\n     initial containing block, which a horizontally-overflowing page inflates under\r\n     mobile emulation (measured: 481x1041 on a 390x844 screen), so the scrim\r\n     overshot the screen. `dvh`/`dvw` also track mobile browser chrome; the plain\r\n     `v*` line above each is the pre-2022 fallback. */\r\n  position: fixed;\r\n  top: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  width: 100dvw;\r\n  height: 100vh;\r\n  height: 100dvh;\r\n  z-index: var(--_mono-drawer-z);\r\n  background: var(--_mono-drawer-overlay-bg);\r\n  opacity: 0;\r\n  pointer-events: none;\r\n  cursor: pointer;\r\n\r\n  /* The blur is applied only while open, and its removal is DELAYED by the fade\r\n     so the backdrop does not snap sharp while the scrim is still going. */\r\n  backdrop-filter: none;\r\n  -webkit-backdrop-filter: none;\r\n  transition:\r\n    opacity var(--_mono-drawer-overlay-duration) var(--_mono-drawer-ease),\r\n    backdrop-filter 0s linear var(--_mono-drawer-overlay-duration),\r\n    -webkit-backdrop-filter 0s linear var(--_mono-drawer-overlay-duration);\r\n}\r\n\r\n[mono-drawer][mono-open] > [mono-overlay] {\r\n  opacity: 1;\r\n  pointer-events: auto;\r\n  backdrop-filter: var(--_mono-drawer-overlay-backdrop-filter);\r\n  -webkit-backdrop-filter: var(--_mono-drawer-overlay-backdrop-filter);\r\n  transition:\r\n    opacity var(--_mono-drawer-overlay-duration) var(--_mono-drawer-ease),\r\n    backdrop-filter 0s linear 0s,\r\n    -webkit-backdrop-filter 0s linear 0s;\r\n}\r\n\r\n[mono-drawer][mono-no-overlay] > [mono-overlay] {\r\n  display: none;\r\n}\r\n\r\n/* Stacked drawers: when another drawer or modal WITH an overlay is open above\r\n   this one, hide this backdrop so dim layers don't compound — the topmost\r\n   overlay alone dims everything beneath it. An `overlay=\"false\"` dialog above\r\n   does not count, so this one keeps dimming the page. */\r\n[mono-drawer][mono-open][mono-has-drawer-above] > [mono-overlay] {\r\n  opacity: 0;\r\n}\r\n\r\n/* =========================================\r\n   Panel — `.drawer > *`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> > * — fixed z-50 flex h-auto\r\n   flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]\r\n   will-change-transform outline-hidden */\r\n/* basecoat@1.0.2 styles/vega.css .drawer > * — bg-popover text-popover-foreground text-sm */\r\n:where([mono-drawer]) > [mono-panel] {\r\n  position: fixed;\r\n  z-index: calc(var(--_mono-drawer-z) + 1);\r\n  display: flex;\r\n  flex-direction: column;\r\n  padding: var(--_mono-drawer-panel-pad);\r\n  color: var(--_mono-drawer-text);\r\n  font-size: var(--_mono-drawer-font);\r\n  outline: none;\r\n  pointer-events: auto;\r\n  will-change: transform;\r\n\r\n  /* Closed state: invisible (hides the shadow halo too) until the slide-in\r\n     begins. On close the visibility flip is delayed by the transform duration so\r\n     the slide-out animation plays first. */\r\n  visibility: hidden;\r\n  transition:\r\n    transform var(--_mono-drawer-duration) var(--_mono-drawer-ease),\r\n    visibility 0s linear var(--_mono-drawer-duration);\r\n}\r\n\r\n/* The panel's PAINT is a layer, not the panel's own box: maia, mira, luma and\r\n   rhea float the drawer as a card inset from the viewport edge\r\n   (`before:inset-2 before:rounded-4xl before:border`) over a transparent panel.\r\n   At `--mono-drawer-inset: 0` the layer is exactly the panel, which is vega. */\r\n[mono-drawer] > [mono-panel]::before {\r\n  content: '';\r\n  position: absolute;\r\n  inset: var(--_mono-drawer-inset);\r\n  z-index: -1;\r\n  background: var(--_mono-drawer-bg);\r\n  /* `inherit` picks up the panel's per-corner radii, which is the vega card.\r\n     A flavor that INSETS the layer rounds all four corners instead, so it sets\r\n     the radius outright. */\r\n  border-radius: var(--mono-drawer-inset-radius, inherit);\r\n  border: var(--_mono-drawer-inset-border-width) solid var(--_mono-drawer-border);\r\n  box-shadow: var(--_mono-drawer-glow), var(--_mono-drawer-shadow);\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-drawer][mono-open] > [mono-panel] {\r\n  visibility: visible;\r\n  transition:\r\n    transform var(--_mono-drawer-duration) var(--_mono-drawer-ease),\r\n    visibility 0s linear 0s;\r\n}\r\n\r\n/* =========================================\r\n   Positions — `[data-side]`\r\n   -----------------------------------------------------------------------------\r\n   Each side fixes the two insets it spans, takes its measure from the axis it\r\n   grows on, and rounds + borders the ONE edge that faces the content.\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> &[data-side='right'] > *\r\n   — inset-y-0 right-0 w-3/4 max-w-sm translate-x-full */\r\n/* basecoat@1.0.2 styles/vega.css .drawer[data-side='right'] > * — rounded-l-xl border-l\r\n   DEVIATION: `right` is this component's DEFAULT side, where upstream's is\r\n   `bottom`, so the unqualified root is this one. */\r\n[mono-drawer]:is(:not([mono-position]), [mono-position=\"right\"]) > [mono-panel] {\r\n  top: 0;\r\n  right: 0;\r\n  height: 100vh;\r\n  height: 100dvh;\r\n  width: var(--_mono-drawer-width);\r\n  max-width: 100vw;\r\n  max-width: 100dvw;\r\n  transform: translateX(100%);\r\n  border-start-start-radius: var(--_mono-drawer-radius);\r\n  border-end-start-radius: var(--_mono-drawer-radius);\r\n}\r\n\r\n[mono-drawer]:is(:not([mono-position]), [mono-position=\"right\"]) > [mono-panel]::before {\r\n  border-left-width: var(--_mono-drawer-border-width);\r\n}\r\n\r\n[mono-drawer][mono-open]:is(:not([mono-position]), [mono-position=\"right\"]) > [mono-panel] {\r\n  transform: translateX(0);\r\n}\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> &[data-side='left'] > *\r\n   — inset-y-0 left-0 w-3/4 max-w-sm -translate-x-full */\r\n/* basecoat@1.0.2 styles/vega.css .drawer[data-side='left'] > * — rounded-r-xl border-r */\r\n[mono-drawer][mono-position=\"left\"] > [mono-panel] {\r\n  top: 0;\r\n  left: 0;\r\n  height: 100vh;\r\n  height: 100dvh;\r\n  width: var(--_mono-drawer-width);\r\n  max-width: 100vw;\r\n  max-width: 100dvw;\r\n  transform: translateX(-100%);\r\n  border-start-end-radius: var(--_mono-drawer-radius);\r\n  border-end-end-radius: var(--_mono-drawer-radius);\r\n}\r\n\r\n[mono-drawer][mono-position=\"left\"] > [mono-panel]::before {\r\n  border-right-width: var(--_mono-drawer-border-width);\r\n}\r\n\r\n[mono-drawer][mono-open][mono-position=\"left\"] > [mono-panel] {\r\n  transform: translateX(0);\r\n}\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> &[data-side='top'] > *\r\n   — inset-x-0 top-0 mb-24 max-h-[80vh] -translate-y-full */\r\n/* basecoat@1.0.2 styles/vega.css .drawer[data-side='top'] > * — rounded-b-xl border-b */\r\n[mono-drawer][mono-position=\"top\"] > [mono-panel] {\r\n  top: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  width: 100dvw;\r\n  height: var(--_mono-drawer-height);\r\n  max-height: var(--_mono-drawer-max-height);\r\n  transform: translateY(-100%);\r\n  border-end-start-radius: var(--_mono-drawer-radius);\r\n  border-end-end-radius: var(--_mono-drawer-radius);\r\n}\r\n\r\n[mono-drawer][mono-position=\"top\"] > [mono-panel]::before {\r\n  border-bottom-width: var(--_mono-drawer-border-width);\r\n}\r\n\r\n[mono-drawer][mono-open][mono-position=\"top\"] > [mono-panel] {\r\n  transform: translateY(0);\r\n}\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> &:not([data-side]) > *, &[data-side='bottom'] > *\r\n   — inset-x-0 bottom-0 mt-24 max-h-[80vh] translate-y-full */\r\n/* basecoat@1.0.2 styles/vega.css .drawer:not([data-side]) > *, .drawer[data-side='bottom'] > *\r\n   — rounded-t-xl border-t */\r\n[mono-drawer][mono-position=\"bottom\"] > [mono-panel] {\r\n  bottom: 0;\r\n  left: 0;\r\n  width: 100vw;\r\n  width: 100dvw;\r\n  height: var(--_mono-drawer-height);\r\n  max-height: var(--_mono-drawer-max-height);\r\n  transform: translateY(100%);\r\n  border-start-start-radius: var(--_mono-drawer-radius);\r\n  border-start-end-radius: var(--_mono-drawer-radius);\r\n}\r\n\r\n[mono-drawer][mono-position=\"bottom\"] > [mono-panel]::before {\r\n  border-top-width: var(--_mono-drawer-border-width);\r\n}\r\n\r\n[mono-drawer][mono-open][mono-position=\"bottom\"] > [mono-panel] {\r\n  transform: translateY(0);\r\n}\r\n\r\n/* =========================================\r\n   Resizer — EXTENSION: a grab bar on the panel's inner edge\r\n   ========================================= */\r\n\r\n:where([mono-drawer] > [mono-panel]) > [mono-resizer] {\r\n  position: absolute;\r\n  z-index: 2;\r\n  touch-action: none;\r\n  background: transparent;\r\n  transition: background-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n[mono-drawer] > [mono-panel] > [mono-resizer]:hover,\r\n[mono-drawer][mono-resizing] > [mono-panel] > [mono-resizer] {\r\n  background: color-mix(in oklab, var(--_mono-drawer-accent) 30%, transparent);\r\n}\r\n\r\n[mono-drawer]:is(:not([mono-position]), [mono-position=\"right\"]) > [mono-panel] > [mono-resizer] {\r\n  top: 0;\r\n  bottom: 0;\r\n  left: 0;\r\n  width: 6px;\r\n  cursor: ew-resize;\r\n}\r\n\r\n[mono-drawer][mono-position=\"left\"] > [mono-panel] > [mono-resizer] {\r\n  top: 0;\r\n  bottom: 0;\r\n  right: 0;\r\n  width: 6px;\r\n  cursor: ew-resize;\r\n}\r\n\r\n[mono-drawer][mono-position=\"top\"] > [mono-panel] > [mono-resizer] {\r\n  left: 0;\r\n  right: 0;\r\n  bottom: 0;\r\n  height: 6px;\r\n  cursor: ns-resize;\r\n}\r\n\r\n[mono-drawer][mono-position=\"bottom\"] > [mono-panel] > [mono-resizer] {\r\n  left: 0;\r\n  right: 0;\r\n  top: 0;\r\n  height: 6px;\r\n  cursor: ns-resize;\r\n}\r\n\r\n/* No lag while dragging the handle. */\r\n[mono-drawer][mono-resizing] > [mono-panel] {\r\n  transition: none;\r\n}\r\n\r\n[mono-drawer][mono-resizing] {\r\n  user-select: none;\r\n}\r\n\r\n/* =========================================\r\n   Header — `> header`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> > * > header — flex flex-col */\r\n/* basecoat@1.0.2 styles/vega.css .drawer > * > header — gap-0.5 p-4 text-start\r\n   DEVIATIONS: a ROW, because the ✕ lives inside it (upstream's drawer has no\r\n   close button and its header is a column of title + description); and NOT\r\n   centred on the top / bottom sides for the same reason — a centred title beside\r\n   a trailing ✕ reads as a mistake. */\r\n:where([mono-drawer] > [mono-panel]) > [mono-header] {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: var(--_mono-drawer-header-gap);\r\n  flex-shrink: 0;\r\n  padding: var(--_mono-drawer-pad);\r\n  text-align: start;\r\n  border-bottom: var(--_mono-drawer-header-border-width) solid var(--_mono-drawer-header-border);\r\n  background: var(--_mono-drawer-header-bg);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .drawer > * > header > h2, .drawer > * > [data-title]\r\n   — text-lg font-semibold leading-none tracking-tight */\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> > * > header — flex flex-col\r\n   (+ vega's gap-0.5 md:gap-1.5): the title / subtitle column beside the ✕. */\r\n:where([mono-drawer] > [mono-panel] > [mono-header]) > [mono-heading] {\r\n  flex: 1;\r\n  min-width: 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--mono-drawer-heading-gap, var(--_mono-drawer-header-gap));\r\n}\r\n\r\n:where([mono-drawer] > [mono-panel] > [mono-header]) [mono-title] {\r\n  min-width: 0;\r\n  font-size: var(--_mono-drawer-title-font);\r\n  font-weight: var(--_mono-drawer-title-weight);\r\n  line-height: var(--_mono-drawer-title-line-height);\r\n  letter-spacing: var(--_mono-drawer-title-tracking);\r\n  text-transform: var(--_mono-drawer-title-transform);\r\n  color: var(--_mono-drawer-title-color);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .drawer > * > header > p, .drawer > * > [data-description]\r\n   — text-muted-foreground text-sm */\r\n:where([mono-drawer] > [mono-panel] > [mono-header]) [mono-subtitle] {\r\n  min-width: 0;\r\n  font-size: var(--_mono-drawer-subtitle-font);\r\n  line-height: var(--mono-drawer-subtitle-line-height, var(--mono-leading-normal));\r\n  color: var(--_mono-drawer-subtitle-color);\r\n}\r\n\r\n/* Empty regions. The light build omits them; the shadow build always renders\r\n   them (its native `<slot>`s must exist to be scanned) and marks them\r\n   [mono-empty]. The heading parts are matched as descendants because the shadow\r\n   build nests them inside the `header` slot's fallback. */\r\n:where([mono-drawer] > [mono-panel]) > :is([mono-header], [mono-footer])[mono-empty],\r\n:where([mono-drawer] > [mono-panel] > [mono-header]) > [mono-heading][mono-empty],\r\n:where([mono-drawer] > [mono-panel] > [mono-header] > [mono-heading]) :is([mono-title], [mono-subtitle])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Close — EXTENSION, styled like the dialog's\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/dialog.css .dialog >> > * > :is(button, form[method='dialog'] > button)\r\n   — inline-flex items-center justify-center opacity-70 transition-opacity\r\n   hover:opacity-100. Upstream's DRAWER has no close button at all; borrowing the\r\n   dialog's keeps the two consistent. */\r\n:where([mono-drawer] > [mono-panel] > [mono-header]) [mono-close] {\r\n  flex-shrink: 0;\r\n  /* stays at the end even when the heading column is empty (hidden) */\r\n  margin-inline-start: auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-drawer-close-size);\r\n  height: var(--_mono-drawer-close-size);\r\n  padding: 0;\r\n  border: none;\r\n  border-radius: var(--_mono-drawer-close-radius);\r\n  background: var(--_mono-drawer-close-bg);\r\n  color: var(--_mono-drawer-close-color);\r\n  opacity: var(--_mono-drawer-close-opacity);\r\n  cursor: pointer;\r\n  appearance: none;\r\n  transition:\r\n    opacity var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-drawer] [mono-close]:hover {\r\n    opacity: var(--_mono-drawer-close-hover-opacity);\r\n    background: var(--_mono-drawer-close-hover-bg);\r\n  }\r\n}\r\n\r\n[mono-drawer] [mono-close]:focus-visible {\r\n  outline: none;\r\n  box-shadow: 0 0 0 var(--mono-ring-width)\r\n    color-mix(in oklab, var(--ring) var(--mono-ring-alpha), transparent);\r\n}\r\n\r\n[mono-drawer] [mono-close] > :is(svg, span) {\r\n  display: block;\r\n  width: var(--_mono-drawer-close-glyph);\r\n  height: var(--_mono-drawer-close-glyph);\r\n}\r\n\r\n/* =========================================\r\n   Body — `> section`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> > * > section\r\n   — min-h-0 flex-1 overflow-y-auto\r\n   DEVIATION: padded. Upstream leaves the section bare and pads the content it\r\n   puts inside; here the body is a SLOT a consumer fills with plain text, so it\r\n   brings the same `p-4` the header and footer use. `--mono-drawer-body-pad: 0`\r\n   gives upstream's bare section back. */\r\n:where([mono-drawer] > [mono-panel]) > [mono-body] {\r\n  flex: 1;\r\n  min-height: 0;\r\n  overflow-y: auto;\r\n  padding: var(--mono-drawer-body-pad, var(--_mono-drawer-pad));\r\n  font-size: var(--_mono-drawer-font);\r\n  line-height: var(--_mono-drawer-body-line-height);\r\n}\r\n\r\n/* =========================================\r\n   Footer — `> footer`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/drawer.css .drawer >> > * > footer — mt-auto flex flex-col */\r\n/* basecoat@1.0.2 styles/vega.css .alert-dialog > * > footer, .dialog > * > footer — gap-2\r\n   basecoat@1.0.2 styles/vega.css .drawer > * > footer — gap-2 p-4\r\n   The COLUMN is upstream's: a drawer footer is the mobile-sheet idiom, where the\r\n   actions are full-width and stacked. `--mono-drawer-footer-direction: row`\r\n   restores the pre-port right-aligned row, and ONE sets it. */\r\n:where([mono-drawer] > [mono-panel]) > [mono-footer] {\r\n  display: flex;\r\n  flex-direction: var(--mono-drawer-footer-direction, column);\r\n  align-items: var(--mono-drawer-footer-align, stretch);\r\n  justify-content: var(--mono-drawer-footer-justify, flex-start);\r\n  gap: var(--_mono-drawer-footer-gap);\r\n  margin-top: auto;\r\n  flex-shrink: 0;\r\n  padding: var(--_mono-drawer-pad);\r\n  border-top: var(--_mono-drawer-footer-border-width) solid var(--_mono-drawer-footer-border);\r\n  background: var(--_mono-drawer-footer-bg);\r\n}\r\n\r\n/* The light build re-appends slotted nodes into a `[data-mono-slot]` outlet.\r\n   Left inline, that outlet is ONE flex child, so the footer's gap and\r\n   justification apply to IT rather than to the buttons inside it — while the\r\n   shadow build's `<slot>` is `display: contents` per the UA sheet and the\r\n   hand-written markup has no wrapper at all. Dissolving the outlet is what\r\n   makes the three agree, and it is what a consumer writing\r\n   `<button slot=\"footer\">` twice expects. */\r\n:where([mono-drawer] > [mono-panel] > [mono-footer]) > [data-mono-slot] {\r\n  display: contents;\r\n}\r\n\r\n/* =========================================\r\n   Closed\r\n   ========================================= */\r\n\r\n[mono-drawer]:not([mono-open]) {\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-drawer]:not([mono-open]) > [mono-overlay] {\r\n  opacity: 0;\r\n  pointer-events: none;\r\n}\r\n\r\n/* A closed drawer is hidden with `visibility: hidden`, which skips PAINT but not\r\n   LAYOUT — so the panel and everything slotted into it kept generating boxes and\r\n   being measured even for a drawer the user never opened.\r\n   `content-visibility: hidden` drops the closed subtree entirely.\r\n\r\n   Measured alongside the modal (Chromium, ~400-node panels, 10 modal+drawer pairs):\r\n   layout objects 12281 → 81, mount layout+style 94.6ms → 14.9ms and flat in the\r\n   count. One open+close costs slightly more in exchange, since an opening panel is\r\n   laid out from scratch; `--mono-drawer-duration: 0s` removes that if it matters.\r\n\r\n   `allow-discrete` is what makes it safe to animate: opening flips the property to\r\n   `visible` at 0% so the slide-in has something to composite; closing holds it\r\n   `visible` until 100% so the panel slides out instead of vanishing on frame one.\r\n\r\n   Gated behind @supports deliberately — `content-visibility … allow-discrete` in the\r\n   `transition` SHORTHAND is a parse error without the feature, and one bad entry\r\n   drops the WHOLE declaration, which would take the slide with it. Inside the guard\r\n   the shorthand is known to parse, so the list is restated in full. Browsers without\r\n   support keep exactly the previous behaviour.\r\n\r\n   Safe for every position: the side drawers fix `top`/`bottom` and take an explicit\r\n   `width`, the sheet ones fix `left`/`right` and cap their height, so size\r\n   containment has no content-driven dimension to collapse while closed.\r\n\r\n   Must stay ABOVE the reduced-motion block below — @supports adds no specificity, so\r\n   source order is what keeps `transition: none` the winner there. */\r\n@supports (transition-behavior: allow-discrete) {\r\n  :where([mono-drawer]) > [mono-panel] {\r\n    content-visibility: hidden;\r\n    contain-intrinsic-size: 0;\r\n    transition:\r\n      transform var(--_mono-drawer-duration) var(--_mono-drawer-ease),\r\n      visibility 0s linear var(--_mono-drawer-duration),\r\n      content-visibility var(--_mono-drawer-duration) allow-discrete;\r\n  }\r\n\r\n  [mono-drawer][mono-open] > [mono-panel] {\r\n    content-visibility: visible;\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-drawer] > [mono-panel],\r\n  [mono-drawer] > [mono-overlay] {\r\n    transition: none;\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Auto full-screen (`auto-fullscreen` prop)\r\n   =========================================\r\n\r\n   Fill the screen at a Tailwind breakpoint and below, keeping the drawer's\r\n   `position` — a `right` drawer still slides in from the right, it just covers the\r\n   viewport. Boundaries are `<breakpoint> - 0.02px` to match Tailwind's `max-*`\r\n   variants (at exactly 640px `sm:` applies, so auto-fullscreen must not).\r\n\r\n   No `!important` needed, unlike modal.css: drawer sizing arrives as the\r\n   `--mono-drawer-*` custom properties on the ROOT, while the panel's\r\n   `width`/`height` come from the position rules above — (0,2,1) selectors that\r\n   these, at (0,2,1) and declared AFTER, beat on order. Keep this section last.\r\n*/\r\n\r\n@media (max-width: 639.98px) {\r\n  [mono-drawer][mono-auto-fullscreen=\"sm\"] > [mono-panel] {\r\n    width: 100vw;\r\n    width: 100dvw;\r\n    height: 100vh;\r\n    height: 100dvh;\r\n    max-width: none;\r\n    max-height: none;\r\n    border-radius: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"sm\"] > [mono-panel]::before {\r\n    border-width: 0;\r\n    inset: 0;\r\n  }\r\n\r\n  /* Load-bearing, not cosmetic: the rules above outrank the `--mono-drawer-width`\r\n     the resizer writes, so a drag here moves nothing visible YET still records a\r\n     width — and the drawer would snap to it the moment the viewport grew back past\r\n     the breakpoint. Hiding the handle removes the pointer target so no such drag\r\n     can begin (`_onResizeStart` also guards, as belt-and-braces). */\r\n  [mono-drawer][mono-auto-fullscreen=\"sm\"] > [mono-panel] > [mono-resizer] {\r\n    display: none;\r\n  }\r\n}\r\n\r\n@media (max-width: 767.98px) {\r\n  [mono-drawer][mono-auto-fullscreen=\"md\"] > [mono-panel] {\r\n    width: 100vw;\r\n    width: 100dvw;\r\n    height: 100vh;\r\n    height: 100dvh;\r\n    max-width: none;\r\n    max-height: none;\r\n    border-radius: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"md\"] > [mono-panel]::before {\r\n    border-width: 0;\r\n    inset: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"md\"] > [mono-panel] > [mono-resizer] {\r\n    display: none;\r\n  }\r\n}\r\n\r\n@media (max-width: 1023.98px) {\r\n  [mono-drawer][mono-auto-fullscreen=\"lg\"] > [mono-panel] {\r\n    width: 100vw;\r\n    width: 100dvw;\r\n    height: 100vh;\r\n    height: 100dvh;\r\n    max-width: none;\r\n    max-height: none;\r\n    border-radius: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"lg\"] > [mono-panel]::before {\r\n    border-width: 0;\r\n    inset: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"lg\"] > [mono-panel] > [mono-resizer] {\r\n    display: none;\r\n  }\r\n}\r\n\r\n@media (max-width: 1279.98px) {\r\n  [mono-drawer][mono-auto-fullscreen=\"xl\"] > [mono-panel] {\r\n    width: 100vw;\r\n    width: 100dvw;\r\n    height: 100vh;\r\n    height: 100dvh;\r\n    max-width: none;\r\n    max-height: none;\r\n    border-radius: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"xl\"] > [mono-panel]::before {\r\n    border-width: 0;\r\n    inset: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"xl\"] > [mono-panel] > [mono-resizer] {\r\n    display: none;\r\n  }\r\n}\r\n\r\n@media (max-width: 1535.98px) {\r\n  [mono-drawer][mono-auto-fullscreen=\"2xl\"] > [mono-panel] {\r\n    width: 100vw;\r\n    width: 100dvw;\r\n    height: 100vh;\r\n    height: 100dvh;\r\n    max-width: none;\r\n    max-height: none;\r\n    border-radius: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"2xl\"] > [mono-panel]::before {\r\n    border-width: 0;\r\n    inset: 0;\r\n  }\r\n\r\n  [mono-drawer][mono-auto-fullscreen=\"2xl\"] > [mono-panel] > [mono-resizer] {\r\n    display: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/drawer/mono-drawer.shadow.ts
var MonoDrawerShadow = class MonoDrawerShadow extends withShadowUtilityStyles(MonoDrawerCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(drawer_default, { host: "mono-drawer" }))];
	}
	get _slotsAlwaysRender() {
		return true;
	}
	/** Shadow build: the size-vars live on the inner `.mono-drawer` root. */
	_setDrawerSizeVar(name, value) {
		this.renderRoot.querySelector(".mono-drawer")?.style.setProperty(name, value);
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
	/** Reconcile the 3 slot-presence flags from their slots' assigned content.
	*  Body is the default (unnamed) slot OR an explicit `slot="body"`. */
	_scanSlots() {
		for (const name of [
			"header",
			"title",
			"subtitle",
			"footer"
		]) {
			const has = this._slotHasContent(this._slotFor(name));
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
		return "mono-drawer";
	}
	render() {
		const aria = this._headingAria();
		return html`
      <div
        class=${this._computeDrawerClasses().join(" ")}
        mono-drawer
        ${ref(this.bindRoot)}
        role="dialog"
        title=""
        aria-labelledby=${ifDefined(aria.labelledby)}
        aria-describedby=${ifDefined(aria.describedby)}
        aria-modal=${this.overlay ? "true" : "false"}
        aria-hidden=${this.modelValue ? "false" : "true"}
        style=${styleMap({ "--mono-drawer-z": String(this._effectiveZ) })}
      >
        ${this._renderDrawerBody()}
      </div>
    `;
	}
};
MonoDrawerShadow = __decorate([customElement("mono-shadow-drawer")], MonoDrawerShadow);
//#endregion
export { MonoDrawerCore, MonoDrawerShadow };
