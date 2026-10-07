import { _ as monoPendingActive, a as __decorate, c as defineHybridPropAlias, f as customElement, l as defineHybridPropAliases, m as monoApplyPhantomOptions, n as adoptIconStyles, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration, u as numberStringConverter, v as monoPendingGrace, y as monoPhantomOptions } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { t as isIconifyClass } from "../../icon-CJkTlmTb.js";
import { n as cssPart } from "../../css-class-BRKRzHx-.js";
import { t as buildSizeStyle } from "../../css-size-DhHSVZJK.js";
import { n as detachEventHandlers, t as applyProps } from "../../element-props-CLB6yvbm.js";
import { t as input_default } from "../../input-zGOULADt.js";
import { t as PopupPortalController } from "../../popup-portal-BziRX1yG.js";
import { _ as resolveSearchEntries, d as expandWildcard, g as plainSearchColumns, h as normalizeSearchExpr, m as isWildcardPattern, o as mergeSearchFields } from "../../reactive-BHsqVjRh.js";
import { a as normalizeError, c as buildDateTree, d as seedFromRanges, f as setAllChecked, i as errorStatus, l as checkState, n as DEFAULT_ERROR_MESSAGES, o as resolveErrorMessages, p as setChecked, r as describeError, s as setErrorMessages, t as monoDataGrid, u as minimize } from "../../mono-data-grid-CLBK8clE.js";
import { n as captureLightSlots, r as placeLightSlots } from "../../light-slots-BVJwyg_2.js";
import { t as checkbox_default } from "../../checkbox-Cqpie9Ap.js";
import { a as buildGroups, c as isGroupNode, o as collectGroupPaths, s as flattenLeaves } from "../../data-source-read-CUX-lgrQ.js";
import { h as monoArraySource } from "../../data-source-options-BTpfrOZ_.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/table/table-controller-core.ts
/**
* `MonoTableControllerCore` — the render-mode-agnostic plumbing shared by every
* `mono-table-*` element: the `dataGrid` controller property (bound via Vue
* `.prop`, so `attribute: false`), its hybrid alias, and the
* subscribe/unsubscribe lifecycle that re-renders the element whenever the
* controller notifies.
*
* The six per-element cores compose this base, so their light/shadow wrappers
* only ever call `MonoTable<El>Core(LitElement)`. Elements needing extra
* lifecycle work (e.g. `mono-table-paging-group` registers/clears group paging)
* override the lifecycle methods and chain `super.*` to keep this plumbing.
*
* SSR-safe: holds no `document`/`window` access. `dataGrid` is undefined on the
* server (a `.prop` binding can't cross Declarative Shadow DOM), so `_subscribe`
* is a no-op there and the element renders its deterministic empty shell.
*/
var MonoTableControllerCore = (superClass) => {
	class MonoTableControllerCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this._applyQueued = false;
			defineHybridPropAliases(this, ["dataGrid"]);
			defineHybridPropAlias(this, "controlTable", "dataGrid");
		}
		static {
			this.monoPendingAuto = "data";
		}
		static {
			this.monoPendingDraw = "css";
		}
		/** "First load done" for the automatic `pending` (re-checked on every controller notify). */
		_monoPendingReady() {
			const grid = this.dataGrid;
			if (!grid) return monoPendingGrace(this);
			if (grid.hasLoaded || grid.error) return true;
			return monoPendingGrace(this) && !grid.loading;
		}
		connectedCallback() {
			super.connectedCallback();
			this._subscribe();
		}
		disconnectedCallback() {
			this._off?.();
			this._off = void 0;
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			if (changed.has("dataGrid")) this._subscribe();
			super.willUpdate?.(changed);
		}
		_subscribe() {
			this._off?.();
			detachEventHandlers(this);
			this._off = this.dataGrid?.subscribe(() => {
				this._scheduleApplyProps();
				this.requestUpdate();
			});
			this._scheduleApplyProps();
		}
		/**
		* Drive the apply from `update()` as well as `_subscribe()`.
		*
		* `mono-table-paging` and `mono-table-loading` REPLACE `_subscribe` without
		* chaining `super`, so hanging the apply off that alone silently skipped
		* them — and the next core to override it would break the same way. Every
		* element still reaches `update()` (nothing overrides it), and those cores
		* call `requestUpdate()` on notify, so this path always runs.
		*/
		update(changed) {
			this._scheduleApplyProps();
			super.update(changed);
		}
		/**
		* Deferred + de-duplicated: the apply writes reactive props, and doing that
		* inside the update cycle would trip Lit's change-in-update warning.
		*/
		_scheduleApplyProps() {
			if (this._applyQueued) return;
			if (typeof queueMicrotask !== "function") {
				this._applyControllerProps();
				return;
			}
			this._applyQueued = true;
			queueMicrotask(() => {
				this._applyQueued = false;
				this._applyControllerProps();
			});
		}
		/**
		* Pull this element's slice of `monoDataGrid({ props })` onto itself.
		*
		* The CONTROLLER WINS for keys it declares (matching `monoForm`'s `setProp`);
		* keys it doesn't mention are left to whatever the template set. Every write
		* is equality-guarded so a sync can't trigger another update cycle.
		*/
		_applyControllerProps() {
			const slot = this._propsSlot;
			const grid = this.dataGrid;
			if (!slot || !grid?.props) return;
			const all = grid.props();
			let patch;
			if (slot === "th" || slot === "sort" || slot === "summary") {
				const field = this.field;
				if (!field) return;
				const col = (all.th ?? []).find((c) => c.field === field);
				if (!col) return;
				if (slot === "th") {
					const { summary: _s, ...rest } = col;
					patch = rest;
				} else {
					const sub = col[slot];
					if (!sub) return;
					patch = {
						field,
						...sub
					};
				}
			} else patch = all[slot];
			applyProps(this, patch);
		}
	}
	__decorate([property({ attribute: false })], MonoTableControllerCoreClass.prototype, "dataGrid", void 0);
	return MonoTableControllerCoreClass;
};
//#endregion
//#region src/components/table/mono-table-search-core.ts
/**
* `MonoTableSearchCore` — render-mode-agnostic logic for `mono-table-search`: a
* debounced search box wired to the controller.
*
* It renders **`mono-input`'s markup and class names** (`.mono-input` →
* `.mono-input-field` → `.mono-input-native`) rather than a bespoke box, so the
* whole size × color × variant matrix in `input.css` applies verbatim and a
* search sitting beside a `<mono-input>` in a toolbar matches it exactly. That is
* also why the prop names, attribute names and converters below mirror
* `input-core.ts` — markup is portable between the two elements.
*
* Deliberately NOT taken from `InputProps`: `type` (pinned to `search`),
* `required` / `pattern` / `min` / `max` / `step` (form-submit constraints with no
* meaning for a filter), and `value` / `modelValue` — the debounce below plus the
* controller own the search term.
*
* The magnifier and clear glyphs are delegated to `renderIcon()` (light: UnoCSS
* `.mono-icon i-mdi-*`; shadow: inline SVG) so the chrome is otherwise identical.
*/
var MonoTableSearchCore = (superClass) => {
	class MonoTableSearchCoreClass extends MonoTableControllerCore(superClass) {
		constructor(...args) {
			super(...args);
			this._propsSlot = "search";
			this.searchValue = "";
			this.searchExpr = "";
			this.placeholder = "Search…";
			this.disabled = false;
			this.debounce = 300;
			this.noIcon = false;
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.readonly = false;
			this.clearable = false;
			this.autofocus = false;
			this.label = "";
			this.helperText = "";
			this.validationState = "default";
			this.validationMessage = "";
			this.error = false;
			this.errorMessage = "";
			this.success = false;
			this.successMessage = "";
			this.name = "";
			this.autocomplete = "";
			this.inputmode = "";
			this.cssClass = {};
			this.cssClassName = "";
			this.suggestion = false;
			this.multiContext = false;
			this.suggestionTemplate = "Search {caption} for: {term}";
			this.allFieldsLabel = "All fields";
			this.maxChips = 1;
			this.moreLabel = "See All";
			this.filterLabel = "Filter";
			this._value = "";
			this._chips = [];
			this._open = false;
			this._activeIndex = 0;
			this._zone = "input";
			this._moreOpen = false;
			this._chipsDragging = false;
			this._filterSlotted = false;
			this._filterOpen = false;
			this._filterChip = null;
			this._tabHeld = false;
			this._tabConsumed = false;
			this._chipsDragId = null;
			this._chipsDragStartX = 0;
			this._chipsDragStartScroll = 0;
			this._chipsDragMoved = false;
			this._onChipsPointerDown = (e) => {
				if (e.button !== 0) return;
				const strip = e.currentTarget;
				if (strip.scrollWidth <= strip.clientWidth) return;
				if (e.target.closest("button")) return;
				this._chipsDragId = e.pointerId;
				this._chipsDragStartX = e.clientX;
				this._chipsDragStartScroll = strip.scrollLeft;
				this._chipsDragMoved = false;
				try {
					strip.setPointerCapture?.(e.pointerId);
				} catch {}
				strip.addEventListener("pointermove", this._onChipsPointerMove);
				strip.addEventListener("pointerup", this._onChipsPointerUp);
				strip.addEventListener("pointercancel", this._onChipsPointerUp);
			};
			this._onChipsPointerMove = (e) => {
				if (e.pointerId !== this._chipsDragId) return;
				const strip = e.currentTarget;
				const dx = e.clientX - this._chipsDragStartX;
				if (!this._chipsDragMoved) {
					if (Math.abs(dx) < 5) return;
					this._chipsDragMoved = true;
					this._chipsDragging = true;
				}
				strip.scrollLeft = this._chipsDragStartScroll - dx;
				e.preventDefault();
			};
			this._onChipsPointerUp = (e) => {
				const strip = e.currentTarget;
				if (e.pointerId === this._chipsDragId) try {
					if (strip.hasPointerCapture?.(e.pointerId)) strip.releasePointerCapture?.(e.pointerId);
				} catch {}
				strip.removeEventListener("pointermove", this._onChipsPointerMove);
				strip.removeEventListener("pointerup", this._onChipsPointerUp);
				strip.removeEventListener("pointercancel", this._onChipsPointerUp);
				this._chipsDragId = null;
				if (this._chipsDragMoved) {
					this._detachChipsSwallow();
					const swallow = (ev) => {
						ev.preventDefault();
						ev.stopPropagation();
						this._chipsDragMoved = false;
						this._chipsDragging = false;
						this._detachChipsSwallow();
					};
					this._chipsSwallow = {
						strip,
						fn: swallow
					};
					strip.addEventListener("click", swallow, true);
				} else this._chipsDragging = false;
			};
			this._chipsSwallow = null;
			this._onKeydown = (e) => {
				if (e.key === "Escape" && this._filterOpen && !this._open) {
					e.preventDefault();
					this._closeFilter();
					return;
				}
				if (e.key === "Escape" && this._moreOpen && !this._open) {
					e.preventDefault();
					this._closeMore();
					return;
				}
				if (!this._open) return;
				if (e.key === "Escape") {
					e.preventDefault();
					this._closePanel();
					return;
				}
				if (e.key === "Tab") {
					e.preventDefault();
					if (!e.repeat) {
						this._tabHeld = true;
						this._tabConsumed = false;
					}
					return;
				}
				if (this._tabHeld && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
					e.preventDefault();
					this._tabConsumed = true;
					this._zone = e.key === "ArrowDown" ? "list" : "input";
					return;
				}
				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
					if (this._zone !== "list") return;
					e.preventDefault();
					const n = this._suggestions().length;
					if (!n) return;
					const step = e.key === "ArrowDown" ? 1 : -1;
					this._activeIndex = (this._activeIndex + step + n) % n;
					return;
				}
				if (e.key === "Enter") {
					e.preventDefault();
					this._acceptActive();
				}
			};
			this._onKeyup = (e) => {
				if (e.key !== "Tab" || !this._tabHeld) return;
				this._tabHeld = false;
				if (this._tabConsumed) return;
				this._zone = this._zone === "input" ? "list" : "input";
			};
			defineHybridPropAliases(this, [
				"searchValue",
				"searchExpr",
				"multiContext",
				"suggestionTemplate",
				"allFieldsLabel",
				"maxChips",
				"moreLabel",
				"noIcon",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"ariaLabelText",
				"minLength",
				"maxLength",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight",
				"cssClass"
			]);
		}
		disconnectedCallback() {
			if (this._timer) clearTimeout(this._timer);
			this._teardownDocListener();
			this._teardownMoreDocListener();
			this._teardownFilterDocListener();
			this._detachChipsSwallow();
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			super.willUpdate(changed);
			if (changed.has("searchValue") || changed.has("searchExpr") || changed.has("dataGrid")) this._pushSearchFields();
		}
		/**
		* Hand the declared fields to the controller.
		*
		* Only pushes when something was actually declared — an untouched element must
		* not clobber `monoDataGrid({ searchExpr })` with an empty list. The
		* stringified guard matters because `_applyControllerProps` re-applies
		* `props.search` on every controller notify, and `setSearchExpr` re-runs the
		* live query: without it, searching would loop.
		*/
		_pushSearchFields() {
			const grid = this.dataGrid;
			const setFields = grid?.setSearchValue ?? grid?.setSearchExpr;
			if (!grid || typeof setFields !== "function") return;
			const entries = mergeSearchFields(this);
			if (!entries?.length) return;
			const key = JSON.stringify(entries.map((e) => typeof e === "string" ? e : e.field));
			if (key === this._pushedFields) return;
			this._pushedFields = key;
			setFields.call(grid, entries);
		}
		/**
		* Delegate focus to the inner `<input>` — `@query` resolves against
		* `renderRoot`, so this reaches the input in BOTH builds (light: the host
		* itself; shadow: the shadow root). Consumers (e.g. `<mono-dropdown-table>`
		* auto-focusing its search region) can then just call `el.focus()` without
		* having to know which build they hold or reach across a shadow boundary.
		*/
		focus(options) {
			this._inputEl?.focus(options);
		}
		blur() {
			this._inputEl?.blur();
		}
		/** Everything currently searched: committed chips plus the live input. */
		_terms(extra) {
			const out = [...this._chips];
			if (extra) out.push(extra);
			else if (this._value && !this.multiContext) out.push({ value: this._value });
			return out;
		}
		_push(value) {
			const grid = this.dataGrid;
			if (!grid) return;
			if (this.multiContext) {
				grid.setSearchTerms?.(this._chips);
				return;
			}
			if (typeof grid.setSearchTerms === "function") grid.setSearchTerms([{ value }].filter((t) => t.value));
			else grid.setSearch(value);
		}
		/** Suggestion rows: an all-columns row, then one per registered `mono-table-th`. */
		_suggestions() {
			const grid = this.dataGrid;
			if (!grid || typeof grid.registeredColumns !== "function") return [];
			const cols = grid.registeredColumns().filter((c) => !!c.field).map((c) => ({
				field: c.field,
				caption: c.caption || c.field
			}));
			return [{ caption: this.allFieldsLabel }, ...cols];
		}
		_suggestionLabel(s) {
			if (!s.field) return `${this.allFieldsLabel}: ${this._value}`;
			return this.suggestionTemplate.replace("{caption}", s.caption).replace("{term}", this._value);
		}
		get _canSuggest() {
			return this.suggestion && !this.disabled && !this.readonly && !!this._value;
		}
		_openPanel() {
			if (isServer || !this._canSuggest) return;
			this._closeMore();
			this._closeFilter();
			this._ensurePopup();
			this._activeIndex = 0;
			this._zone = "input";
			this._open = true;
			this._bindDocListener();
		}
		_closePanel() {
			this._open = false;
			this._zone = "input";
			this._tabHeld = false;
			this._teardownDocListener();
		}
		/** Accept the active suggestion: chip it (multiContext) or search it directly. */
		_acceptActive() {
			const s = this._suggestions()[this._activeIndex];
			if (!s || !this._value) return;
			const term = s.field ? {
				value: this._value,
				field: s.field
			} : { value: this._value };
			if (this.multiContext) {
				this._chips = [...this._chips, term];
				this._value = "";
				if (this._inputEl) this._inputEl.value = "";
				if (this._timer) clearTimeout(this._timer);
				this.dataGrid?.setSearchTerms?.(this._chips);
			} else {
				if (this._timer) clearTimeout(this._timer);
				this.dataGrid?.setSearchTerms?.([term]);
			}
			this._closePanel();
			this._inputEl?.focus();
		}
		_removeChip(index) {
			this._chips = this._chips.filter((_, i) => i !== index);
			this.dataGrid?.setSearchTerms?.(this._chips);
			if (!this._overflowChips.length) this._closeMore();
			this._inputEl?.focus();
		}
		_detachChipsSwallow() {
			if (!this._chipsSwallow) return;
			this._chipsSwallow.strip.removeEventListener("click", this._chipsSwallow.fn, true);
			this._chipsSwallow = null;
		}
		_handleInput(event) {
			const value = event.currentTarget.value;
			this._value = value;
			if (value && this.suggestion) this._openPanel();
			else if (!value) this._closePanel();
			if (this._timer) clearTimeout(this._timer);
			this._timer = setTimeout(() => this._push(value), Math.max(0, Number(this.debounce) || 0));
		}
		_ensurePopup() {
			if (this._popup || isServer) return;
			this._popup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-table-search-panel"),
				getAnchor: () => this.renderRoot.querySelector(".mono-input-field") ?? this,
				getStyleScope: () => this.closest(".mono-table, [mono-table]") ?? this.renderRoot.querySelector(".mono-table-search") ?? this,
				isOpen: () => this._open,
				side: () => "bottom",
				align: () => "start",
				offset: () => 4,
				flip: () => true,
				shift: () => true,
				matchWidth: true
			});
		}
		_bindDocListener() {
			if (this._onDocPointer || isServer) return;
			this._onDocPointer = (e) => {
				const path = e.composedPath();
				if (path.includes(this)) return;
				if (this._popup?.containsInPath(path)) return;
				this._closePanel();
			};
			document.addEventListener("pointerdown", this._onDocPointer, true);
		}
		_teardownDocListener() {
			if (this._onDocPointer) document.removeEventListener("pointerdown", this._onDocPointer, true);
			this._onDocPointer = void 0;
		}
		/**
		* Clearing is an explicit act, so it skips the debounce — the grid resets to
		* the unfiltered rows immediately rather than after a dangling timer.
		*/
		_handleClear() {
			if (this.disabled || this.readonly) return;
			if (this._timer) clearTimeout(this._timer);
			this._value = "";
			if (this._inputEl) this._inputEl.value = "";
			this._push("");
			this._inputEl?.focus();
		}
		/** Mirrors `input-core`'s resolution: an explicit state wins, else error/success. */
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.error || this.errorMessage) return "invalid";
			if (this.success || this.successMessage) return "valid";
			return "default";
		}
		_cls(base, key) {
			return cssPart(this.cssClass, base, key);
		}
		/** Modifier classes shared by the wrapper and the field (see `input-core`). */
		get _stateClasses() {
			const hasSuffix = this.clearable && !!this._value || this._filterSlotted;
			return [
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._resolvedValidationState !== "default" ? `is-${this._resolvedValidationState}` : "",
				this.noIcon ? "" : "has-prefix",
				hasSuffix ? "has-suffix" : "",
				this._value ? "has-value" : ""
			].filter(Boolean).join(" ");
		}
		get _wrapperClasses() {
			return [
				"mono-input",
				"mono-table-search",
				this._stateClasses,
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _fieldClasses() {
			return [this._cls("mono-input-field", "field"), this._stateClasses].filter(Boolean).join(" ");
		}
		/** Internal icon — light: UnoCSS `.mono-icon`; shadow: inline SVG. */
		renderIcon(_name) {
			return html``;
		}
		_renderLabel() {
			if (!this.label) return nothing;
			return html`<label class=${this._cls("mono-input-label", "label")} mono-label>${this.label}</label>`;
		}
		_renderMessage() {
			const base = this._cls("mono-input-message", "message");
			const wrap = (state, text) => html`<div mono-message-wrap><div class=${`${base} ${state}`} mono-message=${state}>${text}</div></div>`;
			if (this.validationMessage) return wrap(this._resolvedValidationState, this.validationMessage);
			if (this.errorMessage) return wrap("invalid", this.errorMessage);
			if (this.successMessage) return wrap("valid", this.successMessage);
			if (this.helperText) return wrap("helper", this.helperText);
			return nothing;
		}
		_renderClear() {
			if (!(this.clearable && this._value && !this.disabled && !this.readonly)) return nothing;
			return html`
        <button
          type="button"
          class=${this._cls("mono-input-clear", "clear")}
          mono-clear
          aria-label="Clear search"
          @click=${this._handleClear}
        >
          ${this.renderIcon("close")}
        </button>
      `;
		}
		/** Sanitized inline-chip limit (>= 0) or `Infinity` when collapsing is off. */
		get _maxChips() {
			const n = Math.floor(Number(this.maxChips));
			if (!Number.isFinite(n) || n < 0) return Infinity;
			return n;
		}
		/** Chips beyond the inline limit — the ones the "See All" panel lists. */
		get _overflowChips() {
			const max = this._maxChips;
			return max === Infinity ? [] : this._chips.slice(max);
		}
		/** Render one removable chip at its true index in `_chips`. */
		_renderOneChip(t, index) {
			return html`
        <span class="mono-table-search-chip" mono-search-chip data-chip=${t.field ?? "*"}>
          ${t.field ? html`<span class="mono-table-search-chip-ctx" mono-search-chip-ctx>${this._captionOf(t.field)}:</span>` : nothing}
          <span class="mono-table-search-chip-text" mono-search-chip-text>${t.value}</span>
          <button
            type="button"
            class="mono-table-search-chip-x" mono-search-chip-x
            aria-label=${`Remove ${t.value}`}
            @click=${() => this._removeChip(index)}
          >
            ${this.renderIcon("close")}
          </button>
        </span>
      `;
		}
		/**
		* Committed chips, rendered inside the field ahead of the input. Only the
		* first `maxChips` show inline; the rest collapse into a `${moreLabel}`
		* trigger chip so a long filter list never stretches the input. Clicking it
		* opens `_renderMorePanel`.
		*/
		_renderChips() {
			if (!this.multiContext || !this._chips.length && !this._filterChip) return nothing;
			const max = this._maxChips;
			const inline = max === Infinity ? this._chips : this._chips.slice(0, max);
			const overflow = this._overflowChips;
			return html`
        <span
          class="mono-table-search-chips ${this._chipsDragging ? "is-grabbing" : ""}" mono-search-chips
          @pointerdown=${this._onChipsPointerDown}
        >
          ${this._filterChip ? this._renderFilterChip() : nothing}
          ${inline.map((t, i) => this._renderOneChip(t, i))}
          ${overflow.length ? html`
                <button
                  type="button"
                  class="mono-table-search-chip mono-table-search-chip-more ${this._moreOpen ? "open" : ""}" mono-search-chip mono-search-chip-more
                  aria-haspopup="true"
                  aria-expanded=${this._moreOpen ? "true" : "false"}
                  @click=${(e) => {
				e.stopPropagation();
				this._toggleMore();
			}}
                >
                  <span class="mono-table-search-chip-text" mono-search-chip-text>${this.moreLabel}</span>
                  <span class="mono-table-search-chip-count" mono-search-chip-count>${overflow.length}</span>
                </button>
              ` : nothing}
        </span>
      `;
		}
		_captionOf(field) {
			return this._suggestions().find((s) => s.field === field)?.caption ?? field;
		}
		/** The overflow panel — lists the chips that did not fit inline. */
		_renderMorePanel() {
			const overflow = this._overflowChips;
			if (!this._moreOpen || !overflow.length) return nothing;
			const max = this._maxChips;
			return html`
        <div class="mono-table-search-more-panel" mono-search-more-panel role="dialog" aria-label=${this.moreLabel}>
          ${overflow.map((t, i) => this._renderOneChip(t, max + i))}
        </div>
      `;
		}
		_toggleMore() {
			if (this._moreOpen) {
				this._closeMore();
				return;
			}
			this._closePanel();
			this._closeFilter();
			this._moreOpen = true;
			this._bindMoreDocListener();
		}
		_closeMore() {
			if (!this._moreOpen) return;
			this._moreOpen = false;
			this._teardownMoreDocListener();
		}
		_bindMoreDocListener() {
			if (this._onMoreDocPointer || isServer) return;
			this._onMoreDocPointer = (e) => {
				if (e.composedPath().includes(this)) return;
				this._closeMore();
			};
			document.addEventListener("pointerdown", this._onMoreDocPointer, true);
		}
		_teardownMoreDocListener() {
			if (this._onMoreDocPointer) document.removeEventListener("pointerdown", this._onMoreDocPointer, true);
			this._onMoreDocPointer = void 0;
		}
		/**
		* A `<mono-filter-builder slot="filter-builder">` joins the search: a
		* chevron in the field toggles its panel, and its `mno-apply` either renders
		* one filter chip (multi-context) or filters the grid directly.
		*
		* Projection differs per build: the light build can't use `<slot>` (it
		* renders into the host, not a shadow root), so it captures the child and
		* moves it into the `[data-mono-slot]` placeholder rendered by
		* `_renderFilterSlotContent`; the shadow build overrides that hook to render
		* a native `<slot>` and detects content via `_onFilterSlotChange`.
		*/
		_setFilterSlotted(value) {
			this._filterSlotted = value;
		}
		_onFilterSlotChange(e) {
			const slot = e.target;
			this._setFilterSlotted(slot.assignedElements().length > 0);
		}
		/**
		* Inner content of the filter panel. Default = the light-build placeholder
		* (`[data-mono-slot]`) the captured child is moved into; the shadow build
		* overrides this to render a native `<slot name="filter-builder">`.
		*/
		_renderFilterSlotContent() {
			return html`<div data-mono-slot="filter-builder"></div>`;
		}
		_toggleFilter() {
			if (this._filterOpen) {
				this._closeFilter();
				return;
			}
			this._closePanel();
			this._closeMore();
			this._ensureFilterPopup();
			this._filterOpen = true;
			this._bindFilterDocListener();
		}
		_closeFilter() {
			if (!this._filterOpen) return;
			this._filterOpen = false;
			this._teardownFilterDocListener();
		}
		/**
		* The filter panel is portaled (like the suggestion panel) so it floats over
		* the rows instead of pushing them, and flips / shifts to stay on screen at
		* a viewport edge.
		*/
		_ensureFilterPopup() {
			if (this._filterPopup || isServer) return;
			this._filterPopup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-table-search-filter"),
				getAnchor: () => this.renderRoot.querySelector(".mono-input-field") ?? this,
				getStyleScope: () => this.closest(".mono-table, [mono-table]") ?? this.renderRoot.querySelector(".mono-table-search") ?? this,
				isOpen: () => this._filterOpen,
				side: () => "bottom",
				align: () => "start",
				offset: () => 4,
				flip: () => true,
				shift: () => true,
				constrainSize: () => true
			});
		}
		/** Where the portaled filter panel lives now (host or body portal). */
		_filterPanelRoot() {
			return this._filterPopup?.panelRoot ?? null;
		}
		_bindFilterDocListener() {
			if (this._onFilterDocPointer || isServer) return;
			this._onFilterDocPointer = (e) => {
				const path = e.composedPath();
				if (path.includes(this)) return;
				if (this._filterPopup?.containsInPath(path)) return;
				this._closeFilter();
			};
			document.addEventListener("pointerdown", this._onFilterDocPointer, true);
		}
		_teardownFilterDocListener() {
			if (this._onFilterDocPointer) document.removeEventListener("pointerdown", this._onFilterDocPointer, true);
			this._onFilterDocPointer = void 0;
		}
		/** `mno-apply` from the slotted builder — filter the grid, chip it if multi-context. */
		_onFilterApply(e) {
			const detail = e.detail;
			const arr = detail?.array;
			const has = !!(Array.isArray(arr) && arr.length || detail?.string);
			const grid = this.dataGrid;
			if (grid?.setFilter) grid.setFilter(has ? arr : null);
			this._filterChip = this.multiContext && has ? {
				label: this.filterLabel,
				string: detail?.string || ""
			} : null;
		}
		/** `mno-clear` from the slotted builder — drop the filter and the chip. */
		_onFilterClear() {
			this.dataGrid?.setFilter?.(null);
			this._filterChip = null;
		}
		/** Remove button on the filter chip — clear the grid filter, keep the builder's edits. */
		_removeFilter() {
			this.dataGrid?.setFilter?.(null);
			this._filterChip = null;
			this._inputEl?.focus();
		}
		/** The chevron suffix button — only when a filter-builder is slotted. */
		_renderFilterToggle() {
			if (!this._filterSlotted) return nothing;
			return html`
        <button
          type="button"
          class=${`mono-table-search-filter-toggle ${this._filterOpen ? "open" : ""} ${this._filterChip ? "active" : ""}`} mono-search-filter-toggle
          ?mono-open=${this._filterOpen}
          ?mono-active=${!!this._filterChip}
          aria-haspopup="true"
          aria-expanded=${this._filterOpen ? "true" : "false"}
          title=${this.filterLabel}
          @click=${(e) => {
				e.stopPropagation();
				this._toggleFilter();
			}}
        >
          ${this.renderIcon("chevron")}
        </button>
      `;
		}
		/** One removable chip representing the active built filter (multi-context only). */
		_renderFilterChip() {
			const chip = this._filterChip;
			if (!chip) return html``;
			return html`
        <span
          class="mono-table-search-chip mono-table-search-filter-chip" mono-search-chip mono-search-filter-chip
          data-chip="filter"
          title=${chip.string || chip.label}
        >
          <span class="mono-table-search-chip-text" mono-search-chip-text>${chip.label}</span>
          <button
            type="button"
            class="mono-table-search-chip-x" mono-search-chip-x
            aria-label=${`Remove ${chip.label}`}
            @click=${() => this._removeFilter()}
          >
            ${this.renderIcon("close")}
          </button>
        </span>
      `;
		}
		/** The slotted filter-builder panel — hidden unless the chevron is toggled. */
		_renderFilterSlot() {
			return html`
        <div
          class="mono-table-search-filter ${this._filterOpen ? "open" : ""}" mono-search-filter
          ?mono-open=${this._filterOpen}
          ?hidden=${!this._filterOpen}
          @mno-apply=${this._onFilterApply}
          @mno-clear=${this._onFilterClear}
        >
          ${this._renderFilterSlotContent()}
        </div>
      `;
		}
		/**
		* The suggestion dropdown — portaled, so it escapes the table's overflow.
		*
		* The host div renders even with `suggestion` off (empty and `hidden`) rather
		* than collapsing to `nothing`: once the popup controller has portaled it out
		* of the render root, Lit can no longer remove it, so a conditional branch
		* would strand the old panel and render a second one on the way back.
		*/
		_renderPanel() {
			const list = this.suggestion ? this._suggestions() : [];
			return html`
        <div
          class="mono-table-search-panel ${this._open ? "open" : ""} ${this._zone === "list" ? "zone-list" : ""}" mono-search-panel
          ?mono-open=${this._open}
          ?mono-zone-list=${this._zone === "list"}
          role="listbox"
          ?hidden=${!this.suggestion}
          aria-hidden=${this._open ? "false" : "true"}
        >
          ${list.map((s, i) => html`
              <button
                type="button"
                role="option"
                aria-selected=${i === this._activeIndex ? "true" : "false"}
                class="mono-table-search-option ${i === this._activeIndex ? "active" : ""}" mono-search-option
                ?mono-active=${i === this._activeIndex}
                data-suggest=${s.field ?? "*"}
                @mouseenter=${() => this._activeIndex = i}
                @click=${() => {
				this._activeIndex = i;
				this._acceptActive();
			}}
              >
                ${this._suggestionLabel(s)}
              </button>
            `)}
        </div>
      `;
		}
		render() {
			return html`
        <div
          class=${this._wrapperClasses}
          style=${styleMap(buildSizeStyle(this))}
          mono-input
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          mono-variant=${this.variant === "outlined" ? nothing : this.variant}
          mono-validation-state=${this._resolvedValidationState === "default" ? nothing : this._resolvedValidationState}
          ?mono-disabled=${this.disabled}
          ?mono-readonly=${this.readonly}
          ?mono-clearable=${this.clearable}
          @keydown=${this._onKeydown}
          @keyup=${this._onKeyup}
        >
          ${this._renderLabel()}
          <div class=${this._fieldClasses} mono-field>
            ${this.noIcon ? nothing : html`<span class=${this._cls("mono-input-prefix", "prefix")} mono-prefix aria-hidden="true"
                  >${this.renderIcon("search")}</span
                >`}
            ${this._renderChips()}
            <input
              class=${`${this._cls("mono-input-native", "native")} ${this.size}`}
              mono-native
              type="search"
              .value=${this._value}
              name=${ifDefined(this.name || void 0)}
              placeholder=${ifDefined(this.placeholder || void 0)}
              autocomplete=${ifDefined(this.autocomplete || void 0)}
              inputmode=${ifDefined(this.inputmode || void 0)}
              minlength=${ifDefined(this.minLength)}
              maxlength=${ifDefined(this.maxLength)}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?autofocus=${this.autofocus}
              aria-label=${ifDefined(this.ariaLabelText || this.label || this.placeholder || void 0)}
              aria-invalid=${this._resolvedValidationState === "invalid" ? "true" : "false"}
              @input=${this._handleInput}
            />
            ${this._renderClear()}
            ${this._renderFilterToggle()}
          </div>
          ${this._renderPanel()} ${this._renderMorePanel()} ${this._renderFilterSlot()} ${this._renderMessage()}
        </div>
      `;
		}
	}
	__decorate([property({ attribute: "search-value" })], MonoTableSearchCoreClass.prototype, "searchValue", void 0);
	__decorate([property({ attribute: "search-expr" })], MonoTableSearchCoreClass.prototype, "searchExpr", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "placeholder", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "disabled", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoTableSearchCoreClass.prototype, "debounce", void 0);
	__decorate([property({
		attribute: "no-icon",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "noIcon", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "variant", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "autofocus", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "label", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoTableSearchCoreClass.prototype, "helperText", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoTableSearchCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoTableSearchCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "error", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoTableSearchCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "success", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoTableSearchCoreClass.prototype, "successMessage", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "name", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "autocomplete", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "inputmode", void 0);
	__decorate([property({
		attribute: "min-length",
		converter: numberStringConverter
	})], MonoTableSearchCoreClass.prototype, "minLength", void 0);
	__decorate([property({
		attribute: "max-length",
		converter: numberStringConverter
	})], MonoTableSearchCoreClass.prototype, "maxLength", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoTableSearchCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoTableSearchCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoTableSearchCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoTableSearchCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoTableSearchCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoTableSearchCoreClass.prototype, "maxHeight", void 0);
	__decorate([property({ attribute: false })], MonoTableSearchCoreClass.prototype, "cssClass", void 0);
	__decorate([property({
		type: String,
		attribute: "css-class"
	})], MonoTableSearchCoreClass.prototype, "cssClassName", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "suggestion", void 0);
	__decorate([property({
		attribute: "multi-context",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSearchCoreClass.prototype, "multiContext", void 0);
	__decorate([property({ attribute: "suggestion-template" })], MonoTableSearchCoreClass.prototype, "suggestionTemplate", void 0);
	__decorate([property({ attribute: "all-fields-label" })], MonoTableSearchCoreClass.prototype, "allFieldsLabel", void 0);
	__decorate([property({
		attribute: "max-chips",
		converter: numberStringConverter
	})], MonoTableSearchCoreClass.prototype, "maxChips", void 0);
	__decorate([property({ attribute: "more-label" })], MonoTableSearchCoreClass.prototype, "moreLabel", void 0);
	__decorate([property({ attribute: "filter-label" })], MonoTableSearchCoreClass.prototype, "filterLabel", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_value", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_chips", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_open", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_activeIndex", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_zone", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_moreOpen", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_chipsDragging", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_filterSlotted", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_filterOpen", void 0);
	__decorate([state()], MonoTableSearchCoreClass.prototype, "_filterChip", void 0);
	__decorate([query(".mono-input-native")], MonoTableSearchCoreClass.prototype, "_inputEl", void 0);
	return MonoTableSearchCoreClass;
};
//#endregion
//#region src/components/table/table.css?raw
var table_default = "/* LEGACY CLASS ALIASES — every `[mono-x]` below is wrapped as `:is([mono-x], .legacy)`\r\n   by `scripts/legacy-class-alias.mjs`, because the table's markup is written by the\r\n   CONSUMER and host apps still spell it with the pre-port classes\r\n   (`<table class=\"mono-table mono-table-sticky-head\">`, `<th class=\"mono-table-sticky-right\">`).\r\n   Both spellings paint identically at the same specificity. Author selectors with the\r\n   attribute only and re-run the script (`--check` is a perf spec). */\r\n/* ============================================================================\r\n   mono-table — a port of Basecoat's `.table`, extended\r\n\r\n   Upstream is eight rules: a container, the table, its four row groups, a cell\r\n   and a caption. Everything else here — search, paging, sort and filter heads,\r\n   grouping, row detail, selection, inline editing, sticky columns, the loading\r\n   / empty / error overlays — is mono's own, and borrows its shape from the\r\n   Basecoat component it most resembles (`.button`, `.input`, `.badge`,\r\n   `.popover`), cited where it does.\r\n\r\n   Styling is by ATTRIBUTE. A table is markup the CONSUMER writes — the library\r\n   cannot emit a `<tr>` — so there is no element to mirror; the attributes ARE\r\n   the API:\r\n\r\n     <div mono-table-scroll>\r\n       <table mono-table mono-color=\"success\">…</table>\r\n     </div>\r\n\r\n   The sibling chrome (`<mono-table-search>`, `<mono-table-paging>`, …) keeps\r\n   its full component name as its root attribute rather than a short part name:\r\n   those elements are SIBLINGS of the table, not descendants, so a short name\r\n   could not be scoped under `[mono-table]` and would collide with every other\r\n   component's parts.\r\n   ============================================================================ */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table — w-full caption-bottom text-sm */\r\n:is([mono-table],.mono-table),\r\n:is([mono-table-scroll],.mono-table-scroll),\r\n:is([mono-table-shell],.mono-table-shell),\r\n:is([mono-table-card],.mono-table-card),\r\n:is([mono-table-toolbar],.mono-table-toolbar),\r\n:is([mono-table-foot],.mono-table-foot),\r\n:is([mono-table-search],.mono-table-search),\r\n:is([mono-table-paging],.mono-table-pg),\r\n:is([mono-table-paging-group],.mono-table-pg-group),\r\n:is([mono-table-page-size],.mono-table-page-size),\r\n:is([mono-table-info],.mono-table-info),\r\n:is([mono-table-summary],.mono-table-summary),\r\n:is([mono-table-loading],.mono-table-loading),\r\n:is([mono-table-empty],.mono-table-empty),\r\n:is([mono-table-error],.mono-table-error),\r\n:is([mono-table-th],.mono-table-th),\r\n:is([mono-table-sort],.mono-table-sort),\r\n:is([mono-table-checkbox],.mono-table-checkbox),\r\n:is([mono-table-detail],.mono-table-detail),\r\n/* …and the PORTALED panels. They are moved to <body>, so they inherit nothing\r\n   from the table and must carry the whole chain themselves. Listing them here\r\n   rather than re-declaring the chain below them is deliberate: the hand-written\r\n   copy drifted to eleven of these forty-nine, and every rule inside a panel that\r\n   read one of the missing ones silently resolved to nothing. */\r\n:is([mono-th-menu],.mono-th-menu),\r\n:is([mono-th-filter],.mono-th-filter),\r\n:is([mono-search-panel],.mono-table-search-panel),\r\n:is([mono-search-more-panel],.mono-table-search-more-panel),\r\n:is([mono-search-filter],.mono-table-search-filter) {\r\n  /* ── ink and surface ────────────────────────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .table th — text-foreground\r\n     basecoat@1.0.2 styles/vega.css .table caption — text-muted-foreground */\r\n  --_mono-table-surface: var(--mono-table-surface, var(--background));\r\n  --_mono-table-text: var(--mono-table-text, var(--foreground));\r\n  --_mono-table-muted: var(--mono-table-muted, var(--muted-foreground));\r\n  --_mono-table-faint: var(--mono-table-faint, color-mix(in oklab, var(--_mono-table-muted) 70%, transparent));\r\n  --_mono-table-ink-mid: var(--mono-table-ink-mid, color-mix(in oklab, var(--_mono-table-text) 82%, transparent));\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .table tr — border-b */\r\n  --_mono-table-border: var(--mono-table-border, var(--border));\r\n  --_mono-table-border-lite: var(--mono-table-border-lite, var(--_mono-table-border));\r\n  /* The table's OUTER edge — a hairline so a fixed-height box reads as a frame\r\n     even when a failure has cleared the rows. `none` removes it. */\r\n  --_mono-table-outer-border-color: var(--mono-table-outer-border-color, var(--_mono-table-border));\r\n  --_mono-table-outer-border: var(--mono-table-outer-border, var(--mono-border-width) solid var(--_mono-table-outer-border-color));\r\n  --_mono-table-radius: var(--mono-table-radius, var(--_mono-table-radius-preset, var(--mono-radius-lg)));\r\n\r\n  /* ── the accent — EXTENSION ─────────────────────────────────────────────\r\n     Upstream's table has no accent at all: its head, its hover and its\r\n     selected row are all `--muted`. mono keeps a role colour for the pinned\r\n     rail on a selected row, the sort and filter indicators, the spinner and\r\n     the paging pill — so the role only TINTS upstream's neutral wash, at\r\n     `--mono-mode-tint`, and `color=\"secondary\"` leaves it exactly neutral. */\r\n  --_mono-table-accent: var(--mono-table-accent, var(--_mono-table-accent-preset, var(--primary)));\r\n  --_mono-table-on-accent: var(--mono-table-on-accent, var(--_mono-table-on-accent-preset, var(--primary-foreground)));\r\n\r\n  /* ── row states ─────────────────────────────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .table tr — hover:bg-muted/50 data-[state=selected]:bg-muted\r\n\r\n     Every one of these mixes into the SURFACE, never into `transparent`.\r\n     Upstream can afford `bg-muted/50` because nothing in its table overlaps\r\n     anything; mono pins columns and freezes the head and foot, and a pinned cell\r\n     paints over the rows sliding under it by restating `--_mono-table-row-bg`.\r\n     A translucent value there shows the scrolled content straight through. */\r\n  --_mono-table-selected-bg: var(--mono-table-selected-bg, var(--muted));\r\n  /* Zebra is mono's own — upstream stripes nothing. A tint of the neutral, not\r\n     of the accent, so a coloured table does not turn into a coloured page. */\r\n  --_mono-table-zebra: var(--mono-table-zebra, color-mix(in oklab, var(--muted) 42%, var(--_mono-table-surface)));\r\n  /* the soft wash the detail panel, the group row and the selected rail share */\r\n  --_mono-table-soft: var(--mono-table-soft, color-mix(in oklab, var(--muted) 62%, var(--_mono-table-surface)));\r\n  /* The head band. Upstream paints the head nothing (the page under a bottom\r\n     rule), so the resting head is transparent; a flavor can give it a surface\r\n     (ONE's `#f7f8fc` band). The FROZEN head must be opaque whatever this says —\r\n     rows slide under it — so it falls back to a tint of the accent instead. */\r\n  --_mono-table-head-bg: var(--mono-table-head-bg, transparent);\r\n  --_mono-table-head-frozen-bg: var(--mono-table-head-bg, color-mix(in oklab, var(--_mono-table-accent) 7%, var(--_mono-table-surface)));\r\n  /* a group header row (grouping) and its hover — a tint of the accent unless a\r\n     flavor names the wash */\r\n  --_mono-table-group-bg: var(--mono-table-group-bg, color-mix(in oklab, var(--_mono-table-accent) 9%, var(--_mono-table-surface)));\r\n  --_mono-table-group-hover-bg: var(--mono-table-group-hover-bg, color-mix(in oklab, var(--_mono-table-accent) 14%, var(--_mono-table-surface)));\r\n  /* ── hover — DELIBERATELY off ────────────────────────────────────────────\r\n     Upstream's `hover:bg-muted/50` lands within a hair of mono's zebra, so on a\r\n     striped table (and mono stripes by default) hovering an odd row simply\r\n     repaints it as an even one: the row appears to merge with the one below it\r\n     rather than to light up. A cue that is indistinguishable from the pattern\r\n     it sits in is worse than no cue, so the default is the row's own colour.\r\n     `--mono-table-hover-bg` turns it back on for anyone who wants it. */\r\n  --_mono-table-hover-bg: var(--mono-table-hover-bg, var(--_mono-table-row-bg, var(--_mono-table-surface)));\r\n\r\n  /* ── head and cell metrics ──────────────────────────────────────────────\r\n     basecoat@1.0.2 styles/vega.css .table th — h-10 px-2 text-start align-middle font-medium whitespace-nowrap\r\n     basecoat@1.0.2 styles/vega.css .table td — p-2 align-middle whitespace-nowrap */\r\n  --_mono-table-font: var(--mono-table-font, var(--_mono-table-font-preset, var(--mono-text-sm)));\r\n  --_mono-table-line-height: var(--mono-table-line-height, var(--_mono-table-line-height-preset, var(--mono-text-sm--lh)));\r\n  --_mono-table-th-height: var(--mono-table-th-height, var(--_mono-table-th-height-preset, calc(var(--mono-spacing) * 10)));\r\n  --_mono-table-th-pad-x: var(--mono-table-th-pad-x, var(--_mono-table-th-pad-x-preset, calc(var(--mono-spacing) * 2)));\r\n  --_mono-table-th-font: var(--mono-table-th-font, var(--_mono-table-th-font-preset, var(--_mono-table-font)));\r\n  --_mono-table-th-weight: var(--mono-table-th-weight, var(--_mono-table-th-weight-preset, var(--mono-font-weight-medium)));\r\n  --_mono-table-th-color: var(--mono-table-th-color, var(--_mono-table-th-color-preset, var(--_mono-table-text)));\r\n  --_mono-table-th-transform: var(--mono-table-th-transform, var(--_mono-table-th-transform-preset, none));\r\n  --_mono-table-th-tracking: var(--mono-table-th-tracking, var(--_mono-table-th-tracking-preset, normal));\r\n  --_mono-table-cell-pad: var(--mono-table-cell-pad, var(--_mono-table-cell-pad-preset, calc(var(--mono-spacing) * 2)));\r\n\r\n  /* ── the sibling chrome ─────────────────────────────────────────────────\r\n     basecoat@1.0.2 components/table.css .table tfoot — bg-muted/50 border-t font-medium */\r\n  --_mono-table-foot-bg: var(--mono-table-foot-bg, color-mix(in oklab, var(--muted) 50%, var(--_mono-table-surface)));\r\n  --_mono-table-foot-gap: var(--mono-table-foot-gap, calc(var(--mono-spacing) * 3));\r\n\r\n  /* ── Loading overlay (mono-table-loading) ── */\r\n  --_mono-table-loading-bg: var(--mono-table-loading-bg, color-mix(in oklab, var(--_mono-table-surface) 64%, transparent));\r\n  --_mono-table-loading-blur: var(--mono-table-loading-blur, 2px);\r\n  --_mono-table-spinner-size: var(--mono-table-spinner-size, 1.5rem);\r\n  --_mono-table-spinner-width: var(--mono-table-spinner-width, 2.5px);\r\n  --_mono-table-spinner-color: var(--mono-table-spinner-color, var(--_mono-table-accent));\r\n  --_mono-table-spinner-speed: var(--mono-table-spinner-speed, 0.65s);\r\n  /* Above every tier this sheet uses (pinned header/footer tops out at 3) AND above the\r\n     lifts consumers have already shipped, so an app that raises its own header cannot\r\n     accidentally paint through the dim. Raise it here if a ladder ever needs to go past. */\r\n  --_mono-table-loading-z: var(--mono-table-loading-z, 10);\r\n  /* How far below the frozen header the spinner sits. */\r\n  --_mono-table-loading-gap: var(--mono-table-loading-gap, 1.25rem);\r\n\r\n  /* ── Error bar (mono-table-error) ── */\r\n  --_mono-table-error: var(--mono-table-error, var(--destructive));\r\n  /* opaque: the bar pins under a frozen header with rows sliding beneath it */\r\n  --_mono-table-error-bg: var(--mono-table-error-bg, color-mix(in oklab, var(--_mono-table-error) var(--mono-mode-tint), var(--_mono-table-surface)));\r\n  --_mono-table-error-border: var(--mono-table-error-border, color-mix(in oklab, var(--_mono-table-error) var(--mono-mode-state-border-alpha, 24%), transparent));\r\n\r\n  /* ── Empty state (mono-table-empty) ──\r\n     Room the message reserves on the scroll wrapper. An empty grid is a header\r\n     over nothing, so unlike the loading overlay there is no height left to\r\n     freeze — this is the height, and the element reads it off itself so a theme\r\n     or a single field can retune it. */\r\n  --_mono-table-empty-min-h: var(--mono-table-empty-min-h, 12rem);\r\n  /* How far below the frozen header the message sits. */\r\n  --_mono-table-empty-gap: var(--mono-table-empty-gap, 2rem);\r\n  /* One tier BELOW the loading overlay: when a reload starts on an empty grid\r\n     both are briefly up, and the spinner is the one that should be on top. */\r\n  --_mono-table-empty-z: var(--mono-table-empty-z, 9);\r\n\r\n  /* ── Row detail (mono-table-detail) ── */\r\n  --_mono-table-detail-size: var(--mono-table-detail-size, 1.5rem);\r\n  --_mono-table-detail-radius: var(--mono-table-detail-radius, var(--mono-radius-sm));\r\n  --_mono-table-detail-color: var(--mono-table-detail-color, var(--_mono-table-muted));\r\n  --_mono-table-detail-color-open: var(--mono-table-detail-color-open, var(--_mono-table-accent));\r\n  --_mono-table-detail-hover-bg: var(--mono-table-detail-hover-bg, var(--_mono-table-hover-bg));\r\n  --_mono-table-detail-panel-bg: var(--mono-table-detail-panel-bg, var(--_mono-table-soft));\r\n  --_mono-table-detail-panel-pad: var(--mono-table-detail-panel-pad, calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4));\r\n\r\n  /* ── Pre-port READ-ONLY colour names — alive until 3.0 ──────────────────\r\n     The pre-port sheet DECLARED a palette on the table that host CSS reads\r\n     (esw-ui paints a sticky dropdown-panel head with\r\n     `color-mix(… var(--mono-table-primary) …, var(--mono-table-sky) …)`). The\r\n     port dropped them, so such a declaration went invalid → transparent and the\r\n     rows scrolled through the head. Restated here from the resolved palette, so\r\n     they follow the theme colour (ONE's navy/blue) and a per-table `mono-color`.\r\n     ONLY names the port does not read as knobs: declaring a knob name\r\n     (`--mono-table-border`, `-surface`, `-soft`, `-zebra`…) here would override\r\n     the value a flavor sets on :root. Not knobs — setting one changes nothing. */\r\n  --mono-table-primary: var(--_mono-table-accent);\r\n  --mono-table-deep: color-mix(in oklab, var(--_mono-table-accent) 82%, black);\r\n  --mono-table-sky: var(--info);\r\n  --mono-table-lite: color-mix(in oklab, var(--_mono-table-accent) 22%, var(--_mono-table-surface));\r\n}\r\n\r\n/* ── Colours — EXTENSION ───────────────────────────────────────────────────\r\n   `primary` is the default and emits no attribute, exactly as every other\r\n   ported component does. */\r\n:is([mono-table],.mono-table):is([mono-color=\"secondary\"],:where(.mono-table-secondary)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"secondary\"],:where(.mono-table-secondary)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"secondary\"],:where(.mono-table-secondary)) {\r\n  --_mono-table-accent-preset: var(--secondary-foreground);\r\n  --_mono-table-on-accent-preset: var(--secondary);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"success\"],:where(.mono-table-success)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"success\"],:where(.mono-table-success)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"success\"],:where(.mono-table-success)) {\r\n  --_mono-table-accent-preset: var(--success);\r\n  --_mono-table-on-accent-preset: var(--success-foreground);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"danger\"],:where(.mono-table-danger)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"danger\"],:where(.mono-table-danger)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"danger\"],:where(.mono-table-danger)) {\r\n  --_mono-table-accent-preset: var(--destructive);\r\n  --_mono-table-on-accent-preset: var(--destructive-foreground);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"warning\"],:where(.mono-table-warning)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"warning\"],:where(.mono-table-warning)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"warning\"],:where(.mono-table-warning)) {\r\n  --_mono-table-accent-preset: var(--warning);\r\n  --_mono-table-on-accent-preset: var(--warning-foreground);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"info\"],:where(.mono-table-info)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"info\"],:where(.mono-table-info)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"info\"],:where(.mono-table-info)) {\r\n  --_mono-table-accent-preset: var(--info);\r\n  --_mono-table-on-accent-preset: var(--info-foreground);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"teal\"],:where(.mono-table-teal)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"teal\"],:where(.mono-table-teal)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"teal\"],:where(.mono-table-teal)) {\r\n  --_mono-table-accent-preset: var(--teal);\r\n  --_mono-table-on-accent-preset: var(--teal-foreground);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"purple\"],:where(.mono-table-purple)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"purple\"],:where(.mono-table-purple)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"purple\"],:where(.mono-table-purple)) {\r\n  --_mono-table-accent-preset: var(--purple);\r\n  --_mono-table-on-accent-preset: var(--purple-foreground);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"neutral\"],:where(.mono-table-neutral)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"neutral\"],:where(.mono-table-neutral)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"neutral\"],:where(.mono-table-neutral)) {\r\n  --_mono-table-accent-preset: var(--neutral);\r\n  --_mono-table-on-accent-preset: var(--neutral-foreground);\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-color=\"dark\"],:where(.mono-table-dark)),\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-color=\"dark\"],:where(.mono-table-dark)),\r\n:is([mono-table-shell],.mono-table-shell):is([mono-color=\"dark\"],:where(.mono-table-dark)) {\r\n  --_mono-table-accent-preset: var(--dark);\r\n  --_mono-table-on-accent-preset: var(--dark-foreground);\r\n}\r\n\r\n\r\n/* ── Search ─────────────────────────────────────────────────────────────── */\r\n\r\n/* `mono-table-search` renders mono-input's markup (`.mono-input` →\r\n   `.mono-input-field` → `.mono-input-native`), so the entire size × color ×\r\n   variant matrix comes from `input.css` — there is deliberately no field styling\r\n   here. Block-level to match `mono-input { display: block }`. */\r\nmono-table-search,\r\nmono-shadow-table-search {\r\n  display: block;\r\n}\r\n\r\n/* The search keeps a sensible floor width so it can't collapse in a cramped\r\n   toolbar. It still grows to fill like a `mono-input` (`.mono-input` is\r\n   `width: 100%`), and an explicit `width`/`min-width` prop wins because\r\n   `buildSizeStyle` writes those inline. */\r\n.mono-input:is([mono-table-search],.mono-table-search) {\r\n  min-width: 180px;\r\n}\r\n\r\n/* The glyphs size themselves — `.mono-icon` is already `--mono-icon-md` (light)\r\n   and the shadow build's inline SVGs are em-based — so there is nothing to set\r\n   here. `.mono-input-prefix` has no intrinsic box, so do NOT give the icon a\r\n   percentage size: it would resolve against `auto` and collapse. */\r\n\r\n/* Kill the native focus outline in host projects; keep the box-shadow ring.\r\n   Covers mono-input's inner field and the page-size native <select>. */\r\n:is([mono-table-search],.mono-table-search) .mono-input-native:focus,\r\n:is([mono-table-search],.mono-table-search) .mono-input-native:focus-visible,\r\n:is([mono-sel],.mono-table-sel):focus,\r\n:is([mono-sel],.mono-table-sel):focus-visible {\r\n  outline: none !important;\r\n}\r\n\r\n/* A `type=\"search\"` input shows a native clear affordance; make it feel clickable\r\n   (mono-input's own `clearable` button is styled by input.css). */\r\n:is([mono-table-search],.mono-table-search) .mono-input-native[type='search']::-webkit-search-cancel-button {\r\n  cursor: pointer;\r\n}\r\n\r\n/* ── multi-context chips (inside the field, before the input) ─────────────── */\r\n:is([mono-search-chips],.mono-table-search-chips) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  flex-wrap: nowrap;\r\n  gap: 0.25rem;\r\n  padding-left: 0.4rem;\r\n  /* Fixed-width horizontal strip so a chip list never squeezes the input —\r\n     overflow scrolls instead of wrapping into a column. */\r\n  width: var(--mono-table-search-chips-width, 140px);\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n  /* Drag-to-scroll (see the core's pointer handlers): the grab cursor advertises\r\n     it, and the scrollbar is hidden so the strip stays tidy. */\r\n  cursor: grab;\r\n  scrollbar-width: none;\r\n  -ms-overflow-style: none;\r\n}\r\n:is([mono-search-chips],.mono-table-search-chips):is([mono-grabbing],.is-grabbing) {\r\n  cursor: grabbing;\r\n}\r\n:is([mono-search-chips],.mono-table-search-chips)::-webkit-scrollbar {\r\n  display: none;\r\n}\r\n:is([mono-search-chip],.mono-table-search-chip) {\r\n  /* Keep chips at their natural width inside the nowrap strip so they scroll\r\n     rather than compress. */\r\n  flex-shrink: 0;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.35rem;\r\n  max-width: 100%;\r\n  padding: 0.3rem 0.6rem;\r\n  border-radius: 999px;\r\n  background: var(--_mono-table-soft);\r\n  color: var(--_mono-table-text);\r\n  font-size: 0.85rem;\r\n  line-height: 1.35;\r\n  white-space: nowrap;\r\n  justify-content: space-between;\r\n}\r\n/* The column a chip is bound to — the \"context\" half of `Nama: Andy`. */\r\n:is([mono-search-chip-ctx],.mono-table-search-chip-ctx) {\r\n  color: var(--_mono-table-accent);\r\n  font-weight: 600;\r\n}\r\n:is([mono-search-chip-text],.mono-table-search-chip-text) {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n:is([mono-search-chip-x],.mono-table-search-chip-x) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: 1.25rem;\r\n  height: 1.25rem;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: 999px;\r\n  background: transparent;\r\n  color: var(--_mono-table-muted);\r\n  line-height: 0;\r\n  cursor: pointer;\r\n}\r\n:is([mono-search-chip-x],.mono-table-search-chip-x):hover {\r\n  color: var(--_mono-table-accent);\r\n}\r\n:is([mono-search-chip-x],.mono-table-search-chip-x) .mono-icon {\r\n  width: 0.8rem;\r\n  height: 0.8rem;\r\n}\r\n\r\n/* ── \"See All\" overflow trigger + panel ─────────────────────────────────── */\r\n/* The field wrapper anchors the absolutely-positioned overflow panel. */\r\n:is([mono-table-search],.mono-table-search) {\r\n  position: relative;\r\n}\r\n/* The trigger chip reuses `[mono-search-chip]`'s shape; these layer a\r\n   stronger surface so it reads as a button rather than a plain chip. */\r\n:is([mono-search-chip-more],.mono-table-search-chip-more) {\r\n  padding: 0.3rem 0.55rem 0.3rem 0.7rem;\r\n  border: 0;\r\n  background: var(--_mono-table-border);\r\n  color: var(--_mono-table-accent);\r\n  font-weight: 600;\r\n  cursor: pointer;\r\n}\r\n:is([mono-search-chip-more],.mono-table-search-chip-more):hover {\r\n  background: color-mix(in oklab, var(--_mono-table-accent) 30%, var(--_mono-table-surface));\r\n}\r\n:is([mono-search-chip-more],.mono-table-search-chip-more):is([mono-open],.open) {\r\n  background: var(--_mono-table-accent);\r\n  color: var(--_mono-table-on-accent);\r\n}\r\n/* Count badge — tints itself from the chip's `currentColor`. */\r\n:is([mono-search-chip-count],.mono-table-search-chip-count) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  min-width: 1.2rem;\r\n  height: 1.2rem;\r\n  padding: 0 0.35rem;\r\n  border-radius: 999px;\r\n  background: color-mix(in srgb, currentColor 18%, transparent);\r\n  font-size: 0.72rem;\r\n  font-weight: 700;\r\n  line-height: 1;\r\n}\r\n/* The panel sits below the field and lists the chips that didn't fit inline. */\r\n:is([mono-search-more-panel],.mono-table-search-more-panel) {\r\n  position: absolute;\r\n  top: calc(100% + 0.35rem);\r\n  left: 0;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 0.4rem;\r\n  padding: 0.55rem;\r\n  max-width: 22rem;\r\n  max-height: 14rem;\r\n  overflow: auto;\r\n  /* Portaled + anchored: a chained scroll would drag this panel off-screen\r\n     (see `[mono-th-filter-list]`). */\r\n  overscroll-behavior: contain;\r\n  background: var(--_mono-table-panel-bg, var(--popover));\r\n  border: 0;\r\n  border-radius: var(--_mono-table-panel-radius, var(--mono-radius-md));\r\n  box-shadow: var(--_mono-table-panel-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--_mono-table-panel-shadow, var(--mono-shadow-md));\r\n}\r\n\r\n/* ── slotted filter-builder (chevron toggle + panel + chip) ──────────────── */\r\n/* Sized to match `mono-input`'s clearable affordance (`.mono-input-clear`) so the\r\n   chevron sits level with the field's other suffix controls. */\r\n:is([mono-search-filter-toggle],.mono-table-search-filter-toggle) {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  margin-right: 0.4rem;\r\n  width: var(--_mi-clear, 1.8rem);\r\n  height: var(--_mi-clear, 1.8rem);\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: 9999px;\r\n  background: transparent;\r\n  color: color-mix(in oklab, var(--_mono-table-text) 56%, transparent);\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  transition: transform var(--mono-duration-fast, 150ms) var(--mono-ease, ease);\r\n}\r\n:is([mono-search-filter-toggle],.mono-table-search-filter-toggle) > .mono-icon {\r\n  width: var(--mono-icon-md, 1.25rem);\r\n  height: var(--mono-icon-md, 1.25rem);\r\n}\r\n:is([mono-search-filter-toggle],.mono-table-search-filter-toggle):hover {\r\n  color: var(--_mono-table-accent);\r\n  background: color-mix(in srgb, var(--_mono-table-accent) 8%, transparent);\r\n}\r\n:is([mono-search-filter-toggle],.mono-table-search-filter-toggle):active {\r\n  transform: scale(0.95);\r\n}\r\n:is([mono-search-filter-toggle],.mono-table-search-filter-toggle):is([mono-active],.active) {\r\n  color: var(--_mono-table-accent);\r\n}\r\n/* `open` rotates the chevron on its own (the :active scale is momentary). */\r\n:is([mono-search-filter-toggle],.mono-table-search-filter-toggle):is([mono-open],.open) {\r\n  transform: rotate(180deg);\r\n}\r\n:is([mono-search-filter-toggle],.mono-table-search-filter-toggle):is([mono-open],.open):active {\r\n  transform: rotate(180deg) scale(0.95);\r\n}\r\n/* The slotted `<mono-filter-builder>` panel — portaled to <body> and positioned\r\n   fixed by the popup controller (flip up / shift in at viewport edges), so it\r\n   floats over the rows instead of pushing them. Width tracks the builder's own\r\n   `width` (max-content, floored/clamped to the viewport) — so the builder sizes\r\n   its \"modal\". */\r\n:is([mono-search-filter],.mono-table-search-filter) {\r\n  width: max-content;\r\n  min-width: min(90vw, 20rem);\r\n  max-width: 90vw;\r\n  max-height: min(70vh, var(--mono-popup-avail-h, 70vh));\r\n  overflow: auto;\r\n  /* Portaled + anchored: a chained scroll would drag this panel off-screen\r\n     (see `[mono-th-filter-list]`). */\r\n  overscroll-behavior: contain;\r\n  padding: 0.65rem;\r\n  background: var(--_mono-table-panel-bg, var(--popover));\r\n  border: 0;\r\n  border-radius: var(--_mono-table-panel-radius, var(--mono-radius-md));\r\n  box-shadow: var(--_mono-table-panel-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--_mono-table-panel-shadow, var(--mono-shadow-md));\r\n}\r\n/* One chip representing the active built filter — a touch stronger than a search\r\n   chip so it stands apart as a different kind of context. */\r\n:is([mono-search-filter-chip],.mono-table-search-filter-chip) {\r\n  background: var(--_mono-table-border);\r\n  color: var(--_mono-table-accent);\r\n  font-weight: 600;\r\n}\r\n\r\n/* ── suggestion panel ─────────────────────────────────────────────────────── */\r\n/* The panel is portaled to <body>, so it only sees the `--mono-table-*` block if\r\n   the portal host got a matching class. Every colour therefore falls back to the\r\n   global `--theme-*` tokens (and then a literal) — an unresolved var would make\r\n   `background` invalid and paint the whole panel transparent. */\r\n:is([mono-search-panel],.mono-table-search-panel) {\r\n  /* Resolved once here so the row rules below can't inherit an invalid value. */\r\n  --_mono-search-accent: var(--_mono-table-accent, var(--primary));\r\n  --_mono-search-surface: var(--_mono-table-surface, var(--popover));\r\n  --_mono-search-soft: color-mix(in oklab, var(--_mono-search-accent) 7%, var(--_mono-search-surface));\r\n  --_mono-search-lite: color-mix(in oklab, var(--_mono-search-accent) 22%, var(--_mono-search-surface));\r\n\r\n  display: none;\r\n  position: fixed;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  min-width: 12rem;\r\n  max-height: 15rem;\r\n  overflow-y: auto;\r\n  /* Portaled + anchored: a chained scroll would drag this panel off-screen\r\n     (see `[mono-th-filter-list]`). */\r\n  overscroll-behavior: contain;\r\n  padding: 0.25rem;\r\n  background: var(--_mono-table-panel-bg, var(--popover));\r\n  border: 0;\r\n  border-radius: var(--_mono-table-panel-radius, var(--mono-radius-md));\r\n  box-shadow: var(--_mono-table-panel-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--_mono-table-panel-shadow, var(--mono-shadow-md));\r\n  color: var(--_mono-table-text);\r\n  font-size: 0.82rem;\r\n}\r\n:is([mono-search-panel],.mono-table-search-panel):is([mono-open],.open) {\r\n  display: block;\r\n}\r\n:is([mono-search-option],.mono-table-search-option) {\r\n  display: block;\r\n  width: 100%;\r\n  padding: 0.4rem 0.5rem;\r\n  border: 0;\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n  text-align: left;\r\n  cursor: pointer;\r\n}\r\n:is([mono-search-option],.mono-table-search-option):hover {\r\n  background: var(--_mono-search-soft);\r\n}\r\n/* The active row is marked by a leading bar only — no fill — so it stays\r\n   distinct from a hovered row's tint, and Enter always has a visible target.\r\n   The bar reads stronger once the keyboard has actually moved INTO the list. */\r\n:is([mono-search-option],.mono-table-search-option):is([mono-active],.active) {\r\n  box-shadow: inset 2px 0 0 var(--_mono-search-accent);\r\n}\r\n:is([mono-search-panel],.mono-table-search-panel):is([mono-zone-list],.zone-list) :is([mono-search-option],.mono-table-search-option):is([mono-active],.active) {\r\n  box-shadow: inset 3px 0 0 var(--_mono-search-accent);\r\n}\r\n\r\n/* ── Paging ─────────────────────────────────────────────────────────────── */\r\n\r\n:is([mono-table-paging],.mono-table-pg) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.25rem;\r\n  flex-wrap: wrap;\r\n}\r\n\r\n:is([mono-pgb],.mono-table-pgb) {\r\n  min-width: 30px;\r\n  height: 30px;\r\n  padding: 0 0.45rem;\r\n  border: var(--mono-border-width, 1px) solid var(--_mono-table-border);\r\n  border-radius: var(--mono-radius-sm, 0.5rem);\r\n  background: var(--_mono-table-surface);\r\n  color: var(--_mono-table-muted);\r\n  font-family: inherit;\r\n  font-size: 0.8rem;\r\n  font-weight: var(--mono-font-weight-semibold, 600);\r\n  cursor: pointer;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  transition:\r\n    border-color var(--mono-duration-fast, 150ms) var(--mono-ease, ease),\r\n    background-color var(--mono-duration-fast, 150ms) var(--mono-ease, ease),\r\n    color var(--mono-duration-fast, 150ms) var(--mono-ease, ease);\r\n}\r\n\r\n/* The prev/next arrows are inline SVG, and `.mono-icon` defaults to 20px — which is\r\n   wider than the 0.8rem digit beside it, so those two buttons grew to 36px while the\r\n   numbered ones stayed 30 and the row read as mismatched (an ellipse among circles,\r\n   once a skin rounds them). `em` ties the glyph to the BUTTON's own font-size, so the\r\n   compact group pager scales with it instead of needing its own rule. */\r\n:is([mono-pgb],.mono-table-pgb) .mono-icon {\r\n  width: 1.15em;\r\n  height: 1.15em;\r\n}\r\n\r\n:is([mono-pgb],.mono-table-pgb):hover:not(:disabled) {\r\n  border-color: var(--_mono-table-border);\r\n  background: var(--_mono-table-soft);\r\n  color: var(--_mono-table-accent);\r\n}\r\n\r\n:is([mono-pgb],.mono-table-pgb):is([mono-on],.on) {\r\n  background: var(--_mono-table-accent);\r\n  color: var(--_mono-table-on-accent);\r\n  border-color: var(--_mono-table-accent);\r\n  box-shadow: 0 2px 8px color-mix(in oklab, var(--_mono-table-accent) 22%, transparent);\r\n}\r\n\r\n:is([mono-pgb],.mono-table-pgb):disabled {\r\n  opacity: 0.4;\r\n  cursor: not-allowed;\r\n}\r\n\r\n:is([mono-pg-el],.mono-table-pg-el) {\r\n  padding: 0 0.3rem;\r\n  color: var(--_mono-table-muted);\r\n  font-size: 0.8rem;\r\n}\r\n\r\n/* ── Page size + info ───────────────────────────────────────────────────── */\r\n\r\n:is([mono-table-page-size],.mono-table-page-size) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.4rem;\r\n  font-size: 0.78rem;\r\n  color: var(--_mono-table-muted);\r\n}\r\n\r\n:is([mono-sel],.mono-table-sel) {\r\n  padding: 0.4rem 0.6rem;\r\n  border: var(--mono-border-width, 1px) solid var(--_mono-table-border);\r\n  border-radius: var(--mono-radius-sm, 0.5rem);\r\n  font-family: inherit;\r\n  font-size: 0.8rem;\r\n  color: var(--_mono-table-muted);\r\n  background: var(--_mono-table-soft);\r\n  outline: none;\r\n  cursor: pointer;\r\n}\r\n\r\n:is([mono-sel],.mono-table-sel):focus {\r\n  border-color: var(--_mono-table-accent);\r\n}\r\n\r\n:is([mono-sel],.mono-table-sel):disabled {\r\n  opacity: 0.55;\r\n  cursor: not-allowed;\r\n}\r\n\r\n:is([mono-table-info],.mono-table-info) {\r\n  font-size: 0.78rem;\r\n  color: var(--_mono-table-muted);\r\n}\r\n\r\n/* ── Native table wrapper ───────────────────────────────────────────────── */\r\n\r\n:is([mono-table-scroll],.mono-table-scroll) {\r\n  width: 100%;\r\n  max-width: 100%;\r\n  overflow-x: auto;\r\n  overflow-y: hidden;\r\n  -webkit-overflow-scrolling: touch;\r\n  overscroll-behavior-x: contain;\r\n}\r\n\r\n/* Opt-in vertical scroll region for infinity/virtual paging. Add `scroll-y` +\r\n   an inline `max-height`; the container becomes the scroll target that\r\n   `<mono-table-paging type=\"infinity-scroll|virtual-scroll\">` drives. */\r\n:is([mono-table-scroll],.mono-table-scroll):is([mono-scroll-y],.scroll-y) {\r\n  overflow-y: auto;\r\n  overscroll-behavior-y: contain;\r\n  position: relative;\r\n}\r\n\r\n/* Opt-in sticky header so column titles stay visible while the rows scroll.\r\n\r\n   A pinned cell in a `border-collapse: collapse` table keeps its TEXT and loses\r\n   everything else. Collapsed borders belong to the table, not the cell — they are\r\n   painted where the cell sits in flow — so the header's bottom rule, a pinned\r\n   column's edge and any `th { border-right }` a consumer adds all scrolled away\r\n   under the frozen titles. And the header gradient sits on `thead`, which\r\n   scrolls too, so the rows showed through the transparent cells.\r\n\r\n   A pinned COLUMN (`mono-table-sticky-left` / `-right`) is the same story\r\n   sideways: its edge was painted at the cell's flow position, off in the\r\n   scrolled-away part of the table, and the borders of the cells sliding UNDER\r\n   it leaked through as ticks between the rows.\r\n\r\n   So any table with a frozen cell — sticky head, sticky foot, a pinned column —\r\n   uses SEPARATE borders with zero spacing: the same geometry (each row still\r\n   carries its 1px rule, the header its 2px), but every cell paints its own\r\n   borders inside its own box and carries them along, and a cell sliding under\r\n   a pinned one takes its border with it. The pinned cells get an opaque\r\n   background of their own. Separate borders ignore a `<tr>` border, so the body\r\n   row rule moves onto the cells here. */\r\n:is([mono-table],.mono-table):is([mono-sticky-head],.mono-table-sticky-head),\r\n:is([mono-sticky-head],.mono-table-sticky-head) :is([mono-table],.mono-table),\r\n:is([mono-table],.mono-table):is([mono-sticky-foot],.mono-table-sticky-foot),\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) :is([mono-table],.mono-table),\r\n:is([mono-table],.mono-table):has(:is([mono-sticky-left],.mono-table-sticky-left), :is([mono-sticky-right],.mono-table-sticky-right)) {\r\n  border-collapse: separate;\r\n  border-spacing: 0;\r\n}\r\n:is([mono-sticky-head],.mono-table-sticky-head) tbody tr > td,\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) tbody tr > td,\r\n:is([mono-table],.mono-table):has(:is([mono-sticky-left],.mono-table-sticky-left), :is([mono-sticky-right],.mono-table-sticky-right)) tbody tr > td {\r\n  border-bottom: 1px solid var(--_mono-table-border-lite);\r\n}\r\n:is([mono-sticky-head],.mono-table-sticky-head) tbody tr:last-child > td,\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) tbody tr:last-child > td,\r\n:is([mono-table],.mono-table):has(:is([mono-sticky-left],.mono-table-sticky-left), :is([mono-sticky-right],.mono-table-sticky-right)) tbody tr:last-child > td {\r\n  border-bottom: none;\r\n}\r\n/* (0,2,2) on purpose — a STATE rule. `[mono-sticky-head] thead th` alone is\r\n   (0,1,2): attribute + two type selectors — the SAME weight as the resting\r\n   `[mono-table] thead th` paint further down, which then won on source order\r\n   and left a frozen head see-through. The marker may sit on the table or on\r\n   its scroll wrapper, so both forms. */\r\n:is([mono-table],.mono-table):is([mono-sticky-head],.mono-table-sticky-head) thead th,\r\n:is([mono-sticky-head],.mono-table-sticky-head) :is([mono-table],.mono-table) thead th {\r\n  position: sticky;\r\n  top: 0;\r\n  z-index: 2;\r\n  /* Opaque — the gradient is on `thead` and does not follow; same fill the\r\n     pinned-column header cells use, so the two kinds of frozen cell match. */\r\n  background: var(--_mono-table-head-frozen-bg);\r\n}\r\n\r\n/* Opt-in sticky footer — mirrors sticky-head so an aggregate row (usually\r\n   holding <mono-table-summary> cells) stays pinned to the bottom while the body\r\n   scrolls. Needs an opaque background or scrolled rows show through.\r\n\r\n   It draws NO separator of its own. `[mono-table] tfoot td/th` further down\r\n   already carries a `border-top`, and this rule used to add a hairline shadow on\r\n   that same edge — so a pinned footer read as two lines a pixel apart. The\r\n   border is the one that stays. */\r\n/* (0,2,2) on purpose — a STATE rule. The marker may sit on the table or on its\r\n   scroll wrapper, so both forms; and a host page's cell-padding rule at (0,2,1)\r\n   (these docs carry one, to undo VitePress's own) must not take the scrollbar\r\n   band away. */\r\n:is([mono-table],.mono-table):is([mono-sticky-foot],.mono-table-sticky-foot) tfoot th,\r\n:is([mono-table],.mono-table):is([mono-sticky-foot],.mono-table-sticky-foot) tfoot td,\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) :is([mono-table],.mono-table) tfoot th,\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) :is([mono-table],.mono-table) tfoot td {\r\n  position: sticky;\r\n  bottom: 0;\r\n  z-index: 2;\r\n  background: var(--_mono-table-foot-bg);\r\n  /* Reserve space at the bottom of the cell for a horizontal scrollbar that\r\n     shares this edge (mainly for OVERLAY scrollbars, which draw over content).\r\n     The totals text sits above this band and the cell's opaque background fills\r\n     it — so the scrollbar covers the empty band, not the numbers, with no\r\n     content peeking through (unlike padding on the container). Off by default so\r\n     classic-scrollbar layouts (footer already above the bar) aren't made chunky;\r\n     opt in with `--mono-table-foot-scrollbar` (e.g. `0.6rem`). */\r\n  padding-bottom: calc(0.65rem + var(--mono-table-foot-scrollbar, 0rem));\r\n}\r\n\r\n/* A NON-sticky footer at the end of a scroll region shares the bottom edge with\r\n   the horizontal scrollbar; this gap lifts it clear. Scoped with `:has(tfoot)` so\r\n   scroll regions without a footer (virtual / infinity paging) keep their exact\r\n   scroll math, and EXCLUDED for a sticky footer — that one already pins itself\r\n   above the scrollbar, so the padding would only open a strip below the frozen\r\n   totals where scrolled rows peek through. Tune with `--mono-table-foot-gap`. */\r\n:is([mono-table-scroll],.mono-table-scroll):has(tfoot):not(:has(:is([mono-sticky-foot],.mono-table-sticky-foot))) {\r\n  padding-bottom: var(--_mono-table-foot-gap, 0.4rem);\r\n}\r\n\r\n/* Footer cells are OPAQUE and separated by a top border, so:\r\n   • a pinned footer cell (sticky column) doesn't let horizontally-scrolled body\r\n     cells show through it (the totals stay legible over the scrolling data), and\r\n   • the totals read as a distinct row.\r\n   The sticky-column z-index already lifts a pinned footer cell above the body. */\r\n/* basecoat@1.0.2 styles/vega.css .table tfoot — bg-muted/50 border-t font-medium\r\n   A DIFFERENT wash from the rows, on purpose: a footer painted the row colour\r\n   read as one more row, and pinned, as a row sliding over the others. */\r\n:is([mono-table],.mono-table) tfoot td,\r\n:is([mono-table],.mono-table) tfoot th {\r\n  background: var(--_mono-table-foot-bg);\r\n  border-top: var(--mono-border-width) solid var(--_mono-table-border);\r\n  font-weight: var(--mono-font-weight-medium);\r\n}\r\n\r\n/* Aggregate value rendered by <mono-table-summary>. Tabular figures so a column\r\n   of totals lines up; slightly heavier than body text. */\r\n:is([mono-table-summary],.mono-table-summary) {\r\n  font-weight: var(--mono-font-weight-semibold, 600);\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n/* Scroll-paging status strip (Load more / Loading… / — end —). */\r\n:is([mono-table-paging],.mono-table-pg):is([mono-pg-scroll],.mono-table-pg-scroll) {\r\n  justify-content: center;\r\n  padding: 0.5rem 0;\r\n  color: rgba(var(--theme-text-rgb, 26, 45, 66), 0.6);\r\n  font-size: 0.82rem;\r\n}\r\n\r\n:is([mono-table-shell],.mono-table-shell),\r\n:is([mono-table-card],.mono-table-card),\r\n:is([mono-table-toolbar],.mono-table-toolbar),\r\n:is([mono-table-foot],.mono-table-foot) {\r\n  min-width: 0;\r\n  max-width: 100%;\r\n}\r\n\r\n/* ── Loading overlay (mono-table-loading) ───────────────────────────────────\r\n   A drop-in spinner overlay dropped straight into the <table> (or into\r\n   [mono-table-scroll]). A bare custom element is not valid in a row section, so the\r\n   core wraps itself in a zero-height <tr><td colspan> on connect — see\r\n   `_ensureRowHost`; a hand-written <caption> or <td> host is honoured as-is.\r\n   The host is out of normal flow (position:absolute), so its row adds no layout and\r\n   the overlay covers the nearest positioned ancestor (the core sets\r\n   position:relative on the table / scroll wrapper for it). Hidden until the\r\n   core reflects [data-mono-loading] from the controller's `loading` state — or until the\r\n   consumer sets [data-loading] from a busy flag of its own.\r\n   `mono-shadow-table-loading` styles the light-DOM host from this global sheet;\r\n   the shadow build additionally rewrites these to `:host` for the spinner tree. */\r\n\r\nmono-table-loading,\r\nmono-shadow-table-loading {\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: var(--_mono-table-loading-z, 10);\r\n  display: none;\r\n  /* Anchored at the TOP, not centred: `sticky` below only moves the spinner once its static\r\n     position would leave the view, so a static position in the middle of a tall table gives a\r\n     different result at every scroll offset. From the top, one `top` holds at all of them. */\r\n  align-items: flex-start;\r\n  justify-content: center;\r\n  background: var(--_mono-table-loading-bg);\r\n  backdrop-filter: blur(var(--_mono-table-loading-blur));\r\n  -webkit-backdrop-filter: blur(var(--_mono-table-loading-blur));\r\n  pointer-events: none;\r\n}\r\n\r\n/* Two independent sources, two attributes. `data-loading` is the CONSUMER's — set it from your\r\n   own busy flag and the element never touches it. `data-mono-loading` is the element's own,\r\n   reflected from the bound controller's `loading`. Either one shows the overlay; one attribute\r\n   shared between both would need the element to work out who wrote it, which is not knowable\r\n   (a MutationObserver reports asynchronously, after any \"I am writing\" flag has been reset). */\r\nmono-table-loading[data-loading],\r\nmono-table-loading[data-mono-loading],\r\nmono-shadow-table-loading[data-loading],\r\nmono-shadow-table-loading[data-mono-loading] {\r\n  display: flex;\r\n}\r\n\r\n/* ── Pending placeholder (the automatic skeleton, `pending`) ───────────────────\r\n   For the controller's FIRST load the element shows a phantom-ui block of placeholder\r\n   rows mirroring the header instead of the spinner — same overlay geometry, not dimmed\r\n   (there is nothing under it yet). The row/cell/bar classes are the structure phantom\r\n   measures; the bars carry a real background so it counts them as blocks. Colours and\r\n   radius come from the theme hooks shared with components/skeleton/skeleton.css. */\r\nmono-table-loading[data-mono-pending],\r\nmono-shadow-table-loading[data-mono-pending] {\r\n  display: block;\r\n  align-items: stretch;\r\n  background: transparent;\r\n  backdrop-filter: none;\r\n  -webkit-backdrop-filter: none;\r\n  pointer-events: none;\r\n}\r\n\r\n:is([mono-table-skeleton], .mono-table-skeleton) {\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n}\r\n\r\n:is([mono-table-skeleton-row], .mono-table-skeleton-row) {\r\n  display: flex;\r\n  align-items: center;\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n}\r\n\r\n:is([mono-table-skeleton-cell], .mono-table-skeleton-cell) {\r\n  flex: none;\r\n  box-sizing: border-box;\r\n  padding-inline: 0.75rem;\r\n}\r\n\r\n:is([mono-table-skeleton-bar], .mono-table-skeleton-bar) {\r\n  display: block;\r\n  width: 100%;\r\n  height: calc(var(--_mono-table-th-height, 2.5rem) * 0.4);\r\n  border-radius: var(--mono-skeleton-radius, var(--mono-radius-sm, 0.25rem));\r\n  background: var(--mono-skeleton-bg, var(--mono-mode-surface-hover, var(--muted)));\r\n}\r\n\r\n/* The row `mono-table-loading` builds for itself when it is dropped straight into\r\n   a row section (see `_ensureRowHost`). It is a host, not a layout participant:\r\n   any height, padding or border here would open a permanent gap under the header\r\n   whether or not anything is loading. */\r\n/* `!important` for the same reason as `[mono-error-row] > td` below: this\r\n   cell is a host, not content, and a consumer's generic `td { padding }` would\r\n   otherwise open a permanent gap under the header — on a row whose entire job is\r\n   to occupy no space at all. */\r\n:is([mono-loading-row],.mono-table-loading-row),\r\n:is([mono-loading-row],.mono-table-loading-row) > td {\r\n  height: 0 !important;\r\n  padding: 0 !important;\r\n  border: 0 !important;\r\n}\r\n\r\n:is([mono-loading-spinner],.mono-table-spinner) {\r\n  box-sizing: border-box;\r\n  width: var(--_mono-table-spinner-size);\r\n  height: var(--_mono-table-spinner-size);\r\n  border: var(--_mono-table-spinner-width) solid var(--_mono-table-spinner-color);\r\n  border-right-color: transparent;\r\n  border-radius: 50%;\r\n  animation: mono-table-spin var(--_mono-table-spinner-speed) linear infinite;\r\n\r\n  /* Stay in the VISIBLE area of a table that scrolls.\r\n\r\n     The overlay covers the whole table — that is what keeps every column and row dimmed\r\n     however far you have scrolled — but the centre of a wide or long table is far outside\r\n     the scrollport, and a spinner you have to scroll to find reads as no spinner at all.\r\n\r\n     So the spinner is pinned a constant distance below the header instead. Only `top` is\r\n     set: a second inset on the same axis gives sticky two edges to satisfy and it slides\r\n     between them as you scroll, which is what made the old `inset: 1rem` drift. The header\r\n     offset is measured and published by the element (0 unless the header is frozen). */\r\n  position: sticky;\r\n  top: calc(var(--mono-table-loading-head, 0px) + var(--_mono-table-loading-gap, 1.25rem));\r\n  /* `auto` = no horizontal stickiness, so a table with no scroll region keeps the flex\r\n     centring below and this costs it nothing. The offset is handed down by the overlay\r\n     (next rule) only where there IS a scrollport to centre on. */\r\n  left: var(--mono-table-loading-x, auto);\r\n}\r\n\r\n/* Centre the spinner on the SCROLLPORT rather than on the table, so it lands in the middle\r\n   of what you can actually see at any horizontal offset.\r\n\r\n   Both halves are scoped to `[mono-table-scroll]`. `cqw` with no query container resolves\r\n   against the small VIEWPORT, which would throw the spinner off a table that has no scroll\r\n   region — and there the default `justify-content: center` already centres it on the table,\r\n   which for a table that does not scroll is the same place. `:has()` keeps the containment\r\n   off scrollers this feature never touches — keyed on the ELEMENT, not on the row it generates,\r\n   so a `<caption>` or hand-written `<td>` host gets the same treatment.\r\n\r\n   The offset travels as a custom property on the OVERLAY rather than as a rule on the\r\n   spinner, so the shadow build gets it too: this sheet styles the light-DOM\r\n   `mono-shadow-table-loading` host, and the value inherits across the shadow boundary to\r\n   the spinner — where a `[mono-table-scroll] <spinner>` descendant selector never would. */\r\n:is([mono-table-scroll],.mono-table-scroll):has(mono-table-loading),\r\n:is([mono-table-scroll],.mono-table-scroll):has(mono-shadow-table-loading),\r\n:is([mono-table-scroll],.mono-table-scroll):has(mono-table-error),\r\n:is([mono-table-scroll],.mono-table-scroll):has(mono-shadow-table-error) {\r\n  container-type: inline-size;\r\n}\r\n\r\n:is([mono-table-scroll],.mono-table-scroll) mono-table-loading,\r\n:is([mono-table-scroll],.mono-table-scroll) mono-shadow-table-loading {\r\n  justify-content: flex-start;\r\n  --mono-table-loading-x: calc(50cqw - var(--_mono-table-spinner-size) / 2);\r\n}\r\n\r\n@keyframes mono-table-spin {\r\n  to {\r\n    transform: rotate(360deg);\r\n  }\r\n}\r\n\r\n/* ── Header filter (mono-table-th `header-filter`) ───────────────────────────\r\n   Right-click a header → `[mono-th-menu]` (one \"Header Filter\" item) → the\r\n   cascading `[mono-th-filter]` panel of the column's distinct values. Both panels\r\n   are body-portaled by PopupPortalController (position:fixed, top/left applied),\r\n   so they escape the table/card's clipping/stacking. The panels re-declare the\r\n   `--mono-table-*` token chain so they theme correctly at the body root; the\r\n   portal also mirrors the table's classes (color themes flow through). */\r\n\r\n/* The root block above gives a panel the whole chain; these are the few values\r\n   a POPOVER resolves differently. Its surface is `--popover` and its ink\r\n   `--popover-foreground` — a panel floats over the page, not in the table — and\r\n   its hover is a real wash rather than the deliberately-off row hover. */\r\n:is([mono-th-menu],.mono-th-menu),\r\n:is([mono-th-filter],.mono-th-filter),\r\n:is([mono-search-panel],.mono-table-search-panel),\r\n:is([mono-search-more-panel],.mono-table-search-more-panel),\r\n:is([mono-search-filter],.mono-table-search-filter) {\r\n  --_mono-table-surface: var(--mono-table-surface, var(--popover));\r\n  --_mono-table-text: var(--mono-table-text, var(--popover-foreground));\r\n  --_mono-table-ink-mid: var(--mono-table-ink-mid, color-mix(in oklab, var(--popover-foreground) 82%, transparent));\r\n  --_mono-table-hover-bg: var(--mono-table-hover-bg, color-mix(in oklab, var(--muted) 50%, transparent));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css [data-popover] — bg-popover text-popover-foreground ring-foreground/10 rounded-md shadow-md ring-1\r\n   The chrome every portaled table panel shares — the header filter, the column\r\n   menu and its submenu, and the search suggestions. One set of knobs so a\r\n   flavour moves all four at once, exactly as it moves the select's and the\r\n   dropdown's popovers. */\r\n:is([mono-th-menu],.mono-th-menu),\r\n:is([mono-th-filter],.mono-th-filter),\r\n:is([mono-search-panel],.mono-table-search-panel),\r\n:is([mono-search-more-panel],.mono-table-search-more-panel),\r\n:is([mono-search-filter],.mono-table-search-filter) {\r\n  --_mono-table-panel-bg: var(--mono-table-panel-bg, var(--popover));\r\n  --_mono-table-panel-color: var(--mono-table-panel-color, var(--popover-foreground));\r\n  --_mono-table-panel-radius: var(--mono-table-panel-radius, var(--mono-radius-md));\r\n  --_mono-table-panel-ring: var(--mono-table-panel-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent));\r\n  --_mono-table-panel-shadow: var(--mono-table-panel-shadow, var(--mono-shadow-md));\r\n}\r\n\r\n/* Header-filter funnel — a BUTTON that leads the header row (so it sits left of\r\n   the caption) and opens the filter. Always visible while `showIcon` is on: it is\r\n   the affordance, not just an active-filter badge.\r\n\r\n   Two signals mark a filtered column, and the GLYPH is the primary one:\r\n   `renderIcon('funnel')` renders `i-mdi-filter-outline` at rest and `i-mdi-filter`\r\n   once the column carries a filter. The colour below reinforces it — faint at\r\n   rest, accent once filtered — but is too easy to miss at 14px on its own. */\r\n:is([mono-th-filter-ind],.mono-th-filter-ind) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  margin: 0 0.28rem 0 -0.15rem;\r\n  padding: 0.2rem 0.15rem;\r\n  border: 0;\r\n  background: none;\r\n  color: var(--_mono-table-faint);\r\n  line-height: 0;\r\n  cursor: pointer;\r\n  border-radius: var(--theme-radius-xs, 4px);\r\n  vertical-align: middle;\r\n  transition: color var(--mono-duration-fast, 150ms) var(--mono-ease, ease);\r\n}\r\n/* The funnel glyph itself. Light build: an empty <span> carrying `i-mdi-filter` /\r\n   `i-mdi-filter-outline`; shadow build: the inlined mdi SVG. Two things must be\r\n   restated here, and the descendant selector (specificity 0,2,0) is what makes\r\n   them stick in BOTH the layered prod bundle and the unlayered dev server:\r\n     · `display` — under presetWind4, preset-icons emits none, so a bare `i-*`\r\n       span is `inline` and collapses to 0x0 (invisible).\r\n     · `width`/`height` — preset-icons sizes to `1.2em`; the funnel is a fixed\r\n       0.875rem box (the 14px the inline SVG used to hard-code).\r\n   The SVG build inherits the same box, so both render identically. */\r\n:is([mono-th-filter-ind],.mono-th-filter-ind) :is([mono-th-filter-glyph],.mono-th-filter-glyph),\r\n:is([mono-th-menu-ic],.mono-th-menu-ic) :is([mono-th-filter-glyph],.mono-th-filter-glyph) {\r\n  display: block;\r\n  width: 0.875rem;\r\n  height: 0.875rem;\r\n  flex-shrink: 0;\r\n}\r\n:is([mono-th-filter-ind],.mono-th-filter-ind):hover,\r\n:is([mono-th-filter-ind],.mono-th-filter-ind):focus-visible {\r\n  color: var(--_mono-table-accent);\r\n  outline: none;\r\n}\r\n:is([mono-th-filter-ind],.mono-th-filter-ind):focus-visible {\r\n  box-shadow: 0 0 0 2px color-mix(in oklab, var(--_mono-table-accent) 30%, transparent);\r\n}\r\n/* Filtered → the funnel switches COLOUR, on top of the outlined→filled glyph swap\r\n   the builds' `renderIcon('funnel')` already made (it used to switch `display`). */\r\nmono-table-th[data-filtered] :is([mono-th-filter-ind],.mono-th-filter-ind),\r\nmono-shadow-table-th[data-filtered] :is([mono-th-filter-ind],.mono-th-filter-ind),\r\n:host([data-filtered]) :is([mono-th-filter-ind],.mono-th-filter-ind) {\r\n  color: var(--_mono-table-accent);\r\n}\r\n\r\n\r\n/* ── Required-column marker (mono-table-th `required`) ───────────────────────\r\n   The header lays out as three independent boxes — funnel, caption, sort arrow —\r\n   so a marker placed among them drifts away from the text the moment the header\r\n   wraps (a narrow column puts the funnel on its own line above the caption). It\r\n   is rendered INSIDE this wrapper with the label instead, and an inline-flex\r\n   container with the default `nowrap` cannot break between its two items, so the\r\n   `*` and the caption stay together at any width. The wrapper is only emitted for\r\n   a marked column. */\r\n:is([mono-th-caption],.mono-th-caption) {\r\n  display: inline-flex;\r\n  /* Baseline, NOT `flex-start`: the group is as tall as the label's whole line\r\n     box, so top-aligning threw the `*` up to the top of that box — visibly adrift\r\n     above the word rather than attached to it. Sharing the baseline puts it where\r\n     a superscript belongs, and the asterisk glyph already sits high in its own em\r\n     box, so it lands around the caption's cap height with no raise of its own. */\r\n  align-items: baseline;\r\n  /* No gap: the marker supplies its own hair of margin. A gap here would space it\r\n     off the caption the way the funnel and the sort arrow are spaced — which is\r\n     what made a narrow column read as `AGE * ↑` with the `*` crowding the arrow. */\r\n  gap: 0;\r\n  /* The label may be squeezed in a narrow column; the marker must not be, so give\r\n     the group a shrinkable floor and pin the marker below. */\r\n  min-width: 0;\r\n}\r\n/* The same red `*` the form controls draw for their own `required`\r\n   (`.mono-input-required`), so one marker means one thing across the library.\r\n   It is deliberately NOT sized like the header's other marks: the funnel and the\r\n   sort caret are fixed ~0.875rem boxes that reserve a slot of their own, while\r\n   this is a hairline glyph that hangs off the end of the caption. `flex: 0 0 auto`\r\n   keeps it from being shrunk into the text or stretched into a box, and a\r\n   `line-height` under the label's own means it cannot grow the header row.\r\n   `<sup>` is a flex item here, so its native `vertical-align: super` does nothing\r\n   — the shared baseline above plus the glyph's own height is what raises it. */\r\n:is([mono-th-required],.mono-th-required) {\r\n  flex: 0 0 auto;\r\n  margin-left: 0.1em;\r\n  color: var(--_mono-table-error);\r\n  font-size: 0.75em;\r\n  line-height: 1;\r\n}\r\n\r\n/* Icon-less sort (`sort.showIcon: false`) — the caption itself is the button, so\r\n   strip the arrow-sized padding and let it inherit the header's typography. */\r\n:is([mono-sort-head],.mono-table-sort-head):is([mono-no-icon],.no-icon) :is([mono-sort-btn],.mono-table-sort-btn):is([mono-label-trigger],.label-trigger) {\r\n  margin: 0;\r\n  padding: 0;\r\n  line-height: inherit;\r\n  letter-spacing: inherit;\r\n  text-transform: inherit;\r\n}\r\n\r\n/* The small right-click menu. */\r\n:is([mono-th-menu],.mono-th-menu) {\r\n  display: none;\r\n  position: fixed;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  min-width: 158px;\r\n  padding: 0.25rem;\r\n  background: var(--_mono-table-panel-bg, var(--popover));\r\n  border: 0;\r\n  border-radius: var(--_mono-table-panel-radius, var(--mono-radius-md));\r\n  box-shadow: var(--_mono-table-panel-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--_mono-table-panel-shadow, var(--mono-shadow-md));\r\n  font-size: 0.82rem;\r\n}\r\n:is([mono-th-menu],.mono-th-menu):is([mono-open],.open) {\r\n  display: block;\r\n}\r\n:is([mono-th-menu-item],.mono-th-menu-item) {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 0.5rem;\r\n  width: 100%;\r\n  padding: 0.42rem 0.5rem;\r\n  border: 0;\r\n  border-radius: var(--_mono-table-control-radius, var(--mono-radius-md));\r\n  background: transparent;\r\n  color: var(--_mono-table-text);\r\n  cursor: pointer;\r\n  font: inherit;\r\n  text-align: left;\r\n}\r\n:is([mono-th-menu-item],.mono-th-menu-item):hover {\r\n  background: var(--_mono-table-soft);\r\n}\r\n/* \"Clear all sorting\" while nothing is sorted — inert, and no hover affordance. */\r\n:is([mono-th-menu-item],.mono-th-menu-item):disabled {\r\n  opacity: 0.45;\r\n  cursor: default;\r\n}\r\n:is([mono-th-menu-item],.mono-th-menu-item):disabled:hover {\r\n  background: transparent;\r\n}\r\n:is([mono-th-menu-label],.mono-th-menu-label) {\r\n  flex: 1;\r\n}\r\n:is([mono-th-menu-ic],.mono-th-menu-ic),\r\n:is([mono-th-menu-caret],.mono-th-menu-caret),\r\n:is([mono-th-menu-check],.mono-th-menu-check) {\r\n  display: inline-flex;\r\n  color: var(--_mono-table-muted);\r\n}\r\n/* Divider between the Sort and Header Filter sections when a column has both,\r\n   and above \"Clear all sorting\" in the Sort submenu. */\r\n:is([mono-th-menu-sep],.mono-th-menu-sep) {\r\n  height: 1px;\r\n  margin: 0.25rem 0.1rem;\r\n  background: var(--_mono-table-border);\r\n}\r\n/* The Sort submenu reuses `[mono-th-menu]`'s surface/border/shadow — only its\r\n   sizing differs, so there is no duplicated box styling here. Wide enough for\r\n   \"Clear all sorting\" to sit on one line. */\r\n:is([mono-th-submenu],.mono-th-submenu) {\r\n  min-width: 176px;\r\n}\r\n/* The active direction in the Sort submenu. */\r\n:is([mono-th-menu-item],.mono-th-menu-item):is([mono-active],.active) {\r\n  color: var(--_mono-table-accent);\r\n  font-weight: 600;\r\n}\r\n:is([mono-th-menu-item],.mono-th-menu-item):is([mono-active],.active) :is([mono-th-menu-ic],.mono-th-menu-ic),\r\n:is([mono-th-menu-item],.mono-th-menu-item):is([mono-active],.active) :is([mono-th-menu-check],.mono-th-menu-check) {\r\n  color: var(--_mono-table-accent);\r\n}\r\n\r\n/* The cascading distinct-values panel. */\r\n:is([mono-th-filter],.mono-th-filter) {\r\n  display: none;\r\n  position: fixed;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  width: 244px;\r\n  flex-direction: column;\r\n  background: var(--_mono-table-panel-bg);\r\n  color: var(--_mono-table-panel-color);\r\n  /* a RING, not a border — upstream draws the edge in the shadow so the corner\r\n     stays clean at every radius the flavours ask for */\r\n  border: 0;\r\n  border-radius: var(--_mono-table-panel-radius);\r\n  box-shadow: var(--_mono-table-panel-ring), var(--_mono-table-panel-shadow);\r\n  font-size: var(--_mono-table-font);\r\n  /* `clip`, not `hidden`: a `hidden` box is still PROGRAMMATICALLY scrollable, so\r\n     anything that focuses an off-box descendant scrolls the panel away and it\r\n     reads blank. `clip` cannot scroll at all. The list keeps its own scrollport,\r\n     and the sticky \"(Select all)\" sticks against that, not against this. */\r\n  overflow: clip;\r\n}\r\n:is([mono-th-filter],.mono-th-filter):is([mono-open],.open) {\r\n  display: flex;\r\n}\r\n:is([mono-th-filter-head],.mono-th-filter-head) {\r\n  padding: 0.55rem 0.65rem;\r\n  font-weight: 600;\r\n  color: var(--_mono-table-text);\r\n  border-bottom: 1px solid var(--_mono-table-border-lite);\r\n}\r\n:is([mono-th-filter-search],.mono-th-filter-search) {\r\n  padding: 0.5rem 0.55rem 0.35rem;\r\n}\r\n:is([mono-th-filter-input],.mono-th-filter-input) {\r\n  width: 100%;\r\n  padding: 0.38rem 0.55rem;\r\n  border: 1px solid var(--_mono-table-border);\r\n  border-radius: var(--_mono-table-control-radius, var(--mono-radius-md));\r\n  font: inherit;\r\n  color: var(--_mono-table-text);\r\n  background: var(--_mono-table-panel-bg, var(--_mono-table-surface));\r\n}\r\n\r\n/* A host page's own placeholder colour reaches a portaled panel like anything\r\n   else — VitePress paints one in its brand purple — so state it. */\r\n:is([mono-th-filter-input],.mono-th-filter-input)::placeholder,\r\n:is([mono-search-panel],.mono-table-search-panel) input::placeholder {\r\n  color: var(--_mono-table-muted);\r\n  opacity: 1;\r\n}\r\n:is([mono-th-filter-input],.mono-th-filter-input):focus-visible {\r\n  outline: none;\r\n  border-color: var(--_mono-table-accent);\r\n  box-shadow: 0 0 0 3px color-mix(in oklab, var(--_mono-table-accent) 18%, transparent);\r\n}\r\n:is([mono-th-filter-list],.mono-th-filter-list) {\r\n  max-height: 224px;\r\n  overflow-y: auto;\r\n  /* Don't chain to the document at the ends of the list. This panel is\r\n     `position: fixed` and body-portaled, and PopupPortalController re-anchors it\r\n     to the funnel on every window scroll — so a chained scroll drags the panel\r\n     off-screen with its header and the list just reads as \"blank\". */\r\n  overscroll-behavior: contain;\r\n  padding: 0.15rem 0.35rem 0.25rem;\r\n}\r\n:is([mono-th-filter-msg],.mono-th-filter-msg) {\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 0.5rem;\r\n  padding: 1rem 0.6rem;\r\n  color: var(--_mono-table-muted);\r\n  text-align: center;\r\n}\r\n:is([mono-th-filter-msg-text],.mono-th-filter-msg-text) {\r\n  font-size: 0.82rem;\r\n}\r\n:is([mono-th-retry],.mono-th-retry) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.35rem;\r\n  padding: 0.3rem 0.7rem;\r\n  border: 1px solid var(--_mono-table-border);\r\n  border-radius: var(--_mono-table-control-radius, var(--mono-radius-md));\r\n  background: transparent;\r\n  color: var(--_mono-table-accent);\r\n  font: inherit;\r\n  font-size: 0.78rem;\r\n  cursor: pointer;\r\n}\r\n:is([mono-th-retry],.mono-th-retry):hover {\r\n  background: var(--_mono-table-soft);\r\n  border-color: var(--_mono-table-accent);\r\n}\r\n:is([mono-th-retry],.mono-th-retry) svg {\r\n  color: var(--_mono-table-accent);\r\n}\r\n:is([mono-th-filter-spin],.mono-th-filter-spin) {\r\n  display: inline-block;\r\n  width: 0.9rem;\r\n  height: 0.9rem;\r\n  margin-right: 0.4rem;\r\n  border: 2px solid var(--_mono-table-accent);\r\n  border-right-color: transparent;\r\n  border-radius: 50%;\r\n  vertical-align: -0.15rem;\r\n  animation: mono-table-spin 0.65s linear infinite;\r\n}\r\n\r\n/* Native checkbox rows, styled to match mono-checkbox. */\r\n:is([mono-th-check],.mono-th-check) {\r\n  /* LOAD-BEARING (same line `.mono-checkbox` carries). The real <input> below is\r\n     `position: absolute`, so without a positioned row it resolves against the\r\n     PANEL — it then stays put while the list scrolls, lands outside the panel's\r\n     box, and clicking the label focuses it, making the browser scroll the\r\n     `overflow` panel to reach it. The whole panel scrolls away and reads blank. */\r\n  position: relative;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 0.55rem;\r\n  padding: 0.34rem 0.4rem;\r\n  border-radius: var(--_mono-table-control-radius, var(--mono-radius-md));\r\n  cursor: pointer;\r\n  color: var(--_mono-table-text);\r\n}\r\n:is([mono-th-check],.mono-th-check):hover {\r\n  background: var(--_mono-table-soft);\r\n}\r\n:is([mono-th-check],.mono-th-check) input {\r\n  position: absolute;\r\n  opacity: 0;\r\n  width: 1px;\r\n  height: 1px;\r\n  margin: 0;\r\n  pointer-events: none;\r\n}\r\n:is([mono-th-check-box],.mono-th-check-box) {\r\n  position: relative;\r\n  flex: 0 0 auto;\r\n  width: 1rem;\r\n  height: 1rem;\r\n  border: 2px solid color-mix(in oklab, var(--_mono-table-border) 72%, var(--_mono-table-muted));\r\n  border-radius: 0.3rem;\r\n  background: var(--_mono-table-surface);\r\n  transition:\r\n    background-color 0.15s ease,\r\n    border-color 0.15s ease;\r\n}\r\n:is([mono-th-check],.mono-th-check) input:checked ~ :is([mono-th-check-box],.mono-th-check-box) {\r\n  background: var(--_mono-table-accent);\r\n  border-color: var(--_mono-table-accent);\r\n}\r\n:is([mono-th-check],.mono-th-check) input:checked ~ :is([mono-th-check-box],.mono-th-check-box)::after {\r\n  content: '';\r\n  position: absolute;\r\n  left: 4px;\r\n  top: 1px;\r\n  width: 4px;\r\n  height: 8px;\r\n  border: solid var(--_mono-table-on-accent);\r\n  border-width: 0 2px 2px 0;\r\n  transform: rotate(45deg);\r\n}\r\n:is([mono-th-check],.mono-th-check) input:focus-visible ~ :is([mono-th-check-box],.mono-th-check-box) {\r\n  box-shadow: 0 0 0 3px color-mix(in oklab, var(--_mono-table-accent) 20%, transparent);\r\n}\r\n/* Tri-state: a partly-ticked period (some of its months, not all) shows a dash. */\r\n:is([mono-th-check],.mono-th-check) input:indeterminate ~ :is([mono-th-check-box],.mono-th-check-box) {\r\n  background: var(--_mono-table-accent);\r\n  border-color: var(--_mono-table-accent);\r\n}\r\n:is([mono-th-check],.mono-th-check) input:indeterminate ~ :is([mono-th-check-box],.mono-th-check-box)::after {\r\n  content: '';\r\n  position: absolute;\r\n  left: 2px;\r\n  right: 2px;\r\n  top: 5px;\r\n  height: 2px;\r\n  background: var(--_mono-table-surface);\r\n  border: 0;\r\n  transform: none;\r\n}\r\n\r\n/* ── Date filter: the value list as a year → … → second tree ────────────────\r\n   Same rows as the plain list (`[mono-th-check]`), each preceded by an expand\r\n   chevron and indented per level. Only periods that occur in the data exist,\r\n   so a leaf is a node with nothing below it (its chevron is hidden, not\r\n   removed, to keep the labels aligned). */\r\n:is([mono-th-tree],.mono-th-tree) {\r\n  list-style: none;\r\n  margin: 0;\r\n  padding: 0;\r\n}\r\n:is([mono-th-tree-row],.mono-th-tree-row) {\r\n  display: flex;\r\n  align-items: center;\r\n  padding-left: calc(var(--mono-th-tree-indent, 1rem) * var(--_level, 0));\r\n}\r\n:is([mono-th-tree-row],.mono-th-tree-row)[data-level='1'] { --_level: 1; }\r\n:is([mono-th-tree-row],.mono-th-tree-row)[data-level='2'] { --_level: 2; }\r\n:is([mono-th-tree-row],.mono-th-tree-row)[data-level='3'] { --_level: 3; }\r\n:is([mono-th-tree-row],.mono-th-tree-row)[data-level='4'] { --_level: 4; }\r\n:is([mono-th-tree-row],.mono-th-tree-row)[data-level='5'] { --_level: 5; }\r\n:is([mono-th-tree-row],.mono-th-tree-row) > :is([mono-th-check],.mono-th-check) {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n:is([mono-th-tree-toggle],.mono-th-tree-toggle) {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: 1.25rem;\r\n  height: 1.25rem;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: 0.3rem;\r\n  background: transparent;\r\n  color: var(--_mono-table-faint);\r\n  cursor: pointer;\r\n}\r\n:is([mono-th-tree-toggle],.mono-th-tree-toggle)[hidden] {\r\n  display: inline-flex;\r\n  visibility: hidden;\r\n}\r\n:is([mono-th-tree-toggle],.mono-th-tree-toggle):hover {\r\n  background: var(--_mono-table-soft);\r\n  color: var(--_mono-table-text);\r\n}\r\n:is([mono-th-tree-toggle],.mono-th-tree-toggle) > svg,\r\n:is([mono-th-tree-toggle],.mono-th-tree-toggle) > .mono-icon {\r\n  width: 0.85rem;\r\n  height: 0.85rem;\r\n  transition: transform 0.15s ease; /* the glyph points right; open turns it down */\r\n}\r\n:is([mono-th-tree-toggle],.mono-th-tree-toggle):is([mono-open],.open) > svg,\r\n:is([mono-th-tree-toggle],.mono-th-tree-toggle):is([mono-open],.open) > .mono-icon {\r\n  transform: rotate(90deg);\r\n}\r\n:is([mono-th-check-label],.mono-th-check-label) {\r\n  flex: 1;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n:is([mono-th-check-count],.mono-th-check-count) {\r\n  color: var(--_mono-table-faint);\r\n  font-variant-numeric: tabular-nums;\r\n  font-size: 0.76rem;\r\n}\r\n/* `(Select all)` pins to the top of the scrolling value list so it stays reachable\r\n   in a long column. `[mono-th-filter-list]` is the scrollport (max-height +\r\n   overflow-y), so `top: 0` sticks against it. An opaque background is required —\r\n   without it the scrolling rows would show through. The negative top padding\r\n   compensates for the list's own padding so nothing peeks above the pinned row. */\r\n:is([mono-th-check-all],.mono-th-check-all) {\r\n  position: sticky;\r\n  top: -0.15rem;\r\n  z-index: 1;\r\n  background: var(--_mono-table-surface);\r\n  border-bottom: 1px solid var(--_mono-table-border-lite);\r\n  border-radius: 0;\r\n  margin-bottom: 0.15rem;\r\n  font-weight: 600;\r\n}\r\n\r\n/* Footer actions. */\r\n/* MUST wrap: the panel is a fixed width, so a fourth button (\"Clear all\", only\r\n   present on the multi-column menu path) or a longer translation overflows the\r\n   row — and an overflowing button sits OUTSIDE the panel box, where its own\r\n   click reads as an outside-click and dismisses the panel instead of firing. */\r\n:is([mono-th-filter-foot],.mono-th-filter-foot) {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 0.4rem;\r\n  padding: 0.5rem 0.55rem;\r\n  border-top: 1px solid var(--_mono-table-border-lite);\r\n}\r\n:is([mono-th-filter-foot-sp],.mono-th-filter-foot-sp) {\r\n  flex: 1 1 0;\r\n  min-width: 0;\r\n}\r\n:is([mono-th-filter-btn],.mono-th-filter-btn) {\r\n  padding: 0.34rem 0.72rem;\r\n  border-radius: var(--_mono-table-control-radius, var(--mono-radius-md));\r\n  border: 1px solid transparent;\r\n  font: inherit;\r\n  font-size: 0.8rem;\r\n  line-height: 1.2;\r\n  white-space: nowrap;\r\n  cursor: pointer;\r\n}\r\n:is([mono-th-filter-btn],.mono-th-filter-btn):is([mono-ghost],.ghost) {\r\n  background: transparent;\r\n  border-color: var(--_mono-table-border);\r\n  color: var(--_mono-table-text);\r\n}\r\n:is([mono-th-filter-btn],.mono-th-filter-btn):is([mono-ghost],.ghost):hover {\r\n  background: var(--_mono-table-soft);\r\n}\r\n:is([mono-th-filter-btn],.mono-th-filter-btn):is([mono-primary],.primary) {\r\n  background: var(--_mono-table-accent);\r\n  color: var(--_mono-table-on-accent);\r\n}\r\n:is([mono-th-filter-btn],.mono-th-filter-btn):is([mono-primary],.primary):hover {\r\n  filter: brightness(0.96);\r\n}\r\n\r\n/* ── Native table base: W3Schools-style full-width table ────────────────── */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table — w-full caption-bottom text-sm */\r\n:is([mono-table],.mono-table) {\r\n  /* A prose stylesheet that makes tables scroll — VitePress does exactly this\r\n     (`.vp-doc table { display: block; overflow-x: auto }`), and so do most\r\n     typography plugins — takes the table out of table layout entirely, and the\r\n     columns stop distributing the width. Upstream assumes a real table and\r\n     hands the scrolling to `.table-container`; state it so the assumption holds\r\n     on a host page that disagrees. */\r\n  display: table;\r\n  width: 100%;\r\n  caption-side: bottom;\r\n  font-size: var(--_mono-table-font);\r\n  line-height: var(--_mono-table-line-height);\r\n  color: var(--_mono-table-text);\r\n  /* `border-collapse: separate` — NOT upstream's default. A collapsed border\r\n     stays at the cell's flow position, so a sticky head, a sticky foot and a\r\n     pinned column all lose their edge the moment they leave it. */\r\n  border-collapse: separate;\r\n  border-spacing: 0;\r\n  border: var(--_mono-table-outer-border);\r\n  border-radius: var(--_mono-table-radius);\r\n  /* Resolved HERE, above any cell that re-points the token for its editors —\r\n     see the `font-size` note on `[mono-table] td`. */\r\n  --_mono-table-cell-font: var(--mono-table-cell-font, var(--theme-control-font-lg, 0.84rem));\r\n\r\n  /* Same trick, same reason: an editor cell sets `--theme-control-height-*: auto`\r\n     to flatten a FIELD, but checkbox / radio / switch derive their actual box size\r\n     from that token (`calc(token * 0.5)`), and `calc(auto * 0.5)` is invalid — the\r\n     box collapses to 0x0. Snapshot the real values here, above the override, so\r\n     those three can restore them further down. */\r\n  --_mono-table-ch-xs: var(--theme-control-height-xs);\r\n  --_mono-table-ch-sm: var(--theme-control-height-sm);\r\n  --_mono-table-ch-md: var(--theme-control-height-md);\r\n  --_mono-table-ch-lg: var(--theme-control-height-lg);\r\n  --_mono-table-ch-xl: var(--theme-control-height-xl);\r\n  --_mono-table-ch-xxl: var(--theme-control-height-xxl);\r\n  /* ...and the --mono-* vocabulary the ported controls read (checkbox today; radio\r\n     and switch join as they are ported — box = token × 4/9). */\r\n  --_mono-table-mch-xs: var(--mono-control-height-xs);\r\n  --_mono-table-mch-sm: var(--mono-control-height-sm);\r\n  --_mono-table-mch-md: var(--mono-control-height-md);\r\n  --_mono-table-mch-lg: var(--mono-control-height-lg);\r\n  --_mono-table-mch-xl: var(--mono-control-height-xl);\r\n  --_mono-table-mch-xxl: var(--mono-control-height-xxl);\r\n  /* ...and the border width: the editor cell zeroes `--mono-border-width` /\r\n     `--theme-border-width` to flatten a FIELD, but a ported checkbox (and radio /\r\n     switch as they port) draws its box's outline from the same token — an\r\n     unchecked box, which is outline only, went invisible in any table cell. */\r\n  --_mono-table-bw: var(--mono-border-width);\r\n  --_mono-table-tbw: var(--theme-border-width);\r\n}\r\n\r\n/* Optional: equal-width columns.\r\n   Use only when you want every column to have the same width. */\r\n:is([mono-table],.mono-table):is([mono-fixed],.mono-table-fixed) {\r\n  table-layout: fixed;\r\n}\r\n\r\n:is([mono-table],.mono-table):is([mono-fixed],.mono-table-fixed) th,\r\n:is([mono-table],.mono-table):is([mono-fixed],.mono-table-fixed) td {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* Optional: wide scroll mode.\r\n   Use only when you want the table wider than its container. */\r\n:is([mono-table],.mono-table):is([mono-wide],.mono-table-wide) {\r\n  min-width: max-content;\r\n}\r\n\r\n/* ── Table visual style ─────────────────────────────────────────────────── */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table thead — [&_tr]:border-b\r\n   The head had a two-stop gradient; the port allows none, and upstream paints\r\n   the head nothing at all — it is the page under a bottom rule. */\r\n:is([mono-table],.mono-table) thead {\r\n  background: transparent;\r\n}\r\n/* On the CELL, not the section: a host page that paints `th` (VitePress does,\r\n   with its soft surface) would otherwise cover whatever the section carried.\r\n   At (0,1,2) this beats a host's (0,1,1), and the sticky head's (0,2,2) still\r\n   beats this. */\r\n:is([mono-table],.mono-table) thead th {\r\n  background: var(--_mono-table-head-bg, transparent);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table td — p-2 align-middle whitespace-nowrap */\r\n:is([mono-table],.mono-table) td {\r\n  padding: var(--_mono-table-cell-pad);\r\n  text-align: start;\r\n  vertical-align: middle;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table th — text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap */\r\n:is([mono-table],.mono-table) th {\r\n  height: var(--_mono-table-th-height);\r\n  padding: 0 var(--_mono-table-th-pad-x);\r\n  text-align: start;\r\n  vertical-align: middle;\r\n  font-size: var(--_mono-table-th-font);\r\n  font-weight: var(--_mono-table-th-weight);\r\n  color: var(--_mono-table-th-color);\r\n  text-transform: var(--_mono-table-th-transform);\r\n  letter-spacing: var(--_mono-table-th-tracking);\r\n  white-space: nowrap;\r\n  user-select: none;\r\n  /* `thead [&_tr]:border-b` — carried on the cell, not the row, because a\r\n     `border-collapse: separate` table paints no row border at all. */\r\n  border-bottom: var(--mono-border-width) solid var(--_mono-table-border);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table caption — text-muted-foreground mt-4 text-sm */\r\n:is([mono-table],.mono-table) caption {\r\n  margin-top: calc(var(--mono-spacing) * 4);\r\n  color: var(--_mono-table-muted);\r\n  font-size: var(--_mono-table-font);\r\n}\r\n\r\n/* ── Sortable header control (<mono-table-sort> inside a <th>) ───────────── */\r\n/* Label + arrow row. The LABEL IS NOT INTERACTIVE — only the arrow button sorts,\r\n   so clicking the caption text (to select it, or on the way to a header filter)\r\n   never reorders the table. */\r\n:is([mono-sort-head],.mono-table-sort-head) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.35rem;\r\n}\r\n:is([mono-sort-btn],.mono-table-sort-btn) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  /* The arrow alone is a small target, so pad it out to a comfortable hit area\r\n     without letting the padding push the header row taller. */\r\n  margin: 0 -0.15rem;\r\n  padding: 0.2rem 0.15rem;\r\n  border: 0;\r\n  background: none;\r\n  font: inherit;\r\n  color: inherit;\r\n  line-height: 0;\r\n  cursor: pointer;\r\n  border-radius: var(--theme-radius-xs, 4px);\r\n  transition: color var(--mono-duration-fast, 150ms) var(--mono-ease, ease);\r\n}\r\n:is([mono-sort-btn],.mono-table-sort-btn):hover,\r\n:is([mono-sort-btn],.mono-table-sort-btn):focus-visible {\r\n  color: var(--_mono-table-accent);\r\n  outline: none;\r\n}\r\n:is([mono-sort-btn],.mono-table-sort-btn):focus-visible {\r\n  box-shadow: 0 0 0 2px color-mix(in oklab, var(--_mono-table-accent) 30%, transparent);\r\n}\r\n/* Sort indicator rendered at the end of the header text. A single icon whose\r\n   GLYPH encodes the state: neutral `i-fluent-arrow-sort-16-filled` when unsorted,\r\n   `i-ri-arrow-up-long-fill` / `i-ri-arrow-down-long-fill` when sorted (see the\r\n   builds' `renderIcon`). Colour still signals active vs. idle. */\r\n:is([mono-sort-ind],.mono-table-sort-ind) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  line-height: 0; /* no extra line-box height so it stays compact */\r\n  flex-shrink: 0;\r\n}\r\n/* Faint by default (a hint that the column is sortable). The descendant selector\r\n   (specificity 0,2,0) is deliberate: it must beat preset-icons' `1.2em`\r\n   width/height in BOTH the layered prod bundle and the unlayered dev server so\r\n   the box is fixed. A single square box; both the 16- and 24-viewBox glyphs scale\r\n   into it. */\r\n:is([mono-sort-ind],.mono-table-sort-ind) :is([mono-sort-caret],.mono-table-sort-caret) {\r\n  display: block;\r\n  width: 0.9rem;\r\n  height: 0.9rem;\r\n  color: var(--_mono-table-faint);\r\n  transition: color var(--mono-duration-fast, 150ms) ease;\r\n}\r\n/* Once sorted (asc or desc — anything but `none`), the directional arrow darkens\r\n   to the header text colour. */\r\n:is([mono-sort-btn],.mono-table-sort-btn):not([data-dir='none']) :is([mono-sort-caret],.mono-table-sort-caret) {\r\n  color: var(--_mono-table-text);\r\n}\r\n/* Hover/focus feedback now has to target the CARET: the button wraps only the\r\n   icon, so the inherited `color` on the button can't reach past the descendant\r\n   rules above. Same specificity as the sorted rule (0,3,0) — it must stay AFTER\r\n   it to win the tie and highlight an already-sorted column too. */\r\n:is([mono-sort-btn],.mono-table-sort-btn):hover :is([mono-sort-caret],.mono-table-sort-caret),\r\n:is([mono-sort-btn],.mono-table-sort-btn):focus-visible :is([mono-sort-caret],.mono-table-sort-caret) {\r\n  color: var(--_mono-table-accent);\r\n}\r\n/* Multi-column sort precedence, rendered beside the arrow. Only present when TWO\r\n   OR MORE columns are sorted — a lone sorted column shows just the arrow, so the\r\n   ordinary case looks unchanged. */\r\n:is([mono-sort-seq],.mono-table-sort-seq) {\r\n  /* `<sup>` defaults to a relative baseline shift; keep it but make it compact so\r\n     it can't grow the header line box. */\r\n  font-size: 0.62em;\r\n  font-weight: 700;\r\n  line-height: 1;\r\n  margin-left: 0.1em;\r\n  color: var(--_mono-table-accent);\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n:is([mono-table],.mono-table) td {\r\n  /* Read through an alias resolved on `[mono-table]`, NOT the token directly: an\r\n     editing cell re-points `--theme-control-font-*` to `1em` for its editors,\r\n     and since a custom property is visible to the element that sets it, a direct\r\n     `var(--theme-control-font-lg)` here would resolve to `1em` and blow the\r\n     cell's own text up to the inherited size. */\r\n  font-size: var(--_mono-table-cell-font);\r\n  color: var(--_mono-table-ink-mid);\r\n}\r\n\r\n/* ── Row background ──────────────────────────────────────────────────────────\r\n   ONE variable decides a row's colour and everything else reads it: the row\r\n   itself, and the sticky column's cells further down.\r\n   That matters because a `<td>` background always covers the `<tr>`'s, so a\r\n   pinned cell cannot inherit the row's paint — it has to restate it. Restating\r\n   it by hand meant five near-duplicate blocks that drifted (group rows were\r\n   never added to them, so a pinned cell on a group row kept the plain surface).\r\n   With `--_mono-table-row-bg`, a row state is declared once and the pinned cell\r\n   follows for free.\r\n\r\n   Every rule that decides a row colour sets the variable AND repeats\r\n   `background: var(--_mono-table-row-bg)`. The repeat is not redundant: a rule\r\n   that only sets the variable leaves the `background` DECLARATION down here on\r\n   the base rule, at its low specificity (0,1,2) — so any competing `tr`\r\n   background from the host page wins and the row paints as if mono had said\r\n   nothing. VitePress does exactly that (`.vp-doc tr:nth-child(2n)`, (0,2,1)),\r\n   which turned every even row transparent the first time this was written.\r\n   Repeating the declaration carries the paint at each rule's own specificity.\r\n\r\n   The row is OPAQUE by default. It used to have no background at all, so odd\r\n   rows were fully transparent while even rows were painted opaque near-white —\r\n   which reads as stripes only if the table happens to sit on white, and as\r\n   \"some rows transparent, some grey\" anywhere else. For a see-through table,\r\n   set `--mono-table-surface: transparent`. */\r\n/* basecoat@1.0.2 styles/vega.css .table tr — hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors */\r\n:is([mono-table],.mono-table) tbody tr {\r\n  --_mono-table-row-bg: var(--_mono-table-surface);\r\n  background: var(--_mono-table-row-bg);\r\n  transition: background-color var(--mono-duration-fast, 150ms) var(--mono-ease, ease);\r\n}\r\n\r\n/* The rule is on the CELL: a `border-collapse: separate` table paints no border\r\n   for a `<tr>` at all. */\r\n:is([mono-table],.mono-table) tbody td {\r\n  border-bottom: var(--mono-border-width) solid var(--_mono-table-border-lite);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table tbody — [&_tr:last-child]:border-0 */\r\n:is([mono-table],.mono-table) tbody tr:last-child > td {\r\n  border-bottom: none;\r\n}\r\n\r\n/* Zebra, floor version: plain parity over every `<tr>` in the tbody. */\r\n:is([mono-table],.mono-table) tbody tr:nth-child(even) {\r\n  --_mono-table-row-bg: var(--_mono-table-zebra);\r\n  background: var(--_mono-table-row-bg);\r\n}\r\n\r\n/* Zebra, corrected: `:nth-child(even of S)` counts only the siblings matching S,\r\n   which is the whole point — plain `:nth-child` counts rows the reader does not\r\n   see as rows. An open detail panel is a real `<tr>` (inserted by\r\n   mono-table-detail-core), virtual-scroll demos pad with spacer rows, and a\r\n   group header is a row too; each shifts the count, so stripes invert below an\r\n   expanded row and strobe while scrolling.\r\n\r\n   Behind @supports, and as a RESET + re-stripe pair, so an engine that cannot\r\n   parse `of S` keeps the floor rule above rather than losing striping entirely\r\n   (a dropped selector would be worse than the bug). @supports adds no\r\n   specificity, so these two are decided by source order — keep the reset first.\r\n\r\n   `[data-mono-stripe-skip]` is the escape hatch for a consumer's own non-data\r\n   rows; `[aria-hidden]` already covers spacer rows as the demos write them. */\r\n@supports selector(:nth-child(1 of :root)) {\r\n  :is([mono-table],.mono-table) tbody tr:nth-child(even) {\r\n    --_mono-table-row-bg: var(--_mono-table-surface);\r\n    background: var(--_mono-table-row-bg);\r\n  }\r\n\r\n  /* :where() ON PURPOSE. `:nth-child(of S)` takes S's specificity, and five\r\n     `:not()`s made this (0,7,2) — heavier than every row STATE below it (hover\r\n     (0,1,3), selected and editing (0,1,2), the dropdown-table's cursor), so on\r\n     an even row no state ever painted: a checked row kept its stripe. At (0,1,2)\r\n     it still beats the reset above it by order, and the states beat it the same\r\n     way. */\r\n  :is([mono-table],.mono-table) tbody tr:where(:nth-child(even of :not(:is([mono-detail-row],.mono-table-detail-row)):not(:is([mono-group-row],.mono-table-group-row)):not(:is([mono-filler],.mono-table-filler)):not([aria-hidden='true']):not([data-mono-stripe-skip]))) {\r\n    --_mono-table-row-bg: var(--_mono-table-zebra);\r\n    background: var(--_mono-table-row-bg);\r\n  }\r\n}\r\n\r\n:is([mono-table],.mono-table) tbody tr:hover {\r\n  --_mono-table-row-bg: var(--_mono-table-hover-bg);\r\n  background: var(--_mono-table-row-bg);\r\n}\r\n\r\n/* ── Filling the scroll box ─────────────────────────────────────────────────\r\n   A table is only as tall as its rows, so a short result set leaves dead space\r\n   under the last row — and every line the rows carried stops there: a pinned\r\n   column's edge, a consumer's column rules, the row backgrounds. Against a\r\n   bordered scroll box that reads as a table cut off mid-way (DevExtreme's fixed\r\n   columns run their separators to the bottom of the grid).\r\n\r\n   `mono-table-fill` on the `<table>` stretches it to the box (`height: 100%`).\r\n   On its own that spreads the extra height over EVERY row, so pair it with one\r\n   `<tr class=\"mono-table-filler\">` at the END of the tbody: a row at `height:\r\n   100%` absorbs the whole remainder and the data rows keep their natural\r\n   height. Give it the same cells as a data row — empty, with the pinned classes\r\n   on the pinned ones — and each column's edge continues to the floor of the\r\n   box, the pinned ones included. Rendered by the consumer (the library cannot\r\n   emit a `<tr>`), e.g.\r\n\r\n     <tr class=\"mono-table-filler\"><td v-for=\"c in columns\" :class=\"stickyCls(c)\"></td></tr>\r\n\r\n   It is not a data row: no zebra stripe (it is outside the `of S` set above and\r\n   the floor rule is reset here), no hover tint, no row rule under it, no padding\r\n   — so an empty box costs no height when there is nothing to fill. Add it\r\n   unconditionally; with enough rows to overflow the box it collapses to zero. */\r\n:is([mono-table],.mono-table):is([mono-fill],.mono-table-fill) {\r\n  height: 100%;\r\n}\r\n:is([mono-table],.mono-table) tbody tr:is([mono-filler],.mono-table-filler),\r\n:is([mono-table],.mono-table) tbody tr:is([mono-filler],.mono-table-filler):hover {\r\n  height: 100%;\r\n  --_mono-table-row-bg: var(--_mono-table-surface);\r\n  background: var(--_mono-table-row-bg);\r\n}\r\n:is([mono-table],.mono-table) tbody tr:is([mono-filler],.mono-table-filler) > td {\r\n  padding: 0;\r\n  border-bottom: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .table tr — data-[state=selected]:bg-muted\r\n   The pinned rail is mono's — upstream marks a selected row by its wash alone. */\r\n:is([mono-table],.mono-table) tbody tr:is([mono-selected],.mono-table-row-selected,.mono-dd-row-selected) {\r\n  --_mono-table-row-bg: var(--_mono-table-selected-bg);\r\n  background: var(--_mono-table-row-bg);\r\n  box-shadow: inset 3px 0 0 var(--_mono-table-accent);\r\n}\r\n\r\n/* ── Inline row editing (mono-table-th `:editable` + controller edit state) ───\r\n   Click (or double-click, per `editableTrigger`) a row → `mono-table-row-editing`. */\r\n:is([mono-table],.mono-table) tbody tr:is([mono-editing],.mono-table-row-editing),\r\n:is([mono-table],.mono-table) tbody tr:is([mono-editing],.mono-table-row-editing):hover {\r\n  --_mono-table-row-bg: color-mix(in oklab, var(--_mono-table-accent) 6%, var(--_mono-table-surface));\r\n  background: var(--_mono-table-row-bg);\r\n  box-shadow: inset 3px 0 0 var(--_mono-table-accent);\r\n}\r\n\r\n/* ── Seamless inline editors (automatic — no consumer setup) ──────────────────\r\n   A `<td>` that CONTAINS a mono form control is treated as an editing cell and\r\n   the control is flattened into it: no border, radius, shadow or background, and\r\n   no height of its own — so the editor's text lands exactly where the static\r\n   text was and the row doesn't grow when editing starts.\r\n\r\n   How it reaches every component INCLUDING the shadow builds: geometry\r\n   (radius / control height / border width) is publicly overridable only on\r\n   mono-input — select, tag-input, date and textarea read the `--theme-*` tokens\r\n   straight from their size rules. So re-point those tokens here. Custom\r\n   properties inherit through a shadow root; page-level rules against inner\r\n   classes (`.mono-select-trigger` …) would not.\r\n\r\n   NOTE: `--theme-radius-full` is deliberately left alone — the switch track and\r\n   thumb depend on it. Same for checkbox/switch sizing: they're glyph controls,\r\n   not text fields, so they only lose their resting shadow — their sizes AND their\r\n   border width are restored below (an unchecked checkbox is drawn by its border). */\r\n:is([mono-table],.mono-table) td:has(mono-input, mono-textarea, mono-select, mono-tag-input, mono-date,\r\n    mono-dropdown-table, mono-checkbox, mono-radio, mono-switch),\r\n:is([mono-table],.mono-table) td:has(mono-shadow-input, mono-shadow-textarea, mono-shadow-select,\r\n    mono-shadow-tag-input, mono-shadow-date, mono-shadow-dropdown-table,\r\n    mono-shadow-checkbox, mono-shadow-radio, mono-shadow-switch) {\r\n  /* geometry — the single lever that also reaches the shadow builds */\r\n  /* 0px, not 0: these tokens are also read inside calc() (a switch builds its\r\n     track from the border, a ring adds it to a shadow), and adding a UNITLESS\r\n     zero to a length makes the whole expression invalid — the switch track\r\n     collapsed to 0 height in an editor cell. */\r\n  --theme-border-width: 0px;\r\n  --theme-radius-xs: 0;\r\n  --theme-radius-sm: 0;\r\n  --theme-radius-md: 0;\r\n  --theme-radius-lg: 0;\r\n  --theme-radius-xl: 0;\r\n  /* `auto`, NOT 0 — this token feeds `min-height` on every field wrapper, so\r\n     zeroing it would let a field collapse below its own content. `auto` lets the\r\n     intrinsic line box size it, which is exactly the height of the static text it\r\n     replaces. `xs` belongs here too: without it an `xs` editor keeps a 24px strut\r\n     while the text it replaces is ~21px, and the row jumps on click. */\r\n  --theme-control-height-xs: auto;\r\n  --theme-control-height-sm: auto;\r\n  --theme-control-height-md: auto;\r\n  --theme-control-height-lg: auto;\r\n  --theme-control-height-xl: auto;\r\n  --theme-control-height-xxl: auto;\r\n  /* Ported (Basecoat) controls read the --mono-* vocabulary instead: the same\r\n     levers, restated. mono-input, mono-select, mono-date and mono-tag-input read these today; the rest join as they are\r\n     ported, and the --theme-* lines above go in 2.0. */\r\n  --mono-border-width: 0px;\r\n  --mono-control-height-xs: auto;\r\n  --mono-control-height-sm: auto;\r\n  --mono-control-height-md: auto;\r\n  --mono-control-height-lg: auto;\r\n  --mono-control-height-xl: auto;\r\n  --mono-control-height-xxl: auto;\r\n  /* tag-input / dropdown-table cap their chip height by the field height (chip-fit); with the\r\n     heights at `auto` here that calc is invalid, so pin the chips to their fixed sizes. */\r\n  --mono-tag-input-chip-height-xs: calc(var(--mono-spacing) * 4.5);\r\n  --mono-tag-input-chip-height-sm: calc(var(--mono-spacing) * 5);\r\n  --mono-tag-input-chip-height-md: calc(var(--mono-spacing) * 5.5);\r\n  --mono-tag-input-chip-height-lg: calc(var(--mono-spacing) * 6);\r\n  --mono-tag-input-chip-height-xl: calc(var(--mono-spacing) * 6.5);\r\n  --mono-tag-input-chip-height-xxl: calc(var(--mono-spacing) * 7);\r\n  --mono-input-radius: 0;\r\n  --mono-input-ring-width: 0px;\r\n  --mono-input-font-xs: 1em;\r\n  --mono-input-font-sm: 1em;\r\n  --mono-input-font-md: 1em;\r\n  --mono-input-font-lg: 1em;\r\n  --mono-input-font-xl: 1em;\r\n  --mono-input-font-xxl: 1em;\r\n  --mono-select-radius: 0;\r\n  --mono-select-ring-width: 0px;\r\n  --mono-select-font-xs: 1em;\r\n  --mono-select-font-sm: 1em;\r\n  --mono-select-font-md: 1em;\r\n  --mono-select-font-lg: 1em;\r\n  --mono-select-font-xl: 1em;\r\n  --mono-select-font-xxl: 1em;\r\n  --mono-date-radius: 0;\r\n  --mono-date-ring-width: 0px;\r\n  --mono-date-font-xs: 1em;\r\n  --mono-date-font-sm: 1em;\r\n  --mono-date-font-md: 1em;\r\n  --mono-date-font-lg: 1em;\r\n  --mono-date-font-xl: 1em;\r\n  --mono-date-font-xxl: 1em;\r\n  --mono-tag-input-radius: 0;\r\n  --mono-tag-input-ring-width: 0px;\r\n  --mono-tag-input-font-xs: 1em;\r\n  --mono-tag-input-font-sm: 1em;\r\n  --mono-tag-input-font-md: 1em;\r\n  --mono-tag-input-font-lg: 1em;\r\n  --mono-tag-input-font-xl: 1em;\r\n  --mono-tag-input-font-xxl: 1em;\r\n\r\n  /* surfaces + resting shadows. Both `-bg` and `-surface` are needed for input:\r\n     the default `outlined` variant's own rule paints `--_mono-input-surface`,\r\n     which would otherwise win over `--mono-input-bg`. */\r\n  --mono-input-bg: transparent;\r\n  --mono-input-surface: transparent;\r\n  --mono-input-rest-border: transparent;\r\n  --mono-input-shadow: none;\r\n  --mono-textarea-surface: transparent;\r\n  --mono-textarea-shadow: none;\r\n  --mono-textarea-min-height: 0;\r\n  --mono-select-surface: transparent;\r\n  --mono-select-shadow: none;\r\n  --mono-tag-input-surface: transparent;\r\n  --mono-tag-input-shadow: none;\r\n  --mono-date-surface: transparent;\r\n  --mono-dropdown-table-surface: transparent;\r\n  --mono-dropdown-table-shadow: none;\r\n  --mono-checkbox-shadow: none;\r\n  --mono-switch-shadow: none;\r\n\r\n  /* kill the control's own inset so its text starts at the cell's content edge,\r\n     exactly where the static text sits */\r\n  --mono-input-padding-x-sm: 0;\r\n\r\n  --mono-input-padding-x-xs: 0;\r\n  --mono-input-padding-x-md: 0;\r\n  --mono-input-padding-x-lg: 0;\r\n  --mono-input-padding-x-xl: 0;\r\n  --mono-input-padding-x-xxl: 0;\r\n  --mono-select-padding-x: 0;\r\n  --mono-tag-input-padding-x: 0;\r\n  --mono-date-padding-x: 0;\r\n  --mono-textarea-padding-x: 0;\r\n\r\n  /* …and the VERTICAL inset. Only `mono-input` had none to begin with; the\r\n     others each carried 0.35–0.55rem top+bottom, which is 11–18px of height the\r\n     static text doesn't have — the row grew the moment you clicked it. */\r\n  --mono-select-padding-y: 0;\r\n  --mono-tag-input-padding-y: 0;\r\n  --mono-date-padding-y: 0;\r\n  --mono-textarea-padding-y: 0;\r\n\r\n  /* The wrapper is a grid of [label?, field, message-wrapper]. The message\r\n     wrapper is emitted even when there IS no message, so the gap ALWAYS added\r\n     ~6.4px that the static text doesn't have. Inside a cell there is no label\r\n     or message, so the gap has nothing to space. */\r\n  --mono-input-gap: 0;\r\n  --mono-select-gap: 0;\r\n  --mono-textarea-gap: 0;\r\n  --mono-tag-input-gap: 0;\r\n  --mono-date-gap: 0;\r\n\r\n  /* Type must match the static text the editor replaces, or the glyphs resize\r\n     and the line box changes height on click. Same single-lever trick as the\r\n     geometry above: select/tag-input/date/textarea read these tokens directly,\r\n     mono-input through its own indirection — and custom properties cross into\r\n     the shadow builds, which a page-level element rule cannot.\r\n\r\n     `1em`, NOT `inherit`: a CSS-wide keyword in a custom-property declaration\r\n     applies to the PROPERTY (re-inheriting it) instead of being stored as the\r\n     value, so `--theme-control-font-md: inherit` is silently a no-op. `1em`\r\n     resolves a font-size against the parent's, which is what we actually want —\r\n     and it chains, so nested elements all land on the cell's size. */\r\n  --theme-control-font-sm: 1em;\r\n  --theme-control-font-md: 1em;\r\n  --theme-control-font-lg: 1em;\r\n  --theme-control-font-xl: 1em;\r\n  --theme-control-font-xxl: 1em;\r\n\r\n  /* One line box owned by the CELL, so the row height is fixed by the column and\r\n     not by whichever element happens to be visible. Same keyword caveat as\r\n     above — hand the editors the literal value, not `inherit`. */\r\n  line-height: var(--mono-table-edit-line-height, 1.5);\r\n  --mono-input-line-height: var(--mono-table-edit-line-height, 1.5);\r\n  --mono-textarea-line-height: var(--mono-table-edit-line-height, 1.5);\r\n  /* select / tag-input / date pin their own line-height so a host page's absolute\r\n     line box cannot inflate them past the control-height token. That pin is a\r\n     `var()` precisely so the cell can keep owning the line box here. */\r\n  --mono-select-line-height: var(--mono-table-edit-line-height, 1.5);\r\n  --mono-tag-input-line-height: var(--mono-table-edit-line-height, 1.5);\r\n  --mono-date-line-height: var(--mono-table-edit-line-height, 1.5);\r\n\r\n  /* Silence each control's OWN focus ring — the cell draws the underline below,\r\n     and showing both would put the box straight back. These are the components'\r\n     private ring knobs (same ones the `underlined` variant re-points); an alpha\r\n     of 0 makes the ring transparent whatever its geometry. */\r\n  --_mono-input-ring-alpha: 0;\r\n  --_mono-input-ring-alpha-state: 0;\r\n  --_mono-textarea-ring-alpha: 0;\r\n  --_mono-textarea-ring-alpha-state: 0;\r\n  --_mono-select-ring-alpha: 0;\r\n  --_mono-select-ring-alpha-state: 0;\r\n  --_mono-tag-input-ring-alpha: 0;\r\n  --_mono-tag-input-ring-alpha-state: 0;\r\n  --_mono-date-ring-alpha: 0;\r\n  --_mdt-ring-alpha: 0;\r\n  --_mdt-ring-alpha-state: 0;\r\n}\r\n\r\n/* ── …and the cell's ALIGNMENT ────────────────────────────────────────────────\r\n   The block above moves the editor's BOX into the cell. This moves its TEXT.\r\n\r\n   `text-align` is inherited, so a right-aligned money `<td>` already passes\r\n   `right` down to the control's wrapper — but not into the field itself, because\r\n   the UA stylesheet gives `input` / `textarea` their own `text-align: start`,\r\n   and an author declaration on an ancestor cannot beat a UA declaration on the\r\n   element. So a right-aligned column's figures jumped to the left edge the moment\r\n   the editor appeared: exactly the shift this section exists to prevent.\r\n\r\n   `inherit` rather than a fixed value, so the field simply tracks whatever the\r\n   cell is — right for money, centre for a code column, untouched for the usual\r\n   left. Nothing to configure.\r\n\r\n   Class selectors reach the LIGHT builds. The shadow builds render the same field\r\n   inside their own root, which page CSS cannot cross and which has no custom\r\n   property for alignment yet — a shadow editor in a right-aligned cell still sits\r\n   left. Noted rather than papered over. */\r\n:is([mono-table],.mono-table) td :is(.mono-input-native, .mono-select-native, .mono-tag-input-native,\r\n    .mono-date-native, .mono-textarea-field) {\r\n  text-align: inherit;\r\n}\r\n\r\n/* …but NOT for checkbox / radio / switch.\r\n   For a FIELD, `--theme-control-height-*` feeds `min-height`, so `auto` above is\r\n   right. For these three it is the control's actual geometry — the box, circle and\r\n   track are all `calc(token * 0.5)` (radio.css, switch.css; the ported checkbox\r\n   are `calc(token * 4 / 9)` off the --mono-* twin — the switch derives its track\r\n   from the same expression — restored the same way) — and\r\n   `calc(auto * 0.5)` is INVALID AT COMPUTED-VALUE TIME, so width/height fall back\r\n   to `auto` and the box, having no intrinsic size, renders 0x0. The control is\r\n   there, sized to nothing.\r\n\r\n   Restore the snapshot taken on `[mono-table]`. Done as a descendant rule rather\r\n   than by dropping these three from the `:has()` list above, for two reasons: they\r\n   still want the flattening (an editable boolean cell should look seamless), and a\r\n   cell holding BOTH a field and a checkbox still matches that list — a selector\r\n   split would leave that case broken.\r\n\r\n   Element AND class selectors: the light build renders the class on an inner node,\r\n   raw class markup is used directly by the css/ demos, and custom properties\r\n   inherit through the shadow boundary so setting them on the host covers the\r\n   shadow builds. */\r\n:is([mono-table],.mono-table) td :is(mono-checkbox, mono-radio, mono-switch),\r\n:is([mono-table],.mono-table) td :is(mono-shadow-checkbox, mono-shadow-radio, mono-shadow-switch),\r\n:is([mono-table],.mono-table) td :is(.mono-checkbox, .mono-radio, .mono-switch),\r\n:is([mono-table],.mono-table) td :is(:is([mono-checkbox],.mono-checkbox), :is([mono-radio],.mono-radio), :is([mono-switch],.mono-switch)) {\r\n  --theme-control-height-xs: var(--_mono-table-ch-xs);\r\n  --theme-control-height-sm: var(--_mono-table-ch-sm);\r\n  --theme-control-height-md: var(--_mono-table-ch-md);\r\n  --theme-control-height-lg: var(--_mono-table-ch-lg);\r\n  --theme-control-height-xl: var(--_mono-table-ch-xl);\r\n  --theme-control-height-xxl: var(--_mono-table-ch-xxl);\r\n  --mono-control-height-xs: var(--_mono-table-mch-xs);\r\n  --mono-control-height-sm: var(--_mono-table-mch-sm);\r\n  --mono-control-height-md: var(--_mono-table-mch-md);\r\n  --mono-control-height-lg: var(--_mono-table-mch-lg);\r\n  --mono-control-height-xl: var(--_mono-table-mch-xl);\r\n  --mono-control-height-xxl: var(--_mono-table-mch-xxl);\r\n  --mono-border-width: var(--_mono-table-bw);\r\n  --theme-border-width: var(--_mono-table-tbw);\r\n}\r\n\r\n/* Editors fill their column (promoted from the demos' local CSS). */\r\n:is([mono-table],.mono-table) td > :is(mono-input, mono-textarea, mono-select, mono-tag-input, mono-date,\r\n    mono-dropdown-table, mono-shadow-input, mono-shadow-textarea, mono-shadow-select,\r\n    mono-shadow-tag-input, mono-shadow-date, mono-shadow-dropdown-table) {\r\n  display: block;\r\n  width: 100%;\r\n}\r\n\r\n/* Glyph controls are sized in literal px, so a switch/checkbox replacing a text\r\n   run changes the row height. Clamp them to the cell's line box instead — the\r\n   HOST element is always light DOM (even in the shadow build), so a page rule\r\n   reaches it, and at the default 1.5 line-height the box is ~20px, which the\r\n   `sm` switch track (20px) and checkbox (16px) already fit inside. */\r\n:is([mono-table],.mono-table) td :is(mono-switch, mono-checkbox, mono-radio,\r\n    mono-shadow-switch, mono-shadow-checkbox, mono-shadow-radio) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  height: calc(1em * var(--mono-table-edit-line-height, 1.5));\r\n  /* `middle`, not the default `baseline`: an inline-level box that sits ON the\r\n     baseline still needs the font's descender space BELOW it, so the line box —\r\n     and the row — grows by a couple of px even when the control is exactly one\r\n     line tall. Only visible in a row whose height isn't already set by something\r\n     taller, which is why it hides in grids that have action buttons. */\r\n  vertical-align: middle;\r\n}\r\n\r\n/* `mono-table-fixed` clips with ellipsis; an editing cell must not clip its\r\n   editor (or a select/date popup anchored in it). */\r\n:is([mono-table],.mono-table):is([mono-fixed],.mono-table-fixed) td:has(mono-input, mono-textarea, mono-select, mono-tag-input,\r\n    mono-date, mono-dropdown-table, mono-checkbox, mono-radio, mono-switch),\r\n:is([mono-table],.mono-table):is([mono-fixed],.mono-table-fixed) td:has(mono-shadow-input, mono-shadow-textarea,\r\n    mono-shadow-select, mono-shadow-tag-input, mono-shadow-date,\r\n    mono-shadow-dropdown-table, mono-shadow-checkbox, mono-shadow-radio,\r\n    mono-shadow-switch) {\r\n  overflow: visible;\r\n  white-space: normal;\r\n}\r\n\r\n/* An ACTION cell (row buttons) must not ellipsis-clip either. `mono-table-fixed`\r\n   gives every cell `overflow: hidden; white-space: nowrap`, which silently cuts\r\n   off a Save/Cancel pair the moment the column is a few px too narrow — the\r\n   button is still there and still clickable, just invisible. Keep `nowrap` so\r\n   the buttons stay on one line, but let them out of the box. */\r\n:is([mono-table],.mono-table):is([mono-fixed],.mono-table-fixed) td:has(> mono-button),\r\n:is([mono-table],.mono-table):is([mono-fixed],.mono-table-fixed) td:has(> mono-shadow-button) {\r\n  overflow: visible;\r\n}\r\n\r\n/* Focus cue on the CELL, not the control: the `<td>` is always light DOM and\r\n   `:focus-within` propagates out of a shadow root, so one rule covers every\r\n   component in both builds. Geometry matches the `underlined` form variant —\r\n   spread cancels blur, so the glow stays under the line instead of ringing the\r\n   cell. */\r\n:is([mono-table],.mono-table) td:has(mono-input, mono-textarea, mono-select, mono-tag-input, mono-date,\r\n    mono-dropdown-table, mono-checkbox, mono-radio, mono-switch):focus-within,\r\n:is([mono-table],.mono-table) td:has(mono-shadow-input, mono-shadow-textarea, mono-shadow-select,\r\n    mono-shadow-tag-input, mono-shadow-date, mono-shadow-dropdown-table,\r\n    mono-shadow-checkbox, mono-shadow-radio, mono-shadow-switch):focus-within {\r\n  box-shadow:\r\n    inset 0 -2px 0 var(--_mono-table-accent),\r\n    0 5px 6px -6px rgba(var(--theme-primary-rgb, 30, 58, 110), 0.5);\r\n}\r\n\r\n/* ── Grouping (group header rows) ────────────────────────────────────────────\r\n   A `<tr class=\"mono-table-group-row\">` is a clickable group header. Set\r\n   `--mono-table-group-level` (0-based depth) on the group cell to indent nested levels.\r\n   Pair with `<mono-data-grid>`'s `group` option + `toggleGroup`. */\r\n/* The `:nth-child(even)` twin is kept so the floor zebra rule (for engines\r\n   without `of S`) cannot tint a group header; where `of S` works, the group row\r\n   is already excluded from the data set and never receives the stripe. */\r\n:is([mono-table],.mono-table) tbody tr:is([mono-group-row],.mono-table-group-row),\r\n:is([mono-table],.mono-table) tbody tr:is([mono-group-row],.mono-table-group-row):nth-child(even) {\r\n  --_mono-table-row-bg: var(--_mono-table-group-bg);\r\n  background: var(--_mono-table-row-bg);\r\n  cursor: pointer;\r\n}\r\n\r\n:is([mono-table],.mono-table) tbody tr:is([mono-group-row],.mono-table-group-row):hover {\r\n  --_mono-table-row-bg: var(--_mono-table-group-hover-bg);\r\n  background: var(--_mono-table-row-bg);\r\n}\r\n\r\n:is([mono-table],.mono-table) td:is([mono-group-cell],.mono-table-group-cell) {\r\n  padding-left: calc(0.9rem + var(--mono-table-group-level, 0) * 1.4rem);\r\n  color: var(--_mono-table-accent);\r\n  font-weight: var(--mono-font-weight-semibold, 600);\r\n}\r\n\r\n:is([mono-group-toggle],.mono-table-group-toggle) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.45rem;\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  background: none;\r\n  font: inherit;\r\n  color: inherit;\r\n  letter-spacing: normal;\r\n  text-transform: none;\r\n  cursor: pointer;\r\n}\r\n\r\n:is([mono-group-toggle],.mono-table-group-toggle):focus-visible {\r\n  outline: none;\r\n  box-shadow: 0 0 0 2px color-mix(in oklab, var(--_mono-table-accent) 30%, transparent);\r\n  border-radius: var(--theme-radius-xs, 4px);\r\n}\r\n\r\n:is([mono-group-caret],.mono-table-group-caret) {\r\n  width: 0.62rem;\r\n  height: 0.62rem;\r\n  flex-shrink: 0;\r\n  color: var(--_mono-table-accent);\r\n  /* Expanded → points down. Collapsed (data-collapsed) → points right. */\r\n  transform: rotate(90deg);\r\n  transition: transform var(--mono-duration-fast, 150ms) var(--mono-ease, ease);\r\n}\r\n\r\n:is([mono-group-toggle],.mono-table-group-toggle)[data-collapsed] :is([mono-group-caret],.mono-table-group-caret) {\r\n  transform: rotate(0deg);\r\n}\r\n\r\n:is([mono-group-caret],.mono-table-group-caret) svg {\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n:is([mono-group-key],.mono-table-group-key) {\r\n  color: var(--_mono-table-text);\r\n}\r\n\r\n:is([mono-group-count],.mono-table-group-count) {\r\n  margin-left: 0.45rem;\r\n  font-size: 0.72rem;\r\n  font-weight: var(--theme-font-weight-normal, 400);\r\n  color: var(--_mono-table-muted);\r\n}\r\n\r\n/* Per-group row pager (`<mono-table-paging-group>`), shown in a footer row at the\r\n   end of a group's rows. Reuses the `[mono-table-paging]*` button styling. */\r\n:is([mono-table],.mono-table) td:is([mono-group-foot],.mono-table-group-foot) {\r\n  padding-top: 0.4rem;\r\n  padding-bottom: 0.5rem;\r\n  padding-left: calc(0.9rem + var(--mono-table-group-level, 0) * 1.4rem);\r\n  background: color-mix(in oklab, var(--_mono-table-accent) 3%, var(--_mono-table-surface));\r\n}\r\n\r\n:is([mono-table-paging-group],.mono-table-pg-group) {\r\n  --mono-table-pg-scale: 0.86;\r\n}\r\n\r\n:is([mono-table-paging-group],.mono-table-pg-group) :is([mono-pgb],.mono-table-pgb) {\r\n  min-width: 26px;\r\n  height: 26px;\r\n  font-size: 0.74rem;\r\n}\r\n\r\n:is([mono-table-paging-group],.mono-table-pg-group) :is([mono-pg-el],.mono-table-pg-el) {\r\n  font-size: 0.74rem;\r\n}\r\n\r\n/* ── Fixed / sticky columns ─────────────────────────────────────────────────\r\n   Pin a column to an edge while the table scrolls horizontally. Add\r\n   `mono-table-sticky-left` / `-right` to the column's header `<th>` AND its body\r\n   `<td>`s. For 2+ pinned columns on one side, set `--mono-table-sticky-left` /\r\n   `--mono-table-sticky-right` on the later column(s) to the combined width of the ones\r\n   before it (give those columns fixed widths so it lines up).\r\n\r\n   The edge is a real BORDER. It was a zero-blur box-shadow, on the reasoning that a collapsed\r\n   border belongs to the table rather than the cell and so might not repaint as a sticky cell\r\n   moves — but a shadow is painted OUTSIDE the border box, so it landed a pixel clear of the\r\n   column and stacked next to whatever rule was already there, which is what made a pinned edge\r\n   read as a smudge rather than a line.\r\n\r\n   That reasoning about collapsed borders was RIGHT, though: in `collapse` mode the border\r\n   stayed at the cell's flow position and scrolled away with the rest of the table. Which is\r\n   why a table holding a pinned column runs with SEPARATE borders (the `:has()` rule up by\r\n   the sticky-head block) — the cell owns its edge and takes it along. */\r\n:is([mono-table],.mono-table) th:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-table],.mono-table) td:is([mono-sticky-left],.mono-table-sticky-left) {\r\n  position: sticky;\r\n  /* Default 0 (one pinned column). For a 2nd+ pinned column on this side, set\r\n     --mono-table-sticky-left to the combined width of the columns before it. */\r\n  left: var(--mono-table-sticky-left, 0);\r\n  z-index: 1;\r\n  border-right: 1px solid var(--_mono-table-border);\r\n}\r\n:is([mono-table],.mono-table) th:is([mono-sticky-right],.mono-table-sticky-right),\r\n:is([mono-table],.mono-table) td:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  position: sticky;\r\n  right: var(--mono-table-sticky-right, 0);\r\n  z-index: 1;\r\n  border-left: 1px solid var(--_mono-table-border);\r\n}\r\n\r\n/* The pinned edge runs to the FLOOR of the scroll box, not just to the last row.\r\n\r\n   A table is only as tall as its rows, so a short result set left the edge\r\n   stopping mid-box, which reads as a table cut off (DevExtreme's fixed columns\r\n   run their separators to the bottom of the grid). Nothing can be appended to\r\n   a `<tbody>` from CSS, and a pseudo-element on the cell is clipped by the\r\n   cell's own `overflow: hidden` (`mono-table-fixed` sets it for the ellipsis).\r\n   What a cell cannot clip is its OWN border painting — so the last row's pinned\r\n   cells draw that edge as a `border-image` with a bottom OUTSET: the 1px edge\r\n   slice is stretched from the cell's top to a viewport-height below it. It is\r\n   ink overflow, so it adds no scroll height, the scroll box clips it at its\r\n   floor, and once the rows overflow the box there is nothing below the last\r\n   row for it to show in. Scoped to `[mono-table-scroll]` so a table in normal\r\n   flow never paints a tail below itself. The same colour the edge already\r\n   uses; `border-image` needs separate borders, which every pinned table has.\r\n\r\n   EVERY pinned body cell paints the tail, not only the last row's: the rows\r\n   are painted in order and each opaque row covers the tail of the one above,\r\n   so only the last one shows — and it does not matter what the last `<tr>` is.\r\n   Keyed on `:last-child` it went missing whenever the tbody ended in something\r\n   other than a data row (an error / loading row, an open detail panel, a\r\n   virtual-scroll spacer). */\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) :is(tbody, tfoot) td:is([mono-sticky-left],.mono-table-sticky-left) {\r\n  border-image: linear-gradient(var(--_mono-table-border), var(--_mono-table-border)) 0 1 0 0 / 0 1px 0 0 / 0 0 100vh 0;\r\n}\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) :is(tbody, tfoot) td:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  border-image: linear-gradient(var(--_mono-table-border), var(--_mono-table-border)) 0 0 0 1 / 0 0 0 1px / 0 0 100vh 0;\r\n}\r\n\r\n/* A border-image paints INSTEAD of the borders — every side, at the image's\r\n   widths — so with only the edge in the image the cell's bottom rule went\r\n   unpainted, and a bottom outset would put the image's bottom edge a viewport\r\n   below the cell anyway. The row rule on a pinned cell is therefore an inset\r\n   shadow on the bottom pixel (a cell's own shadow, painted by the cell, never\r\n   clipped by it), and the layout border it replaces is dropped so that pixel\r\n   is the same one the neighbouring cells' border sits on. A footer's pinned\r\n   cell does the same for its TOP rule (the footer separator). */\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) tbody td:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) tbody td:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  border-bottom-width: 0;\r\n  box-shadow: inset 0 -1px 0 0 var(--_mono-table-border-lite);\r\n}\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) tfoot td:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) tfoot td:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  border-top-width: 0;\r\n  box-shadow: inset 0 1px 0 0 color-mix(in oklab, var(--_mono-table-text) 12%, transparent);\r\n}\r\n/* No rule where the row is closed by something else: a footer's top border, or\r\n   the filler's floor. */\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table):has(tfoot) tbody tr:last-child > td:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table):has(tfoot) tbody tr:last-child > td:is([mono-sticky-right],.mono-table-sticky-right),\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) tbody tr:is([mono-filler],.mono-table-filler) > td:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table) tbody tr:is([mono-filler],.mono-table-filler) > td:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  box-shadow: none;\r\n}\r\n\r\n/* …and the last row keeps its rule. The base sheet drops the bottom rule on the\r\n   last row so it does not double up with a `tfoot`'s top border or a wrapper's\r\n   edge, but in a scroll box taller than its rows that leaves the last row open —\r\n   every row above is closed by a line and the last is not, right where the\r\n   pinned edges now carry on below it. Only where nothing follows the row; the\r\n   pinned cells carry theirs as the shadow above. */\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-table],.mono-table):not(:has(tfoot)):has(:is([mono-sticky-left],.mono-table-sticky-left), :is([mono-sticky-right],.mono-table-sticky-right)) tbody tr:last-child:not(:is([mono-filler],.mono-table-filler)) > td:not(:is([mono-sticky-left],.mono-table-sticky-left)):not(:is([mono-sticky-right],.mono-table-sticky-right)) {\r\n  border-bottom: 1px solid var(--_mono-table-border-lite);\r\n}\r\n\r\n/* Header cells need an opaque background (the gradient sits on `thead`, not the\r\n   cell) and the top layer so they stay above pinned body cells. */\r\n:is([mono-table],.mono-table) thead th:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-table],.mono-table) thead th:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  z-index: 3;\r\n  background: var(--_mono-table-head-frozen-bg);\r\n}\r\n\r\n/* Body cells take the row background so scrolled content can't bleed through.\r\n   A pinned cell paints over the row, so it cannot simply inherit the colour —\r\n   but it CAN read the same variable the row set, which means zebra, hover,\r\n   selected, editing and group rows are all covered by this one rule. Adding a\r\n   new row state needs nothing here. */\r\n:is([mono-table],.mono-table) tbody td:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-table],.mono-table) tbody td:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  background: var(--_mono-table-row-bg, var(--_mono-table-surface));\r\n}\r\n\r\n/* A pinned SUMMARY cell is sticky on both axes at once — bottom (sticky-foot) and\r\n   left/right (sticky column). Lift it above the scrolling body's pinned column\r\n   AND the rest of the footer row so the bottom corner stays put through both\r\n   scrolls; the opaque background from the sticky-foot rule already applies. */\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) tfoot td:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) tfoot td:is([mono-sticky-right],.mono-table-sticky-right),\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) tfoot th:is([mono-sticky-left],.mono-table-sticky-left),\r\n:is([mono-sticky-foot],.mono-table-sticky-foot) tfoot th:is([mono-sticky-right],.mono-table-sticky-right) {\r\n  z-index: 3;\r\n}\r\n/* ── Footer ─────────────────────────────────────────────────────────────── */\r\n\r\n:is([mono-table-foot],.mono-table-foot) {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  flex-wrap: wrap;\r\n  gap: 0.5rem;\r\n  padding: 0.72rem 1rem;\r\n  border-top: 1px solid var(--_mono-table-border-lite);\r\n  background: color-mix(in oklab, var(--_mono-table-text) 3%, var(--_mono-table-surface));\r\n}\r\n\r\n/* ── Error bar (mono-table-error) ────────────────────────────────────────────\r\n   The odd one out of the three controller-driven table elements: `loading` and\r\n   `empty` paint OVER the grid, this one is IN it. A failed request is not a\r\n   transient state to cover the rows with — it is a fact about the table that\r\n   should push the rows down and stay there until it is dismissed, which is what\r\n   DevExtreme's error row does too.\r\n\r\n   So there is no `position: absolute` here and no height reservation: the\r\n   generated `<tr>` (see `ensureRowHost`) is a real row, and the bar inside it is\r\n   ordinary flow content directly under the header. */\r\n\r\n/* `!important`, and not as a shortcut. A generated row's cell is a structural\r\n   HOST, not a content cell — it exists only because `<table>`'s content model\r\n   forbids a bare custom element — so a host page that styles `td` generically is\r\n   simply wrong about this one. And host pages do: these docs carry\r\n   `.vp-doc table[mono-table] td { padding: … }` to undo VitePress's own table\r\n   styling, which at (0,2,2) beat the (0,1,1) this rule used to have and put a\r\n   14px gutter around the error bar. Winning that on specificity is an arms race\r\n   against every consumer's reset; stating the invariant is not. */\r\n:is([mono-error-row],.mono-table-error-row) > td {\r\n  padding: 0 !important;\r\n  border: 0 !important;\r\n}\r\n\r\n/* The ROW too, like the loading/empty rows above. With no error the element\r\n   renders nothing, but the row stays — the consumer wrote it, and it is theirs —\r\n   and a `<tr>` carries the base row rule's 1px border-bottom of its own, so an\r\n   idle host was a 1px band pushing every data row down. `height: 0` is a\r\n   minimum on a table row, so the bar still grows it when there is one. */\r\n:is([mono-error-row],.mono-table-error-row) {\r\n  height: 0 !important;\r\n  border: 0 !important;\r\n}\r\n\r\nmono-table-error,\r\nmono-shadow-table-error {\r\n  display: block;\r\n}\r\n\r\n/* The row's cell follows a FROZEN header. `[mono-sticky-head]` may sit on\r\n   the table or on its scroll wrapper — a descendant selector covers both. The\r\n   cell is what sticks (the row stays in flow, so it keeps taking its honest\r\n   height); `top` is the `<thead>` height the element measures and publishes on\r\n   the `<table>` — a banded two-row header is not 1 row tall. Above the pinned\r\n   body cells (1) and the sticky head cells (2) it slides over; the pinned\r\n   header cells are also 3, but a bar under the header never overlaps them.\r\n   Without a frozen header there is no rule here: the bar scrolls away with the\r\n   rows it describes, like any row. */\r\n:is([mono-sticky-head],.mono-table-sticky-head) :is([mono-error-row],.mono-table-error-row) > td {\r\n  position: sticky;\r\n  top: var(--mono-table-error-head, 0px);\r\n  z-index: 3;\r\n}\r\n\r\n/* Exactly the SCROLLPORT wide, pinned to its left edge — never the table.\r\n\r\n   The cell spans every column, so on a table wider than its `[mono-table-scroll]`\r\n   a bar that filled it put the text at the far left and the ✕ / ↻ past the right\r\n   edge, invisible until you scrolled for them (a table with a pinned action\r\n   column is that wide by design). `100cqw` is the scroll wrapper's inline size\r\n   (it is a query container whenever it holds this element — the rule by the\r\n   loading spinner, which centres with the same unit), and `sticky; left: 0`\r\n   keeps the bar at the visible left as you scroll sideways. `max-width: 100%`\r\n   keeps it inside a table that happens to be NARROWER than the wrapper, and\r\n   `auto` outside any wrapper, where there is no scrollport to size to. The\r\n   value travels as a custom property so the shadow build's bar gets it too. */\r\n:is([mono-table-scroll],.mono-table-scroll) mono-table-error,\r\n:is([mono-table-scroll],.mono-table-scroll) mono-shadow-table-error {\r\n  --mono-table-error-w: 100cqw;\r\n}\r\n\r\n:is([mono-error-bar],.mono-table-error-bar) {\r\n  position: sticky;\r\n  left: 0;\r\n  box-sizing: border-box;\r\n  width: var(--mono-table-error-w, auto);\r\n  max-width: 100%;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 0.5rem;\r\n  padding: 0.5rem 0.6rem 0.5rem 0.75rem;\r\n  border-bottom: 1px solid var(--_mono-table-error-border);\r\n  background: var(--_mono-table-error-bg);\r\n  color: var(--_mono-table-error);\r\n  font-size: 0.8rem;\r\n  line-height: 1.35;\r\n  /* The bar lives in a <td>, and a cell is `whitespace-nowrap` upstream — so the\r\n     message inherited that and ran under the ↻ / ✕ instead of wrapping. */\r\n  white-space: normal;\r\n}\r\n\r\n:is([mono-error-text],.mono-table-error-text) {\r\n  /* Takes the whole bar so the close button is pinned to the right edge, and\r\n     wraps rather than truncating: a message worth showing is worth reading, and\r\n     a store's error text is routinely a sentence. */\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n  overflow-wrap: anywhere;\r\n}\r\n\r\n/* What the server said beyond the status, after the preset headline — quieter,\r\n   so \"Something went wrong on the server\" reads first and \"Object reference not\r\n   set…\" is there for whoever wants it. */\r\n:is([mono-error-detail],.mono-table-error-detail) {\r\n  opacity: 0.8;\r\n}\r\n:is([mono-error-detail],.mono-table-error-detail)::before {\r\n  content: ' — ';\r\n}\r\n\r\n/* The ↻ and × at the right edge: one look, the class kept as a second\r\n   selector so a consumer rule on `[mono-error-close]` still matches. */\r\n:is([mono-error-actions],.mono-table-error-actions) {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.15rem;\r\n}\r\n\r\n:is([mono-error-btn],.mono-table-error-btn),\r\n:is([mono-error-close],.mono-table-error-close) {\r\n  flex: 0 0 auto;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: 1.5rem;\r\n  height: 1.5rem;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--theme-radius-sm, 0.375rem);\r\n  background: transparent;\r\n  color: inherit;\r\n  font-size: 1rem;\r\n  cursor: pointer;\r\n  opacity: 0.75;\r\n  transition: background-color var(--theme-duration-fast, 0.12s) var(--mono-ease, ease),\r\n    opacity var(--theme-duration-fast, 0.12s) var(--mono-ease, ease);\r\n}\r\n\r\n:is([mono-error-btn],.mono-table-error-btn):hover,\r\n:is([mono-error-close],.mono-table-error-close):hover {\r\n  background: color-mix(in srgb, var(--_mono-table-error) 14%, transparent);\r\n  opacity: 1;\r\n}\r\n\r\n:is([mono-error-btn],.mono-table-error-btn):disabled {\r\n  cursor: default;\r\n  opacity: 0.45;\r\n  background: transparent;\r\n}\r\n\r\n:is([mono-error-btn],.mono-table-error-btn):focus-visible,\r\n:is([mono-error-close],.mono-table-error-close):focus-visible {\r\n  outline: 2px solid color-mix(in srgb, var(--_mono-table-error) 45%, transparent);\r\n  outline-offset: 1px;\r\n  opacity: 1;\r\n}\r\n\r\n/* ── Empty state ────────────────────────────────────────────────────────────\r\n   Two consumers, one look. `[mono-table-empty]` as a CLASS is the hand-rolled\r\n   form — a plain `<div>` after the table, which is what every demo wrote before\r\n   the element existed and what a consumer with an entirely custom condition\r\n   still writes. `<mono-table-empty>` as an ELEMENT is the same message placed\r\n   inside the table and driven by the controller. The typography rules below are\r\n   shared by both, so the two can never drift apart; only the placement differs,\r\n   and that is the block after this one. */\r\n\r\n:is([mono-table-empty],.mono-table-empty) {\r\n  text-align: center;\r\n  padding: 3rem 1rem;\r\n  color: var(--_mono-table-muted);\r\n}\r\n\r\n:is([mono-empty-title],.mono-table-empty-title) {\r\n  font-size: 0.9rem;\r\n  font-weight: var(--mono-font-weight-bold, 700);\r\n  color: var(--_mono-table-text);\r\n}\r\n\r\n:is([mono-empty-sub],.mono-table-empty-sub) {\r\n  font-size: 0.78rem;\r\n  color: var(--_mono-table-faint);\r\n  margin-top: 0.25rem;\r\n}\r\n\r\n/* ── Empty overlay (mono-table-empty) ────────────────────────────────────────\r\n   `mono-table-loading`'s pair, and deliberately the same shape: dropped into the\r\n   `<caption>` (or into a row section, where the core wraps itself in a\r\n   zero-height `<tr><td colspan>` — see `table-overlay.ts`), out of normal flow,\r\n   covering the nearest positioned ancestor.\r\n\r\n   Hidden until the core reflects [data-mono-empty]. Note the DEFAULT here is\r\n   hidden even though an unbound element is always \"visible\": the core sets the\r\n   attribute immediately when no controller is bound, so a `v-if`-driven usage\r\n   still paints. Defaulting to shown instead would flash the message on every\r\n   controller-driven table for the one frame before the core's first sync. */\r\n\r\nmono-table-empty,\r\nmono-shadow-table-empty {\r\n  box-sizing: border-box;\r\n  position: absolute;\r\n  inset: 0;\r\n  z-index: var(--_mono-table-empty-z, 9);\r\n  display: none;\r\n  /* The RESTING offset, in real layout. It cannot come from the message's own\r\n     `sticky` `top`, which only pushes an element away from a SCROLLPORT edge —\r\n     with no scrolling ancestor the nearest scrollport is the viewport, the box is\r\n     already far below its top, and sticky does nothing at all. The message then\r\n     sits at the overlay's top, which is the top of the table: printed across the\r\n     column names. A table with no `[mono-table-scroll]` is not a corner case\r\n     either — it is exactly what `<mono-dropdown-table>` renders. The sticky `top`\r\n     below still does its own job once there IS a scroll region. */\r\n  padding-top: calc(var(--mono-table-empty-head, 0px) + var(--_mono-table-empty-gap, 2rem));\r\n  /* Anchored at the TOP for the same reason the spinner is: `sticky` below only\r\n     moves the box once its static position would leave the view, so a static\r\n     position in the middle of a tall region gives a different result at every\r\n     scroll offset. */\r\n  align-items: flex-start;\r\n  justify-content: center;\r\n  /* The message is not a modal. Everything around it stays click-through so a\r\n     sticky header, a column resizer or a row underneath still answers the mouse;\r\n     the box itself takes its interactivity back (next rule) because it holds a\r\n     button. */\r\n  pointer-events: none;\r\n}\r\n\r\nmono-table-empty[data-mono-empty],\r\nmono-shadow-table-empty[data-mono-empty] {\r\n  display: flex;\r\n}\r\n\r\n/* The generated row, when the element was dropped straight into a row section.\r\n   A host, not a layout participant: any height, padding or border here would\r\n   open a permanent gap under the header whether or not the table is empty. */\r\n/* Same invariant as the loading row above — a host cell, never a content cell. */\r\n:is([mono-table],.mono-table) :is([mono-empty-row],.mono-table-empty-row),\r\n:is([mono-table],.mono-table) :is([mono-empty-row],.mono-table-empty-row) > td {\r\n  height: 0 !important;\r\n  padding: 0 !important;\r\n  border: 0 !important;\r\n}\r\n\r\n/* The message itself. `sticky` keeps it in the visible part of a table that\r\n   scrolls; the overlay's `padding-top` above is what places it at rest, and the\r\n   two use the same offset so scrolling starts from where it already sits. */\r\n:is([mono-empty-box],.mono-table-empty-box) {\r\n  position: sticky;\r\n  top: calc(var(--mono-table-empty-head, 0px) + var(--_mono-table-empty-gap, 2rem));\r\n  left: var(--mono-table-empty-x, auto);\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  gap: 0.35rem;\r\n  max-width: 32rem;\r\n  padding: 0 1rem;\r\n  text-align: center;\r\n  color: var(--_mono-table-muted);\r\n  /* Back on, so the reload button is clickable and the text selectable. */\r\n  pointer-events: auto;\r\n}\r\n\r\n/* Centre on the SCROLLPORT rather than on the table, so the message lands in the\r\n   middle of what can actually be seen at any horizontal offset. Both halves are\r\n   scoped to `[mono-table-scroll]`: `cqw` with no query container resolves against\r\n   the viewport, which would be wrong everywhere else. */\r\n:is([mono-table-scroll],.mono-table-scroll):has(mono-table-empty),\r\n:is([mono-table-scroll],.mono-table-scroll):has(mono-shadow-table-empty) {\r\n  container-type: inline-size;\r\n}\r\n\r\n:is([mono-table-scroll],.mono-table-scroll) mono-table-empty,\r\n:is([mono-table-scroll],.mono-table-scroll) mono-shadow-table-empty {\r\n  justify-content: flex-start;\r\n}\r\n\r\n:is([mono-table-scroll],.mono-table-scroll) :is([mono-empty-box],.mono-table-empty-box) {\r\n  /* Half the scrollport, less half the box — `translateX(-50%)` cannot be used\r\n     here because the box is `sticky` and a transform on a sticky box is applied\r\n     AFTER the stick, so it would drift back out of view as you scroll. */\r\n  --mono-table-empty-x: calc(50cqw - min(16rem, 50cqw));\r\n  width: min(32rem, 100cqw);\r\n  max-width: none;\r\n}\r\n\r\n/* The glyph. An iconify class paints as a mask on an empty span and needs a box;\r\n   an emoji is text and needs a font size. Both land on the same footprint so the\r\n   title sits at the same height either way.\r\n\r\n   Scoped under the box ON PURPOSE (two attributes/classes, (0,2,0)): the glyph also\r\n   carries its iconify class (`i-mdi-help-circle-outline` by default), and an app's\r\n   own UnoCSS / Tailwind emits that utility UNLAYERED with `width/height: 1em` at\r\n   (0,1,0) — a tie this rule lost on load order, shrinking the icon to the table's\r\n   font size (12px instead of 40). One utility class can no longer out-weigh it. */\r\n:is([mono-empty-box],.mono-table-empty-box) :is([mono-empty-icon],.mono-table-empty-icon) {\r\n  display: block;\r\n  width: 2.5rem;\r\n  height: 2.5rem;\r\n  color: var(--_mono-table-faint);\r\n}\r\n\r\n:is([mono-empty-box],.mono-table-empty-box) :is([mono-empty-icon],.mono-table-empty-icon):is([mono-text],.is-text) {\r\n  font-size: 2rem;\r\n  line-height: 2.5rem;\r\n}\r\n\r\n/* The body slot replaces the props' content, so it owns the whole box. */\r\n:is([mono-empty-body],.mono-table-empty-body)[data-empty] {\r\n  display: none;\r\n}\r\n\r\n:is([mono-empty-reload],.mono-table-empty-reload) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0.35rem;\r\n  margin-top: 0.5rem;\r\n  padding: 0.32rem 0.7rem;\r\n  border: 1px solid var(--_mono-table-border);\r\n  border-radius: var(--theme-radius-sm, 0.375rem);\r\n  background: var(--_mono-table-surface);\r\n  color: var(--_mono-table-accent);\r\n  font: inherit;\r\n  font-size: 0.78rem;\r\n  cursor: pointer;\r\n  transition:\r\n    background-color var(--theme-duration-fast, 0.12s) var(--mono-ease, ease),\r\n    border-color var(--theme-duration-fast, 0.12s) var(--mono-ease, ease);\r\n}\r\n\r\n:is([mono-empty-reload],.mono-table-empty-reload):hover {\r\n  border-color: var(--_mono-table-accent);\r\n  background: color-mix(in srgb, var(--_mono-table-accent) 8%, var(--_mono-table-surface));\r\n}\r\n\r\n:is([mono-empty-reload],.mono-table-empty-reload):focus-visible {\r\n  outline: 2px solid color-mix(in srgb, var(--_mono-table-accent) 45%, transparent);\r\n  outline-offset: 1px;\r\n}\r\n/* ── Row detail (mono-table-detail) ──────────────────────────────────────────\r\n   Two pieces that live in DIFFERENT places:\r\n\r\n   1. The TOGGLE — the `<mono-table-detail>` element itself, sitting in one of the\r\n      row's `<td>`s. It renders a single chevron button.\r\n   2. The PANEL — `tr[mono-detail-row]`, which the element inserts into the\r\n      consumer's `<tbody>` right below its own row while open. It is light DOM in\r\n      BOTH builds (a shadow root cannot project content into a row outside its\r\n      host), so these rules are what style it either way. */\r\n\r\nmono-table-detail,\r\nmono-shadow-table-detail {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  vertical-align: middle;\r\n}\r\n\r\n:is([mono-detail-toggle],.mono-table-detail-toggle) {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-table-detail-size);\r\n  height: var(--_mono-table-detail-size);\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--_mono-table-detail-radius);\r\n  background: transparent;\r\n  color: var(--_mono-table-detail-color);\r\n  cursor: pointer;\r\n  transition:\r\n    background 0.15s ease,\r\n    color 0.15s ease;\r\n}\r\n\r\n:is([mono-detail-toggle],.mono-table-detail-toggle):hover:not(:disabled) {\r\n  background: var(--_mono-table-detail-hover-bg);\r\n  color: var(--_mono-table-detail-color-open);\r\n}\r\n\r\n:is([mono-detail-toggle],.mono-table-detail-toggle):disabled {\r\n  opacity: 0.45;\r\n  cursor: not-allowed;\r\n}\r\n\r\nmono-table-detail[open] :is([mono-detail-toggle],.mono-table-detail-toggle),\r\nmono-shadow-table-detail[open] :is([mono-detail-toggle],.mono-table-detail-toggle) {\r\n  color: var(--_mono-table-detail-color-open);\r\n}\r\n\r\n/* The shadow build inlines its chevrons as SVG (no page-level icon CSS inside a\r\n   shadow root); size them like the light build's `.mono-icon`. */\r\n:is([mono-detail-caret],.mono-table-detail-caret) {\r\n  width: 1.15em;\r\n  height: 1.15em;\r\n}\r\n\r\n/* The inserted panel row. The colour is set on the CELL, not via the row's\r\n   `--_mono-table-row-bg`, because this is panel decoration rather than a row\r\n   state — it must also beat the sticky-column cell rule, which reads that\r\n   variable. The panel is excluded from the zebra's data set, so it never\r\n   receives a stripe and never shifts the parity of the rows below it. */\r\n:is([mono-table],.mono-table) tbody tr:is([mono-detail-row],.mono-table-detail-row) > td,\r\ntr:is([mono-detail-row],.mono-table-detail-row) > td {\r\n  padding: var(--_mono-table-detail-panel-pad);\r\n  background: var(--_mono-table-detail-panel-bg);\r\n}\r\n\r\n/* A detail row is not a data row: keep the row hover/zebra treatment off it, so\r\n   hovering the panel doesn't look like hovering a record. */\r\n:is([mono-table],.mono-table) tbody tr:is([mono-detail-row],.mono-table-detail-row):hover > td {\r\n  background: var(--_mono-table-detail-panel-bg);\r\n}\r\n\r\n:is([mono-detail-panel],.mono-table-detail-panel) {\r\n  color: var(--_mono-table-ink-mid);\r\n  font-size: 0.86rem;\r\n}\r\n\r\n/* A nested table inside a panel sits flush with the panel padding. */\r\n:is([mono-detail-panel],.mono-table-detail-panel) > :is([mono-table],.mono-table),\r\n:is([mono-detail-panel],.mono-table-detail-panel) > :is([mono-table-scroll],.mono-table-scroll) {\r\n  margin-top: 0.5rem;\r\n}\r\n\r\n/* ── Row selection (mono-table-checkbox) ─────────────────────────────────────\r\n   The element renders `mono-checkbox`'s own attribute markup, so the whole\r\n   size × color × state matrix comes from checkbox.css — the only rules here are\r\n   the ones about sitting in a table cell. */\r\n\r\nmono-table-checkbox,\r\nmono-shadow-table-checkbox {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  vertical-align: middle;\r\n}\r\n\r\n/* A bare (label-less) box in a header/body cell centres on the column and needs\r\n   no extra gap, unlike a form checkbox that always has text beside it. */\r\n:is([mono-table],.mono-table) th > mono-table-checkbox,\r\n:is([mono-table],.mono-table) td > mono-table-checkbox,\r\n:is([mono-table],.mono-table) th > mono-shadow-table-checkbox,\r\n:is([mono-table],.mono-table) td > mono-shadow-table-checkbox {\r\n  vertical-align: middle;\r\n}\r\n\r\n:is([mono-table-checkbox],.mono-table-checkbox) .mono-checkbox-label:empty {\r\n  display: none;\r\n}\r\n\r\n/* While a `mode=\"all\"` drain is in flight the element emits\r\n   [mono-checkbox][mono-loading] > [mono-box] > [mono-loading-spinner] — checkbox.css owns\r\n   that look (accent-filled box, spinner, \"working\" cursor); nothing to restate. */\r\n";
//#endregion
//#region src/components/table/mono-table-search.shadow.ts
var MonoTableSearchShadow = class MonoTableSearchShadow extends MonoTableSearchCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(input_default)), unsafeCSS(toShadowCss(table_default, { hostDisplay: "block" }))];
	}
	renderIcon(name) {
		if (name === "close") return html`
        <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
          <path
            d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
          />
        </svg>
      `;
		if (name === "chevron") return html`
        <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
        </svg>
      `;
		return html`
      <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor" aria-hidden="true">
        <path
          d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
        />
      </svg>
    `;
	}
	/** Shadow build projects the slotted filter-builder through a native `<slot>`. */
	_renderFilterSlotContent() {
		return html`<slot name="filter-builder" @slotchange=${this._onFilterSlotChange}></slot>`;
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTableSearchShadow = __decorate([customElement("mono-shadow-table-search")], MonoTableSearchShadow);
//#endregion
//#region src/components/table/table-sort-utils.ts
/**
* Pure sort-cycle helpers shared by `mono-table-sort` and `mono-table-th` so the
* two header controls behave identically. Kept dependency-free (no Lit/DOM) so
* both cores can import them.
*/
/**
* The next direction when a sortable header is clicked.
* - default cycle: `null → asc → desc → null`
* - `noClear`: `asc ↔ desc` (never returns to `null`)
*/
function nextOrder(current, noClear = false) {
	if (current === "asc") return "desc";
	if (current === "desc") return noClear ? "asc" : null;
	return "asc";
}
/** `aria-sort` value for the parent header cell. */
function ariaSort(current) {
	return current === "asc" ? "ascending" : current === "desc" ? "descending" : "none";
}
/** `1 → '1st'`, `2 → '2nd'` … used in the sort button's tooltip. */
function ordinal(n) {
	const rem100 = n % 100;
	if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
	return `${n}${[
		"th",
		"st",
		"nd",
		"rd"
	][n % 10] ?? "th"}`;
}
/**
* Native tooltip text shown on hover — reflects the current sort direction and,
* when more than one column is sorted, this column's precedence (which the
* `<sup>` badge shows visually).
*/
function sortTitle(current, seq = 0, total = 0) {
	const base = current === "asc" ? "Sorted ascending" : current === "desc" ? "Sorted descending" : "Click to sort";
	if (!current || total < 2 || seq < 1) return base;
	return `${base} (${ordinal(seq)} of ${total})`;
}
//#endregion
//#region src/components/table/table-menu-core.ts
/**
* `MonoTableMenuCore` — the header context-menu machinery shared by
* `mono-table-th` and the standalone `mono-table-sort`.
*
* Right-click on the header cell ALWAYS opens the menu; its **Sort** row cascades
* into an Ascending / Descending / Clear / Clear-all submenu, and picking a
* direction there ACCUMULATES keys (the column's own arrow stays single-key).
* Only `mono-table-th` adds a Header Filter row (and its value panel), so the
* filter-specific parts deliberately stay in that core — this mixin owns just what
* is genuinely common:
*
*  - the menu + submenu `PopupPortalController`s,
*  - the `contextmenu` binding on the closest `th`/`td`,
*  - the document `pointerdown` / `Escape` dismissal, with a
*    `_menuKeepsPath()` hook subclasses extend for their own popups,
*  - the Sort row and submenu rendering.
*
* It only *declares* `field` / `caption` — both cores already define them as
* reactive properties, and re-declaring would shadow them.
*/
var MonoTableMenuCore = (superClass) => {
	class MonoTableMenuCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._menuOpen = false;
			this._sortMenuOpen = false;
			this._menuPanelEl = null;
			this._cell = null;
		}
		connectedCallback() {
			super.connectedCallback();
			if (!isServer) this.requestUpdate();
		}
		disconnectedCallback() {
			this.detachContextMenu();
			this.teardownDocListeners();
			super.disconnectedCallback();
		}
		/** This column's direction, or null when it isn't part of the sort. */
		get _sortDir() {
			const grid = this.dataGrid;
			if (!grid) return null;
			if (typeof grid.sortOf === "function") return grid.sortOf(this.field);
			return grid.sortField === this.field ? grid.sortOrder ?? null : null;
		}
		/** Resolved sort config. Subclasses supply the raw object. */
		resolveSort(raw) {
			return {
				enable: raw?.enable !== false,
				showIcon: raw?.showIcon !== false,
				noClear: !!raw?.noClear,
				disabled: !!raw?.disabled
			};
		}
		/**
		* (Re)bind `contextmenu` on the closest header cell when `wanted`. Idempotent:
		* it no-ops while already bound to the same cell, so it is safe to call from
		* every `updated()`.
		*/
		bindContextMenu(wanted) {
			if (isServer) return;
			const cell = wanted ? this.closest("th, td") : null;
			if (cell === this._cell) return;
			this.detachContextMenu();
			this._cell = cell;
			if (!cell) return;
			this._ctxHandler ??= (e) => {
				e.stopImmediatePropagation();
				this.openMenu(e);
			};
			cell.addEventListener("contextmenu", this._ctxHandler);
		}
		detachContextMenu() {
			if (this._cell && this._ctxHandler) this._cell.removeEventListener("contextmenu", this._ctxHandler);
			this._cell = null;
		}
		/** Create the menu + submenu popups. Subclasses override to add their own. */
		ensurePopups() {
			if (this._menuPopup || isServer) return;
			const scope = () => this.closest(".mono-table, [mono-table]") ?? this;
			this._menuPopup = new PopupPortalController(this, {
				getPanel: () => {
					const el = this.renderRoot.querySelector(".mono-th-menu:not(.mono-th-submenu)");
					if (el) this._menuPanelEl = el;
					return this._menuPanelEl;
				},
				getAnchor: () => this._cell ?? this,
				getStyleScope: scope,
				isOpen: () => this._menuOpen,
				side: () => "bottom",
				align: () => "start",
				offset: () => 2,
				flip: () => true,
				shift: () => true
			});
			this._sortMenuPopup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-th-submenu"),
				getAnchor: () => this._menuPanelEl?.querySelector("[data-menu=\"sort\"]") ?? this._cell ?? this,
				getStyleScope: scope,
				isOpen: () => this._sortMenuOpen,
				side: () => "right",
				align: () => "start",
				offset: () => 4,
				flip: () => true,
				shift: () => true
			});
		}
		/** Open the header menu. Safe to wire straight to a click / contextmenu. */
		openMenu(e) {
			if (isServer) return;
			e?.preventDefault();
			e?.stopPropagation();
			this.ensurePopups();
			this._sortMenuOpen = false;
			this._menuOpen = true;
			this.bindDocListeners();
		}
		closeMenu() {
			this._menuOpen = false;
			this._sortMenuOpen = false;
			this.teardownDocListeners();
		}
		/**
		* Paths that must NOT dismiss the menu. Subclasses override to add their own
		* popups and trigger icons — without that, a trigger's own `pointerdown`
		* counts as "outside", closes the menu, and its click handler immediately
		* reopens it, so the toggle never shuts.
		*/
		_menuKeepsPath(path) {
			if (this._cell && path.includes(this._cell)) return true;
			if (this._menuPopup?.containsInPath(path)) return true;
			if (this._sortMenuPopup?.containsInPath(path)) return true;
			return false;
		}
		bindDocListeners() {
			if (this._onDocPointer || isServer) return;
			this._onDocPointer = (e) => {
				if (this._menuKeepsPath(e.composedPath())) return;
				this.closeMenu();
			};
			this._onDocKey = (e) => {
				if (e.key === "Escape") this.closeMenu();
			};
			document.addEventListener("pointerdown", this._onDocPointer, true);
			document.addEventListener("keydown", this._onDocKey, true);
		}
		teardownDocListeners() {
			if (this._onDocPointer) document.removeEventListener("pointerdown", this._onDocPointer, true);
			if (this._onDocKey) document.removeEventListener("keydown", this._onDocKey, true);
			this._onDocPointer = void 0;
			this._onDocKey = void 0;
		}
		_caretIcon() {
			return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z" />
      </svg>`;
		}
		_sortGlyph(dir) {
			if (dir === "asc") return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M11 22h2V8.414h5.414L12 2L5.586 8.414H11z" />
        </svg>`;
			if (dir === "desc") return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M13 2h-2v13.586H5.586L12 22l6.414-6.414H13z" />
        </svg>`;
			return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>`;
		}
		/** The "clear all sorting" glyph — a crossed-out circle. */
		_clearAllIcon() {
			return html`<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 2c1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.9 7.9 0 0 1 4 12a8 8 0 0 1 8-8m0 16a7.9 7.9 0 0 1-4.9-1.69L18.31 7.1A7.9 7.9 0 0 1 20 12a8 8 0 0 1-8 8"
        />
      </svg>`;
		}
		_checkIcon() {
			return html`<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>`;
		}
		/** The `Sort ›` row that cascades into {@link renderSortSubmenu}. */
		renderSortMenuItem() {
			return html`
        <button
          type="button"
          class="mono-th-menu-item" mono-th-menu-item
          role="menuitem"
          data-menu="sort"
          aria-haspopup="true"
          @click=${() => {
				this.ensurePopups();
				this._sortMenuOpen = true;
			}}
        >
          <span class="mono-th-menu-ic" mono-th-menu-ic>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path
                d="M10.73 13.79c.29.28.75.28 1.04 0l2.75-2.65a.75.75 0 1 0-1.04-1.08L12 11.486V2.75a.75.75 0 0 0-1.5 0v8.736L9.02 10.06a.75.75 0 1 0-1.04 1.08zM5.28 2.22a.75.75 0 0 0-1.06 0L1.47 4.97a.75.75 0 0 0 1.06 1.06L4 4.56v8.69a.75.75 0 0 0 1.5 0V4.56l1.47 1.47a.75.75 0 0 0 1.06-1.06z"
              />
            </svg>
          </span>
          <span class="mono-th-menu-label" mono-th-menu-label>Sort</span>
          <span class="mono-th-menu-caret" mono-th-menu-caret>${this._caretIcon()}</span>
        </button>
      `;
		}
		/**
		* Apply a direction from the submenu, then close everything. The menu is the
		* multi-key path — `{ multi: true }` appends an unsorted column (pick order is
		* precedence) and drops just this one on `null`, leaving the other keys alone.
		* `sticky` is what makes the grid remember the gesture, so the arrows append
		* too from here on (until nothing is sorted any more).
		*/
		async pickSort(order) {
			this.closeMenu();
			await this.dataGrid?.setSort(this.field, order, {
				multi: true,
				sticky: true
			});
		}
		/** Empty the whole sort, however many keys it holds. */
		async clearAllSorts() {
			this.closeMenu();
			await this.dataGrid?.setSort(null);
		}
		/**
		* Ascending / Descending / Clear, then a grid-level **Clear all sorting**.
		* `noClear` drops this column's Clear row — that config means the column never
		* returns to unsorted on its own — but not Clear all, which is not about one
		* column and stays reachable from every header.
		*/
		renderSortSubmenu(noClear = false) {
			const current = this._sortDir;
			const sortCount = this.dataGrid?.sorts?.length ?? 0;
			const row = (order, glyph, label) => {
				const active = order !== null && current === order;
				return html`
          <button
            type="button"
            class="mono-th-menu-item ${active ? "active" : ""}" mono-th-menu-item
            ?mono-active=${active}
            role="menuitemradio"
            aria-checked=${active ? "true" : "false"}
            data-sort-pick=${glyph}
            @click=${() => this.pickSort(order)}
          >
            <span class="mono-th-menu-ic" mono-th-menu-ic>${this._sortGlyph(glyph)}</span>
            <span class="mono-th-menu-label" mono-th-menu-label>${label}</span>
            <span class="mono-th-menu-check" mono-th-menu-check>${active ? this._checkIcon() : nothing}</span>
          </button>
        `;
			};
			return html`
        <div
          class="mono-th-menu mono-th-submenu ${this._sortMenuOpen ? "open" : ""}" mono-th-menu mono-th-submenu
          ?mono-open=${this._sortMenuOpen}
          role="menu"
          aria-label="Sort"
        >
          ${row("asc", "asc", "Ascending")} ${row("desc", "desc", "Descending")}
          ${noClear ? nothing : row(null, "clear", "Clear")}
          <div class="mono-th-menu-sep" mono-th-menu-sep role="separator"></div>
          <button
            type="button"
            class="mono-th-menu-item" mono-th-menu-item
            role="menuitem"
            data-sort-pick="clear-all"
            ?disabled=${sortCount === 0}
            aria-disabled=${sortCount === 0 ? "true" : "false"}
            @click=${() => this.clearAllSorts()}
          >
            <span class="mono-th-menu-ic" mono-th-menu-ic>${this._clearAllIcon()}</span>
            <span class="mono-th-menu-label" mono-th-menu-label>Clear all sorting</span>
          </button>
        </div>
      `;
		}
	}
	__decorate([state()], MonoTableMenuCoreClass.prototype, "_menuOpen", void 0);
	__decorate([state()], MonoTableMenuCoreClass.prototype, "_sortMenuOpen", void 0);
	return MonoTableMenuCoreClass;
};
//#endregion
//#region src/components/table/mono-table-sort-core.ts
/**
* `MonoTableSortCore` — render-mode-agnostic logic for `mono-table-sort`: a
* column-header sort control whose arrow cycles a SINGLE key `asc → desc → none`
* (or `asc ↔ desc` with `no-clear`), while right-clicking the header cell opens
* the `Sort ›` menu — the only place a multi-key sort can be built. The header
* label is delegated to a `renderSlot('label')`
* hook (light: a `[data-mono-slot]` placeholder filled with captured nodes;
* shadow: native `<slot>`) and the up/down chevrons to `renderIcon('chevron')`
* (light: `i-mdi-chevron-*`; shadow: inline SVG).
*
* `updated()` reflects the sort state onto the parent `<th>`/`<td>` via
* `closest()` — guarded by `isServer` (lit) so it never runs during SSR.
*/
var MonoTableSortCore = (superClass) => {
	class MonoTableSortCoreClass extends MonoTableMenuCore(superClass) {
		constructor(...args) {
			super(...args);
			this._propsSlot = "sort";
			this.field = "";
			this.caption = "";
			this.disabled = false;
			this.enable = true;
			this.noClear = false;
			this.showIcon = true;
			defineHybridPropAliases(this, ["noClear", "showIcon"]);
		}
		updated(changed) {
			super.updated(changed);
			if (isServer) return;
			const cell = this.closest("th, td");
			if (cell) cell.setAttribute("aria-sort", ariaSort(this._current));
			this.bindContextMenu(this._sortable);
		}
		get _sortable() {
			return !!this.field && this.enable && !this.disabled && !!this.dataGrid;
		}
		/** This column's current direction, or null when it isn't part of the sort. */
		get _current() {
			const grid = this.dataGrid;
			if (!grid) return null;
			if (typeof grid.sortOf === "function") return grid.sortOf(this.field);
			return grid.sortField === this.field ? grid.sortOrder ?? null : null;
		}
		/** 1-based precedence of this column in the sort; `0` when unsorted. */
		get _seq() {
			return this.dataGrid?.sortIndex?.(this.field) ?? 0;
		}
		/** How many columns are sorted — the `<sup>` only shows when 2+. */
		get _sortCount() {
			return this.dataGrid?.sorts?.length ?? 0;
		}
		/**
		* The arrow (or, with `show-icon="false"`, the label). Single-key — this
		* column becomes the entire sort, collapsing any stack — UNLESS the user has
		* started combining from the right-click menu and something is still
		* sorted: then the arrow appends too, because a user who began a multi-key
		* sort means to keep building it (`sortCombining`). Cycling past `desc`
		* clears this column either way.
		*/
		_toggle() {
			if (!this._sortable) return;
			this.dataGrid?.setSort(this.field, nextOrder(this._current, this.noClear), { multi: !!this.dataGrid?.sortCombining?.() });
		}
		/** Per-region slot content — overridden per build. */
		renderSlot(_name) {
			return html``;
		}
		/** Internal icon — light: UnoCSS `.mono-icon`; shadow: inline SVG. */
		renderIcon(_name) {
			return html``;
		}
		_label() {
			return html`<span class="mono-table-sort-label" data-mono-slot="label"
        >${this.caption ? this.caption : this.renderSlot("label")}</span
      >`;
		}
		render() {
			if (!this._sortable) return this._label();
			const current = this._current;
			const seq = this._seq;
			const total = this._sortCount;
			const seqBadge = total > 1 && seq > 0 ? html`<sup class="mono-table-sort-seq" mono-sort-seq aria-hidden="true">${seq}</sup>` : nothing;
			const menus = html`
        <div class="mono-th-menu ${this._menuOpen ? "open" : ""}" mono-th-menu ?mono-open=${this._menuOpen} role="menu">
          ${this.renderSortMenuItem()}
        </div>
        ${this.renderSortSubmenu(this.noClear)}
      `;
			if (!this.showIcon) return html`
          <span class="mono-table-sort-head no-icon" mono-sort-head>
            <button
              type="button"
              class="mono-table-sort-btn label-trigger" mono-sort-btn
              data-dir=${current ?? "none"}
              title=${sortTitle(current, seq, total)}
              @click=${this._toggle}
            >
              ${this._label()}${seqBadge}
            </button>
          </span>
          ${menus}
        `;
			return html`
        <span class="mono-table-sort-head" mono-sort-head>
          ${this._label()}
          <button
            type="button"
            class="mono-table-sort-btn" mono-sort-btn
            data-dir=${current ?? "none"}
            title=${sortTitle(current, seq, total)}
            aria-label=${`Sort by ${this.caption || this.field}`}
            @click=${this._toggle}
          >
            <span class="mono-table-sort-ind" mono-sort-ind aria-hidden="true">${this.renderIcon("chevron")}</span>
            ${seqBadge}
          </button>
        </span>
        ${menus}
      `;
		}
	}
	__decorate([property({ type: String })], MonoTableSortCoreClass.prototype, "field", void 0);
	__decorate([property({ type: String })], MonoTableSortCoreClass.prototype, "caption", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSortCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSortCoreClass.prototype, "enable", void 0);
	__decorate([property({
		attribute: "no-clear",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSortCoreClass.prototype, "noClear", void 0);
	__decorate([property({
		attribute: "show-icon",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableSortCoreClass.prototype, "showIcon", void 0);
	return MonoTableSortCoreClass;
};
//#endregion
//#region src/components/table/table-sort-icons.ts
/** One sort-indicator SVG, glyph chosen by the active direction. */
function sortIndicatorSvg(current) {
	if (current === "asc") return html`
      <svg class="mono-table-sort-caret" mono-sort-caret viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11 22h2V8.414h5.414L12 2L5.586 8.414H11z" />
      </svg>
    `;
	if (current === "desc") return html`
      <svg class="mono-table-sort-caret" mono-sort-caret viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13 2h-2v13.586H5.586L12 22l6.414-6.414H13z" />
      </svg>
    `;
	return html`
    <svg class="mono-table-sort-caret" mono-sort-caret viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path
        d="M10.73 13.79c.29.28.75.28 1.04 0l2.75-2.65a.75.75 0 1 0-1.04-1.08L12 11.486V2.75a.75.75 0 0 0-1.5 0v8.736L9.02 10.06a.75.75 0 1 0-1.04 1.08zM5.28 2.22a.75.75 0 0 0-1.06 0L1.47 4.97a.75.75 0 0 0 1.06 1.06L4 4.56v8.69a.75.75 0 0 0 1.5 0V4.56l1.47 1.47a.75.75 0 0 0 1.06-1.06z"
      />
    </svg>
  `;
}
//#endregion
//#region src/components/table/mono-table-sort.shadow.ts
var MonoTableSortShadow = class MonoTableSortShadow extends MonoTableSortCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { hostDisplay: "inline-flex" }))];
	}
	renderSlot(_name) {
		return html`<slot></slot>`;
	}
	renderIcon(_name) {
		return sortIndicatorSvg(this._current);
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTableSortShadow = __decorate([customElement("mono-shadow-table-sort")], MonoTableSortShadow);
//#endregion
//#region src/components/table/mono-table-paging-core.ts
/** Defaults the shadow build tests against before swapping in its inline SVG. */
var DEFAULT_PREV_ICON = "i-mdi-chevron-left";
var DEFAULT_NEXT_ICON = "i-mdi-chevron-right";
/**
* `MonoTablePagingCore` — render-mode-agnostic logic for `mono-table-paging`.
*
* - `type="standard"` (default): Prev / numbered / Next buttons wired to
*   `setPage`. The arrows are ICONS (`prev-icon` / `next-icon`, mdi chevrons by
*   default) rendered through `_renderIcon`, the same seam `mono-table-detail`
*   uses — they were text `‹ ›` glyphs, whose ink is a fraction of the em box and
*   sits off its centre, so they read as tiny and never optically centred next to
*   the digits. The `…` gap marker stays text: it has no centring problem and no
*   icon would say it better.
* - `type="infinity-scroll"`: drives the controller's accumulator — scrolling the
*   nearest `.mono-table-scroll` container to the end auto-calls `loadNext()`.
* - `type="virtual-scroll"`: same auto-loading, plus it computes a render window
*   from `scrollTop`/`rowHeight` and pushes it via `setVirtualWindow()` so the
*   consumer renders spacer rows + only the visible slice.
*
* Flat tables only — the controller refuses scroll modes on a grouped grid.
*/
/** Scroll containers known by structure — every spelling a consumer or the library writes. */
var SCROLL_HOSTS = ".mono-table-scroll, [mono-table-scroll], [mono-dd-region=\"body\"], .mono-dropdown-table-region.body";
var DD_PANEL = "[mono-dd-panel], .mono-dropdown-table-panel";
var DD_BODY = "[mono-dd-region=\"body\"], .mono-dropdown-table-region.body";
/**
* Ancestors in the FLATTENED tree: a slotted node continues at its `<slot>`, and a shadow root's
* top continues at its host. `closest()` stops at both, which hid the shadow dropdown-table's
* panel from a pager slotted into it.
*/
function flatAncestors(start) {
	const out = [];
	let node = start;
	while (node) {
		const next = node.assignedSlot ?? node.parentElement ?? node.parentNode?.host ?? null;
		if (next) out.push(next);
		node = next;
	}
	return out;
}
var MonoTablePagingCore = (superClass) => {
	class MonoTablePagingCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "paging";
			this.type = "standard";
			this.siblings = 1;
			this.simple = false;
			this.rowHeight = 44;
			this.threshold = 200;
			this.overscan = 6;
			this.prevIcon = DEFAULT_PREV_ICON;
			this.nextIcon = DEFAULT_NEXT_ICON;
			this._scrollEl = null;
			this._onScrollBound = () => this._scheduleScroll();
			this._rafPending = false;
			this._ownsPageSize = false;
			this._retryPending = false;
		}
		connectedCallback() {
			super.connectedCallback();
			if (!isServer) this._configure();
		}
		disconnectedCallback() {
			this._detachScroll();
			if (this._scrollActive()) this.dataGrid?.setScrollPaging("off", { reload: false });
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			super.willUpdate(changed);
			if (!isServer && (changed.has("type") || changed.has("dataGrid") || changed.has("size"))) this._configure();
		}
		/** Also recompute the virtual window whenever the grid notifies (new rows). */
		_subscribe() {
			this._off?.();
			this._off = this.dataGrid?.subscribe(() => {
				this.requestUpdate();
				if (this.type === "virtual-scroll") this._recomputeWindow();
			});
		}
		_scrollActive() {
			return this.type === "infinity-scroll" || this.type === "virtual-scroll";
		}
		_modeOf() {
			return this.type === "infinity-scroll" ? "infinity" : this.type === "virtual-scroll" ? "virtual" : "off";
		}
		/** Apply mode + page-size override to the grid, sequentially (avoid racing loads). */
		async _applyGridConfig(grid) {
			await grid.setScrollPaging(this._modeOf());
			if (this.size != null && this.size > 0) {
				this._ownsPageSize = true;
				await grid.setPreferredPageSize(this.size);
			} else if (this._ownsPageSize) {
				this._ownsPageSize = false;
				await grid.setPreferredPageSize(null);
			}
		}
		_configure() {
			this._detachScroll();
			const grid = this.dataGrid;
			if (!grid) return;
			this._applyGridConfig(grid);
			if (!this._scrollActive()) return;
			this._attachScroll();
		}
		/** Resolve the scroll container and listen to it; the grid config is not touched. */
		_attachScroll() {
			this._scrollEl = this._resolveScrollEl();
			if (!this._scrollEl) {
				if (!this._retryPending && typeof requestAnimationFrame === "function") {
					this._retryPending = true;
					requestAnimationFrame(() => {
						this._retryPending = false;
						if (this.isConnected && !this._scrollEl && this._scrollActive()) this._attachScroll();
					});
				}
				return;
			}
			this._scrollEl.addEventListener("scroll", this._onScrollBound, { passive: true });
			if (typeof ResizeObserver !== "undefined") {
				this._ro = new ResizeObserver(this._onScrollBound);
				this._ro.observe(this._scrollEl);
			}
			this._scheduleScroll();
		}
		_detachScroll() {
			this._scrollEl?.removeEventListener("scroll", this._onScrollBound);
			this._ro?.disconnect();
			this._ro = void 0;
			this._scrollEl = null;
		}
		/** The scroll container: explicit `scroll-target`, else nearest `.mono-table-scroll`. */
		_resolveScrollEl() {
			if (this.scrollTarget) {
				const el = (this.getRootNode?.() ?? document).querySelector?.(this.scrollTarget) ?? document.querySelector(this.scrollTarget);
				if (el) return el;
			}
			const ancestors = flatAncestors(this);
			const near = ancestors.find((el) => el.matches(SCROLL_HOSTS));
			if (near) return near;
			const panel = ancestors.find((el) => el.matches(DD_PANEL));
			const body = panel ? Array.from(panel.children).find((c) => c.matches(DD_BODY)) : void 0;
			if (body) return body;
			for (const el of ancestors) {
				if (el === document.body) break;
				if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
			}
			return null;
		}
		_scheduleScroll() {
			if (this._rafPending || isServer) return;
			this._rafPending = true;
			const run = () => {
				this._rafPending = false;
				this._onScroll();
			};
			if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
			else run();
		}
		_onScroll() {
			const grid = this.dataGrid;
			const el = this._scrollEl;
			if (!grid || !el) return;
			if (el.clientHeight <= 0) return;
			if (this.type === "virtual-scroll") this._recomputeWindow();
			if (el.scrollHeight - el.scrollTop - el.clientHeight <= Math.max(0, this.threshold) && grid.hasMore && !grid.loading) grid.loadNext();
		}
		/** Compute the virtual window from scrollTop + rowHeight and push it to the grid. */
		_recomputeWindow() {
			const grid = this.dataGrid;
			const el = this._scrollEl;
			if (!grid || !el || this.type !== "virtual-scroll") return;
			const rh = Math.max(1, Number(this.rowHeight) || 44);
			const over = Math.max(0, Math.floor(Number(this.overscan) || 0));
			const loaded = grid.loadedCount;
			let start = Math.floor(el.scrollTop / rh) - over;
			let end = Math.ceil((el.scrollTop + el.clientHeight) / rh) + over;
			start = Math.max(0, start);
			end = Math.min(loaded, Math.max(start, end));
			const padTop = start * rh;
			const padBottom = Math.max(0, (loaded - end) * rh);
			grid.setVirtualWindow(start, end, padTop, padBottom);
		}
		_go(pageIndex) {
			this.dataGrid?.setPage(pageIndex);
		}
		/** Windowed list of 1-based page numbers with 'gap' markers for ellipses. */
		_pages(current1, total) {
			if (total <= 1) return total === 1 ? [1] : [];
			const sib = Math.max(0, Math.floor(Number(this.siblings) || 0));
			const set = new Set([1, total]);
			for (let p = current1 - sib; p <= current1 + sib; p++) if (p >= 1 && p <= total) set.add(p);
			const sorted = [...set].sort((a, b) => a - b);
			const out = [];
			let prev = 0;
			for (const p of sorted) {
				if (p - prev > 1) out.push("gap");
				out.push(p);
				prev = p;
			}
			return out;
		}
		_renderScrollStatus() {
			const grid = this.dataGrid;
			const loading = grid?.loading ?? false;
			const hasMore = grid?.hasMore ?? false;
			return html`
        <div class="mono-table-pg mono-table-pg-scroll" mono-table-paging mono-pg-scroll data-type=${this.type}>
          ${loading ? html`<span class="mono-table-pg-el" mono-pg-el>Loading more…</span>` : hasMore ? html`<button
                  class="mono-table-pgb" mono-pgb
                  ?disabled=${!grid}
                  @click=${() => void this.dataGrid?.loadNext()}
                >
                  Load more
                </button>` : html`<span class="mono-table-pg-el" mono-pg-el>— end —</span>`}
        </div>
      `;
		}
		/**
		* One arrow — mdi chevron-left / chevron-right, INLINE, in both builds.
		*
		* Deliberately not a `i-mdi-*` utility class by default, which is what
		* `mono-table-detail` does. That class only paints if the CONSUMER's icon tooling
		* generated it, and a bundler scans the app's own sources — not this package under
		* `node_modules`. So a class emitted from here resolves to nothing unless every
		* consumer remembers to safelist it, and the arrows vanish instead of merely
		* looking wrong. An inline SVG owes the consumer nothing.
		*
		* It also fixes the centring these arrows never had: `‹` / `›` are text, so their
		* ink sits wherever the font's metrics put it inside the em box. An SVG's viewBox
		* IS its box, so the chevron is centred by construction.
		*
		* Setting `prev-icon` / `next-icon` opts back into a class — a consumer who names
		* one is telling us their stylesheet has it.
		*/
		_renderIcon(direction) {
			const isPrev = direction === "prev";
			const icon = isPrev ? this.prevIcon : this.nextIcon;
			if (isPrev ? icon !== "i-mdi-chevron-left" : icon !== "i-mdi-chevron-right") return html`<span class="mono-icon ${icon}" aria-hidden="true"></span>`;
			return html`
        <svg class="mono-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d=${isPrev ? "M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6l6 6z" : "M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z"}
          />
        </svg>
      `;
		}
		render() {
			if (this._scrollActive()) return this._renderScrollStatus();
			const grid = this.dataGrid;
			const loading = grid?.loading ?? false;
			const current = grid?.pageIndex ?? 0;
			const count = grid?.pageCount ?? 0;
			const atFirst = current <= 0;
			const atLast = count > 0 ? current >= count - 1 : true;
			return html`
        <div class="mono-table-pg" mono-table-paging>
          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atFirst || loading || !grid}
            @click=${() => this._go(current - 1)}
            aria-label="Previous page"
          >
            ${this._renderIcon("prev")}
          </button>

          ${this.simple ? html`<span class="mono-table-pg-el" mono-pg-el>${current + 1} / ${Math.max(1, count)}</span>` : this._pages(current + 1, count).map((p) => p === "gap" ? html`<span class="mono-table-pg-el" mono-pg-el>…</span>` : html`<button
                      class=${`mono-table-pgb${p === current + 1 ? " on" : ""}`} mono-pgb ?mono-on=${p === current + 1}
                      ?disabled=${loading}
                      @click=${() => this._go(p - 1)}
                    >
                      ${p}
                    </button>`)}

          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atLast || loading || !grid}
            @click=${() => this._go(current + 1)}
            aria-label="Next page"
          >
            ${this._renderIcon("next")}
          </button>
        </div>
      `;
		}
	}
	__decorate([property({ reflect: true })], MonoTablePagingCoreClass.prototype, "type", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoTablePagingCoreClass.prototype, "siblings", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTablePagingCoreClass.prototype, "simple", void 0);
	__decorate([property({
		attribute: "size",
		converter: numberStringConverter
	})], MonoTablePagingCoreClass.prototype, "size", void 0);
	__decorate([property({
		attribute: "row-height",
		converter: numberStringConverter
	})], MonoTablePagingCoreClass.prototype, "rowHeight", void 0);
	__decorate([property({ attribute: "scroll-target" })], MonoTablePagingCoreClass.prototype, "scrollTarget", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoTablePagingCoreClass.prototype, "threshold", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoTablePagingCoreClass.prototype, "overscan", void 0);
	__decorate([property({ attribute: "prev-icon" })], MonoTablePagingCoreClass.prototype, "prevIcon", void 0);
	__decorate([property({ attribute: "next-icon" })], MonoTablePagingCoreClass.prototype, "nextIcon", void 0);
	return MonoTablePagingCoreClass;
};
//#endregion
//#region src/components/table/mono-table-paging.shadow.ts
var MonoTablePagingShadow = class MonoTablePagingShadow extends MonoTablePagingCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { hostDisplay: "inline-flex" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (!isServer) adoptIconStyles(this.renderRoot);
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTablePagingShadow = __decorate([customElement("mono-shadow-table-paging")], MonoTablePagingShadow);
//#endregion
//#region src/components/table/mono-table-paging-group-core.ts
/**
* `MonoTablePagingGroupCore` — render-mode-agnostic logic for
* `mono-table-paging-group`: paginates the rows inside ONE group. Extends the
* controller base with group-paging registration on connect / disconnect /
* group-path change. No slots, no icons — light and shadow share `render()`.
*/
var MonoTablePagingGroupCore = (superClass) => {
	class MonoTablePagingGroupCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "pagingGroup";
			this.pageSize = 5;
			this.siblings = 1;
			this.simple = false;
		}
		/** The bound group's stable path key (drives every controller call). */
		get _path() {
			const g = this.group;
			return (typeof g === "string" ? g : g?.path) ?? "";
		}
		connectedCallback() {
			super.connectedCallback();
			this._register();
		}
		disconnectedCallback() {
			if (this._path) this.dataGrid?.clearGroupPaging(this._path);
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			super.willUpdate(changed);
			const groupChanged = changed.has("group");
			const prev = groupChanged ? changed.get("group") : void 0;
			const prevPath = typeof prev === "string" ? prev : prev?.path;
			const pathChanged = groupChanged && prevPath !== this._path;
			if (changed.has("dataGrid") || changed.has("pageSize") || pathChanged) {
				if (pathChanged && prevPath) this.dataGrid?.clearGroupPaging(prevPath);
				this._register();
			}
		}
		_register() {
			const path = this._path;
			if (path && this.dataGrid) this.dataGrid.setGroupPageSize(path, this.pageSize);
		}
		_go(pageIndex) {
			if (this._path) this.dataGrid?.setGroupPage(this._path, pageIndex);
		}
		/** Windowed list of 1-based page numbers with 'gap' markers for ellipses. */
		_pages(current1, total) {
			if (total <= 1) return total === 1 ? [1] : [];
			const sib = Math.max(0, Math.floor(Number(this.siblings) || 0));
			const set = new Set([1, total]);
			for (let p = current1 - sib; p <= current1 + sib; p++) if (p >= 1 && p <= total) set.add(p);
			const sorted = [...set].sort((a, b) => a - b);
			const out = [];
			let prev = 0;
			for (const p of sorted) {
				if (p - prev > 1) out.push("gap");
				out.push(p);
				prev = p;
			}
			return out;
		}
		render() {
			const grid = this.dataGrid;
			if (!grid || !this._path) return nothing;
			const info = grid.groupPageInfo(this._path);
			const count = info.pageCount;
			if (count <= 1) return nothing;
			const current = info.pageIndex;
			const atFirst = current <= 0;
			const atLast = current >= count - 1;
			return html`
        <div class="mono-table-pg mono-table-pg-group" mono-table-paging mono-table-paging-group>
          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atFirst}
            @click=${() => this._go(current - 1)}
            aria-label="Previous rows"
          >
            ‹
          </button>

          ${this.simple ? html`<span class="mono-table-pg-el" mono-pg-el>${current + 1} / ${count}</span>` : this._pages(current + 1, count).map((p) => p === "gap" ? html`<span class="mono-table-pg-el" mono-pg-el>…</span>` : html`<button
                      class=${`mono-table-pgb${p === current + 1 ? " on" : ""}`} mono-pgb ?mono-on=${p === current + 1}
                      @click=${() => this._go(p - 1)}
                    >
                      ${p}
                    </button>`)}

          <button
            class="mono-table-pgb" mono-pgb
            ?disabled=${atLast}
            @click=${() => this._go(current + 1)}
            aria-label="Next rows"
          >
            ›
          </button>
        </div>
      `;
		}
	}
	__decorate([property({ attribute: false })], MonoTablePagingGroupCoreClass.prototype, "group", void 0);
	__decorate([property({
		attribute: "page-size",
		converter: numberStringConverter
	})], MonoTablePagingGroupCoreClass.prototype, "pageSize", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoTablePagingGroupCoreClass.prototype, "siblings", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTablePagingGroupCoreClass.prototype, "simple", void 0);
	return MonoTablePagingGroupCoreClass;
};
//#endregion
//#region src/components/table/mono-table-paging-group.shadow.ts
var MonoTablePagingGroupShadow = class MonoTablePagingGroupShadow extends MonoTablePagingGroupCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { hostDisplay: "inline-flex" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTablePagingGroupShadow = __decorate([customElement("mono-shadow-table-paging-group")], MonoTablePagingGroupShadow);
//#endregion
//#region src/components/table/mono-table-page-size-core.ts
/**
* `MonoTablePageSizeCore` — render-mode-agnostic logic for `mono-table-page-size`:
* a native `<select>` of page-size options wired to the controller. No slots, no
* icons — light and shadow share the full `render()`.
*/
var MonoTablePageSizeCore = (superClass) => {
	class MonoTablePageSizeCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "pageSize";
			this.sizes = [
				10,
				20,
				50,
				100
			];
			this.label = "";
		}
		get _options() {
			const raw = this.sizes;
			const list = Array.isArray(raw) ? raw : String(raw).split(",").map((s) => s.trim());
			const out = [];
			for (const v of list) if (typeof v === "string" && v.toLowerCase() === "all") out.push("all");
			else {
				const n = Number(v);
				if (Number.isFinite(n) && n > 0) out.push(n);
			}
			return out;
		}
		_handleChange(event) {
			const raw = event.currentTarget.value;
			if (raw === "all") {
				this.dataGrid?.setPageSize("all");
				return;
			}
			const value = Number(raw);
			if (Number.isFinite(value) && value > 0) this.dataGrid?.setPageSize(value);
		}
		render() {
			const current = this.dataGrid?.pageSize ?? 0;
			const all = this.dataGrid?.pageSizeAll ?? false;
			const loading = this.dataGrid?.loading ?? false;
			return html`
        <label class="mono-table-page-size" mono-table-page-size>
          ${this.label ? html`<span>${this.label}</span>` : nothing}
          <select class="mono-table-sel" mono-sel ?disabled=${loading} @change=${this._handleChange}>
            ${this._options.map((o) => {
				const isAll = o === "all";
				return html`<option value=${isAll ? "all" : o} ?selected=${isAll ? all : !all && o === current}>
                ${isAll ? "All" : o}
              </option>`;
			})}
          </select>
        </label>
      `;
		}
	}
	__decorate([property({ attribute: false })], MonoTablePageSizeCoreClass.prototype, "sizes", void 0);
	__decorate([property({ type: String })], MonoTablePageSizeCoreClass.prototype, "label", void 0);
	return MonoTablePageSizeCoreClass;
};
//#endregion
//#region src/components/table/mono-table-page-size.shadow.ts
var MonoTablePageSizeShadow = class MonoTablePageSizeShadow extends MonoTablePageSizeCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { hostDisplay: "inline-flex" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTablePageSizeShadow = __decorate([customElement("mono-shadow-table-page-size")], MonoTablePageSizeShadow);
//#endregion
//#region src/components/table/mono-table-info-core.ts
/**
* `MonoTableInfoCore` — render-mode-agnostic logic for `mono-table-info`: a
* read-only summary line (`Showing {from}–{to} of {total}`) driven by the
* controller. No slots, no icons — light and shadow share the full `render()`.
*/
var MonoTableInfoCore = (superClass) => {
	class MonoTableInfoCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "info";
			this.template = "Showing {from}–{to} of {total}";
		}
		render() {
			const grid = this.dataGrid;
			const shown = grid?.items.length ?? 0;
			const pageIndex = grid?.pageIndex ?? 0;
			const pageSize = grid?.pageSize ?? 0;
			const total = grid?.totalCount ?? shown;
			const from = shown === 0 ? 0 : pageIndex * pageSize + 1;
			const to = shown === 0 ? 0 : from + shown - 1;
			return html`<span class="mono-table-info" mono-table-info>${this.template.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total)).replace("{page}", String(pageIndex + 1)).replace("{pages}", String(grid?.pageCount ?? 1))}</span>`;
		}
	}
	__decorate([property({ type: String })], MonoTableInfoCoreClass.prototype, "template", void 0);
	return MonoTableInfoCoreClass;
};
//#endregion
//#region src/components/table/mono-table-info.shadow.ts
var MonoTableInfoShadow = class MonoTableInfoShadow extends MonoTableInfoCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { hostDisplay: "inline" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTableInfoShadow = __decorate([customElement("mono-shadow-table-info")], MonoTableInfoShadow);
//#endregion
//#region src/components/table/mono-table-th-core.ts
/** Coerce a size prop to a CSS length: a number or bare numeric string → px; anything with a unit (`'10rem'`, `'40%'`) is used as-is. */
function toCssSize(value) {
	return typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value)) ? `${value}px` : String(value);
}
/**
* `MonoTableThCore` — render-mode-agnostic logic for `mono-table-th`, the unified
* column-header cell. It declares a column's `field`/`caption`, folds the sort
* behavior into a single `:sort.prop` object (`{ order?, noClear?, disabled? }`),
* marks a column editable (`editable`), and — with `header-filter` — adds a
* DevExtreme-style **header filter**: a funnel icon (or the header's right-click
* menu → "Header Filter") opens a panel of the column's distinct values (fetched
* via the controller's `distinctValues`, i.e. an OData `$apply=groupby`) with
* checkboxes; checking some + Apply calls `dataGrid.setColumnFilter(field, values)`.
*
* Gestures are fixed, not configurable, and both features split the same way: the
* ICON (sort arrow / filter funnel) acts on ONE column, replacing whatever else
* was sorted or filtered, while RIGHT-CLICK always opens the menu, whose `Sort ›`
* / `Header Filter ›` rows combine columns. One carry-over: once the menu has
* started a combination and something is still sorted / filtered, the icons
* combine too — the grid remembers the gesture (`sortCombining` /
* `columnFilterCombining`) until the last key / filter is gone.
*
* The standalone `mono-table-sort` element is unchanged and still supported.
*/
var MonoTableThCore = (superClass) => {
	class MonoTableThCoreClass extends MonoTableMenuCore(superClass) {
		constructor(...args) {
			super(...args);
			this._propsSlot = "th";
			this.field = "";
			this.caption = "";
			this.sort = false;
			this.editable = false;
			this.required = false;
			this.headerFilter = false;
			this.dateFilter = false;
			this._tree = [];
			this._expanded = /* @__PURE__ */ new Set();
			this._exclusiveWarned = false;
			this._seededSort = false;
			this._filterOpen = false;
			this._values = [];
			this._checked = /* @__PURE__ */ new Set();
			this._valuesLoading = false;
			this._valuesError = false;
			this._search = "";
			this._fromIcon = false;
			defineHybridPropAliases(this, ["editableTrigger"]);
		}
		/** The sort config as an object: `true` → `{}`, `false` → `undefined`. */
		get _sortObj() {
			const s = this.sort;
			if (s === true) return {};
			if (!s || typeof s !== "object") return void 0;
			return s;
		}
		connectedCallback() {
			super.connectedCallback();
			this._register();
		}
		disconnectedCallback() {
			this.dataGrid?.unregisterColumn(this);
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			super.willUpdate(changed);
			if (changed.has("dataGrid") || changed.has("field") || changed.has("sort")) this._register();
		}
		_register() {
			if (isServer || !this.dataGrid) return;
			this.dataGrid.registerColumn(this);
			this._seedSort();
		}
		/** Apply `sort.order` once, unless THIS column is already sorted (don't fight a user sort). */
		_seedSort() {
			if (this._seededSort) return;
			if (!this._sortObj) return;
			this._seededSort = true;
			const order = this._sortObj.order;
			if (!order || !this.field) return;
			if (this._current) return;
			this.dataGrid?.setSort(this.field, order, { multi: true });
		}
		updated(changed) {
			super.updated(changed);
			if (isServer) return;
			const cell = this.closest("th, td");
			if (cell) {
				cell.setAttribute("aria-sort", ariaSort(this._current));
				if (this.width != null && this.width !== "") cell.style.width = toCssSize(this.width);
				if (this.height != null && this.height !== "") cell.style.height = toCssSize(this.height);
				cell.style.textAlign = this.align ?? "";
			}
			this._syncContextMenu();
			this.toggleAttribute("data-filtered", this._filtered);
			this._syncRowTrigger();
		}
		/**
		* Hand the controller the `<table>` that holds this grid's rows so it can
		* bind the click / double-click that opens a row's inline editor. Every
		* header cell calls in; `bindRowTrigger` is idempotent, so they collapse to
		* one listener. Only a th that declares its own `editable-trigger` writes the
		* shared setting, leaving `monoDataGrid({ editableTrigger })` in charge
		* otherwise.
		*/
		_syncRowTrigger() {
			const grid = this.dataGrid;
			if (!grid?.bindRowTrigger) return;
			if (this.editableTrigger && grid.editableTrigger !== this.editableTrigger) grid.editableTrigger = this.editableTrigger;
			grid.bindRowTrigger(this.closest("table"));
		}
		/**
		* The header-filter config with every default resolved, so no call site has to
		* re-test `headerFilter`'s shape. `true` → all defaults; an object implies
		* `enable: true` unless it says otherwise (config that silently does nothing
		* would be worse than useless).
		*/
		get _hf() {
			const df = this._df;
			const raw = this.headerFilter;
			const cfg = raw && typeof raw === "object" ? raw : {};
			const hfEnable = raw && typeof raw === "object" ? cfg.enable !== false : !!raw;
			if (df) {
				if (hfEnable && !this._exclusiveWarned) {
					this._exclusiveWarned = true;
					console.warn(`[mono-table-th] "${this.field}" sets both headerFilter and dateFilter; they are exclusive — using dateFilter.`);
				}
				return {
					enable: true,
					title: df.title ?? `Filter: ${this.caption || this.field}`,
					showIcon: df.showIcon !== false,
					dataSourceOptions: df.dataSourceOptions,
					date: true
				};
			}
			return {
				enable: hfEnable,
				title: cfg.title ?? `Filter: ${this.caption || this.field}`,
				showIcon: cfg.showIcon !== false,
				dataSourceOptions: cfg.dataSourceOptions,
				date: false
			};
		}
		/** The date-filter config when it is ON, with its defaults resolved; else `null`. */
		get _df() {
			const raw = this.dateFilter;
			const cfg = raw && typeof raw === "object" ? raw : {};
			if (!(raw && typeof raw === "object" ? cfg.enable !== false : !!raw)) return null;
			return {
				...cfg,
				depth: cfg.depth ?? "month",
				utc: cfg.utc === true
			};
		}
		/** The column's sort config with every default resolved. */
		get _sortCfg() {
			return this.resolveSort(this._sortObj);
		}
		/** Whether the sort arrow is drawn. Hidden → see `_sortHeader()`. */
		get _sortIcon() {
			return this._sortCfg.showIcon;
		}
		get _sortable() {
			const sort = this._sortObj;
			if (sort?.enable === false) return false;
			return !!this.field && !!sort && !sort.disabled && !!this.dataGrid;
		}
		/** This column's current direction, or null when it isn't part of the sort. */
		get _current() {
			const grid = this.dataGrid;
			if (!grid) return null;
			if (typeof grid.sortOf === "function") return grid.sortOf(this.field);
			return grid.sortField === this.field ? grid.sortOrder ?? null : null;
		}
		/**
		* True when THIS column currently has an active header filter. Read by
		* `updated()` (the `data-filtered` reflection, which drives the colour rules
		* in table.css) and by both builds' `renderIcon('funnel')`, which swaps the
		* outlined funnel for the filled one.
		*
		* Safe to read during `render()`: every subscribed element re-renders on the
		* controller's `notify()`, and `setColumnFilter` notifies BEFORE it reloads,
		* so the funnel flips with the click rather than with the response.
		*/
		get _filtered() {
			return this._hf.enable && (this.dataGrid?.columnFilter?.(this.field)?.length ?? 0) > 0;
		}
		/** 1-based precedence of this column in the sort; `0` when unsorted. */
		get _seq() {
			return this.dataGrid?.sortIndex?.(this.field) ?? 0;
		}
		/** How many columns are sorted — the `<sup>` only shows when 2+. */
		get _sortCount() {
			return this.dataGrid?.sorts?.length ?? 0;
		}
		/**
		* The arrow (or, with `showIcon: false`, the caption). Single-key — this
		* column becomes the entire sort, collapsing any stack — UNLESS the user has
		* started combining from the right-click menu and something is still
		* sorted: then the arrow appends too, because a user who began a multi-key
		* sort means to keep building it (`sortCombining`). Cycling past `desc`
		* clears this column either way.
		*/
		_toggle() {
			if (!this._sortable) return;
			this.dataGrid?.setSort(this.field, nextOrder(this._current, this._sortObj?.noClear), { multi: !!this.dataGrid?.sortCombining?.() });
		}
		/** Per-region slot content — overridden per build. */
		renderSlot(_name) {
			return html``;
		}
		/**
		* Internal icon — light: a UnoCSS `i-*` class; shadow: inline SVG (utility CSS
		* can't reach a shadow root). Both glyphs encode state the override reads off
		* `this`: `'chevron'` the sort direction (`_current`), `'funnel'` whether the
		* column is filtered (`_filtered`).
		*/
		renderIcon(_name) {
			return html``;
		}
		/**
		* The caption, plus the `required` marker when the column carries one.
		*
		* The marker sits in a WRAPPER around the label rather than inside it. Two
		* reasons, both load-bearing:
		*
		*  · `[data-mono-slot="label"]` must stay the exact element it has always been —
		*    the light build re-appends the consumer's captured nodes (and the Vue
		*    anchors travelling with them) into it after every render. Rendering into
		*    it as well would put Lit's own child part in the same range.
		*  · The header lays out as three independent boxes — funnel, caption, sort
		*    arrow — so a marker at that level drifts away from the text as soon as the
		*    header wraps. An inline-flex wrapper around label + `*` cannot be split.
		*
		* The wrapper is emitted ONLY for a marked column, so every other header keeps
		* the DOM it had. Plain text, so both builds render it from here — no per-build
		* icon hook, which is the whole point of a `*` over a glyph.
		*/
		_label() {
			const label = html`<span class="mono-table-sort-label" data-mono-slot="label"
        >${this.caption ? this.caption : this.renderSlot("label")}</span
      >`;
			if (!this.required) return label;
			return html`<span class="mono-th-caption" mono-th-caption
        >${label}<sup class="mono-th-required" mono-th-required>*</sup></span
      >`;
		}
		/**
		* Label + sort arrow. Only the ARROW is a button — clicking the caption text
		* must not sort, so the label sits outside it. `_label()` keeps its
		* `[data-mono-slot="label"]` placeholder: the light build re-appends the
		* consumer's captured nodes (and their Vue anchors) into that exact element.
		*/
		_sortHeader() {
			const current = this._current;
			const seq = this._seq;
			const total = this._sortCount;
			const seqBadge = total > 1 && seq > 0 ? html`<sup class="mono-table-sort-seq" mono-sort-seq aria-hidden="true">${seq}</sup>` : nothing;
			if (!this._sortIcon) return html`
          <span class="mono-table-sort-head no-icon" mono-sort-head>
            <button
              type="button"
              class="mono-table-sort-btn label-trigger" mono-sort-btn
              data-dir=${current ?? "none"}
              title=${sortTitle(current, seq, total)}
              @click=${this._toggle}
            >
              ${this._label()}${seqBadge}
            </button>
          </span>
        `;
			return html`
        <span class="mono-table-sort-head" mono-sort-head>
          ${this._label()}
          <button
            type="button"
            class="mono-table-sort-btn" mono-sort-btn
            data-dir=${current ?? "none"}
            title=${sortTitle(current, seq, total)}
            aria-label=${`Sort by ${this.caption || this.field}`}
            data-shimmer-ignore
            @click=${this._toggle}
          >
            <span class="mono-table-sort-ind" mono-sort-ind aria-hidden="true">${this.renderIcon("chevron")}</span>
            ${seqBadge}
          </button>
        </span>
      `;
		}
		render() {
			const hf = this._hf;
			const header = this._sortable ? this._sortHeader() : this._label();
			return html`${hf.enable && hf.showIcon ? this._renderFilterIcon() : nothing}${header}${this._wantsMenu ? this._renderMenus() : nothing}`;
		}
		/**
		* Whether right-click has anything to show. Sorting and the header filter each
		* contribute a section; a column with neither keeps the browser's own menu.
		*/
		get _wantsMenu() {
			return this._sortable || this._hf.enable;
		}
		/**
		* Bind `contextmenu` whenever the menu has a section to show. Unconditional now
		* that the gesture is fixed, which is also what keeps a header filter with
		* `showIcon: false` reachable — it used to need a warned-about fallback.
		*/
		_syncContextMenu() {
			if (isServer) return;
			this.bindContextMenu(this._wantsMenu);
		}
		ensurePopups() {
			if (this._filterPopup || isServer) return;
			super.ensurePopups();
			const scope = () => this.closest(".mono-table, [mono-table]") ?? this;
			this._filterPopup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-th-filter"),
				getAnchor: () => this._fromIcon ? this.renderRoot.querySelector(".mono-th-filter-ind") ?? this : this._menuPanelEl?.querySelector("[data-menu=\"filter\"]") ?? this._cell ?? this,
				getStyleScope: scope,
				isOpen: () => this._filterOpen,
				side: () => this._fromIcon ? "bottom" : "right",
				align: () => "start",
				offset: () => 4,
				flip: () => true,
				shift: () => true
			});
		}
		openMenu(e) {
			this._fromIcon = false;
			this._filterOpen = false;
			super.openMenu(e);
		}
		closeMenu() {
			this._filterOpen = false;
			this._fromIcon = false;
			super.closeMenu();
		}
		/** Also keep the filter panel and the funnel from dismissing the menu. */
		_menuKeepsPath(path) {
			if (super._menuKeepsPath(path)) return true;
			if (this._filterPopup?.containsInPath(path)) return true;
			const icon = this.renderRoot.querySelector(".mono-th-filter-ind");
			return !!icon && path.includes(icon);
		}
		async _openFilter() {
			this._menuOpen = !this._fromIcon;
			this._filterOpen = true;
			this._search = "";
			this._expanded = /* @__PURE__ */ new Set();
			const current = this.dataGrid?.columnFilter?.(this.field) ?? [];
			this._checked = this._hf.date ? /* @__PURE__ */ new Set() : new Set(current.map((v) => String(v)));
			await this._loadValues();
			if (this._hf.date) this._checked = seedFromRanges(this._tree, current);
		}
		/**
		* Left-click on the funnel — open the value panel DIRECTLY, skipping the
		* `Header Filter ›` row that right-click goes through. A visible click
		* affordance shouldn't need two steps.
		*/
		async _openFromIcon(e) {
			if (isServer || !this._hf.enable) return;
			e.preventDefault();
			e.stopPropagation();
			if (this._filterOpen) {
				this.closeMenu();
				return;
			}
			this.ensurePopups();
			this._fromIcon = true;
			this.bindDocListeners();
			await this._openFilter();
		}
		_renderFilterIcon() {
			return html`
        <button
          type="button"
          class="mono-th-filter-ind" mono-th-filter-ind
          title=${this._hf.title}
          aria-label=${`Filter ${this.caption || this.field}`}
          data-shimmer-ignore
          @click=${this._openFromIcon}
        >
          ${this.renderIcon("funnel")}
        </button>
      `;
		}
		/** (Re)fetch the column's distinct values (used on open and on Retry). */
		async _loadValues() {
			this._valuesError = false;
			this._valuesLoading = true;
			this._values = [];
			this._tree = [];
			try {
				this._values = await this.dataGrid?.distinctValues?.(this.field, this._hf.dataSourceOptions) ?? [];
				const df = this._df;
				if (df) this._tree = buildDateTree(this._values, {
					depth: df.depth,
					utc: df.utc,
					locale: df.locale
				});
			} catch {
				this._valuesError = true;
			} finally {
				this._valuesLoading = false;
			}
		}
		_toggleNode(node, on) {
			this._checked = setChecked(node, on, this._checked, this._tree);
		}
		_toggleExpand(key) {
			const next = new Set(this._expanded);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			this._expanded = next;
		}
		_renderDateNodes(nodes, level, inheritedOn = false) {
			return html`
        <ul class="mono-th-tree" mono-th-tree role=${level === 0 ? "tree" : "group"}>
          ${nodes.map((n) => {
				const state = checkState(n, this._checked, void 0, inheritedOn);
				const open = this._expanded.has(n.key);
				const branch = n.children.length > 0;
				return html`
              <li role="treeitem" aria-expanded=${branch ? open ? "true" : "false" : nothing}>
                <div class="mono-th-tree-row" mono-th-tree-row data-level=${level} data-key=${n.key}>
                  <button
                    type="button"
                    class="mono-th-tree-toggle ${open ? "open" : ""}" mono-th-tree-toggle
                    ?mono-open=${open}
                    ?hidden=${!branch}
                    tabindex=${branch ? 0 : -1}
                    aria-label=${open ? "Collapse" : "Expand"}
                    @click=${() => this._toggleExpand(n.key)}
                  >
                    ${this._caretIcon()}
                  </button>
                  <label class="mono-th-check" mono-th-check>
                    <input
                      type="checkbox"
                      .checked=${state === "on"}
                      .indeterminate=${state === "mixed"}
                      @change=${(e) => this._toggleNode(n, e.target.checked)}
                    />
                    <span class="mono-th-check-box" mono-th-check-box></span>
                    <span class="mono-th-check-label" mono-th-check-label>${n.label}</span>
                    <span class="mono-th-check-count" mono-th-check-count>${n.count}</span>
                  </label>
                </div>
                ${branch && open ? this._renderDateNodes(n.children, level + 1, state === "on") : nothing}
              </li>
            `;
			})}
        </ul>
      `;
		}
		_renderDateTree() {
			const roots = this._tree;
			const allOn = roots.length > 0 && roots.every((r) => checkState(r, this._checked) === "on");
			const anyOn = roots.some((r) => checkState(r, this._checked) !== "off");
			return html`
        <label class="mono-th-check mono-th-check-all" mono-th-check mono-th-check-all>
          <input
            type="checkbox"
            .checked=${allOn}
            .indeterminate=${!allOn && anyOn}
            @change=${(e) => this._checked = setAllChecked(roots, e.target.checked)}
          />
          <span class="mono-th-check-box" mono-th-check-box></span>
          <span class="mono-th-check-label" mono-th-check-label>(Select all)</span>
          <span class="mono-th-check-count" mono-th-check-count>${roots.reduce((n, r) => n + r.count, 0)}</span>
        </label>
        ${this._renderDateNodes(roots, 0)}
      `;
		}
		/**
		* Label for a distinct value. A column `map` relabels the list so it reads like
		* the table body — the checkbox still carries the RAW value, so
		* `setColumnFilter` keeps matching the real data.
		*/
		_display(value) {
			const map = this.dataGrid?.columnMap?.(this.field);
			if (map) try {
				const mapped = map(value, { [this.field]: value }, 0);
				if (mapped != null && mapped !== "") return String(mapped);
			} catch {}
			return value == null || value === "" ? "(Blanks)" : String(value);
		}
		/**
		* The figure shown beside `(Select all)`: the summed row count of the listed
		* values, so it lines up with each value's own count in the same column. Falls
		* back to the NUMBER of values when the source reports no counts (a consumer
		* `distinctValues` resolver may return bare values).
		*/
		_totalCount(list) {
			const sum = list.reduce((n, v) => n + (Number(v.count) || 0), 0);
			return sum > 0 ? sum : list.length;
		}
		_filteredValues() {
			const q = this._search.trim().toLowerCase();
			if (!q) return this._values;
			return this._values.filter((v) => this._display(v.value).toLowerCase().includes(q));
		}
		_toggleValue(key, on) {
			const next = new Set(this._checked);
			if (on) next.add(key);
			else next.delete(key);
			this._checked = next;
		}
		_toggleSelectAll(on) {
			const next = new Set(this._checked);
			for (const v of this._filteredValues()) {
				const key = String(v.value);
				if (on) next.add(key);
				else next.delete(key);
			}
			this._checked = next;
		}
		/**
		* Which way this panel was reached decides whether the filter COMBINES with the
		* other columns — the same split the sort arrow and `Sort ›` menu use: the
		* menu combines, the funnel replaces. With one carry-over: once the user has
		* started combining from the menu and something is still filtered, the
		* funnel combines too (`columnFilterCombining`) — a user who began a
		* multi-column filter means to keep building it. Read it BEFORE
		* `closeMenu()`, which resets `_fromIcon`.
		*/
		get _filterMulti() {
			return !this._fromIcon || !!this.dataGrid?.columnFilterCombining?.();
		}
		async _apply() {
			if (this._hf.date) {
				const ranges = minimize(this._tree, this._checked);
				const multi = this._filterMulti;
				const sticky = !this._fromIcon;
				this.closeMenu();
				await this.dataGrid?.setColumnFilter?.(this.field, ranges, {
					multi,
					sticky
				});
				return;
			}
			const values = this._values.filter((v) => this._checked.has(String(v.value))).map((v) => v.value);
			const multi = this._filterMulti;
			const sticky = !this._fromIcon;
			this.closeMenu();
			await this.dataGrid?.setColumnFilter?.(this.field, values, {
				multi,
				sticky
			});
		}
		async _clear() {
			this._checked = /* @__PURE__ */ new Set();
			const multi = this._filterMulti;
			const sticky = !this._fromIcon;
			this.closeMenu();
			await this.dataGrid?.setColumnFilter?.(this.field, [], {
				multi,
				sticky
			});
		}
		/** Drop every column's header filter, however many are active. */
		async _clearAllFilters() {
			this._checked = /* @__PURE__ */ new Set();
			this.closeMenu();
			await this.dataGrid?.setColumnFilter?.(this.field, [], { multi: false });
		}
		_retryIcon() {
			return html`<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
        <path
          d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        />
      </svg>`;
		}
		/** Empty / error state with a Retry action below the message. */
		_renderMessage(text) {
			return html`
        <div class="mono-th-filter-msg" mono-th-filter-msg>
          <div class="mono-th-filter-msg-text" mono-th-filter-msg-text>${text}</div>
          <button type="button" class="mono-th-retry" mono-th-retry @click=${() => this._loadValues()}>
            ${this._retryIcon()} Retry
          </button>
        </div>
      `;
		}
		/**
		* The header menu (+ its cascading panels). The funnel itself is rendered by
		* `_renderFilterIcon()` BEFORE the caption; this only carries the popups.
		*
		* One section per enabled feature, with a separator between them when a column
		* has both.
		*/
		_renderMenus() {
			const hf = this._hf;
			const sortSection = this._sortable;
			const filterSection = hf.enable;
			return html`
        <div class="mono-th-menu ${this._menuOpen ? "open" : ""}" mono-th-menu ?mono-open=${this._menuOpen} role="menu">
          ${sortSection ? this.renderSortMenuItem() : nothing}
          ${sortSection && filterSection ? html`<div class="mono-th-menu-sep" mono-th-menu-sep role="separator"></div>` : nothing}
          ${filterSection ? html`
                <button
                  type="button"
                  class="mono-th-menu-item" mono-th-menu-item
                  role="menuitem"
                  data-menu="filter"
                  aria-haspopup="true"
                  @click=${() => this._openFilter()}
                >
                  <span class="mono-th-menu-ic" mono-th-menu-ic>${this.renderIcon("funnel")}</span>
                  <span class="mono-th-menu-label" mono-th-menu-label>${this._hf.date ? "Date Filter" : "Header Filter"}</span>
                  <span class="mono-th-menu-caret" mono-th-menu-caret>${this._caretIcon()}</span>
                </button>
              ` : nothing}
        </div>
        ${sortSection ? this.renderSortSubmenu(this._sortCfg.noClear) : nothing}
        ${hf.enable ? this._renderFilterPanel() : nothing}
      `;
		}
		_renderFilterPanel() {
			const list = this._filteredValues();
			const allChecked = list.length > 0 && list.every((v) => this._checked.has(String(v.value)));
			const multi = this._filterMulti;
			const filteredColumns = this.dataGrid?.filteredColumns?.() ?? [];
			const otherFiltered = filteredColumns.filter((f) => f !== this.field).length;
			const clearAllCount = otherFiltered + (filteredColumns.includes(this.field) ? 1 : 0);
			return html`
        <div
          class="mono-th-filter ${this._filterOpen ? "open" : ""} ${this._hf.date ? "is-date" : ""}" mono-th-filter
          ?mono-open=${this._filterOpen}
          ?mono-date=${!!this._hf.date}
          role="dialog"
          aria-label=${this._hf.date ? "Date filter" : "Header filter"}
        >
          <div class="mono-th-filter-head" mono-th-filter-head>${this._hf.title}</div>
          ${this._hf.date ? nothing : html`
                <div class="mono-th-filter-search" mono-th-filter-search>
                  <input
                    type="text"
                    class="mono-th-filter-input" mono-th-filter-input
                    placeholder="Search…"
                    .value=${this._search}
                    @input=${(e) => this._search = e.target.value}
                  />
                </div>
              `}
          <div class="mono-th-filter-list" mono-th-filter-list>
            ${this._valuesLoading ? html`<div class="mono-th-filter-msg" mono-th-filter-msg><span class="mono-th-filter-spin" mono-th-filter-spin></span>Loading…</div>` : this._valuesError ? this._renderMessage("Failed to load values.") : this._hf.date ? this._tree.length === 0 ? this._renderMessage("No values.") : this._renderDateTree() : list.length === 0 ? this._renderMessage("No values.") : html`
                      <label class="mono-th-check mono-th-check-all" mono-th-check mono-th-check-all>
                        <input
                          type="checkbox"
                          .checked=${allChecked}
                          @change=${(e) => this._toggleSelectAll(e.target.checked)}
                        />
                        <span class="mono-th-check-box" mono-th-check-box></span>
                        <span class="mono-th-check-label" mono-th-check-label>(Select all)</span>
                        <span class="mono-th-check-count" mono-th-check-count>${this._totalCount(list)}</span>
                      </label>
                      ${list.map((v) => {
				const key = String(v.value);
				return html`
                          <label class="mono-th-check" mono-th-check>
                            <input
                              type="checkbox"
                              .checked=${this._checked.has(key)}
                              @change=${(e) => this._toggleValue(key, e.target.checked)}
                            />
                            <span class="mono-th-check-box" mono-th-check-box></span>
                            <span class="mono-th-check-label" mono-th-check-label>${this._display(v.value)}</span>
                            <span class="mono-th-check-count" mono-th-check-count>${v.count}</span>
                          </label>
                        `;
			})}
                    `}
          </div>
          <div class="mono-th-filter-foot" mono-th-filter-foot>
            <button type="button" class="mono-th-filter-btn ghost" mono-th-filter-btn @click=${() => this._clear()}>
              Clear
            </button>
            ${multi && otherFiltered > 0 ? html`
                  <button
                    type="button"
                    class="mono-th-filter-btn ghost" mono-th-filter-btn
                    data-action="clear-all"
                    title="Drop the header filter on every column (${clearAllCount})"
                    @click=${() => this._clearAllFilters()}
                  >
                    Clear all columns (${clearAllCount})
                  </button>
                ` : nothing}
            <span class="mono-th-filter-foot-sp" mono-th-filter-foot-sp></span>
            <button type="button" class="mono-th-filter-btn ghost" mono-th-filter-btn @click=${() => this.closeMenu()}>
              Cancel
            </button>
            <button type="button" class="mono-th-filter-btn primary" mono-th-filter-btn @click=${() => this._apply()}>
              Apply
            </button>
          </div>
        </div>
      `;
		}
	}
	__decorate([property({ type: String })], MonoTableThCoreClass.prototype, "field", void 0);
	__decorate([property({ type: String })], MonoTableThCoreClass.prototype, "caption", void 0);
	__decorate([property({
		attribute: "sort",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableThCoreClass.prototype, "sort", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableThCoreClass.prototype, "editable", void 0);
	__decorate([property({ attribute: "editable-trigger" })], MonoTableThCoreClass.prototype, "editableTrigger", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableThCoreClass.prototype, "required", void 0);
	__decorate([property({
		attribute: "header-filter",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableThCoreClass.prototype, "headerFilter", void 0);
	__decorate([property({
		attribute: "date-filter",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTableThCoreClass.prototype, "dateFilter", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_tree", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_expanded", void 0);
	__decorate([property()], MonoTableThCoreClass.prototype, "width", void 0);
	__decorate([property({ reflect: true })], MonoTableThCoreClass.prototype, "align", void 0);
	__decorate([property()], MonoTableThCoreClass.prototype, "height", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_filterOpen", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_values", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_checked", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_valuesLoading", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_valuesError", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_search", void 0);
	__decorate([state()], MonoTableThCoreClass.prototype, "_fromIcon", void 0);
	return MonoTableThCoreClass;
};
//#endregion
//#region src/components/table/table-filter-icons.ts
/** One funnel SVG: outlined while the column is unfiltered, filled once it isn't. */
function filterIndicatorSvg(active) {
	if (active) return html`
      <svg class="mono-th-filter-glyph" mono-th-filter-glyph viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 12v7.88c.04.3-.06.62-.29.83a.996.996 0 0 1-1.41 0l-2.01-2.01a.99.99 0 0 1-.29-.83V12h-.03L4.21 4.62a1 1 0 0 1 .17-1.4c.19-.14.4-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 0 1 .17 1.4L14.03 12z" />
      </svg>
    `;
	return html`
    <svg class="mono-th-filter-glyph" mono-th-filter-glyph viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15 19.88c.04.3-.06.62-.29.83a.996.996 0 0 1-1.41 0L9.29 16.7a.99.99 0 0 1-.29-.83v-5.12L4.21 4.62a1 1 0 0 1 .17-1.4c.19-.14.4-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 0 1 .17 1.4L15 10.75zM7.04 5L11 10.06v5.52l2 2v-7.53L16.96 5z" />
    </svg>
  `;
}
//#endregion
//#region src/components/table/mono-table-th.shadow.ts
var MonoTableThShadow = class MonoTableThShadow extends MonoTableThCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { hostDisplay: "inline-flex" }))];
	}
	renderSlot(_name) {
		return html`<slot></slot>`;
	}
	renderIcon(name) {
		if (name === "funnel") return filterIndicatorSvg(this._filtered);
		return sortIndicatorSvg(this._current);
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTableThShadow = __decorate([customElement("mono-shadow-table-th")], MonoTableThShadow);
//#endregion
//#region src/components/table/table-overlay.ts
/**
* The element an overlay covers: the `<table>` first, the scroll wrapper only as
* a fallback.
*
* The order is the whole point. An absolutely positioned descendant of a SCROLL
* CONTAINER scrolls with the content, so covering the wrapper pins the overlay to
* the scroll origin at only the scrollport's size — scroll a wide or long table
* and the overlay slides away, leaving live rows showing through beside it. The
* table's box IS the content, so covering that keeps every column and row under
* the overlay at any scroll offset.
*/
function overlayHost(el) {
	return el.closest("table") ?? el.closest(".mono-table-scroll, [mono-table-scroll]");
}
/**
* The element whose height is reserved while an overlay is up — NEVER the
* `<table>`.
*
* A `<table>` does not treat a height as "reserve this much space": CSS table
* layout DISTRIBUTES any surplus over the rows. Freeze a table at the height it
* had when it was full, then let the source clear its rows, and the surplus lands
* on the only row left — the header — which stretches into a band hundreds of
* pixels tall with its captions floating in the middle of it. That is the
* opposite of the collapse this guard exists to prevent.
*
* A block box just reserves the space, so the hold goes on the scroll wrapper, or
* failing that on the table's own parent. If the table has no block ancestor to
* hold the space the hold is SKIPPED — a grid that briefly goes short is a
* smaller problem than a deformed one.
*/
function overlaySizeHost(el) {
	const scroll = el.closest(".mono-table-scroll, [mono-table-scroll]");
	if (scroll) return scroll;
	const table = el.closest("table");
	if (!table) return overlayHost(el);
	const parent = table.parentElement;
	return parent && parent.tagName !== "TABLE" ? parent : null;
}
/**
* Widest header row, counting `colspan` — the span a generated overlay cell
* needs.
*
* Generated and spacer rows are excluded by `data-mono-stripe-skip` rather than
* by class name: this has to skip the row the OTHER overlay may have built as
* well as its own, and both already carry that attribute for the zebra count.
*/
function columnCount(table) {
	const widest = Array.from(table.querySelectorAll("thead tr")).reduce((max, tr) => {
		const span = Array.from(tr.children).reduce((sum, c) => sum + (c.colSpan || 1), 0);
		return Math.max(max, span);
	}, 0);
	if (widest) return widest;
	const first = table.querySelector("tbody tr:not([data-mono-stripe-skip])");
	return first ? Array.from(first.children).length : 0;
}
/**
* Give an overlay a spec-valid home inside the table, and make that home carry
* what the styling keys on.
*
* `<table>`'s content model permits only `caption` / `colgroup` / `thead` /
* `tbody` / `tfoot`, and a row section permits only `<tr>` — so a bare custom
* element in either is invalid HTML. Vue's compiler warns about it on every
* consumer build, and the HTML PARSER foster-parents it out of the table: a
* server-rendered `<mono-shadow-table-error>` written straight into `<tbody>`
* has left the table before hydration starts, at which point it is not a row and
* covers nothing.
*
* So the form the docs teach is the valid one — `<tr><td colspan>` written by the
* consumer — and this function has two jobs:
*
* 1. **Adopt** a hand-written cell. A row the consumer wrote lacks the three
*    things the generated one has: the `rowClass` (which is the ONLY thing the
*    padding/border reset in `table.css` keys on — without it a docs-style
*    `td { padding }` puts a 14px gutter around the bar), `data-mono-stripe-skip`
*    (zebra parity), and a `colspan` that `syncRowSpan` keeps in step with the
*    columns. Asking a consumer to remember all three is a trap, so the element
*    stamps them on the row it finds itself in. The class is ADDED, never
*    replaced — a framework does not patch an attribute it did not bind, so what
*    is written here survives their re-renders, and what they wrote survives us.
*
* 2. **Generate** a row when the element is dropped bare into a table or a row
*    section anyway — the client-only fallback that makes an imperative
*    `body.appendChild(el)` keep working. Not the taught form, for the reasons
*    above.
*
* A `<caption>` host is left alone: it is valid HTML and its CSS is honoured as
* written. Anything else (`undefined`) is not a table position at all.
*/
function ensureRowHost(el, rowClass) {
	const rowAttr = rowClass.replace(/^mono-table-/, "mono-");
	const parent = el.parentElement;
	if (!parent) return void 0;
	const tag = parent.tagName;
	if (tag === "TD" || tag === "TH") {
		const row = parent.parentElement;
		if (!row || row.tagName !== "TR") return void 0;
		row.classList.add(rowClass);
		row.setAttribute(rowAttr, "");
		row.setAttribute("data-mono-stripe-skip", "");
		return {
			row,
			generated: false
		};
	}
	if (tag !== "TABLE" && tag !== "TBODY" && tag !== "THEAD" && tag !== "TFOOT") return void 0;
	const table = el.closest("table");
	const row = document.createElement("tr");
	row.className = rowClass;
	row.setAttribute(rowAttr, "");
	row.setAttribute("data-mono-stripe-skip", "");
	const cell = document.createElement("td");
	const span = table ? columnCount(table) : 0;
	if (span > 0) cell.colSpan = span;
	const section = tag === "TABLE" ? table?.querySelector("tbody") ?? table?.appendChild(document.createElement("tbody")) : parent;
	cell.appendChild(el);
	row.appendChild(cell);
	section?.insertBefore(row, section.firstChild);
	return {
		row,
		generated: true
	};
}
/**
* Drop a GENERATED row on disconnect. An empty `<tr>` left behind would still
* draw a border and occupy a slot in the zebra parity count.
*
* An adopted row is never touched: it is the consumer's node, still referenced by
* whatever rendered it, and removing it is exactly the "disrupt future
* functionality" the Vue warning threatens.
*/
function releaseRowHost(el, host) {
	if (host?.generated && !host.row.contains(el)) host.row.remove();
}
/**
* Re-widen the row's cell after a column change — generated or adopted.
*
* `ensureRowHost` sets `colspan` once on a generated cell, from the header as it
* stood on connect; a hand-written cell has whatever the consumer typed, which
* may be nothing. A grid whose columns are driven by data — a `v-for` over a
* props snapshot, a column toggled off — changes that count later, and a stale
* span leaves the row short of the table or overflowing it.
* `mono-table-detail-core` recomputes for the same reason.
*
* Only writes when the number actually moved, so this is safe to call from every
* `updated()` — and a consumer's correct `colspan` is never rewritten.
*/
function syncRowSpan(el, host) {
	if (!host) return;
	const table = el.closest("table");
	if (!table) return;
	const cell = el.closest("td, th") ?? host.row.firstElementChild;
	if (!cell) return;
	const span = columnCount(table);
	if (span > 0 && cell.colSpan !== span) cell.colSpan = span;
}
/**
* Prefix for the per-overlay height reservations parked on the size host.
*
* Every overlay reserves room by writing ITS OWN variable here, and the host's
* `min-height` is then the `max()` of whatever variables are present. A single
* shared inline `min-height` cannot work once two overlays are in the same table
* — which is the arrangement the docs teach, a spinner and an empty state in one
* `<caption>`: the spinner's hide would clear the reservation the empty state had
* just made, the scroll wrapper would collapse to a header, and the message would
* be clipped out of existence by the wrapper's own `overflow`. Nothing about the
* DOM would look wrong; the grid would simply be blank.
*/
var HOLD_PREFIX = "--mono-table-hold-";
/** `max()` over every reservation currently parked on `el`, or `''` if none. */
function holdExpression(el) {
	const names = [];
	for (let i = 0; i < el.style.length; i++) {
		const name = el.style.item(i);
		if (name.startsWith(HOLD_PREFIX)) names.push(name);
	}
	if (!names.length) return "";
	const terms = names.map((n) => `var(${n}, 0px)`);
	return terms.length === 1 ? terms[0] : `max(${terms.join(", ")})`;
}
/**
* The hosts an overlay is currently holding.
*
* Remembered rather than re-derived, because the one moment they are most needed
* is the one moment they cannot be found: `disconnectedCallback` runs AFTER the
* element leaves the tree, so `closest('table')` returns null and an overlay
* cleaning up on its way out would silently clean up nothing — leaving a
* permanent reservation on the consumer's own scroll wrapper, i.e. a gap under
* their header that nothing on the page explains.
*/
var applied = /* @__PURE__ */ new WeakMap();
/**
* Give back everything an overlay reserved, from the hosts it remembers.
*
* Safe to call on an element that never applied anything, and safe to call after
* it has been removed from the DOM — which is the point.
*/
function releaseOverlayHost(el) {
	const last = applied.get(el);
	if (!last) return;
	if (last.sizeHost) {
		last.sizeHost.style.removeProperty(last.holdVar);
		last.sizeHost.style.minHeight = holdExpression(last.sizeHost);
	}
	el.style.minHeight = "";
	last.host.style.removeProperty(last.headVar);
	applied.delete(el);
}
/**
* Make the host a positioning context, publish the header offset, reserve the
* space and stretch the overlay — or undo all four.
*
* **The order is load-bearing, and each step feeds the next.** The header offset
* goes first because a configured hold may be a function of it. The hold goes
* next because the stretch measures the scroll region the hold has just resized —
* do it the other way round and the overlay is stretched to the height the table
* had before any room was made, which on an empty grid is a header-high strip.
*/
function applyOverlayHost(el, on, opts) {
	const host = overlayHost(el);
	if (!host) return;
	const sizeHost = overlaySizeHost(el);
	if (!on) {
		releaseOverlayHost(el);
		return;
	}
	if (getComputedStyle(host).position === "static") host.style.position = "relative";
	applied.set(el, {
		host,
		sizeHost,
		headVar: opts.headVar,
		holdVar: opts.holdVar
	});
	const head = opts.measureHead === "always" || !!host.closest("[mono-sticky-head], .mono-table-sticky-head") ? host.querySelector(":scope > thead")?.offsetHeight ?? 0 : 0;
	host.style.setProperty(opts.headVar, `${head}px`);
	if (sizeHost) {
		if (opts.hold === "measure") {
			if (!sizeHost.style.getPropertyValue(opts.holdVar)) sizeHost.style.setProperty(opts.holdVar, `${sizeHost.offsetHeight}px`);
		} else sizeHost.style.setProperty(opts.holdVar, typeof opts.hold === "function" ? opts.hold() : opts.hold);
		sizeHost.style.minHeight = holdExpression(sizeHost);
	}
	if (sizeHost && sizeHost !== host) el.style.minHeight = holdExpression(sizeHost);
}
//#endregion
//#region src/components/table/mono-table-empty-core.ts
/**
* Defaults, so the element says something sensible with no props at all.
*
* A neutral question mark rather than a "broken"/"error" glyph: an empty grid is
* usually a search that matched nothing, which is a normal outcome and not a
* fault. The subtitle names the two things a user can actually do about it —
* anything more specific would be wrong on most tables.
*/
var DEFAULT_ICON$1 = "i-mdi-help-circle-outline";
var DEFAULT_TITLE = "No Data found";
var DEFAULT_SUBTITLE = "Try adjusting your search or filters.";
/** Fallback when `--mono-table-empty-min-h` resolves to nothing. */
var DEFAULT_MIN_HEIGHT = "12rem";
/** Breathing room left under the message when its own height sets the reserve. */
var TAIL_GAP = 16;
/**
* `MonoTableEmptyCore` — render-mode-agnostic logic for `mono-table-empty`, the
* message shown over a grid that came back with no rows.
*
* It is `mono-table-loading`'s pair: same `<caption>` host, same overlay geometry,
* same controller binding — one covers the grid while a query runs, this one
* covers it when the query returned nothing. Everything they share lives in
* `table-overlay.ts`.
*
* **When it shows.** With a controller bound: only once that controller has
* settled at least once (`hasLoaded`) AND has no rows AND is not loading. The
* `hasLoaded` gate is the load-bearing one — a fresh controller reads
* `items: [], loading: false`, which is indistinguishable from "loaded and
* genuinely empty", so without it every table would flash "No data" on mount
* before its first request had even been made.
*
* With NO controller bound it shows unconditionally, because then the consumer is
* driving it with `v-if` / `v-show` and an element that hid itself would simply
* never appear.
*
* **What it shows.** `icon`, then `title`, then `subtitle`, then a reload button —
* each omitted when its prop is empty. A `slot="body"` replaces all four, so a
* consumer can put arbitrary markup (or a mono component) in the same box and
* keep the placement and centring for free.
*
* SSR-safe: all DOM work is guarded behind `isServer`.
*/
var MonoTableEmptyCore = (superClass) => {
	class MonoTableEmptyCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "empty";
			this.icon = DEFAULT_ICON$1;
			this.title = DEFAULT_TITLE;
			this.subtitle = DEFAULT_SUBTITLE;
			this.reload = true;
			this.reloadLabel = "Reload";
			this._hasBodySlot = false;
			this._visible = false;
		}
		connectedCallback() {
			super.connectedCallback();
			if (isServer) return;
			this._rowHost = ensureRowHost(this, "mono-table-empty-row");
			const wasVisible = this._visible;
			this._sync();
			if (this._visible && wasVisible) this._apply();
		}
		disconnectedCallback() {
			releaseOverlayHost(this);
			releaseRowHost(this, this._rowHost);
			this._rowHost = void 0;
			super.disconnectedCallback();
		}
		/**
		* Re-read state on every notify. Replaces the base subscribe rather than
		* chaining it, the way `mono-table-loading` does: visibility is applied
		* imperatively, so waiting for Lit's async render would let a fast
		* load→empty→load sequence paint the message in between.
		*/
		_subscribe() {
			this._off?.();
			this._off = this.dataGrid?.subscribe(() => {
				this._sync();
				if (monoPendingActive(this)) this.requestUpdate();
			});
			if (!isServer) this._sync();
		}
		updated(changed) {
			super.updated?.(changed);
			if (isServer) return;
			if (changed.has("dataGrid")) this._sync();
			else if (this._visible) this._apply();
		}
		/** Whether the bound controller says "loaded, and there is nothing". */
		get _controllerEmpty() {
			const grid = this.dataGrid;
			if (!grid) return false;
			if (grid.loading) return false;
			if (grid.error) return false;
			if (!grid.hasLoaded) return false;
			return (grid.items?.length ?? 0) === 0;
		}
		/** Runs synchronously on every controller notify. */
		_sync() {
			if (isServer) return;
			const next = this.dataGrid ? this._controllerEmpty : true;
			if (next === this._visible && this.hasAttribute("data-mono-empty") === next) return;
			this._visible = next;
			this._apply();
		}
		/**
		* The room to reserve under the header.
		*
		* A CONFIGURED height, not a measured one: this overlay appears over a grid
		* that is already a header and nothing else, so there is no height left to
		* freeze. `--mono-table-empty-min-h` is the floor, read off the element so a
		* theme or a single field can retune it.
		*
		* The floor alone is not enough, though, because the message is `sticky`: a
		* sticky box cannot leave its containing block, so once the message is taller
		* than the room reserved for it the browser CLAMPS it back upwards — and it
		* creeps up until its first line is sitting on the column names again, which
		* is the exact thing the header offset exists to prevent. So the floor is
		* raised to whatever the message actually needs.
		*
		* Both measurements are taken from values the clamp does not affect: `top` is
		* the resolved `header + gap`, and `offsetHeight` is the message's own height
		* wherever it happens to be painted. Measuring its POSITION instead would be
		* circular — it is the clamped position we are sizing to avoid.
		*/
		_holdHeight() {
			if (this.height) return this.height;
			const floor = this.minHeight || getComputedStyle(this).getPropertyValue("--mono-table-empty-min-h").trim() || DEFAULT_MIN_HEIGHT;
			const box = this.renderRoot?.querySelector?.(".mono-table-empty-box");
			const top = box ? parseFloat(getComputedStyle(box).top) || 0 : 0;
			const needed = box ? Math.ceil(top + box.offsetHeight + TAIL_GAP) : 0;
			const grown = needed ? `max(${floor}, ${needed}px)` : floor;
			return this.maxHeight ? `min(${grown}, ${this.maxHeight})` : grown;
		}
		/** Reflect visibility, and reserve the room the message needs. */
		_apply() {
			this.toggleAttribute("data-mono-empty", this._visible);
			this.setAttribute("aria-hidden", this._visible ? "false" : "true");
			applyOverlayHost(this, this._visible, {
				headVar: "--mono-table-empty-head",
				holdVar: "--mono-table-hold-empty",
				hold: () => this._holdHeight(),
				measureHead: "always"
			});
		}
		/** Reload the bound controller. No-op without one — the button isn't rendered then. */
		_onReload() {
			const grid = this.dataGrid;
			if (!grid) return;
			dispatchMonoEvent(this, "reload", { grid });
			grid.reload().catch(() => {});
		}
		_reloadIcon() {
			return html`<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
        <path
          d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        />
      </svg>`;
		}
		/**
		* The icon, when the props are in play.
		*
		* Two shapes, one prop. An iconify class paints as a mask on an empty span, so
		* it must go on the `class` attribute; anything else — an emoji, a letter —
		* is just text and must go in the node. Rendering either one as the other
		* gives a blank box, which is why the branch exists rather than a single
		* "put it somewhere" line. The shadow build overrides this: a page-level
		* `i-*` class cannot reach a shadow root without help.
		*/
		_renderIcon() {
			const icon = this.icon?.trim();
			if (!icon) return nothing;
			if (isIconifyClass(icon)) return html`<span class=${`mono-table-empty-icon ${icon}`} mono-empty-icon aria-hidden="true"></span>`;
			return html`<span class="mono-table-empty-icon is-text" mono-empty-icon aria-hidden="true">${icon}</span>`;
		}
		/**
		* The `slot="body"` region — a `data-mono-slot` target in light, a real
		* `<slot>` in shadow.
		*
		* ALWAYS rendered, even when the props are in play. In the light build it is
		* the target `placeLightSlots` re-attaches the captured nodes into, and in the
		* shadow build a `<slot>` that is not in the tree has no assigned nodes — so
		* dropping it would make "is the body filled?" permanently false and the
		* override could never turn on.
		*/
		_renderBodySlot() {
			return html`<div class="mono-table-empty-body" mono-empty-body data-mono-slot="body"></div>`;
		}
		/** Icon, title, subtitle, reload — in that order, each omitted when unset. */
		_renderProps() {
			const showReload = this.reload && !!this.dataGrid;
			return html`
        ${this._renderIcon()}
        ${this.title ? html`<div class="mono-table-empty-title" mono-empty-title>${this.title}</div>` : nothing}
        ${this.subtitle ? html`<div class="mono-table-empty-sub" mono-empty-sub>${this.subtitle}</div>` : nothing}
        ${showReload ? html`<button
              type="button"
              class="mono-table-empty-reload" mono-empty-reload
              part="reload"
              @click=${() => this._onReload()}
            >
              ${this._reloadIcon()}${this.reloadLabel}
            </button>` : nothing}
      `;
		}
		/**
		* `slot="body"` REPLACES the props rather than sitting beside them. Anyone who
		* fills it has said what the box should contain, and a stray title showing
		* above their own markup would be a bug they could not turn off without also
		* clearing a prop they never set.
		*/
		_renderContent() {
			return html`${this._hasBodySlot ? nothing : this._renderProps()}${this._renderBodySlot()}`;
		}
		render() {
			return html`<div class="mono-table-empty-box" mono-empty-box part="box" role="status">
        ${this._renderContent()}
      </div>`;
		}
	}
	__decorate([property({ type: String })], MonoTableEmptyCoreClass.prototype, "icon", void 0);
	__decorate([property({ type: String })], MonoTableEmptyCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoTableEmptyCoreClass.prototype, "subtitle", void 0);
	__decorate([property({ type: Boolean })], MonoTableEmptyCoreClass.prototype, "reload", void 0);
	__decorate([property({
		type: String,
		attribute: "reload-label"
	})], MonoTableEmptyCoreClass.prototype, "reloadLabel", void 0);
	__decorate([property({ type: String })], MonoTableEmptyCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoTableEmptyCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoTableEmptyCoreClass.prototype, "maxHeight", void 0);
	__decorate([state()], MonoTableEmptyCoreClass.prototype, "_hasBodySlot", void 0);
	return MonoTableEmptyCoreClass;
};
//#endregion
//#region src/components/table/mono-table-empty.shadow.ts
var MonoTableEmptyShadow = class MonoTableEmptyShadow extends MonoTableEmptyCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { host: "mono-table-empty" }))];
	}
	static {
		this.disableWarning?.("change-in-update");
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._syncBodySlot();
	}
	updated(changed) {
		super.updated(changed);
		if (!isServer && changed.has("icon")) this._maybeAdoptIcons();
	}
	_maybeAdoptIcons() {
		if (isIconifyClass(this.icon)) adoptIconStyles(this.renderRoot);
	}
	_syncBodySlot() {
		const slot = this.renderRoot.querySelector("slot[name=\"body\"]");
		this._hasBodySlot = !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	/**
	* The body region as a real `<slot>`.
	*
	* `data-empty` collapses it while the props are in play rather than dropping it
	* — a `<slot>` that is not in the tree has no assigned nodes, so removing it
	* would make `_syncBodySlot` permanently report "no body" and the override
	* could never turn on.
	*/
	_renderBodySlot() {
		return html`<div class="mono-table-empty-body" mono-empty-body ?data-empty=${!this._hasBodySlot}>
      <slot name="body" @slotchange=${() => this._syncBodySlot()}></slot>
    </div>`;
	}
};
MonoTableEmptyShadow = __decorate([customElement("mono-shadow-table-empty")], MonoTableEmptyShadow);
//#endregion
//#region src/components/table/mono-table-error-core.ts
/**
* `MonoTableErrorCore` — render-mode-agnostic logic for `mono-table-error`, the
* red bar shown under the header when a request fails.
*
* Unlike `mono-table-loading` and `mono-table-empty`, which paint OVER the grid,
* this one is a real row in it, taking up honest height directly below the
* header the way DevExtreme's error row does. The consumer writes that row —
* `<tr><td colspan><mono-table-error/></td></tr>` — and the element ADOPTS it
* (`ensureRowHost`): the row class the padding reset keys on, the zebra-skip
* marker and a live `colspan` are stamped on, so the hand-written form needs
* nothing but the two tags. Dropped bare into `<tbody>` it still wraps itself,
* but that is invalid HTML — Vue warns, and it does not survive SSR — so it is
* the fallback, not the taught form.
*
* **What it shows.** `message` if you set one — an explicit message is an
* instruction, and it wins for as long as it is set. Otherwise the controller's
* last caught error (`MonoTableController.error`), whose text comes from the
* error itself rather than from a hardcoded string.
*
* **A failure clears the rows** (`behaviour="clear-list"`, the default): the
* controller empties `items` when it records the error, so a rejected filter
* never leaves the previous filter's rows under the bar. `"keep-list"` keeps
* them. The setting is pushed to the controller (`setErrorBehaviour`), so it
* holds whether or not this element is the one on screen.
*
* **Reload** (`reload`, default `true`): a ↻ beside the × that re-runs the
* failed query (`table.reload()`). The bar stays until that succeeds.
*
* **Dismiss hides THIS element only.** The controller keeps its error, so
* anything else bound to the same table still agrees that it happened. What
* comes back is the next *failure*, not the next different message: the element
* remembers the error object it dismissed, and the controller mints a fresh one
* per failure, so an identical repeat error re-shows.
*
* **It stays in view.** The row is table-wide, and on a table wider than its
* `.mono-table-scroll` that put the text at the far left and the ✕ / ↻ past the
* right edge — invisible until you scrolled for them. So the bar inside the row
* is `position: sticky; left: 0` at exactly the scrollport's width (`100cqw`,
* the same container-query trick the loading spinner centres with — pure CSS in
* `table.css`). Vertically it follows the HEADER: under `mono-table-sticky-head`
* the row's cell is sticky too, `top` = the measured `<thead>` height, which this
* element publishes as `--mono-table-error-head` on the `<table>` and keeps
* fresh with a `ResizeObserver` (a banded two-row header, a caption that wraps).
* A header that scrolls away takes the bar with it — it belongs to those rows.
*
* SSR-safe: all DOM work is guarded behind `isServer`.
*/
var MonoTableErrorCore = (superClass) => {
	class MonoTableErrorCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "error";
			this.message = "";
			this.dismissible = true;
			this.closeLabel = "Dismiss";
			this.behaviour = "clear-list";
			this.reload = true;
			this.reloadLabel = "Reload";
			this._dismissed = null;
			this._dismissedMessage = false;
		}
		connectedCallback() {
			super.connectedCallback();
			if (isServer) return;
			this._rowHost = ensureRowHost(this, "mono-table-error-row");
			if (this.hasUpdated) this._syncHead();
		}
		_subscribe() {
			super._subscribe();
			this._pushBehaviour();
		}
		/** The controller owns the clearing; this element only names the mode. */
		_pushBehaviour() {
			this.dataGrid?.setErrorBehaviour?.(this.behaviour === "keep-list" ? "keep-list" : "clear-list");
		}
		disconnectedCallback() {
			this._releaseHead();
			releaseRowHost(this, this._rowHost);
			this._rowHost = void 0;
			super.disconnectedCallback();
		}
		updated(changed) {
			super.updated?.(changed);
			if (isServer) return;
			syncRowSpan(this, this._rowHost);
			if (changed.has("message")) this._dismissedMessage = false;
			if (changed.has("behaviour")) this._pushBehaviour();
			this._syncHead();
		}
		/**
		* Publish the header's height for the sticky cell to sit under — only while
		* the bar is showing, and only under a frozen header (`mono-table-sticky-head`
		* on the table or its scroll wrapper). Anything else is a plain row.
		*
		* Written on the `<table>` rather than on this element: the sticky box is the
		* host `<td>`, which is an ANCESTOR, and a custom property only travels down.
		*/
		_syncHead() {
			const table = this.closest("table");
			if (!(!!this._text && !!table && !!this.closest(".mono-table-sticky-head, [mono-sticky-head]"))) {
				this._releaseHead();
				return;
			}
			const thead = table.querySelector(":scope > thead");
			if (this._headHost !== table) {
				this._releaseHead();
				this._headHost = table;
				if (thead && typeof ResizeObserver !== "undefined") {
					this._headObserver = new ResizeObserver(() => this._writeHead());
					this._headObserver.observe(thead);
				}
			}
			this._writeHead();
		}
		_writeHead() {
			const table = this._headHost;
			if (!table) return;
			const next = `${table.querySelector(":scope > thead")?.offsetHeight ?? 0}px`;
			if (table.style.getPropertyValue("--mono-table-error-head") !== next) table.style.setProperty("--mono-table-error-head", next);
		}
		/** Undo `_syncHead` — from the remembered table, since `closest()` is empty after removal. */
		_releaseHead() {
			this._headObserver?.disconnect();
			this._headObserver = void 0;
			this._headHost?.style.removeProperty("--mono-table-error-head");
			this._headHost = void 0;
		}
		/** The controller error this element would show, if it has not been dismissed. */
		get _liveError() {
			const error = this.dataGrid?.error ?? null;
			if (!error) return null;
			return error === this._dismissed ? null : error;
		}
		/** The text to paint, or `''` for "show nothing". */
		get _text() {
			const manual = this.message?.trim();
			if (manual) return this._dismissedMessage ? "" : manual;
			return this._liveError?.message ?? "";
		}
		/**
		* What the server said beyond the headline (`MonoTableError.detail`), or
		* `''`. Only for a controller error — a manual `message` is the whole text.
		*/
		get _detail() {
			if (this.message?.trim()) return "";
			return this._liveError?.detail ?? "";
		}
		_onClose(event) {
			event.stopPropagation();
			if (this.message?.trim()) this._dismissedMessage = true;
			else this._dismissed = this.dataGrid?.error ?? null;
			dispatchMonoEvent(this, "close", {
				message: this._text,
				error: this.dataGrid?.error ?? null
			});
		}
		_onReload(event) {
			event.stopPropagation();
			const grid = this.dataGrid;
			dispatchMonoEvent(this, "reload", { error: grid?.error ?? null });
			grid?.reload().catch(() => {});
		}
		/**
		* Close ✕ / reload ↻. Light (default): the UnoCSS icon class. The shadow build overrides
		* this with inline SVG — a global `.i-mdi-close` rule cannot reach a shadow
		* root. Same split as `mono-modal` / `mono-drawer`.
		*/
		renderIcon(name) {
			return name === "refresh" ? html`<span class="mono-icon i-mdi-refresh" aria-hidden="true"></span>` : html`<span class="mono-icon i-mdi-close" aria-hidden="true"></span>`;
		}
		render() {
			const text = this._text;
			if (!text) return nothing;
			const detail = this._detail;
			return html`
        <div class="mono-table-error-bar" mono-error-bar part="bar" role="alert">
          <span class="mono-table-error-text" mono-error-text part="text" title=${detail || nothing}
            >${text}${detail ? html`<span class="mono-table-error-detail" mono-error-detail part="detail">${detail}</span>` : nothing}</span
          >
          <span class="mono-table-error-actions" mono-error-actions part="actions">
            ${this.reload && this.dataGrid ? html`<button
                  type="button"
                  class="mono-table-error-btn mono-table-error-reload" mono-error-btn
                  part="reload"
                  aria-label=${this.reloadLabel}
                  title=${this.reloadLabel}
                  ?disabled=${this.dataGrid.loading}
                  @click=${(event) => this._onReload(event)}
                >
                  ${this.renderIcon("refresh")}
                </button>` : nothing}
            ${this.dismissible ? html`<button
                  type="button"
                  class="mono-table-error-btn mono-table-error-close" mono-error-btn mono-error-close
                  part="close"
                  aria-label=${this.closeLabel}
                  @click=${(event) => this._onClose(event)}
                >
                  ${this.renderIcon("close")}
                </button>` : nothing}
          </span>
        </div>
      `;
		}
	}
	__decorate([property({ type: String })], MonoTableErrorCoreClass.prototype, "message", void 0);
	__decorate([property({ type: Boolean })], MonoTableErrorCoreClass.prototype, "dismissible", void 0);
	__decorate([property({
		type: String,
		attribute: "close-label"
	})], MonoTableErrorCoreClass.prototype, "closeLabel", void 0);
	__decorate([property({ reflect: true })], MonoTableErrorCoreClass.prototype, "behaviour", void 0);
	__decorate([property({ type: Boolean })], MonoTableErrorCoreClass.prototype, "reload", void 0);
	__decorate([property({
		type: String,
		attribute: "reload-label"
	})], MonoTableErrorCoreClass.prototype, "reloadLabel", void 0);
	__decorate([state()], MonoTableErrorCoreClass.prototype, "_dismissed", void 0);
	__decorate([state()], MonoTableErrorCoreClass.prototype, "_dismissedMessage", void 0);
	return MonoTableErrorCoreClass;
};
//#endregion
//#region src/components/table/mono-table-error.shadow.ts
var MonoTableErrorShadow = class MonoTableErrorShadow extends MonoTableErrorCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { host: "mono-table-error" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	/**
	* Inline SVG — the global `.mono-icon` / `i-mdi-close` UnoCSS rule cannot reach
	* a shadow root, so the class the light build uses would paint a blank box
	* here. Same glyph, same split as `mono-modal` / `mono-drawer`.
	*/
	renderIcon(name) {
		if (name === "refresh") return html`<svg
        class="mono-icon"
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        ></path>
      </svg>`;
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
};
MonoTableErrorShadow = __decorate([customElement("mono-shadow-table-error")], MonoTableErrorShadow);
//#endregion
//#region src/components/table/mono-table-loading-core.ts
var SKELETON_FALLBACK = {
	cols: [
		25,
		25,
		25,
		25
	],
	rowH: 40,
	rows: 8
};
/**
* `loading` is TRI-STATE, so the attribute can say "not set" as well as on / off: no attribute →
* `null` (automatic, follow the controller); `loading` / `loading="true"` → `true`;
* `loading="false"` → `false`. Never reflected — the element's own state is `data-mono-loading`.
*/
var loadingConverter = { fromAttribute(value) {
	if (value === null) return null;
	return String(value).trim().toLowerCase() !== "false";
} };
/**
* `MonoTableLoadingCore` — render-mode-agnostic logic for `mono-table-loading`, a
* drop-in spinner overlay shown over the table whenever the bound controller is
* fetching (sort / search / paging / reload / save). Place it in the
* `.mono-table-scroll` wrapper, or inside the `<table>` wrapped in a `<caption>`
* (a bare custom-element child of `<table>` is invalid HTML — see the tag doc),
* and bind the controller with `:data-grid.prop` — no `v-show` wiring.
*
* It reads `dataGrid.loading` **synchronously on every controller notify** (not in
* an async render) so it can't miss a fast query whose `loading` flips back before
* Lit re-renders, and holds the overlay for a small minimum duration
* (`min-duration`, default 350ms) so the feedback is always perceptible. The
* overlay itself is toggled by an imperative `data-loading` attribute + CSS — the
* element never needs to re-render for the state to flip.
*
* "Just works" details, applied to the nearest overlay host — the enclosing
* `.mono-table-scroll` if present, else the `<table>`:
*  - makes it a positioning context (`position: relative`) so the absolute overlay
*    covers it (the consumer adds nothing);
*  - holds the grid's height while active, so a source that momentarily clears its rows
*    mid-query can't collapse it to a thin strip. The hold goes on the nearest BLOCK box (the
*    scroll wrapper, else the table's parent) — never on the `<table>`, which would distribute
*    the height over its rows and stretch the header instead of reserving space.
*
* MANUAL mode: set `loading` (`:loading="isBusy"`) and the element follows THAT instead of the
* controller — for a busy state the controller can't see (several requests, a save in a store,
* a page with no controller at all). `true` shows, `false` hides, whatever the controller says;
* `null` / `undefined` (or no attribute) hands it back to the controller. `min-duration` holds
* for both sources.
*
* SSR-safe: all DOM/timer work is guarded behind `isServer`.
*/
var MonoTableLoadingCore = (superClass) => {
	class MonoTableLoadingCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "loading";
			this._pendingOn = false;
			this._skeleton = SKELETON_FALLBACK;
			this.minDuration = 350;
			this.loading = null;
			this._visible = false;
			this._shownAt = 0;
		}
		static {
			this.monoPendingMode = "custom";
		}
		static {
			this.monoPendingDraw = "phantom";
		}
		connectedCallback() {
			super.connectedCallback();
			if (!isServer) this._rowHost = ensureRowHost(this, "mono-table-loading-row");
			if (!isServer) this._watchAttr();
			if (!isServer) this._sync();
		}
		disconnectedCallback() {
			if (this._hideTimer) clearTimeout(this._hideTimer);
			this._hideTimer = void 0;
			this._attrObserver?.disconnect();
			this._attrObserver = void 0;
			releaseOverlayHost(this);
			releaseRowHost(this, this._rowHost);
			this._rowHost = void 0;
			super.disconnectedCallback();
		}
		/**
		* Honour a `data-loading` a CONSUMER sets, instead of fighting it.
		*
		* The attribute is documented as the CSS key, so a consumer whose busy state is wider than
		* one controller — a filter that runs several requests, a store flag held across a save —
		* reasonably drives it directly: `:data-loading="isBusy || null"`. Without this the two
		* sources stomp each other: the element's own `_apply(false)` REMOVES an attribute the
		* consumer set (their overlay vanishes mid-work, and their framework will not re-set an
		* attribute it still believes is there), and an externally set one runs NONE of the work
		* below — no height freeze, no measured header offset — because that hangs off the
		* controller's `loading`, not off the attribute.
		*
		* So the two sources are kept STRICTLY apart. `data-loading` belongs to the consumer and this
		* element never writes it; its own state goes on `data-mono-loading`, and the stylesheet shows
		* the overlay for either. Nothing has to work out who wrote what — which is the only version of
		* this that can be correct, because a MutationObserver callback is a MICROTASK: a
		* "`_writing` = true while I write" flag is already back to false by the time the callback
		* runs, so the element reads its OWN write as the consumer's and latches on forever.
		*/
		_watchAttr() {
			this._attrObserver = new MutationObserver(() => this._apply());
			this._attrObserver.observe(this, {
				attributes: true,
				attributeFilter: ["data-loading"]
			});
			this._apply();
		}
		/** Re-read state on every notify (chains the base subscribe re-bind). */
		_subscribe() {
			this._off?.();
			this._off = this.dataGrid?.subscribe(() => {
				this._sync();
				if (monoPendingActive(this)) this.requestUpdate();
			});
			if (!isServer) this._sync();
		}
		/**
		* Runs synchronously on every controller notify. Latches the overlay ON the
		* instant `loading` is observed true (defeating the async-render race) and
		* defers hiding until at least `minDuration` has elapsed.
		*/
		_sync() {
			if (isServer) return;
			if (monoPendingActive(this)) {
				if (this._hideTimer) clearTimeout(this._hideTimer);
				this._hideTimer = void 0;
				return;
			}
			if (this.loading != null ? !!this.loading : !!this.dataGrid?.loading) {
				if (this._hideTimer) {
					clearTimeout(this._hideTimer);
					this._hideTimer = void 0;
				}
				if (!this._visible) {
					this._visible = true;
					this._shownAt = Date.now();
					this._apply();
				}
			} else if (this._visible && !this._hideTimer) {
				const wait = Math.max(0, this.minDuration - (Date.now() - this._shownAt));
				this._hideTimer = setTimeout(() => {
					this._hideTimer = void 0;
					this._visible = false;
					this._apply();
				}, wait);
			}
		}
		/**
		* Reflect visibility + hold/release the height, from BOTH sources.
		*
		* Writes only `data-mono-loading`, this element's own state. `data-loading` is the
		* consumer's to set and is read here, never written — see `_watchAttr`.
		*/
		_apply() {
			if (monoPendingActive(this)) {
				this.toggleAttribute("data-mono-loading", false);
				this.setAttribute("aria-hidden", "false");
				return;
			}
			const on = this._visible || this.hasAttribute("data-loading");
			this.toggleAttribute("data-mono-loading", this._visible);
			this.setAttribute("aria-hidden", on ? "false" : "true");
			applyOverlayHost(this, on, {
				headVar: "--mono-table-loading-head",
				holdVar: "--mono-table-hold-loading",
				hold: "measure"
			});
		}
		/** A manual `loading` change runs the same latch / min-duration path as a controller notify. */
		updated(changed) {
			super.updated(changed);
			const pending = monoPendingActive(this);
			if (pending !== this._pendingOn) {
				this._pendingOn = pending;
				this._applyPending(pending);
			} else if (pending) this._holdPending();
			if (changed.has("loading") && this.isConnected) this._sync();
		}
		/**
		* Measure the placeholder geometry right before the render that draws it. `update()` runs
		* after every `willUpdate` — including the skeleton mixin's, which is where `pending` is
		* resolved for this pass — and before `render()`, so the template sees fresh numbers
		* without a second update cycle.
		*/
		update(changed) {
			if (monoPendingActive(this)) this._measureSkeleton();
			super.update(changed);
		}
		/** Enter / leave the pending placeholder. */
		_applyPending(on) {
			if (on) {
				this.toggleAttribute("data-mono-pending", true);
				this._apply();
				this._holdPending();
				return;
			}
			this.removeAttribute("data-mono-pending");
			releaseOverlayHost(this);
			if (this._hideTimer) clearTimeout(this._hideTimer);
			this._hideTimer = void 0;
			this._visible = false;
			this._apply();
			this._sync();
		}
		/**
		* Reserve header + N rows on the size host (the spinner's own slot, so the two never
		* hold at once) and push the resolved phantom options onto the placeholder.
		*/
		/** Rows to draw: a configured phantom `count` (element / tag / global) wins over the page size. */
		_skeletonRows() {
			const count = Number(monoPhantomOptions(this).count);
			return Number.isFinite(count) && count > 0 ? Math.round(count) : this._skeleton.rows;
		}
		_holdPending() {
			const { rowH } = this._skeleton;
			const rows = this._skeletonRows();
			applyOverlayHost(this, true, {
				headVar: "--mono-table-loading-head",
				holdVar: "--mono-table-hold-loading",
				hold: () => {
					const host = overlayHost(this);
					return `${(host ? parseFloat(host.style.getPropertyValue("--mono-table-loading-head")) || 0 : 0) + rows * rowH}px`;
				},
				measureHead: "always"
			});
			monoApplyPhantomOptions(this, this.renderRoot.querySelector("phantom-ui[mono-skeleton]"));
		}
		/**
		* Mirror the header: one placeholder cell per `<th>`, at the header's column widths
		* (as percentages, so a resize needs no re-measure), rows as tall as a header row,
		* as many rows as the page size (capped — a "show all" page falls back to 8).
		* Cheap: N `offsetWidth` reads while pending. Every branch has a fallback, so a
		* header that has not laid out yet still gets an equal split.
		*/
		_measureSkeleton() {
			const table = this.closest("table");
			const grid = this.dataGrid;
			let cols = SKELETON_FALLBACK.cols;
			let rowH = SKELETON_FALLBACK.rowH;
			if (table) {
				const ths = Array.from(table.querySelectorAll(":scope > thead th"));
				const total = table.clientWidth;
				const widths = ths.map((th) => th.offsetWidth);
				const sum = widths.reduce((a, b) => a + b, 0);
				if (total > 0 && sum > 0) cols = widths.map((w) => Math.max(2, Math.round(w / total * 1e3) / 10));
				else {
					const n = columnCount(table) || grid?.props?.().th?.length || SKELETON_FALLBACK.cols.length;
					const each = Math.round(100 / n * 10) / 10;
					cols = Array.from({ length: n }, () => each);
				}
				const first = ths[0]?.offsetHeight ?? 0;
				if (first > 0) rowH = first;
			}
			const size = grid?.pageSize ?? 0;
			const rows = grid && !grid.pageSizeAll && size > 0 && size <= 50 ? size : SKELETON_FALLBACK.rows;
			const prev = this._skeleton;
			if (prev.rowH !== rowH || prev.rows !== rows || prev.cols.length !== cols.length || prev.cols.some((c, i) => c !== cols[i])) this._skeleton = {
				cols,
				rowH,
				rows
			};
		}
		/** The pending placeholder: one measured row, repeated by phantom's `count`. */
		_renderSkeleton() {
			const { cols, rowH } = this._skeleton;
			return html`
        <div
          class="mono-table-skeleton" mono-table-skeleton
          style="padding-top: var(--mono-table-loading-head, 0px)"
        >
          <phantom-ui mono-skeleton loading count=${this._skeletonRows()} count-gap="0" loading-label="Loading rows">
            <div class="mono-table-skeleton-row" mono-table-skeleton-row style=${`height:${rowH}px`}>
              ${cols.map((pct) => html`<span
                  class="mono-table-skeleton-cell" mono-table-skeleton-cell
                  style=${`width:${pct}%`}
                ><span class="mono-table-skeleton-bar" mono-table-skeleton-bar data-shimmer-no-children></span></span>`)}
            </div>
          </phantom-ui>
        </div>
      `;
		}
		render() {
			if (monoPendingActive(this)) return this._renderSkeleton();
			return html`<span
        class="mono-table-spinner" mono-loading-spinner
        part="spinner"
        role="status"
        aria-label="Loading"
      ></span>`;
		}
	}
	__decorate([property({
		type: Number,
		attribute: "min-duration"
	})], MonoTableLoadingCoreClass.prototype, "minDuration", void 0);
	__decorate([property({
		attribute: "loading",
		converter: loadingConverter
	})], MonoTableLoadingCoreClass.prototype, "loading", void 0);
	return MonoTableLoadingCoreClass;
};
//#endregion
//#region src/components/table/mono-table-loading.shadow.ts
var MonoTableLoadingShadow = class MonoTableLoadingShadow extends MonoTableLoadingCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { host: "mono-table-loading" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTableLoadingShadow = __decorate([customElement("mono-shadow-table-loading")], MonoTableLoadingShadow);
//#endregion
//#region src/components/table/mono-table-summary-core.ts
/**
* `MonoTableSummaryCore` — render-mode-agnostic logic for `mono-table-summary`: an
* aggregate footer cell. The aggregate (type + formatting) is configured centrally
* in `monoDataGrid(data, { summary: [...] })`; this element only names which
* summary to show (`field`, optionally `type`/`name`) and renders the controller's
* formatted result, re-rendering whenever the controller notifies.
*
* A `field` with no central spec falls back to a `sum` (the controller
* auto-registers a default), so a bare `<mono-table-summary field="Price">` also
* works with zero config.
*
* No slots, no icons — light and shadow share the full `render()`.
*
* SSR-safe: `dataGrid` is undefined on the server, so it renders an empty shell.
*/
var MonoTableSummaryCore = (superClass) => {
	class MonoTableSummaryCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "summary";
		}
		/**
		* Ensure the controller knows about this cell's summary.
		*
		* EVERY element registers, even when a matching spec already exists — the
		* controller dedupes by key and refcounts, so a centrally-declared spec (with
		* its formatting) is still never overwritten by a bare element. Registering
		* only the first element is what used to break a second cell on the same
		* field: when the first unmounted it removed the shared spec, and nothing
		* re-runs registration on the survivor, so it rendered empty forever.
		*/
		_ensureSpec() {
			const grid = this.dataGrid;
			if (!grid || !this.field) return;
			const wanted = {
				field: this.field,
				type: this.type ?? "sum",
				name: this.name
			};
			const current = this._ownSpec;
			if (current && current.field === wanted.field && current.type === wanted.type && current.name === wanted.name) return;
			if (current) grid.unregisterSummary(current);
			grid.registerSummary(wanted);
			this._ownSpec = wanted;
		}
		willUpdate(changed) {
			super.willUpdate?.(changed);
			if (changed.has("dataGrid") || changed.has("field") || changed.has("type") || changed.has("name")) this._ensureSpec();
		}
		connectedCallback() {
			super.connectedCallback();
			this._ensureSpec();
		}
		disconnectedCallback() {
			if (this._ownSpec) {
				this.dataGrid?.unregisterSummary(this._ownSpec);
				this._ownSpec = void 0;
			}
			super.disconnectedCallback();
		}
		render() {
			return html`<span class="mono-table-summary" mono-table-summary>${this.field && this.dataGrid ? this.dataGrid.summaryText(this.field, this.type) : ""}</span>`;
		}
	}
	__decorate([property({ type: String })], MonoTableSummaryCoreClass.prototype, "field", void 0);
	__decorate([property({ type: String })], MonoTableSummaryCoreClass.prototype, "type", void 0);
	__decorate([property({ type: String })], MonoTableSummaryCoreClass.prototype, "name", void 0);
	return MonoTableSummaryCoreClass;
};
//#endregion
//#region src/components/table/mono-table-summary.shadow.ts
var MonoTableSummaryShadow = class MonoTableSummaryShadow extends MonoTableSummaryCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { hostDisplay: "inline" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
};
MonoTableSummaryShadow = __decorate([customElement("mono-shadow-table-summary")], MonoTableSummaryShadow);
//#endregion
//#region src/components/table/mono-table-detail-core.ts
/** Total column span of a row, so the panel cell can stretch the full width. */
function colSpanOf(row) {
	let total = 0;
	for (const cell of Array.from(row.cells)) total += cell.colSpan || 1;
	return Math.max(1, total);
}
/**
* `MonoTableDetailCore` — render-mode-agnostic logic for `mono-table-detail`, the
* expand/collapse chevron for a table row.
*
* **Shape.** The element itself is *only the toggle*: put it in a `<td>` of the
* row you want expandable and keep authoring the `<tr>` yourself. Everything
* slotted into it becomes the **panel** — a `<tr class="mono-table-detail-row" mono-detail-row>`
* with one `<td colspan="…">` that the element inserts into the `<tbody>`
* immediately after its own row while open, and pulls back out when closed. The
* `colspan` is recomputed from the parent row's cells on every attach, so it
* always spans the whole grid.
*
* ```html
* <tr :data-row-key="row.Id">
*   <td>
*     <mono-table-detail :control-table.prop="table">
*       <p>Notes: {{ row.Note }}</p>
*     </mono-table-detail>
*   </td>
*   <td>{{ row.Name }}</td>
* </tr>
* ```
*
* **Why the panel row is built imperatively.** Lit renders through a `<template>`,
* and a bare `<tr>` in a non-table parsing context is dropped by the HTML parser —
* so the row could never come out of `render()`. It is created with
* `document.createElement` instead, which also means the SAME code path serves the
* light and the shadow build: in both, the consumer's children are captured off
* the host and re-parented into the panel cell (a shadow `<slot>` could not
* project content to a row *outside* the host).
*
* **Content is real DOM the consumer owns**, captured through
* `composables/light-slots`, so Vue interpolation (`{{ row.Note }}`), `v-if`
* anchors, a whole nested `<table class="mono-table" mono-table>` with its own
* `controlMonoTable`, and further nested `<mono-table-detail>` elements all work.
* While closed, the captured nodes stay parked inside the (detached) panel cell
* rather than orphaned — a captured node with a `null` parent is what crashes
* Vue's next patch.
*
* **Accordion by default.** Opening a row closes the row that was open, scoped to
* the bound controller — so a nested grid runs its own accordion without
* disturbing the outer one. **`stay-open` is the exemption**: such a row is
* skipped by the accordion *and* by `table.detail().collapseAll()`. It is not a
* lock — its own chevron still closes it. Mark every row `stay-open` to get
* independent panels back.
*
* SSR-safe: every DOM touch is behind `isServer`, so the server renders just the
* collapsed toggle.
*/
var MonoTableDetailCore = (superClass) => {
	class MonoTableDetailCoreClass extends MonoTableControllerCore(superClass) {
		constructor(...args) {
			super(...args);
			this._propsSlot = "detail";
			this.icon = "i-mdi-chevron-right";
			this.iconExpanded = "i-mdi-chevron-down";
			this.open = false;
			this.stayOpen = false;
			this.disabled = false;
			this._slotsCaptured = false;
			this._buckets = /* @__PURE__ */ new Map();
			defineHybridPropAliases(this, ["iconExpanded", "stayOpen"]);
		}
		connectedCallback() {
			super.connectedCallback();
			if (isServer) return;
			this._captureSlots();
			this._syncRegistration();
			if (this.isConnected) this.performUpdate();
			this._refreshPanel();
		}
		disconnectedCallback() {
			this._panelRow?.parentNode?.removeChild(this._panelRow);
			this._registeredOn?.unregisterDetail?.(this);
			this._registeredOn = void 0;
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			super.willUpdate(changed);
			if (changed.has("dataGrid")) this._syncRegistration();
		}
		updated(changed) {
			super.updated?.(changed);
			this._refreshPanel();
		}
		/**
		* Bring the panel in line with the current state: build it if needed, make
		* sure the consumer's captured nodes are in it, and attach/detach the row.
		* Idempotent, so the extra call from `connectedCallback` costs nothing.
		*/
		_refreshPanel() {
			if (isServer) return;
			this._ensurePanel();
			placeLightSlots(this._panelCell, this._buckets);
			this._syncPanel();
		}
		/**
		* Shared defaults from `props: { detail }`, minus `open`.
		*
		* Every other slot lets the controller win outright, but `open` is per-element
		* state that the user toggles: re-applying it on each update cycle would undo
		* the click a microtask later and the chevron would look broken. Open/close
		* from code goes through `table.detail()` instead.
		*/
		_applyControllerProps() {
			const patch = this.dataGrid?.props?.().detail;
			if (!patch) return;
			const { open: _open, ...rest } = patch;
			applyProps(this, rest);
		}
		_captureSlots() {
			if (this._slotsCaptured) return;
			this._slotsCaptured = true;
			this._buckets = captureLightSlots(this, { names: [] });
		}
		_syncRegistration() {
			const grid = this.dataGrid;
			if (this._registeredOn === grid) return;
			this._registeredOn?.unregisterDetail?.(this);
			this._registeredOn = grid;
			grid?.registerDetail?.(this);
		}
		/** The panel row + cell, created once and reused across every toggle. */
		_ensurePanel() {
			if (this._panelRow) return;
			const row = document.createElement("tr");
			row.className = "mono-table-detail-row";
			row.setAttribute("mono-detail-row", "");
			row.setAttribute("data-mono-detail-row", "");
			const cell = document.createElement("td");
			cell.className = "mono-table-detail-cell";
			const panel = document.createElement("div");
			panel.className = "mono-table-detail-panel";
			panel.setAttribute("data-mono-slot", "default");
			cell.appendChild(panel);
			row.appendChild(cell);
			this._panelRow = row;
			this._panelCell = cell;
		}
		/** The row this toggle belongs to (`null` outside a table). */
		get _row() {
			return this.closest("tr");
		}
		/** Attach the panel row after our own row while open; detach it while closed. */
		_syncPanel() {
			const row = this._panelRow;
			if (!row) return;
			const parent = this._row;
			const container = parent?.parentNode;
			if (!this.open || !parent || !container) {
				row.parentNode?.removeChild(row);
				return;
			}
			const cell = this._panelCell;
			const span = colSpanOf(parent);
			if (cell.colSpan !== span) cell.colSpan = span;
			if (!this._isPlaced(parent, row)) container.insertBefore(row, this._anchorAfter(parent));
		}
		/** Already sitting in this row's own run of detail rows? */
		_isPlaced(parent, row) {
			if (row.parentNode !== parent.parentNode) return false;
			let el = parent.nextElementSibling;
			while (el) {
				if (el === row) return true;
				if (!el.hasAttribute("data-mono-detail-row")) return false;
				el = el.nextElementSibling;
			}
			return false;
		}
		/** Insert point: after the row, past any detail rows a sibling toggle opened. */
		_anchorAfter(parent) {
			let last = parent;
			let el = parent.nextElementSibling;
			while (el && el.hasAttribute("data-mono-detail-row")) {
				last = el;
				el = el.nextElementSibling;
			}
			return last.nextSibling;
		}
		/**
		* Open, close, or flip the panel. Emits `toggle` (historically `mno-click`,
		* kept) and then `open` / `close`, exactly like a tap on the chevron.
		*/
		toggle(force, sourceEvent) {
			if (this.disabled) return;
			const next = force === void 0 ? !this.open : force;
			if (next === this.open) return;
			this.open = next;
			if (next) this.dataGrid?.detail?.().collapseOthers?.(this);
			const detail = {
				open: next,
				rowKey: this._row?.getAttribute("data-row-key") ?? null,
				sourceEvent
			};
			dispatchMonoEvent(this, "click", detail, { alias: "toggle" });
			dispatchMonoEvent(this, next ? "open" : "close", detail);
		}
		_handleClick(event) {
			event.stopPropagation();
			this.toggle(void 0, event);
		}
		/**
		* The chevron. The light build overrides nothing (global icon classes); the
		* shadow build swaps in inline SVG, which page-level utility CSS can't reach.
		*/
		_renderIcon() {
			return html`<span class="mono-icon ${this.open ? this.iconExpanded : this.icon}" aria-hidden="true"></span>`;
		}
		render() {
			return html`
        <button
          type="button"
          class="mono-table-detail-toggle" mono-detail-toggle
          part="toggle"
          ?disabled=${this.disabled}
          aria-expanded=${this.open ? "true" : "false"}
          aria-label=${this.label ?? "Toggle details"}
          @click=${this._handleClick}
        >
          ${this._renderIcon()}
        </button>
      `;
		}
	}
	__decorate([property({ type: String })], MonoTableDetailCoreClass.prototype, "icon", void 0);
	__decorate([property({
		type: String,
		attribute: "icon-expanded"
	})], MonoTableDetailCoreClass.prototype, "iconExpanded", void 0);
	__decorate([property({
		converter: booleanStringConverter,
		reflect: true
	})], MonoTableDetailCoreClass.prototype, "open", void 0);
	__decorate([property({
		converter: booleanStringConverter,
		attribute: "stay-open"
	})], MonoTableDetailCoreClass.prototype, "stayOpen", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoTableDetailCoreClass.prototype, "disabled", void 0);
	__decorate([property({ type: String })], MonoTableDetailCoreClass.prototype, "label", void 0);
	return MonoTableDetailCoreClass;
};
//#endregion
//#region src/components/table/mono-table-detail.shadow.ts
/** Whether a prop still holds the value the core defaults it to. */
var DEFAULT_ICON = "i-mdi-chevron-right";
var DEFAULT_ICON_EXPANDED = "i-mdi-chevron-down";
var MonoTableDetailShadow = class MonoTableDetailShadow extends MonoTableDetailCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(table_default, { host: "mono-table-detail" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
		this._maybeAdoptIcons();
	}
	updated(changed) {
		super.updated(changed);
		if (!isServer && (changed.has("icon") || changed.has("iconExpanded"))) this._maybeAdoptIcons();
	}
	/** Only when a CUSTOM class is in play — the defaults are inlined SVG. */
	_maybeAdoptIcons() {
		if (isServer) return;
		if (this.icon === DEFAULT_ICON && this.iconExpanded === DEFAULT_ICON_EXPANDED) return;
		adoptIconStyles(this.renderRoot);
	}
	_renderIcon() {
		if (this.icon !== DEFAULT_ICON || this.iconExpanded !== DEFAULT_ICON_EXPANDED) return super._renderIcon();
		return this.open ? html`
          <svg
            class="mono-table-detail-caret" mono-detail-caret
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6l-6-6z" />
          </svg>
        ` : html`
          <svg
            class="mono-table-detail-caret" mono-detail-caret
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8.59 16.58L13.17 12L8.59 7.41L10 6l6 6l-6 6z" />
          </svg>
        `;
	}
};
MonoTableDetailShadow = __decorate([customElement("mono-shadow-table-detail")], MonoTableDetailShadow);
//#endregion
//#region src/components/table/mono-table-checkbox-core.ts
/**
* `MonoTableCheckboxCore` — render-mode-agnostic logic for `mono-table-checkbox`,
* a checkbox that knows about the grid.
*
* Two jobs, chosen with `type`:
* - **`type="single"`** (default) — one row's checkbox. Give it the row with
*   `:item.prop="row"`; it reads and writes `table.check()`.
* - **`type="all"`** — the select-all. In `mode="all"` (default) checking it
*   drains the SOURCE in `chunk`-sized requests and selects every row the active
*   search/filter matches — including rows never fetched for display, which is the
*   point of the component. `mode="per-page"` selects the loaded page with no
*   request at all. **Every checkbox on the grid is disabled while a drain runs**
*   (the selection is still filling in), but only the select-all shows the spinner.
*
* ```html
* <th><mono-table-checkbox type="all" :control-table.prop="table" key-value="Id" /></th>
* <td><mono-table-checkbox :control-table.prop="table" :item.prop="row" /></td>
* ```
*
* The `<th>` one canNOT render the `<td>` ones — the library never renders your
* `<tbody>` — so both are declared; the row one needs only `:item.prop`.
*
* **It renders `mono-checkbox`'s markup and classes rather than embedding the
* element**, so `size` / `color` / `disabled` / `label` behave identically and the
* whole size × color matrix comes from `checkbox.css`. Same trade `mono-table-search`
* makes with `mono-input` — and embedding a light `<mono-*>` inside another light
* component would steal the parent's Lit-rendered children.
*
* SSR-safe: the controller is undefined on the server, so it renders an unchecked
* shell and touches no DOM.
*/
var MonoTableCheckboxCore = (superClass) => {
	class MonoTableCheckboxCoreClass extends MonoTableControllerCore(superClass) {
		constructor(...args) {
			super(...args);
			this._propsSlot = "checkbox";
			this.type = "single";
			this.mode = "all";
			this.chunk = 100;
			this.size = "md";
			this.color = "primary";
			this.disabled = false;
			this.label = "";
			this.sublabel = "";
			this.cssClass = {};
			this.cssClassName = "";
			defineHybridPropAliases(this, [
				"keyValue",
				"ariaLabelText",
				"cssClass"
			]);
			defineHybridPropAlias(this, "description", "sublabel");
		}
		static get observedAttributes() {
			return [...super.observedAttributes ?? [], "description"];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (name === "description" && oldValue !== newValue) this.sublabel = newValue ?? "";
		}
		/** `keyValue` as a list — an attribute may hold JSON or a comma list. */
		get _keys() {
			const raw = this.keyValue;
			if (raw == null || raw === "") return void 0;
			if (Array.isArray(raw)) return raw;
			const text = String(raw).trim();
			if (text.startsWith("[")) try {
				const parsed = JSON.parse(text);
				if (Array.isArray(parsed)) return parsed;
			} catch {}
			return text.includes(",") ? text.split(",").map((s) => s.trim()).filter(Boolean) : [text];
		}
		/**
		* Push this element's config onto the shared selection state, so declaring
		* `key-value` once (on the select-all, or in `props.checkbox`) covers every
		* row checkbox. Undefined values are skipped by `configure`.
		*/
		_syncConfig() {
			this.dataGrid?.check?.().configure({
				keyValue: this._keys,
				mode: this.mode,
				chunk: this.chunk
			});
		}
		update(changed) {
			this._syncConfig();
			super.update(changed);
		}
		updated(changed) {
			super.updated?.(changed);
			if (isServer || this.type !== "single") return;
			const row = this.closest("tr");
			row?.classList.toggle("mono-table-row-selected", this._checked);
			if (this._checked) row?.setAttribute("mono-selected", "");
			else row?.removeAttribute("mono-selected");
		}
		/** Whether this box is ticked right now. */
		get _checked() {
			const check = this.dataGrid?.check?.();
			if (!check) return false;
			if (this.type === "all") return check.allChecked;
			return this.item == null ? false : check.isChecked(this.item);
		}
		/** The select-all shows mixed while only some rows are ticked. */
		get _indeterminate() {
			if (this.type !== "all") return false;
			return this.dataGrid?.check?.().someChecked ?? false;
		}
		/**
		* A `mode="all"` drain is running.
		*
		* **Every** checkbox bound to the grid goes inert while it lands, not just
		* the select-all that started it: the selection is still filling in, so a row
		* ticked mid-drain would be overwritten (or fight) the rows arriving behind
		* it. They all re-render because each one subscribes to the controller, and
		* the drain notifies on entry and exit.
		*/
		get _pending() {
			return this.dataGrid?.check?.().pending ?? false;
		}
		/**
		* Whether THIS box shows the spinner. Only the select-all does: it is the one
		* the user acted on, and eight rows spinning in sympathy reads as eight
		* separate operations rather than one. The rows still go disabled — they are
		* just quietly inert.
		*/
		get _loading() {
			return this.type === "all" && this._pending;
		}
		get _isDisabled() {
			return this.disabled || this._pending;
		}
		_handleChange(event) {
			const input = event.target;
			const checked = input.checked;
			const check = this.dataGrid?.check?.();
			if (!check) {
				input.checked = false;
				return;
			}
			if (this.type === "all") if (!checked) check.clear();
			else if (this.mode === "per-page") check.selectPage();
			else check.selectAll();
			else if (this.item != null) check.toggle(this.item, checked);
			const actual = check.pending ? checked : this._checked;
			if (input.checked !== actual) input.checked = actual;
			dispatchMonoEvent(this, "change", {
				checked: actual,
				item: this.type === "all" ? null : this.item ?? null,
				count: check.count()
			}, { sourceEvent: event });
			this.requestUpdate();
		}
		/** `mono-checkbox`'s class recipe, so one stylesheet drives both elements. */
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _wrapperClasses() {
			return [
				"mono-checkbox",
				"mono-table-checkbox",
				this.color,
				this._loading ? "is-loading" : "",
				this._isDisabled ? "disabled" : "",
				this._checked ? "mono-checkbox-checked" : "",
				this._indeterminate ? "mono-checkbox-indeterminate" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		_renderLabelBlock() {
			if (!this.label && !this.sublabel) return nothing;
			return html`
        <span class=${this._cls("mono-checkbox-label", "label")} mono-label>
          ${this.label ? html`<span class=${this._cls("mono-checkbox-label-text", "labelText")} mono-label-text>${this.label}</span>` : nothing}
          ${this.sublabel ? html`<span class=${this._cls("mono-checkbox-description", "description")} mono-description>${this.sublabel}</span>` : nothing}
        </span>
      `;
		}
		/**
		* The mid-drain spinner. Light uses the global icon utility class; the shadow
		* build overrides this with inline SVG, which page-level CSS can't reach.
		*/
		_renderLoadingIcon() {
			return html`<span class="mono-icon i-mdi-loading mono-table-checkbox-spinner" aria-hidden="true"></span>`;
		}
		render() {
			const checked = this._checked;
			const indeterminate = this._indeterminate;
			const loading = this._loading;
			const boxClasses = [
				this._cls("mono-checkbox-box", "box"),
				this.size,
				loading ? "has-custom-icon has-custom-indeterminate-icon" : ""
			].filter(Boolean).join(" ");
			const ariaLabel = this.ariaLabelText || this.label || (this.type === "all" ? "Select all rows" : "Select row");
			return html`
        <label
          class=${this._wrapperClasses}
          mono-checkbox
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          ?mono-checked=${checked}
          ?mono-indeterminate=${indeterminate}
          ?mono-disabled=${this._isDisabled}
          ?mono-loading=${loading}
        >
          <input
            class=${this._cls("mono-checkbox-input", "input")}
            mono-input
            type="checkbox"
            .checked=${checked}
            .indeterminate=${indeterminate}
            ?disabled=${this._isDisabled}
            aria-checked=${indeterminate ? "mixed" : String(checked)}
            aria-label=${ifDefined(ariaLabel)}
            aria-busy=${this._pending ? "true" : "false"}
            @change=${this._handleChange}
          />

          <span
            class=${boxClasses}
            mono-box
            ?mono-custom-icon=${loading}
            ?mono-custom-indeterminate-icon=${loading}
            aria-hidden="true"
          >
            ${loading ? this._renderLoadingIcon() : nothing}
          </span>

          ${this._renderLabelBlock()}
        </label>
      `;
		}
	}
	__decorate([property({ type: String })], MonoTableCheckboxCoreClass.prototype, "type", void 0);
	__decorate([property({ attribute: false })], MonoTableCheckboxCoreClass.prototype, "item", void 0);
	__decorate([property({ attribute: "key-value" })], MonoTableCheckboxCoreClass.prototype, "keyValue", void 0);
	__decorate([property({ type: String })], MonoTableCheckboxCoreClass.prototype, "mode", void 0);
	__decorate([property({ type: Number })], MonoTableCheckboxCoreClass.prototype, "chunk", void 0);
	__decorate([property({ type: String })], MonoTableCheckboxCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoTableCheckboxCoreClass.prototype, "color", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoTableCheckboxCoreClass.prototype, "disabled", void 0);
	__decorate([property({ type: String })], MonoTableCheckboxCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoTableCheckboxCoreClass.prototype, "sublabel", void 0);
	__decorate([property({ attribute: "aria-label-text" })], MonoTableCheckboxCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({ attribute: false })], MonoTableCheckboxCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: "css-class" })], MonoTableCheckboxCoreClass.prototype, "cssClassName", void 0);
	return MonoTableCheckboxCoreClass;
};
//#endregion
//#region src/components/table/mono-table-checkbox.shadow.ts
var MonoTableCheckboxShadow = class MonoTableCheckboxShadow extends MonoTableCheckboxCore(LitElement) {
	static {
		this.styles = [unsafeCSS(toShadowCss(checkbox_default)), unsafeCSS(toShadowCss(table_default))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	/**
	* `mdi:loading` inlined — a shadow root can't reach the page's `i-mdi-*`
	* utility CSS, so the light build's icon class would render nothing here.
	* `fill="currentColor"` keeps it on the box's own icon colour, and the spin
	* comes from the adopted `checkbox.css` (`[mono-spinner]`), like the box itself.
	*/
	_renderLoadingIcon() {
		return html`
      <svg
        class="mono-table-checkbox-spinner"
        mono-spinner
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8" />
      </svg>
    `;
	}
};
MonoTableCheckboxShadow = __decorate([customElement("mono-shadow-table-checkbox")], MonoTableCheckboxShadow);
//#endregion
export { DEFAULT_ERROR_MESSAGES, MonoTableCheckboxCore, MonoTableCheckboxShadow, MonoTableControllerCore, MonoTableDetailCore, MonoTableDetailShadow, MonoTableEmptyCore, MonoTableEmptyShadow, MonoTableErrorCore, MonoTableErrorShadow, MonoTableInfoCore, MonoTableInfoShadow, MonoTableLoadingCore, MonoTableLoadingShadow, MonoTablePageSizeCore, MonoTablePageSizeShadow, MonoTablePagingCore, MonoTablePagingGroupCore, MonoTablePagingGroupShadow, MonoTablePagingShadow, MonoTableSearchCore, MonoTableSearchShadow, MonoTableSortCore, MonoTableSortShadow, MonoTableSummaryCore, MonoTableSummaryShadow, MonoTableThCore, MonoTableThShadow, buildGroups, collectGroupPaths, describeError, errorStatus, expandWildcard, flattenLeaves, isGroupNode, isWildcardPattern, monoArraySource, monoDataGrid, normalizeError, normalizeSearchExpr, plainSearchColumns, resolveErrorMessages, resolveSearchEntries, setErrorMessages };
