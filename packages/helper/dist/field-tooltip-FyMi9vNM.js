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
			const [{ loadFloatingUi }, { controlMonoTooltip }] = await Promise.all([import("./tooltip-loader-Dcp9AUZn.js").then((n) => n.n), import("./control-tooltip-C3rA_nSH.js").then((n) => n.n)]);
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
export { FieldBubble as n, FieldTooltipController as t };