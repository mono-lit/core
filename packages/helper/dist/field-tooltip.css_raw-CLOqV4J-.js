import { o as infoIcon } from "./field-icons-t8rXRCKs.js";
import { html, nothing } from "lit";
import { ref } from "lit/directives/ref.js";

//#region src/composables/field-bubble.ts
/** Gap between anchor and bubble, and the bubble's minimum distance to the viewport edge. */
const GAP = 8;
const EDGE = 8;
/** Grace period for moving the pointer from the anchor onto the bubble. */
const HIDE_DELAY = 120;
let _uid = 0;
var FieldBubble = class {
	constructor(options = {}) {
		this.id = `mono-field-bubble-${++_uid}`;
		this._anchor = null;
		this._bubble = null;
		this._open = false;
		this.setAnchor = (el) => {
			this._anchor = el ?? null;
		};
		this.setBubble = (el) => {
			if ((el ?? null) !== this._bubble) this.hide();
			this._bubble = el ?? null;
		};
		this.show = () => {
			this.cancelHide();
			const bubble = this._bubble;
			if (!bubble || !bubble.isConnected || !this._anchor) return;
			if (!this._open) {
				this._open = true;
				bubble.setAttribute("mono-open", "");
				try {
					if (typeof bubble.showPopover === "function" && !bubble.matches(":popover-open")) bubble.showPopover();
				} catch {}
				window.addEventListener("scroll", this.place, true);
				window.addEventListener("resize", this.place);
			}
			this.place();
		};
		this.hide = () => {
			this.cancelHide();
			if (!this._open) return;
			this._open = false;
			window.removeEventListener("scroll", this.place, true);
			window.removeEventListener("resize", this.place);
			const bubble = this._bubble;
			if (!bubble) return;
			bubble.removeAttribute("mono-open");
			try {
				if (typeof bubble.hidePopover === "function" && bubble.matches(":popover-open")) bubble.hidePopover();
			} catch {}
		};
		this.scheduleHide = () => {
			this.cancelHide();
			this._hideTimer = setTimeout(this.hide, HIDE_DELAY);
		};
		this.cancelHide = () => {
			if (this._hideTimer !== void 0) clearTimeout(this._hideTimer);
			this._hideTimer = void 0;
		};
		this.onPointerLeave = (e) => {
			if (e.pointerType === "touch") return;
			this.scheduleHide();
		};
		this.onKeydown = (e) => {
			if (e.key === "Escape" && this._open) {
				e.stopPropagation();
				this.hide();
			}
		};
		this.place = () => {
			const anchor = this._anchor;
			const bubble = this._bubble;
			if (!this._open || !anchor || !bubble) return;
			const r = anchor.getBoundingClientRect();
			const vw = document.documentElement.clientWidth || window.innerWidth;
			const vh = window.innerHeight;
			const bw = bubble.offsetWidth;
			const bh = bubble.offsetHeight;
			const above = r.top - GAP - bh;
			const below = r.bottom + GAP;
			const fitsAbove = above >= EDGE;
			const fitsBelow = below + bh <= vh - EDGE;
			const side = this._side === "top" ? fitsAbove || !fitsBelow ? "top" : "bottom" : fitsBelow || !fitsAbove ? "bottom" : "top";
			const top = side === "top" ? above : below;
			const target = this._align === "center" ? r.left + r.width / 2 : r.left + Math.min(16, r.width / 2);
			const ideal = this._align === "center" ? target - bw / 2 : r.left;
			const left = Math.min(Math.max(ideal, EDGE), Math.max(EDGE, vw - EDGE - bw));
			bubble.style.top = `${Math.round(top)}px`;
			bubble.style.left = `${Math.round(left)}px`;
			bubble.style.setProperty("--_mono-field-tip-arrow-x", `${Math.round(target - left)}px`);
			bubble.setAttribute("mono-side", side);
		};
		this._side = options.side ?? "top";
		this._align = options.align ?? "center";
	}
	get isOpen() {
		return this._open;
	}
};

