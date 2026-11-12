import { d as buildSizeStyle } from "./mono-ui-kvLVIf1V.js";
import { t as customElement } from "./mono-element-CKcT0rwv.js";
import { t as __decorate } from "./decorate-DbYFpi8R.js";
import { n as bucketHasContent, r as captureLightSlots, s as placeSlotNode, t as LateSlotWatcher } from "./light-slots-B5Ck0t_E.js";
import { t as MonoButtonCore } from "./button-core-DerXg84Q.js";
import { LitElement, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";

//#region src/components/button/mono-button.ts
let MonoButton = class MonoButton extends MonoButtonCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._buckets = /* @__PURE__ */ new Map();
		this._slotsCaptured = false;
		this._guardedAffixes = /* @__PURE__ */ new WeakSet();
		this._lateAffix = [];
	}
	createRenderRoot() {
		return this;
	}
	/**
	* Light-DOM refinement: `rounded="full"` auto-icon-only only when the default slot is
	* empty. `bucketHasContent` (not a length check) so a bucket holding nothing but
	* framework anchors still counts as empty.
	*/
	_defaultIsEmpty() {
		return !bucketHasContent(this._buckets.get("default"));
	}
	_renderBadge() {
		return when(Boolean(this.badge), () => html`
        <span class=${this._badgeClass} mono-badge=${this._badgeColor}>
          ${this.badge}
        </span>
      `, () => nothing);
	}
	/**
	* The `[data-mono-slot]` targets must be **structurally stable** across every
	* re-render.
	*
	* These are light-DOM elements holding nodes the *consumer's* framework
	* created and still tracks. Toggling `loading` used to swap between two
	* template branches, so Lit destroyed the target `<span>` — taking the
	* consumer's nodes with it — and `updated()` re-appended them into a brand-new
	* one. Vue's vnodes then referenced detached nodes, and the next patch died
	* with `TypeError: can't access property "__vnode", el is null`.
	*
	* So visibility is expressed with the existing `.button-icon.hidden` class
	* (`display: none !important`), never by adding or removing the target. With
	* the span stable, `_placeSlot` finds its nodes already in place and mutates
	* nothing at all on a loading toggle.
	*/
	_renderIconOnlyContent() {
		return html`
      <span class=${this._iconClass()} mono-icon ?mono-spinning=${this._showsSpinner} ?mono-empty=${!this._hasIcon && !this._showsSpinner} data-mono-slot="icon"></span>

      ${this._renderBadge()}
    `;
	}
	/**
	* Icon slot class, hidden in place while loading rather than unmounted — but
	* only in overlay mode. Inline loading keeps the icon, so the button doesn't
	* reshuffle its contents just to show progress.
	*/
	/**
	* The icon box, which is also where the spinner is drawn.
	*
	* `spinning` paints the ring and hides whatever is slotted inside; `empty` collapses the box
	* when there is neither. The span itself is ALWAYS rendered — see `_renderNormalContent`.
	*/
	_iconClass() {
		const base = this._cls("button-icon", "icon");
		const state = [this._showsSpinner ? "spinning" : "", !this._hasIcon && !this._showsSpinner ? "empty" : ""].filter(Boolean).join(" ");
		return state ? `${base} ${state}` : base;
	}
	_renderNormalContent() {
		const contentBase = this._hasIcon ? this.iconPosition === "right" ? "button-content icon-right" : "button-content icon-left" : "button-content";
		const contentClass = this._cls(contentBase, "content");
		const iconClass = this._iconClass();
		const textClass = this._cls("button-text", "text");
		const iconSpan = (position) => this.iconPosition === position ? html`<span class=${iconClass} mono-icon ?mono-spinning=${this._showsSpinner} ?mono-empty=${!this._hasIcon && !this._showsSpinner} data-mono-slot="icon"></span>` : nothing;
		return html`
      <div class=${contentClass} mono-content>
        ${iconSpan("left")}

        <span class=${textClass} mono-text data-mono-slot="default"></span>

        ${iconSpan("right")}
      </div>

      ${this._renderBadge()}
    `;
	}
	_renderContent() {
		if (this._isIconOnlyLike) return this._renderIconOnlyContent();
		return this._renderNormalContent();
	}
	render() {
		const isDisabled = this._isBlocked;
		const isInert = this._isInert;
		if (this.href) return this._renderWrapper(html`
          ${this._renderAffix("prepend")}
          <a
            class=${"mono-button-native" + (this.cssClass?.main ? " " + this.cssClass.main : "")}
            mono-native
            href=${ifDefined(this.href)}
            target=${ifDefined(this.target)}
            title=${ifDefined(this.tooltip)}
            aria-label=${ifDefined(this._ariaLabel)}
            role="button"
            aria-disabled=${isDisabled ? "true" : "false"}
            aria-busy=${this._effectiveLoading ? "true" : "false"}
            @click=${this._handleClick}
            @keydown=${this._handleKeyDown}
            @focus=${this._handleFocus}
            @blur=${this._handleBlur}
          >
            ${this._renderContent()}
          </a>
          ${this._renderAffix("append")}
        `);
		return this._renderWrapper(html`
        ${this._renderAffix("prepend")}
        <button
          class=${ifDefined(this.cssClass?.main)}
          mono-native
          type=${this.type}
          title=${ifDefined(this.tooltip)}
          aria-label=${ifDefined(this._ariaLabel)}
          ?disabled=${isInert}
          aria-disabled=${isDisabled ? "true" : "false"}
          aria-busy=${this._effectiveLoading ? "true" : "false"}
          @click=${this._handleClick}
          @keydown=${this._handleKeyDown}
          @focus=${this._handleFocus}
          @blur=${this._handleBlur}
        >
          ${this._renderContent()}
        </button>
        ${this._renderAffix("append")}
      `);
	}
	connectedCallback() {
		super.connectedCallback();
		this.setAttribute("role", "button");
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
		if (!this._lateAffix.length) for (const name of ["prepend", "append"]) this._lateAffix.push({
			name,
			watcher: new LateSlotWatcher(this, name, () => this._recaptureAffix())
		});
		for (const { watcher } of this._lateAffix) watcher.start();
	}
	disconnectedCallback() {
		for (const { watcher } of this._lateAffix) watcher.stop();
		super.disconnectedCallback();
	}
	/**
	* Claim a `slot="prepend"` / `slot="append"` child that arrived after connect.
	*
	* Deliberately NOT `captureLightSlots` a second time. This build renders into
	* the host (`createRenderRoot` → `this`), so by now the host's children include
	* Lit's own `<div class="mono-button">` — a re-capture would bucket that as
	* default content and detach it, wiping the rendered button. `LateSlotWatcher`
	* hands back only the direct child carrying the slot name, which is all that is
	* wanted here.
	*/
	_recaptureAffix() {
		let gained = false;
		for (const { name, watcher } of this._lateAffix) {
			const el = watcher.find();
			if (!el) continue;
			el.removeAttribute("slot");
			if (el.parentNode === this) this.removeChild(el);
			this._buckets.set(name, [...this._buckets.get(name) ?? [], el]);
			if (name === "prepend") this._hasPrepend = true;
			else this._hasAppend = true;
			gained = true;
		}
		if (gained) this.requestUpdate();
	}
	/**
	* Stop a nested control's click at the affix boundary — the plain `click`
	* and the `mno-click` / `mnoClick` aliases alike.
	*
	* An affix can hold a whole `<mono-button>` or a dropdown caret. Sibling
	* placement keeps its clicks out of `_handleClick`, but they would still
	* bubble to the HOST, where a consumer's `@click` is this button's action —
	* a split button's caret would run the button's handler. So an affix's click
	* ends here: its own handlers (deeper) and any document-level CAPTURE
	* listener have already run. Same guard `mono-button-dropdown` puts on its
	* embedded buttons.
	*/
	_guardAffixEvents(el) {
		if (this._guardedAffixes.has(el)) return;
		this._guardedAffixes.add(el);
		const stop = (event) => event.stopPropagation();
		el.addEventListener("click", stop);
		el.addEventListener("mno-click", stop);
		el.addEventListener("mnoClick", stop);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, { names: [
			"icon",
			"prepend",
			"append"
		] });
		this._hasIcon = bucketHasContent(this._buckets.get("icon"));
		this._hasPrepend = bucketHasContent(this._buckets.get("prepend"));
		this._hasAppend = bucketHasContent(this._buckets.get("append"));
	}
	/**
	* An affix zone renders only when its slot has content, so an affix-free button
	* keeps byte-identical markup. That conditional is safe here — unlike the icon
	* span, whose target must never unmount — because capture runs BEFORE the
	* synchronous first render in `connectedCallback`, and because the flags only
	* ever go false→true: captured nodes stay captured, so a target that exists
	* once is never taken away from under the consumer's nodes.
	*/
	_renderAffix(name) {
		if (!(name === "prepend" ? this._hasPrepend : this._hasAppend)) return nothing;
		const cls = [
			`button-${name}`,
			this._affix(name).divider ? "has-divider" : "",
			this._affixDisabled(name) ? "disabled" : "",
			this.cssClass?.[name] ?? ""
		].filter(Boolean).join(" ");
		return html`<span
      class=${cls}
      mono-affix=${name}
      ?mono-divider=${Boolean(this._affix(name).divider)}
      ?mono-disabled=${this._affixDisabled(name)}
      data-mono-slot=${name}
    ></span>`;
	}
	/**
	* Apply sizing to the HOST (`mono-button` is inline-block). The `.sized` class
	* makes the wrapper + inner control fill the host, so width/height set here
	* cascade down. Props that aren't set are removed so they don't linger.
	*/
	_applyHostSize() {
		const style = buildSizeStyle(this);
		for (const prop of [
			"width",
			"height",
			"min-width",
			"max-width",
			"min-height",
			"max-height"
		]) {
			const value = style[prop];
			if (value) this.style.setProperty(prop, value);
			else this.style.removeProperty(prop);
		}
	}
	updated(changed) {
		super.updated(changed);
		this._applyHostSize();
		this._placeSlot("icon", this._buckets.get("icon") ?? []);
		this._placeSlot("prepend", this._buckets.get("prepend") ?? []);
		this._placeSlot("append", this._buckets.get("append") ?? []);
		for (const name of ["prepend", "append"]) {
			const zone = this.querySelector(`[data-mono-slot="${name}"]`);
			if (zone) this._guardAffixEvents(zone);
		}
		if (!this._isIconOnlyLike) this._placeSlot("default", this._buckets.get("default") ?? []);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoButton = __decorate([customElement("mono-button")], MonoButton);

//#endregion
export { MonoButton as t };