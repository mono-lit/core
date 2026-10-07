import { a as __decorate, c as defineHybridPropAlias, l as defineHybridPropAliases, s as booleanStringConverter } from "./hydration-flush-RB5Tz5nl.js";
import { n as detachEventHandlers, t as applyProps } from "./element-props-CLB6yvbm.js";
import { property } from "lit/decorators.js";
//#region src/composables/visibility.ts
/**
* The property this module last set on a given host, so showing again clears
* only our own declaration.
*
* Reading the value back instead would be wrong: a consumer who writes
* `style="display: none"` themselves and leaves `visible` alone would have their
* declaration removed on our first update.
*/
var OWNED = /* @__PURE__ */ new WeakMap();
var HIDE_VALUE = {
	display: "none",
	visibility: "hidden"
};
/**
* Write (or clear) the hide style on a HOST element.
*
* Applied to the host, not to the rendered root: light builds render into `this`,
* so hiding the inner root would leave the `<mono-*>` host itself as a flex/grid
* item still occupying its cell. Targeting the host also means one code path
* covers the light build, the shadow build and whatever layout wraps them.
*
* Only ever touches the single property it owns, and only via `removeProperty` —
* never a blanket `cssText` reset — so an inline style the consumer put on the
* host survives a hide/show round trip.
*/
function applyVisibility(host, visible, type) {
	const style = host.style;
	if (!style) return;
	const wanted = visible ? null : type === "invisible" ? "visibility" : "display";
	const owned = OWNED.get(host);
	if (owned && owned !== wanted) {
		style.removeProperty(owned);
		OWNED.delete(host);
	}
	if (!wanted) return;
	if (style.getPropertyValue(wanted) !== HIDE_VALUE[wanted]) style.setProperty(wanted, HIDE_VALUE[wanted]);
	OWNED.set(host, wanted);
}
//#endregion
//#region src/components/form/form-control-core.ts
/**
* `MonoFormControlCore` — the element half of {@link monoForm}.
*
* Mirrors `table/table-controller-core.ts`: a `.prop`-bound controller
* (`attribute: false`), hybrid aliases so `:data-form` / `:dataForm` /
* `dataform` all land, and a subscribe lifecycle that re-syncs on notify. On top
* of that it does three things the table base doesn't need:
*
* 1. **Reports changes.** Listens to its own `mno-input` / `mno-change` and
*    pushes them into the controller with the matching timing (`live` /
*    `change`), which is what drives the rules.
* 2. **Applies state.** On every notify it writes the form's value, validation
*    and merged props onto itself — assigning ONLY when the value differs, so an
*    element updating itself can't feed back into another notify.
* 3. **Lets the form win.** The controller owns the value, so it overwrites a
*    local `:model-value`; `inputs[key].props` is merged last by the controller and so
*    beats both the `setProp()` method and anything the template set.
*
* SSR-safe: `dataForm` can't cross Declarative Shadow DOM, so on the server this
* is inert and the element renders its normal shell.
*/
var MonoFormControlCore = (superClass) => {
	class MonoFormControlCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.visible = true;
			this.visibleType = "none";
			this._applying = false;
			this._onFormInput = (e) => {
				if (this._applying) return;
				const form = this.dataForm;
				const key = this.keyForm;
				if (!form || !key) return;
				form._report(key, this._valueOf(e), "live", e);
			};
			this._onFormChange = (e) => {
				if (this._applying) return;
				const form = this.dataForm;
				const key = this.keyForm;
				if (!form || !key) return;
				form._report(key, this._valueOf(e), "change", e);
			};
			defineHybridPropAliases(this, [
				"dataForm",
				"keyForm",
				"visibleType"
			]);
			defineHybridPropAlias(this, "controlForm", "dataForm");
		}
		connectedCallback() {
			super.connectedCallback();
			this._bindForm();
			this.addEventListener("mno-input", this._onFormInput);
			this.addEventListener("mno-change", this._onFormChange);
		}
		disconnectedCallback() {
			this.removeEventListener("mno-input", this._onFormInput);
			this.removeEventListener("mno-change", this._onFormChange);
			this._unbindForm();
			super.disconnectedCallback();
		}
		/**
		* Re-bind when the controller or key arrives — Vue assigns `.prop` bindings
		* after construction, so `connectedCallback` alone is too early.
		*
		* This hooks `update()`, NOT `willUpdate()`: most component cores override
		* `willUpdate` without chaining `super`, so a `willUpdate` here would
		* silently never run. `updated()` is out for the same reason — `date-core`
		* overrides it without calling `super.updated()`. Of the ten form controls
		* only `dropdown-table-core` overrides `update()`, and it does chain `super`.
		*/
		update(changed) {
			if (changed.has("dataForm") || changed.has("keyForm")) this._bindForm();
			this._applyVisibility();
			super.update(changed);
		}
		/**
		* Push `visible` / `visibleType` onto the host's inline style.
		*
		* Runs on every update, not just when the two props change: the style lives
		* on the host, which nothing else here owns, so re-asserting it is cheap and
		* survives anything that resets it.
		*/
		_applyVisibility() {
			const visible = typeof this.visible === "string" ? booleanStringConverter.fromAttribute(this.visible) : this.visible !== false;
			const type = this.visibleType === "invisible" ? "invisible" : "none";
			applyVisibility(this, visible, type);
		}
		_bindForm() {
			this._unbindForm();
			const form = this.dataForm;
			const key = this.keyForm;
			if (!form || !key) return;
			this._formUnregister = form._register(key, this);
			this._formOff = form.subscribe(() => this._syncFromForm());
			if (typeof queueMicrotask === "function") queueMicrotask(() => this._syncFromForm());
			else this._syncFromForm();
		}
		_unbindForm() {
			this._formOff?.();
			this._formOff = void 0;
			this._formUnregister?.();
			this._formUnregister = void 0;
			detachEventHandlers(this);
		}
		/**
		* Publish this control's RESOLVED options onto `form.items()[key].list`, so a `slot="list"`
		* can loop them.
		*
		* A list component calls this from its render path, so it fires on every render — the
		* controller's identity guard is what stops that becoming a notify loop, and it is why the
		* caller must hand over a NEW array only when the rows actually moved.
		*
		* A control with no list never calls it, and its `list` stays `[]`.
		*/
		_publishList(entries) {
			const form = this.dataForm;
			const key = this.keyForm;
			if (!form?._reportList || !key) return;
			form._reportList(key, entries);
		}
		_valueOf(e) {
			const detail = e.detail;
			if (detail && typeof detail === "object") {
				if ("modelValue" in detail) return detail.modelValue;
				if ("value" in detail) return detail.value;
			}
			return this.modelValue;
		}
		/**
		* Pull value + validation + props from the controller onto this element.
		* Every write is guarded by an equality check so a sync can't trigger a
		* further update cycle.
		*/
		_syncFromForm() {
			const form = this.dataForm;
			const key = this.keyForm;
			if (!form || !key) return;
			const item = form.items()[key];
			if (!item) return;
			const self = this;
			let changed = false;
			this._applying = true;
			try {
				if (!Object.is(self.modelValue, item.currentValue)) {
					self.modelValue = item.currentValue;
					changed = true;
				}
				if ("validationState" in self) {
					const nextState = item.validate.success ? "default" : "invalid";
					if (self.validationState !== nextState) {
						self.validationState = nextState;
						changed = true;
					}
					const nextMessage = item.validate.success ? "" : item.validate.message;
					if (self.validationMessage !== nextMessage) {
						self.validationMessage = nextMessage;
						changed = true;
					}
				}
				if (applyProps(this, form._propsFor(key))) changed = true;
			} finally {
				this._applying = false;
			}
			if (changed) this.requestUpdate();
		}
	}
	__decorate([property({ attribute: false })], MonoFormControlCoreClass.prototype, "dataForm", void 0);
	__decorate([property({
		type: String,
		attribute: "key-form",
		reflect: true
	})], MonoFormControlCoreClass.prototype, "keyForm", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoFormControlCoreClass.prototype, "visible", void 0);
	__decorate([property({ attribute: "visible-type" })], MonoFormControlCoreClass.prototype, "visibleType", void 0);
	return MonoFormControlCoreClass;
};
//#endregion
export { MonoFormControlCore as t };
