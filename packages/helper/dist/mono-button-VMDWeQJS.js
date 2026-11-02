import { d as buildSizeStyle } from "./mono-ui-CK5wNw-7.js";
import { t as customElement } from "./mono-element-BP0RKeDD.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-BPku9HpS.js";
import { n as bucketHasContent, r as captureLightSlots, s as placeSlotNode, t as LateSlotWatcher } from "./light-slots-RAAINrYd.js";
import { a as rateLimitHasChanged, i as rateLimitConverter, n as normalizeDebounce, r as normalizeThrottle, t as createRateLimiter } from "./rate-limit-e9Jlpl5l.js";
import { LitElement, html, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";

//#region src/components/button/button-core.ts
/**
* `MonoButtonCore` — all render-mode-agnostic logic for `mono-button`: reactive
* props, hybrid aliases, the camelCase attribute fallbacks, the slot-presence
* `@state` (`_hasIcon`), class/getter computation, sizing, click/keyboard
* interactivity, and the imperative `focus/blur/click`. No `render()` — the light
* build keeps its `[data-mono-slot]` capture strategy and the shadow build uses
* native `<slot>` (each ships its own `render()`, mirroring `mono-card`).
*
* The `rounded="full"` auto-"icon-only when empty" refinement depends on light-DOM slot
* introspection, so it lives behind the `_defaultIsEmpty()` hook (defaults to
* `false` here; the light build overrides it). SSR-safe: no `document`/`window`
* access; `_buttonElement` (`@query`) is lazy and `focus/blur/click` only run
* client-side.
*/
const MonoButtonCore = (superClass) => {
	class MonoButtonCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.cssClass = {};
			this._hasIcon = false;
			this._hasPrepend = false;
			this._hasAppend = false;
			this._pending = 0;
			this._running = 0;
			this._throttler = null;
			this._debouncer = null;
			this._directRunning = 0;
			this._lastPhase = "idle";
			defineHybridPropAliases(this, [
				"iconPosition",
				"badgeColor",
				"iconOnly",
				"ariaLabelText",
				"cssClass",
				"noAutoLoading",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
			this.size = "md";
			this.color = "primary";
			this.variant = "solid";
			this.disabled = false;
			this.loading = false;
			this.href = void 0;
			this.target = void 0;
			this.type = "button";
			this.iconPosition = "left";
			this.prepend = {};
			this.append = {};
			this.badge = void 0;
			this.badgeColor = "red";
			this.iconOnly = false;
			this.glass = false;
			this.tooltip = void 0;
			this.ariaLabelText = void 0;
			this.throttle = void 0;
			this.debounce = void 0;
			this.handler = void 0;
			this.noAutoLoading = false;
			this._isActive = false;
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"iconposition",
				"badgecolor",
				"icononly",
				"arialabeltext",
				"noautoloading",
				"prepend",
				"append"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "icononly") {
				this.iconOnly = this._toBoolean(newValue);
				return;
			}
			if (name === "prepend" || name === "append") {
				this._setAffix(name, newValue);
				return;
			}
			if (name === "iconposition") {
				this.iconPosition = newValue ?? "left";
				return;
			}
			if (name === "badgecolor") {
				this.badgeColor = newValue ?? "red";
				return;
			}
			if (name === "noautoloading") {
				this.noAutoLoading = this._toBoolean(newValue);
				return;
			}
			if (name === "arialabeltext") this.ariaLabelText = newValue ?? void 0;
		}
		willUpdate(changed) {
			for (const key of [
				"disabled",
				"loading",
				"iconOnly",
				"glass",
				"noAutoLoading"
			]) if (typeof this[key] === "string") this[key] = this._toBoolean(this[key]);
			if (changed.has("throttle")) this._invalidateLimiter("throttle");
			if (changed.has("debounce")) this._invalidateLimiter("debounce");
			super.willUpdate?.(changed);
		}
		/**
		* Limiters are built on demand rather than up front: nothing schedules a
		* timer server-side, and a disposed one (config change, disconnect) simply
		* rebuilds on the next click — which is also what makes the element
		* survive being moved or re-activated under `<KeepAlive>`.
		*/
		_ensureThrottler() {
			if (this._throttler) return this._throttler;
			const config = normalizeThrottle(this.throttle);
			if (!config) return null;
			this._throttler = createRateLimiter({
				kind: "throttle",
				config,
				run: (...args) => this._runLimited("throttle", args[0]),
				onChange: () => this._syncLoading()
			});
			return this._throttler;
		}
		_ensureDebouncer() {
			if (this._debouncer) return this._debouncer;
			const config = normalizeDebounce(this.debounce);
			if (!config) return null;
			this._debouncer = createRateLimiter({
				kind: "debounce",
				config,
				run: (...args) => this._runLimited("debounce", args[0]),
				onChange: () => this._syncLoading()
			});
			return this._debouncer;
		}
		/** Drop a limiter so the next click rebuilds it with the current config. */
		_invalidateLimiter(kind) {
			if (kind === "throttle") {
				this._throttler?.dispose();
				this._throttler = null;
			} else {
				this._debouncer?.dispose();
				this._debouncer = null;
			}
			this._syncLoading();
		}
		/**
		* Mirror the limiters' counters into reactive state and report transitions.
		*
		* The two pipelines are independent, so the button is busy while *either*
		* is — hence the sum. Direct (unlimited) work counts as running only: it
		* never waits.
		*/
		_syncLoading() {
			const pending = this.noAutoLoading ? 0 : (this._throttler?.pending ?? 0) + (this._debouncer?.pending ?? 0);
			const running = this.noAutoLoading ? 0 : (this._throttler?.running ?? 0) + (this._debouncer?.running ?? 0) + this._directRunning;
			if (this._pending !== pending) this._pending = pending;
			if (this._running !== running) this._running = running;
			const phase = running > 0 ? "running" : pending > 0 ? "pending" : "idle";
			if (phase === this._lastPhase) return;
			this._lastPhase = phase;
			dispatchMonoEvent(this, "loading-change", {
				loading: phase !== "idle",
				phase
			});
		}
		/**
		* Drop anything waiting — the debounce timer and the throttle queue — without
		* touching work already running. Each limiter rebuilds itself on the next click.
		*/
		cancelPending() {
			this._throttler?.cancel();
			this._debouncer?.cancel();
			this._syncLoading();
		}
		disconnectedCallback() {
			this._throttler?.dispose();
			this._debouncer?.dispose();
			this._throttler = null;
			this._debouncer = null;
			super.disconnectedCallback();
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
		* Whether the default (text) slot is empty — drives the `rounded="full"`
		* auto-icon-only refinement. Requires light-DOM introspection, so the core
		* returns `false` (no auto-iconize); the light build overrides it.
		*/
		_defaultIsEmpty() {
			return false;
		}
		/**
		* Icon-only, explicitly or by inference.
		*
		* The inference: a fully-rounded button with no text in it is a circle
		* holding one glyph, which is the shape people reach for as a FAB. It used to
		* hang off `fab && (circle || shape === 'circle')`; `rounded="full"` is the
		* one prop those three collapsed into.
		*/
		get _isIconOnlyLike() {
			return this.iconOnly || this.rounded === "full" && this._defaultIsEmpty();
		}
		/**
		* What the spinner follows: the `loading` prop (a manual override that
		* always wins) OR either self-driven phase.
		*/
		get _effectiveLoading() {
			return this.loading || this._pending > 0 || this._running > 0;
		}
		/**
		* Whether a click produces anything the user can observe. A spinning button
		* is a disabled button in every phase, the wait included — no event, no
		* handler, no form submit.
		*
		* This is the *behavioural* answer; `_isInert` is the structural one. They
		* differ during the wait, and that gap is deliberate — see `_isInert`.
		*/
		get _isBlocked() {
			return this.disabled || this._effectiveLoading;
		}
		/**
		* Whether the native control carries `disabled` — everything `_isBlocked`
		* covers EXCEPT the self-driven wait.
		*
		* A natively disabled button dispatches no click event at all. If the wait
		* were inert, repeat clicks could never reach the debouncer to reset its
		* timer, and `debounce` would quietly degrade from "run once the user
		* stops" into "wait, then run, ignoring the rest". So while waiting the
		* control stays live and merely *looks* and *behaves* disabled: clicks land,
		* are swallowed by `_handleClick`, and only extend the wait.
		*/
		get _isInert() {
			return this.disabled || this.loading || this._running > 0;
		}
		/**
		* Where the spinner is drawn.
		*
		* It replaces the ICON, wherever the icon sits — so `icon-position="right"` spins on the
		* right, and a button with no icon grows a leading spinner in the slot an icon would have
		* used. The caption always stays readable.
		*
		* This used to be two looks. Self-driven loading kept the caption and TRAILED the spinner
		* after it, while the `loading` prop blanked the caption and centred the spinner — so a
		* button with an icon rendered icon + label + spinner all at once, and which of the two
		* looks you got depended on how loading had been switched on. `MonoConfirm` sets BOTH, and
		* so blanked the very caption it had just changed to "Menyimpan...".
		*
		* One rule now, whatever triggered it.
		*/
		get _showsSpinner() {
			return this._effectiveLoading;
		}
		/**
		* Spinning because a call is waiting rather than executing. Drives the
		* `pending` class, which restores `pointer-events` so those clicks can be
		* absorbed — hence the hard-block exclusions, which must never be made
		* clickable again.
		*/
		get _isPendingOnly() {
			return this._pending > 0 && this._running === 0 && !this.loading && !this.disabled;
		}
		/**
		* `prepend` / `append` are object props, so the real binding is
		* `:append.prop="{…}"`. This covers the two ways a STRING can arrive: a
		* hand-written JSON attribute (`append='{"border":true}'`, incl. DSD/SSR) and
		* Vue's `String(value)` mirror of a plain `:append="{…}"` binding — which
		* yields `"[object Object]"` and must be ignored, or it would wipe the
		* property set moments later.
		*/
		_setAffix(name, value) {
			const assign = (v) => {
				if (name === "prepend") this.prepend = v;
				else this.append = v;
			};
			if (value == null) return assign({});
			if (typeof value === "object") return assign(value);
			if (typeof value !== "string") return;
			const trimmed = value.trim();
			if (!trimmed) return assign({});
			if (!trimmed.startsWith("{")) return;
			if (!trimmed.endsWith("}")) return;
			try {
				assign(JSON.parse(trimmed));
			} catch {}
		}
		/** The affix config, always an object (either can be assigned null). */
		_affix(name) {
			const value = name === "prepend" ? this.prepend : this.append;
			return value && typeof value === "object" ? value : {};
		}
		/**
		* Whether an affix zone is inert. Follows the button's `disabled` by default
		* so the control dims as one, but NOT its `loading` — a busy main action with
		* a live trailing menu is the case this feature exists for.
		*/
		_affixDisabled(name) {
			const own = this._affix(name).disabled;
			return own === void 0 ? this.disabled : own;
		}
		/**
		* The wrapper the whole stylesheet is keyed on.
		*
		* Its ATTRIBUTES mirror the props one for one — `<div mono-button
		* mono-size="sm" mono-color="danger" mono-variant="outline">` — so a
		* hand-written twin reads like the tag, and `button.css` selects on them
		* exactly as Basecoat selects on `data-size` / `data-variant`. A prop at its
		* default (md / primary / solid / left) emits NO attribute — absence IS the
		* default in the sheet — so the rendered wrapper carries exactly what the
		* author wrote, and a hand-written twin can be compared to it 1:1. The classes
		* (`mono-button sm outline-danger`) are still emitted as inert hooks for
		* consumer CSS until 2.0; no rule reads them. Bound in the template (not set
		* in `updated()`) so the SSR build carries them.
		*/
		_renderWrapper(inner, style) {
			return html`<div
        class=${this._buttonClasses}
        style=${style ?? nothing}
        mono-button
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "solid" ? nothing : this.variant}
        mono-rounded=${ifDefined(this.rounded)}
        mono-icon-position=${this.iconPosition === "left" ? nothing : this.iconPosition}
        ?mono-icon-only=${this._isIconOnlyLike}
        ?mono-glass=${Boolean(this.glass)}
        ?mono-loading=${this._effectiveLoading}
        ?mono-waiting=${this._isPendingOnly}
        ?mono-sized=${this._hasSize}
      >${inner}</div>`;
		}
		/** @deprecated inert since the Basecoat port — see `_renderWrapper`. */
		get _buttonClasses() {
			const classes = [this._isIconOnlyLike ? "mono-button-icon" : "mono-button"];
			classes.push(this.size);
			if (this.variant === "solid") classes.push(this.color);
			else if (this.variant === "outline") classes.push(`outline-${this.color}`);
			else if (this.variant === "tonal") classes.push(`tonal-${this.color}`);
			else if (this.variant === "text") classes.push(`plain-${this.color}`);
			if (this.rounded) classes.push(`rounded-${this.rounded}`);
			if (this.glass) classes.push("glass");
			if (this._effectiveLoading) classes.push("loading");
			if (this._isPendingOnly) classes.push("pending");
			if (this._hasSize) classes.push("sized");
			if (this.disabled) classes.push("disabled");
			if (this._isActive) classes.push("active");
			if (this.cssClass?.root) classes.push(this.cssClass.root);
			return classes.join(" ");
		}
		/** The `badge-color` value the badge's `mono-badge` attribute carries (red by default). */
		get _badgeColor() {
			return this.badgeColor === "green" || this.badgeColor === "orange" || this.badgeColor === "cobalt" ? this.badgeColor : "red";
		}
		/** @deprecated inert since the Basecoat port — the badge is styled by `mono-badge`. */
		get _badgeClass() {
			let base = "btn-badge bb-red";
			if (this.badgeColor === "green") base = "btn-badge bb-green";
			else if (this.badgeColor === "orange") base = "btn-badge bb-orange";
			else if (this.badgeColor === "cobalt") base = "btn-badge bb-cobalt";
			return this.cssClass?.badge ? `${base} ${this.cssClass.badge}` : base;
		}
		get _ariaLabel() {
			return this.ariaLabelText || this.tooltip;
		}
		/** True when any sizing prop is set — drives the `sized` class + host styles. */
		get _hasSize() {
			return Object.keys(buildSizeStyle(this)).length > 0;
		}
		/** Inline sizing object (used by the shadow build via `styleMap`). */
		_sizeStyle() {
			return buildSizeStyle(this);
		}
		_handleClick(event) {
			if (this._isBlocked) {
				event.preventDefault();
				event.stopPropagation();
				this._absorbWhileWaiting(event);
				return;
			}
			const awaited = [];
			dispatchMonoEvent(this, "click", {
				originalEvent: event,
				result: void 0,
				waitUntil: (promise) => {
					awaited.push(Promise.resolve(promise));
				}
			}, { sourceEvent: event });
			const throttler = this._ensureThrottler();
			const debouncer = this._ensureDebouncer();
			const rateLimited = Boolean(throttler || debouncer);
			if (throttler) throttler.call(event);
			if (debouncer) debouncer.call(event);
			const runsHandlerHere = !rateLimited && Boolean(this.handler);
			if (runsHandlerHere || awaited.length > 0) this._runDirect(event, runsHandlerHere, awaited);
			this._maybeSubmitForm(event);
		}
		/**
		* A click that arrived while the button was already busy.
		*
		* It stays silent — no `mno-click`, no handler, no form submit — but a
		* debounce still needs to *hear* it: the contract is "run once the user
		* stops", so every repeat has to push the deadline out. Feeding the
		* debouncer does exactly that (`p-debounce` clears and re-arms its timer on
		* each call), which is why the waiting phase is deliberately not inert.
		*
		* Nothing is absorbed once work is actually running — a click then would
		* queue a second execution, which is the opposite of what a busy button
		* should do — nor while `disabled`/`loading` hard-block the control. A
		* throttle is deliberately not fed either: its contract is a rate, not a
		* quiet period, and every absorbed call would become another execution.
		*/
		_absorbWhileWaiting(event) {
			if (this.disabled || this.loading) return;
			if (this._running > 0 || this._pending === 0) return;
			this._ensureDebouncer()?.call(event);
		}
		/** Immediate (unlimited) work: the handler and/or `waitUntil` promises. */
		async _runDirect(event, runHandler, awaited) {
			this._directRunning++;
			this._syncLoading();
			try {
				if (runHandler) await this.handler?.(event);
				if (awaited.length) await Promise.allSettled(awaited);
			} finally {
				this._directRunning--;
				this._syncLoading();
			}
		}
		/**
		* The work a limiter performs: run the handler, then emit the matching
		* rate-limited event carrying its resolved result, then wait for anything
		* listeners registered. The enclosing limiter is what tracks this as the
		* `running` phase.
		*/
		async _runLimited(kind, event) {
			const result = this.handler ? await this.handler(event) : void 0;
			const awaited = [];
			dispatchMonoEvent(this, kind, {
				originalEvent: event,
				result,
				waitUntil: (promise) => {
					awaited.push(Promise.resolve(promise));
				}
			});
			if (awaited.length) await Promise.allSettled(awaited);
			return result;
		}
		/**
		* Native form submission doesn't cross a shadow boundary: in the shadow build the
		* real `<button type="submit">` lives in the shadow root, so clicking it never
		* submits the light-DOM `<form>` the host sits in (the inner button's form owner
		* is `null`). When there's no native association, submit/reset the host's closest
		* form manually via `requestSubmit()`/`reset()` (which still fires the form's
		* `submit` event + constraint validation). The light build's inner `<button>` IS
		* form-associated, so `innerForm` is truthy there and this is skipped — no double
		* submit.
		*/
		_maybeSubmitForm(event) {
			if (event.defaultPrevented || this.href || this.type !== "submit" && this.type !== "reset") return;
			if (this._buttonElement?.form) return;
			const form = this.closest("form");
			if (!form) return;
			if (this.type === "submit") form.requestSubmit();
			else form.reset();
		}
		_handleKeyDown(event) {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				this._buttonElement?.click();
			}
		}
		_handleFocus() {
			this._isActive = true;
		}
		_handleBlur() {
			this._isActive = false;
		}
		focus() {
			this._buttonElement?.focus();
		}
		blur() {
			this._buttonElement?.blur();
		}
		click() {
			this._buttonElement?.click();
		}
	}
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "variant", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "rounded", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoButtonCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoButtonCoreClass.prototype, "loading", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoButtonCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoButtonCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoButtonCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoButtonCoreClass.prototype, "maxHeight", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "href", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "target", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "type", void 0);
	__decorate([property({
		type: String,
		attribute: "icon-position"
	})], MonoButtonCoreClass.prototype, "iconPosition", void 0);
	__decorate([property({ attribute: false })], MonoButtonCoreClass.prototype, "prepend", void 0);
	__decorate([property({ attribute: false })], MonoButtonCoreClass.prototype, "append", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "badge", void 0);
	__decorate([property({
		type: String,
		attribute: "badge-color"
	})], MonoButtonCoreClass.prototype, "badgeColor", void 0);
	__decorate([property({
		attribute: "icon-only",
		reflect: true,
		converter: booleanStringConverter
	})], MonoButtonCoreClass.prototype, "iconOnly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoButtonCoreClass.prototype, "glass", void 0);
	__decorate([property({ type: String })], MonoButtonCoreClass.prototype, "tooltip", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label-text"
	})], MonoButtonCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoButtonCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		converter: rateLimitConverter,
		hasChanged: rateLimitHasChanged
	})], MonoButtonCoreClass.prototype, "throttle", void 0);
	__decorate([property({
		converter: rateLimitConverter,
		hasChanged: rateLimitHasChanged
	})], MonoButtonCoreClass.prototype, "debounce", void 0);
	__decorate([property({ attribute: false })], MonoButtonCoreClass.prototype, "handler", void 0);
	__decorate([property({
		attribute: "no-auto-loading",
		reflect: true,
		converter: booleanStringConverter
	})], MonoButtonCoreClass.prototype, "noAutoLoading", void 0);
	__decorate([state()], MonoButtonCoreClass.prototype, "_isActive", void 0);
	__decorate([state()], MonoButtonCoreClass.prototype, "_hasIcon", void 0);
	__decorate([state()], MonoButtonCoreClass.prototype, "_hasPrepend", void 0);
	__decorate([state()], MonoButtonCoreClass.prototype, "_hasAppend", void 0);
	__decorate([state()], MonoButtonCoreClass.prototype, "_pending", void 0);
	__decorate([state()], MonoButtonCoreClass.prototype, "_running", void 0);
	__decorate([query("div > button, div > a")], MonoButtonCoreClass.prototype, "_buttonElement", void 0);
	return MonoButtonCoreClass;
};

//#endregion
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