import { a as parseFieldPath, c as toODataClause, l as toODataSelector, n as isPath, r as mergePatch, s as setFieldValue, t as getFieldValue } from "../field-path-BabiMrrA.js";
import { a as buildGroups, c as isGroupNode, o as collectGroupPaths, s as flattenLeaves } from "../data-source-read-FxqzQkk2.js";
import { A as resolveSearchEntries, D as isWildcardPattern, O as normalizeSearchExpr, c as resolveErrorMessages, h as mergeSearchFields, k as plainSearchColumns, l as setErrorMessages, n as describeError, r as errorStatus, s as normalizeError, t as DEFAULT_ERROR_MESSAGES, w as expandWildcard } from "../normalize-error-D93O4q8g.js";
import { h as monoArraySource } from "../data-source-options-Ky5ZGbc8.js";
import { a as seedFromRanges, i as minimize, n as buildDateTree, o as setAllChecked, r as checkState, s as setChecked, t as monoDataGrid } from "../mono-data-grid-BdVhuMZo.js";
import { _ as monoHostChildren, b as monoPhantomOptions, d as buildSizeStyle, h as monoApplyPhantomOptions, l as ColumnAutoSize, s as startMonoSizeAttributes, u as cssLengthToPx, v as monoPendingActive, y as monoPendingGrace } from "../mono-ui-CK5wNw-7.js";
import { n as detachEventHandlers, t as applyProps } from "../element-props-xvw0EB7H.js";
import { t as customElement } from "../mono-element-BP0RKeDD.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, o as numberStringConverter, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { t as isIconifyClass } from "../icon-ClxnYhBG.js";
import { n as bucketHasContent, o as placeLightSlots, r as captureLightSlots, s as placeSlotNode } from "../light-slots-RAAINrYd.js";
import { t as PopupPortalController } from "../popup-portal-C8ttHDRX.js";
import { n as cssPart } from "../css-class-B6Tc_MAx.js";
import { LitElement, html, isServer, nothing } from "lit";
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
const MonoTableControllerCore = (superClass) => {
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
const MonoTableSearchCore = (superClass) => {
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
//#region src/components/table/mono-table-search.ts
let MonoTableSearch = class MonoTableSearch extends MonoTableSearchCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._filterSlots = [];
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureFilterSlot();
		if (this.isConnected) this.performUpdate();
	}
	_captureFilterSlot() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = [];
		for (const node of monoHostChildren(this)) if (node.getAttribute("slot") === "filter-builder") {
			node.removeAttribute("slot");
			captured.push(node);
		}
		for (const node of captured) if (node.parentNode === this) this.removeChild(node);
		this._filterSlots = captured;
		this._setFilterSlotted(captured.length > 0);
	}
	updated(changed) {
		super.updated(changed);
		const sel = "[data-mono-slot=\"filter-builder\"]";
		const target = this.querySelector(sel) ?? this._filterPanelRoot()?.querySelector?.(sel) ?? null;
		if (target) for (const node of this._filterSlots) placeSlotNode(target, node);
	}
	renderIcon(name) {
		if (name === "close") return html`<span class="mono-icon i-mdi-close" aria-hidden="true"></span>`;
		if (name === "chevron") return html`<span class="mono-icon i-mdi-chevron-down" aria-hidden="true"></span>`;
		return html`<span class="mono-icon i-mdi-magnify"></span>`;
	}
};
MonoTableSearch = __decorate([customElement("mono-table-search")], MonoTableSearch);

