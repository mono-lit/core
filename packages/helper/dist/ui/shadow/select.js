import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, o as arrayHasChanged, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as toCssSize, t as buildSizeStyle } from "../../css-size-DhHSVZJK.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { t as PopupPortalController } from "../../popup-portal-BziRX1yG.js";
import { a as rateLimitHasChanged } from "../../rate-limit-BBa2PO79.js";
import { t as getFieldValue } from "../../field-path-C92eGLg3.js";
import { a as MonoSourceSearch, c as searchRowPredicate, n as unwrapReactive, s as resolveSearchFields } from "../../reactive-BHsqVjRh.js";
import { t as LateSlotWatcher } from "../../light-slots-BVJwyg_2.js";
import { t as DataSourceController } from "../../data-source-controller-C50Qyfzh.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/select/select-core.ts
/**
* `MonoSelectCore` — render-mode-agnostic logic for `mono-select` (props, hybrid
* aliases, value/model sync, DataSource paging, search, grouping, keyboard nav,
* the popup controller, and the full `render()`). SSR-safe: every `document` /
* `window` / focus access is `isServer`-guarded.
*
* Each build supplies `createRenderRoot()` + `static styles`, the slot strategy
* (light captures children into `data-mono-slot` placeholders; shadow uses native
* `<slot>` + a `firstUpdated` scan), and the `_slotOutlet` / `renderIcon` hooks.
* The shared `_has*SlotState` `@state` fields back both strategies.
*/
var MonoSelectCore = (superClass) => {
	class MonoSelectCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.modelValue = null;
			this.value = null;
			this.name = "";
			this.label = "";
			this.placeholder = "Select option";
			this.helperText = "";
			this.validationState = "default";
			this.validationMessage = "";
			this.errorMessage = "";
			this.successMessage = "";
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.clearable = false;
			this.items = [];
			this.dataSource = null;
			this.immediate = true;
			this.pageSize = 10;
			this.dropdownHeight = "";
			this.dropdownMaxHeight = "";
			this.flip = true;
			this.shift = true;
			this.keyValue = "";
			this.displayValue = "";
			this.displayGroup = [];
			this.groupKey = "key";
			this.groupItems = "items";
			this.group = false;
			this.groupSticky = false;
			this.searchable = false;
			this.stayOpen = false;
			this.searchValue = "";
			this.searchOperation = "contains";
			this.searchDebounce = 300;
			this.searchPlaceholder = "";
			this.cssClass = {};
			this.cssClassName = "";
			this._open = false;
			this._query = "";
			this._searchActive = false;
			this._activeIndex = -1;
			this._cursorPending = false;
			this._sourceSearch = new MonoSourceSearch();
			this._searchVersion = 0;
			this._scrollAutoMaxHeight = "";
			this._hasLabelSlotState = false;
			this._hasHelperSlotState = false;
			this._hasPrefixSlotState = false;
			this._hasSuffixSlotState = false;
			this._hasListSlotState = false;
			this._popup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-select-dropdown"),
				getAnchor: () => this.renderRoot.querySelector(".mono-select-trigger"),
				getStyleScope: () => this.renderRoot.querySelector(".mono-select"),
				isOpen: () => this._open,
				matchWidth: () => !toCssSize(this.dropdown?.width),
				offset: () => 6,
				flip: () => this.flip,
				shift: () => this.shift,
				constrainSize: () => true
			});
			this._selectId = `mono-select-${Math.random().toString(36).slice(2)}`;
			this._messageId = `${this._selectId}-message`;
			this._listboxId = `${this._selectId}-listbox`;
			this._lateListSlot = new LateSlotWatcher(this, "list", () => this._onLateListSlot());
			this._docListenersBound = false;
			this._itemsEpoch = 0;
			this._handleDropdownScroll = (event) => {
				if (this._loadMoreMode !== "scroll") return;
				if (this._ds.loadingMore || this._ds.atLastPage) return;
				const el = event.currentTarget;
				if (!el) return;
				if (el.scrollHeight - el.scrollTop - el.clientHeight <= 24) this._ds.loadMore();
			};
			this._handleDocumentClick = (event) => {
				if (!this._open || this.stayOpen) return;
				const path = event.composedPath();
				if (path.includes(this) || this._popup.containsInPath(path)) return;
				this._close();
			};
			this._handleDocumentFocusIn = (event) => {
				if (!this._open || this.stayOpen) return;
				const path = event.composedPath();
				if (path.includes(this) || this._popup.containsInPath(path)) return;
				this._close();
			};
			this._handleDocumentKeydown = (event) => {
				if (!this._open) return;
				if (event.key === "Escape") {
					event.preventDefault();
					this._close();
					this._triggerEl?.focus();
				}
			};
			this._publishedEntries = [];
			this._onListSlotClick = (event) => {
				if (this.disabled || this.readonly) return;
				const target = event.target;
				const item = target ? this._entryFromNode(target)?.item : void 0;
				if (!item || item.disabled) return;
				this._selectItem(item, event);
			};
			defineHybridPropAliases(this, [
				"modelValue",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"ariaLabelText",
				"cssClass",
				"keyValue",
				"displayValue",
				"displayGroup",
				"groupKey",
				"groupItems",
				"groupSticky",
				"searchValue",
				"searchOperation",
				"searchDebounce",
				"searchPlaceholder",
				"dataSource",
				"loadMore",
				"pageSize",
				"dropdownHeight",
				"dropdownMaxHeight",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight",
				"stayOpen"
			]);
			/**
			* Makes these Vue usages work:
			*
			* <mono-select :cssClass="{}" />
			* <mono-select :css-class="{}" />
			* <mono-select :cssclass="{}" />
			*/
			Object.defineProperty(this, "css-class", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "cssclass", {
				get: () => this.cssClass,
				set: (value) => {
					this._setCssClass(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "ariaLabel", {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "aria-label", {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
			Object.defineProperty(this, "arialabel", {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
			this._ds = new DataSourceController(this, {
				getDataSource: () => this.dataSource,
				getItems: () => this.items,
				getImmediate: () => this.immediate,
				getLoadMoreMode: () => this._loadMoreMode,
				getPageSize: () => this._pageSize
			});
		}
		static {
			this.monoPendingAuto = "data";
		}
		_monoPendingReady() {
			return !this.dataSource || !this._ds.loading;
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"model-value",
				"helpertext",
				"validationstate",
				"validationmessage",
				"errormessage",
				"successmessage",
				"arialabeltext",
				"arialabel",
				"css-class",
				"cssclass",
				"keyvalue",
				"displayvalue",
				"display-value",
				"stayopen"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue" || name === "model-value") {
				this.modelValue = this._toSelectValue(newValue);
				return;
			}
			if (name === "helpertext") {
				this.helperText = newValue ?? "";
				return;
			}
			if (name === "validationstate") {
				this.validationState = newValue ?? "default";
				return;
			}
			if (name === "validationmessage") {
				this.validationMessage = newValue ?? "";
				return;
			}
			if (name === "errormessage") {
				this.errorMessage = newValue ?? "";
				return;
			}
			if (name === "successmessage") {
				this.successMessage = newValue ?? "";
				return;
			}
			if (name === "arialabeltext" || name === "arialabel") {
				this.ariaLabelText = newValue ?? void 0;
				return;
			}
			if (name === "keyvalue") {
				this.keyValue = newValue ?? "";
				return;
			}
			if (name === "displayvalue" || name === "display-value") {
				if (typeof this.displayValue === "function") return;
				const next = newValue ?? "";
				if (this._looksLikeSerializedFunction(next)) return;
				this.displayValue = next;
				return;
			}
			if (name === "stayopen") {
				this.stayOpen = this._toBoolean(newValue);
				return;
			}
			if (name === "css-class" || name === "cssclass") this._setCssClass(newValue);
		}
		/**
		* The scroll body lives inside the dropdown panel, which the portal
		* controller relocates into a `<body>` portal while open — query it through
		* `panelRoot` (the portal when adopted, else the host render root).
		*/
		get _dropdownBodyEl() {
			return this._popup.panelRoot.querySelector(".mono-select-dropdown-body");
		}
		/**
		* Where the consumer's list wrapper is parked — through the SAME portal-aware root as the panel,
		* since while the dropdown is open it lives in a body portal a host query would miss.
		*/
		get _listSlotTarget() {
			return this._popup.panelRoot.querySelector("[data-mono-slot=\"list\"]");
		}
		/** A late wrapper arrived. Overridden per build — one adopts it, the other rescans. */
		_onLateListSlot() {}
		connectedCallback() {
			super.connectedCallback();
			this._lateListSlot.start();
			if (isServer) return;
			if (this._open) this._bindDocumentListeners();
		}
		/**
		* Outside-dismiss listeners, bound on OPEN rather than on connect.
		*
		* All three handlers begin with `if (!this._open) return`, so binding them only
		* while open is behaviour-preserving — the cost they carried was pure event
		* DISPATCH. Every mounted select used to hold three `document` listeners, two of
		* them capture-phase, so a grid with one select per row put 600 handlers (400 in
		* capture) in the path of every click, focus move and keystroke on the page.
		* Measured on the 200-row fixture: 600 listeners before, 0 at rest after.
		*
		* Same change, and the same reasoning, as the popup viewport listeners in
		* `popup-portal.ts` — which this file was explicitly the remaining example of.
		*/
		_bindDocumentListeners() {
			if (this._docListenersBound) return;
			this._docListenersBound = true;
			document.addEventListener("click", this._handleDocumentClick, true);
			document.addEventListener("focusin", this._handleDocumentFocusIn, true);
			document.addEventListener("keydown", this._handleDocumentKeydown);
		}
		_unbindDocumentListeners() {
			if (!this._docListenersBound) return;
			this._docListenersBound = false;
			document.removeEventListener("click", this._handleDocumentClick, true);
			document.removeEventListener("focusin", this._handleDocumentFocusIn, true);
			document.removeEventListener("keydown", this._handleDocumentKeydown);
		}
		disconnectedCallback() {
			if (this._searchTimer) {
				clearTimeout(this._searchTimer);
				this._searchTimer = void 0;
			}
			this._sourceSearch.clear(this.dataSource);
			this._lateListSlot.stop();
			this._stopWatchingListChrome();
			if (!isServer) this._unbindDocumentListeners();
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			this._itemsEpoch++;
			for (const key of [
				"disabled",
				"readonly",
				"required",
				"clearable",
				"immediate",
				"group",
				"groupSticky",
				"searchable",
				"stayOpen"
			]) {
				const v = this[key];
				if (typeof v !== "boolean") this[key] = this._toBoolean(v);
			}
			if (changed.has("modelValue") && !this._isSameValue(this.value, this.modelValue)) this.value = unwrapReactive(this.modelValue);
			if (changed.has("value") && !this._isSameValue(this.modelValue, this.value)) this.modelValue = unwrapReactive(this.value);
			if (this.group && (changed.has("dataSource") || changed.has("displayGroup") || changed.has("group"))) {
				const fields = this._groupSortFields();
				if (fields.length) this.dataSource?.sort?.(fields);
			}
			if (changed.has("dataSource")) {
				this._ds.bind(this.dataSource);
				this._sourceSearch.bind(this.dataSource);
			}
			if (changed.has("searchValue") || changed.has("searchOperation") || changed.has("displayValue") || changed.has("keyValue") || changed.has("dataSource") || changed.has("items")) this._searchVersion++;
			if (changed.has("immediate")) this._ds.maybeImmediateLoad();
			if (changed.has("loadMore")) this._ds.onLoadMoreModeChange();
			if (changed.has("items") || changed.has("loadMore") || changed.has("pageSize")) this._ds.resetVisible();
			if (changed.has("_open")) {
				this._cursorPending = this._open;
				if (!this._open) this._activeIndex = -1;
			}
			if (this._cursorPending && this._open && this._filteredItems.length) {
				this._activeIndex = this._initialActiveIndex();
				this._cursorPending = false;
			}
		}
		updated(changed) {
			super.updated(changed);
			this._syncListEntries();
			if (isServer) return;
			if (changed.has("_open") && this._open && this.searchable) this._searchFieldEl?.focus();
			if (changed.has("_activeIndex") && this._open && this._activeIndex >= 0) (this._popup.panelRoot?.querySelectorAll?.(".mono-select-item")?.[this._activeIndex])?.scrollIntoView?.({ block: "nearest" });
			this._updateScrollAutoHeight();
			if (this._open) this._bindDocumentListeners();
			else this._unbindDocumentListeners();
		}
		/**
		* Scroll-mode ergonomics: a short page (e.g. 5 items) won't overflow the
		* default dropdown height, so there's nothing to scroll and the next page
		* could never be triggered. Rather than eagerly fetching another page on
		* open, cap the list height to the loaded rows minus a sliver — enough to
		* show a scrollbar so the user scrolls to load more. No height is forced
		* when the consumer set `dropdown-height`/`dropdown-max-height`, when the
		* last page is reached, or when the rows already overflow.
		*/
		_updateScrollAutoHeight() {
			const userSetHeight = this._toCssLength(this.dropdownHeight) != null || this._toCssLength(this.dropdownMaxHeight) != null || toCssSize(this.dropdown?.height) != null || toCssSize(this.dropdown?.maxHeight) != null;
			if (!(this._loadMoreMode === "scroll" && this._open && !this._ds.atLastPage && !userSetHeight && this._visibleItems.length > 0)) {
				this._setScrollAutoMaxHeight("");
				return;
			}
			const el = this._dropdownBodyEl;
			const rowH = (el?.querySelector(".mono-select-item"))?.offsetHeight ?? 0;
			if (!el || !rowH) return;
			const CAP_ROWS = 7;
			const rows = this._visibleItems.length;
			let visible = Math.min(rows, CAP_ROWS);
			if (rows <= CAP_ROWS) visible -= .5;
			this._setScrollAutoMaxHeight(`${Math.round(visible * rowH)}px`);
		}
		_setScrollAutoMaxHeight(value) {
			if (value === this._scrollAutoMaxHeight) return;
			queueMicrotask(() => {
				this._scrollAutoMaxHeight = value;
			});
		}
		_setCssClass(value) {
			if (value == null) {
				this.cssClass = {};
				this.cssClassName = "";
				return;
			}
			if (typeof value === "object") {
				this.cssClass = value;
				return;
			}
			if (typeof value === "string") {
				const trimmed = value.trim();
				if (!trimmed) {
					this.cssClass = {};
					this.cssClassName = "";
					return;
				}
				/**
				* Optional HTML object support:
				* <mono-select css-class='{"root":"...", "trigger":"..."}'>
				*/
				if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					this.cssClass = JSON.parse(trimmed);
					return;
				} catch {}
				this.cssClassName = trimmed;
			}
		}
		_toSelectValue(value) {
			if (value === void 0 || value === null) return null;
			if (typeof value !== "string") return value;
			const trimmed = value.trim();
			if (!trimmed) return null;
			if (/^-?\d+(?:\.\d+)?$/.test(trimmed) || trimmed === "true" || trimmed === "false" || trimmed === "null" || trimmed[0] === "{" && trimmed[trimmed.length - 1] === "}" || trimmed[0] === "[" && trimmed[trimmed.length - 1] === "]" || trimmed[0] === "\"" && trimmed[trimmed.length - 1] === "\"") try {
				return JSON.parse(trimmed);
			} catch {}
			return trimmed;
		}
		/**
		* Wrap bare primitives so every row is an object, and pass objects through.
		*
		* The `.map()` used to be unconditional, which made this an ALLOCATION on the
		* overwhelmingly common path (an array of objects, where the map is an identity
		* function). It is read through `_normalizedItems` / `_visibleItems` / `_leafItems`
		* several times per render, so at one select per table row it was the single
		* hottest allocation in the component. The scan below is O(n) reads with no
		* allocation, and returns the SAME array when nothing needs wrapping.
		*
		* Returning the input array is safe: every caller only reads
		* (`find`/`filter`/`map`/`findIndex`/`length`), and `resolveSearchFields` takes its
		* rows as `readonly unknown[]`. It also makes item identity STABLE across calls for
		* primitive lists, which is the safe direction — see the note on
		* `_initialActiveIndex`, which explains why it deliberately does not rely on that
		* identity holding.
		*/
		_normalizeItems(items) {
			if (Array.isArray(items)) {
				let needsWrap = false;
				for (const item of items) if (typeof item !== "object" || item === null) {
					needsWrap = true;
					break;
				}
				if (!needsWrap) return items;
				return items.map((item) => {
					if (typeof item === "object" && item !== null) return item;
					return { value: item };
				});
			}
			if (typeof items === "string") try {
				const parsed = JSON.parse(items);
				return this._normalizeItems(parsed);
			} catch {
				return [];
			}
			return [];
		}
		/**
		* Read `field` off an option row — PATH-AWARE, like every other field name in
		* the library.
		*
		* A plain `field in item` was the old test, and it silently produced
		* `undefined` for any nested accessor: an option list grouped by a navigation
		* property (`$apply=groupby((PostBudget/Nama))` returns
		* `{ PostBudget: { Nama: … } }`) has no top-level `"PostBudget.Nama"` key, so
		* every option resolved to no value at all — selectable in appearance, inert in
		* practice. `searchExpr`, table columns and summaries have always accepted
		* these paths; a select's `key-value` / `display-value` now do too.
		*
		* The LITERAL key is still tried first, so a row that genuinely carries a
		* dotted PROPERTY NAME keeps resolving exactly as it did — only a key that is
		* absent falls through to being read as a path, which previously could only
		* have yielded `undefined` anyway. Nothing that worked before changes.
		*/
		_readField(item, field) {
			if (field in item) return item[field];
			return getFieldValue(item, field);
		}
		_resolveItemValue(item) {
			if (item == null) return item;
			if (typeof item !== "object") return item;
			if (this.keyValue) return this._readField(item, this.keyValue);
			return item;
		}
		_resolveItemDisplay(item) {
			if (item == null) return "";
			if (typeof this.displayValue === "function") return String(this.displayValue(item));
			if (typeof this.displayValue === "string" && this.displayValue) {
				if (typeof item !== "object") return "";
				const value = this._readField(item, this.displayValue);
				return value == null ? "" : String(value);
			}
			if (typeof item === "object" && "label" in item) {
				const label = item.label;
				return label == null ? "" : String(label);
			}
			if (typeof item === "object" && "value" in item) {
				const value = item.value;
				return value == null ? "" : String(value);
			}
			return String(item);
		}
		_looksLikeSerializedFunction(value) {
			const trimmed = value.trim();
			if (!trimmed) return false;
			return /^(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(trimmed);
		}
		/**
		* Value equality. With no `key-value` the whole item IS the value, so this is
		* identity — with one correction that is load-bearing under Vue.
		*
		* The model round-trips through the consumer's `ref`, which hands the item back
		* wrapped in a **reactive Proxy**; `items` normally stays raw, so `proxy === row`
		* is false and the selected row stops resolving (blank field, no highlight).
		* Comparing the raw targets restores it. Still identity, not deep equality:
		* two distinct rows with equal contents remain different values.
		*/
		_isSameValue(a, b) {
			if (a === b) return true;
			if (a == null || b == null) return false;
			const rawA = unwrapReactive(a);
			const rawB = unwrapReactive(b);
			if (rawA === rawB) return true;
			if (typeof rawA !== "object" || typeof rawB !== "object") return false;
			return false;
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		_toCssLength(value) {
			if (value == null || value === "") return void 0;
			if (typeof value === "number") return `${value}px`;
			const trimmed = String(value).trim();
			if (!trimmed) return void 0;
			return /^-?\d+(?:\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
		}
		/**
		* The WIDTH half of `dropdown`, on the panel.
		*
		* Split from the heights below because this component's popup is two elements: the panel owns
		* the box and the border, its body does the scrolling. That split is also why select needs no
		* `--_…-panel-max-h` custom property the way tag-input does — the popup controller's own cap
		* (`--mono-popup-avail-h`) lives on the panel and the author's on the body, so the two writers
		* never meet on one declaration.
		*
		* The panel is positioned `left: 0; right: 0` against the field, and a width on top of that is
		* the over-constrained case, which CSS resolves by dropping `right` — so the panel keeps its
		* left edge and takes this size.
		*/
		get _dropdownPanelStyle() {
			const style = {};
			const panel = this.dropdown;
			const width = toCssSize(panel?.width);
			if (width) style.width = width;
			const minWidth = toCssSize(panel?.minWidth);
			if (minWidth) style["min-width"] = minWidth;
			const maxWidth = toCssSize(panel?.maxWidth);
			if (maxWidth) style["max-width"] = maxWidth;
			return style;
		}
		/** The HEIGHT half of `dropdown`, on the scrolling body — see `_dropdownPanelStyle`. */
		get _dropdownBodyStyle() {
			const style = {};
			const panel = this.dropdown;
			const minHeight = toCssSize(panel?.minHeight);
			if (minHeight) style.minHeight = minHeight;
			const height = toCssSize(panel?.height) ?? this._toCssLength(this.dropdownHeight);
			if (height) style.height = height;
			const maxHeight = toCssSize(panel?.maxHeight) ?? this._toCssLength(this.dropdownMaxHeight);
			if (maxHeight) style.maxHeight = maxHeight;
			else if (height) style.maxHeight = height;
			else if (this._scrollAutoMaxHeight) style.maxHeight = this._scrollAutoMaxHeight;
			return style;
		}
		get _normalizedItems() {
			if (this._normalizedMemo?.epoch !== this._itemsEpoch) this._normalizedMemo = {
				epoch: this._itemsEpoch,
				items: this._normalizeItems(this._ds.sourceItems)
			};
			return this._normalizedMemo.items;
		}
		/** Sanitised chunk size for array-mode paging (>= 1). */
		get _pageSize() {
			const n = Math.floor(Number(this.pageSize));
			return Number.isFinite(n) && n > 0 ? n : 10;
		}
		/**
		* The effective load-more mode. Off when unset/false; otherwise 'button' only
		* for the explicit `load-more="button"`, and 'scroll' for everything else that
		* enables it (bare attribute, empty string, `true`, or `"scroll"`). Scroll is
		* the default so enabling load-more "just works" without picking a mode.
		*/
		get _loadMoreMode() {
			const v = this.loadMore;
			if (v === void 0 || v === null || v === false) return void 0;
			return v === "button" ? "button" : "scroll";
		}
		/**
		* The rows to actually render — the controller's visible slice, normalized.
		* (Array load-more reveals a chunk; DataSource mode accumulates pages.)
		*/
		get _visibleItems() {
			if (this._visibleMemo?.epoch !== this._itemsEpoch) this._visibleMemo = {
				epoch: this._itemsEpoch,
				items: this._normalizeItems(this._ds.visibleItems)
			};
			return this._visibleMemo.items;
		}
		get _selectedItem() {
			return this._leafItems.find((item) => this._isSameValue(this._resolveItemValue(item), this.value));
		}
		/** Grouping is active when at least one display-group accessor is given. */
		get _grouped() {
			return Array.isArray(this.displayGroup) && this.displayGroup.length > 0;
		}
		/** A node is a group when its `groupItems` field holds an array. */
		_isGroupNode(x) {
			return !!x && typeof x === "object" && Array.isArray(x[this.groupItems]);
		}
		/** Descend `groupItems[0]` to the first leaf row — the group's representative. */
		_firstLeaf(node) {
			let cur = node;
			let guard = 0;
			while (this._isGroupNode(cur) && guard++ < 50) cur = cur[this.groupItems]?.[0];
			return cur ?? void 0;
		}
		/** Resolve a group header's label from `displayGroup[level]` over a leaf row. */
		_resolveGroupLabel(node, level) {
			const accessor = this.displayGroup[level];
			const leaf = this._firstLeaf(node);
			if (typeof accessor === "function") return String(accessor(leaf ?? {}) ?? "");
			if (typeof accessor === "string" && leaf && accessor in leaf) return String(leaf[accessor] ?? "");
			const key = node[this.groupKey];
			return key == null ? "" : String(key);
		}
		/** The string `display-group` entries — usable as server group/sort fields. */
		_groupSortFields() {
			return (this.displayGroup ?? []).filter((a) => typeof a === "string");
		}
		/** A `display-group` level's key for a row (string → field, function → call). */
		_groupKeyOf(row, level) {
			const accessor = this.displayGroup[level];
			if (typeof accessor === "function") return accessor(row);
			if (typeof accessor === "string") return row[accessor];
		}
		/**
		* `group` mode: bucket flat rows into the nested `{ [groupKey], [groupItems] }`
		* shape client-side, by `display-group` level. Buckets keep first-appearance
		* order, so each group is contiguous and grows in place as more pages load.
		*/
		_buildClientTree(rows) {
			const build = (items, level) => {
				if (level >= this.displayGroup.length) return items;
				const buckets = /* @__PURE__ */ new Map();
				for (const row of items) {
					const key = this._groupKeyOf(row, level);
					const ks = String(key);
					let bucket = buckets.get(ks);
					if (!bucket) buckets.set(ks, bucket = {
						key,
						rows: []
					});
					bucket.rows.push(row);
				}
				return [...buckets.values()].map((b) => ({
					[this.groupKey]: b.key,
					[this.groupItems]: build(b.rows, level + 1)
				}));
			};
			return build(rows, 0);
		}
		/** The nested group nodes to render — built client-side in `group` mode. */
		_groupNodes() {
			if (this.group) {
				const leaves = this._visibleItems.filter((it) => this._searchMatches(it));
				return this._buildClientTree(leaves);
			}
			return this._ds.visibleItems ?? [];
		}
		/** Every leaf row — for value/display lookup. */
		get _leafItems() {
			if (this._leafMemo?.epoch === this._itemsEpoch) return this._leafMemo.items;
			const items = this._computeLeafItems();
			this._leafMemo = {
				epoch: this._itemsEpoch,
				items
			};
			return items;
		}
		_computeLeafItems() {
			if (!this._grouped) return this._normalizedItems;
			if (this.group) return [...this._ds.sourceItems];
			const out = [];
			const walk = (nodes) => {
				for (const n of nodes) if (this._isGroupNode(n)) walk(n[this.groupItems]);
				else if (n != null) out.push(n);
			};
			walk(this._ds.sourceItems ?? []);
			return out;
		}
		/**
		* Flatten the visible group tree into ordered header / item render rows.
		* Leaves are search-filtered (client mode); empty groups are dropped.
		*/
		_groupRows() {
			const filterLeaves = !this.group;
			const build = (nodes, level, parentKey) => {
				const rows = [];
				nodes.forEach((node, i) => {
					if (!this._isGroupNode(node)) {
						const item = node;
						if (item == null) return;
						if (filterLeaves && !this._searchMatches(item)) return;
						rows.push({
							kind: "item",
							item,
							index: -1
						});
						return;
					}
					const rec = node;
					const path = `${parentKey}/${String(rec[this.groupKey])}#${i}`;
					const children = build(rec[this.groupItems] ?? [], level + 1, path);
					if (!children.length) return;
					rows.push({
						kind: "group",
						level,
						label: this._resolveGroupLabel(rec, level),
						key: `g:${level}:${path}`
					});
					rows.push(...children);
				});
				return rows;
			};
			let idx = 0;
			return build(this._groupNodes(), 0, "").map((r) => r.kind === "item" ? {
				...r,
				index: idx++
			} : r);
		}
		/** Whether `search-value` names anything explicitly (vs falling back). */
		get _hasSearchValue() {
			const sv = this.searchValue;
			if (Array.isArray(sv)) return sv.length > 0;
			return typeof sv === "string" && !!sv.trim();
		}
		/**
		* The natural fields searched alongside the `'*'` default when `search-value` is
		* empty — the safety net, not the whole list.
		*
		* `'*'` resolves against loaded rows, so on a bound DataSource it expands to
		* NOTHING until the first page lands (nothing loads on open, and a query can
		* fire inside the debounce) — these keep that first query working. They are also
		* exempt from the remote string-only rule, so a numeric `key-value` stays
		* searchable. `display-value` contributes only when it's a string; a function
		* builds text that no field expression can reach, which is why `_searchMatches`
		* keeps matching the rendered display separately.
		*/
		_fallbackSearchFields() {
			return [typeof this.displayValue === "string" ? this.displayValue : void 0, this.keyValue];
		}
		/**
		* A cheap signature of the rows' SHAPE, for the memo keys below.
		*
		* Row count alone isn't enough once `'*'` is in play: the resolved field list
		* depends on the rows' keys, and a remote source paging from one full page to
		* the next keeps the same length while the shape can differ. Sampling the first
		* and last row keeps this O(1) while catching that case.
		*/
		_rowsShapeKey(rows) {
			const keysOf = (row) => row && typeof row === "object" ? Object.keys(row).join(",") : typeof row;
			if (!rows.length) return "0";
			return `${rows.length}:${keysOf(rows[0])}|${keysOf(rows[rows.length - 1])}`;
		}
		/**
		* `search-value` resolved to concrete entries — `*` patterns expanded against
		* the loaded rows. Memoized: a pattern samples up to 20 rows, so resolving per
		* item (this feeds `_searchMatches`) would be O(items × fields) per keystroke.
		*
		* With no `search-value` this defaults to `'*'` (every top-level field) plus the
		* natural fallbacks — see {@link _fallbackSearchFields}.
		*/
		_searchEntries(remote) {
			const rows = this._normalizedItems;
			const key = `${this._searchVersion} ${remote ? 1 : 0} ${this._rowsShapeKey(rows)}`;
			if (this._entriesCache?.key === key) return this._entriesCache.entries;
			const entries = resolveSearchFields({
				searchValue: this.searchValue,
				fallbackFields: this._fallbackSearchFields(),
				rows,
				remote,
				defaultToWildcard: true
			});
			this._entriesCache = {
				key,
				entries
			};
			return entries;
		}
		/** The compiled client-side predicate for the current query (memoized). */
		_searchPredicate() {
			const query = this._query.trim();
			const operation = this.searchOperation || "contains";
			const rows = this._normalizedItems;
			const key = `${this._searchVersion} ${operation} ${this._rowsShapeKey(rows)} ${query}`;
			if (this._predicateCache?.key === key) return this._predicateCache.pred;
			const pred = searchRowPredicate(this._searchEntries(false), query, operation);
			this._predicateCache = {
				key,
				pred
			};
			return pred;
		}
		/** A bound DataSource is searched on the server; a plain array, client-side. */
		_serverSearch() {
			return !!this.dataSource;
		}
		/** Client-side match test (server mode already filtered → always true). */
		_searchMatches(item) {
			if (this._serverSearch()) return true;
			if (!this._searchActive) return true;
			const q = this._query.trim().toLowerCase();
			if (!q) return true;
			if (this._hasSearchValue) {
				const pred = this._searchPredicate();
				return pred ? pred(item) : true;
			}
			const display = this._resolveItemDisplay(item).toLowerCase();
			const val = this._resolveItemValue(item);
			const valStr = val == null ? "" : String(val).toLowerCase();
			const pred = this._searchPredicate();
			return display.includes(q) || valStr.includes(q) || (pred ? pred(item) : false);
		}
		_onSearchInput(event) {
			if (this.disabled || this.readonly) return;
			this._query = event.target.value;
			this._searchActive = true;
			this._open = true;
			this._activeIndex = 0;
			this._cursorPending = false;
			this.requestUpdate();
			if (this._searchTimer) clearTimeout(this._searchTimer);
			const wait = Math.max(0, Number(this.searchDebounce) || 0);
			this._searchTimer = setTimeout(() => void this._applySearch(this._query), wait);
		}
		/** Run the search: server query (debounced) or just re-render for client filter. */
		async _applySearch(query) {
			if (!this._serverSearch()) {
				this.requestUpdate();
				return;
			}
			await this._sourceSearch.apply(this.dataSource, {
				query,
				searchValue: this.searchValue,
				fallbackFields: this._fallbackSearchFields(),
				rows: this._normalizedItems,
				remote: true,
				defaultToWildcard: true,
				operation: this.searchOperation || "contains"
			});
		}
		/** Clear the typed query (and the source query, on close / select). */
		_resetSearch() {
			if (this._searchTimer) {
				clearTimeout(this._searchTimer);
				this._searchTimer = void 0;
			}
			const had = this._searchActive && !!this._query;
			this._query = "";
			this._searchActive = false;
			this._activeIndex = -1;
			if (had && this._serverSearch()) this._applySearch("");
		}
		/** The label shown in the field while not actively typing a query. */
		get _displayText() {
			const item = this._selectedItem;
			return item ? this._resolveItemDisplay(item) : "";
		}
		/** Placeholder for the search field — a search hint while open, else the prompt. */
		get _fieldPlaceholder() {
			if ((this._open || this._searchActive) && this.searchPlaceholder) return this.searchPlaceholder;
			return this.placeholder;
		}
		/**
		* The selectable rows in render order — drives keyboard nav (`_activeIndex`)
		* for the searchable combobox. Mirrors what `_renderItems` paints.
		*/
		/**
		* Where the keyboard cursor goes when the list opens: the row matching the
		* current value, else the first row.
		*
		* Deliberately runs the SAME predicate that paints `.selected` in
		* `_renderOption`, over `_filteredItems` — the very list ↑/↓ and Enter index
		* into — so the cursor is guaranteed to land on the row drawn as selected.
		* Going via `_selectedItem` + `indexOf` would not work: that searches
		* `_leafItems`, an unfiltered/unpaged array whose `_normalizeItems` wraps
		* primitives in fresh objects per call, so identity would not hold. Grouping
		* needs no special case — `_groupRows()` numbers leaf rows only, which is
		* exactly what `_filteredItems` reconstructs.
		*
		* `-1` when the list is empty; `0` when the selected row is not in it (a page
		* the user hasn't scrolled to, or a server query that didn't return it), which
		* is the behaviour this component has always had.
		*/
		_initialActiveIndex() {
			const items = this._filteredItems;
			if (!items.length) return -1;
			const index = items.findIndex((item) => this._isSameValue(this._resolveItemValue(item), this.value));
			return index >= 0 ? index : 0;
		}
		get _filteredItems() {
			if (this._grouped) return this._groupRows().filter((r) => r.kind === "item").map((r) => r.item);
			return this._visibleItems.filter((item) => this._searchMatches(item));
		}
		get _hasValue() {
			return this.value !== null && this.value !== void 0 && this.value !== "";
		}
		get _hasLabelSlot() {
			return this._hasLabelSlotState;
		}
		get _hasHelperSlot() {
			return this._hasHelperSlotState;
		}
		get _hasPrefixSlot() {
			return this._hasPrefixSlotState;
		}
		get _hasSuffixSlot() {
			return this._hasSuffixSlotState;
		}
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.errorMessage) return "invalid";
			if (this.successMessage) return "valid";
			return "default";
		}
		get _wrapperClasses() {
			return [
				"mono-select",
				this.size,
				this.color,
				this.variant,
				this._open ? "open" : "",
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._resolvedValidationState !== "default" ? `is-${this._resolvedValidationState}` : "",
				this._hasValue ? "has-value" : "",
				this._hasPrefixSlot ? "has-prefix" : "",
				this._hasSuffixSlot ? "has-suffix" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _triggerClasses() {
			return [
				this._cls("mono-select-trigger", "trigger"),
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : ""
			].filter(Boolean).join(" ");
		}
		_createModelDetail(args) {
			return {
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: args.modelValue,
				selectedItem: this._leafItems.find((item) => this._isSameValue(this._resolveItemValue(item), args.modelValue)),
				sourceEvent: args.sourceEvent
			};
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_emitClear(detail) {
			dispatchMonoEvent(this, "clear", detail);
		}
		_toggleOpen(event) {
			event?.stopPropagation();
			if (this.disabled || this.readonly) return;
			if (this._open) this._close();
			else this._open = true;
		}
		_close() {
			this._open = false;
			this._resetSearch();
		}
		_handleTriggerKeydown(event) {
			if (this.disabled || this.readonly) return;
			if (!this._open) {
				if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
					event.preventDefault();
					this._open = true;
					return;
				}
				if (event.key === "Escape") {
					event.preventDefault();
					this._close();
				}
				return;
			}
			this._handleListKeydown(event);
		}
		/**
		* ↑/↓/Enter/Esc against the rendered list, shared by the trigger and the
		* search field so both modes navigate identically.
		*/
		_handleListKeydown(event) {
			const items = this._filteredItems;
			if (event.key === "ArrowDown") {
				event.preventDefault();
				this._open = true;
				this._activeIndex = items.length ? Math.min(this._activeIndex + 1, items.length - 1) : -1;
				return true;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				this._activeIndex = items.length ? Math.max(this._activeIndex - 1, 0) : -1;
				return true;
			}
			if (event.key === "Enter") {
				const active = this._activeIndex >= 0 ? items[this._activeIndex] : void 0;
				if (!active) return false;
				event.preventDefault();
				if (!active.disabled) this._selectItem(active, event);
				return true;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				this._close();
				return true;
			}
			return false;
		}
		/**
		* Focusing the field selects the shown label so the first keystroke replaces
		* it (type to filter). It does NOT open the dropdown: a Tab into the field is
		* not a request to see the list — typing, ↓, a click in the field or the
		* chevron are.
		*/
		_handleSearchFocus(event) {
			if (this.disabled || this.readonly) return;
			event.target.select();
		}
		/**
		* Clicking anywhere in a SEARCHABLE field opens it and focuses the input.
		* Opens only — a click in a text input while the list is open is caret
		* placement or text selection, never a toggle; the chevron, Escape and an
		* outside click close. (The plain trigger is a button that toggles instead:
		* nothing to type there, so a second click means "close".)
		*/
		_handleFieldClick(event) {
			event.stopPropagation();
			if (this.disabled || this.readonly) return;
			this._open = true;
			this._searchFieldEl?.focus();
		}
		/** Keyboard nav for the search field: arrows move, Enter selects, Esc closes. */
		_handleSearchKeydown(event) {
			if (this.disabled || this.readonly) return;
			this._handleListKeydown(event);
		}
		_selectItem(item, event) {
			event?.preventDefault();
			event?.stopPropagation();
			if (this.disabled || this.readonly || item.disabled) return;
			const oldValue = this.modelValue;
			const nextValue = this._resolveItemValue(item);
			this.value = nextValue;
			this.modelValue = nextValue;
			this._open = false;
			this._resetSearch();
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitChange(detail);
			if (this.searchable) this.updateComplete.then(() => this._searchFieldEl?.select());
			else this._triggerEl?.focus();
		}
		_clear(event) {
			event.preventDefault();
			event.stopPropagation();
			if (this.disabled || this.readonly) return;
			const oldValue = this.modelValue;
			const nextValue = null;
			this.value = nextValue;
			this.modelValue = nextValue;
			this._open = false;
			this._resetSearch();
			const detail = this._createModelDetail({
				modelValue: nextValue,
				oldValue,
				sourceEvent: event
			});
			this._emitChange(detail);
			this._emitClear(detail);
			if (this.searchable) this._searchFieldEl?.focus();
		}
		_renderLabel() {
			const hasContent = !!this.label || this._hasLabelSlot;
			if (!hasContent && !this._slotsAlwaysRender) return nothing;
			return html`
      <label
        class=${this._cls("mono-select-label", "label")}
        mono-label
        for=${this._selectId}
        ?mono-empty=${!hasContent}
      >
        ${this._slotOutlet("label", this.label)}

        ${this.required ? html`
              <span class=${this._cls("mono-select-required", "required")} mono-required-mark>
                *
              </span>
            ` : nothing}
      </label>
    `;
		}
		_renderValue() {
			if (this._hasValue && this._selectedItem) return html`
        <span class=${this._cls("mono-select-value", "value")} mono-value>
          ${this._hasPrefixSlot || this._slotsAlwaysRender ? this._slotOutlet("prefix") : nothing}

          <span>${this._resolveItemDisplay(this._selectedItem)}</span>

          ${this._hasSuffixSlot || this._slotsAlwaysRender ? this._slotOutlet("suffix") : nothing}
        </span>
      `;
			return html`
      <span
        class=${`${this._cls("mono-select-value", "value")} ${this._cls("mono-select-placeholder", "placeholder")}`}
        mono-value
        mono-placeholder
      >
        ${this.placeholder}
      </span>
    `;
		}
		/** A single selectable option button. `index` drives the keyboard-active highlight. */
		_renderOption(item, index = -1) {
			const selected = this._isSameValue(this._resolveItemValue(item), this.value);
			const active = index >= 0 && index === this._activeIndex;
			return html`
      <button
        type="button"
        role="option"
        class=${[
				this._cls("mono-select-item", "item"),
				active ? `active ${this.cssClass?.itemActive ?? ""}` : "",
				selected ? `selected ${this.cssClass?.itemSelected ?? ""}` : "",
				item.disabled ? `disabled ${this.cssClass?.itemDisabled ?? ""}` : ""
			].filter(Boolean).join(" ")}
        mono-item
        ?mono-active=${active}
        ?mono-selected=${selected}
        ?mono-disabled=${!!item.disabled}
        aria-selected=${selected ? "true" : "false"}
        ?disabled=${item.disabled}
        @mousedown=${(event) => event.preventDefault()}
        @click=${(event) => this._selectItem(item, event)}
      >
        ${this._resolveItemDisplay(item)}
      </button>
    `;
		}
		/**
		* The flat entry list published to `form.items()[key].list`.
		*
		* The SAME sequence the component renders — group headers interleaved with their leaves — so a
		* consumer looping it produces one node per row, in order, with nothing to pair up by hand.
		*
		* `key` is `item[keyValue]` via `_resolveItemValue`, the same value selection is keyed by, so
		* the feature introduces no second notion of a key.
		*/
		_listEntries() {
			const rowEntry = (item, level, index) => ({
				type: "row",
				key: String(this._resolveItemValue(item) ?? ""),
				item,
				level,
				selected: this._isSameValue(this._resolveItemValue(item), this.value),
				active: index >= 0 && index === this._activeIndex
			});
			if (this._grouped) {
				const rows = this._groupRows();
				const leavesFrom = (start, level) => {
					const out = [];
					for (let i = start + 1; i < rows.length; i++) {
						const row = rows[i];
						if (row.kind === "group") {
							if (row.level <= level) break;
							continue;
						}
						out.push(row.item);
					}
					return out;
				};
				let rowLevel = 0;
				return rows.map((row, i) => {
					if (row.kind === "group") {
						rowLevel = row.level + 1;
						return {
							type: "group",
							key: row.key,
							label: row.label,
							level: row.level,
							items: leavesFrom(i, row.level)
						};
					}
					return rowEntry(row.item, rowLevel, row.index);
				});
			}
			return this._filteredItems.map((item, index) => rowEntry(item, 0, index));
		}
		/**
		* Hand the form the current entries — but only a NEW array when they actually moved.
		*
		* This runs from `updated()`, so it fires on every render; the controller notifies on a changed
		* list, and that notify re-renders this control. Returning the same array reference is what keeps
		* that from looping forever. Identity of `item` counts as a change: a reloaded DataSource hands
		* back fresh row objects under the same keys, and a consumer reading `e.item.Nama` must see them.
		*/
		_syncListEntries() {
			const next = this._listEntries();
			const prev = this._publishedEntries;
			let same = prev.length === next.length;
			if (same) for (let i = 0; i < next.length; i++) {
				const a = prev[i];
				const b = next[i];
				if (a.type !== b.type || a.key !== b.key || a.item !== b.item || a.selected !== b.selected || a.active !== b.active) {
					same = false;
					break;
				}
			}
			if (same) return;
			this._publishedEntries = next;
			this._publishList(next);
		}
		/**
		* Where the consumer's `slot="list"` content goes — overridden per build.
		*
		* mono places that content as ONE block and never reaches inside it. Moving a `v-for`'s children
		* is not survivable: Vue inserts a new row with `parent.insertBefore(node, anchor)` where the
		* anchor is the existing node at that position, so relocating one makes the consumer's next
		* insert throw `NotFoundError`. Hence one block, and hence `data-mono-item-key` — with the rows
		* out of reach, a delegated click is the only way back to the item.
		*/
		renderListSlot() {
			return html``;
		}
		/**
		* The entry a click landed on — by POSITION, so a consumer writes a plain `v-for` and nothing else.
		*
		* mono cannot read a node's item off the node: it published the list, but the DOM was built by
		* someone else. What it CAN do is count. The wrapper's Nth element child is the Nth published
		* entry, because that is the contract the slot already states — one flat loop, one node per entry,
		* in order — and here that contract is CHECKED rather than assumed: if the two lengths disagree,
		* this refuses the click instead of picking the wrong row.
		*
		* Position is resolved at CLICK time, never cached. That is what makes it safe with no observer
		* and no re-stamping: by the time a human clicks, the framework has long finished patching, so
		* there is no window where a stale pairing could be consulted.
		*
		* `data-mono-item-key` still wins when present — the escape hatch for a wrapper that cannot emit
		* exactly one element per entry (a sticky header of your own, a row that renders as a fragment).
		*/
		/**
		* The consumer's `slot="list"` wrapper, wherever the build keeps it.
		*
		* The shadow build never moves it — it stays a light child of the host and is PROJECTED — so
		* that is the default. The light build moves it into the panel and overrides this with the node
		* it captured, which is also findable while the panel is closed and the wrapper parked.
		*/
		get _listSlotWrapper() {
			return this._lateListSlot.find();
		}
		/**
		* Re-decorate whenever the consumer re-renders their rows.
		*
		* `_syncListChrome()` runs from `updated()`, but a framework patches the wrapper on ITS next
		* tick — so a row the search box just revealed would be born undecorated and stay that way until
		* something else made mono render. This closes that gap.
		*
		* `childList` on the WRAPPER, which is exactly the churn {@link LateSlotWatcher} refuses on the
		* host: there the consumer's row traffic is noise, here it IS the signal. No `subtree`, so
		* mono's own attribute writes cannot re-trigger it.
		*/
		_watchListChrome() {
			if (typeof MutationObserver === "undefined") return;
			const wrapper = this._listSlotWrapper;
			if (!wrapper || wrapper === this._observedListWrapper) return;
			this._listChromeObserver?.disconnect();
			this._observedListWrapper = wrapper;
			this._listChromeObserver = new MutationObserver(() => this._syncListChrome());
			this._listChromeObserver.observe(wrapper, { childList: true });
		}
		_stopWatchingListChrome() {
			this._listChromeObserver?.disconnect();
			this._listChromeObserver = void 0;
			this._observedListWrapper = void 0;
		}
		/**
		* Decorate the lines the consumer rendered — the half of this feature that keeps the SLOT about
		* markup and mono about behaviour.
		*
		* Your template says what a line LOOKS like; the state it is in is stamped here, as `data-*`
		* attributes, so nothing in that template has to bind `e.selected` or `e.active` to say so.
		*
		* Where the tag input also injects a checkbox, this stops at the stamp: a select carries no
		* checkbox and no select-all, so there is no chrome to put anywhere.
		*
		* Three rules keep this safe beside a framework:
		*   · children are ANNOTATED only, never moved, reordered or removed — every `insertBefore`
		*     anchor a `v-for` patches against stays valid;
		*   · `data-*` only, never `class` — `class` is the consumer's binding and would be clobbered;
		*   · nothing is stamped unless the lines and the published entries match 1:1.
		*/
		_syncListChrome() {
			if (!this._hasListSlotState) return;
			const wrapper = this._listSlotWrapper;
			if (!wrapper) return;
			const children = Array.from(wrapper.children);
			const entries = this._publishedEntries;
			if (children.length !== entries.length) return;
			for (let i = 0; i < children.length; i++) {
				const node = children[i];
				const entry = entries[i];
				node.setAttribute("data-mono-type", entry.type);
				node.setAttribute("data-mono-level", String(entry.level ?? 0));
				node.setAttribute("data-mono-key", entry.key);
				if (entry.type === "group") continue;
				node.toggleAttribute("data-mono-selected", !!entry.selected);
				node.toggleAttribute("data-mono-active", !!entry.active);
			}
		}
		_entryFromNode(node) {
			const keyed = node.closest?.("[data-mono-item-key]");
			if (keyed) {
				const key = keyed.getAttribute("data-mono-item-key");
				return this._publishedEntries.find((e) => e.type === "row" && e.key === key);
			}
			const wrapper = node.closest?.("[slot=\"list\"]");
			if (!wrapper) return void 0;
			let row = node;
			while (row && row.parentElement !== wrapper) row = row.parentElement;
			if (!row) return void 0;
			const children = Array.from(wrapper.children);
			if (children.length !== this._publishedEntries.length) {
				console.warn(`[mono-select] slot="list" rendered ${children.length} element(s) for ${this._publishedEntries.length} option(s), so a click cannot be paired with its row. Render exactly one element per entry, or put data-mono-item-key="<entry.key>" on each row.`);
				return;
			}
			const entry = this._publishedEntries[children.indexOf(row)];
			return entry?.type === "row" ? entry : void 0;
		}
		_emptyRow() {
			const text = this.dataSource && this._ds.loading ? "Loading…" : this._query ? "No matches" : "No items";
			return html`<div class=${this._cls("mono-select-item disabled", "itemDisabled")} mono-empty-row>${text}</div>`;
		}
		_renderItems() {
			if (this._hasListSlotState) return html`
        ${this._filteredItems.length ? nothing : this._emptyRow()}
        ${this.renderListSlot()}
      `;
			if (this._grouped) {
				const rows = this._groupRows();
				if (!rows.some((r) => r.kind === "item")) return this._emptyRow();
				return html`
        ${rows.map((row) => row.kind === "group" ? html`<div
                class=${`${this._cls("mono-select-group", "group")}${this.groupSticky ? " sticky" : ""}`}
                mono-group
                mono-level=${row.level}
                ?mono-sticky=${this.groupSticky}
                data-level=${row.level}
                role="presentation"
              >
                ${row.label}
              </div>` : this._renderOption(row.item, row.index))}
      `;
			}
			const items = this._visibleItems.filter((item) => this._searchMatches(item));
			if (!items.length) return this._emptyRow();
			return html`${items.map((item, index) => this._renderOption(item, index))}`;
		}
		_renderLoadMore() {
			if (!this._loadMoreMode) return nothing;
			if (!this._normalizedItems.length || this._ds.atLastPage) return nothing;
			if (this._ds.loadingMore) return html`
        <div class=${`${this._cls("mono-select-load-more", "loadMore")} loading`} mono-load-more mono-loading>
          Loading…
        </div>
      `;
			if (this._loadMoreMode !== "button") return nothing;
			return html`
      <button
        type="button"
        class=${this._cls("mono-select-load-more", "loadMore")}
        mono-load-more
        @click=${(event) => {
				event.preventDefault();
				event.stopPropagation();
				this._ds.loadMore();
			}}
      >
        Load more
      </button>
    `;
		}
		_renderHelper() {
			const base = this._cls("mono-select-message", "message");
			if (this.validationMessage) {
				const state = this._resolvedValidationState;
				return html`
        <div class=${`${base} ${state}`} mono-message=${state} role=${state === "invalid" ? "alert" : nothing}>
          ${this.validationMessage}
        </div>
      `;
			}
			if (this.errorMessage) return html`
        <div class=${`${base} invalid`} mono-message="invalid" role="alert">
          ${this.errorMessage}
        </div>
      `;
			if (this.successMessage) return html`
        <div class=${`${base} valid`} mono-message="valid">
          ${this.successMessage}
        </div>
      `;
			if (this.helperText || this._hasHelperSlot || this._slotsAlwaysRender) return html`
        <div
          class=${`${base} helper`}
          mono-message="helper"
          ?mono-empty=${!this.helperText && !this._hasHelperSlot}
        >
          ${this._slotOutlet("helper", this.helperText)}
        </div>
      `;
			return nothing;
		}
		/** Shared clear (×) / chevron action. `toggleArrow` lets the chevron close an
		* already-open dropdown in the searchable field (the plain button toggles itself).
		*
		* ONE glyph, matching `<mono-tag-input>` and `<mono-dropdown-table>`: with a
		* clearable value the corner shows `✕` alone — clearing is the useful action
		* then, and the chevron would only say what the value already says. Without a
		* value (or `clearable` off) the chevron is alone. `disabled` / `readonly`
		* show NEITHER: the field refuses every gesture, so a chevron would promise an
		* open it never delivers. The actions span still renders so the gutter — and
		* the text beside it — stays put when the state toggles.
		*
		* THE VALUE WINS over the open state. On a searchable field the chevron is the
		* only mouse way to CLOSE — the body OPENS but never closes there (a click in a
		* text input is caret placement, not a toggle) — and it was once kept beside
		* `✕` for exactly that reason. The rule now is the simpler one: while there is
		* something to clear there is no chevron, open or closed; a searchable field
		* with a value closes by picking, Escape or an outside click. `role="button"`
		* on a span, not a `<button>`: the plain trigger is itself a button and buttons
		* do not nest. `mousedown.preventDefault` keeps focus where it is (the search
		* input); `_toggleOpen` stops propagation so the plain trigger does not toggle
		* a second time. */
		_renderActions() {
			const inert = this.disabled || this.readonly;
			const canClear = this.clearable && this._hasValue && !inert;
			const showArrow = !inert && !canClear;
			return html`
      <span class=${this._cls("mono-select-actions", "actions")} mono-actions>
        ${canClear ? html`
              <span
                role="button"
                tabindex="-1"
                class=${this._cls("mono-select-clear", "clear")}
                mono-clear
                aria-label="Clear select"
                @mousedown=${(event) => event.preventDefault()}
                @click=${this._clear}
              >
                ${this.renderIcon("close")}
              </span>
            ` : nothing}
        ${showArrow ? html`
              <span
                role="button"
                tabindex="-1"
                class=${this._cls("mono-select-arrow", "arrow")}
                mono-arrow
                aria-label="Toggle options"
                aria-expanded=${this._open ? "true" : "false"}
                @mousedown=${(event) => event.preventDefault()}
                @click=${this._toggleOpen}
              >
                ${this.renderIcon("chevron")}
              </span>
            ` : nothing}
      </span>
    `;
		}
		/** Plain trigger: a button showing the selected value (non-searchable). */
		_renderButtonTrigger(ariaLabel, describedBy) {
			return html`
      <button
        id=${this._selectId}
        type="button"
        class=${this._triggerClasses}
        mono-trigger
        ?disabled=${this.disabled}
        aria-haspopup="listbox"
        aria-expanded=${this._open ? "true" : "false"}
        aria-controls=${this._listboxId}
        aria-label=${ifDefined(ariaLabel)}
        aria-describedby=${ifDefined(describedBy)}
        @click=${this._toggleOpen}
        @keydown=${this._handleTriggerKeydown}
      >
        ${this._renderValue()}
        ${this._renderActions()}
      </button>
    `;
		}
		/** Searchable trigger: the field itself is a search input (combobox). */
		_renderSearchTrigger(ariaLabel, describedBy) {
			return html`
      <div class=${this._triggerClasses} mono-trigger @click=${this._handleFieldClick}>
        <input
          id=${this._selectId}
          class=${this._cls("mono-select-search-field", "searchField")}
          mono-search-field
          type="text"
          role="combobox"
          autocomplete="off"
          aria-haspopup="listbox"
          aria-expanded=${this._open ? "true" : "false"}
          aria-controls=${this._listboxId}
          aria-label=${ifDefined(ariaLabel)}
          aria-describedby=${ifDefined(describedBy)}
          .value=${this._searchActive ? this._query : this._displayText}
          placeholder=${this._fieldPlaceholder}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          @input=${this._onSearchInput}
          @focus=${this._handleSearchFocus}
          @keydown=${this._handleSearchKeydown}
        />
        ${this._renderActions()}
      </div>
    `;
		}
		/** Inline sizing applied to the root wrapper. */
		_sizeStyle() {
			return buildSizeStyle(this);
		}
		render() {
			const describedBy = this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlot ? this._messageId : void 0;
			const ariaLabel = this.ariaLabelText || this.label || this.placeholder || void 0;
			const state = this._resolvedValidationState;
			return html`
      <div
        class=${this._wrapperClasses}
        style=${styleMap(this._sizeStyle())}
        mono-select
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "outlined" ? nothing : this.variant}
        mono-validation-state=${state === "default" ? nothing : state}
        ?mono-open=${this._open}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
        ?mono-searchable=${this.searchable}
      >
        ${this._renderLabel()}

        ${this.searchable ? this._renderSearchTrigger(ariaLabel, describedBy) : this._renderButtonTrigger(ariaLabel, describedBy)}

        <div
          id=${this._listboxId}
          role="listbox"
          class=${this._cls("mono-select-dropdown", "dropdown")}
          mono-dropdown
          style=${styleMap(this._dropdownPanelStyle)}
        >
          <div
            class=${this._cls("mono-select-dropdown-body", "dropdownBody")}
            mono-dropdown-body
            style=${styleMap(this._dropdownBodyStyle)}
            @scroll=${this._handleDropdownScroll}
          >
            ${this._open ? this._renderItems() : nothing}
            ${this._open ? this._renderLoadMore() : nothing}
          </div>
        </div>

        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
      </div>
    `;
		}
		focus(options) {
			if (this.searchable) this._searchFieldEl?.focus(options);
			else this._triggerEl?.focus(options);
		}
		blur() {
			if (this.searchable) this._searchFieldEl?.blur();
			else this._triggerEl?.blur();
		}
		/** Whether the dropdown panel is currently open. */
		get isOpen() {
			return this._open;
		}
		open() {
			if (this.disabled || this.readonly) return;
			this._open = true;
		}
		close() {
			this._close();
		}
		toggle() {
			if (this.disabled || this.readonly) return;
			if (this._open) this._close();
			else this._open = true;
		}
		/** Coerce a possibly-stringy SSR value to a real boolean (matches
		*  `booleanStringConverter`: a bare / empty attribute means present → true). */
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (value == null) return false;
			const s = String(value).toLowerCase().trim();
			return s === "" || s === "true";
		}
		/** Whether the slot regions render even when empty. Light: no (omit empty
		*  regions). Shadow: yes — the native `<slot>`s must exist to project DSD
		*  content + be scanned (hidden via `[mono-empty]` when empty). */
		get _slotsAlwaysRender() {
			return false;
		}
		_hasSlot(name) {
			return name === "label" ? this._hasLabelSlotState : name === "helper" ? this._hasHelperSlotState : name === "prefix" ? this._hasPrefixSlotState : name === "suffix" ? this._hasSuffixSlotState : this._hasListSlotState;
		}
		_setSlotState(name, has) {
			if (name === "label") this._hasLabelSlotState = has;
			else if (name === "helper") this._hasHelperSlotState = has;
			else if (name === "prefix") this._hasPrefixSlotState = has;
			else if (name === "suffix") this._hasSuffixSlotState = has;
			else this._hasListSlotState = has;
		}
		/**
		* Slot outlet. Light build (default): a `data-mono-slot` placeholder the
		* captured light-DOM nodes are re-parented into when present, else the prop
		* `fallback`. Shadow build overrides this with a native `<slot name>` that
		* carries the fallback as native slot content.
		*/
		_slotOutlet(name, fallback = nothing) {
			return this._hasSlot(name) ? html`<span data-mono-slot=${name}></span>` : html`${fallback}`;
		}
		/**
		* Icon hook. Light build (default): the global `.mono-icon` / `i-mdi-*` UnoCSS
		* icon. Shadow overrides with inline SVG (UnoCSS can't reach a shadow root).
		*/
		renderIcon(name) {
			return html`<span class=${`mono-icon ${name === "close" ? "i-mdi-close" : "i-mdi-chevron-down"}`} mono-icon aria-hidden="true"></span>`;
		}
	}
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "variant", void 0);
	__decorate([property({ attribute: false })], MonoSelectCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ attribute: false })], MonoSelectCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "name", void 0);
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "placeholder", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoSelectCoreClass.prototype, "helperText", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoSelectCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoSelectCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoSelectCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoSelectCoreClass.prototype, "successMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoSelectCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "required", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		attribute: false,
		hasChanged: arrayHasChanged
	})], MonoSelectCoreClass.prototype, "items", void 0);
	__decorate([property({ attribute: false })], MonoSelectCoreClass.prototype, "dataSource", void 0);
	__decorate([property({
		attribute: "immediate",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "immediate", void 0);
	__decorate([property({
		attribute: "load-more",
		reflect: true
	})], MonoSelectCoreClass.prototype, "loadMore", void 0);
	__decorate([property({
		attribute: "page-size",
		reflect: true,
		type: Number
	})], MonoSelectCoreClass.prototype, "pageSize", void 0);
	__decorate([property({ attribute: false })], MonoSelectCoreClass.prototype, "dropdown", void 0);
	__decorate([property({
		attribute: "dropdown-height",
		reflect: true
	})], MonoSelectCoreClass.prototype, "dropdownHeight", void 0);
	__decorate([property({
		attribute: "dropdown-max-height",
		reflect: true
	})], MonoSelectCoreClass.prototype, "dropdownMaxHeight", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoSelectCoreClass.prototype, "flip", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoSelectCoreClass.prototype, "shift", void 0);
	__decorate([property({
		type: String,
		attribute: "key-value",
		reflect: true
	})], MonoSelectCoreClass.prototype, "keyValue", void 0);
	__decorate([property({ attribute: false })], MonoSelectCoreClass.prototype, "displayValue", void 0);
	__decorate([property({
		attribute: false,
		hasChanged: arrayHasChanged
	})], MonoSelectCoreClass.prototype, "displayGroup", void 0);
	__decorate([property({
		type: String,
		attribute: "group-key",
		reflect: true
	})], MonoSelectCoreClass.prototype, "groupKey", void 0);
	__decorate([property({
		type: String,
		attribute: "group-items",
		reflect: true
	})], MonoSelectCoreClass.prototype, "groupItems", void 0);
	__decorate([property({
		attribute: "group",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "group", void 0);
	__decorate([property({
		attribute: "group-sticky",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "groupSticky", void 0);
	__decorate([property({
		attribute: "searchable",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "searchable", void 0);
	__decorate([property({
		attribute: "stay-open",
		reflect: true,
		converter: booleanStringConverter
	})], MonoSelectCoreClass.prototype, "stayOpen", void 0);
	__decorate([property({
		attribute: "search-value",
		hasChanged: arrayHasChanged
	})], MonoSelectCoreClass.prototype, "searchValue", void 0);
	__decorate([property({
		type: String,
		attribute: "search-operation"
	})], MonoSelectCoreClass.prototype, "searchOperation", void 0);
	__decorate([property({
		attribute: "search-debounce",
		type: Number
	})], MonoSelectCoreClass.prototype, "searchDebounce", void 0);
	__decorate([property({
		type: String,
		attribute: "search-placeholder"
	})], MonoSelectCoreClass.prototype, "searchPlaceholder", void 0);
	__decorate([property({
		attribute: false,
		hasChanged: rateLimitHasChanged
	})], MonoSelectCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoSelectCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_open", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_query", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_searchActive", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_activeIndex", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_scrollAutoMaxHeight", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_hasHelperSlotState", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_hasPrefixSlotState", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_hasSuffixSlotState", void 0);
	__decorate([state()], MonoSelectCoreClass.prototype, "_hasListSlotState", void 0);
	__decorate([query(".mono-select-search-field")], MonoSelectCoreClass.prototype, "_searchFieldEl", void 0);
	__decorate([query(".mono-select-trigger")], MonoSelectCoreClass.prototype, "_triggerEl", void 0);
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoSelectCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoSelectCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoSelectCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoSelectCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoSelectCoreClass.prototype, "maxHeight", void 0);
	return MonoSelectCoreClass;
};
//#endregion
//#region src/components/select/select.css?raw
var select_default = "/* =========================================================================\r\n   mono-select — a port of Basecoat's `.select` (the custom one, `.select:not(select)`)\r\n   and `.combobox` (basecoat-css@1.0.2, vega style), on the `.field` / `.label`\r\n   chrome mono-input already ported.\r\n\r\n   Styled by ATTRIBUTE, like Basecoat (`.select > button`, `[role='option'].active`)\r\n   — and the attributes mirror the element's props one for one, so hand-written\r\n   markup reads like the Lit / Vue tag:\r\n\r\n     <mono-select size=\"sm\" color=\"danger\" variant=\"filled\" label=\"Fruit\">\r\n     <div mono-select mono-size=\"sm\" mono-color=\"danger\" mono-variant=\"filled\">\r\n       <label mono-label>Fruit</label>\r\n       <button mono-trigger><span mono-value mono-placeholder>Pick</span>\r\n         <span mono-actions><span mono-arrow>…</span></span></button>\r\n       <div mono-dropdown><div mono-dropdown-body><button mono-item>…</button></div></div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined). The element\r\n   renders these attributes on its wrapper (both builds) plus `mono-open` while\r\n   the panel is open; the old classes (`.mono-select.sm.open`) are still emitted\r\n   as inert hooks for consumer CSS until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-select]                                 ≡ .field (gap-3, as margins — see the root rule) + .select (position: relative)\r\n     [mono-select] > [mono-label]                  ≡ .field > label / .label\r\n     [mono-select] > [mono-trigger]                ≡ .select > button          (h-9 rounded-md border-input ps-2.5 pe-2 text-sm shadow-xs)\r\n     [mono-select][mono-searchable] > [mono-trigger] ≡ .combobox > input[role='combobox'] (same box; the input sits inside it)\r\n     [mono-trigger] > [mono-value]                 ≡ .select > button > span    (flex-1 truncate text-start)\r\n     [mono-trigger] > [mono-native]                ≡ EXTENSION — a plain <select> may stand in for the value + panel (appearance: none)\r\n     [mono-actions] > [mono-arrow] > [mono-icon]   ≡ .select > button > svg     (size-4 text-muted-foreground)\r\n     [mono-actions] > [mono-clear]                 ≡ .combobox [data-clear]     (size-6, painted as .btn[data-variant='ghost'])\r\n     [mono-dropdown]                               ≡ .select [data-popover]     (bg-popover ring-1 ring-foreground/10 rounded-md shadow-md)\r\n     [mono-dropdown-body]                          ≡ .combobox [role='listbox'] (max-h-72 overflow-y-auto p-1 scroll-py-1)\r\n     [mono-item]                                   ≡ .select [role='option']    (gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm)\r\n     [mono-item][mono-active] / :hover             ≡ [role='option'].active     (bg-muted text-foreground)\r\n     [mono-item][mono-selected]                    ≡ [role='option'][aria-selected='true'] (the --check-icon at the end)\r\n     [mono-group]                                  ≡ .select [role='heading']   (px-2 py-1.5 text-xs text-muted-foreground)\r\n     [mono-empty-row]                              ≡ .select [role='listbox']::before (py-6 text-center text-sm)\r\n     [mono-load-more]                              ≡ EXTENSION (an option-shaped ghost button)\r\n     [mono-message-wrap] > [mono-message]          ≡ .field > p / .field [role='alert']\r\n     [mono-validation-state=\"invalid\"]             ≡ .select > button[aria-invalid='true']\r\n     [mono-validation-state=\"valid|warning\"]       ≡ EXTENSION (the invalid pattern in --success / --warning)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION (Basecoat has only data-size=sm; the ladder is --mono-control-height-*)\r\n     [mono-variant=\"filled\"]                       ≡ EXTENSION (luma's .select > button: border-transparent bg-input/50)\r\n     [mono-variant=\"underlined\"]                   ≡ EXTENSION (sera's: rounded-none border-b-input px-0, no ring)\r\n\r\n   Inner parts are attributes too: [mono-label] (+ [mono-required-mark]),\r\n   [mono-trigger], [mono-value] (+ [mono-placeholder]), [mono-search-field],\r\n   [mono-native], [mono-actions], [mono-clear], [mono-arrow], [mono-icon],\r\n   [mono-dropdown], [mono-dropdown-body], [mono-item] (+ [mono-active] /\r\n   [mono-selected] / [mono-disabled]), [mono-group] (+ [mono-sticky],\r\n   [mono-level=\"n\"]), [mono-empty-row], [mono-load-more] (+ [mono-loading]),\r\n   [mono-list-slot], [mono-message-wrap] > [mono-message=\"helper|valid|invalid|warning\"].\r\n   The shadow build marks an unassigned slot wrapper [mono-empty].\r\n\r\n   THE PANEL IS PORTALED. The light build moves [mono-dropdown] into a\r\n   `<div data-mono-popup-portal>` under <body> while open (composables/popup-\r\n   portal.ts), and the portal mirrors the wrapper's class AND its mono-*\r\n   attributes — so `[mono-select] > [mono-dropdown]` keeps matching there and\r\n   the `--_mono-select-*` resolvers declared on `[mono-select]` re-resolve on\r\n   the portal. Nothing here may rely on the panel being inside the trigger's\r\n   host, and every option rule is scoped under `[mono-select]`.\r\n\r\n   Values are copied from the compiled vendor sheet (vendor/basecoat/basecoat-\r\n   vega.cdn.css) through the token layer; `dark:` variants travel as\r\n   `--mono-mode-*` tokens (a selector cannot cross a shadow boundary; an\r\n   inherited custom property can). FLAVORS set the `--mono-select-*` knobs read\r\n   below — the same set as mono-input (`--mono-select-outline-*` for the outlined\r\n   variant alone) plus `--mono-select-dropdown-{radius,padding,shadow,ring}`,\r\n   `--mono-select-option-{radius,padding-x,padding-y,font-size,line-height,gap,font-weight}`,\r\n   `--mono-select-group-*`, `--mono-select-icon-size`. Every fallback here is vega's\r\n   value (`node scripts/basecoat-styles.mjs --varying \"^(\\.select:not\\(select\\)|\\.combobox)\"`).\r\n   ========================================================================= */\r\n\r\nmono-select {\r\n  display: block;\r\n}\r\n\r\n[mono-select] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-select-text: var(--mono-select-color, var(--mono-select-text, var(--foreground)));\r\n  --_mono-select-placeholder: var(--mono-select-placeholder, var(--muted-foreground));\r\n  --_mono-select-muted: var(--mono-select-muted, var(--muted-foreground));\r\n  --_mono-select-primary: var(--mono-select-primary, var(--ring));\r\n  --_mono-select-secondary: var(--mono-select-secondary, var(--muted-foreground));\r\n  --_mono-select-success: var(--mono-select-success, var(--success));\r\n  --_mono-select-danger: var(--mono-select-danger, var(--destructive));\r\n  --_mono-select-warning: var(--mono-select-warning, var(--warning));\r\n  --_mono-select-info: var(--mono-select-info, var(--info));\r\n  --_mono-select-teal: var(--mono-select-teal, var(--teal));\r\n  --_mono-select-purple: var(--mono-select-purple, var(--purple));\r\n  --_mono-select-neutral: var(--mono-select-neutral, var(--neutral));\r\n  --_mono-select-dark: var(--mono-select-dark, var(--dark));\r\n  --_mono-select-valid: var(--mono-select-valid, var(--success));\r\n  --_mono-select-invalid: var(--mono-select-invalid, var(--destructive));\r\n\r\n  /* ── the painted result — three tiers, base = .select > button (vega) ─── */\r\n  --_mono-select-ring-color: var(--mono-select-ring-color, var(--mono-select-focus-color, var(--_mono-select-ring-color-preset, var(--_mono-select-primary))));\r\n  --_mono-select-ring-width: var(--mono-select-ring-width, var(--_mono-select-ring-width-preset, var(--mono-ring-width)));\r\n  --_mono-select-ring-alpha: var(--mono-select-ring-alpha, var(--mono-ring-alpha));\r\n  --_mono-select-border-color: var(--mono-select-rest-border, var(--mono-select-border-color, var(--mono-select-border, var(--_mono-select-border-color-preset, var(--input)))));\r\n  --_mono-select-bg: var(--mono-select-bg, var(--mono-select-surface, var(--_mono-select-bg-preset, var(--mono-mode-surface))));\r\n  --_mono-select-hover-bg: var(--mono-select-hover-bg, var(--_mono-select-hover-bg-preset, var(--_mono-select-bg)));\r\n  --_mono-select-shadow: var(--mono-select-shadow, var(--_mono-select-shadow-preset, 0 0 #0000));\r\n  --_mono-select-icon: var(--mono-select-icon-size, calc(var(--mono-spacing) * 4));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\r\n        `<div mono-select>` that names no size renders exactly like size=\"md\".\r\n        basecoat@1.0.2 styles/vega.css .select:not(select) > button — h-9 gap-1.5\r\n        rounded-md ps-2.5 pe-2 text-sm ── */\r\n  --_mono-select-height: var(--mono-select-height-md, var(--mono-control-height-md));\r\n  --_mono-select-radius: var(--mono-select-radius-md, var(--_mono-select-radius-preset, var(--mono-select-radius, var(--mono-radius-md))));\r\n  --_mono-select-padding-start: var(--mono-select-padding-x-md, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-select-padding-end: var(--mono-select-padding-end-md, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2))));\r\n  --_mono-select-gap: var(--mono-select-trigger-gap, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-select-font-size: var(--mono-select-font-md, var(--mono-text-sm));\r\n  --_mono-select-line-height: var(--mono-select-line-height, var(--mono-select-line-height-md, var(--mono-text-sm--lh)));\r\n  --_mono-select-action: calc(var(--mono-spacing) * 6);\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3; mono: BLOCK\r\n     flow with the gap as margins, so a hand-written panel that no controller\r\n     positions lands at its static position — right under the trigger, above the\r\n     message — instead of a flex container's content-box top */\r\n  --_mono-select-gap-y: var(--mono-select-gap, calc(var(--mono-spacing) * 3));\r\n  position: relative;\r\n  display: block;\r\n  width: 100%;\r\n  font-family: inherit;\r\n  color: var(--_mono-select-text);\r\n}\r\n\r\n/* A page-level `* { box-sizing: border-box }` reset does NOT cross a shadow\r\n   boundary; scoped here so both builds measure the same. */\r\n[mono-select],\r\n[mono-select] *,\r\n[mono-select] *::before,\r\n[mono-select] *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n[mono-select] :is([mono-label], [mono-message])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — the trigger's painted height IS the token (tests/perf/field-heights)\r\n   EXTENSION: Basecoat's select has only data-size=sm; the ladder is the shared\r\n   --mono-control-height-* scale and the text follows .btn's steps.\r\n   ========================================= */\r\n\r\n[mono-select][mono-size=\"xs\"] {\r\n  --_mono-select-height: var(--mono-select-height-xs, var(--mono-control-height-xs));\r\n  --_mono-select-radius: var(--mono-select-radius-xs, var(--_mono-select-radius-preset, var(--mono-select-radius, var(--mono-radius-md))));\r\n  --_mono-select-padding-start: var(--mono-select-padding-x-xs, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2))));\r\n  --_mono-select-padding-end: var(--mono-select-padding-end-xs, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 1.5))));\r\n  --_mono-select-gap: var(--mono-select-trigger-gap, var(--mono-spacing));\r\n  --_mono-select-font-size: var(--mono-select-font-xs, var(--mono-text-xs));\r\n  --_mono-select-line-height: var(--mono-select-line-height, var(--mono-select-line-height-xs, var(--mono-text-xs--lh)));\r\n  --_mono-select-icon: var(--mono-select-icon-size, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-select-action: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) > button — data-[size=sm]:h-8 */\r\n[mono-select][mono-size=\"sm\"] {\r\n  --_mono-select-height: var(--mono-select-height-sm, var(--mono-control-height-sm));\r\n  --_mono-select-radius: var(--mono-select-radius-sm, var(--_mono-select-radius-preset, var(--mono-select-radius, var(--mono-radius-md))));\r\n  --_mono-select-padding-start: var(--mono-select-padding-x-sm, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-select-padding-end: var(--mono-select-padding-end-sm, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2))));\r\n  --_mono-select-font-size: var(--mono-select-font-sm, var(--mono-select-font-md, var(--mono-text-sm)));\r\n  --_mono-select-line-height: var(--mono-select-line-height, var(--mono-select-line-height-sm, var(--mono-text-sm--lh)));\r\n  --_mono-select-action: calc(var(--mono-spacing) * 5);\r\n}\r\n\r\n[mono-select][mono-size=\"lg\"] {\r\n  --_mono-select-height: var(--mono-select-height-lg, var(--mono-control-height-lg));\r\n  --_mono-select-radius: var(--mono-select-radius-lg, var(--_mono-select-radius-preset, var(--mono-select-radius, var(--mono-radius-md))));\r\n  --_mono-select-padding-start: var(--mono-select-padding-x-lg, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-select-padding-end: var(--mono-select-padding-end-lg, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2))));\r\n  --_mono-select-font-size: var(--mono-select-font-lg, var(--mono-select-font-md, var(--mono-text-sm)));\r\n  --_mono-select-line-height: var(--mono-select-line-height, var(--mono-select-line-height-lg, var(--mono-text-sm--lh)));\r\n}\r\n\r\n[mono-select][mono-size=\"xl\"] {\r\n  --_mono-select-height: var(--mono-select-height-xl, var(--mono-control-height-xl));\r\n  --_mono-select-radius: var(--mono-select-radius-xl, var(--_mono-select-radius-preset, var(--mono-select-radius, var(--mono-radius-md))));\r\n  --_mono-select-padding-start: var(--mono-select-padding-x-xl, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 3))));\r\n  --_mono-select-padding-end: var(--mono-select-padding-end-xl, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-select-gap: var(--mono-select-trigger-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-select-font-size: var(--mono-select-font-xl, var(--mono-text-base));\r\n  --_mono-select-line-height: var(--mono-select-line-height, var(--mono-select-line-height-xl, var(--mono-text-base--lh)));\r\n  --_mono-select-icon: var(--mono-select-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-select-action: calc(var(--mono-spacing) * 7);\r\n}\r\n\r\n[mono-select][mono-size=\"xxl\"] {\r\n  --_mono-select-height: var(--mono-select-height-xxl, var(--mono-control-height-xxl));\r\n  --_mono-select-radius: var(--mono-select-radius-xxl, var(--_mono-select-radius-preset, var(--mono-select-radius, var(--mono-radius-md))));\r\n  --_mono-select-padding-start: var(--mono-select-padding-x-xxl, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 4))));\r\n  --_mono-select-padding-end: var(--mono-select-padding-end-xxl, var(--mono-select-padding-x, var(--_mono-select-padding-x-preset, calc(var(--mono-spacing) * 3))));\r\n  --_mono-select-gap: var(--mono-select-trigger-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-select-font-size: var(--mono-select-font-xxl, var(--mono-text-lg));\r\n  --_mono-select-line-height: var(--mono-select-line-height, var(--mono-select-line-height-xxl, var(--mono-text-lg--lh)));\r\n  --_mono-select-icon: var(--mono-select-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-select-action: calc(var(--mono-spacing) * 8);\r\n}\r\n\r\n/* =========================================\r\n   Variants — each writes only `*-preset` slots\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) > button — rounded-md border\r\n   border-input bg-transparent shadow-xs (dark:bg-input/30 dark:hover:bg-input/50\r\n   via the mode tokens). `--mono-select-outline-*` restyle THIS variant alone. */\r\n[mono-select]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\r\n  --_mono-select-bg-preset: var(--mono-select-outline-bg);\r\n  --_mono-select-hover-bg-preset: var(--mono-select-outline-hover-bg, var(--mono-mode-field-hover-bg));\r\n  --_mono-select-border-color-preset: var(--mono-select-outline-border-color);\r\n  --_mono-select-side-border-color-preset: var(--mono-select-outline-side-border-color);\r\n  --_mono-select-shadow-preset: var(--mono-select-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-select-ring-width-preset: var(--mono-select-outline-ring-width);\r\n  --_mono-select-radius-preset: var(--mono-select-outline-radius);\r\n  --_mono-select-padding-x-preset: var(--mono-select-outline-padding-x);\r\n}\r\n\r\n/* EXTENSION — filled ≡ basecoat@1.0.2 styles/luma.css .select:not(select) > button:\r\n   border-transparent bg-input/50, no shadow-xs, no hover */\r\n[mono-select][mono-variant=\"filled\"] {\r\n  --_mono-select-bg-preset: var(--mono-select-filled-bg, color-mix(in oklab, var(--input) 50%, transparent));\r\n  --_mono-select-hover-bg-preset: var(--_mono-select-bg);\r\n  --_mono-select-border-color-preset: transparent;\r\n  --_mono-select-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* EXTENSION — underlined ≡ basecoat@1.0.2 styles/sera.css .select:not(select) > button:\r\n   rounded-none border-transparent border-b-input bg-transparent px-0, no shadow,\r\n   no ring, focus-visible:border-b-ring */\r\n[mono-select][mono-variant=\"underlined\"] {\r\n  --_mono-select-bg-preset: transparent;\r\n  --_mono-select-hover-bg-preset: transparent;\r\n  --_mono-select-side-border-color-preset: transparent;\r\n  --_mono-select-shadow-preset: 0 0 #0000;\r\n  --_mono-select-ring-width-preset: 0px;\r\n  --_mono-select-radius-preset: 0;\r\n  --_mono-select-padding-x-preset: 0;\r\n}\r\n\r\n/* =========================================\r\n   Colours — the `color` prop is the FOCUS colour (ring + focused border)\r\n   ========================================= */\r\n\r\n[mono-select]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-primary);\r\n}\r\n[mono-select][mono-color=\"secondary\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-secondary);\r\n}\r\n[mono-select][mono-color=\"success\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-success);\r\n}\r\n[mono-select][mono-color=\"danger\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-danger);\r\n}\r\n[mono-select][mono-color=\"warning\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-warning);\r\n}\r\n[mono-select][mono-color=\"info\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-info);\r\n}\r\n[mono-select][mono-color=\"teal\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-teal);\r\n}\r\n[mono-select][mono-color=\"purple\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-purple);\r\n}\r\n[mono-select][mono-color=\"neutral\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-neutral);\r\n}\r\n[mono-select][mono-color=\"dark\"] {\r\n  --_mono-select-ring-color-preset: var(--_mono-select-dark);\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — flex items-center\r\n   gap-2 text-sm leading-none font-medium select-none w-fit */\r\n[mono-select] > [mono-label] {\r\n  display: flex;\r\n  align-items: center;\r\n  width: fit-content;\r\n  margin: 0 0 var(--_mono-select-gap-y);\r\n  gap: var(--mono-select-label-gap, calc(var(--mono-spacing) * 2));\r\n  font-size: var(--mono-select-label-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-select-label-line-height, 1);\r\n  font-weight: var(--mono-select-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  text-transform: var(--mono-select-label-text-transform, none);\r\n  letter-spacing: var(--mono-select-label-letter-spacing, normal);\r\n  color: var(--_mono-select-text);\r\n  user-select: none;\r\n}\r\n\r\n[mono-select][mono-disabled] > [mono-label] {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field — data-invalid:text-destructive */\r\n[mono-select][mono-validation-state=\"invalid\"] > [mono-label] {\r\n  color: var(--_mono-select-invalid);\r\n}\r\n\r\n[mono-select] [mono-required-mark] {\r\n  color: var(--_mono-select-danger);\r\n}\r\n\r\n/* =========================================\r\n   The trigger — the bordered box (a <button>, or a <div> holding the combobox input)\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select) > button */\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) > button — h-9 gap-1.5\r\n   rounded-md border border-input bg-transparent py-2 ps-2.5 pe-2 text-sm shadow-xs\r\n   focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50\r\n   aria-invalid:… dark:hover:bg-input/50; mono: `--tw-ring-*` flattened to the\r\n   ring + shadow slots, the height is the control token (no block padding — the\r\n   token owns the height), the side edges read their own slot */\r\n[mono-select] > [mono-trigger] {\r\n  --_mono-select-bc: var(--_mono-select-border-color);\r\n  --_mono-select-side-bc: var(--mono-select-side-border-color, var(--_mono-select-side-border-color-preset, var(--_mono-select-bc)));\r\n  --_mono-select-ring: 0 0 #0000;\r\n\r\n  position: relative;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: var(--_mono-select-gap);\r\n  width: 100%;\r\n  min-width: 0;\r\n  min-height: var(--_mono-select-height);\r\n  margin: 0;\r\n  padding-block: var(--mono-select-padding-y, 0);\r\n  padding-inline: var(--_mono-select-padding-start) var(--_mono-select-padding-end);\r\n  outline-style: none;\r\n  border: var(--mono-border-width) solid var(--_mono-select-bc);\r\n  border-top-color: var(--_mono-select-side-bc);\r\n  border-inline-color: var(--_mono-select-side-bc);\r\n  border-radius: var(--_mono-select-radius);\r\n  background: var(--_mono-select-bg);\r\n  color: var(--_mono-select-text);\r\n  box-shadow: var(--_mono-select-ring), var(--_mono-select-shadow);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-select-font-size);\r\n  line-height: var(--_mono-select-line-height);\r\n  font-weight: var(--mono-font-weight-normal);\r\n  white-space: nowrap;\r\n  text-align: start;\r\n  cursor: pointer;\r\n  user-select: none;\r\n  transition-property: color, box-shadow, border-color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  &:focus,\r\n  &:focus-visible,\r\n  &:focus-within {\r\n    outline: none !important;\r\n  }\r\n\r\n  /* focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 —\r\n     the combobox form is a <div> whose <input> takes focus, hence :focus-within */\r\n  &:focus-visible,\r\n  &:focus-within {\r\n    --_mono-select-bc: var(--_mono-select-ring-color);\r\n    --_mono-select-ring: 0 0 0 var(--_mono-select-ring-width) color-mix(in oklab, var(--_mono-select-ring-color) var(--_mono-select-ring-alpha), transparent);\r\n  }\r\n\r\n  & svg,\r\n  & [mono-icon] {\r\n    pointer-events: none;\r\n    flex-shrink: 0;\r\n  }\r\n}\r\n\r\n/* dark:hover:bg-input/50 (light: none) — carried by --mono-mode-field-hover-bg */\r\n@media (hover: hover) {\r\n  [mono-select]:not([mono-disabled]):not([mono-readonly]) > [mono-trigger]:hover {\r\n    background: var(--_mono-select-hover-bg);\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) > button — aria-invalid:border-destructive\r\n   aria-invalid:ring-3 aria-invalid:ring-destructive/20 (dark: /50, /40 via the mode tokens) */\r\n[mono-select][mono-validation-state=\"invalid\"] > [mono-trigger],\r\n[mono-select] > [mono-trigger][aria-invalid=\"true\"] {\r\n  --_mono-select-bc: var(--mono-mode-invalid-border);\r\n  --_mono-select-ring: 0 0 0 var(--_mono-select-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* EXTENSION — valid / warning are the invalid pattern in the role's colour */\r\n[mono-select][mono-validation-state=\"valid\"] > [mono-trigger] {\r\n  --_mono-select-bc: color-mix(in oklab, var(--_mono-select-valid) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-select-ring: 0 0 0 var(--_mono-select-ring-width) color-mix(in oklab, var(--_mono-select-valid) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n[mono-select][mono-validation-state=\"warning\"] > [mono-trigger] {\r\n  --_mono-select-bc: color-mix(in oklab, var(--_mono-select-warning) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-select-ring: 0 0 0 var(--_mono-select-ring-width) color-mix(in oklab, var(--_mono-select-warning) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n/* EXTENSION — readonly: focusable, on a muted surface, no gestures */\r\n[mono-select][mono-readonly] > [mono-trigger] {\r\n  background: var(--mono-select-readonly-bg, var(--muted));\r\n  cursor: default;\r\n}\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select) > button — disabled:\r\n   pointer-events-none cursor-not-allowed opacity-50 */\r\n[mono-select][mono-disabled] > [mono-trigger],\r\n[mono-select] > [mono-trigger]:disabled,\r\n/* a raw readonly select can only disable its native <select>; the root attribute wins */\r\n[mono-select]:not([mono-readonly]) > [mono-trigger]:has(> [mono-native]:disabled) {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n  cursor: not-allowed;\r\n  background: var(--mono-select-disabled-bg, var(--_mono-select-bg));\r\n}\r\n\r\n/* =========================================\r\n   Value / search field / native <select>\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select) > button > span —\r\n   flex flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-start */\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) > button > span — gap-1.5 */\r\n[mono-select] [mono-value] {\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--_mono-select-gap);\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  text-align: start;\r\n  color: var(--_mono-select-text);\r\n}\r\n\r\n[mono-select] [mono-value] > span {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n[mono-select] [mono-value][mono-placeholder] {\r\n  color: var(--_mono-select-placeholder);\r\n}\r\n\r\n/* basecoat@1.0.2 components/combobox.css .combobox > input[role='combobox'] — the\r\n   search input lives INSIDE our trigger box, so it is borderless like\r\n   .input-group > input and the box around it carries the chrome */\r\n[mono-select] [mono-search-field],\r\n[mono-select] [mono-native] {\r\n  flex: 1 1 auto;\r\n  width: 100%;\r\n  min-width: 0;\r\n  align-self: stretch;\r\n  appearance: none;\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: 0;\r\n  outline: none;\r\n  background: transparent;\r\n  box-shadow: none;\r\n  color: var(--_mono-select-text);\r\n  font: inherit;\r\n  line-height: var(--_mono-select-line-height);\r\n\r\n  &:focus,\r\n  &:focus-visible {\r\n    outline: none !important;\r\n  }\r\n\r\n  &::placeholder {\r\n    color: var(--_mono-select-placeholder);\r\n  }\r\n\r\n  &:disabled {\r\n    cursor: not-allowed;\r\n  }\r\n}\r\n\r\n[mono-select] [mono-search-field] {\r\n  cursor: text;\r\n}\r\n\r\n[mono-select] [mono-native] {\r\n  cursor: inherit;\r\n}\r\n\r\n[mono-select] [mono-native] option {\r\n  color: var(--_mono-select-text);\r\n  background: var(--popover);\r\n}\r\n\r\n/* =========================================\r\n   Actions — the chevron and the clear button\r\n   ========================================= */\r\n\r\n[mono-select] [mono-actions] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--mono-spacing);\r\n  flex-shrink: 0;\r\n  line-height: 1;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) > button > svg — size-4\r\n   text-muted-foreground; mono: the glyph sits in a square action box so the\r\n   chevron and the clear button occupy the same gutter */\r\n/* basecoat@1.0.2 components/combobox.css .combobox [data-clear] — size-6 border-0\r\n   bg-transparent p-0 text-current */\r\n[mono-select] [mono-arrow],\r\n[mono-select] [mono-clear] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  flex-shrink: 0;\r\n  width: var(--_mono-select-action);\r\n  height: var(--_mono-select-action);\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--mono-select-clear-radius, calc(var(--radius) - 5px));\r\n  background: transparent;\r\n  color: var(--_mono-select-muted);\r\n  font: inherit;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  transition-property: color, background-color, transform;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n[mono-select] :is([mono-arrow], [mono-clear]) > :is(svg, .mono-icon, [mono-icon]) {\r\n  display: block;\r\n  width: var(--_mono-select-icon);\r\n  height: var(--_mono-select-icon);\r\n  pointer-events: none;\r\n}\r\n\r\n/* EXTENSION — the chevron turns while the panel is open */\r\n[mono-select][mono-open] [mono-arrow] > :is(svg, .mono-icon, [mono-icon]) {\r\n  transform: rotate(180deg);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted\r\n   hover:text-foreground (dark:hover:bg-muted/50 via --mono-mode-ghost-hover) */\r\n@media (hover: hover) {\r\n  [mono-select] :is([mono-arrow], [mono-clear]):hover {\r\n    background: var(--mono-mode-ghost-hover);\r\n    color: var(--_mono-select-text);\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   The panel\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] — absolute z-50 min-w-full\r\n   overflow-x-hidden; mono: `display: none` while closed (the contents are only\r\n   rendered while open), `--mono-popup-z` from the shared popup stack and\r\n   `--mono-popup-avail-h` from the portal controller cap the whole panel */\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [data-popover] — bg-popover\r\n   text-popover-foreground rounded-md shadow-md ring-1 ring-foreground/10; the\r\n   `p-1` moves to the scrolling body (the combobox layout), so the scrollbar\r\n   never paints over the padding */\r\n[mono-select] > [mono-dropdown] {\r\n  position: absolute;\r\n  /* `top: auto` = the static position: the panel follows the trigger in the DOM,\r\n     so in block flow it lands right under it (the popup controller overrides\r\n     this inline for the element; hand-written markup relies on it). */\r\n  top: auto;\r\n  /* the 6px offset as a transform: the controller writes `transform: none` inline\r\n     with its fixed position, so only the hand-written panel is pushed down */\r\n  transform: translateY(calc(var(--mono-spacing) * 1.5));\r\n  /* Both edges pinned, so the panel matches the field by default. An inline\r\n     `width` from `:dropdown.prop=\"{ width }\"` is then the over-constrained case,\r\n     which CSS resolves by ignoring `right` — the panel keeps this left edge and\r\n     takes the given width. */\r\n  left: 0;\r\n  right: 0;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  display: none;\r\n  /* Basecoat's `min-w-[max(100%,9rem)]` is relative to the .select box; a portaled\r\n     panel is position: fixed, where 100% would be the viewport — the controller\r\n     writes the anchor's width inline instead, so only the floor stays. */\r\n  min-width: var(--mono-select-dropdown-min-width, 9rem);\r\n  max-height: var(--mono-popup-avail-h, none);\r\n  overflow: hidden;\r\n  isolation: isolate;\r\n  border-radius: var(--mono-select-dropdown-radius, var(--mono-radius-md));\r\n  background: var(--mono-select-dropdown-bg, var(--popover));\r\n  color: var(--mono-select-dropdown-color, var(--popover-foreground));\r\n  box-shadow: var(--mono-select-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--mono-select-dropdown-shadow, var(--mono-shadow-md));\r\n  font-size: var(--mono-select-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-select-option-line-height, var(--mono-text-sm--lh));\r\n}\r\n\r\n[mono-select][mono-open] > [mono-dropdown] {\r\n  /* A flex column (not `block`) so the body can shrink past its own height when\r\n     the panel is clamped above. */\r\n  display: flex;\r\n  flex-direction: column;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .combobox [role='listbox'] — max-h-[min(18rem,\r\n   var(--available-height,18rem))] scroll-py-1 overflow-y-auto p-1 */\r\n[mono-select] [mono-dropdown-body] {\r\n  flex: 1 1 auto;\r\n  min-height: 0;\r\n  max-height: 18rem;\r\n  padding: var(--mono-select-dropdown-padding, var(--mono-spacing));\r\n  overflow: auto;\r\n  overscroll-behavior: contain;\r\n  scroll-padding-block: var(--mono-select-dropdown-padding, var(--mono-spacing));\r\n  outline-style: none;\r\n}\r\n\r\n/* =========================================\r\n   Options\r\n   -----------------------------------------\r\n   Each rule also lists the stamped twin of a row rendered through `slot=\"list\"`\r\n   (`[data-mono-type='row']`, `[data-mono-active]`, `[data-mono-selected]`), so\r\n   the two can never drift: what you render in the slot IS an option. `:where()`\r\n   wraps only the CONTAINER, keeping the twin at attribute weight.\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select) [role='option'] — relative\r\n   flex w-full cursor-default items-center overflow-hidden text-ellipsis whitespace-\r\n   nowrap outline-none select-none; disabled: pointer-events-none opacity-50 */\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='option'] — gap-2\r\n   rounded-sm py-1.5 ps-2 pe-8 text-sm, svg size-4 */\r\n[mono-select] [mono-item],\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='row'] {\r\n  position: relative;\r\n  display: flex;\r\n  width: 100%;\r\n  align-items: center;\r\n  gap: var(--mono-select-option-gap, calc(var(--mono-spacing) * 2));\r\n  margin: 0;\r\n  padding-block: var(--mono-select-option-padding-y, calc(var(--mono-spacing) * 1.5));\r\n  padding-inline: var(--mono-select-option-padding-x, calc(var(--mono-spacing) * 2)) var(--mono-select-option-padding-end, calc(var(--mono-spacing) * 8));\r\n  min-height: var(--mono-select-option-min-height, 0);\r\n  border: 0;\r\n  border-radius: var(--mono-select-option-radius, var(--mono-radius-sm));\r\n  /* longhands, so the selected row's check (a background-image) survives the\r\n     active / hover background */\r\n  background-color: transparent;\r\n  background-image: none;\r\n  color: var(--_mono-select-text);\r\n  font-family: inherit;\r\n  font-size: var(--mono-select-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-select-option-line-height, var(--mono-text-sm--lh));\r\n  font-weight: var(--mono-select-option-font-weight, var(--mono-font-weight-normal));\r\n  text-align: start;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  outline-style: none;\r\n  user-select: none;\r\n  cursor: default;\r\n  transition-property: color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration-fast);\r\n}\r\n\r\n/* EXTENSION: a hair of air between rows. Upstream stacks its options flush, so an\r\n   active row directly under the selected one read as ONE tall highlight; a 2px\r\n   seam keeps the two rounded-sm washes apart. `--mono-select-option-spacing`. */\r\n[mono-select] [mono-item] + [mono-item],\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='row'] + [data-mono-type='row'] {\r\n  margin-top: var(--mono-select-option-spacing, 2px);\r\n}\r\n\r\n[mono-select] [mono-item] svg:not([class*='size-']),\r\n[mono-select] [mono-item] .mono-icon {\r\n  width: var(--_mono-select-icon);\r\n  height: var(--_mono-select-icon);\r\n  flex-shrink: 0;\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='option'].active, .select:not(select) [role='option']:focus-visible\r\n   — bg-muted text-foreground. The keyboard cursor and the pointer share one look. */\r\n[mono-select] [mono-item][mono-active]:not([mono-disabled]):not(:disabled),\r\n[mono-select] [mono-item]:focus-visible,\r\n[mono-select] :where([mono-list-slot]) [data-mono-active] {\r\n  background-color: var(--mono-select-option-active-bg, var(--muted));\r\n  color: var(--mono-select-option-active-color, var(--_mono-select-text));\r\n}\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select):not([data-select-initialized]) [role='option']:not([aria-disabled='true']):not(:disabled):hover, .select:not(select) [role='option'].active\r\n   — the pointer highlight is NOT behind (hover: hover) upstream */\r\n[mono-select] [mono-item]:hover:not([mono-disabled]):not(:disabled),\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='row']:hover {\r\n  background-color: var(--mono-select-option-active-bg, var(--muted));\r\n  color: var(--mono-select-option-active-color, var(--_mono-select-text));\r\n}\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select) [role='option'][aria-selected='true']\r\n   — the --check-icon at the end (bg-size .875rem, center right .5rem) */\r\n[mono-select] [mono-item][mono-selected],\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='row'][data-mono-selected] {\r\n  background-image: var(--mono-select-check-icon, var(--check-icon));\r\n  background-size: var(--mono-select-check-size, 0.875rem);\r\n  background-position: center right calc(var(--mono-spacing) * 2);\r\n  background-repeat: no-repeat;\r\n  font-weight: var(--mono-select-option-selected-font-weight, var(--mono-select-option-font-weight, var(--mono-font-weight-normal)));\r\n}\r\n\r\n[mono-select] [mono-item][mono-selected]:dir(rtl),\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='row'][data-mono-selected]:dir(rtl) {\r\n  background-position: center left calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n[mono-select] [mono-item][mono-disabled],\r\n[mono-select] [mono-item]:disabled {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n  cursor: not-allowed;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='listbox']:not(:has([data-value]:not([aria-hidden='true'])))::before\r\n   — py-6 text-center text-sm (the \"No results found\" row) */\r\n[mono-select] [mono-empty-row] {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding-block: calc(var(--mono-spacing) * 6);\r\n  padding-inline: calc(var(--mono-spacing) * 3);\r\n  font-size: var(--mono-select-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-select-option-line-height, var(--mono-text-sm--lh));\r\n  color: var(--_mono-select-muted);\r\n  text-align: center;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  cursor: default;\r\n  user-select: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='heading'] — px-2 py-1.5\r\n   text-xs text-muted-foreground; EXTENSION: one indent step per nesting level */\r\n[mono-select] [mono-group],\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='group'] {\r\n  --_ms-group-level: 0;\r\n  padding-block: var(--mono-select-group-padding-y, calc(var(--mono-spacing) * 1.5));\r\n  padding-inline: var(--mono-select-group-padding-x, calc(var(--mono-spacing) * 2));\r\n  padding-inline-start: calc(var(--mono-select-group-padding-x, calc(var(--mono-spacing) * 2)) + var(--_ms-group-level) * calc(var(--mono-spacing) * 2));\r\n  font-size: var(--mono-select-group-font-size, var(--mono-text-xs));\r\n  line-height: var(--mono-select-group-line-height, var(--mono-text-xs--lh));\r\n  font-weight: var(--mono-select-group-font-weight, var(--mono-font-weight-normal));\r\n  text-transform: var(--mono-select-group-text-transform, none);\r\n  letter-spacing: var(--mono-select-group-letter-spacing, normal);\r\n  color: var(--_mono-select-muted);\r\n  cursor: default;\r\n  user-select: none;\r\n}\r\n\r\n[mono-select] [mono-group][mono-level='1'],\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='group'][data-mono-level='1'] { --_ms-group-level: 1; }\r\n[mono-select] [mono-group][mono-level='2'],\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='group'][data-mono-level='2'] { --_ms-group-level: 2; }\r\n[mono-select] [mono-group][mono-level='3'],\r\n[mono-select] :where([mono-list-slot]) [data-mono-type='group'][data-mono-level='3'] { --_ms-group-level: 3; }\r\n\r\n/* group-sticky: pin headers while their rows scroll; nested levels stack on the\r\n   panel's own surface so options scroll cleanly underneath. */\r\n[mono-select] [mono-group][mono-sticky] {\r\n  position: sticky;\r\n  top: calc(var(--_ms-group-level) * 1.5rem);\r\n  z-index: calc(5 - var(--_ms-group-level));\r\n  background: var(--mono-select-dropdown-bg, var(--popover));\r\n}\r\n\r\n/* EXTENSION — the load-more affordance: an option-shaped ghost button */\r\n[mono-select] [mono-load-more] {\r\n  display: flex;\r\n  width: 100%;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--mono-select-option-gap, calc(var(--mono-spacing) * 2));\r\n  margin: 0;\r\n  padding-block: var(--mono-select-option-padding-y, calc(var(--mono-spacing) * 1.5));\r\n  padding-inline: var(--mono-select-option-padding-x, calc(var(--mono-spacing) * 2));\r\n  border: 0;\r\n  border-radius: var(--mono-select-option-radius, var(--mono-radius-sm));\r\n  background: transparent;\r\n  color: var(--_mono-select-muted);\r\n  font-family: inherit;\r\n  font-size: var(--mono-select-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-select-option-line-height, var(--mono-text-sm--lh));\r\n  font-weight: var(--mono-font-weight-medium);\r\n  cursor: pointer;\r\n  transition-property: color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration-fast);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-select] [mono-load-more]:hover:not([mono-loading]) {\r\n    background-color: var(--mono-select-option-active-bg, var(--muted));\r\n    color: var(--_mono-select-text);\r\n  }\r\n}\r\n\r\n[mono-select] [mono-load-more][mono-loading] {\r\n  cursor: default;\r\n  opacity: 0.7;\r\n}\r\n\r\n/* Consumer-rendered option rows (slot=\"list\"). `display: contents` so mono's own\r\n   placement wrapper generates no box: the rows the consumer writes lay out as if\r\n   they were direct children of the panel. */\r\n[mono-select] [mono-list-slot] {\r\n  display: contents;\r\n}\r\n\r\n/* =========================================\r\n   Message — helper / validation text under the field\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p\r\n   — text-sm text-muted-foreground leading-normal font-normal */\r\n[mono-select] > [mono-message-wrap] {\r\n  display: block;\r\n  margin-top: var(--_mono-select-gap-y);\r\n}\r\n\r\n[mono-select] > [mono-message-wrap]:not(:has([mono-message]:not([mono-empty]))) {\r\n  display: none;\r\n}\r\n\r\n[mono-select] [mono-message] {\r\n  font-size: var(--mono-select-message-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-select-message-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-font-weight-normal);\r\n  text-align: start;\r\n  color: var(--_mono-select-muted);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field [role=\"alert\"] — text-destructive text-sm */\r\n[mono-select] [mono-message=\"invalid\"] {\r\n  color: var(--_mono-select-invalid);\r\n}\r\n\r\n[mono-select] [mono-message=\"valid\"] {\r\n  color: var(--_mono-select-valid);\r\n}\r\n\r\n[mono-select] [mono-message=\"warning\"] {\r\n  color: var(--_mono-select-warning);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-select] > [mono-trigger],\r\n  [mono-select] [mono-arrow],\r\n  [mono-select] [mono-clear],\r\n  [mono-select] [mono-item] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/select/mono-select.shadow.ts
var SHADOW_EXTRA_CSS = `
[mono-value] > slot[name='prefix'],
[mono-value] > slot[name='suffix'] {
  display: contents;
}
`;
var MonoSelectShadow = class MonoSelectShadow extends withShadowUtilityStyles(MonoSelectCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(select_default, {
			host: "mono-select",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	get _slotsAlwaysRender() {
		return true;
	}
	connectedCallback() {
		super.connectedCallback();
		this._onLateListSlot();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated(changed);
		if (isServer) return;
		this._scanSlots();
	}
	updated(changed) {
		super.updated(changed);
		if (isServer) return;
		this._watchListChrome();
		this._syncListChrome();
	}
	/** A wrapper appeared after connect — the flag is all this build needs, projection does the rest. */
	_onLateListSlot() {
		const has = !!this._lateListSlot.find();
		if (has !== this._hasListSlotState) this._setSlotState("list", has);
	}
	_scanSlots() {
		for (const name of [
			"label",
			"helper",
			"prefix",
			"suffix"
		]) {
			const slot = this.renderRoot.querySelector(`slot[name="${name}"]`);
			this._setSlotState(name, this._slotHasContent(slot));
		}
		this._onLateListSlot();
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	/**
	* The consumer's list wrapper, PROJECTED rather than moved.
	*
	* Projection is what makes this work in a shadow root at all: slotted content stays in the light
	* DOM, so the app's own stylesheet still reaches it. Moving those nodes inside the shadow root
	* would cut them off from it — the same reason this build inlines SVGs instead of icon classes.
	*/
	renderListSlot() {
		return html`<div class="mono-select-list-slot" mono-list-slot @click=${this._onListSlotClick}>
      <slot name="list" @slotchange=${() => this._scanSlots()}></slot>
    </div>`;
	}
	/** Native `<slot>` carrying the prop fallback as native slot content. */
	_slotOutlet(name, fallback = nothing) {
		return html`<slot
      name=${name}
      @slotchange=${(e) => this._onSlotChange(name, e)}
      >${fallback}</slot
    >`;
	}
	/** Inline SVG — the global `.mono-icon`/`i-mdi-*` UnoCSS icons can't reach a
	*  shadow root. */
	renderIcon(name) {
		return html`<svg
      class="mono-icon"
      mono-icon
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d=${name === "close" ? "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" : "M7.41 8.58 12 13.17l4.59-4.59L18 10l-6 6-6-6z"}></path>
    </svg>`;
	}
};
MonoSelectShadow = __decorate([customElement("mono-shadow-select")], MonoSelectShadow);
//#endregion
//#region src/components/select/select-utils.ts
function validateSelectProps(props) {
	const validSizes = [
		"xs",
		"sm",
		"md",
		"lg",
		"xl",
		"xxl"
	];
	const validColors = [
		"primary",
		"secondary",
		"success",
		"danger",
		"warning",
		"info",
		"teal",
		"purple",
		"neutral",
		"dark"
	];
	const validVariants = [
		"outlined",
		"filled",
		"underlined"
	];
	const validStates = [
		"default",
		"valid",
		"invalid",
		"warning"
	];
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.validationState && !validStates.includes(props.validationState)) return false;
	return true;
}
//#endregion
export { MonoSelectCore, MonoSelectShadow, validateSelectProps };
