import { a as __decorate, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, o as arrayHasChanged, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as toCssSize, t as buildSizeStyle } from "../../css-size-DhHSVZJK.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { t as PopupPortalController } from "../../popup-portal-BziRX1yG.js";
import { a as MonoSourceSearch, c as searchRowPredicate, n as unwrapReactive, r as unwrapReactiveDeep, s as resolveSearchFields } from "../../reactive-BHsqVjRh.js";
import { t as LateSlotWatcher } from "../../light-slots-BVJwyg_2.js";
import { t as checkbox_default } from "../../checkbox-Cqpie9Ap.js";
import { r as readAllRows } from "../../data-source-read-CUX-lgrQ.js";
import { n as resolveChipLimit, r as visibleChipCap, t as ChipStripController } from "../../chip-strip-Cw3gyz0q.js";
import { n as chevronIcon, t as caretIcon } from "../../field-icons-BoOG6KrL.js";
import { t as chip_default } from "../../chip-DBUUa2eB.js";
import { t as DataSourceController } from "../../data-source-controller-C50Qyfzh.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/tag-input/tag-input-core.ts
var numberStringConverter = {
	fromAttribute(value) {
		if (value === null || value === "") return void 0;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : void 0;
	},
	toAttribute(value) {
		if (value === void 0 || value === null) return null;
		return String(value);
	}
};
/**
* `MonoTagInputCore` — render-mode-agnostic logic for `mono-tag-input` (props,
* hybrid aliases, array value/model sync, DataSource paging, search, grouping,
* keyboard, tag chips, the popup controller, and the full `render()`). SSR-safe:
* every `document`/`window`/focus access is `isServer`-guarded. Each build
* supplies `createRenderRoot()` + `static styles`, the slot strategy (light
* captures children into `data-mono-slot` placeholders; shadow uses native
* `<slot>`), and the `_slotOutlet` / `renderIcon` hooks. Mirrors `select-core`.
*/
var MonoTagInputCore = (superClass) => {
	class MonoTagInputCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.chip = {};
			this.modelValue = [];
			this.value = [];
			this.name = "";
			this.label = "";
			this.placeholder = "Add tag...";
			this.helperText = "";
			this.validationState = "default";
			this.validationMessage = "";
			this.errorMessage = "";
			this.successMessage = "";
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.clearable = false;
			this.allowCustom = true;
			this.checkable = false;
			this.selectAll = true;
			this.selectAllLabel = "All";
			this.groupSelectAll = true;
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
			this.searchable = true;
			this.stayOpen = false;
			this.searchValue = "";
			this.searchOperation = "contains";
			this.searchDebounce = 300;
			this.cssClass = {};
			this.cssClassName = "";
			this._inputValue = "";
			this._open = false;
			this._activeIndex = -1;
			this._cursorPending = false;
			this._moreOpen = false;
			this._selectAllPending = false;
			this._scrollAutoMaxHeight = "";
			this._hasLabelSlotState = false;
			this._hasHelperSlotState = false;
			this._chipStrip = new ChipStripController(this, {
				strip: () => this.renderRoot?.querySelector(".mono-tag-input-chip-strip"),
				enabled: () => this._chipBehaviour === "inline"
			});
			this._popup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-tag-input-dropdown"),
				getAnchor: () => this.renderRoot.querySelector(".mono-tag-input-field"),
				getStyleScope: () => this.renderRoot.querySelector(".mono-tag-input"),
				isOpen: () => this._open,
				matchWidth: () => !toCssSize(this.dropdown?.width),
				offset: () => 6,
				flip: () => this.flip,
				shift: () => this.shift,
				constrainSize: () => true
			});
			this._morePopup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-tag-input-more-panel"),
				getAnchor: () => this.renderRoot.querySelector(".mono-tag-input-field"),
				getStyleScope: () => this.renderRoot.querySelector(".mono-tag-input"),
				isOpen: () => this._moreOpen,
				matchWidth: () => true,
				offset: () => 6,
				flip: () => true,
				shift: () => true,
				constrainSize: () => true
			});
			this._inputId = `mono-tag-input-${Math.random().toString(36).slice(2)}`;
			this._messageId = `${this._inputId}-message`;
			this._listboxId = `${this._inputId}-listbox`;
			this._lateListSlot = new LateSlotWatcher(this, "list", () => this._onLateListSlot());
			this._sourceSearch = new MonoSourceSearch();
			this._searchVersion = 0;
			this._selectedItemCache = /* @__PURE__ */ new Map();
			this._handleDocumentClick = (event) => {
				if (this.stayOpen) return;
				if (!this._open && !this._moreOpen) return;
				const path = event.composedPath();
				if (path.includes(this) || this._popup.containsInPath(path) || this._morePopup.containsInPath(path)) return;
				this._close();
				this._moreOpen = false;
			};
			this._handleDocumentFocusIn = (event) => {
				if (this.stayOpen) return;
				if (!this._open && !this._moreOpen) return;
				const path = event.composedPath();
				if (path.includes(this) || this._popup.containsInPath(path) || this._morePopup.containsInPath(path)) return;
				this._close();
				this._moreOpen = false;
			};
			this._handleDocumentKeydown = (event) => {
				if (!this._open && !this._moreOpen) return;
				if (event.key === "Escape") {
					event.preventDefault();
					this._close();
					this._moreOpen = false;
				}
			};
			this._renderedChipCount = 0;
			this._measuredChipCount = 0;
			this._handleDropdownScroll = (event) => {
				if (this._loadMoreMode !== "scroll") return;
				if (this._ds.loadingMore || this._ds.atLastPage) return;
				const el = event.currentTarget;
				if (!el) return;
				if (el.scrollHeight - el.scrollTop - el.clientHeight <= 24) this._ds.loadMore();
			};
			this._hasListSlotState = false;
			this._publishedEntries = [];
			this._onListSlotClick = (event) => {
				if (this.disabled || this.readonly) return;
				const target = event.target;
				const entry = target ? this._entryFromNode(target) : void 0;
				if (!entry) return;
				if (entry.type === "group") {
					if (!this.checkable || !this.groupSelectAll) return;
					const usable = (entry.items ?? []).filter((item) => this._isSelectable(item));
					if (!usable.length) return;
					event.preventDefault();
					this._toggleMany(usable, event);
					return;
				}
				const item = entry.item;
				if (!item || !this._isSelectable(item)) return;
				event.preventDefault();
				this._toggleValue(this._resolveItemValue(item), event);
			};
			defineHybridPropAliases(this, [
				"modelValue",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"allowCustom",
				"maxVisible",
				"minVisible",
				"ariaLabelText",
				"cssClass",
				"keyValue",
				"displayValue",
				"displayGroup",
				"groupKey",
				"groupItems",
				"groupSticky",
				"groupSelectAll",
				"selectAll",
				"selectAllLabel",
				"searchValue",
				"searchOperation",
				"searchDebounce",
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
			* Vue support:
			*
			* <mono-tag-input :cssClass="{}" />
			* <mono-tag-input :css-class="{}" />
			* <mono-tag-input :cssclass="{}" />
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
				"helpertext",
				"validationstate",
				"validationmessage",
				"errormessage",
				"successmessage",
				"allowcustom",
				"maxvisible",
				"minvisible",
				"arialabeltext",
				"arialabel",
				"css-class",
				"cssclass",
				"chip",
				"keyvalue",
				"displayvalue",
				"display-value",
				"stayopen"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "modelvalue") {
				this.modelValue = this._normalizeValue(newValue);
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
			if (name === "allowcustom") {
				this.allowCustom = this._toBoolean(newValue);
				return;
			}
			if (name === "maxvisible") {
				this.maxVisible = this._toOptionalNumber(newValue);
				return;
			}
			if (name === "minvisible") {
				this.minVisible = this._toOptionalNumber(newValue);
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
			if (name === "css-class" || name === "cssclass") {
				this._setCssClass(newValue);
				return;
			}
			if (name === "chip") this._setChip(newValue);
		}
		/**
		* The dropdown panel is relocated into a `<body>` portal while open — query
		* it through `panelRoot` (the portal when adopted, else the host render root).
		*/
		get _dropdownEl() {
			return this._popup.panelRoot.querySelector(".mono-tag-input-dropdown");
		}
		/**
		* Where the consumer's list wrapper is parked, through the SAME portal-aware root as the panel
		* itself — while the dropdown is open it lives in a body portal, so a host query would miss it.
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
			document.addEventListener("click", this._handleDocumentClick, true);
			document.addEventListener("focusin", this._handleDocumentFocusIn, true);
			document.addEventListener("keydown", this._handleDocumentKeydown);
		}
		disconnectedCallback() {
			if (this._searchTimer) {
				clearTimeout(this._searchTimer);
				this._searchTimer = void 0;
			}
			this._sourceSearch.clear(this.dataSource);
			this._lateListSlot.stop();
			this._stopWatchingListChrome();
			if (!isServer) {
				document.removeEventListener("click", this._handleDocumentClick, true);
				document.removeEventListener("focusin", this._handleDocumentFocusIn, true);
				document.removeEventListener("keydown", this._handleDocumentKeydown);
			}
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			for (const key of [
				"disabled",
				"readonly",
				"required",
				"clearable",
				"allowCustom",
				"checkable",
				"immediate",
				"group",
				"groupSticky",
				"searchable",
				"stayOpen",
				"selectAll",
				"groupSelectAll"
			]) {
				const v = this[key];
				if (typeof v !== "boolean") this[key] = this._toBoolean(v);
			}
			if (changed.has("modelValue") && !this._arrayEqual(this.value, this.modelValue)) this.value = [...unwrapReactiveDeep(this.modelValue)];
			if (changed.has("value") && !this._arrayEqual(this.modelValue, this.value)) this.modelValue = [...unwrapReactiveDeep(this.value)];
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
		}
		updated(changed) {
			super.updated(changed);
			this._syncListEntries();
			if (isServer) return;
			this._rememberSelected(this._selectedValues);
			if (changed.has("_open")) {
				this._cursorPending = this._open;
				if (!this._open) this._activeIndex = -1;
			}
			if (this._moreOpen && !this._overflowChips.length) this._moreOpen = false;
			if (this._cursorPending && this._open && this._filteredItems.length) {
				this._activeIndex = this._initialActiveIndex();
				this._cursorPending = false;
			}
			if (changed.has("_activeIndex") && this._open && this._activeIndex >= 0) (this._popup.panelRoot?.querySelectorAll?.(".mono-tag-input-item")?.[this._activeIndex])?.scrollIntoView?.({ block: "nearest" });
			this._updateScrollAutoHeight();
			if (changed.has("chip") || changed.has("size") || changed.has("disabled") || changed.has("readonly") || this._renderedChipCount !== this._measuredChipCount) {
				this._measuredChipCount = this._renderedChipCount;
				this._chipStrip.invalidate();
			}
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
				*
				* <mono-tag-input css-class='{"root":"...", "field":"..."}'></mono-tag-input>
				*/
				if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					this.cssClass = JSON.parse(trimmed);
					return;
				} catch {}
				this.cssClassName = trimmed;
			}
		}
		/**
		* `chip` is an object prop, so the real binding is `:chip.prop="{…}"`. This
		* covers the two ways a *string* can arrive: a hand-written JSON attribute
		* (`chip='{"size":"md"}'`, incl. DSD/SSR), and Vue's `String(value)` mirror of
		* a plain `:chip="{…}"` binding — which yields `"[object Object]"` and must be
		* ignored, or it would wipe the property set moments later.
		*/
		_setChip(value) {
			if (value == null) {
				this.chip = {};
				return;
			}
			if (typeof value === "object") {
				this.chip = value;
				return;
			}
			if (typeof value !== "string") return;
			const trimmed = value.trim();
			if (!trimmed) {
				this.chip = {};
				return;
			}
			if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return;
			try {
				this.chip = JSON.parse(trimmed);
			} catch {}
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		_toOptionalNumber(value) {
			if (value === void 0 || value === null || value === "") return void 0;
			const parsed = Number(value);
			return Number.isFinite(parsed) ? parsed : void 0;
		}
		_normalizeValue(value) {
			if (Array.isArray(value)) return value.filter((item) => item !== null && item !== void 0);
			if (typeof value === "string") {
				const trimmed = value.trim();
				if (!trimmed) return [];
				if (trimmed.startsWith("[") && trimmed.endsWith("]")) try {
					return this._normalizeValue(JSON.parse(trimmed));
				} catch {
					return [];
				}
				return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
			}
			return [];
		}
		_normalizeItems(items) {
			if (Array.isArray(items)) return items.map((item) => {
				if (typeof item === "object" && item !== null) return item;
				return { value: item };
			});
			if (typeof items === "string") try {
				const parsed = JSON.parse(items);
				return this._normalizeItems(parsed);
			} catch {
				return [];
			}
			return [];
		}
		_resolveItemValue(item) {
			if (item == null) return item;
			if (typeof item !== "object") return item;
			if (this.keyValue && this.keyValue in item) return item[this.keyValue];
			if (!this.keyValue) {
				if ("value" in item) return item.value;
				return item;
			}
		}
		/** Whether `item` resolves to a value that can actually be stored (see above). */
		_isSelectable(item) {
			if (item == null || item.disabled) return false;
			return this._resolveItemValue(item) !== void 0;
		}
		_resolveItemDisplay(item) {
			if (item == null) return "";
			if (typeof this.displayValue === "function") return String(this.displayValue(item));
			if (typeof this.displayValue === "string" && this.displayValue) {
				if (typeof item === "object" && this.displayValue in item) return String(item[this.displayValue]);
				return "";
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
		* The model round-trips through the consumer's `ref`, which hands each tag back
		* wrapped in a **reactive Proxy**; `items` normally stays raw, so `proxy === row`
		* is false, an already-selected option reads as unselected, and clicking it
		* again APPENDS a duplicate instead of toggling it off. Comparing the raw
		* targets restores it. Still identity, not deep equality: two distinct rows with
		* equal contents remain different values.
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
		_arrayEqual(a, b) {
			if (a.length !== b.length) return false;
			return a.every((item, index) => this._isSameValue(item, b[index]));
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		/** Full normalized source (for resolving chip labels by value). */
		get _normalizedItems() {
			return this._normalizeItems(this._ds.sourceItems);
		}
		/** Normalized rows actually available to show (paged slice in array mode). */
		get _visibleItems() {
			return this._normalizeItems(this._ds.visibleItems);
		}
		/** Effective load-more mode (scroll is the default when enabled). */
		get _loadMoreMode() {
			const v = this.loadMore;
			if (v === void 0 || v === null || v === false) return void 0;
			return v === "button" ? "button" : "scroll";
		}
		/** Sanitised chunk size for array-mode paging (>= 1). */
		get _pageSize() {
			const n = Math.floor(Number(this.pageSize));
			return Number.isFinite(n) && n > 0 ? n : 10;
		}
		get _selectedValues() {
			return this.value ?? [];
		}
		get _hasValue() {
			return this._selectedValues.length > 0;
		}
		get _hasLabelSlot() {
			return this._hasLabelSlotState;
		}
		get _hasHelperSlot() {
			return this._hasHelperSlotState;
		}
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.errorMessage) return "invalid";
			if (this.successMessage) return "valid";
			return "default";
		}
		_isSelected(item) {
			const value = this._resolveItemValue(item);
			return this._selectedValues.some((v) => this._isSameValue(v, value));
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
			const query = this._inputValue.trim();
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
		/** Run the server search, reset to page 0. */
		async _applySearch(query) {
			if (!this._serverSearch()) return;
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
		/**
		* Clear the typed query — the visible one AND the one applied to the source.
		*
		* These are two independent tracks, and with a bound DataSource only the second
		* one actually filters anything: `_searchMatches` short-circuits to `true`
		* because the rows arrive pre-filtered. So clearing `_inputValue` on its own
		* looks like it worked and changes nothing, which is exactly how a query that
		* is no longer visible anywhere kept filtering the list.
		*
		* Cancelling the debounce FIRST is load-bearing: a timer armed before the reset
		* fires afterwards and re-applies the stale query.
		*/
		_resetSearch() {
			if (this._searchTimer) {
				clearTimeout(this._searchTimer);
				this._searchTimer = void 0;
			}
			const had = !!this._inputValue;
			this._inputValue = "";
			this._activeIndex = -1;
			if (had && this._serverSearch()) this._applySearch("");
		}
		/**
		* The single way the panel closes. Every exit resets the search, so reopening
		* never shows a list filtered by a query the box no longer holds.
		*/
		_close() {
			this._open = false;
			this._resetSearch();
		}
		/** Debounce a server search for the current input text. */
		_scheduleSearch() {
			if (!this.searchable || !this._serverSearch()) return;
			if (this._searchTimer) clearTimeout(this._searchTimer);
			const wait = Math.max(0, Number(this.searchDebounce) || 0);
			this._searchTimer = setTimeout(() => void this._applySearch(this._inputValue), wait);
		}
		/** Whether an option matches the current typed query. */
		_searchMatches(item) {
			if (!this.searchable) return true;
			if (this._serverSearch()) return true;
			const query = this._inputValue.trim().toLowerCase();
			if (!query) return true;
			if (this._hasSearchValue) {
				const pred = this._searchPredicate();
				return pred ? pred(item) : true;
			}
			const itemValue = this._resolveItemValue(item);
			const display = this._resolveItemDisplay(item).toLowerCase();
			const valueStr = itemValue == null ? "" : String(itemValue).toLowerCase();
			const desc = typeof item === "object" && item && typeof item.description === "string" ? item.description.toLowerCase() : "";
			const pred = this._searchPredicate();
			return display.includes(query) || valueStr.includes(query) || desc.includes(query) || (pred ? pred(item) : false);
		}
		/**
		* Grouping is active when `display-group` names at least one level — OR when the
		* source already loaded PRE-GROUPED `{ key, items }` nodes.
		*
		* The second half is what makes "feed pre-grouped data directly" actually work.
		* Without it, a devextreme DataSource carrying `group:` loaded its group nodes and,
		* because `displayGroup` was empty, they were treated as ordinary OPTIONS: the
		* headers became rows, `keyValue` was absent on them so they resolved to
		* `undefined`, and selecting one wrote `undefined` into the value.
		*
		* `group` mode is excluded: there the source is deliberately FLAT and
		* `display-group` is what buckets it client-side.
		*/
		get _grouped() {
			if (Array.isArray(this.displayGroup) && this.displayGroup.length > 0) return true;
			if (this.group) return false;
			const src = this._ds.sourceItems ?? [];
			return src.length > 0 && src.some((n) => this._isGroupNode(n));
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
		/** `group` mode: bucket flat rows into `{ [groupKey], [groupItems] }` by level. */
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
		/** Every leaf row (all loaded) — for chip-label / value lookup. */
		get _leafItems() {
			if (!this._grouped) return this._normalizedItems;
			if (this.group) return this._normalizeItems(this._ds.sourceItems);
			const out = [];
			const walk = (nodes) => {
				for (const n of nodes) if (this._isGroupNode(n)) walk(n[this.groupItems]);
				else if (n != null) out.push(n);
			};
			walk(this._ds.sourceItems ?? []);
			return out;
		}
		/** The nested group nodes to render — built client-side in `group` mode. */
		_groupNodes() {
			if (this.group) {
				const leaves = this._visibleItems.filter((it) => this._searchMatches(it));
				return this._buildClientTree(leaves);
			}
			return this._ds.visibleItems ?? [];
		}
		/**
		* Flatten the visible group tree into ordered render rows (headers + items).
		* `index` is the item's position among rendered leaves (drives `_activeIndex`
		* and keyboard nav). Leaves are search-filtered; empty groups are dropped.
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
							index: -1,
							level
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
						key: `g:${level}:${path}`,
						items: children.filter((r) => r.kind === "item").map((r) => r.item)
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
		/**
		* Where the keyboard cursor goes when the list opens: the row holding the most
		* recently picked tag, else the first row.
		*
		* "Most recent" is the TAIL of the value array — every add appends and nothing
		* sorts, so removing and re-adding a tag correctly moves it to the end. The
		* `Backspace` handler already leans on that same invariant.
		*
		* Selected rows stay in the suggestion list (see `_renderOption`), so this can
		* actually find them; the predicate is the one that paints `.selected`, so the
		* cursor lands on the row drawn as selected. `0` when the tag is not in the
		* loaded page — the behaviour this component has always had.
		*/
		_initialActiveIndex() {
			const items = this._filteredItems;
			if (!items.length) return -1;
			const values = this._selectedValues;
			const last = values.length ? values[values.length - 1] : void 0;
			if (last === void 0) return 0;
			const index = items.findIndex((item) => this._isSameValue(this._resolveItemValue(item), last));
			return index >= 0 ? index : 0;
		}
		get _filteredItems() {
			if (this._grouped) return this._groupRows().filter((r) => r.kind === "item").map((r) => r.item);
			return this._visibleItems.filter((item) => this._searchMatches(item));
		}
		/**
		* The selection limits in force: `chip.max` / `chip.min` pin, the element's
		* `max` / `min` are the fallback (the rule `chip.color` follows). Undefined =
		* unlimited / no floor.
		*/
		get _selectionLimits() {
			const chip = this._chipProps;
			return {
				max: resolveChipLimit(chip, "max", this.max),
				min: resolveChipLimit(chip, "min", this.min)
			};
		}
		/** Room left under `max`, or Infinity without one. */
		get _room() {
			const max = this._selectionLimits.max;
			return max === void 0 ? Infinity : Math.max(0, max - this._selectedValues.length);
		}
		get _canAddMore() {
			return this._room > 0;
		}
		/** The selection sits above its floor, so one more removal is allowed. */
		get _canRemoveMore() {
			const min = this._selectionLimits.min;
			return min === void 0 || this._selectedValues.length > min;
		}
		/**
		* A bulk deselect keeps the FIRST `min` values (selection order) — "remove
		* these" then means "down to the floor", the most a user gesture may do.
		*/
		_keepFloor(next) {
			const min = this._selectionLimits.min ?? 0;
			if (next.length >= min) return next;
			const kept = [...next];
			for (const v of this._selectedValues) {
				if (kept.length >= min) break;
				if (!kept.some((k) => this._isSameValue(k, v))) kept.push(v);
			}
			return this._selectedValues.filter((v) => kept.some((k) => this._isSameValue(k, v)));
		}
		get _wrapperClasses() {
			return [
				"mono-tag-input",
				this.size,
				this.color,
				this.variant,
				this._open ? "open" : "",
				this._moreOpen ? "more-open" : "",
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._resolvedValidationState !== "default" ? `is-${this._resolvedValidationState}` : "",
				this._hasValue ? "has-value" : "",
				this.checkable ? "checkable" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		/**
		* Whether the clear button renders. A getter because BOTH the field class list
		* and `render()` need it: the button is pinned to the top-right corner, and the
		* gutter that keeps wrapped chips from running under it is reserved by
		* `.has-clear` on the field.
		*/
		get _showClear() {
			return this.clearable && this._hasValue && !this.disabled && !this.readonly && !((this._selectionLimits.min ?? 0) > 0);
		}
		get _fieldClasses() {
			return [
				this._cls("mono-tag-input-field", "field"),
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._showClear ? "has-clear" : "",
				"has-actions",
				this._chipBehaviour === "inline" ? "is-inline" : "",
				this._inputValue ? "is-typing" : ""
			].filter(Boolean).join(" ");
		}
		_cacheKey(value) {
			if (value == null || typeof value === "object") return void 0;
			return String(value);
		}
		/**
		* Remember the rows behind `values` while they are still loaded.
		*
		* Called from `_setValue`, i.e. at the moment of selection — the row is in the
		* list by definition right then, which is why this needs no request. Values
		* that cannot be resolved yet are skipped, not cached as misses, so a later
		* load can still fill them in.
		*/
		_rememberSelected(values) {
			if (!this.keyValue) return;
			for (const value of values) {
				const key = this._cacheKey(value);
				if (key === void 0 || this._selectedItemCache.has(key)) continue;
				const item = this._findLoadedItem(value);
				if (item !== void 0) this._selectedItemCache.set(key, item);
			}
		}
		/** Look a value up in the currently loaded rows only. */
		_findLoadedItem(value) {
			return this._leafItems.find((item) => this._isSameValue(this._resolveItemValue(item), value));
		}
		_getItemByValue(value) {
			const loaded = this._findLoadedItem(value);
			if (loaded !== void 0) {
				const key = this._cacheKey(value);
				if (key !== void 0 && this.keyValue) this._selectedItemCache.set(key, loaded);
				return loaded;
			}
			const key = this._cacheKey(value);
			return key === void 0 ? void 0 : this._selectedItemCache.get(key);
		}
		/**
		* Whether this value still has no row behind it — the list has not loaded it (or
		* not loaded yet).
		*
		* Only meaningful when `keyValue` is set: that prop is the statement "values are
		* KEYS into the items", so an unmatched key has no label anyone would want to
		* read — showing the bare key renders a chip like `1` or `1|MKT`. Without
		* `keyValue` the value IS its own label (and `allow-custom` tags rely on that),
		* so nothing is ever hidden there.
		*/
		_isUnresolvedKey(value) {
			if (!this.keyValue) return false;
			if (value == null) return false;
			if (typeof value === "object") return false;
			return this._getItemByValue(value) === void 0;
		}
		_getLabelByValue(value) {
			const item = this._getItemByValue(value);
			if (item) return this._resolveItemDisplay(item);
			if (value == null) return "";
			if (typeof value === "object") return this._resolveItemDisplay(value);
			if (this._isUnresolvedKey(value)) return "";
			return String(value);
		}
		_createModelDetail(args) {
			return {
				modelValue: args.modelValue,
				currentValue: args.modelValue,
				oldValue: args.oldValue,
				value: args.modelValue,
				addedValue: args.addedValue,
				removedValue: args.removedValue,
				selectedItem: args.addedValue !== void 0 ? this._getItemByValue(args.addedValue) : void 0,
				sourceEvent: args.sourceEvent
			};
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_emitAdd(detail) {
			dispatchMonoEvent(this, "add", detail);
		}
		_emitRemove(detail) {
			dispatchMonoEvent(this, "remove", detail);
		}
		_emitClear(detail) {
			dispatchMonoEvent(this, "clear", detail);
		}
		_setValue(nextValue, args = {}) {
			const oldValue = [...this._selectedValues];
			const normalized = [...nextValue];
			this._rememberSelected(normalized);
			this.value = normalized;
			this.modelValue = normalized;
			const detail = this._createModelDetail({
				modelValue: normalized,
				oldValue,
				addedValue: args.addedValue,
				removedValue: args.removedValue,
				sourceEvent: args.sourceEvent
			});
			this._emitChange(detail);
			if (args.emitAdd) this._emitAdd(detail);
			if (args.emitRemove) this._emitRemove(detail);
			if (args.emitClear) this._emitClear(detail);
			if (args.emitAdd && this._chipBehaviour === "inline") this.updateComplete.then(() => this._chipStrip.scrollToEnd());
		}
		_addValue(value, event) {
			if (this.disabled || this.readonly) return;
			if (!this._canAddMore) return this._resetSearch();
			if (!this.allowCustom && !this._getItemByValue(value)) return;
			if (!this._selectedValues.some((v) => this._isSameValue(v, value))) this._setValue([...this._selectedValues, value], {
				addedValue: value,
				sourceEvent: event,
				emitAdd: true
			});
			this._close();
			this._inputEl?.focus();
		}
		/**
		* Checkbox-mode toggle: add or remove a value while keeping the dropdown open
		* (and the typed filter intact), so the user can check several rows in a row.
		*/
		_toggleValue(value, event) {
			if (this.disabled || this.readonly) return;
			if (this._selectedValues.some((v) => this._isSameValue(v, value))) {
				if (!this._canRemoveMore) return;
				this._setValue(this._selectedValues.filter((v) => !this._isSameValue(v, value)), {
					removedValue: value,
					sourceEvent: event,
					emitRemove: true
				});
			} else {
				if (!this._canAddMore) return this._resetSearch();
				this._setValue([...this._selectedValues, value], {
					addedValue: value,
					sourceEvent: event,
					emitAdd: true
				});
			}
			if (!this.checkable) {
				this._close();
				this._inputEl?.focus();
				return;
			}
			this._open = true;
			this._inputEl?.focus();
		}
		/**
		* How much of `items` is selected — what paints a select-all box unchecked,
		* indeterminate or checked. Disabled options are ignored, so a group whose only
		* unselected row is disabled still reads as fully selected.
		*/
		_selectionStateOf(items) {
			const usable = items.filter((item) => this._isSelectable(item));
			if (!usable.length) return "none";
			let hit = 0;
			for (const item of usable) if (this._isSelected(item)) hit += 1;
			if (hit === 0) return "none";
			return hit === usable.length ? "all" : "some";
		}
		/**
		* Whether the "All" row reaches the SERVER rather than the loaded rows.
		*
		* Gated on a bound `DataSource` + `load-more`, which together mean "the list is
		* a window onto something bigger". A plain `items` array is static and already
		* wholly in memory, so it keeps the loaded-only behaviour.
		*/
		get _serverSelectAll() {
			return !!this.dataSource && !!this._loadMoreMode;
		}
		/** The source's own page size, when it pages; `0` otherwise. */
		_sourcePageSize() {
			const ds = this.dataSource;
			if (!ds || typeof ds.pageSize !== "function") return 0;
			if (typeof ds.paginate === "function" && !ds.paginate()) return 0;
			const n = Number(ds.pageSize());
			return Number.isFinite(n) && n > 0 ? n : 0;
		}
		/** The source's row count, when it knows one. */
		_serverTotal() {
			const n = Number(this.dataSource?.totalCount?.());
			return Number.isFinite(n) && n >= 0 ? n : void 0;
		}
		/**
		* The "All" box, judged against the SERVER total rather than the loaded rows.
		*
		* Without this the box reads `'all'` the moment the loaded page is selected —
		* and the next click would CLEAR, so the drain could never be reached. Every
		* state below `all` therefore has to mean "clicking me selects more".
		*
		* BOTH halves of the `'all'` test matter, and each rules out a way of being
		* wrong. `_selectionStateOf` alone says `'all'` after one page of 250. The count
		* alone says `'all'` whenever the selection is merely LARGER than the total,
		* which a search makes routine: hold 111 rows, narrow the query to 11, and a
		* bare `111 >= 11` paints a finished box over eleven rows none of which are
		* selected — and the next click would clear instead of selecting them.
		*
		* Falls back to the loaded-scope reading when the source cannot say how many
		* rows it has, which is the honest answer: nothing here can tell whether the
		* selection is complete.
		*/
		_selectAllState(usable) {
			const loaded = this._selectionStateOf(usable);
			if (!this._serverSelectAll) return loaded;
			const total = this._serverTotal();
			if (total === void 0) return loaded;
			if (loaded === "all" && total > 0 && this._selectedValues.length >= total) return "all";
			return this._selectedValues.length > 0 ? "some" : "none";
		}
		/**
		* Select every row the source returns for the CURRENT search — the tag-input's
		* counterpart to `<mono-table-checkbox type="all">`.
		*
		* `readAllRows` walks the store in chunks and rebuilds the source's live filter
		* plus its folded search (`searchFilterOf`), so this means "everything the user
		* is currently looking at", not the whole table. Deliberately NOT routed through
		* `_ds`: its `_onChanged` resets the accumulated pages whenever a `changed`
		* fires outside its own load, and `readAllRows` talks to the store directly.
		*/
		async _selectAllFromServer(event) {
			if (this._selectAllPending) return;
			if (this._searchTimer) {
				clearTimeout(this._searchTimer);
				this._searchTimer = void 0;
				await this._applySearch(this._inputValue);
			}
			this._selectAllPending = true;
			try {
				const rows = await readAllRows(this.dataSource, { chunkSize: Math.max(1, this._pageSize, this._sourcePageSize()) });
				const usable = this._normalizeItems(rows).filter((item) => this._isSelectable(item));
				const values = usable.map((item) => this._resolveItemValue(item));
				const seen = new Set(this._selectedValues.map((v) => this._cacheKey(v)).filter((k) => k !== void 0));
				const additions = [];
				for (let i = 0; i < values.length; i++) {
					const key = this._cacheKey(values[i]);
					if (key !== void 0 && seen.has(key)) continue;
					if (key !== void 0) seen.add(key);
					additions.push(values[i]);
					if (key !== void 0 && this.keyValue) this._selectedItemCache.set(key, usable[i]);
				}
				if (!additions.length) return;
				const room = this._room;
				if (!room) return;
				this._setValue([...this._selectedValues, ...additions.slice(0, room)], {
					sourceEvent: event,
					emitAdd: true
				});
			} finally {
				this._selectAllPending = false;
				this._open = true;
				this._inputEl?.focus();
			}
		}
		/**
		* Where the "All" row's click goes.
		*
		* Only a state BELOW `all` drains; once `_selectAllState` says everything on the
		* server is held, the row goes back to being a clear button. `_toggleMany` still
		* owns both directions for a plain `items` array.
		*
		* A drain is for the rows NOT yet here. Once the controller has walked the source
		* to its last page — `load-more` scrolled to the end, or a source whose whole
		* result fit its first page — every row the query matches is already in
		* memory, and `items` (the visible, server-filtered set) IS the answer: select
		* it as a plain array would, with no request. A query still inside its debounce
		* disqualifies that shortcut, because the loaded rows belong to the PREVIOUS
		* search; the drain path flushes it first.
		*/
		_onSelectAllClick(items, state, event) {
			if (this._selectAllPending) return;
			if (!this._serverSelectAll) {
				this._toggleMany(items, event);
				return;
			}
			if (state !== "all") {
				if (this._ds.atLastPage && !this._searchTimer) {
					this._toggleMany(items, event);
					return;
				}
				this._selectAllFromServer(event);
				return;
			}
			this._clearAllFromServer(event);
		}
		/**
		* Untick "All" after a drain.
		*
		* NOT `_toggleMany`: that only removes the values present in `items`, which on a
		* paged source is one page — so clearing 1,085 drained rows would drop ten of
		* them and leave the box reading `'some'`. `'all'` here means the selection is
		* the drain, so the inverse is emptying it, the same reading
		* `<mono-table-checkbox>` gives its own clear.
		*/
		_clearAllFromServer(event) {
			if (this.disabled || this.readonly) return;
			if (!this._selectedValues.length) return;
			this._setValue([], {
				sourceEvent: event,
				emitRemove: true
			});
			this._open = true;
			this._inputEl?.focus();
		}
		/**
		* Select every one of `items`, or clear them all if they are already selected —
		* the "All" row and every group header run through here.
		*
		* ONE `_setValue` call, so a bulk toggle is a single `mno-change` carrying the
		* whole next array rather than N events a consumer would have to coalesce.
		* `addedValue` / `removedValue` are deliberately left undefined for the same
		* reason: there is no single value to name, and guessing one would be worse than
		* saying nothing (`modelValue` and `oldValue` carry the full before/after).
		*/
		_toggleMany(items, event) {
			if (this.disabled || this.readonly) return;
			const usable = items.filter((item) => this._isSelectable(item));
			if (!usable.length) return;
			const values = usable.map((item) => this._resolveItemValue(item));
			const current = this._selectedValues;
			const isOn = (v) => current.some((c) => this._isSameValue(c, v));
			if (values.every(isOn)) this._setValue(this._keepFloor(current.filter((c) => !values.some((v) => this._isSameValue(c, v)))), {
				sourceEvent: event,
				emitRemove: true
			});
			else {
				const missing = values.filter((v) => !isOn(v));
				const room = Math.min(missing.length, this._room);
				if (!room) return;
				this._setValue([...current, ...missing.slice(0, room)], {
					sourceEvent: event,
					emitAdd: true
				});
			}
			this._open = true;
			this._inputEl?.focus();
		}
		_removeValue(value, event) {
			event?.stopPropagation();
			if (this.disabled || this.readonly) return;
			if (!this._canRemoveMore) return;
			this._setValue(this._selectedValues.filter((item) => !this._isSameValue(item, value)), {
				removedValue: value,
				sourceEvent: event,
				emitRemove: true
			});
			this._inputEl?.focus();
		}
		_clear(event) {
			event.stopPropagation();
			if (this.disabled || this.readonly) return;
			this._setValue(this._keepFloor([]), {
				sourceEvent: event,
				emitClear: true
			});
			this._close();
			this._inputEl?.focus();
		}
		_handleInput(event) {
			if (this.disabled || this.readonly) return;
			const input = event.currentTarget;
			if (!this.searchable) {
				input.value = "";
				return;
			}
			this._inputValue = input.value;
			this._open = true;
			this._activeIndex = this._filteredItems.length ? 0 : -1;
			this._cursorPending = false;
			this._scheduleSearch();
		}
		/**
		* Focus alone opens nothing: a Tab into the field is not a request to see the
		* list — typing, ↓, a click in a searchable field or the chevron are. (It used
		* to open, which also meant every chip-remove's refocus popped the list.)
		*/
		_handleFocus() {}
		/**
		* A click in the field focuses the input and, when the field is searchable,
		* OPENS the list — the input is the point there, and clicking into it is how
		* you start typing; it never closes, because a click in a text input while
		* the list is open is caret placement, not a toggle (the chevron, Escape and
		* an outside click close). A non-searchable field has nothing to type into,
		* so there the click TOGGLES: a second click on the field closes the list.
		*/
		_handleFieldClick() {
			if (this.disabled || this.readonly) return;
			this._inputEl?.focus();
			this._moreOpen = false;
			if (this.searchable) this._open = true;
			else if (this._open) this._close();
			else this._open = true;
		}
		/** The chevron: the one mouse gesture that both opens and closes. */
		_toggleFromCaret(event) {
			event.stopPropagation();
			if (this.disabled || this.readonly) return;
			this._moreOpen = false;
			if (this._open) this._close();
			else {
				this._open = true;
				this._inputEl?.focus();
			}
		}
		_handleKeydown(event) {
			if (this.disabled || this.readonly) return;
			const items = this._filteredItems;
			if (event.key === "ArrowDown") {
				event.preventDefault();
				this._open = true;
				this._activeIndex = items.length ? Math.min(this._activeIndex + 1, items.length - 1) : -1;
				return;
			}
			if (event.key === "ArrowUp") {
				event.preventDefault();
				this._activeIndex = items.length ? Math.max(this._activeIndex - 1, 0) : -1;
				return;
			}
			if (event.key === "Enter") {
				event.preventDefault();
				const activeItem = this._activeIndex >= 0 ? items[this._activeIndex] : void 0;
				if (activeItem && !activeItem.disabled) {
					this._toggleValue(this._resolveItemValue(activeItem), event);
					return;
				}
				const customValue = this._inputValue.trim();
				if (customValue && this.allowCustom) this._addValue(customValue, event);
				return;
			}
			if (event.key === "," || event.key === "Tab") {
				const customValue = this._inputValue.trim();
				if (customValue && this.allowCustom) {
					event.preventDefault();
					this._addValue(customValue, event);
				}
				return;
			}
			if (event.key === "Backspace" && !this._inputValue && this._selectedValues.length) {
				event.preventDefault();
				const lastValue = this._selectedValues[this._selectedValues.length - 1];
				this._removeValue(lastValue, event);
				return;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				this._close();
			}
		}
		_renderLabel() {
			const hasContent = !!this.label || this._hasLabelSlotState;
			if (!hasContent && !this._slotsAlwaysRender) return nothing;
			return html`
      <label
        class=${this._cls("mono-tag-input-label", "label")}
        mono-label
        for=${this._inputId}
        ?mono-empty=${!hasContent}
      >
        ${this._slotOutlet("label", this.label)}

        ${this.required ? html`
              <span class=${this._cls("mono-tag-input-required", "required")} mono-required-mark>
                *
              </span>
            ` : nothing}
      </label>
    `;
		}
		/**
		* How many chips to draw before the rest collapse into "+N more" — Infinity
		* when uncapped or while the total sits under the collapse floor
		* (`visibleChipCap`). `chip.maxVisible` / `chip.minVisible` pin, the element
		* props are the fallback. Applies to `inline` as well: the "+N more" chip
		* then sits in the strip after the visible ones, and its panel lists the rest
		* exactly as in `flex`. Every downstream consumer (`_overflowChips`,
		* `_renderChips`, the more panel) reads this, so the rule lives in one place.
		*/
		get _maxChips() {
			const chip = this._chipProps;
			return visibleChipCap(this._resolvedValues.length, resolveChipLimit(chip, "maxVisible", this.maxVisible), resolveChipLimit(chip, "minVisible", this.minVisible));
		}
		/** Selected values that have a row behind them — what the chips actually draw. */
		get _resolvedValues() {
			return this._selectedValues.filter((v) => !this._isUnresolvedKey(v));
		}
		get _overflowChips() {
			const max = this._maxChips;
			return max === Infinity ? [] : this._resolvedValues.slice(max);
		}
		_closeSvg() {
			return this.renderIcon("close");
		}
		/** The `chip` prop, always an object (it can be assigned null from a binding). */
		get _chipProps() {
			return this.chip ?? {};
		}
		/** Chip layout: `inline` = one scrolling line, anything else = today's wrap. */
		get _chipBehaviour() {
			return this._chipProps.behaviour === "inline" ? "inline" : "flex";
		}
		/**
		* Chip skin matching the field skin: a `filled` field already tints its own
		* surface, so a soft chip would vanish into it — go solid; `underlined` is
		* minimal, so the chip stays outline. `chip.variant` pins one instead.
		*/
		get _chipVariantClass() {
			const pinned = this._chipProps.variant;
			if (pinned) return pinned;
			if (this.variant === "filled") return "solid";
			if (this.variant === "underlined") return "outline";
			return "soft";
		}
		/** Chips wear the control's color unless `chip.color` pins another. */
		get _chipColorClass() {
			return this._chipProps.color ?? this.color;
		}
		/**
		* Classes shared by the tag chips and the "+N more" chip, in `mono-chip`'s own
		* order (`mono-chip <size> <variant>-<color> <shape>`), so chip.css paints them
		* exactly as it paints a real `<mono-chip>`.
		*
		* `mono-tag-input-chip` is a marker only — it scopes the `--mono-chip-*` bridge
		* in tag-input.css so the bridge never reaches a `<mono-chip>` a consumer slots
		* into the field. `chip.color` deliberately picks a hue OTHER than the control
		* accent, so it adds the `-pinned` marker that switches the bridge back off.
		*/
		get _chipBaseClasses() {
			const chip = this._chipProps;
			return [
				"mono-tag-input-chip",
				chip.color ? "mono-tag-input-chip-pinned" : "",
				chip.size ?? (this.size === "xs" || this.size === "sm" ? "xs" : "sm"),
				`${this._chipVariantClass}-${this._chipColorClass}`,
				"",
				chip.dot ? "has-dot" : ""
			].filter(Boolean).join(" ");
		}
		/**
		* Class for one chip part. Both class APIs append: the tag-input-level key
		* (`cssClass.chip` / `.chipLabel` / `.chipRemove`, the established surface) and
		* the chip-level one (`chip.cssClass.*`, which additionally reaches the parts
		* tag-input has no key for — `main`, `content`, `dot`).
		*/
		_chipCls(base, chipKey, key) {
			return [
				base,
				key ? this.cssClass?.[key] : void 0,
				this._chipProps.cssClass?.[chipKey]
			].filter(Boolean).join(" ");
		}
		/** Render one chip with shared mono-chip markup/classes. */
		_renderChip(value, removable) {
			const chip = this._chipProps;
			const label = this._getLabelByValue(value);
			const canRemove = removable && !this.disabled && !this.readonly && this._canRemoveMore;
			return html`
      <div
        class=${this._chipCls(`${this._chipBaseClasses}${canRemove ? " removable" : ""}`, "root", "chip")}
        mono-chip
        ?mono-removable=${canRemove}
        mono-chip-color=${chip.color ?? nothing}
      >
        <span class=${ifDefined(chip.cssClass?.main)} mono-chip-main>
          <span class=${this._chipCls("chip-content", "content")} mono-chip-content>
            ${chip.dot ? html`<span
                  class=${this._chipCls("chip-dot", "dot")}
                  mono-chip-dot
                  aria-hidden="true"
                ></span>` : nothing}
            <span class=${this._chipCls("chip-label", "label", "chipLabel")} mono-chip-label>${label}</span>
            ${canRemove ? html`
                  <button
                    type="button"
                    class=${this._chipCls("chip-close", "close", "chipRemove")}
                    mono-chip-close
                    aria-label=${chip.closeLabel ?? `Remove ${label}`}
                    @click=${(event) => this._removeValue(value, event)}
                  >
                    ${this._closeSvg()}
                  </button>
                ` : nothing}
          </span>
        </span>
      </div>
    `;
		}
		/**
		* The chip region. `flex` returns the chips as bare siblings of the input, so
		* they wrap with it — the historical markup, unchanged. `inline` nests them in
		* one `overflow-x: hidden` strip instead, which is what makes the row scroll
		* as a unit while the input keeps its own space beside it.
		*/
		_renderChipRegion() {
			const chips = this._renderChips();
			if (this._chipBehaviour !== "inline") return chips;
			return html`
      <div class=${this._cls("mono-tag-input-chip-strip", "chipStrip")} mono-chip-strip>${chips}</div>
    `;
		}
		_renderChips() {
			const max = this._maxChips;
			const visible = max === Infinity ? this._resolvedValues : this._resolvedValues.slice(0, max);
			this._renderedChipCount = visible.length;
			const chips = visible.map((value) => this._renderChip(value, true));
			const overflow = this._overflowChips;
			if (overflow.length) chips.push(html`
        <div
          class=${this._cls(`${this._chipBaseClasses.replace(" has-dot", "")} clickable mono-tag-input-more`, "moreChip")}
          mono-chip
          mono-more
          mono-chip-color=${this._chipProps.color ?? nothing}
        >
          <span
            class=${ifDefined(this._chipProps.cssClass?.main)}
            mono-chip-main
            role="button"
            tabindex="0"
            @mousedown=${(event) => event.preventDefault()}
            @click=${(event) => {
				event.stopPropagation();
				this._moreOpen = !this._moreOpen;
				if (this._moreOpen) this._close();
			}}
          >
            <span class=${this._chipCls("chip-content", "content")} mono-chip-content>
              <span class=${this._chipCls("chip-label", "label")} mono-chip-label>+${overflow.length} more</span>
            </span>
          </span>
        </div>
      `);
			return chips;
		}
		/**
		* The trailing control row: `‹ › ✕` or `‹ › ⌄`.
		*
		* The scroll buttons only exist in `inline` mode, and each only while there is
		* something to scroll toward — so a strip that fits shows neither, and a strip
		* parked at its start shows only `›`.
		*
		* Clear and caret are MUTUALLY EXCLUSIVE, in both layouts: whenever the clear
		* button is available the field has a value and clearing is the useful action,
		* and whenever it is not (empty field, or `clearable`/`disabled`/`readonly`
		* ruling it out) the caret advertises the dropdown instead. That keeps the row
		* one glyph wide, which is what lets `flex` mode go on reserving a single-icon
		* gutter.
		*
		* The scroll buttons suppress `mousedown` and stay out of the tab order: they
		* are a view control, so paging must not blur the input (which would close the
		* dropdown mid-interaction) or move focus off the field. The clear button
		* keeps its existing focus behaviour.
		*/
		/**
		* One scroll button. `active` false keeps the box — and therefore the row's
		* width — but hides it (`is-idle` → `visibility: hidden`), so reaching an end
		* of the strip costs no layout. `disabled` and `aria-hidden` keep the hidden
		* one out of reach of the pointer and of assistive tech.
		*/
		_renderScrollButton(dir, active) {
			const back = dir === -1;
			const base = `mono-tag-input-scroll mono-tag-input-scroll-${back ? "prev" : "next"}${active ? "" : " is-idle"}`;
			return html`
      <button
        type="button"
        class=${this._cls(base, back ? "scrollPrev" : "scrollNext")}
        mono-scroll=${back ? "prev" : "next"}
        ?mono-idle=${!active}
        aria-label=${back ? "Scroll tags backward" : "Scroll tags forward"}
        aria-hidden=${active ? "false" : "true"}
        ?disabled=${!active}
        tabindex="-1"
        @mousedown=${(event) => event.preventDefault()}
        @click=${(event) => {
				event.stopPropagation();
				this._chipStrip.page(dir);
			}}
      >
        ${chevronIcon(dir)}
      </button>
    `;
		}
		_renderActions() {
			const showScroll = this._chipBehaviour === "inline" && this._chipStrip.overflowing;
			const showArrow = !this._showClear && !this.disabled && !this.readonly;
			return html`
      <div class=${this._cls("mono-tag-input-actions", "actions")} mono-actions>
        ${showScroll ? html`
              ${this._renderScrollButton(-1, this._chipStrip.canScrollStart)}
              ${this._renderScrollButton(1, this._chipStrip.canScrollEnd)}
            ` : nothing}
        ${this._showClear ? html`
              <button
                type="button"
                class=${this._cls("mono-tag-input-clear", "clear")}
                mono-clear
                aria-label="Clear tags"
                @click=${this._clear}
              >
                ${this.renderIcon("close")}
              </button>
            ` : nothing}
        ${showArrow ? html`
              <span
                role="button"
                tabindex="-1"
                class=${this._cls("mono-tag-input-arrow", "arrow")}
                mono-arrow
                aria-label="Toggle suggestions"
                aria-expanded=${this._open ? "true" : "false"}
                @mousedown=${(event) => event.preventDefault()}
                @click=${this._toggleFromCaret}
              >
                ${caretIcon()}
              </span>
            ` : nothing}
      </div>
    `;
		}
		/**
		* Always rendered, shown by the root's `more-open` class: the panel lives in a
		* body portal while open and a portaled node cannot be removed by a
		* conditional render (Lit's ChildPart no longer contains it).
		*/
		_renderMorePanel() {
			const overflow = this._moreOpen ? this._overflowChips : [];
			return html`
      <div class=${this._cls("mono-tag-input-more-panel", "morePanel")} mono-more-panel>
        ${overflow.map((value) => this._renderChip(value, true))}
      </div>
    `;
		}
		_toCssLength(value) {
			if (value == null || value === "") return void 0;
			if (typeof value === "number") return `${value}px`;
			const trimmed = String(value).trim();
			if (!trimmed) return void 0;
			return /^-?\d+(?:\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
		}
		/**
		* The author's cap goes out as the custom property `--_mono-tag-input-panel-max-h`
		* rather than a direct `max-height`: the popup controller also constrains this
		* same element (via `--mono-popup-avail-h`) to keep it inside the viewport, and
		* two writers on one declaration would clobber each other. The CSS `min()`s them.
		*/
		get _dropdownStyle() {
			const style = {};
			const panel = this.dropdown;
			const width = toCssSize(panel?.width);
			if (width) style.width = width;
			const minWidth = toCssSize(panel?.minWidth);
			if (minWidth) style["min-width"] = minWidth;
			const maxWidth = toCssSize(panel?.maxWidth);
			if (maxWidth) style["max-width"] = maxWidth;
			const minHeight = toCssSize(panel?.minHeight);
			if (minHeight) style["min-height"] = minHeight;
			const height = toCssSize(panel?.height) ?? this._toCssLength(this.dropdownHeight);
			if (height) style.height = height;
			const maxHeight = toCssSize(panel?.maxHeight) ?? this._toCssLength(this.dropdownMaxHeight);
			if (maxHeight) style["--_mono-tag-input-panel-max-h"] = maxHeight;
			else if (height) style["--_mono-tag-input-panel-max-h"] = height;
			else if (this._scrollAutoMaxHeight) style["--_mono-tag-input-panel-max-h"] = this._scrollAutoMaxHeight;
			return style;
		}
		/**
		* Scroll-mode ergonomics (see mono-select): cap the list height to the loaded
		* rows minus a sliver so a short page is still scrollable, instead of eagerly
		* fetching another page on open.
		*/
		_updateScrollAutoHeight() {
			const userSetHeight = this._toCssLength(this.dropdownHeight) != null || this._toCssLength(this.dropdownMaxHeight) != null || toCssSize(this.dropdown?.height) != null || toCssSize(this.dropdown?.maxHeight) != null;
			const rowsShown = this._filteredItems.length;
			if (!(this._loadMoreMode === "scroll" && this._open && !this._ds.atLastPage && !userSetHeight && rowsShown > 0)) {
				this._setScrollAutoMaxHeight("");
				return;
			}
			const el = this._dropdownEl;
			const rowH = (el?.querySelector(".mono-tag-input-item"))?.offsetHeight ?? 0;
			if (!el || !rowH) return;
			const CAP_ROWS = 7;
			let visible = Math.min(rowsShown, CAP_ROWS);
			if (rowsShown <= CAP_ROWS) visible -= .5;
			this._setScrollAutoMaxHeight(`${Math.round(visible * rowH)}px`);
		}
		_setScrollAutoMaxHeight(value) {
			if (value === this._scrollAutoMaxHeight) return;
			queueMicrotask(() => {
				this._scrollAutoMaxHeight = value;
			});
		}
		_renderLoadMore() {
			if (!this._loadMoreMode) return nothing;
			if (!this._visibleItems.length || this._ds.atLastPage) return nothing;
			if (this._ds.loadingMore) return html`
        <div class=${`${this._cls("mono-tag-input-load-more", "loadMore")} loading`} mono-load-more mono-loading>
          Loading…
        </div>
      `;
			if (this._loadMoreMode !== "button") return nothing;
			return html`
      <button
        type="button"
        class=${this._cls("mono-tag-input-load-more", "loadMore")}
        mono-load-more
        @mousedown=${(event) => event.preventDefault()}
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
		/**
		* The reused `.mono-checkbox` box. Tri-state: `'some'` paints the indeterminate
		* dash, which is what tells a user a group is PARTLY selected — the one thing a
		* two-state box could not say.
		*/
		_renderCheckBox(state, loading = false) {
			const cls = [
				this._cls("mono-checkbox", "check"),
				this.color,
				state === "all" ? "mono-checkbox-checked" : "",
				state === "some" ? "mono-checkbox-indeterminate" : "",
				loading ? "is-loading" : ""
			].filter(Boolean).join(" ");
			const boxCls = [
				"mono-checkbox-box",
				"sm",
				loading ? "has-custom-icon has-custom-indeterminate-icon" : ""
			].filter(Boolean).join(" ");
			return html`
      <span
        class=${cls}
        mono-check-box
        mono-checkbox
        mono-size="sm"
        mono-color=${this.color === "primary" ? nothing : this.color}
        ?mono-checked=${state === "all"}
        ?mono-indeterminate=${state === "some"}
        ?mono-loading=${loading}
        aria-hidden="true"
      >
        <span class=${boxCls} mono-box ?mono-custom-icon=${loading} ?mono-custom-indeterminate-icon=${loading}>${loading ? this._renderCheckSpinner() : nothing}</span>
      </span>
    `;
		}
		/**
		* The drain spinner. Inline SVG rather than the `i-mdi-loading` UnoCSS class
		* because a page stylesheet cannot reach the shadow build's root — one template
		* serves both, the same reason `composables/field-icons` exists.
		*
		* `.mono-checkbox-spinner` carries the sizing and the keyframes; checkbox.css is
		* already on the page for the light build and adopted into the shadow root for
		* the other, which is what the box itself depends on too.
		*/
		_renderCheckSpinner() {
			return html`<svg
      class="mono-checkbox-spinner"
      mono-spinner
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>`;
		}
		/**
		* The leading "All" row. Scoped to the rows the current search leaves visible,
		* which is what `items` already is at every call site.
		*
		* `role="option"` because that is what it behaves like — an option meaning "every
		* one of these" — so a screen reader announces it inside the same listbox as the
		* rows it toggles.
		*/
		_renderSelectAll(items) {
			if (!this.selectAll || this.disabled || this.readonly) return nothing;
			const usable = items.filter((item) => this._isSelectable(item));
			if (!usable.length) return nothing;
			const state = this._selectAllState(usable);
			const pending = this._selectAllPending;
			return html`
      <button
        type="button"
        role="option"
        class=${[
				this._cls("mono-tag-input-item", "item"),
				this._cls("mono-tag-input-select-all", "selectAll"),
				"has-check",
				state !== "none" ? "selected" : "",
				pending ? "is-loading" : ""
			].filter(Boolean).join(" ")}
        mono-item
        mono-select-all
        mono-check
        ?mono-selected=${state !== "none"}
        ?mono-loading=${pending}
        aria-selected=${state === "all" ? "true" : "false"}
        aria-busy=${pending ? "true" : "false"}
        ?disabled=${pending}
        @mousedown=${(event) => event.preventDefault()}
        @click=${(event) => this._onSelectAllClick(usable, state, event)}
      >
        ${this._renderCheckBox(state, pending)}
        <div class=${this._cls("mono-tag-input-item-text", "itemText")} mono-item-text>
          <div class=${this._cls("mono-tag-input-item-title", "itemTitle")} mono-item-title>
            ${this.selectAllLabel}
          </div>
        </div>
      </button>
    `;
		}
		/**
		* A group header — a plain label, or its own select-all when `groupSelectAll` is
		* on and the group has rows to toggle. It stays a header either way: same class,
		* same sticky behaviour, same indent, so a grouped list does not reflow when the
		* feature is switched off.
		*/
		_renderGroupHeader(row) {
			const base = `${this._cls("mono-tag-input-group", "group")}${this.groupSticky ? " sticky" : ""}`;
			const usable = row.items.filter((item) => this._isSelectable(item));
			if (!this.groupSelectAll || this.disabled || this.readonly || !usable.length) return html`<div class=${base} mono-group mono-level=${row.level} ?mono-sticky=${this.groupSticky} data-level=${row.level} role="presentation">
        ${row.label}
      </div>`;
			const state = this._selectionStateOf(usable);
			return html`
      <button
        type="button"
        class=${`${base} is-toggle${state !== "none" ? " selected" : ""}`}
        mono-group
        mono-toggle
        mono-level=${row.level}
        ?mono-sticky=${this.groupSticky}
        ?mono-selected=${state !== "none"}
        data-level=${row.level}
        aria-pressed=${state === "all" ? "true" : "false"}
        @mousedown=${(event) => event.preventDefault()}
        @click=${(event) => this._toggleMany(usable, event)}
      >
        ${this._renderCheckBox(state)}
        <span class=${this._cls("mono-tag-input-group-label", "groupLabel")} mono-group-label>
          ${row.label}
        </span>
      </button>
    `;
		}
		/**
		* The flat entry list published to `form.items()[key].list`.
		*
		* The SAME sequence the component renders — group headers interleaved with their leaves — so a
		* consumer looping it produces one node per row, in order, and the two stay paired by position
		* with nothing to key by hand. `_groupRows()` already computes exactly this for the grouped case.
		*
		* `key` is `item[keyValue]` via `_resolveItemValue`, the same value selection is keyed by, so the
		* feature introduces no second notion of a key.
		*/
		_listEntries() {
			const rowEntry = (item, level, index) => ({
				type: "row",
				key: String(this._resolveItemValue(item) ?? ""),
				item,
				level,
				selected: this._isSelected(item),
				active: index >= 0 && index === this._activeIndex
			});
			if (this._grouped) return this._groupRows().map((row) => row.kind === "group" ? {
				type: "group",
				key: row.key,
				label: row.label,
				level: row.level,
				items: row.items
			} : rowEntry(row.item, row.level, row.index));
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
		_renderOption(item, index, level = 0) {
			const active = index === this._activeIndex;
			const checked = this._isSelected(item);
			const itemClass = [
				this._cls("mono-tag-input-item", "item"),
				this.checkable ? "has-check" : "",
				active ? `active ${this.cssClass?.itemActive ?? ""}` : "",
				checked ? `selected ${this.cssClass?.itemSelected ?? ""}` : "",
				item.disabled ? `disabled ${this.cssClass?.itemDisabled ?? ""}` : ""
			].filter(Boolean).join(" ");
			const itemValue = this._resolveItemValue(item);
			return html`
      <button
        type="button"
        role="option"
        class=${itemClass}
        mono-item
        ?mono-check=${this.checkable}
        ?mono-active=${active}
        ?mono-selected=${checked}
        ?mono-disabled=${!!item.disabled}
        mono-level=${level}
        data-level=${level}
        aria-selected=${checked ? "true" : "false"}
        ?disabled=${item.disabled}
        @mousedown=${(event) => event.preventDefault()}
        @click=${(event) => itemValue === void 0 ? void 0 : this._toggleValue(itemValue, event)}
      >
        ${this.checkable ? this._renderCheckBox(checked ? "all" : "none") : nothing}

        <div class=${this._cls("mono-tag-input-item-text", "itemText")} mono-item-text>
          <div class=${this._cls("mono-tag-input-item-title", "itemTitle")} mono-item-title>
            ${this._resolveItemDisplay(item)}
          </div>

          ${item.description ? html`
                <div class=${this._cls("mono-tag-input-item-sub", "itemSub")} mono-item-sub>
                  ${item.description}
                </div>
              ` : nothing}
        </div>
      </button>
    `;
		}
		_renderEmpty() {
			const text = this.dataSource && this._ds.loading ? "Loading…" : "No items";
			return html`<div class=${this._cls("mono-tag-input-empty", "empty")} mono-empty-row>${text}</div>`;
		}
		_renderItems() {
			const visible = this._filteredItems;
			const empty = !visible.length;
			if (this._hasListSlotState) return html`
        ${empty ? this._renderEmpty() : this._renderSelectAll(visible)}
        ${this.renderListSlot()}
      `;
			if (empty) return this._renderEmpty();
			if (this._grouped) return html`
        ${this._renderSelectAll(visible)}
        ${this._groupRows().map((row) => row.kind === "group" ? this._renderGroupHeader(row) : this._renderOption(row.item, row.index, row.level))}
      `;
			return html`
      ${this._renderSelectAll(visible)}
      ${visible.map((item, index) => this._renderOption(item, index))}
    `;
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
		* mono's own writes — attributes, and a checkbox appended INSIDE a row — cannot re-trigger it.
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
		* Your template says what a line LOOKS like. Everything that carries state or acts on the value
		* stays here: mono walks the lines it just published and stamps the state as `data-*`
		* attributes, then puts its own checkbox in — the same markup `_renderCheckBox` produces for
		* mono's own rows, so it inherits the same CSS and the same colour prop.
		*
		* Three rules keep this safe beside a framework:
		*   · children are ANNOTATED and APPENDED TO, never moved, reordered or removed — every
		*     `insertBefore` anchor a `v-for` patches against stays valid;
		*   · `data-*` only, never `class` — `class` is the consumer's binding and would be clobbered;
		*   · the injected node is marked `data-mono-chrome`, so it is never mistaken for content and is
		*     updated in place instead of recreated.
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
				if (entry.type === "group") {
					const usable = (entry.items ?? []).filter((item) => this._isSelectable(item));
					const state = this._selectionStateOf(usable);
					node.setAttribute("data-mono-state", state);
					node.toggleAttribute("data-mono-selected", state === "all");
					this._syncListCheckBox(node, this.checkable && this.groupSelectAll && !this.disabled && !this.readonly && usable.length > 0, state);
					continue;
				}
				node.toggleAttribute("data-mono-selected", !!entry.selected);
				node.toggleAttribute("data-mono-active", !!entry.active);
				this._syncListCheckBox(node, this.checkable, entry.selected ? "all" : "none");
			}
		}
		/**
		* mono's own checkbox, inside a line mono does not own.
		*
		* Same markup as `_renderCheckBox`, built by hand because Lit cannot render into a subtree it
		* does not control. It is created once and then only re-classed, so the consumer's framework
		* never sees a node appear and disappear under it.
		*/
		_syncListCheckBox(row, wanted, state) {
			let box = row.querySelector("[data-mono-chrome]");
			if (!wanted) {
				box?.remove();
				return;
			}
			if (!box) {
				box = document.createElement("span");
				box.setAttribute("data-mono-chrome", "");
				box.setAttribute("aria-hidden", "true");
				const inner = document.createElement("span");
				inner.className = "mono-checkbox-box sm";
				inner.setAttribute("mono-box", "");
				box.setAttribute("mono-check-box", "");
				box.setAttribute("mono-checkbox", "");
				box.setAttribute("mono-size", "sm");
				box.appendChild(inner);
				const anchor = row.querySelector("[data-mono-check]");
				if (anchor) anchor.appendChild(box);
				else row.insertBefore(box, row.firstChild);
			}
			box.className = [
				this._cls("mono-checkbox", "check"),
				this.color,
				state === "all" ? "mono-checkbox-checked" : "",
				state === "some" ? "mono-checkbox-indeterminate" : ""
			].filter(Boolean).join(" ");
			if (this.color === "primary") box.removeAttribute("mono-color");
			else box.setAttribute("mono-color", this.color);
			box.toggleAttribute("mono-checked", state === "all");
			box.toggleAttribute("mono-indeterminate", state === "some");
		}
		_entryFromNode(node) {
			const keyed = node.closest?.("[data-mono-item-key]");
			if (keyed) {
				const key = keyed.getAttribute("data-mono-item-key");
				return this._publishedEntries.find((e) => e.key === key);
			}
			const wrapper = node.closest?.("[slot=\"list\"]");
			if (!wrapper) return void 0;
			let row = node;
			while (row && row.parentElement !== wrapper) row = row.parentElement;
			if (!row) return void 0;
			const children = Array.from(wrapper.children);
			if (children.length !== this._publishedEntries.length) {
				console.warn(`[mono-tag-input] slot="list" rendered ${children.length} element(s) for ${this._publishedEntries.length} option(s), so a click cannot be paired with its row. Render exactly one element per entry, or put data-mono-item-key="<entry.key>" on each row.`);
				return;
			}
			return this._publishedEntries[children.indexOf(row)];
		}
		_renderHelper() {
			const base = this._cls("mono-tag-input-message", "message");
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
        mono-tag-input
        mono-size=${this.size === "md" ? nothing : this.size}
        mono-color=${this.color === "primary" ? nothing : this.color}
        mono-variant=${this.variant === "outlined" ? nothing : this.variant}
        mono-validation-state=${state === "default" ? nothing : state}
        ?mono-open=${this._open}
        ?mono-more-open=${this._moreOpen}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
        ?mono-checkable=${this.checkable}
        ?mono-searchable=${this.searchable}
      >
        ${this._renderLabel()}

        <div
          class=${this._fieldClasses}
          mono-field
          ?mono-inline=${this._chipBehaviour === "inline"}
          ?mono-typing=${!!this._inputValue}
          @click=${this._handleFieldClick}
        >
          ${this._renderChipRegion()}

          <input
            id=${this._inputId}
            class=${this._cls("mono-tag-input-native", "native")}
            mono-native
            type="text"
            .value=${this._inputValue}
            name=${ifDefined(this.name || void 0)}
            placeholder=${ifDefined(this._hasValue ? void 0 : this.placeholder)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly || !this.searchable}
            ?required=${this.required && !this._hasValue}
            aria-label=${ifDefined(ariaLabel)}
            aria-invalid=${this._resolvedValidationState === "invalid" ? "true" : "false"}
            aria-describedby=${ifDefined(describedBy)}
            aria-controls=${this._listboxId}
            aria-expanded=${this._open ? "true" : "false"}
            autocomplete="off"
            @input=${this._handleInput}
            @focus=${this._handleFocus}
            @keydown=${this._handleKeydown}
          />

          ${this._renderActions()}
        </div>

        ${this._renderMorePanel()}

        <div
          id=${this._listboxId}
          role="listbox"
          class=${this._cls("mono-tag-input-dropdown", "dropdown")}
          mono-dropdown
          style=${styleMap(this._dropdownStyle)}
          @scroll=${this._handleDropdownScroll}
        >
          ${this._renderItems()}
          ${this._renderLoadMore()}
        </div>

        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ""} mono-message-wrap>
          ${this._renderHelper()}
        </div>
      </div>
    `;
		}
		focus(options) {
			this._inputEl?.focus(options);
		}
		blur() {
			this._inputEl?.blur();
		}
		/**
		* Open / close the suggestion panel. Mirrors `mono-select`'s API so anything
		* driving an editor generically — e.g. the data grid opening the focused
		* inline editor on `Enter` — can treat the two the same.
		*/
		/** Whether the suggestion panel is currently open. */
		get isOpen() {
			return this._open;
		}
		open() {
			if (this.disabled || this.readonly) return;
			this._open = true;
			this._inputEl?.focus();
		}
		close() {
			this._close();
		}
		toggle() {
			if (this._open) this.close();
			else this.open();
		}
		clearTags() {
			if (this.disabled || this.readonly) return;
			this._setValue(this._keepFloor([]), { emitClear: true });
			this._resetSearch();
		}
		addTag(value) {
			this._addValue(value);
		}
		removeTag(value) {
			this._removeValue(value);
		}
		/** Whether the slot regions render even when empty. Light: no (omit empty
		*  regions). Shadow: yes — the native `<slot>`s must exist to project DSD
		*  content + be scanned (hidden via `[mono-empty]` when empty). */
		get _slotsAlwaysRender() {
			return false;
		}
		_hasSlot(name) {
			return name === "label" ? this._hasLabelSlotState : this._hasHelperSlotState;
		}
		_setSlotState(name, has) {
			if (name === "label") this._hasLabelSlotState = has;
			else if (name === "list") this._hasListSlotState = has;
			else this._hasHelperSlotState = has;
		}
		/**
		* Slot outlet. Light build (default): a `data-mono-slot` placeholder the
		* captured light-DOM nodes are re-parented into when present, else the prop
		* `fallback`. Shadow build overrides this with a native `<slot name>` carrying
		* the fallback as native slot content.
		*/
		_slotOutlet(name, fallback = nothing) {
			return this._hasSlot(name) ? html`<span data-mono-slot=${name}></span>` : html`${fallback}`;
		}
		/**
		* Icon hook. Light build (default): the global `.mono-icon` / `i-mdi-*` UnoCSS
		* icon. Shadow overrides with inline SVG (UnoCSS can't reach a shadow root).
		*
		* Only the close glyph goes through here. The caret and the scroll chevrons
		* are inline SVG from `composables/field-icons`, shared with
		* `<mono-dropdown-table>` — see `_renderActions`.
		*/
		renderIcon(_name) {
			return html`<span class="mono-icon i-mdi-close" mono-icon aria-hidden="true"></span>`;
		}
	}
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "variant", void 0);
	__decorate([property({ attribute: false })], MonoTagInputCoreClass.prototype, "chip", void 0);
	__decorate([property({
		attribute: "model-value",
		reflect: false,
		hasChanged: arrayHasChanged
	})], MonoTagInputCoreClass.prototype, "modelValue", void 0);
	__decorate([property({
		attribute: false,
		hasChanged: arrayHasChanged
	})], MonoTagInputCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "name", void 0);
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "placeholder", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoTagInputCoreClass.prototype, "helperText", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoTagInputCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoTagInputCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoTagInputCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoTagInputCoreClass.prototype, "successMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoTagInputCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "required", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		attribute: "allow-custom",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "allowCustom", void 0);
	__decorate([property({
		attribute: "max",
		converter: numberStringConverter
	})], MonoTagInputCoreClass.prototype, "max", void 0);
	__decorate([property({
		attribute: "min",
		converter: numberStringConverter
	})], MonoTagInputCoreClass.prototype, "min", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "checkable", void 0);
	__decorate([property({
		attribute: "select-all",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "selectAll", void 0);
	__decorate([property({
		type: String,
		attribute: "select-all-label",
		reflect: true
	})], MonoTagInputCoreClass.prototype, "selectAllLabel", void 0);
	__decorate([property({
		attribute: "group-select-all",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "groupSelectAll", void 0);
	__decorate([property({
		attribute: "max-visible",
		converter: numberStringConverter
	})], MonoTagInputCoreClass.prototype, "maxVisible", void 0);
	__decorate([property({
		attribute: "min-visible",
		converter: numberStringConverter
	})], MonoTagInputCoreClass.prototype, "minVisible", void 0);
	__decorate([property({
		attribute: false,
		hasChanged: arrayHasChanged
	})], MonoTagInputCoreClass.prototype, "items", void 0);
	__decorate([property({ attribute: false })], MonoTagInputCoreClass.prototype, "dataSource", void 0);
	__decorate([property({
		attribute: "immediate",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "immediate", void 0);
	__decorate([property({
		attribute: "load-more",
		reflect: true
	})], MonoTagInputCoreClass.prototype, "loadMore", void 0);
	__decorate([property({
		attribute: "page-size",
		reflect: true,
		type: Number
	})], MonoTagInputCoreClass.prototype, "pageSize", void 0);
	__decorate([property({ attribute: false })], MonoTagInputCoreClass.prototype, "dropdown", void 0);
	__decorate([property({
		attribute: "dropdown-height",
		reflect: true
	})], MonoTagInputCoreClass.prototype, "dropdownHeight", void 0);
	__decorate([property({
		attribute: "dropdown-max-height",
		reflect: true
	})], MonoTagInputCoreClass.prototype, "dropdownMaxHeight", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoTagInputCoreClass.prototype, "flip", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoTagInputCoreClass.prototype, "shift", void 0);
	__decorate([property({
		type: String,
		attribute: "key-value",
		reflect: true
	})], MonoTagInputCoreClass.prototype, "keyValue", void 0);
	__decorate([property({ attribute: false })], MonoTagInputCoreClass.prototype, "displayValue", void 0);
	__decorate([property({ attribute: false })], MonoTagInputCoreClass.prototype, "displayGroup", void 0);
	__decorate([property({
		type: String,
		attribute: "group-key",
		reflect: true
	})], MonoTagInputCoreClass.prototype, "groupKey", void 0);
	__decorate([property({
		type: String,
		attribute: "group-items",
		reflect: true
	})], MonoTagInputCoreClass.prototype, "groupItems", void 0);
	__decorate([property({
		attribute: "group",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "group", void 0);
	__decorate([property({
		attribute: "group-sticky",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "groupSticky", void 0);
	__decorate([property({
		attribute: "searchable",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "searchable", void 0);
	__decorate([property({
		attribute: "stay-open",
		reflect: true,
		converter: booleanStringConverter
	})], MonoTagInputCoreClass.prototype, "stayOpen", void 0);
	__decorate([property({ attribute: "search-value" })], MonoTagInputCoreClass.prototype, "searchValue", void 0);
	__decorate([property({
		type: String,
		attribute: "search-operation"
	})], MonoTagInputCoreClass.prototype, "searchOperation", void 0);
	__decorate([property({
		attribute: "search-debounce",
		type: Number
	})], MonoTagInputCoreClass.prototype, "searchDebounce", void 0);
	__decorate([property({ attribute: false })], MonoTagInputCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoTagInputCoreClass.prototype, "cssClassName", void 0);
	__decorate([state()], MonoTagInputCoreClass.prototype, "_inputValue", void 0);
	__decorate([state()], MonoTagInputCoreClass.prototype, "_open", void 0);
	__decorate([state()], MonoTagInputCoreClass.prototype, "_activeIndex", void 0);
	__decorate([state()], MonoTagInputCoreClass.prototype, "_moreOpen", void 0);
	__decorate([state(), state()], MonoTagInputCoreClass.prototype, "_selectAllPending", void 0);
	__decorate([state()], MonoTagInputCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoTagInputCoreClass.prototype, "_hasHelperSlotState", void 0);
	__decorate([query(".mono-tag-input-native")], MonoTagInputCoreClass.prototype, "_inputEl", void 0);
	__decorate([state()], MonoTagInputCoreClass.prototype, "_hasListSlotState", void 0);
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoTagInputCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoTagInputCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoTagInputCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoTagInputCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoTagInputCoreClass.prototype, "maxHeight", void 0);
	return MonoTagInputCoreClass;
};
//#endregion
//#region src/components/tag-input/tag-input.css?raw
var tag_input_default = "/* =========================================================================\r\n   mono-tag-input — a port of Basecoat's multi-select combobox: `.combobox-chips`\r\n   (the field), `.combobox-chip` (+ `-remove`) and the `.combobox [data-popover]`\r\n   list (basecoat-css@1.0.2, vega style), on the `.field` / `.label` chrome the\r\n   ported input already carries.\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-tag-input size=\"sm\" color=\"danger\" variant=\"filled\" label=\"Tags\">\r\n     <div mono-tag-input mono-size=\"sm\" mono-color=\"danger\" mono-variant=\"filled\">\r\n       <label mono-label>Tags</label>\r\n       <div mono-field>\r\n         <div mono-chip mono-removable><span mono-chip-main><span mono-chip-content>\r\n           <span mono-chip-label>Vue</span><button mono-chip-close>…</button></span></span></div>\r\n         <input mono-native /> <div mono-actions><span mono-arrow>…</span></div>\r\n       </div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined). The element\r\n   renders these attributes on its wrapper (both builds) plus the STATES\r\n   `mono-open` / `mono-more-open`; the old classes (`.mono-tag-input.sm.open`) are\r\n   still emitted as inert hooks until 2.0 but no rule here reads them. The tag\r\n   chips are NOT `.mono-chip`s any more: they are Basecoat combobox chips, painted\r\n   here (`[mono-tag-input] [mono-chip]`), and chip.css never sees them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-tag-input]                              ≡ .field (gap-3, as margins — see the root rule) + .combobox (position: relative)\r\n     [mono-tag-input] > [mono-label]               ≡ .field > label / .label\r\n     [mono-tag-input] > [mono-field]               ≡ .combobox-chips (min-h-9 gap-1.5 rounded-md border-input px-1.5 py-1.5 text-sm shadow-xs)\r\n     [mono-field] > [mono-native]                  ≡ .combobox-chips > input[role='combobox'] (min-w-16 flex-1, borderless)\r\n     [mono-field] [mono-chip] > [mono-chip-main]   ≡ .combobox-chip (h-5.5 gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium)\r\n     [mono-chip] [mono-chip-close]                 ≡ .combobox-chip-remove (-ms-1 opacity-50 hover:100, svg size-3.5)\r\n     [mono-chip][mono-more]                        ≡ EXTENSION (the \"+N more\" counter chip, same box)\r\n     [mono-actions] > [mono-arrow] > svg           ≡ .combobox-trigger-icon (size-4 text-muted-foreground)\r\n     [mono-actions] > [mono-clear]                 ≡ .combobox [data-clear] (size-6, painted as .btn[data-variant='ghost'])\r\n     [mono-actions] > [mono-scroll]                ≡ EXTENSION (the inline strip's ‹ › pager, same box)\r\n     [mono-dropdown]                               ≡ .combobox [data-popover] + [role='listbox'] (bg-popover ring-1 rounded-md shadow-md, max-h-72 p-1 scroll)\r\n     [mono-item]                                   ≡ .combobox [role='option'] (gap-2 rounded-sm py-1.5 ps-2 text-sm)\r\n     [mono-item][mono-active] / :hover             ≡ [role='option'].active (bg-muted text-foreground)\r\n     [mono-item][mono-selected]                    ≡ [role='option'][aria-selected='true'] — the --check-icon, unless the row has its own checkbox\r\n     [mono-group]                                  ≡ .combobox [role='heading'] (px-2 py-1.5 text-xs text-muted-foreground)\r\n     [mono-select-all]                             ≡ EXTENSION (a sticky option row over the list)\r\n     [mono-more-panel]                             ≡ [data-popover] holding the overflow chips\r\n     [mono-empty-row]                              ≡ [role='listbox']::before (py-6 text-center text-sm)\r\n     [mono-message-wrap] > [mono-message]          ≡ .field > p / .field [role='alert']\r\n     [mono-validation-state=\"invalid\"]             ≡ .combobox-chips:has([aria-invalid=true]) + .field[data-invalid]\r\n     [mono-validation-state=\"valid|warning\"]       ≡ EXTENSION (the invalid pattern in --success / --warning)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION (the --mono-control-height-* ladder)\r\n     [mono-variant=\"filled\"]                       ≡ EXTENSION (luma's .combobox-chips)\r\n     [mono-variant=\"underlined\"]                   ≡ EXTENSION (sera's .combobox-chips: bottom edge only, no ring)\r\n\r\n   Inner parts: [mono-label] (+ [mono-required-mark]), [mono-field] (+ [mono-inline],\r\n   [mono-typing]), [mono-chip-strip], [mono-chip] (+ [mono-removable], [mono-more],\r\n   [mono-chip-color=\"…\"]) > [mono-chip-main] > [mono-chip-content] > [mono-chip-dot] /\r\n   [mono-chip-label] / [mono-chip-close] > [mono-icon], [mono-native], [mono-actions] >\r\n   [mono-scroll=\"prev|next\"] (+ [mono-idle]) / [mono-clear] > [mono-icon] / [mono-arrow],\r\n   [mono-dropdown], [mono-select-all] (+ [mono-loading]), [mono-item] (+ [mono-active],\r\n   [mono-selected], [mono-disabled], [mono-check], [mono-level=\"n\"]) > [mono-check-box] /\r\n   [mono-item-text] > [mono-item-title] / [mono-item-sub], [mono-group] (+ [mono-level],\r\n   [mono-sticky], [mono-toggle], [mono-selected]) > [mono-group-label], [mono-empty-row],\r\n   [mono-load-more] (+ [mono-loading]), [mono-list-slot], [mono-more-panel],\r\n   [mono-message-wrap] > [mono-message=\"helper|valid|invalid|warning\"]. The shadow build\r\n   marks an unassigned slot wrapper [mono-empty].\r\n\r\n   THE PANELS ARE PORTALED (light build): [mono-dropdown] and [mono-more-panel] move\r\n   into a `<div data-mono-popup-portal>` under <body> while open, and the portal\r\n   mirrors the wrapper's class AND mono-* attributes, so every rule here is scoped\r\n   under `[mono-tag-input]` and never relies on the panel being inside the field.\r\n\r\n   FLAVORS set the same knobs as mono-input, renamed `--mono-tag-input-*`, plus the\r\n   select's panel / option / group set (`--mono-tag-input-dropdown-*`,\r\n   `--mono-tag-input-option-*`, `--mono-tag-input-group-*`) and the chip set\r\n   (`--mono-tag-input-chip-{radius,bg,color,font-size,font-weight}`). Every fallback\r\n   here is vega's value (`node scripts/basecoat-styles.mjs --varying \"^\\.combobox\"`).\r\n   ========================================================================= */\r\n\r\nmono-tag-input {\r\n  display: block;\r\n}\r\n\r\n[mono-tag-input] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-tag-input-text: var(--mono-tag-input-color, var(--mono-tag-input-text, var(--foreground)));\r\n  --_mono-tag-input-placeholder: var(--mono-tag-input-placeholder, var(--muted-foreground));\r\n  --_mono-tag-input-muted: var(--mono-tag-input-muted, var(--muted-foreground));\r\n  --_mono-tag-input-primary: var(--mono-tag-input-primary, var(--ring));\r\n  --_mono-tag-input-secondary: var(--mono-tag-input-secondary, var(--muted-foreground));\r\n  --_mono-tag-input-success: var(--mono-tag-input-success, var(--success));\r\n  --_mono-tag-input-danger: var(--mono-tag-input-danger, var(--destructive));\r\n  --_mono-tag-input-warning: var(--mono-tag-input-warning, var(--warning));\r\n  --_mono-tag-input-info: var(--mono-tag-input-info, var(--info));\r\n  --_mono-tag-input-teal: var(--mono-tag-input-teal, var(--teal));\r\n  --_mono-tag-input-purple: var(--mono-tag-input-purple, var(--purple));\r\n  --_mono-tag-input-neutral: var(--mono-tag-input-neutral, var(--neutral));\r\n  --_mono-tag-input-dark: var(--mono-tag-input-dark, var(--dark));\r\n  --_mono-tag-input-valid: var(--mono-tag-input-valid, var(--success));\r\n  --_mono-tag-input-invalid: var(--mono-tag-input-invalid, var(--destructive));\r\n\r\n  /* ── the painted result — three tiers, base = .combobox-chips (vega) ──── */\r\n  --_mono-tag-input-ring-color: var(--mono-tag-input-ring-color, var(--mono-tag-input-focus-color, var(--_mono-tag-input-ring-color-preset, var(--_mono-tag-input-primary))));\r\n  --_mono-tag-input-ring-width: var(--mono-tag-input-ring-width, var(--_mono-tag-input-ring-width-preset, var(--mono-ring-width)));\r\n  --_mono-tag-input-ring-alpha: var(--mono-tag-input-ring-alpha, var(--mono-ring-alpha));\r\n  --_mono-tag-input-border-color: var(--mono-tag-input-rest-border, var(--mono-tag-input-border-color, var(--mono-tag-input-border, var(--_mono-tag-input-border-color-preset, var(--input)))));\r\n  --_mono-tag-input-bg: var(--mono-tag-input-bg, var(--mono-tag-input-surface, var(--_mono-tag-input-bg-preset, var(--mono-mode-surface))));\r\n  --_mono-tag-input-shadow: var(--mono-tag-input-shadow, var(--_mono-tag-input-shadow-preset, 0 0 #0000));\r\n  --_mono-tag-input-icon: var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 4));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\r\n        `<div mono-tag-input>` that names no size renders exactly like size=\"md\".\r\n        basecoat@1.0.2 styles/vega.css .combobox-chips — min-h-9 gap-1.5 rounded-md\r\n        px-1.5 py-1.5 text-sm; .combobox-chip h-5.5 ── */\r\n  --_mono-tag-input-height: var(--mono-tag-input-height-md, var(--mono-control-height-md));\r\n  --_mono-tag-input-radius: var(--mono-tag-input-radius-md, var(--_mono-tag-input-radius-preset, var(--mono-tag-input-radius, var(--mono-radius-md))));\r\n  --_mono-tag-input-padding-x: var(--mono-tag-input-padding-x-md, var(--mono-tag-input-padding-x, var(--_mono-tag-input-padding-x-preset, calc(var(--mono-spacing) * 1.5))));\r\n  --_mono-tag-input-padding-y: var(--mono-tag-input-padding-y-md, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 1.5)));\r\n  --_mono-tag-input-gap: var(--mono-tag-input-chip-gap, calc(var(--mono-spacing) * 1.5));\r\n  --_mono-tag-input-font-size: var(--mono-tag-input-font-md, var(--mono-text-sm));\r\n  --_mono-tag-input-line-height: var(--mono-tag-input-line-height, var(--mono-tag-input-line-height-md, var(--mono-text-sm--lh)));\r\n  --_mono-tag-input-chip-height: var(--mono-tag-input-chip-height-md, min(calc(var(--mono-spacing) * 5.5), var(--_mono-tag-input-chip-fit)));\r\n  /* The room one row of chips has: the field's height minus its block padding and borders. Each\r\n     size's DEFAULT chip height is capped by it, so the rule \"chip h + 2·py + 2px ≤ token\" holds\r\n     under ANY control ladder — a dense flavor (mira: xs 20px) shrinks the chip instead of growing\r\n     an empty field past the token. An explicit `--mono-tag-input-chip-height-*` is not capped. */\r\n  --_mono-tag-input-chip-fit: calc(var(--_mono-tag-input-height) - 2 * var(--_mono-tag-input-padding-y) - 2 * var(--mono-border-width));\r\n  --_mono-tag-input-chip-font-size: var(--mono-tag-input-chip-font-size, var(--mono-text-xs));\r\n  --_mono-tag-input-chip-line-height: var(--mono-tag-input-chip-line-height, var(--mono-text-xs--lh));\r\n  --_mono-tag-input-action: calc(var(--mono-spacing) * 6);\r\n  --_mono-tag-input-clear-glyph: calc(var(--mono-spacing) * 3.5);\r\n\r\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3; mono: BLOCK\r\n     flow with the gap as margins, so a hand-written panel that no controller\r\n     positions lands at its static position — right under the field, above the\r\n     message — instead of a flex container's content-box top (see select.css) */\r\n  --_mono-tag-input-gap-y: var(--mono-tag-input-gap, calc(var(--mono-spacing) * 3));\r\n  position: relative;\r\n  display: block;\r\n  width: 100%;\r\n  font-family: inherit;\r\n  color: var(--_mono-tag-input-text);\r\n}\r\n\r\n[mono-tag-input],\r\n[mono-tag-input] *,\r\n[mono-tag-input] *::before,\r\n[mono-tag-input] *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n[mono-tag-input] :is([mono-label], [mono-message])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — an EMPTY field's painted height IS the token (tests/perf/field-heights);\r\n   a second row of chips grows it. Each step keeps one row of chips + its block\r\n   padding under the token: chip h + 2·py + 2px ≤ token.\r\n   ========================================= */\r\n\r\n[mono-tag-input][mono-size=\"xs\"] {\r\n  --_mono-tag-input-height: var(--mono-tag-input-height-xs, var(--mono-control-height-xs));\r\n  --_mono-tag-input-radius: var(--mono-tag-input-radius-xs, var(--_mono-tag-input-radius-preset, var(--mono-tag-input-radius, var(--mono-radius-md))));\r\n  --_mono-tag-input-padding-x: var(--mono-tag-input-padding-x-xs, var(--mono-tag-input-padding-x, var(--_mono-tag-input-padding-x-preset, var(--mono-spacing))));\r\n  --_mono-tag-input-padding-y: var(--mono-tag-input-padding-y-xs, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 0.5)));\r\n  --_mono-tag-input-gap: var(--mono-tag-input-chip-gap, var(--mono-spacing));\r\n  --_mono-tag-input-font-size: var(--mono-tag-input-font-xs, var(--mono-text-xs));\r\n  --_mono-tag-input-line-height: var(--mono-tag-input-line-height, var(--mono-tag-input-line-height-xs, var(--mono-text-xs--lh)));\r\n  --_mono-tag-input-chip-height: var(--mono-tag-input-chip-height-xs, min(calc(var(--mono-spacing) * 4.5), var(--_mono-tag-input-chip-fit)));\r\n  --_mono-tag-input-icon: var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 3.5));\r\n  --_mono-tag-input-action: calc(var(--mono-spacing) * 4);\r\n  --_mono-tag-input-clear-glyph: calc(var(--mono-spacing) * 3);\r\n}\r\n\r\n[mono-tag-input][mono-size=\"sm\"] {\r\n  --_mono-tag-input-height: var(--mono-tag-input-height-sm, var(--mono-control-height-sm));\r\n  --_mono-tag-input-radius: var(--mono-tag-input-radius-sm, var(--_mono-tag-input-radius-preset, var(--mono-tag-input-radius, var(--mono-radius-md))));\r\n  --_mono-tag-input-padding-x: var(--mono-tag-input-padding-x-sm, var(--mono-tag-input-padding-x, var(--_mono-tag-input-padding-x-preset, var(--mono-spacing))));\r\n  --_mono-tag-input-padding-y: var(--mono-tag-input-padding-y-sm, var(--mono-tag-input-padding-y, var(--mono-spacing)));\r\n  --_mono-tag-input-gap: var(--mono-tag-input-chip-gap, var(--mono-spacing));\r\n  --_mono-tag-input-font-size: var(--mono-tag-input-font-sm, var(--mono-tag-input-font-md, var(--mono-text-sm)));\r\n  --_mono-tag-input-line-height: var(--mono-tag-input-line-height, var(--mono-tag-input-line-height-sm, var(--mono-text-sm--lh)));\r\n  --_mono-tag-input-chip-height: var(--mono-tag-input-chip-height-sm, min(calc(var(--mono-spacing) * 5), var(--_mono-tag-input-chip-fit)));\r\n  --_mono-tag-input-action: calc(var(--mono-spacing) * 5);\r\n}\r\n\r\n[mono-tag-input][mono-size=\"lg\"] {\r\n  --_mono-tag-input-height: var(--mono-tag-input-height-lg, var(--mono-control-height-lg));\r\n  --_mono-tag-input-radius: var(--mono-tag-input-radius-lg, var(--_mono-tag-input-radius-preset, var(--mono-tag-input-radius, var(--mono-radius-md))));\r\n  --_mono-tag-input-padding-x: var(--mono-tag-input-padding-x-lg, var(--mono-tag-input-padding-x, var(--_mono-tag-input-padding-x-preset, calc(var(--mono-spacing) * 1.5))));\r\n  --_mono-tag-input-padding-y: var(--mono-tag-input-padding-y-lg, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 1.5)));\r\n  --_mono-tag-input-font-size: var(--mono-tag-input-font-lg, var(--mono-tag-input-font-md, var(--mono-text-sm)));\r\n  --_mono-tag-input-line-height: var(--mono-tag-input-line-height, var(--mono-tag-input-line-height-lg, var(--mono-text-sm--lh)));\r\n  --_mono-tag-input-chip-height: var(--mono-tag-input-chip-height-lg, min(calc(var(--mono-spacing) * 6), var(--_mono-tag-input-chip-fit)));\r\n}\r\n\r\n[mono-tag-input][mono-size=\"xl\"] {\r\n  --_mono-tag-input-height: var(--mono-tag-input-height-xl, var(--mono-control-height-xl));\r\n  --_mono-tag-input-radius: var(--mono-tag-input-radius-xl, var(--_mono-tag-input-radius-preset, var(--mono-tag-input-radius, var(--mono-radius-md))));\r\n  --_mono-tag-input-padding-x: var(--mono-tag-input-padding-x-xl, var(--mono-tag-input-padding-x, var(--_mono-tag-input-padding-x-preset, calc(var(--mono-spacing) * 2))));\r\n  --_mono-tag-input-padding-y: var(--mono-tag-input-padding-y-xl, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 2)));\r\n  --_mono-tag-input-gap: var(--mono-tag-input-chip-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-tag-input-font-size: var(--mono-tag-input-font-xl, var(--mono-text-base));\r\n  --_mono-tag-input-line-height: var(--mono-tag-input-line-height, var(--mono-tag-input-line-height-xl, var(--mono-text-base--lh)));\r\n  --_mono-tag-input-chip-height: var(--mono-tag-input-chip-height-xl, min(calc(var(--mono-spacing) * 6.5), var(--_mono-tag-input-chip-fit)));\r\n  --_mono-tag-input-chip-font-size: var(--mono-tag-input-chip-font-size, var(--mono-text-sm));\r\n  --_mono-tag-input-chip-line-height: var(--mono-tag-input-chip-line-height, var(--mono-text-sm--lh));\r\n  --_mono-tag-input-icon: var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-tag-input-action: calc(var(--mono-spacing) * 7);\r\n  --_mono-tag-input-clear-glyph: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n[mono-tag-input][mono-size=\"xxl\"] {\r\n  --_mono-tag-input-height: var(--mono-tag-input-height-xxl, var(--mono-control-height-xxl));\r\n  --_mono-tag-input-radius: var(--mono-tag-input-radius-xxl, var(--_mono-tag-input-radius-preset, var(--mono-tag-input-radius, var(--mono-radius-md))));\r\n  --_mono-tag-input-padding-x: var(--mono-tag-input-padding-x-xxl, var(--mono-tag-input-padding-x, var(--_mono-tag-input-padding-x-preset, calc(var(--mono-spacing) * 2.5))));\r\n  --_mono-tag-input-padding-y: var(--mono-tag-input-padding-y-xxl, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 2)));\r\n  --_mono-tag-input-gap: var(--mono-tag-input-chip-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-tag-input-font-size: var(--mono-tag-input-font-xxl, var(--mono-text-lg));\r\n  --_mono-tag-input-line-height: var(--mono-tag-input-line-height, var(--mono-tag-input-line-height-xxl, var(--mono-text-lg--lh)));\r\n  --_mono-tag-input-chip-height: var(--mono-tag-input-chip-height-xxl, min(calc(var(--mono-spacing) * 7), var(--_mono-tag-input-chip-fit)));\r\n  --_mono-tag-input-chip-font-size: var(--mono-tag-input-chip-font-size, var(--mono-text-sm));\r\n  --_mono-tag-input-chip-line-height: var(--mono-tag-input-chip-line-height, var(--mono-text-sm--lh));\r\n  --_mono-tag-input-icon: var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 5));\r\n  --_mono-tag-input-action: calc(var(--mono-spacing) * 8);\r\n  --_mono-tag-input-clear-glyph: calc(var(--mono-spacing) * 4);\r\n}\r\n\r\n/* =========================================\r\n   Variants — each writes only `*-preset` slots\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .combobox-chips — rounded-md border border-input\r\n   bg-transparent shadow-xs (dark:bg-input/30 via --mono-mode-surface) */\r\n[mono-tag-input]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\r\n  --_mono-tag-input-bg-preset: var(--mono-tag-input-outline-bg);\r\n  --_mono-tag-input-border-color-preset: var(--mono-tag-input-outline-border-color);\r\n  --_mono-tag-input-side-border-color-preset: var(--mono-tag-input-outline-side-border-color);\r\n  --_mono-tag-input-shadow-preset: var(--mono-tag-input-outline-shadow, var(--mono-shadow-xs));\r\n  --_mono-tag-input-ring-width-preset: var(--mono-tag-input-outline-ring-width);\r\n  --_mono-tag-input-radius-preset: var(--mono-tag-input-outline-radius);\r\n  --_mono-tag-input-padding-x-preset: var(--mono-tag-input-outline-padding-x);\r\n}\r\n\r\n/* EXTENSION — filled ≡ basecoat@1.0.2 styles/luma.css .combobox-chips */\r\n[mono-tag-input][mono-variant=\"filled\"] {\r\n  --_mono-tag-input-bg-preset: var(--mono-tag-input-filled-bg, color-mix(in oklab, var(--input) 50%, transparent));\r\n  --_mono-tag-input-border-color-preset: transparent;\r\n  --_mono-tag-input-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* EXTENSION — underlined ≡ basecoat@1.0.2 styles/sera.css .combobox-chips */\r\n[mono-tag-input][mono-variant=\"underlined\"] {\r\n  --_mono-tag-input-bg-preset: transparent;\r\n  --_mono-tag-input-side-border-color-preset: transparent;\r\n  --_mono-tag-input-shadow-preset: 0 0 #0000;\r\n  --_mono-tag-input-ring-width-preset: 0px;\r\n  --_mono-tag-input-radius-preset: 0;\r\n  --_mono-tag-input-padding-x-preset: 0;\r\n}\r\n\r\n/* =========================================\r\n   Colours — the `color` prop is the FOCUS colour (ring + focused border)\r\n   ========================================= */\r\n\r\n[mono-tag-input]:is(:not([mono-color]), [mono-color=\"primary\"]) {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-primary);\r\n}\r\n[mono-tag-input][mono-color=\"secondary\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-secondary);\r\n}\r\n[mono-tag-input][mono-color=\"success\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-success);\r\n}\r\n[mono-tag-input][mono-color=\"danger\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-danger);\r\n}\r\n[mono-tag-input][mono-color=\"warning\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-warning);\r\n}\r\n[mono-tag-input][mono-color=\"info\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-info);\r\n}\r\n[mono-tag-input][mono-color=\"teal\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-teal);\r\n}\r\n[mono-tag-input][mono-color=\"purple\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-purple);\r\n}\r\n[mono-tag-input][mono-color=\"neutral\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-neutral);\r\n}\r\n[mono-tag-input][mono-color=\"dark\"] {\r\n  --_mono-tag-input-ring-color-preset: var(--_mono-tag-input-dark);\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — flex items-center\r\n   gap-2 text-sm leading-none font-medium select-none w-fit */\r\n[mono-tag-input] > [mono-label] {\r\n  display: flex;\r\n  align-items: center;\r\n  width: fit-content;\r\n  margin: 0 0 var(--_mono-tag-input-gap-y);\r\n  gap: var(--mono-tag-input-label-gap, calc(var(--mono-spacing) * 2));\r\n  font-size: var(--mono-tag-input-label-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-tag-input-label-line-height, 1);\r\n  font-weight: var(--mono-tag-input-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  text-transform: var(--mono-tag-input-label-text-transform, none);\r\n  letter-spacing: var(--mono-tag-input-label-letter-spacing, normal);\r\n  color: var(--_mono-tag-input-text);\r\n  user-select: none;\r\n}\r\n\r\n[mono-tag-input][mono-disabled] > [mono-label] {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field — data-invalid:text-destructive */\r\n[mono-tag-input][mono-validation-state=\"invalid\"] > [mono-label] {\r\n  color: var(--_mono-tag-input-invalid);\r\n}\r\n\r\n[mono-tag-input] [mono-required-mark] {\r\n  color: var(--_mono-tag-input-danger);\r\n}\r\n\r\n/* =========================================\r\n   The field — the chip box\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/combobox.css .combobox-chips — flex w-full min-w-0\r\n   flex-wrap items-center */\r\n/* basecoat@1.0.2 styles/vega.css .combobox-chips — min-h-9 gap-1.5 rounded-md\r\n   border border-input bg-transparent bg-clip-padding px-1.5 py-1.5 text-sm\r\n   shadow-xs transition-[color,box-shadow] focus-within:border-ring\r\n   focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:…;\r\n   mono: `--tw-ring-*` flattened to the ring + shadow slots, the min-height is\r\n   the control token, the side edges read their own slot */\r\n[mono-tag-input] > [mono-field] {\r\n  --_mono-tag-input-bc: var(--_mono-tag-input-border-color);\r\n  --_mono-tag-input-side-bc: var(--mono-tag-input-side-border-color, var(--_mono-tag-input-side-border-color-preset, var(--_mono-tag-input-bc)));\r\n  --_mono-tag-input-ring: 0 0 #0000;\r\n\r\n  position: relative;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: var(--_mono-tag-input-gap);\r\n  width: 100%;\r\n  min-width: 0;\r\n  min-height: var(--_mono-tag-input-height);\r\n  padding-block: var(--_mono-tag-input-padding-y);\r\n  padding-inline: var(--_mono-tag-input-padding-x);\r\n  outline-style: none;\r\n  border: var(--mono-border-width) solid var(--_mono-tag-input-bc);\r\n  border-top-color: var(--_mono-tag-input-side-bc);\r\n  border-inline-color: var(--_mono-tag-input-side-bc);\r\n  border-radius: var(--_mono-tag-input-radius);\r\n  background: var(--_mono-tag-input-bg);\r\n  background-clip: padding-box;\r\n  color: var(--_mono-tag-input-text);\r\n  box-shadow: var(--_mono-tag-input-ring), var(--_mono-tag-input-shadow);\r\n  font-size: var(--_mono-tag-input-font-size);\r\n  line-height: var(--_mono-tag-input-line-height);\r\n  cursor: text;\r\n  transition-property: color, box-shadow, border-color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  /* focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 */\r\n  &:focus-within {\r\n    --_mono-tag-input-bc: var(--_mono-tag-input-ring-color);\r\n    --_mono-tag-input-ring: 0 0 0 var(--_mono-tag-input-ring-width) color-mix(in oklab, var(--_mono-tag-input-ring-color) var(--_mono-tag-input-ring-alpha), transparent);\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .combobox-chips — has-[[aria-invalid=true]]:border-destructive\r\n   has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 */\r\n[mono-tag-input][mono-validation-state=\"invalid\"] > [mono-field],\r\n[mono-tag-input] > [mono-field]:has(> [mono-native][aria-invalid=\"true\"]) {\r\n  --_mono-tag-input-bc: var(--mono-mode-invalid-border);\r\n  --_mono-tag-input-ring: 0 0 0 var(--_mono-tag-input-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* EXTENSION — valid / warning are the invalid pattern in the role's colour */\r\n[mono-tag-input][mono-validation-state=\"valid\"] > [mono-field] {\r\n  --_mono-tag-input-bc: color-mix(in oklab, var(--_mono-tag-input-valid) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-tag-input-ring: 0 0 0 var(--_mono-tag-input-ring-width) color-mix(in oklab, var(--_mono-tag-input-valid) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n[mono-tag-input][mono-validation-state=\"warning\"] > [mono-field] {\r\n  --_mono-tag-input-bc: color-mix(in oklab, var(--_mono-tag-input-warning) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-tag-input-ring: 0 0 0 var(--_mono-tag-input-ring-width) color-mix(in oklab, var(--_mono-tag-input-warning) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n/* EXTENSION — readonly: a muted surface */\r\n[mono-tag-input][mono-readonly] > [mono-field] {\r\n  background: var(--mono-tag-input-readonly-bg, var(--muted));\r\n  cursor: default;\r\n}\r\n\r\n/* .combobox-chips > input:disabled — opacity-50 (on the box, so the chips fade\r\n   with it). The strip's ‹ › pager opts back in so the chips can still be read. */\r\n[mono-tag-input][mono-disabled] > [mono-field] {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n  cursor: not-allowed;\r\n  background: var(--mono-tag-input-disabled-bg, var(--_mono-tag-input-bg));\r\n}\r\n\r\n[mono-tag-input][mono-disabled] [mono-scroll]:not([mono-idle]) {\r\n  pointer-events: auto;\r\n  cursor: pointer;\r\n}\r\n\r\n/* ── the actions row stays on the FIRST row ──────────────────────────────\r\n   The field wraps, and the row is its last child, so once the chips wrapped it\r\n   rode down to the bottom-right. Pinned out of that flow instead; `top` centres\r\n   it on the single-row height. Not in inline mode: an inline field never wraps,\r\n   so the row sits in normal flow and the strip flexes against it. */\r\n[mono-tag-input] > [mono-field]:not([mono-inline]) {\r\n  padding-inline-end: calc(var(--_mono-tag-input-padding-x) + var(--_mono-tag-input-action) + var(--mono-spacing));\r\n}\r\n\r\n[mono-tag-input] > [mono-field]:not([mono-inline]) > [mono-actions] {\r\n  position: absolute;\r\n  inset-inline-end: var(--_mono-tag-input-padding-x);\r\n  top: calc((var(--_mono-tag-input-height) - var(--_mono-tag-input-action)) / 2);\r\n}\r\n\r\n/* =========================================\r\n   The text box\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/combobox.css .combobox-chips > input[role='combobox']\r\n   — min-w-16 flex-1 bg-transparent outline-none placeholder:text-muted-foreground */\r\n[mono-tag-input] [mono-native] {\r\n  flex: 1 1 calc(var(--mono-spacing) * 16);\r\n  min-width: calc(var(--mono-spacing) * 16);\r\n  align-self: stretch;\r\n  appearance: none;\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: 0;\r\n  outline: none;\r\n  background: transparent;\r\n  box-shadow: none;\r\n  color: var(--_mono-tag-input-text);\r\n  font-family: inherit;\r\n  font-size: var(--_mono-tag-input-font-size);\r\n  line-height: var(--_mono-tag-input-line-height);\r\n  /* The chip row is the box's height; the text box never exceeds it. `height`, not only\r\n     `min-height`: an input's own line box is its floor, so with a chip shorter than the line (a\r\n     dense flavor's capped chip — mira xs: 14px chip, 16px line) the input set the row and an\r\n     empty field came out 2px over the control token. The 12px glyphs still fit. */\r\n  min-height: var(--_mono-tag-input-chip-height);\r\n  height: var(--_mono-tag-input-chip-height);\r\n\r\n  &:focus,\r\n  &:focus-visible {\r\n    outline: none !important;\r\n  }\r\n\r\n  &::placeholder {\r\n    color: var(--_mono-tag-input-placeholder);\r\n  }\r\n\r\n  &:disabled,\r\n  &:read-only {\r\n    cursor: inherit;\r\n  }\r\n}\r\n\r\n/* =========================================\r\n   Chips\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/combobox.css .combobox-chip — inline-flex w-fit\r\n   shrink-0 items-center whitespace-nowrap */\r\n[mono-tag-input] [mono-chip] {\r\n  display: inline-flex;\r\n  width: fit-content;\r\n  max-width: 100%;\r\n  flex-shrink: 0;\r\n  align-items: center;\r\n  white-space: nowrap;\r\n  vertical-align: middle;\r\n  line-height: 1;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .combobox-chip — h-5.5 gap-1 rounded-sm bg-muted\r\n   px-1.5 text-xs font-medium text-foreground, has-[>.combobox-chip-remove]:pe-0 */\r\n[mono-tag-input] [mono-chip] > [mono-chip-main] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  height: var(--_mono-tag-input-chip-height);\r\n  max-width: 100%;\r\n  gap: var(--mono-tag-input-chip-content-gap, var(--mono-spacing));\r\n  margin: 0;\r\n  padding-inline: var(--mono-tag-input-chip-padding-x, calc(var(--mono-spacing) * 1.5));\r\n  border: 0;\r\n  border-radius: var(--mono-tag-input-chip-radius, var(--mono-radius-sm));\r\n  background: var(--mono-tag-input-chip-bg, var(--muted));\r\n  color: var(--mono-tag-input-chip-color, var(--_mono-tag-input-text));\r\n  font-family: inherit;\r\n  font-size: var(--_mono-tag-input-chip-font-size);\r\n  line-height: var(--_mono-tag-input-chip-line-height);\r\n  font-weight: var(--mono-tag-input-chip-font-weight, var(--mono-font-weight-medium));\r\n  text-decoration: none;\r\n  cursor: default;\r\n}\r\n\r\n[mono-tag-input] [mono-chip][mono-removable] > [mono-chip-main] {\r\n  padding-inline-end: 0;\r\n}\r\n\r\n[mono-tag-input] [mono-chip] [mono-chip-content] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: inherit;\r\n  min-width: 0;\r\n  max-width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n[mono-tag-input] [mono-chip] [mono-chip-label] {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* EXTENSION — `chip.dot`: a coloured dot before the label (the badge's dot idiom) */\r\n[mono-tag-input] [mono-chip] [mono-chip-dot] {\r\n  flex: 0 0 auto;\r\n  width: calc(var(--mono-spacing) * 1.5);\r\n  height: calc(var(--mono-spacing) * 1.5);\r\n  border-radius: var(--mono-radius-full);\r\n  background: currentColor;\r\n}\r\n\r\n/* EXTENSION — `chip.color` pins a hue: the tonal pattern (bg-x/10 text-x, dark 20) */\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"primary\"] > [mono-chip-main] { background: color-mix(in oklab, var(--primary) var(--mono-mode-tint), transparent); color: var(--primary); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"secondary\"] > [mono-chip-main] { background: var(--secondary); color: var(--secondary-foreground); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"success\"] > [mono-chip-main] { background: color-mix(in oklab, var(--success) var(--mono-mode-tint), transparent); color: var(--success); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"danger\"] > [mono-chip-main] { background: color-mix(in oklab, var(--destructive) var(--mono-mode-tint), transparent); color: var(--destructive); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"warning\"] > [mono-chip-main] { background: color-mix(in oklab, var(--warning) var(--mono-mode-tint), transparent); color: var(--warning); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"info\"] > [mono-chip-main] { background: color-mix(in oklab, var(--info) var(--mono-mode-tint), transparent); color: var(--info); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"teal\"] > [mono-chip-main] { background: color-mix(in oklab, var(--teal) var(--mono-mode-tint), transparent); color: var(--teal); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"purple\"] > [mono-chip-main] { background: color-mix(in oklab, var(--purple) var(--mono-mode-tint), transparent); color: var(--purple); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"neutral\"] > [mono-chip-main] { background: color-mix(in oklab, var(--neutral) var(--mono-mode-tint), transparent); color: var(--neutral); }\r\n[mono-tag-input] [mono-chip][mono-chip-color=\"dark\"] > [mono-chip-main] { background: var(--dark); color: var(--dark-foreground); }\r\n\r\n/* basecoat@1.0.2 components/combobox.css .combobox-chip-remove — inline-flex\r\n   shrink-0 items-center justify-center */\r\n/* basecoat@1.0.2 styles/vega.css .combobox-chip-remove — -ms-1 opacity-50\r\n   hover:opacity-100, svg size-3.5 */\r\n[mono-tag-input] [mono-chip] [mono-chip-close] {\r\n  display: inline-flex;\r\n  flex-shrink: 0;\r\n  align-items: center;\r\n  justify-content: center;\r\n  /* explicit: the element still carries chip.css's `.chip-close` class as a hook,\r\n     which pins a 1rem box — the raw markup has no such class */\r\n  width: auto;\r\n  height: 100%;\r\n  min-width: 0;\r\n  margin: 0;\r\n  transform: none;\r\n  margin-inline-start: calc(var(--mono-spacing) * -1);\r\n  padding: 0 var(--mono-spacing);\r\n  border: 0;\r\n  border-radius: inherit;\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n  line-height: 1;\r\n  opacity: 0.5;\r\n  cursor: pointer;\r\n  outline-style: none;\r\n  transition-property: opacity;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n\r\n  &:focus-visible {\r\n    opacity: 1;\r\n  }\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-tag-input] [mono-chip] [mono-chip-close]:hover {\r\n    opacity: 1;\r\n  }\r\n}\r\n\r\n[mono-tag-input] [mono-chip] [mono-chip-close] > :is(svg, .mono-icon, [mono-icon]) {\r\n  display: block;\r\n  width: calc(var(--mono-spacing) * 3.5);\r\n  height: calc(var(--mono-spacing) * 3.5);\r\n  pointer-events: none;\r\n}\r\n\r\n/* EXTENSION — the \"+N more\" counter chip is a control */\r\n[mono-tag-input] [mono-chip][mono-more] > [mono-chip-main] {\r\n  cursor: pointer;\r\n  outline-style: none;\r\n}\r\n\r\n[mono-tag-input] [mono-chip][mono-more] > [mono-chip-main]:focus-visible {\r\n  box-shadow: 0 0 0 var(--_mono-tag-input-ring-width) color-mix(in oklab, var(--_mono-tag-input-ring-color) var(--_mono-tag-input-ring-alpha), transparent);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-tag-input] [mono-chip][mono-more] > [mono-chip-main]:hover {\r\n    background: var(--mono-mode-surface-hover);\r\n  }\r\n}\r\n\r\n/* ── the inline chip strip (`chip.behaviour: 'inline'`) ──────────────────\r\n   One line that never grows: the field stops wrapping, the chips live in their\r\n   own strip, and the strip absorbs the overflow instead of the field.\r\n\r\n   `overflow-x: hidden` — NOT `auto` — is the whole scroll contract. Hidden still\r\n   honours a programmatic `scrollLeft`, so `ChipStripController` can page the\r\n   strip while the browser paints no scrollbar. */\r\n[mono-tag-input] > [mono-field][mono-inline] {\r\n  flex-wrap: nowrap;\r\n  min-width: 0;\r\n}\r\n\r\n[mono-tag-input] [mono-chip-strip] {\r\n  display: flex;\r\n  flex-wrap: nowrap;\r\n  align-items: center;\r\n  gap: var(--_mono-tag-input-gap);\r\n  flex: 0 1 auto;\r\n  min-width: 0;\r\n  overflow-x: hidden;\r\n  overflow-y: hidden;\r\n  /* NO `scroll-behavior: smooth` — see ChipStripController (one scroll event per\r\n     frame would reposition every open popup). */\r\n}\r\n\r\n[mono-tag-input] [mono-chip-strip] > * {\r\n  flex-shrink: 0;\r\n}\r\n\r\n/* The text box takes the SLACK: `flex-basis: 0` contributes nothing to the\r\n   overflow calculation, so when the chips overflow it collapses and the strip\r\n   runs up to the pager; focus earns a caret's room, typing earns a real box. */\r\n[mono-tag-input] > [mono-field][mono-inline] > [mono-native] {\r\n  flex: 1 1 0;\r\n  min-width: 0;\r\n}\r\n\r\n[mono-tag-input] > [mono-field][mono-inline] > [mono-native]:focus,\r\n[mono-tag-input] > [mono-field][mono-inline] > [mono-native]:focus-visible {\r\n  min-width: calc(var(--mono-spacing) * 5);\r\n}\r\n\r\n[mono-tag-input] > [mono-field][mono-inline][mono-typing] > [mono-native] {\r\n  min-width: calc(var(--mono-spacing) * 24);\r\n}\r\n\r\n/* =========================================\r\n   Actions — ‹ › pager, clear, caret\r\n   ========================================= */\r\n\r\n[mono-tag-input] [mono-actions] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--mono-spacing);\r\n  flex: 0 0 auto;\r\n  line-height: 1;\r\n}\r\n\r\n/* basecoat@1.0.2 components/combobox.css .combobox [data-clear] — size-6 border-0\r\n   bg-transparent p-0 text-current; the caret ≡ .combobox-trigger-icon (size-4\r\n   text-muted-foreground), the pager the same box. Painted as .btn[data-variant='ghost']. */\r\n[mono-tag-input] [mono-clear],\r\n[mono-tag-input] [mono-arrow],\r\n[mono-tag-input] [mono-scroll] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  flex: 0 0 auto;\r\n  width: var(--_mono-tag-input-action);\r\n  height: var(--_mono-tag-input-action);\r\n  margin: 0;\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--mono-tag-input-clear-radius, calc(var(--radius) - 5px));\r\n  background: transparent;\r\n  color: var(--_mono-tag-input-muted);\r\n  font: inherit;\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  outline-style: none;\r\n  transition-property: color, background-color, transform;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n[mono-tag-input] :is([mono-clear], [mono-arrow], [mono-scroll]) > :is(svg, .mono-icon, [mono-icon]) {\r\n  display: block;\r\n  width: var(--_mono-tag-input-icon);\r\n  height: var(--_mono-tag-input-icon);\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-tag-input] [mono-clear] > :is(svg, .mono-icon, [mono-icon]) {\r\n  width: var(--_mono-tag-input-clear-glyph);\r\n  height: var(--_mono-tag-input-clear-glyph);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted hover:text-foreground */\r\n@media (hover: hover) {\r\n  [mono-tag-input] :is([mono-clear], [mono-arrow], [mono-scroll]):hover {\r\n    background: var(--mono-mode-ghost-hover);\r\n    color: var(--_mono-tag-input-text);\r\n  }\r\n}\r\n\r\n/* EXTENSION — the caret turns while the panel is open */\r\n[mono-tag-input][mono-open] [mono-arrow] > :is(svg, .mono-icon, [mono-icon]) {\r\n  transform: rotate(180deg);\r\n}\r\n\r\n/* At an end of the strip the pager keeps its box but disappears — hiding it with\r\n   `display: none` would shrink the row and shove the strip sideways mid-click. */\r\n[mono-tag-input] [mono-scroll][mono-idle] {\r\n  visibility: hidden;\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   The panel\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/popover.css [data-popover] — absolute z-50 overflow;\r\n   mono: `display: none` while closed, `--mono-popup-z` from the shared stack,\r\n   `--mono-popup-avail-h` from the portal controller */\r\n/* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover\r\n   text-popover-foreground ring-foreground/10 max-h-72 rounded-md p-0 shadow-md ring-1 */\r\n/* basecoat@1.0.2 styles/vega.css .combobox [role='listbox'] — max-h-[min(18rem,\r\n   var(--available-height,18rem))] scroll-py-1 overflow-y-auto p-1 (our panel IS\r\n   the listbox: one scrolling box) */\r\n[mono-tag-input] > [mono-dropdown] {\r\n  position: absolute;\r\n  /* `top: auto` = the static position (under the field, before the message); the\r\n     6px offset is a transform the controller's inline `transform: none` cancels */\r\n  top: auto;\r\n  transform: translateY(calc(var(--mono-spacing) * 1.5));\r\n  left: 0;\r\n  right: 0;\r\n  z-index: var(--mono-popup-z, 1000);\r\n  display: none;\r\n  min-width: var(--mono-tag-input-dropdown-min-width, 9rem);\r\n  max-height: min(var(--_mono-tag-input-panel-max-h, 18rem), var(--mono-popup-avail-h, 100vh));\r\n  padding: var(--mono-tag-input-dropdown-padding, var(--mono-spacing));\r\n  overflow: auto;\r\n  overscroll-behavior: contain;\r\n  scroll-padding-block: var(--mono-tag-input-dropdown-padding, var(--mono-spacing));\r\n  isolation: isolate;\r\n  border-radius: var(--mono-tag-input-dropdown-radius, var(--mono-radius-md));\r\n  background: var(--mono-tag-input-dropdown-bg, var(--popover));\r\n  color: var(--mono-tag-input-dropdown-color, var(--popover-foreground));\r\n  box-shadow: var(--mono-tag-input-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--mono-tag-input-dropdown-shadow, var(--mono-shadow-md));\r\n  font-size: var(--mono-tag-input-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-tag-input-option-line-height, var(--mono-text-sm--lh));\r\n  outline-style: none;\r\n}\r\n\r\n[mono-tag-input][mono-open] > [mono-dropdown] {\r\n  display: block;\r\n}\r\n\r\n/* =========================================\r\n   Options\r\n   -----------------------------------------\r\n   Every rule that paints a native line lists its stamped twin (`slot=\"list\"`:\r\n   `[data-mono-type='row']`, `[data-mono-active]`, `[data-mono-selected]`,\r\n   `[data-mono-chrome]`) so the two can never drift. `:where()` wraps only the\r\n   CONTAINER, keeping the twin at attribute weight.\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select) [role='option'] — relative\r\n   flex w-full cursor-default items-center outline-none select-none; disabled\r\n   pointer-events-none opacity-50 */\r\n/* basecoat@1.0.2 styles/vega.css .combobox [role='option'] — gap-2 rounded-sm\r\n   py-1.5 ps-2 pe-8 text-sm, svg size-4; EXTENSION: one indent step per level */\r\n[mono-tag-input] [mono-item],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='row'] {\r\n  --_ti-item-level: 0;\r\n  position: relative;\r\n  display: flex;\r\n  width: 100%;\r\n  align-items: center;\r\n  gap: var(--mono-tag-input-option-gap, calc(var(--mono-spacing) * 2));\r\n  margin: 0;\r\n  padding-block: var(--mono-tag-input-option-padding-y, calc(var(--mono-spacing) * 1.5));\r\n  padding-inline: var(--mono-tag-input-option-padding-x, calc(var(--mono-spacing) * 2)) var(--mono-tag-input-option-padding-end, calc(var(--mono-spacing) * 8));\r\n  padding-inline-start: calc(var(--mono-tag-input-option-padding-x, calc(var(--mono-spacing) * 2)) + var(--_ti-item-level) * calc(var(--mono-spacing) * 3));\r\n  min-height: var(--mono-tag-input-option-min-height, 0);\r\n  border: 0;\r\n  border-radius: var(--mono-tag-input-option-radius, var(--mono-radius-sm));\r\n  /* longhands, so the selected row's check (a background-image) survives the\r\n     active / hover background */\r\n  background-color: transparent;\r\n  background-image: none;\r\n  color: var(--_mono-tag-input-text);\r\n  font-family: inherit;\r\n  font-size: var(--mono-tag-input-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-tag-input-option-line-height, var(--mono-text-sm--lh));\r\n  font-weight: var(--mono-tag-input-option-font-weight, var(--mono-font-weight-normal));\r\n  text-align: start;\r\n  outline-style: none;\r\n  user-select: none;\r\n  cursor: default;\r\n  transition-property: color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration-fast);\r\n}\r\n\r\n/* EXTENSION: a hair of air between rows. Upstream stacks its options flush, so an\r\n   active row directly under the selected one read as ONE tall highlight; a 2px\r\n   seam keeps the two rounded-sm washes apart. `--mono-tag-input-option-spacing`. */\r\n[mono-tag-input] [mono-item] + [mono-item],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='row'] + [data-mono-type='row'] {\r\n  margin-top: var(--mono-tag-input-option-spacing, 2px);\r\n}\r\n\r\n[mono-tag-input] [mono-item][mono-level='1'] { --_ti-item-level: 1; }\r\n[mono-tag-input] [mono-item][mono-level='2'] { --_ti-item-level: 2; }\r\n[mono-tag-input] [mono-item][mono-level='3'] { --_ti-item-level: 3; }\r\n[mono-tag-input] [mono-item][mono-level='4'] { --_ti-item-level: 4; }\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='option'].active, .select:not(select) [role='option']:focus-visible\r\n   — bg-muted text-foreground. The keyboard cursor and the pointer share one look. */\r\n[mono-tag-input] [mono-item][mono-active]:not([mono-disabled]):not(:disabled),\r\n[mono-tag-input] [mono-item]:focus-visible,\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-active] {\r\n  background-color: var(--mono-tag-input-option-active-bg, var(--muted));\r\n  color: var(--mono-tag-input-option-active-color, var(--_mono-tag-input-text));\r\n}\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select):not([data-select-initialized]) [role='option']:not([aria-disabled='true']):not(:disabled):hover, .select:not(select) [role='option'].active */\r\n[mono-tag-input] [mono-item]:hover:not([mono-disabled]):not(:disabled),\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='row']:hover {\r\n  background-color: var(--mono-tag-input-option-active-bg, var(--muted));\r\n  color: var(--mono-tag-input-option-active-color, var(--_mono-tag-input-text));\r\n}\r\n\r\n/* basecoat@1.0.2 components/select.css .select:not(select) [role='option'][aria-selected='true']\r\n   — the --check-icon at the end. A row with its OWN checkbox says it there instead. */\r\n[mono-tag-input] [mono-item][mono-selected]:not([mono-check]),\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='row'][data-mono-selected] {\r\n  background-image: var(--mono-tag-input-check-icon, var(--check-icon));\r\n  background-size: var(--mono-tag-input-check-size, 0.875rem);\r\n  background-position: center right calc(var(--mono-spacing) * 2);\r\n  background-repeat: no-repeat;\r\n}\r\n\r\n[mono-tag-input] [mono-item][mono-selected]:not([mono-check]):dir(rtl),\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='row'][data-mono-selected]:dir(rtl) {\r\n  background-position: center left calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n[mono-tag-input] [mono-item][mono-disabled],\r\n[mono-tag-input] [mono-item]:disabled {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n  cursor: not-allowed;\r\n}\r\n\r\n/* the title IS the consumer's line — a custom row has no title element */\r\n[mono-tag-input] [mono-item-text] {\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n}\r\n\r\n[mono-tag-input] [mono-item-title],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='row'] {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* EXTENSION — `item.description`: a muted second line */\r\n[mono-tag-input] [mono-item-sub] {\r\n  margin-top: 0;\r\n  font-size: var(--mono-text-xs);\r\n  line-height: var(--mono-text-xs--lh);\r\n  color: var(--_mono-tag-input-muted);\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* checkable rows: the box IS a mono-checkbox — the row emits the element's own\r\n   markup ([mono-checkbox] > [mono-box], [mono-size=\"sm\"], the checked /\r\n   indeterminate / loading states) and checkbox.css paints every pixel of it, in\r\n   both builds; this sheet says only how it sits in the row: it must not shrink\r\n   or take clicks (the row's button handles the toggle). A consumer's line lays\r\n   out the same. */\r\n[mono-tag-input] [mono-check-box],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-chrome] {\r\n  flex: 0 0 auto;\r\n  gap: 0;\r\n  pointer-events: none;\r\n}\r\n\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='group'] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--mono-tag-input-option-gap, calc(var(--mono-spacing) * 2));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='listbox']:not(:has([data-value]:not([aria-hidden='true'])))::before\r\n   — py-6 text-center text-sm */\r\n[mono-tag-input] [mono-empty-row] {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding-block: calc(var(--mono-spacing) * 6);\r\n  padding-inline: calc(var(--mono-spacing) * 3);\r\n  font-size: var(--mono-tag-input-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-tag-input-option-line-height, var(--mono-text-sm--lh));\r\n  color: var(--_mono-tag-input-muted);\r\n  text-align: center;\r\n  cursor: default;\r\n  user-select: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .combobox [role='heading'] — px-2 py-1.5 text-xs\r\n   text-muted-foreground; EXTENSION: one indent step per level, a <button> when the\r\n   header selects its group */\r\n[mono-tag-input] [mono-group],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='group'] {\r\n  --_ti-group-level: 0;\r\n  width: 100%;\r\n  margin: 0;\r\n  padding-block: var(--mono-tag-input-group-padding-y, calc(var(--mono-spacing) * 1.5));\r\n  padding-inline: var(--mono-tag-input-group-padding-x, calc(var(--mono-spacing) * 2));\r\n  padding-inline-start: calc(var(--mono-tag-input-group-padding-x, calc(var(--mono-spacing) * 2)) + var(--_ti-group-level) * calc(var(--mono-spacing) * 3));\r\n  border: 0;\r\n  border-radius: var(--mono-tag-input-option-radius, var(--mono-radius-sm));\r\n  background: transparent;\r\n  font-family: inherit;\r\n  font-size: var(--mono-tag-input-group-font-size, var(--mono-text-xs));\r\n  line-height: var(--mono-tag-input-group-line-height, var(--mono-text-xs--lh));\r\n  font-weight: var(--mono-tag-input-group-font-weight, var(--mono-font-weight-normal));\r\n  text-transform: var(--mono-tag-input-group-text-transform, none);\r\n  letter-spacing: var(--mono-tag-input-group-letter-spacing, normal);\r\n  text-align: start;\r\n  color: var(--_mono-tag-input-muted);\r\n  cursor: default;\r\n  user-select: none;\r\n}\r\n\r\n[mono-tag-input] [mono-group][mono-level='1'],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-level='1'] { --_ti-group-level: 1; --_ti-item-level: 1; }\r\n[mono-tag-input] [mono-group][mono-level='2'],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-level='2'] { --_ti-group-level: 2; --_ti-item-level: 2; }\r\n[mono-tag-input] [mono-group][mono-level='3'],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-level='3'] { --_ti-group-level: 3; --_ti-item-level: 3; }\r\n[mono-tag-input] [mono-group][mono-level='4'],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-level='4'] { --_ti-group-level: 4; --_ti-item-level: 4; }\r\n\r\n/* a header that selects its own group is a <button> laid out like the rows */\r\n[mono-tag-input] [mono-group][mono-toggle],\r\n[mono-tag-input] :where([mono-list-slot]) [data-mono-type='group']:has([data-mono-chrome]) {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--mono-tag-input-option-gap, calc(var(--mono-spacing) * 2));\r\n  cursor: pointer;\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-tag-input] [mono-group][mono-toggle]:hover {\r\n    background-color: var(--mono-tag-input-option-active-bg, var(--muted));\r\n    color: var(--_mono-tag-input-text);\r\n  }\r\n}\r\n\r\n/* a group carrying a selection reads at a glance while scrolling */\r\n[mono-tag-input] [mono-group][mono-toggle][mono-selected] {\r\n  color: var(--_mono-tag-input-text);\r\n}\r\n\r\n[mono-tag-input] [mono-group-label] {\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* group-sticky: pin headers while their rows scroll, on the panel's own surface */\r\n[mono-tag-input] [mono-group][mono-sticky] {\r\n  position: sticky;\r\n  top: calc(var(--_ti-group-level) * 1.5rem);\r\n  z-index: calc(5 - var(--_ti-group-level));\r\n  background: var(--mono-tag-input-dropdown-bg, var(--popover));\r\n}\r\n\r\n/* EXTENSION — the \"All\" row: always first, always sticky, on the panel surface\r\n   with a hairline under it; z above the group headers (which stack from 5 down) */\r\n[mono-tag-input] [mono-select-all] {\r\n  position: sticky;\r\n  top: 0;\r\n  z-index: 6;\r\n  background-color: var(--mono-tag-input-dropdown-bg, var(--popover));\r\n  box-shadow: 0 1px 0 0 var(--border);\r\n  font-weight: var(--mono-font-weight-medium);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-tag-input] [mono-select-all]:hover:not(:disabled) {\r\n    background-color: var(--mono-tag-input-option-active-bg, var(--muted));\r\n  }\r\n}\r\n\r\n/* while it drains the server the row is `disabled` so a second click cannot start\r\n   a second drain — but it is busy, not unavailable: undo the disabled look */\r\n[mono-tag-input] [mono-select-all][mono-loading],\r\n[mono-tag-input] [mono-select-all][mono-loading]:hover {\r\n  opacity: 1;\r\n  cursor: progress;\r\n  pointer-events: none;\r\n  background-color: var(--mono-tag-input-option-active-bg, var(--muted));\r\n}\r\n\r\n/* EXTENSION — the load-more affordance: an option-shaped ghost button */\r\n[mono-tag-input] [mono-load-more] {\r\n  display: flex;\r\n  width: 100%;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: var(--mono-tag-input-option-gap, calc(var(--mono-spacing) * 2));\r\n  margin: 0;\r\n  padding-block: var(--mono-tag-input-option-padding-y, calc(var(--mono-spacing) * 1.5));\r\n  padding-inline: var(--mono-tag-input-option-padding-x, calc(var(--mono-spacing) * 2));\r\n  border: 0;\r\n  border-radius: var(--mono-tag-input-option-radius, var(--mono-radius-sm));\r\n  background: transparent;\r\n  color: var(--_mono-tag-input-muted);\r\n  font-family: inherit;\r\n  font-size: var(--mono-tag-input-option-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-tag-input-option-line-height, var(--mono-text-sm--lh));\r\n  font-weight: var(--mono-font-weight-medium);\r\n  cursor: pointer;\r\n  transition-property: color, background-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration-fast);\r\n}\r\n\r\n@media (hover: hover) {\r\n  [mono-tag-input] [mono-load-more]:hover:not([mono-loading]) {\r\n    background: var(--mono-tag-input-option-active-bg, var(--muted));\r\n    color: var(--_mono-tag-input-text);\r\n  }\r\n}\r\n\r\n[mono-tag-input] [mono-load-more][mono-loading] {\r\n  cursor: default;\r\n  opacity: 0.7;\r\n}\r\n\r\n/* Consumer-rendered option rows (slot=\"list\"): `display: contents` so mono's own\r\n   placement wrapper generates no box. */\r\n[mono-tag-input] [mono-list-slot] {\r\n  display: contents;\r\n}\r\n\r\n/* =========================================\r\n   The \"+N more\" overflow panel — a popover holding the overflow chips\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover ring-1\r\n   ring-foreground/10 rounded-md shadow-md; EXTENSION: p-1.5 gap-1.5 flex-wrap */\r\n[mono-tag-input] > [mono-more-panel] {\r\n  position: absolute;\r\n  left: 0;\r\n  right: 0;\r\n  top: auto;\r\n  transform: translateY(calc(var(--mono-spacing) * 1.5));\r\n  z-index: var(--mono-popup-z, 1000);\r\n  display: none;\r\n  flex-wrap: wrap;\r\n  align-items: flex-start;\r\n  gap: var(--_mono-tag-input-gap);\r\n  padding: calc(var(--mono-spacing) * 1.5);\r\n  max-height: min(14rem, var(--mono-popup-avail-h, 100vh));\r\n  overflow: auto;\r\n  overscroll-behavior: contain;\r\n  border-radius: var(--mono-tag-input-dropdown-radius, var(--mono-radius-md));\r\n  background: var(--mono-tag-input-dropdown-bg, var(--popover));\r\n  color: var(--mono-tag-input-dropdown-color, var(--popover-foreground));\r\n  box-shadow: var(--mono-tag-input-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)), var(--mono-tag-input-dropdown-shadow, var(--mono-shadow-md));\r\n}\r\n\r\n[mono-tag-input][mono-more-open] > [mono-more-panel] {\r\n  display: flex;\r\n}\r\n\r\n/* =========================================\r\n   Message\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p */\r\n[mono-tag-input] > [mono-message-wrap] {\r\n  display: block;\r\n  margin-top: var(--_mono-tag-input-gap-y);\r\n}\r\n\r\n[mono-tag-input] > [mono-message-wrap]:not(:has([mono-message]:not([mono-empty]))) {\r\n  display: none;\r\n}\r\n\r\n[mono-tag-input] [mono-message] {\r\n  font-size: var(--mono-tag-input-message-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-tag-input-message-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-font-weight-normal);\r\n  text-align: start;\r\n  color: var(--_mono-tag-input-muted);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field [role=\"alert\"] — text-destructive text-sm */\r\n[mono-tag-input] [mono-message=\"invalid\"] {\r\n  color: var(--_mono-tag-input-invalid);\r\n}\r\n\r\n[mono-tag-input] [mono-message=\"valid\"] {\r\n  color: var(--_mono-tag-input-valid);\r\n}\r\n\r\n[mono-tag-input] [mono-message=\"warning\"] {\r\n  color: var(--_mono-tag-input-warning);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  [mono-tag-input] > [mono-field],\r\n  [mono-tag-input] [mono-clear],\r\n  [mono-tag-input] [mono-arrow],\r\n  [mono-tag-input] [mono-scroll],\r\n  [mono-tag-input] [mono-item],\r\n  [mono-tag-input] [mono-chip-close] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/tag-input/mono-tag-input.shadow.ts
var SHADOW_EXTRA_CSS = "";
/**
* Shadow-DOM `mono-tag-input` (the opt-in SSR build,
* `@mono-lit/helper/ui/shadow/tag-input`).
*
* Real shadow root + `static styles`, so `@lit-labs/ssr` serializes it to
* Declarative Shadow DOM and styles are scoped (`mono-tag-input`→`:host`). The
* collapsed control (label + field + placeholder + message) server-renders; the
* dropdown is closed server-side and the DataSource (async) is client-only —
* suggestions populate after hydration. The panel stays in the shadow root (the
* shared `PopupPortalController` skips the body portal for a shadow host and CSS
* positions it under the `position:relative` `.mono-tag-input`).
*
* Slotting uses native `<slot>`: `label`/`helper` carry the prop text as native
* fallback (shown server-side); presence is detected in `firstUpdated()` via
* `assignedNodes()` (DSD assigns at parse time → no `slotchange` after upgrade)
* plus `@slotchange`. Interactivity needs the first client update to flush —
* hence the defer-hydration poll. Shares all logic with the light build via
* `MonoTagInputCore`; both register `mono-tag-input`, so a document loads one.
*/
/** One document-level copy of the checkbox rules, for chrome injected into projected content. */
var SLOT_CHECKBOX_STYLE_ID = "mono-list-slot-checkbox-css";
var MonoTagInputShadow = class MonoTagInputShadow extends withShadowUtilityStyles(MonoTagInputCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [
			unsafeCSS(toShadowCss(tag_input_default, {
				host: "mono-tag-input",
				append: SHADOW_EXTRA_CSS
			})),
			unsafeCSS(chip_default),
			unsafeCSS(checkbox_default)
		];
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
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._scanSlots();
	}
	updated(changed) {
		super.updated(changed);
		if (isServer) return;
		this._scanSlots();
		this._watchListChrome();
		this._syncListChrome();
	}
	/**
	* Slotted content stays in the LIGHT DOM, so the checkbox mono injects into it is out of reach
	* of this build's scoped styles — the one place where projection's virtue (the page's CSS still
	* applies) turns into a cost. The rules it needs are added to the document once, under an id, and
	* only when a list slot actually asks for chrome; `checkboxCss` is already bundled here for the
	* shadow root's own copy, so this costs no extra bytes.
	*/
	_syncListChrome() {
		super._syncListChrome();
		if (!this._hasListSlotState || !this.checkable || typeof document === "undefined") return;
		if (document.getElementById(SLOT_CHECKBOX_STYLE_ID)) return;
		const style = document.createElement("style");
		style.id = SLOT_CHECKBOX_STYLE_ID;
		style.textContent = checkbox_default;
		document.head.appendChild(style);
	}
	_slotFor(name) {
		return this.renderRoot.querySelector(`slot[name="${name}"]`);
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	/** A wrapper appeared after connect — the flag is all this build needs, projection does the rest. */
	_onLateListSlot() {
		const has = !!this._lateListSlot.find();
		if (has !== this._hasListSlotState) this._setSlotState("list", has);
	}
	/** Reconcile the 3 slot-presence flags from their slots' assigned content. */
	_scanSlots() {
		for (const name of [
			"label",
			"helper",
			"list"
		]) {
			const has = name === "list" ? !!this._lateListSlot.find() : this._slotHasContent(this._slotFor(name));
			if (has !== (name === "label" ? this._hasLabelSlotState : name === "helper" ? this._hasHelperSlotState : this._hasListSlotState)) this._setSlotState(name, has);
		}
	}
	/**
	* The consumer's list wrapper, PROJECTED rather than moved.
	*
	* Projection is what makes this work in a shadow root at all: slotted content stays in the light
	* DOM, so the app's own stylesheet still reaches it. Moving those nodes inside the shadow root
	* would cut them off from it — the same reason this build inlines SVGs instead of icon classes.
	*/
	renderListSlot() {
		return html`<div class="mono-tag-input-list-slot" mono-list-slot @click=${this._onListSlotClick}>
      <slot name="list" @slotchange=${(e) => this._onSlotChange("list", e)}></slot>
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
	/** Inline SVG — the global `.mono-icon`/`i-mdi-close` UnoCSS icon can't reach a
	*  shadow root. (The caret and scroll chevrons are already inline SVG from
	*  `composables/field-icons`, so they need no override.) */
	renderIcon(_name) {
		return html`<svg
      mono-icon
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
MonoTagInputShadow = __decorate([customElement("mono-shadow-tag-input")], MonoTagInputShadow);
//#endregion
//#region src/components/tag-input/tag-input-utils.ts
function validateTagInputProps(props) {
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
function normalizeSuggestions(items) {
	return items.map((item) => ({
		...item,
		value: item.value ?? item.label
	}));
}
//#endregion
export { MonoTagInputCore, MonoTagInputShadow, normalizeSuggestions, validateTagInputProps };