//#endregion
//#region src/components/table/mono-table-paging-core.ts
/** Defaults the shadow build tests against before swapping in its inline SVG. */
const DEFAULT_PREV_ICON = "i-mdi-chevron-left";
const DEFAULT_NEXT_ICON = "i-mdi-chevron-right";
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
const SCROLL_HOSTS = ".mono-table-scroll, [mono-table-scroll], [mono-dd-region=\"body\"], .mono-dropdown-table-region.body";
const DD_PANEL = "[mono-dd-panel], .mono-dropdown-table-panel";
const DD_BODY = "[mono-dd-region=\"body\"], .mono-dropdown-table-region.body";
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
const MonoTablePagingCore = (superClass) => {
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
			const first = Math.floor(el.scrollTop / rh);
			const last = Math.ceil((el.scrollTop + el.clientHeight) / rh);
			const stride = Math.max(1, over);
			let start = Math.floor(first / stride) * stride - over;
			let end = Math.ceil(last / stride) * stride + over;
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
			const set = /* @__PURE__ */ new Set([1, total]);
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
//#region src/components/table/mono-table-paging.ts
let MonoTablePaging = class MonoTablePaging extends MonoTablePagingCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTablePaging = __decorate([customElement("mono-table-paging")], MonoTablePaging);

//#endregion
//#region src/components/table/mono-table-paging-group-core.ts
/**
* `MonoTablePagingGroupCore` — render-mode-agnostic logic for
* `mono-table-paging-group`: paginates the rows inside ONE group. Extends the
* controller base with group-paging registration on connect / disconnect /
* group-path change. No slots, no icons — light and shadow share `render()`.
*/
const MonoTablePagingGroupCore = (superClass) => {
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
			const set = /* @__PURE__ */ new Set([1, total]);
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
//#region src/components/table/mono-table-paging-group.ts
let MonoTablePagingGroup = class MonoTablePagingGroup extends MonoTablePagingGroupCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTablePagingGroup = __decorate([customElement("mono-table-paging-group")], MonoTablePagingGroup);

//#endregion
//#region src/components/table/mono-table-page-size-core.ts
/**
* `MonoTablePageSizeCore` — render-mode-agnostic logic for `mono-table-page-size`:
* a native `<select>` of page-size options wired to the controller. No slots, no
* icons — light and shadow share the full `render()`.
*/
const MonoTablePageSizeCore = (superClass) => {
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
//#region src/components/table/mono-table-page-size.ts
let MonoTablePageSize = class MonoTablePageSize extends MonoTablePageSizeCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTablePageSize = __decorate([customElement("mono-table-page-size")], MonoTablePageSize);

//#endregion
//#region src/components/table/mono-table-info-core.ts
/**
* `MonoTableInfoCore` — render-mode-agnostic logic for `mono-table-info`: a
* read-only summary line (`Showing {from}–{to} of {total}`) driven by the
* controller. No slots, no icons — light and shadow share the full `render()`.
*/
const MonoTableInfoCore = (superClass) => {
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
			const text = this.template.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total)).replace("{page}", String(pageIndex + 1)).replace("{pages}", String(grid?.pageCount ?? 1));
			return html`<span class="mono-table-info" mono-table-info>${text}</span>`;
		}
	}
	__decorate([property({ type: String })], MonoTableInfoCoreClass.prototype, "template", void 0);
	return MonoTableInfoCoreClass;
};

