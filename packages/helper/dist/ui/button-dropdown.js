import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import "../mono-button-DVvZ03P-.js";
import { t as MonoButtonDropdownCore } from "../button-dropdown-core-DKYEOyjy.js";
import { LitElement, html } from "lit";
import { ref } from "lit/directives/ref.js";

//#region src/components/button/mono-button-dropdown.ts
let MonoButtonDropdown = class MonoButtonDropdown extends MonoButtonDropdownCore(LitElement) {
	createRenderRoot() {
		return this;
	}
	/**
	* The panel is a STATIC element here, not something a helper returns.
	*
	* `PopupPortalController` moves it into a `<body>` portal on open and never
	* moves it back. A node produced inside a `${}` expression sits in a
	* `ChildPart` range, and ejecting it from that range breaks Lit on the next
	* render ("this `ChildPart` has no `parentNode`"). As a fixed template node it
	* has no range to leave — which is exactly why `mono-dropdown` is shaped this
	* way too.
	*/
	render() {
		return html`<div class=${this._cls("mono-button-dropdown", "root")} mono-button-dropdown ${ref(this.bindRoot)}>
      ${this.renderRow()}${this.renderTrigger()}
      <div
        class=${this.panelClass}
        mono-panel
        role="menu"
        aria-hidden=${this.modelValue ? "false" : "true"}
        ?hidden=${this.panelHidden}
        ${ref(this.bindPanel)}
      >
        ${this.renderMenuList()}
      </div>
    </div>`;
	}
};
MonoButtonDropdown = __decorate([customElement("mono-button-dropdown")], MonoButtonDropdown);

//#endregion
export { MonoButtonDropdown, MonoButtonDropdownCore };