//#endregion
//#region src/composables/field-tooltip.ts
/** `controlMonoTooltip` once floating-ui is known to load, else `null`. Probed once per page. */
let _probe = null;
function probeTooltip() {
	_probe ??= (async () => {
		try {
			const [{ loadFloatingUi }, { controlMonoTooltip }] = await Promise.all([import("./tooltip-loader-3U9FTOXj.js"), import("./control-tooltip-7vegYmq3.js")]);
			await loadFloatingUi();
			return controlMonoTooltip;
		} catch {
			return null;
		}
	})();
	return _probe;
}
/** `string` → `{ content }`; anything without content → `null` (renders nothing). */
function normalizeFieldTooltip(value) {
	if (!value) return null;
	if (typeof value === "string") return value.trim() ? { content: value } : null;
	if (typeof value !== "object") return null;
	const { content } = value;
	if (content === void 0 || content === null || content === "") return null;
	return value;
}
/** Which bubble a prop value gets: the built-in one, the floating-ui addon, or none. */
function tooltipMode(value) {
	if (!normalizeFieldTooltip(value)) return null;
	return typeof value === "string" ? "simple" : "floating";
}
/** A click on the bubble is still inside the `<label>` and the icon: neither should react. */
const stopBubbleClick = (e) => {
	e.preventDefault();
	e.stopPropagation();
};
const stopLabelActivation = (e) => {
	e.preventDefault();
};
var FieldTooltipController = class {
	constructor(host, read) {
		this.host = host;
		this.read = read;
		this._fn = null;
		this._ctrl = null;
		this._el = null;
		this._applied = null;
		this._raw = null;
		this._connected = false;
		this._bubble = new FieldBubble({
			side: "top",
			align: "center"
		});
		this._setEl = (el) => {
			if ((el ?? null) !== this._el) this._unbind();
			this._el = el ?? null;
			this._bubble.setAnchor(this._el);
		};
		this._onIconClick = (e) => {
			stopLabelActivation(e);
			this._bubble.show();
		};
		host.addController(this);
	}
	hostConnected() {
		this._connected = true;
	}
	hostDisconnected() {
		this._connected = false;
		this._bubble.hide();
		this._unbind();
	}
	hostUpdated() {
		if (tooltipMode(this.read()) === "floating") this._ensureProbe();
		this._sync();
	}
	/** The ⓘ for the end of the label row, or `nothing`. */
	render() {
		const raw = this.read();
		const mode = tooltipMode(raw);
		if (mode === "simple") return this._renderSimple(raw);
		if (mode !== "floating" || !this._fn) return nothing;
		return html`<span
      mono-label-tooltip
      tabindex="0"
      role="img"
      aria-label="More information"
      @click=${stopLabelActivation}
      ${ref(this._setEl)}
    >${this._icon()}</span>`;
	}
	/**
	* Plain text: the icon carries its own bubble. `aria-describedby` reads the
	* text to screen readers on focus; hover, focus or a tap shows it, Escape
	* dismisses it, and the pointer may move onto it without it closing.
	*/
	_renderSimple(text) {
		return html`<span
      mono-label-tooltip
      tabindex="0"
      role="img"
      aria-label="More information"
      aria-describedby=${this._bubble.id}
      @click=${this._onIconClick}
      @pointerenter=${this._bubble.show}
      @pointerleave=${this._bubble.onPointerLeave}
      @focus=${this._bubble.show}
      @blur=${this._bubble.hide}
      @keydown=${this._bubble.onKeydown}
      ${ref(this._setEl)}
    >${this._icon()}<span
        mono-field-bubble
        mono-label-tooltip-bubble
        id=${this._bubble.id}
        role="tooltip"
        popover="manual"
        @pointerenter=${this._bubble.cancelHide}
        @pointerleave=${this._bubble.onPointerLeave}
        @click=${stopBubbleClick}
        ${ref(this._bubble.setBubble)}
      >${text}</span></span>`;
	}
	/**
	* Light build: the UnoCSS `i-mdi-information-outline` mask (shipped in
	* `ui/index.css`). Shadow build: the same path inline — the page's icon CSS
	* cannot reach a shadow root.
	*/
	_icon() {
		if (this.host.renderRoot instanceof ShadowRoot) return infoIcon();
		return html`<span class="mono-icon i-mdi-information-outline" mono-icon aria-hidden="true"></span>`;
	}
	_ensureProbe() {
		if (this._fn || typeof document === "undefined") return;
		probeTooltip().then((fn) => {
			if (!fn || this._fn) return;
			this._fn = fn;
			this.host.requestUpdate();
		});
	}
	_sync() {
		const raw = this.read();
		if (tooltipMode(raw) !== "floating") return this._unbind();
		if (this._ctrl && this._raw === raw) return;
		const options = normalizeFieldTooltip(raw);
		if (!this._fn || !this._connected || !this._el || !options) return this._unbind();
		if (this._ctrl) {
			const blanked = {};
			for (const key of Object.keys(this._applied ?? {})) blanked[key] = void 0;
			this._ctrl.update({
				...blanked,
				...options
			});
		} else this._ctrl = this._fn(this._el, options);
		this._applied = options;
		this._raw = raw;
	}
	_unbind() {
		this._ctrl?.destroy();
		this._ctrl = null;
		this._applied = null;
		this._raw = null;
	}
};

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\form\field-tooltip.css?raw.js
var field_tooltip_css_raw_default = "/* =========================================\r\n   Field tooltip — the BUILT-IN bubble behind a plain-text `tooltip=\"…\"` on\r\n   every field control (input, select, tag-input, date, textarea,\r\n   dropdown-table, slider). No floating-ui: composables/field-tooltip.ts\r\n   shows it in the top layer (Popover API) and writes its fixed `top` /\r\n   `left`, `mono-side` (top|bottom) and the arrow's x. The object form\r\n   (`.tooltip=${{…}}`) is the tooltip addon instead and never reaches here.\r\n\r\n   Looks like the addon's default `mono-tooltip`, and reads its public knobs:\r\n   --mono-tooltip-bg / -color / -radius / -max-width / -font-size /\r\n   -line-height / -padding-x / -padding-y.\r\n\r\n   Light: imported once by entries/index.css. Shadow: appended to each\r\n   control's shadow sheet.\r\n   ========================================= */\r\n\r\n[mono-field-bubble] {\r\n  --_mono-field-tip-bg: var(--mono-tooltip-bg, var(--foreground));\r\n  --_mono-field-tip-arrow: calc(var(--mono-spacing) * 2);\r\n\r\n  /* undo the [popover] UA box (inset:0; margin:auto; border; Canvas …) */\r\n  position: fixed;\r\n  inset: auto;\r\n  top: 0;\r\n  left: 0;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  display: none;\r\n  box-sizing: border-box;\r\n  width: max-content;\r\n  max-width: min(var(--mono-tooltip-max-width, 20rem), calc(100vw - 16px));\r\n  height: auto;\r\n  margin: 0;\r\n  overflow: visible;\r\n  padding: var(--mono-tooltip-padding-y, calc(var(--mono-spacing) * 1.5)) var(--mono-tooltip-padding-x, calc(var(--mono-spacing) * 3));\r\n  border: 0;\r\n  border-radius: var(--mono-tooltip-radius, var(--mono-radius-md));\r\n  background: var(--_mono-field-tip-bg);\r\n  color: var(--mono-tooltip-color, var(--background));\r\n  box-shadow: var(--mono-tooltip-shadow, 0 0 0 0 transparent);\r\n\r\n  /* it sits inside the label — drop everything the label row set */\r\n  font-family: inherit;\r\n  font-size: var(--mono-tooltip-font-size, var(--mono-text-xs));\r\n  font-weight: var(--mono-font-weight-normal, 400);\r\n  font-style: normal;\r\n  line-height: var(--mono-tooltip-line-height, var(--mono-text-xs--lh));\r\n  letter-spacing: normal;\r\n  text-transform: none;\r\n  text-align: start;\r\n  white-space: normal;\r\n  overflow-wrap: break-word;\r\n  cursor: default;\r\n  user-select: text;\r\n  pointer-events: auto;\r\n}\r\n\r\n[mono-field-bubble][mono-open] {\r\n  display: block;\r\n  animation: mono-field-tip-in var(--mono-duration, 150ms) var(--mono-ease, ease) both;\r\n}\r\n\r\n/* The arrow, plus (::before) an invisible bridge over the gap so the pointer\r\n   can travel from the icon onto the bubble without it closing. */\r\n[mono-field-bubble]::after {\r\n  content: '';\r\n  position: absolute;\r\n  left: var(--_mono-field-tip-arrow-x, 50%);\r\n  width: var(--_mono-field-tip-arrow);\r\n  height: var(--_mono-field-tip-arrow);\r\n  background: inherit;\r\n  border-radius: 2px;\r\n  translate: -50% 0;\r\n  rotate: 45deg;\r\n}\r\n\r\n[mono-field-bubble]::before {\r\n  content: '';\r\n  position: absolute;\r\n  inset-inline: 0;\r\n  height: 8px;\r\n}\r\n\r\n[mono-field-bubble]:not([mono-side=\"bottom\"])::after {\r\n  bottom: calc(var(--_mono-field-tip-arrow) / -2 + 1px);\r\n}\r\n[mono-field-bubble]:not([mono-side=\"bottom\"])::before {\r\n  top: 100%;\r\n}\r\n[mono-field-bubble][mono-side=\"bottom\"]::after {\r\n  top: calc(var(--_mono-field-tip-arrow) / -2 + 1px);\r\n}\r\n[mono-field-bubble][mono-side=\"bottom\"]::before {\r\n  bottom: 100%;\r\n}\r\n\r\n@keyframes mono-field-tip-in {\r\n  from {\r\n    opacity: 0;\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-field-bubble][mono-open] {\r\n    animation: none;\r\n  }\r\n}\r\n";

//#endregion
export { FieldTooltipController as n, FieldBubble as r, field_tooltip_css_raw_default as t };