//#endregion
//#region src/components/table/mono-table-info.ts
let MonoTableInfo = class MonoTableInfo extends MonoTableInfoCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableInfo = __decorate([customElement("mono-table-info")], MonoTableInfo);

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
const MonoTableMenuCore = (superClass) => {
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
const MonoTableSortCore = (superClass) => {
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
//#region src/components/table/mono-table-sort.ts
let MonoTableSort = class MonoTableSort extends MonoTableSortCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._buckets = /* @__PURE__ */ new Map();
		this._slotsCaptured = false;
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		if (!this.caption) this._placeSlot("label", this._buckets.get("default") ?? []);
	}
	renderSlot(_name) {
		return html``;
	}
	renderIcon(_name) {
		const cls = this._current === "asc" ? "i-ri-arrow-up-long-fill" : this._current === "desc" ? "i-ri-arrow-down-long-fill" : "i-fluent-arrow-sort-16-filled";
		return html`<span class="mono-table-sort-caret ${cls}" mono-sort-caret></span>`;
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, { names: [] });
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoTableSort = __decorate([customElement("mono-table-sort")], MonoTableSort);

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
const MonoTableThCore = (superClass) => {
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
			this._lastLoaded = 0;
			this._seededSort = false;
			this._filterOpen = false;
			this._values = [];
			this._checked = /* @__PURE__ */ new Set();
			this._valuesLoading = false;
			this._valuesError = false;
			this._search = "";
			this._fromIcon = false;
			defineHybridPropAliases(this, [
				"editableTrigger",
				"minWidth",
				"maxWidth"
			]);
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
			if (!isServer) startMonoSizeAttributes();
		}
		disconnectedCallback() {
			this.dataGrid?.unregisterColumn(this);
			this._autoSize?.stop();
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
		/**
		* `width="auto"` → hand the column to the auto-sizer (re-run on every update: each controller
		* notify lands here). A fixed width → written as before, and an auto-sizer left over from an
		* earlier `'auto'` is stopped with its px cleared. The bounds go onto the cell either way —
		* the auto-sizer clamps with them, an auto-layout table honours them.
		*/
		_syncWidth(cell) {
			if (String(this.width ?? "").trim().toLowerCase() === "auto") {
				const sizer = this._autoSize ??= new ColumnAutoSize(this);
				sizer.min = cssLengthToPx(this.minWidth ?? null, cell);
				sizer.max = cssLengthToPx(this.maxWidth ?? null, cell);
				const grid = this.dataGrid;
				sizer.growOnly = grid?.scrollMode === "virtual";
				const loaded = grid?.loadedCount ?? 0;
				if (loaded < this._lastLoaded) sizer.resetFloor();
				this._lastLoaded = loaded;
				sizer.schedule();
			} else {
				if (this._autoSize) {
					this._autoSize.stop(true);
					this._autoSize = void 0;
				}
				if (this.width != null && this.width !== "") cell.style.width = toCssSize(this.width);
			}
			cell.style.minWidth = this.minWidth != null && this.minWidth !== "" ? toCssSize(this.minWidth) : "";
			cell.style.maxWidth = this.maxWidth != null && this.maxWidth !== "" ? toCssSize(this.maxWidth) : "";
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
				this._syncWidth(cell);
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
	__decorate([property({ attribute: "min-width" })], MonoTableThCoreClass.prototype, "minWidth", void 0);
	__decorate([property({ attribute: "max-width" })], MonoTableThCoreClass.prototype, "maxWidth", void 0);
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
//#region src/components/table/mono-table-th.ts
let MonoTableTh = class MonoTableTh extends MonoTableThCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._buckets = /* @__PURE__ */ new Map();
		this._slotsCaptured = false;
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		if (!this.caption) this._placeSlot("label", this._buckets.get("default") ?? []);
	}
	renderSlot(_name) {
		return html``;
	}
	renderIcon(name) {
		if (name === "funnel") {
			const cls = this._filtered ? "i-mdi-filter" : "i-mdi-filter-outline";
			return html`<span class="mono-th-filter-glyph ${cls}" mono-th-filter-glyph></span>`;
		}
		const cls = this._current === "asc" ? "i-ri-arrow-up-long-fill" : this._current === "desc" ? "i-ri-arrow-down-long-fill" : "i-fluent-arrow-sort-16-filled";
		return html`<span class="mono-table-sort-caret ${cls}" mono-sort-caret></span>`;
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, { names: [] });
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoTableTh = __decorate([customElement("mono-table-th")], MonoTableTh);

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
const HOLD_PREFIX = "--mono-table-hold-";
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
const applied = /* @__PURE__ */ new WeakMap();
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
const DEFAULT_ICON = "i-mdi-help-circle-outline";
const DEFAULT_TITLE = "No Data found";
const DEFAULT_SUBTITLE = "Try adjusting your search or filters.";
/** Fallback when `--mono-table-empty-min-h` resolves to nothing. */
const DEFAULT_MIN_HEIGHT = "12rem";
/** Breathing room left under the message when its own height sets the reserve. */
const TAIL_GAP = 16;
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
const MonoTableEmptyCore = (superClass) => {
	class MonoTableEmptyCoreClass extends MonoTableControllerCore(superClass) {
		constructor(..._args) {
			super(..._args);
			this._propsSlot = "empty";
			this.icon = DEFAULT_ICON;
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
//#region src/components/table/mono-table-empty.ts
/** The one named region. Everything unnamed falls into the default bucket. */
const EMPTY_NAMED_SLOTS = ["body"];
let MonoTableEmpty = class MonoTableEmpty extends MonoTableEmptyCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._buckets = /* @__PURE__ */ new Map();
		this._slotsCaptured = false;
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		this._captureSlots();
		super.connectedCallback();
		if (this.isConnected) this.performUpdate();
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		this._buckets = captureLightSlots(this, { names: EMPTY_NAMED_SLOTS });
		this._hasBodySlot = bucketHasContent(this._buckets.get("body"));
	}
	updated(changed) {
		super.updated(changed);
		placeLightSlots(this, this._buckets);
	}
};
MonoTableEmpty = __decorate([customElement("mono-table-empty")], MonoTableEmpty);

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
const MonoTableErrorCore = (superClass) => {
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
//#region src/components/table/mono-table-error.ts
let MonoTableError = class MonoTableError extends MonoTableErrorCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableError = __decorate([customElement("mono-table-error")], MonoTableError);

//#endregion
//#region src/components/table/mono-table-loading-core.ts
const SKELETON_FALLBACK = {
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
const loadingConverter = { fromAttribute(value) {
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
const MonoTableLoadingCore = (superClass) => {
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
			const rows = this._skeletonRows();
			return html`
        <div
          class="mono-table-skeleton" mono-table-skeleton
          style="padding-top: var(--mono-table-loading-head, 0px)"
        >
          <phantom-ui mono-skeleton loading count=${rows} count-gap="0" loading-label="Loading rows">
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
//#region src/components/table/mono-table-loading.ts
let MonoTableLoading = class MonoTableLoading extends MonoTableLoadingCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableLoading = __decorate([customElement("mono-table-loading")], MonoTableLoading);

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
const MonoTableSummaryCore = (superClass) => {
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
			const text = this.field && this.dataGrid ? this.dataGrid.summaryText(this.field, this.type) : "";
			return html`<span class="mono-table-summary" mono-table-summary>${text}</span>`;
		}
	}
	__decorate([property({ type: String })], MonoTableSummaryCoreClass.prototype, "field", void 0);
	__decorate([property({ type: String })], MonoTableSummaryCoreClass.prototype, "type", void 0);
	__decorate([property({ type: String })], MonoTableSummaryCoreClass.prototype, "name", void 0);
	return MonoTableSummaryCoreClass;
};

//#endregion
//#region src/components/table/mono-table-summary.ts
let MonoTableSummary = class MonoTableSummary extends MonoTableSummaryCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableSummary = __decorate([customElement("mono-table-summary")], MonoTableSummary);

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
const MonoTableDetailCore = (superClass) => {
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
			const cls = this.open ? this.iconExpanded : this.icon;
			return html`<span class="mono-icon ${cls}" aria-hidden="true"></span>`;
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
//#region src/components/table/mono-table-detail.ts
let MonoTableDetail = class MonoTableDetail extends MonoTableDetailCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableDetail = __decorate([customElement("mono-table-detail")], MonoTableDetail);

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
const MonoTableCheckboxCore = (superClass) => {
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
			if (this.type === "all") {
				if (!checked) check.clear();
				else if (this.mode === "per-page") check.selectPage();
				else check.selectAll();
			} else if (this.item != null) check.toggle(this.item, checked);
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
//#region src/components/table/mono-table-checkbox.ts
let MonoTableCheckbox = class MonoTableCheckbox extends MonoTableCheckboxCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableCheckbox = __decorate([customElement("mono-table-checkbox")], MonoTableCheckbox);

//#endregion
export { DEFAULT_ERROR_MESSAGES, MonoTableCheckbox, MonoTableDetail, MonoTableEmpty, MonoTableError, MonoTableInfo, MonoTableLoading, MonoTablePageSize, MonoTablePaging, MonoTablePagingGroup, MonoTableSearch, MonoTableSort, MonoTableSummary, MonoTableTh, buildGroups, collectGroupPaths, monoDataGrid as controlMonoTable, monoDataGrid, describeError, errorStatus, expandWildcard, flattenLeaves, getFieldValue, isGroupNode, isPath, isWildcardPattern, mergePatch, monoArraySource, normalizeError, normalizeSearchExpr, parseFieldPath, plainSearchColumns, resolveErrorMessages, resolveSearchEntries, setErrorMessages, setFieldValue, toODataClause, toODataSelector };