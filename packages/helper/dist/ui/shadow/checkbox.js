import { t as customElement } from "../../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../../decorate-DbYFpi8R.js";
import { n as validateCheckboxProps, r as MonoCheckboxCore, t as generateCheckboxAttributes } from "../../checkbox-utils-DKdrhAzF.js";
import { i as withShadowUtilityStyles, r as toShadowCss, t as flushSsrHydration } from "../../hydration-flush-Volt9X7Q.js";
import { t as checkbox_css_raw_default } from "../../checkbox.css_raw-AYtSbUtY.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";

//#region src/components/checkbox/mono-checkbox.shadow.ts
const SHADOW_EXTRA_CSS = "";
let MonoCheckboxShadow = class MonoCheckboxShadow extends withShadowUtilityStyles(MonoCheckboxCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(checkbox_css_raw_default, {
			host: "mono-checkbox",
			hostDisplay: "inline-block",
			append: SHADOW_EXTRA_CSS
		}))];
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
		super.updated?.(changed);
		if (!isServer) this._scanSlots();
	}
	_slotFor(name) {
		return this.renderRoot.querySelector(`slot[name="${name}"]`);
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes().some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, name === "description" ? this._sublabelHasContent() : this._slotHasContent(event.target));
	}
	/**
	* The sublabel region answers to `slot="sublabel"` and to the older
	* `slot="description"` (nested inside it), so its presence is the union.
	*/
	_sublabelHasContent() {
		const byName = (n) => this.renderRoot.querySelector(`slot[name="${n}"]`);
		return this._slotHasContent(byName("sublabel")) || this._slotHasContent(byName("description"));
	}
	_setSlotState(name, has) {
		if (name === "icon") this._hasIcon = has;
		else if (name === "indeterminate-icon") this._hasIndeterminateIcon = has;
		else if (name === "label") this._hasLabelSlotState = has;
		else if (name === "description") this._hasDescriptionSlotState = has;
	}
	/** Reconcile the 4 slot-presence flags from their slots' assigned content. */
	_scanSlots() {
		for (const name of [
			"icon",
			"indeterminate-icon",
			"label",
			"description"
		]) {
			const has = name === "description" ? this._sublabelHasContent() : this._slotHasContent(this._slotFor(name));
			if (has !== (name === "icon" ? this._hasIcon : name === "indeterminate-icon" ? this._hasIndeterminateIcon : name === "label" ? this._hasLabelSlotState : this._hasDescriptionSlotState)) this._setSlotState(name, has);
		}
	}
	/**
	* Inline SVG, not the `i-mdi-loading` utility class: a shadow root cannot see the
	* page's utility CSS, so the light build's icon class would render nothing here.
	* `fill="currentColor"` keeps it on the box's icon colour; the spin comes from the
	* adopted `checkbox.css`.
	*/
	_renderLoadingIcon() {
		return html`
      <svg class="mono-checkbox-spinner" mono-spinner viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8" />
      </svg>
    `;
	}
	_renderCustomIcon() {
		if (this.indeterminate) return html`<slot
        name="indeterminate-icon"
        @slotchange=${(e) => this._onSlotChange("indeterminate-icon", e)}
      ></slot>`;
		if (this.checked) return html`<slot
        name="icon"
        @slotchange=${(e) => this._onSlotChange("icon", e)}
      ></slot>`;
		return nothing;
	}
	_renderLabelBlock() {
		return html`
      <span
        class=${this._cls("mono-checkbox-label", "label")}
        mono-label
        ?mono-empty=${!this._hasLabelContent() && !this._hasDescriptionContent()}
      >
        <span
          class=${this._cls("mono-checkbox-label-text", "labelText")}
          mono-label-text
          ?mono-empty=${!this._hasLabelContent()}
        >
          <slot name="label" @slotchange=${(e) => this._onSlotChange("label", e)}
            >${this.label || nothing}</slot
          >
        </span>

        <span
          class=${this._cls("mono-checkbox-label-description", "description")}
          mono-description
          ?mono-empty=${!this._hasDescriptionContent()}
        >
          <slot name="sublabel" @slotchange=${(e) => this._onSlotChange("description", e)}
            ><slot
              name="description"
              @slotchange=${(e) => this._onSlotChange("description", e)}
              >${this.sublabel || nothing}</slot
            ></slot
          >
        </span>
      </span>
    `;
	}
};
MonoCheckboxShadow = __decorate([customElement("mono-shadow-checkbox")], MonoCheckboxShadow);

//#endregion
export { MonoCheckboxCore, MonoCheckboxShadow, generateCheckboxAttributes, validateCheckboxProps };