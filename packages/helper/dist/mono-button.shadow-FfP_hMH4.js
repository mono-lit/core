import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "./hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "./mono-event-Bi1qP9uN.js";
import { t as buildSizeStyle } from "./css-size-DhHSVZJK.js";
import { a as rateLimitHasChanged, i as rateLimitConverter, n as normalizeDebounce, r as normalizeThrottle, t as createRateLimiter } from "./rate-limit-BBa2PO79.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
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
var MonoButtonCore = (superClass) => {
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
        ?mono-pending=${this._isPendingOnly}
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
//#region src/components/button/button.css?raw
var button_default = "/* =========================================================================\r\n   mono-button — a port of Basecoat's `.btn` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat (`.btn[data-size='sm']`) — and the\r\n   attributes mirror the element's props one for one, so hand-written markup\r\n   reads like the Lit / Vue tag:\r\n\r\n     <mono-button size=\"sm\" color=\"danger\" variant=\"outline\" rounded=\"full\">\r\n     <div mono-button mono-size=\"sm\" mono-color=\"danger\" mono-variant=\"outline\" mono-rounded=\"full\">\r\n       <button>…</button>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = solid). The element\r\n   renders these attributes on its wrapper (both builds); the old classes\r\n   (`.mono-button.sm.outline-primary`) are still emitted as inert hooks for\r\n   consumer CSS until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-button] > :is(button, a)                ≡ .btn\r\n     [mono-size=\"xs|sm|md|lg\"]                     ≡ .btn[data-size='xs'|'sm'|default|'lg']\r\n     [mono-size=\"xl|xxl\"]                          ≡ EXTENSION (h-11 / h-12 on the same grid)\r\n     [mono-icon-only][mono-size=…]                 ≡ .btn[data-size='icon-<size>']\r\n     [mono-variant=\"solid\"][mono-color=<hue>]      ≡ .btn[data-variant='primary'] with the hue swapped\r\n     [mono-variant=\"solid\"][mono-color=\"secondary\"]≡ .btn[data-variant='secondary']\r\n     [mono-variant=\"solid\"][mono-color=\"light\"]    ≡ .btn[data-variant='outline']\r\n     [mono-variant=\"outline\"][mono-color=<hue>]    ≡ EXTENSION (outline pattern, hue-inked)\r\n     [mono-variant=\"tonal\"][mono-color=<hue>]      ≡ .btn[data-variant='destructive'] with the hue swapped\r\n     [mono-variant=\"text\"]                         ≡ .btn[data-variant='ghost'] (+ hue ink)\r\n     [mono-link]                                   ≡ .btn[data-variant='link']\r\n     [mono-content] > [mono-icon]:first/last-child ≡ has-[[data-icon='inline-start'|'inline-end']]\r\n     [mono-affix=\"prepend|append\"]                 ≡ .button-group siblings\r\n\r\n   Inner parts are attributes too, so a hand-written button is attributes all\r\n   the way down: [mono-native] on the <button>/<a>, [mono-content],\r\n   [mono-icon] (+ [mono-spinning] / [mono-empty] / [mono-hidden]), [mono-text],\r\n   [mono-badge=\"red|green|orange|cobalt\"], [mono-affix=\"prepend|append\"]\r\n   (+ [mono-divider] / [mono-disabled] / [mono-empty]).\r\n\r\n   Values are copied from the compiled vendor sheet (vendor/basecoat/basecoat-\r\n   vega.cdn.css) through the token layer: `--spacing` → `--mono-spacing`,\r\n   `--text-sm` → `--mono-text-sm`, `--radius-md` → `--mono-radius-md`,\r\n   `--color-x` → `--x`, Tailwind's `--tw-ring-*` stack → the two-slot\r\n   `box-shadow: ring, shadow` below, and every `dark:` variant → a\r\n   `--mono-mode-*` token (a selector cannot cross a shadow boundary; an\r\n   inherited custom property can).\r\n\r\n   FLAVORS (Basecoat's other seven styles, src/data/theme/flavors/*.css) set the\r\n   `--mono-button-<size>-*` style knobs read below — `-radius`, `-padding-inline`,\r\n   `-icon-padding`, `-gap`, `-font-size`, `-line-height`, `-icon-size` — plus\r\n   `--mono-button-font-weight` / `-text-transform` / `-letter-spacing` /\r\n   `-icon-size` / `-outline-shadow` / `-outline-bg` / `-outline-hover-bg` /\r\n   `-link-decoration`. Every fallback here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"^\\.btn\"` prints the matrix).\r\n\r\n   The public `--mono-button-*` knobs and the three-tier resolver\r\n   (`--mono-button-x` → `--_mono-button-x-preset` → base) are unchanged: a\r\n   colour/variant class only ever writes a `*-preset` slot, so a consumer's\r\n   own `--mono-button-bg` on the host still wins.\r\n   ========================================================================= */\r\n\r\nmono-button {\r\n  display: inline-block;\r\n}\r\n\r\n[mono-button] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-button-primary: var(--mono-button-primary, var(--primary));\r\n  --_mono-button-primary-foreground: var(--mono-button-primary-foreground, var(--primary-foreground));\r\n  --_mono-button-secondary: var(--mono-button-secondary, var(--secondary));\r\n  --_mono-button-secondary-foreground: var(--mono-button-secondary-foreground, var(--secondary-foreground));\r\n  --_mono-button-success: var(--mono-button-success, var(--success));\r\n  --_mono-button-success-foreground: var(--mono-button-success-foreground, var(--success-foreground));\r\n  --_mono-button-danger: var(--mono-button-danger, var(--destructive));\r\n  --_mono-button-danger-foreground: var(--mono-button-danger-foreground, var(--destructive-foreground));\r\n  --_mono-button-warning: var(--mono-button-warning, var(--warning));\r\n  --_mono-button-warning-foreground: var(--mono-button-warning-foreground, var(--warning-foreground));\r\n  --_mono-button-info: var(--mono-button-info, var(--info));\r\n  --_mono-button-info-foreground: var(--mono-button-info-foreground, var(--info-foreground));\r\n  --_mono-button-teal: var(--mono-button-teal, var(--teal));\r\n  --_mono-button-teal-foreground: var(--mono-button-teal-foreground, var(--teal-foreground));\r\n  --_mono-button-purple: var(--mono-button-purple, var(--purple));\r\n  --_mono-button-purple-foreground: var(--mono-button-purple-foreground, var(--purple-foreground));\r\n  --_mono-button-dark: var(--mono-button-dark, var(--dark));\r\n  --_mono-button-dark-foreground: var(--mono-button-dark-foreground, var(--dark-foreground));\r\n  --_mono-button-neutral: var(--mono-button-neutral, var(--neutral));\r\n  --_mono-button-neutral-foreground: var(--mono-button-neutral-foreground, var(--neutral-foreground));\r\n  --_mono-button-text: var(--mono-button-text, var(--foreground));\r\n  --_mono-button-background: var(--mono-button-background, var(--background));\r\n  --_mono-button-muted: var(--mono-button-muted, var(--muted));\r\n  --_mono-button-border: var(--mono-button-border, var(--mono-mode-outline-border));\r\n\r\n  /* ── tonal tint ramp: `bg-x/10 hover:bg-x/20` (dark 20 / 30) ────────────\r\n     One alpha pair for every hue instead of the old srgb-with-white mixes;\r\n     the per-colour `--mono-button-<c>-soft(-hover)` knobs below still win. */\r\n  --_mono-button-tint: var(--mono-button-tint, var(--mono-mode-tint));\r\n  --_mono-button-tint-hover: var(--mono-button-tint-hover, var(--mono-mode-tint-hover));\r\n  --_mono-button-primary-soft: var(--mono-button-primary-soft, color-mix(in oklab, var(--_mono-button-primary) var(--_mono-button-tint), transparent));\r\n  --_mono-button-primary-soft-hover: var(--mono-button-primary-soft-hover, color-mix(in oklab, var(--_mono-button-primary) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-success-soft: var(--mono-button-success-soft, color-mix(in oklab, var(--_mono-button-success) var(--_mono-button-tint), transparent));\r\n  --_mono-button-success-soft-hover: var(--mono-button-success-soft-hover, color-mix(in oklab, var(--_mono-button-success) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-danger-soft: var(--mono-button-danger-soft, color-mix(in oklab, var(--_mono-button-danger) var(--_mono-button-tint), transparent));\r\n  --_mono-button-danger-soft-hover: var(--mono-button-danger-soft-hover, color-mix(in oklab, var(--_mono-button-danger) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-warning-soft: var(--mono-button-warning-soft, color-mix(in oklab, var(--_mono-button-warning) var(--_mono-button-tint), transparent));\r\n  --_mono-button-warning-soft-hover: var(--mono-button-warning-soft-hover, color-mix(in oklab, var(--_mono-button-warning) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-info-soft: var(--mono-button-info-soft, color-mix(in oklab, var(--_mono-button-info) var(--_mono-button-tint), transparent));\r\n  --_mono-button-info-soft-hover: var(--mono-button-info-soft-hover, color-mix(in oklab, var(--_mono-button-info) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-teal-soft: var(--mono-button-teal-soft, color-mix(in oklab, var(--_mono-button-teal) var(--_mono-button-tint), transparent));\r\n  --_mono-button-teal-soft-hover: var(--mono-button-teal-soft-hover, color-mix(in oklab, var(--_mono-button-teal) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-purple-soft: var(--mono-button-purple-soft, color-mix(in oklab, var(--_mono-button-purple) var(--_mono-button-tint), transparent));\r\n  --_mono-button-purple-soft-hover: var(--mono-button-purple-soft-hover, color-mix(in oklab, var(--_mono-button-purple) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-dark-soft: var(--mono-button-dark-soft, color-mix(in oklab, var(--_mono-button-dark) var(--_mono-button-tint), transparent));\r\n  --_mono-button-dark-soft-hover: var(--mono-button-dark-soft-hover, color-mix(in oklab, var(--_mono-button-dark) var(--_mono-button-tint-hover), transparent));\r\n  --_mono-button-neutral-soft: var(--mono-button-neutral-soft, color-mix(in oklab, var(--_mono-button-neutral) var(--_mono-button-tint), transparent));\r\n  --_mono-button-neutral-soft-hover: var(--mono-button-neutral-soft-hover, color-mix(in oklab, var(--_mono-button-neutral) var(--_mono-button-tint-hover), transparent));\r\n\r\n  /* ── corner: .btn is rounded-md; xs/sm clamp it (set by the size classes) ── */\r\n  --_mono-button-radius: var(--mono-button-radius, var(--_mono-button-radius-preset, var(--mono-button-md-radius, var(--mono-radius-md))));\r\n\r\n  /* ── focus ring colour: `--ring`, or the hue for tonal (destructive idiom) ── */\r\n  --_mono-button-ring-color: var(--mono-button-ring-color, var(--_mono-button-ring-color-preset, var(--ring)));\r\n\r\n  /* ── the painted result — three tiers, base = .btn[data-variant='primary'] ── */\r\n  --_mono-button-bg: var(--mono-button-bg, var(--_mono-button-bg-preset, var(--_mono-button-primary)));\r\n  --_mono-button-color: var(--mono-button-color, var(--_mono-button-color-preset, var(--_mono-button-primary-foreground)));\r\n  --_mono-button-border-color: var(--mono-button-border-color, var(--_mono-button-border-color-preset, transparent));\r\n  --_mono-button-shadow: var(--mono-button-shadow, var(--_mono-button-shadow-preset, 0 0 #0000));\r\n  /* Hover falls back to the RESTING colour at 80% (`hover:bg-primary/80`), so a\r\n     consumer who overrides only the resting colour keeps a matching hover. */\r\n  --_mono-button-hover-bg: var(--mono-button-hover-bg, var(--_mono-button-hover-bg-preset, color-mix(in oklab, var(--_mono-button-bg) 80%, transparent)));\r\n  --_mono-button-hover-color: var(--mono-button-hover-color, var(--_mono-button-hover-color-preset, var(--_mono-button-color)));\r\n  --_mono-button-hover-border-color: var(--mono-button-hover-border-color, var(--_mono-button-hover-border-color-preset, var(--_mono-button-border-color)));\r\n  --_mono-button-hover-shadow: var(--mono-button-hover-shadow, var(--_mono-button-hover-shadow-preset, var(--_mono-button-shadow)));\r\n\r\n  /* ── box: how much room the control takes, and where its content sits ────\r\n     Both are `auto` / `center` for a standalone button. They exist as KNOBS\r\n     because a button placed inside another component's list — a\r\n     `mono-button-dropdown` menu row — has to stretch and left-align, and that\r\n     component cannot reach the control with a selector: in the shadow build the\r\n     control lives behind a boundary. An inherited custom property crosses it. */\r\n  --_mono-button-width: var(--mono-button-width, auto);\r\n  --_mono-button-justify: var(--mono-button-justify, center);\r\n  /* The press nudge, as a knob for the same reason: a list row must not twitch\r\n     under the pointer, and the menu that holds it cannot reach the control. */\r\n  --_mono-button-press-translate: var(--mono-button-press-translate, 0 1px);\r\n\r\n  /* The focus / invalid ring slot — `0 0 #0000` until a state sets it. Kept as a\r\n     slot so a variant can neutralise the resting shadow without ever writing\r\n     `box-shadow: none` (which would out-specify the ring). */\r\n  --_mono-button-ring: 0 0 #0000;\r\n\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  position: relative;\r\n  font-family: inherit;\r\n  user-select: none;\r\n  cursor: pointer;\r\n  text-decoration: none;\r\n  width: var(--_mono-button-width);\r\n  /* ALWAYS transparent — reserves the control's 1px border on the wrapper so\r\n     the wrapper matches the control's outer box. Not `--mono-button-border-color`:\r\n     that is declared HERE for the affix zones, and painting it would ring the\r\n     control twice. */\r\n  border: var(--mono-border-width) solid transparent;\r\n}\r\n\r\n/* A page-level `* { box-sizing: border-box }` reset does NOT cross a shadow\r\n   boundary; scoped here so the `<a>` form of an icon-only button measures the\r\n   same in both builds. */\r\n[mono-button],\r\n[mono-button] * {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* =========================================\r\n   The control\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/button.css .btn */\r\n/* basecoat@1.0.2 styles/vega.css .btn — mono: `--tw-ring-*` stack flattened to\r\n   the ring + shadow slots; the label font/transform are public knobs so a\r\n   flavor reaches the shadow build */\r\n[mono-button] > :is(button, a) {\r\n  --_mono-button-font-weight: var(--mono-button-font-weight, var(--mono-font-weight-medium));\r\n  --_mono-button-text-transform: var(--mono-button-text-transform, none);\r\n  --_mono-button-letter-spacing: var(--mono-button-letter-spacing, normal);\r\n\r\n  display: inline-flex;\r\n  flex-shrink: 0;\r\n  align-items: center;\r\n  justify-content: var(--_mono-button-justify);\r\n  width: var(--_mono-button-width);\r\n  position: relative;\r\n  white-space: nowrap;\r\n  user-select: none;\r\n  cursor: pointer;\r\n  text-decoration: none;\r\n  outline-style: none;\r\n  border-radius: var(--_mono-button-radius);\r\n  border: var(--mono-border-width) solid var(--_mono-button-border-color);\r\n  background-clip: padding-box;\r\n  background: var(--_mono-button-bg);\r\n  color: var(--_mono-button-color);\r\n  box-shadow: var(--_mono-button-ring), var(--_mono-button-shadow);\r\n  font-family: inherit;\r\n  font-size: var(--mono-text-sm);\r\n  line-height: var(--mono-text-sm--lh);\r\n  font-weight: var(--_mono-button-font-weight);\r\n  text-transform: var(--_mono-button-text-transform);\r\n  letter-spacing: var(--_mono-button-letter-spacing);\r\n  transition-property: all;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  /* focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 */\r\n  &:focus-visible {\r\n    border-color: var(--_mono-button-ring-color);\r\n    --_mono-button-ring: 0 0 0 var(--mono-ring-width) color-mix(in oklab, var(--_mono-button-ring-color) var(--mono-ring-alpha), transparent);\r\n  }\r\n\r\n  /* aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20\r\n     (dark: border /50, ring /40 — carried by the mode tokens) */\r\n  &[aria-invalid='true'] {\r\n    border-color: var(--mono-mode-invalid-border);\r\n    --_mono-button-ring: 0 0 0 var(--mono-ring-width) var(--mono-mode-invalid-ring);\r\n  }\r\n\r\n  /* active:not-aria-[haspopup]:translate-y-px */\r\n  &:active:not([aria-haspopup]):not([mono-disabled]):not(:disabled) {\r\n    translate: var(--_mono-button-press-translate);\r\n  }\r\n\r\n  /* disabled:pointer-events-none disabled:opacity-50 */\r\n  &:disabled,\r\n  &[mono-disabled] {\r\n    pointer-events: none;\r\n    opacity: 0.5;\r\n    cursor: not-allowed;\r\n  }\r\n\r\n  & svg,\r\n  & [mono-icon] {\r\n    pointer-events: none;\r\n    flex-shrink: 0;\r\n  }\r\n}\r\n\r\n/* Every Basecoat hover sits behind `@media (hover: hover)`: no sticky hover on touch. */\r\n@media (hover: hover) {\r\n  [mono-button] > :is(button, a):hover:not([mono-disabled]):not(:disabled) {\r\n    background: var(--_mono-button-hover-bg);\r\n    color: var(--_mono-button-hover-color);\r\n    border-color: var(--_mono-button-hover-border-color);\r\n    --_mono-button-shadow: var(--_mono-button-hover-shadow);\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Sizes — the control height IS the token (see tests/perf/field-heights)\r\n   ========================================= */\r\n\r\n/* The unqualified control carries the `md` metrics ON PURPOSE: hand-written\r\n   `<div mono-button>` markup that names no size renders exactly like `size=\"md\"`. */\r\n/* basecoat@1.0.2 styles/vega.css .btn:not([data-size]), .btn[data-size='default'] — h-9 gap-1.5 px-2.5 */\r\n[mono-button]:not([mono-icon-only]) > :is(button, a) {\r\n  --_mono-button-gap: var(--mono-button-md-gap, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-button-icon-padding: var(--mono-button-md-icon-padding, calc(var(--mono-spacing) * 2));\r\n  min-height: var(--mono-control-height-md);\r\n  padding-inline: var(--mono-button-md-padding-inline, calc(var(--mono-spacing) * 2.5));\r\n  padding-block: 0;\r\n  font-size: var(--mono-button-md-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-button-md-line-height, var(--mono-text-sm--lh));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-size='xs'] — h-6 gap-1 px-2 text-xs rounded-[min(var(--radius-md),8px)] */\r\n[mono-button][mono-size=\"xs\"] {\r\n  --_mono-button-radius-preset: var(--mono-button-xs-radius, min(var(--mono-radius-md), 8px));\r\n}\r\n[mono-button][mono-size=\"xs\"]:not([mono-icon-only]) > :is(button, a) {\r\n  --_mono-button-gap: var(--mono-button-xs-gap, var(--mono-spacing));\r\n  --_mono-button-icon-padding: var(--mono-button-xs-icon-padding, calc(var(--mono-spacing) * 1.5));\r\n  min-height: var(--mono-control-height-xs);\r\n  padding-inline: var(--mono-button-xs-padding-inline, calc(var(--mono-spacing) * 2));\r\n  font-size: var(--mono-button-xs-font-size, var(--mono-text-xs));\r\n  line-height: var(--mono-button-xs-line-height, var(--mono-text-xs--lh));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-size='sm'] — h-8 gap-1 px-2.5 rounded-[min(var(--radius-md),10px)] */\r\n[mono-button][mono-size=\"sm\"] {\r\n  --_mono-button-radius-preset: var(--mono-button-sm-radius, min(var(--mono-radius-md), 10px));\r\n}\r\n[mono-button][mono-size=\"sm\"]:not([mono-icon-only]) > :is(button, a) {\r\n  --_mono-button-gap: var(--mono-button-sm-gap, var(--mono-spacing));\r\n  --_mono-button-icon-padding: var(--mono-button-sm-icon-padding, calc(var(--mono-spacing) * 1.5));\r\n  min-height: var(--mono-control-height-sm);\r\n  padding-inline: var(--mono-button-sm-padding-inline, calc(var(--mono-spacing) * 2.5));\r\n  font-size: var(--mono-button-sm-font-size, var(--mono-button-md-font-size, var(--mono-text-sm)));\r\n  line-height: var(--mono-button-sm-line-height, var(--mono-button-md-line-height, var(--mono-text-sm--lh)));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-size='lg'] — h-10 gap-1.5 px-2.5 */\r\n[mono-button][mono-size=\"lg\"]:not([mono-icon-only]) > :is(button, a) {\r\n  --_mono-button-gap: var(--mono-button-lg-gap, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-button-icon-padding: var(--mono-button-lg-icon-padding, calc(var(--mono-spacing) * 2));\r\n  min-height: var(--mono-control-height-lg);\r\n  padding-inline: var(--mono-button-lg-padding-inline, calc(var(--mono-spacing) * 2.5));\r\n  font-size: var(--mono-button-lg-font-size, var(--mono-button-md-font-size, var(--mono-text-sm)));\r\n  line-height: var(--mono-button-lg-line-height, var(--mono-button-md-line-height, var(--mono-text-sm--lh)));\r\n}\r\n\r\n/* EXTENSION — xl / xxl continue the grid: h-11 gap-2 px-3 text-base, h-12 gap-2 px-4 text-lg */\r\n[mono-button][mono-size=\"xl\"]:not([mono-icon-only]) > :is(button, a) {\r\n  --_mono-button-gap: var(--mono-button-xl-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-button-icon-padding: var(--mono-button-xl-icon-padding, calc(var(--mono-spacing) * 2.5));\r\n  min-height: var(--mono-control-height-xl);\r\n  padding-inline: var(--mono-button-xl-padding-inline, calc(var(--mono-spacing) * 3));\r\n  font-size: var(--mono-button-xl-font-size, var(--mono-text-base));\r\n  line-height: var(--mono-button-xl-line-height, var(--mono-text-base--lh));\r\n}\r\n[mono-button][mono-size=\"xxl\"]:not([mono-icon-only]) > :is(button, a) {\r\n  --_mono-button-gap: var(--mono-button-xxl-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-button-icon-padding: var(--mono-button-xxl-icon-padding, calc(var(--mono-spacing) * 3));\r\n  min-height: var(--mono-control-height-xxl);\r\n  padding-inline: var(--mono-button-xxl-padding-inline, calc(var(--mono-spacing) * 4));\r\n  font-size: var(--mono-button-xxl-font-size, var(--mono-text-lg));\r\n  line-height: var(--mono-button-xxl-line-height, var(--mono-text-lg--lh));\r\n}\r\n\r\n/* has-[[data-icon='inline-start']]:pl-2 / has-[[data-icon='inline-end']]:pr-2\r\n   (xs/sm: 1.5). Our icon box is the first or last child of `[mono-content]`\r\n   depending on `icon-position`; `:not([mono-empty])` is the light /\r\n   shadow spelling of \"there is something in it\" — an icon OR the spinner that\r\n   replaces it, so both builds tighten the same side while loading. */\r\n[mono-button] > :is(button, a):has(> [mono-content] > [mono-icon]:first-child:not([mono-empty])) {\r\n  padding-left: var(--_mono-button-icon-padding);\r\n}\r\n[mono-button] > :is(button, a):has(> [mono-content] > [mono-icon]:last-child:not([mono-empty])) {\r\n  padding-right: var(--_mono-button-icon-padding);\r\n}\r\n\r\n/* Icon-only: a square of the control height.\r\n   basecoat@1.0.2 styles/vega.css .btn[data-size='icon'] — size-9 (md) */\r\n[mono-button][mono-icon-only] > :is(button, a) {\r\n  width: var(--mono-control-height-md);\r\n  height: var(--mono-control-height-md);\r\n  padding: 0;\r\n}\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-size='icon-xs'] — size-6 rounded-[min(var(--radius-md),8px)] */\r\n[mono-button][mono-icon-only][mono-size=\"xs\"] > :is(button, a) {\r\n  width: var(--mono-control-height-xs);\r\n  height: var(--mono-control-height-xs);\r\n}\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-size='icon-sm'] — size-8 rounded-[min(var(--radius-md),10px)] */\r\n[mono-button][mono-icon-only][mono-size=\"sm\"] > :is(button, a) {\r\n  width: var(--mono-control-height-sm);\r\n  height: var(--mono-control-height-sm);\r\n}\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-size='icon-lg'] — size-10 */\r\n[mono-button][mono-icon-only][mono-size=\"lg\"] > :is(button, a) {\r\n  width: var(--mono-control-height-lg);\r\n  height: var(--mono-control-height-lg);\r\n}\r\n/* EXTENSION — size-11 / size-12 */\r\n[mono-button][mono-icon-only][mono-size=\"xl\"] > :is(button, a) {\r\n  width: var(--mono-control-height-xl);\r\n  height: var(--mono-control-height-xl);\r\n}\r\n[mono-button][mono-icon-only][mono-size=\"xxl\"] > :is(button, a) {\r\n  width: var(--mono-control-height-xxl);\r\n  height: var(--mono-control-height-xxl);\r\n}\r\n\r\n/* =========================================\r\n   Content\r\n   ========================================= */\r\n\r\n[mono-button] [mono-content] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--_mono-button-gap, calc(var(--mono-spacing) * 1.5));\r\n  min-width: 0;\r\n  line-height: inherit;\r\n}\r\n\r\n[mono-button] [mono-text] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-width: 0;\r\n  position: relative;\r\n  transition: opacity var(--mono-duration) var(--mono-ease);\r\n}\r\n\r\n/* The icon box. `[&_svg:not([class*='size-'])]:size-4` (xs: size-3) — our\r\n   icons are UnoCSS `i-*` mask spans as often as SVGs, so the box itself is\r\n   sized and whatever is inside fills it. Every rule is scoped under\r\n   [mono-button] so a consumer's own [mono-icon] elsewhere is untouched. */\r\n[mono-button] [mono-icon] {\r\n  --_mono-button-icon-size: var(--mono-button-md-icon-size, var(--mono-button-icon-size, calc(var(--mono-spacing) * 4)));\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  flex: 0 0 auto;\r\n  width: var(--_mono-button-icon-size);\r\n  height: var(--_mono-button-icon-size);\r\n  line-height: 1;\r\n}\r\n\r\n[mono-button][mono-size=\"xs\"] [mono-icon] {\r\n  --_mono-button-icon-size: var(--mono-button-xs-icon-size, calc(var(--mono-spacing) * 3));\r\n}\r\n[mono-button][mono-icon-only]:is(:not([mono-size]), [mono-size=\"md\"]) [mono-icon] {\r\n  --_mono-button-icon-size: var(--mono-button-icononly-md-icon-size, var(--mono-button-md-icon-size, var(--mono-button-icon-size, calc(var(--mono-spacing) * 4))));\r\n}\r\n[mono-button][mono-size=\"sm\"] [mono-icon] {\r\n  --_mono-button-icon-size: var(--mono-button-sm-icon-size, var(--mono-button-icon-size, calc(var(--mono-spacing) * 4)));\r\n}\r\n[mono-button][mono-size=\"lg\"] [mono-icon] {\r\n  --_mono-button-icon-size: var(--mono-button-lg-icon-size, var(--mono-button-icon-size, calc(var(--mono-spacing) * 4)));\r\n}\r\n\r\n/* EXTENSION — the two larger steps get a size-5 glyph */\r\n[mono-button]:is([mono-size=\"xl\"], [mono-size=\"xxl\"]) [mono-icon] {\r\n  --_mono-button-icon-size: var(--mono-button-xl-icon-size, calc(var(--mono-spacing) * 5));\r\n}\r\n\r\n[mono-button] [mono-icon] > svg,\r\n[mono-button] [mono-icon] > span,\r\n[mono-button] [mono-icon] > * {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* The SHADOW build's icon arrives through a `<slot>`; `[mono-icon] > svg`\r\n   cannot reach assigned nodes. Inert in the light build. */\r\n[mono-button] [mono-icon] ::slotted(svg),\r\n[mono-button] [mono-icon] ::slotted(*) {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n[mono-button] [mono-icon][mono-hidden] {\r\n  display: none !important;\r\n}\r\n\r\n/* =========================================\r\n   Badge (mono extension; painted with the role tokens) — `mono-badge` takes the\r\n   `badge-color` value: red (default) | green | orange | cobalt\r\n   ========================================= */\r\n\r\n[mono-button] > :is(button, a) [mono-badge] {\r\n  position: absolute;\r\n  top: calc(var(--mono-spacing) * -1);\r\n  right: calc(var(--mono-spacing) * -1);\r\n  min-width: calc(var(--mono-spacing) * 5);\r\n  height: calc(var(--mono-spacing) * 5);\r\n  padding: 0 calc(var(--mono-spacing) * 1.5);\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border-radius: var(--mono-radius-full);\r\n  font-size: var(--mono-text-xs);\r\n  line-height: 1;\r\n  font-weight: var(--mono-font-weight-semibold);\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-button] [mono-badge]:is(:not([mono-badge=\"\"]), [mono-badge=\"red\"]):not([mono-badge=\"green\"]):not([mono-badge=\"orange\"]):not([mono-badge=\"cobalt\"]) {\r\n  background-color: var(--_mono-button-danger);\r\n  color: var(--_mono-button-danger-foreground);\r\n}\r\n\r\n[mono-button] [mono-badge=\"green\"] {\r\n  background-color: var(--_mono-button-success);\r\n  color: var(--_mono-button-success-foreground);\r\n}\r\n\r\n[mono-button] [mono-badge=\"orange\"] {\r\n  background-color: var(--_mono-button-warning);\r\n  color: var(--_mono-button-warning-foreground);\r\n}\r\n\r\n[mono-button] [mono-badge=\"cobalt\"] {\r\n  background-color: var(--_mono-button-primary);\r\n  color: var(--_mono-button-primary-foreground);\r\n}\r\n\r\n/* =========================================\r\n   Colours\r\n   -----------------------------------------\r\n   `mono-color` × `mono-variant` (solid | outline | tonal | text). Two kinds of\r\n   colour:\r\n\r\n     hues      primary success danger warning info teal purple dark\r\n               ink = the colour, fill = the colour, on-fill = `--<c>-foreground`\r\n     surfaces  secondary  (shadcn's muted surface — NOT a second brand hue)\r\n               light      (the page background)\r\n\r\n   Each hue publishes its palette into `--_mono-button-c*`, and ONE rule per\r\n   variant does the styling; the two layers set disjoint properties, so their\r\n   order does not matter. No attribute = the default (primary / solid).\r\n   ========================================= */\r\n\r\n[mono-button]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-button-c: var(--_mono-button-primary);\r\n  --_mono-button-c-foreground: var(--_mono-button-primary-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-primary-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-primary-soft-hover);\r\n}\r\n[mono-button][mono-color=\"success\"] {\r\n  --_mono-button-c: var(--_mono-button-success);\r\n  --_mono-button-c-foreground: var(--_mono-button-success-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-success-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-success-soft-hover);\r\n}\r\n[mono-button][mono-color=\"danger\"] {\r\n  --_mono-button-c: var(--_mono-button-danger);\r\n  --_mono-button-c-foreground: var(--_mono-button-danger-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-danger-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-danger-soft-hover);\r\n}\r\n[mono-button][mono-color=\"warning\"] {\r\n  --_mono-button-c: var(--_mono-button-warning);\r\n  --_mono-button-c-foreground: var(--_mono-button-warning-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-warning-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-warning-soft-hover);\r\n}\r\n[mono-button][mono-color=\"info\"] {\r\n  --_mono-button-c: var(--_mono-button-info);\r\n  --_mono-button-c-foreground: var(--_mono-button-info-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-info-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-info-soft-hover);\r\n}\r\n[mono-button][mono-color=\"teal\"] {\r\n  --_mono-button-c: var(--_mono-button-teal);\r\n  --_mono-button-c-foreground: var(--_mono-button-teal-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-teal-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-teal-soft-hover);\r\n}\r\n[mono-button][mono-color=\"purple\"] {\r\n  --_mono-button-c: var(--_mono-button-purple);\r\n  --_mono-button-c-foreground: var(--_mono-button-purple-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-purple-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-purple-soft-hover);\r\n}\r\n[mono-button][mono-color=\"dark\"] {\r\n  --_mono-button-c: var(--_mono-button-dark);\r\n  --_mono-button-c-foreground: var(--_mono-button-dark-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-dark-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-dark-soft-hover);\r\n}\r\n/* neutral — the mid grey with white ink (chip / card have it; the form demos'\r\n   Discard buttons used it and silently painted primary). */\r\n[mono-button][mono-color=\"neutral\"] {\r\n  --_mono-button-c: var(--_mono-button-neutral);\r\n  --_mono-button-c-foreground: var(--_mono-button-neutral-foreground);\r\n  --_mono-button-c-soft: var(--_mono-button-neutral-soft);\r\n  --_mono-button-c-soft-hover: var(--_mono-button-neutral-soft-hover);\r\n}\r\n\r\n/* ── solid ────────────────────────────────────────────────────────────── */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn:not([data-variant]), .btn[data-variant='primary']\r\n   — bg-primary text-primary-foreground hover:bg-primary/80, generalised per hue */\r\n[mono-button]:is(:not([mono-variant]), [mono-variant=\"solid\"]):is(:not([mono-color]), [mono-color=\"primary\"], [mono-color=\"success\"], [mono-color=\"danger\"], [mono-color=\"warning\"], [mono-color=\"info\"], [mono-color=\"teal\"], [mono-color=\"purple\"], [mono-color=\"dark\"], [mono-color=\"neutral\"]) {\r\n  --_mono-button-bg-preset: var(--_mono-button-c);\r\n  --_mono-button-color-preset: var(--_mono-button-c-foreground);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: color-mix(in oklab, var(--_mono-button-c) 80%, transparent);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-c-foreground);\r\n  --_mono-button-hover-border-color-preset: transparent;\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='secondary']\r\n   — bg-secondary text-secondary-foreground hover:bg-[color-mix(in oklch,var(--secondary),var(--foreground) 5%)] */\r\n[mono-button]:is(:not([mono-variant]), [mono-variant=\"solid\"])[mono-color=\"secondary\"] {\r\n  --_mono-button-bg-preset: var(--_mono-button-secondary);\r\n  --_mono-button-color-preset: var(--_mono-button-secondary-foreground);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: color-mix(in oklch, var(--_mono-button-secondary), var(--_mono-button-text) 5%);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-secondary-foreground);\r\n  --_mono-button-hover-border-color-preset: transparent;\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='outline']\r\n   — border-border bg-background shadow-xs hover:bg-muted hover:text-foreground\r\n     dark:border-input dark:bg-input/30 dark:hover:bg-input/50 (mode tokens) */\r\n[mono-button]:is(:not([mono-variant]), [mono-variant=\"solid\"])[mono-color=\"light\"] {\r\n  --_mono-button-bg-preset: var(--mono-button-outline-bg, var(--mono-mode-outline-bg));\r\n  --_mono-button-color-preset: var(--_mono-button-text);\r\n  --_mono-button-border-color-preset: var(--_mono-button-border);\r\n  --_mono-button-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-button-hover-bg-preset: var(--mono-button-outline-hover-bg, var(--mono-mode-surface-hover));\r\n  --_mono-button-hover-color-preset: var(--_mono-button-text);\r\n  --_mono-button-hover-border-color-preset: var(--_mono-button-border);\r\n  --_mono-button-hover-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n}\r\n\r\n/* ── outline ──────────────────────────────────────────────────────────── */\r\n\r\n/* EXTENSION — the outline pattern inked in the hue: border + label in the\r\n   colour, hover lays the tonal tint under it (Basecoat never inverts to a\r\n   solid fill on hover). */\r\n[mono-button][mono-variant=\"outline\"]:is(:not([mono-color]), [mono-color=\"primary\"], [mono-color=\"success\"], [mono-color=\"danger\"], [mono-color=\"warning\"], [mono-color=\"info\"], [mono-color=\"teal\"], [mono-color=\"purple\"], [mono-color=\"dark\"], [mono-color=\"neutral\"]) {\r\n  --_mono-button-bg-preset: transparent;\r\n  --_mono-button-color-preset: var(--_mono-button-c);\r\n  --_mono-button-border-color-preset: var(--_mono-button-c);\r\n  --_mono-button-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-button-hover-bg-preset: var(--_mono-button-c-soft);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-c);\r\n  --_mono-button-hover-border-color-preset: var(--_mono-button-c);\r\n  --_mono-button-hover-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-button-ring-color-preset: var(--_mono-button-c);\r\n}\r\n\r\n/* EXTENSION — outline on the two surfaces: the vendor outline with a neutral border */\r\n[mono-button][mono-variant=\"outline\"][mono-color=\"secondary\"] {\r\n  --_mono-button-bg-preset: transparent;\r\n  --_mono-button-color-preset: var(--_mono-button-secondary-foreground);\r\n  --_mono-button-border-color-preset: var(--_mono-button-border);\r\n  --_mono-button-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-button-hover-bg-preset: var(--_mono-button-secondary);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-secondary-foreground);\r\n  --_mono-button-hover-border-color-preset: var(--_mono-button-border);\r\n  --_mono-button-hover-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n}\r\n[mono-button][mono-variant=\"outline\"][mono-color=\"light\"] {\r\n  --_mono-button-bg-preset: transparent;\r\n  --_mono-button-color-preset: var(--_mono-button-text);\r\n  --_mono-button-border-color-preset: var(--_mono-button-border);\r\n  --_mono-button-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-button-hover-bg-preset: var(--mono-mode-surface-hover);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-text);\r\n  --_mono-button-hover-border-color-preset: var(--_mono-button-border);\r\n  --_mono-button-hover-shadow-preset: var(--mono-button-outline-shadow, var(--mono-shadow-xs));\r\n}\r\n\r\n/* ── tonal ────────────────────────────────────────────────────────────── */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='destructive']\r\n   — bg-destructive/10 text-destructive hover:bg-destructive/20\r\n     dark:bg-destructive/20 dark:hover:bg-destructive/30\r\n     focus-visible:border-destructive/40 focus-visible:ring-destructive/20\r\n   generalised per hue; the label keeps its colour so tonal never reads solid */\r\n[mono-button][mono-variant=\"tonal\"]:is(:not([mono-color]), [mono-color=\"primary\"], [mono-color=\"success\"], [mono-color=\"danger\"], [mono-color=\"warning\"], [mono-color=\"info\"], [mono-color=\"teal\"], [mono-color=\"purple\"], [mono-color=\"dark\"], [mono-color=\"neutral\"]) {\r\n  --_mono-button-bg-preset: var(--_mono-button-c-soft);\r\n  --_mono-button-color-preset: var(--_mono-button-c);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: var(--_mono-button-c-soft-hover);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-c);\r\n  --_mono-button-hover-border-color-preset: transparent;\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n  --_mono-button-ring-color-preset: var(--_mono-button-c);\r\n}\r\n[mono-button][mono-variant=\"tonal\"]:is(:not([mono-color]), [mono-color=\"primary\"], [mono-color=\"success\"], [mono-color=\"danger\"], [mono-color=\"warning\"], [mono-color=\"info\"], [mono-color=\"teal\"], [mono-color=\"purple\"], [mono-color=\"dark\"], [mono-color=\"neutral\"]) > :is(button, a):focus-visible {\r\n  border-color: color-mix(in oklab, var(--_mono-button-c) 40%, transparent);\r\n  --_mono-button-ring: 0 0 0 var(--mono-ring-width) color-mix(in oklab, var(--_mono-button-c) var(--_mono-button-tint-hover), transparent);\r\n}\r\n\r\n/* EXTENSION — tonal on the surfaces: the secondary / muted fill, hover at 80% */\r\n[mono-button][mono-variant=\"tonal\"][mono-color=\"secondary\"] {\r\n  --_mono-button-bg-preset: var(--_mono-button-secondary);\r\n  --_mono-button-color-preset: var(--_mono-button-secondary-foreground);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: color-mix(in oklab, var(--_mono-button-secondary) 80%, transparent);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-secondary-foreground);\r\n  --_mono-button-hover-border-color-preset: transparent;\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n}\r\n[mono-button][mono-variant=\"tonal\"][mono-color=\"light\"] {\r\n  --_mono-button-bg-preset: var(--_mono-button-muted);\r\n  --_mono-button-color-preset: var(--_mono-button-text);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: color-mix(in oklab, var(--_mono-button-muted) 80%, transparent);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-text);\r\n  --_mono-button-hover-border-color-preset: transparent;\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* ── text (ghost) ─────────────────────────────────────────────────────── */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost']\r\n   — hover:bg-muted hover:text-foreground dark:hover:bg-muted/50\r\n   generalised: a hue keeps its ink and hovers onto its own tint. The two\r\n   `--mono-button-plain-*` reads are public knobs a flavor sets (Material's\r\n   wash-only hover); they must stay literal `var(--mono-button-…)` here. */\r\n[mono-button][mono-variant=\"text\"]:is(:not([mono-color]), [mono-color=\"primary\"], [mono-color=\"success\"], [mono-color=\"danger\"], [mono-color=\"warning\"], [mono-color=\"info\"], [mono-color=\"teal\"], [mono-color=\"purple\"], [mono-color=\"dark\"], [mono-color=\"neutral\"]) {\r\n  --_mono-button-bg-preset: transparent;\r\n  --_mono-button-color-preset: var(--_mono-button-c);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: var(--mono-button-plain-hover-bg, var(--_mono-button-c-soft));\r\n  --_mono-button-hover-color-preset: var(--_mono-button-c);\r\n  --_mono-button-hover-border-color-preset: var(--mono-button-plain-hover-border-color, transparent);\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n}\r\n/* ghost verbatim for the two surfaces */\r\n[mono-button][mono-variant=\"text\"]:is([mono-color=\"secondary\"], [mono-color=\"light\"]) {\r\n  --_mono-button-bg-preset: transparent;\r\n  --_mono-button-color-preset: var(--_mono-button-text);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: var(--mono-button-plain-hover-bg, var(--mono-mode-ghost-hover));\r\n  --_mono-button-hover-color-preset: var(--_mono-button-text);\r\n  --_mono-button-hover-border-color-preset: var(--mono-button-plain-hover-border-color, transparent);\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* A text button has no chrome to anchor the focus ring against, so it also\r\n   takes its hover look on keyboard focus — the ring still draws on top. */\r\n[mono-button][mono-variant=\"text\"] > :is(button, a):focus-visible {\r\n  background: var(--_mono-button-hover-bg);\r\n  color: var(--_mono-button-hover-color);\r\n}\r\n\r\n/* Pressing a text button carries it one rung further, onto the hover tint. */\r\n[mono-button][mono-variant=\"text\"]:is(:not([mono-color]), [mono-color=\"primary\"], [mono-color=\"success\"], [mono-color=\"danger\"], [mono-color=\"warning\"], [mono-color=\"info\"], [mono-color=\"teal\"], [mono-color=\"purple\"], [mono-color=\"dark\"], [mono-color=\"neutral\"]) > :is(button, a):active:not([mono-disabled]):not(:disabled) {\r\n  background: var(--_mono-button-c-soft-hover);\r\n}\r\n\r\n/* =========================================\r\n   Special types\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='link'] — text-primary underline-offset-4 hover:underline */\r\n[mono-button][mono-link] > :is(button, a) {\r\n  --_mono-button-bg-preset: transparent;\r\n  --_mono-button-color-preset: var(--_mono-button-primary);\r\n  --_mono-button-border-color-preset: transparent;\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: transparent;\r\n  --_mono-button-hover-color-preset: var(--_mono-button-primary);\r\n  --_mono-button-hover-border-color-preset: transparent;\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n  text-underline-offset: 4px;\r\n  text-decoration-line: var(--mono-button-link-decoration, none);\r\n}\r\n@media (hover: hover) {\r\n  [mono-button][mono-link] > :is(button, a):hover {\r\n    text-decoration-line: underline;\r\n  }\r\n}\r\n\r\n/* EXTENSION — dashed: the outline surface with a dashed edge, primary ink */\r\n[mono-button][mono-dashed] > :is(button, a) {\r\n  --_mono-button-bg-preset: var(--mono-mode-outline-bg);\r\n  --_mono-button-color-preset: var(--_mono-button-primary);\r\n  --_mono-button-border-color-preset: var(--_mono-button-border);\r\n  --_mono-button-shadow-preset: 0 0 #0000;\r\n  --_mono-button-hover-bg-preset: var(--_mono-button-primary-soft);\r\n  --_mono-button-hover-color-preset: var(--_mono-button-primary);\r\n  --_mono-button-hover-border-color-preset: var(--_mono-button-primary);\r\n  --_mono-button-hover-shadow-preset: 0 0 #0000;\r\n  border-style: dashed;\r\n}\r\n\r\n/* EXTENSION — glass: a translucent white surface for painted backgrounds */\r\n[mono-button][mono-glass] > :is(button, a) {\r\n  --_mono-button-bg-preset: color-mix(in oklab, white 18%, transparent);\r\n  --_mono-button-color-preset: white;\r\n  --_mono-button-border-color-preset: color-mix(in oklab, white 30%, transparent);\r\n  --_mono-button-shadow-preset: var(--mono-shadow-md);\r\n  --_mono-button-hover-bg-preset: color-mix(in oklab, white 28%, transparent);\r\n  --_mono-button-hover-color-preset: white;\r\n  --_mono-button-hover-border-color-preset: color-mix(in oklab, white 50%, transparent);\r\n  --_mono-button-hover-shadow-preset: var(--mono-shadow-lg);\r\n  backdrop-filter: blur(10px);\r\n}\r\n\r\n/* =========================================\r\n   Rounded — one prop for corners, on the Basecoat radius ladder\r\n   -----------------------------------------\r\n   Sets the PRESET rather than `border-radius`, so a consumer's own\r\n   `--mono-button-radius` still wins without anything here needing\r\n   `!important`. Steps map onto Basecoat's ladder: xs = radius-sm … xxl = 4xl.\r\n   ========================================= */\r\n\r\n[mono-button][mono-rounded=\"none\"] { --_mono-button-radius-preset: 0; }\r\n[mono-button][mono-rounded=\"xs\"] { --_mono-button-radius-preset: var(--mono-radius-sm); }\r\n[mono-button][mono-rounded=\"sm\"] { --_mono-button-radius-preset: var(--mono-radius-md); }\r\n[mono-button][mono-rounded=\"md\"] { --_mono-button-radius-preset: var(--mono-radius-lg); }\r\n[mono-button][mono-rounded=\"lg\"] { --_mono-button-radius-preset: var(--mono-radius-xl); }\r\n[mono-button][mono-rounded=\"xl\"] { --_mono-button-radius-preset: var(--mono-radius-2xl); }\r\n[mono-button][mono-rounded=\"xxl\"] { --_mono-button-radius-preset: var(--mono-radius-4xl); }\r\n[mono-button][mono-rounded=\"full\"] { --_mono-button-radius-preset: var(--mono-radius-full); }\r\n\r\n/* =========================================\r\n   Loading\r\n   ========================================= */\r\n\r\n[mono-button][mono-loading] > :is(button, a) {\r\n  position: relative;\r\n  pointer-events: none;\r\n  opacity: 0.85;\r\n}\r\n\r\n/* `pending` = self-driven loading that is still only WAITING (the debounce\r\n   timer or the throttle queue). Clicks are let back through on purpose: a\r\n   debounce has to SEE the repeat clicks to reset its timer. */\r\n[mono-button][mono-loading][mono-pending] > :is(button, a) {\r\n  pointer-events: auto;\r\n  cursor: not-allowed;\r\n  opacity: 0.5;\r\n}\r\n\r\n/* ── The spinner — drawn INSIDE the icon box, so it replaces the icon, follows\r\n   `icon-position`, and cannot change the button's height (the box was already\r\n   reserved; tests/perf/field-heights asserts exactly that). ── */\r\n\r\n[mono-button] [mono-icon][mono-spinning] > *,\r\n[mono-button] [mono-icon][mono-spinning] ::slotted(*) {\r\n  visibility: hidden;\r\n}\r\n\r\n/* A button with no icon still reserves the box while spinning; `mono-empty`\r\n   collapses it the rest of the time (the shadow build marks an unassigned slot\r\n   the same way — icon and affix zones alike). */\r\n[mono-button] [mono-icon][mono-empty],\r\n[mono-button] [mono-affix][mono-empty] {\r\n  display: none;\r\n}\r\n\r\n[mono-button] [mono-icon][mono-spinning] {\r\n  position: relative;\r\n}\r\n\r\n[mono-button] [mono-icon][mono-spinning]::after {\r\n  content: '';\r\n  position: absolute;\r\n  inset: 0;\r\n  border: 2px solid currentColor;\r\n  border-right-color: transparent;\r\n  border-radius: 50%;\r\n  animation: mono-button-spin 0.65s linear infinite;\r\n}\r\n\r\n[mono-button]:is([mono-size=\"xs\"], [mono-size=\"sm\"]) [mono-icon][mono-spinning]::after {\r\n  border-width: 1.5px;\r\n}\r\n\r\n@keyframes mono-button-spin {\r\n  to {\r\n    transform: rotate(360deg);\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Sizing — width/height set on the host; `sized` makes the wrapper + control\r\n   fill it. Icon-only is included so a fixed square (a FAB) works.\r\n   ========================================= */\r\n\r\n[mono-button][mono-sized] {\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n[mono-button][mono-sized] > :is(button, a) {\r\n  width: 100%;\r\n  height: 100%;\r\n  flex: 1;\r\n  justify-content: center;\r\n}\r\n\r\n.sr-only {\r\n  position: absolute;\r\n  width: 1px;\r\n  height: 1px;\r\n  padding: 0;\r\n  margin: -1px;\r\n  overflow: hidden;\r\n  clip: rect(0, 0, 0, 0);\r\n  white-space: nowrap;\r\n  border-width: 0;\r\n}\r\n\r\n/* =========================================\r\n   Media\r\n   ========================================= */\r\n\r\n@media (prefers-contrast: high) {\r\n  [mono-button] > :is(button, a) {\r\n    border-width: 2px;\r\n  }\r\n\r\n  /* Outline, tonal and text are low-contrast by design — force a solid fill in\r\n     the hue. `light` / `secondary` have no hue to fill with. */\r\n  [mono-button]:is([mono-variant=\"outline\"], [mono-variant=\"tonal\"], [mono-variant=\"text\"]):is(:not([mono-color]), [mono-color=\"primary\"], [mono-color=\"success\"], [mono-color=\"danger\"], [mono-color=\"warning\"], [mono-color=\"info\"], [mono-color=\"teal\"], [mono-color=\"purple\"], [mono-color=\"dark\"], [mono-color=\"neutral\"]) > :is(button, a) {\r\n    background: var(--_mono-button-c);\r\n    color: var(--_mono-button-c-foreground);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-button] > :is(button, a) {\r\n    transition: none;\r\n  }\r\n\r\n  [mono-button] > :is(button, a):active {\r\n    translate: none;\r\n  }\r\n\r\n  [mono-button] [mono-icon][mono-spinning]::after {\r\n    animation: none;\r\n  }\r\n}\r\n\r\n/* =========================================================================\r\n   Prepend / append affixes  ≡  .button-group siblings\r\n   -------------------------------------------------------------------------\r\n   `slot=\"prepend\"` / `slot=\"append\"` render as `[mono-affix]` SIBLINGS of the native control,\r\n   never inside it (a `<button>` may not contain interactive content). The zones\r\n   paint themselves from the same `--_mono-button-*` variables the control\r\n   uses — which is why the colour rules above declare them on the ROOT.\r\n   ========================================================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .button-group > :is(span, label, output) — display:flex items-center */\r\n[mono-button] > [mono-affix] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  flex: 0 0 auto;\r\n  align-self: stretch;\r\n  box-sizing: border-box;\r\n  background: var(--_mono-button-bg);\r\n  color: var(--_mono-button-color);\r\n  border: var(--mono-border-width) solid var(--_mono-button-border-color);\r\n  padding: 0 var(--mono-button-md-padding-inline, calc(var(--mono-spacing) * 2.5));\r\n  gap: var(--mono-spacing);\r\n  line-height: 1;\r\n  cursor: pointer;\r\n}\r\n\r\n/* The light build re-appends slotted nodes into a `[data-mono-slot]` element;\r\n   blockify it so an inline icon span actually renders its box. */\r\n[mono-button] > [mono-affix] > [data-mono-slot] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n}\r\n\r\n/* basecoat@1.0.2 components/button-group.css .button-group — the group shares\r\n   ONE ring: `*:not(:first-child)` squares its start corners and drops its start\r\n   border, `*:not(:last-child)` squares its end corners.\r\n   `:not([mono-empty])` is load-bearing: the SHADOW build always renders the\r\n   zone (its `<slot>` must stay in the tree) and marks it `mono-empty`; `:has()`\r\n   matches on presence, which `display: none` does not undo. */\r\n[mono-button]:has(> [mono-affix=\"prepend\"]:not([mono-empty])) > :is(button, a) {\r\n  border-start-start-radius: 0;\r\n  border-end-start-radius: 0;\r\n  border-inline-start-width: 0;\r\n}\r\n\r\n[mono-button]:has(> [mono-affix=\"append\"]:not([mono-empty])) > :is(button, a) {\r\n  border-start-end-radius: 0;\r\n  border-end-end-radius: 0;\r\n  border-inline-end-width: 0;\r\n}\r\n\r\n[mono-button] > [mono-affix=\"prepend\"] {\r\n  border-start-start-radius: var(--_mono-button-radius);\r\n  border-end-start-radius: var(--_mono-button-radius);\r\n  border-start-end-radius: 0;\r\n  border-end-end-radius: 0;\r\n  border-inline-end-width: 0;\r\n}\r\n\r\n[mono-button] > [mono-affix=\"append\"] {\r\n  border-start-end-radius: var(--_mono-button-radius);\r\n  border-end-end-radius: var(--_mono-button-radius);\r\n  border-start-start-radius: 0;\r\n  border-end-start-radius: 0;\r\n  border-inline-start-width: 0;\r\n}\r\n\r\n/* ── The divider — `hr[role='separator']`: restores the one edge the rules\r\n   above removed, single-width, the ring's own colour. */\r\n[mono-button] > [mono-affix=\"prepend\"][mono-divider] {\r\n  border-inline-end-width: var(--mono-border-width);\r\n}\r\n\r\n[mono-button] > [mono-affix=\"append\"][mono-divider] {\r\n  border-inline-start-width: var(--mono-border-width);\r\n}\r\n\r\n[mono-button] > [mono-affix][mono-disabled] {\r\n  opacity: 0.5;\r\n  cursor: not-allowed;\r\n  pointer-events: none;\r\n}\r\n\r\n/* Per-size padding, mirroring the control's own steps. */\r\n[mono-button][mono-size=\"xs\"] > [mono-affix] { padding: 0 var(--mono-button-xs-padding-inline, calc(var(--mono-spacing) * 2)); }\r\n[mono-button][mono-size=\"sm\"] > [mono-affix] { padding: 0 var(--mono-button-sm-padding-inline, calc(var(--mono-spacing) * 2.5)); }\r\n[mono-button][mono-size=\"lg\"] > [mono-affix] { padding: 0 var(--mono-button-lg-padding-inline, calc(var(--mono-spacing) * 2.5)); }\r\n[mono-button][mono-size=\"xl\"] > [mono-affix] { padding: 0 var(--mono-button-xl-padding-inline, calc(var(--mono-spacing) * 3)); }\r\n[mono-button][mono-size=\"xxl\"] > [mono-affix] { padding: 0 var(--mono-button-xxl-padding-inline, calc(var(--mono-spacing) * 4)); }\r\n";
//#endregion
//#region src/components/button/mono-button.shadow.ts
var SHADOW_EXTRA_CSS = "";
var MonoButtonShadow = class MonoButtonShadow extends withShadowUtilityStyles(MonoButtonCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(button_default, {
			host: "mono-button",
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
		this._hasIcon = this._slotHasContent(this._iconSlot());
		this._hasPrepend = this._slotHasContent(this._affixSlot("prepend"));
		this._hasAppend = this._slotHasContent(this._affixSlot("append"));
	}
	updated(changed) {
		super.updated?.(changed);
		if (!isServer) this._applyHostSize();
	}
	_iconSlot() {
		return this.renderRoot.querySelector("slot[name=\"icon\"]");
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	/**
	* An affix zone. Unlike the light build's conditional target, the wrapper is
	* ALWAYS rendered here: the native `<slot>` has to exist for DSD to project
	* into it and for the scan to see it, so emptiness is a `?data-empty`
	* attribute the shadow-only CSS hides — the same shape the icon region uses.
	*
	* `stopPropagation` on `click` / `mno-click` keeps a nested control's own
	* click from surfacing as this button's action (a split button's caret must
	* not run the button's `@click`); see the light build's `_guardAffixEvents`.
	*/
	_renderAffix(name) {
		const has = name === "prepend" ? this._hasPrepend : this._hasAppend;
		return html`<span
      class=${[
			`button-${name}`,
			this._affix(name).divider ? "has-divider" : "",
			this._affixDisabled(name) ? "disabled" : "",
			this.cssClass?.[name] ?? ""
		].filter(Boolean).join(" ")}
      mono-affix=${name}
      ?mono-divider=${Boolean(this._affix(name).divider)}
      ?mono-disabled=${this._affixDisabled(name)}
      ?mono-empty=${!has}
      @click=${(e) => e.stopPropagation()}
      @mno-click=${(e) => e.stopPropagation()}
      @mnoClick=${(e) => e.stopPropagation()}
    >
      <slot
        name=${name}
        @slotchange=${(e) => this._onAffixSlotChange(name, e)}
      ></slot>
    </span>`;
	}
	_affixSlot(name) {
		return this.renderRoot.querySelector("slot[name=\"" + name + "\"]");
	}
	_onAffixSlotChange(name, event) {
		const has = this._slotHasContent(event.target);
		if (name === "prepend") this._hasPrepend = has;
		else this._hasAppend = has;
	}
	_onIconSlotChange(event) {
		this._hasIcon = this._slotHasContent(event.target);
	}
	/** Host sizing (client-only; mirrors the light build's `_applyHostSize`). */
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
	_renderBadge() {
		if (!this.badge) return nothing;
		return html`<span class=${this._badgeClass} mono-badge=${this._badgeColor}>${this.badge}</span>`;
	}
	/**
	* The icon box, which is also where the spinner is drawn.
	*
	* `spinning` paints the ring and hides the slotted icon; `data-empty` collapses the box when
	* there is neither. Matches the light build exactly — the two used to differ here, with light
	* keeping the span and shadow unmounting it.
	*/
	_iconSpan() {
		return html`
      <span class=${[this._cls("button-icon", "icon"), this._showsSpinner ? "spinning" : ""].filter(Boolean).join(" ")} mono-icon ?mono-spinning=${this._showsSpinner} ?mono-empty=${!this._hasIcon && !this._showsSpinner}>
        <slot name="icon" @slotchange=${(e) => this._onIconSlotChange(e)}></slot>
      </span>
    `;
	}
	_renderIconOnlyContent() {
		return html`
      ${this._iconSpan()}
      ${this._renderBadge()}
    `;
	}
	_renderNormalContent() {
		const contentBase = this.iconPosition === "right" ? "button-content icon-right" : "button-content icon-left";
		const contentClass = this._cls(contentBase, "content");
		const textClass = this._cls("button-text", "text");
		return html`
      <div class=${contentClass} mono-content>
        ${this.iconPosition === "left" ? this._iconSpan() : nothing}
        <span class=${textClass} mono-text><slot></slot></span>
        ${this.iconPosition === "right" ? this._iconSpan() : nothing}
      </div>

      ${this._renderBadge()}
    `;
	}
	_renderContent() {
		return this._isIconOnlyLike ? this._renderIconOnlyContent() : this._renderNormalContent();
	}
	render() {
		const isDisabled = this._isBlocked;
		const isInert = this._isInert;
		const sizeStyle = styleMap(this._sizeStyle());
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
        `, sizeStyle);
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
      `, sizeStyle);
	}
};
MonoButtonShadow = __decorate([customElement("mono-shadow-button")], MonoButtonShadow);
//#endregion
export { button_default as n, MonoButtonCore as r, MonoButtonShadow as t };
