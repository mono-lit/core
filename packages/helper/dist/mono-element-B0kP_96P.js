import { _ as watchSkeletonActivation, c as monoApplyPhantomOptions, d as monoPendingActive, h as registerPendingProperty, m as monoSkeletonInternals, s as isMonoSsrApp, t as applyMonoUIDefaults } from "./mono-ui-CPV7rrdo.js";
import { html } from "lit";
//#region src/composables/mono-pending.ts
var { hasDom, isActive, state, activeOf, phantomOf, PHANTOM_TAG, DEFAULT_MAX_WAIT } = monoSkeletonInternals;
var { TAG_DEFAULT, PENDING_ACTIVE, PENDING_GRACE, PENDING_PHANTOM } = monoSkeletonInternals.slots;
/**
* Applied to every registered element class by the mono `customElement` decorator.
* The property itself is registered separately (`registerPendingProperty`) so it lands in
* Lit's attribute map before `customElements.define`.
*/
function withMonoPending(superClass, tag) {
	class WithMonoPending extends superClass {
		constructor(...args) {
			super(...args);
			this._monoWrap = false;
			this._monoCssOnly = false;
			this._monoSeenInactive = false;
			this._monoReleased = false;
			this._monoHadShadowRoot = false;
			this._monoPageChecked = false;
			if (hasDom) this._monoHadShadowRoot = !!this.shadowRoot;
		}
		get _monoStatics() {
			return this.constructor;
		}
		get _monoIsShadow() {
			return this.renderRoot !== this;
		}
		willUpdate(changed) {
			super.willUpdate?.(changed);
			if (!hasDom) return;
			this._monoResolve();
		}
		/** Resolve `pending` → the per-element slots the render / the Cores read. */
		_monoResolve() {
			const self = this;
			const own = self.pending;
			const tagDefault = self[TAG_DEFAULT];
			const explicit = activeOf(own) ?? activeOf(tagDefault);
			const statics = this._monoStatics;
			this._monoCssOnly = statics.monoPendingDraw === "css";
			let loading = false;
			if (explicit !== void 0) loading = explicit;
			else if (isActive()) loading = this._monoAuto(statics);
			if (!isActive() && !this._monoSeenInactive && !this.hasUpdated) {
				this._monoSeenInactive = true;
				state.createdBeforeActive++;
				if (!state.createdBeforeActiveTags.includes(tag)) state.createdBeforeActiveTags.push(tag);
			}
			this._monoWrap = loading && isActive() && !this._monoCssOnly && statics.monoPendingMode !== "custom" && (!this._monoIsShadow || this.hasUpdated || !this._monoHadShadowRoot);
			self[PENDING_ACTIVE] = loading;
			self[PENDING_PHANTOM] = loading ? {
				...phantomOf(state.defaults),
				...phantomOf(tagDefault),
				...phantomOf(own)
			} : {};
		}
		/**
		* Mirror the resolved state onto the HOST as the CSS-only attributes (`mono-pending`,
		* `mono-pending-animation`, `mono-pending-mode` — skeleton.css): the element paints as a
		* block the instant it exists, with no script involved. `mono-pending-covered` marks that
		* phantom-ui is defined and will draw the measured blocks instead, so the CSS paint steps
		* aside (both at once would hide phantom's wrapper under the block).
		*/
		_monoReflect() {
			const self = this;
			const host = this;
			if (!self[PENDING_ACTIVE]) {
				for (const a of [
					"mono-pending",
					"mono-pending-animation",
					"mono-pending-mode",
					"mono-pending-covered"
				]) if (host.hasAttribute(a)) host.removeAttribute(a);
				return;
			}
			const opts = self[PENDING_PHANTOM] ?? {};
			if (!host.hasAttribute("mono-pending")) host.setAttribute("mono-pending", "");
			for (const [attr, key] of [["mono-pending-animation", "animation"], ["mono-pending-mode", "mode"]]) {
				const v = opts[key];
				if (v == null || v === "") {
					if (host.hasAttribute(attr)) host.removeAttribute(attr);
				} else if (host.getAttribute(attr) !== String(v)) host.setAttribute(attr, String(v));
			}
			host.toggleAttribute("mono-pending-covered", this._monoWrap);
		}
		/** The automatic rule — see the header of ./mono-skeleton.ts. */
		_monoAuto(statics) {
			if (this._monoIsShadow) return false;
			if (statics.monoPendingAuto === "never") return false;
			if (!isMonoSsrApp()) return false;
			if (this._monoReleased) return false;
			const self = this;
			if (statics.monoPendingAuto === "data") {
				if (self._monoPendingReady?.() ?? true) {
					this._monoRelease();
					return false;
				}
				state.waiting.add(this);
				this._monoStartTimers(true);
				return true;
			}
			if (state.waiting.size === 0 && this._monoPageChecked) {
				this._monoRelease();
				return false;
			}
			if (!this._monoPageChecked) {
				this._monoPageChecked = true;
				queueMicrotask(() => {
					if (state.waiting.size === 0) this._monoReleaseHeld();
				});
			}
			state.holders.add(this);
			this._monoStartTimers(false);
			return true;
		}
		/** Done waiting (from inside an update): leave the page-wide sets, release the held. */
		_monoRelease() {
			this._monoReleased = true;
			this._monoClearTimers();
			state.holders.delete(this);
			if (state.waiting.delete(this) && state.waiting.size === 0) for (const holder of Array.from(state.holders)) holder._monoReleaseHeld();
		}
		/**
		* Release a page-held element from OUTSIDE an update, without scheduling one for the
		* CSS-only draw (the attribute flip below is the whole release). A held element that
		* DREW through phantom was wrapped, so its release is a normal re-render instead —
		* `_monoWrap` decides, and both paths land on the same idle DOM.
		*/
		_monoReleaseHeld() {
			if (this._monoReleased) return;
			this._monoReleased = true;
			this._monoClearTimers();
			state.holders.delete(this);
			const self = this;
			self[PENDING_ACTIVE] = false;
			self[PENDING_PHANTOM] = {};
			this._monoCssOnly = false;
			if (this._monoWrap) this.requestUpdate();
			else this._monoReflect();
		}
		/** `grace`: data-driven elements re-check once after a macrotask (see `monoPendingGrace`). */
		_monoStartTimers(grace) {
			const self = this;
			if (grace && !self[PENDING_GRACE] && !this._monoGraceTimer) this._monoGraceTimer = setTimeout(() => {
				this._monoGraceTimer = void 0;
				self[PENDING_GRACE] = true;
				this.requestUpdate();
			}, 0);
			const maxWait = state.defaults.maxWait ?? DEFAULT_MAX_WAIT;
			if (maxWait > 0 && !this._monoMaxWaitTimer) this._monoMaxWaitTimer = setTimeout(() => {
				this._monoMaxWaitTimer = void 0;
				if (state.holders.has(this)) {
					this._monoReleaseHeld();
					return;
				}
				this._monoReleased = true;
				this.requestUpdate();
			}, maxWait);
		}
		_monoClearTimers() {
			if (this._monoGraceTimer) clearTimeout(this._monoGraceTimer);
			if (this._monoMaxWaitTimer) clearTimeout(this._monoMaxWaitTimer);
			this._monoGraceTimer = void 0;
			this._monoMaxWaitTimer = void 0;
		}
		disconnectedCallback() {
			this._monoClearTimers();
			const self = this;
			self[PENDING_ACTIVE] = false;
			this._monoReflect();
			state.holders.delete(this);
			if (state.waiting.delete(this) && state.waiting.size === 0) for (const holder of Array.from(state.holders)) holder._monoReleaseHeld();
			super.disconnectedCallback();
		}
		render() {
			const inner = super.render();
			if (!this._monoWrap) return inner;
			return html`<phantom-ui mono-skeleton ?loading=${monoPendingActive(this)}>${inner}</phantom-ui>`;
		}
		updated(changed) {
			super.updated(changed);
			if (!hasDom) return;
			this._monoReflect();
			if (this._monoWrap) monoApplyPhantomOptions(this, this._monoWrapper());
		}
		/** The wrapper this mixin rendered (a direct child of the render root). */
		_monoWrapper() {
			const root = this.renderRoot;
			for (const child of Array.from(root.children)) if (child.localName === PHANTOM_TAG && child.hasAttribute("mono-skeleton")) return child;
			return null;
		}
	}
	return WithMonoPending;
}
//#endregion
//#region src/composables/mono-element.ts
/** Wrap `cls` so each instance gets the `createMonoUI` defaults at the end of construction, and `pending`. */
function withMonoUI(tag, cls) {
	const Base = withMonoPending(cls, tag);
	const Mono = class extends Base {
		constructor(...args) {
			super(...args);
			applyMonoUIDefaults(this, tag);
		}
	};
	Object.defineProperty(Mono, "name", { value: cls.name });
	registerPendingProperty(Mono);
	watchSkeletonActivation();
	return Mono;
}
/** Register `cls` as `tag` with the app-wide defaults applied. Returns the registered class. */
function defineMonoElement(tag, cls) {
	const existing = customElements.get(tag);
	if (existing) return existing;
	const Mono = withMonoUI(tag, cls);
	customElements.define(tag, Mono);
	return Mono;
}
/**
* Drop-in for Lit's `@customElement(tag)`: registers the class (wrapped so
* `createMonoUI` defaults apply and `pending` exists) and replaces the class binding with it.
*/
function customElement(tag) {
	return (cls) => {
		const Mono = withMonoUI(tag, cls);
		customElements.define(tag, Mono);
		return Mono;
	};
}
//#endregion
export { defineMonoElement as n, customElement as t };
