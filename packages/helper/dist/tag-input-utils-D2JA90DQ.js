import { r as readAllRows } from "./data-source-read-uKJpRAzx.js";
import { a as errorTitle, f as MonoSourceSearch, i as errorText, n as describeError, x as searchRowPredicate, y as resolveSearchFields } from "./normalize-error-BEcd1tmS.js";
import { n as unwrapReactive, r as unwrapReactiveDeep } from "./reactive-Dtd-esHO.js";
import { d as buildSizeStyle, f as toCssSize } from "./mono-ui-kvLVIf1V.js";
import { a as defineHybridPropAliases, n as arrayHasChanged, r as booleanStringConverter, t as __decorate } from "./decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "./mono-event-CAZf0F_k.js";
import { t as LateSlotWatcher } from "./light-slots-B5Ck0t_E.js";
import { t as PopupPortalController } from "./popup-portal-CINuVjNY.js";
import { c as spinnerIcon, i as chevronIcon, n as caretIcon, s as refreshIcon } from "./field-icons-t8rXRCKs.js";
import { t as MonoFormControlCore } from "./form-control-core-CRZPZ1ru.js";
import { t as FieldTooltipController } from "./field-tooltip-Csk4s2ve.js";
import { t as FieldValidationController } from "./field-validation-CFmUmuDx.js";
import { t as DataSourceController } from "./data-source-controller-DS_JLrmS.js";
import { n as visibleChipCap, r as ChipStripController, t as resolveChipLimit } from "./chip-limits-CFABydIL.js";
import { html, isServer, nothing } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/tag-input/tag-input-core.ts
/**
* What inside the consumer's `slot="select-all"` content keeps its own click. A press on one of
* these is the consumer's action — a help button, a link — and must not also tick every row.
*/
const SELECT_ALL_SLOT_INTERACTIVE = "button, a[href], input, select, textarea, label, [contenteditable], [data-mono-no-toggle]";
const numberStringConverter = {
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
const MonoTagInputCore = (superClass) => {
	class MonoTagInputCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.labelPosition = "top";
			this.validationPosition = "bottom";
			this.chip = {};
			this.modelValue = [];
			this.value = [];
			this.name = "";
			this.label = "";
			this.placeholder = "Add tag...";
			this.loadingText = "Loading…";
			this.retryLabel = "Retry";
			this.loading = false;
			this.loadingError = null;
			this.helperText = "";
			this.tooltip = null;
			this._tooltip = new FieldTooltipController(this, () => this.tooltip);
			this._validation = new FieldValidationController(this, () => ({
				position: this.validationPosition,
				...this._validationNotice ?? {
					state: void 0,
					text: void 0
				},
				suppressed: this._open || this._moreOpen
			}), () => this.renderRoot?.querySelector?.("[mono-tag-input] > [mono-field]"));
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
			this._lateSelectAllSlot = new LateSlotWatcher(this, "select-all", () => this._onLateSelectAllSlot());
			this._docListenersBound = false;
			this._filteredMemo = null;
			this._filteredMemoOn = false;
			this._selectedSetFor = null;
			this._selectedSetLen = -1;
			this._selectedSetMemo = /* @__PURE__ */ new Set();
			this._sourceSearch = new MonoSourceSearch();
			this._searchVersion = 0;
			this._appliedQuery = "";
			this._appFailure = null;
			this._retry = (event) => {
				event.preventDefault();
				event.stopPropagation();
				const error = this._failure;
				if (this.disabled || this._busy || !error) return;
				const fromApp = !!this._appFailure;
				dispatchMonoEvent(this, "retry", {
					error,
					source: fromApp ? "app" : "dataSource"
				});
				if (fromApp || !this.dataSource || !this._ds.error) return;
				const clearSearch = !!this._appliedQuery && this._serverSearch();
				this._ds.retry(clearSearch ? () => this._pushSearch("") : void 0);
			};
			this._selectedItemCache = /* @__PURE__ */ new Map();
			this._leafIndexKey = [];
			this._leafIndexMemo = /* @__PURE__ */ new Map();
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
					const path = event.composedPath();
					if (this._popup.inLayerAbove(path) || this._morePopup.inLayerAbove(path)) return;
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
			this._hasSelectAllSlotState = false;
			this._publishedEntries = [];
			this._onListSlotClick = (event) => {
				if (this._inert) return;
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
				"labelPosition",
				"validationPosition",
				"modelValue",
				"loadingText",
				"loadingError",
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
				"loadingtext",
				"loadingerror",
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
			if (name === "loadingtext") {
				this.loadingText = newValue ?? "Loading…";
				return;
			}
			if (name === "loadingerror") {
				this.loadingError = newValue;
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
		/** The validation message and its state — the same precedence the message row uses. */
		get _validationNotice() {
			if (this.validationMessage) return {
				state: this._resolvedValidationState,
				text: this.validationMessage
			};
			if (this.errorMessage) return {
				state: "invalid",
				text: this.errorMessage
			};
			if (this.successMessage) return {
				state: "valid",
				text: this.successMessage
			};
			return null;
		}
		/** The message that moved to the icon / float bubble, kept for assistive tech only. */
		_renderMovedMessage() {
			const notice = this._validationNotice;
			return html`<div
      class=${`${this._cls("mono-tag-input-message", "message")} ${notice.state}`}
      mono-message=${notice.state}
      mono-sr-only
      role=${notice.state === "invalid" ? "alert" : nothing}
    >${notice.text}</div>`;
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
		/** Where the consumer's `slot="select-all"` content goes — inside the "All" row, portal-aware. */
		get _selectAllSlotTarget() {
			return this._popup.panelRoot.querySelector("[data-mono-slot=\"select-all\"]");
		}
		/** A late wrapper arrived. Overridden per build — one adopts it, the other rescans. */
		_onLateListSlot() {}
		/** A late select-all wrapper arrived. Overridden per build, like `_onLateListSlot`. */
		_onLateSelectAllSlot() {}
		connectedCallback() {
			super.connectedCallback();
			this._lateListSlot.start();
			this._lateSelectAllSlot.start();
			if (isServer) return;
			if (this._open || this._moreOpen) this._bindDocumentListeners();
		}
		disconnectedCallback() {
			if (this._searchTimer) {
				clearTimeout(this._searchTimer);
				this._searchTimer = void 0;
			}
			this._sourceSearch.clear(this.dataSource);
			this._lateListSlot.stop();
			this._lateSelectAllSlot.stop();
			this._stopWatchingListChrome();
			if (!isServer) this._unbindDocumentListeners();
			super.disconnectedCallback();
		}
		/**
		* Outside-dismiss listeners, bound while a panel is OPEN (the list or the "+N more") rather
		* than on connect — select's rule, same reasoning: all three handlers bail when both panels are
		* closed, so the only cost they carried at rest was dispatch, three `document` listeners per
		* field (two capture-phase) in the path of every click, focus move and keystroke.
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
		willUpdate(changed) {
			this._filteredMemo = null;
			this._filteredMemoOn = true;
			for (const key of [
				"disabled",
				"loading",
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
			if (changed.has("loadingError")) {
				const v = this.loadingError;
				this._appFailure = v == null || v === false || v === "" ? null : describeError(v === true ? void 0 : v);
			}
			if (this._open && this._dsInert) {
				this._open = false;
				this._dropQuery();
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
			if (isServer) {
				this._endFilteredMemo();
				return;
			}
			if (this._open || this._moreOpen) this._bindDocumentListeners();
			else this._unbindDocumentListeners();
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
			this._endFilteredMemo();
		}
		_endFilteredMemo() {
			this._filteredMemoOn = false;
			this._filteredMemo = null;
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
			return this._selectedSet.has(unwrapReactive(this._resolveItemValue(item)));
		}
		/**
		* The selection as a Set of RAW values — `_isSameValue`'s rule (identity after
		* `unwrapReactive`) as an O(1) lookup.
		*
		* `_isSelected` runs per row, from the option render, the list entries, the group
		* headers and the "All" row — a `.some()` over the selection there made every render
		* O(rows × selected), which after a select-all of a thousand rows is millions of
		* comparisons per keystroke. Rebuilt when `value` is replaced (or resized in place).
		*/
		get _selectedSet() {
			const values = this._selectedValues;
			if (values !== this._selectedSetFor || values.length !== this._selectedSetLen) {
				this._selectedSetFor = values;
				this._selectedSetLen = values.length;
				this._selectedSetMemo = new Set(values.map((v) => unwrapReactive(v)));
			}
			return this._selectedSetMemo;
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
		/** Run the server search, reset to page 0. A failure becomes the field's error. */
		async _applySearch(query) {
			if (!this._serverSearch()) return;
			await this._pushSearch(query).catch((err) => {
				this._ds.setError(err);
			});
		}
		/** Push `query` onto the source and reload it; rejects when the load fails. */
		_pushSearch(query) {
			this._appliedQuery = query;
			return this._sourceSearch.apply(this.dataSource, {
				query,
				searchValue: this.searchValue,
				fallbackFields: this._fallbackSearchFields(),
				rows: this._normalizedItems,
				remote: true,
				defaultToWildcard: true,
				operation: this.searchOperation || "contains"
			});
		}
		/** Forget the typed query without touching the source. */
		_dropQuery() {
			if (this._searchTimer) {
				clearTimeout(this._searchTimer);
				this._searchTimer = void 0;
			}
			this._inputValue = "";
			this._activeIndex = -1;
		}
		/** Loading: the app says so (`loading`), or the bound source's first load / retry. */
		get _busy() {
			return this.loading || !!this.dataSource && this._ds.busy;
		}
		/** The failure to paint: the app's `loading-error`, else the source's own; none while busy. */
		get _failure() {
			if (this._busy) return null;
			return this._appFailure ?? (this.dataSource ? this._ds.error : null);
		}
		/** Enter / Space on the focused field retries a failure. */
		_retryKey(event) {
			if (event.key !== "Enter" && event.key !== " ") return false;
			if (!this._failure || this.disabled) return false;
			this._retry(event);
			return true;
		}
		/** Loading, or failed: the field refuses every gesture but ↻. */
		get _dsInert() {
			return this._busy || !!this._failure;
		}
		/** Every interaction is off: disabled, read-only, or the source isn't usable. */
		get _inert() {
			return this.disabled || this.readonly || this._dsInert;
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
			this._pruneSelectedCache();
		}
		/**
		* Drop remembered rows no current value needs, once the cache has outgrown the selection — it
		* only ever grew (every value ever picked, every row a select-all drained). On close, with
		* slack, so toggling a few tags never thrashes it.
		*/
		_pruneSelectedCache() {
			const values = this._selectedValues;
			if (this._selectedItemCache.size <= values.length * 2 + 200) return;
			const keep = new Set(values.map((v) => this._cacheKey(v)).filter((k) => k !== void 0));
			for (const k of this._selectedItemCache.keys()) if (!keep.has(k)) this._selectedItemCache.delete(k);
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
			if (this._filteredMemoOn && this._filteredMemo) return this._filteredMemo;
			const out = this._grouped ? this._groupRows().filter((r) => r.kind === "item").map((r) => r.item) : this._visibleItems.filter((item) => this._searchMatches(item));
			if (this._filteredMemoOn) this._filteredMemo = out;
			return out;
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
			return this.clearable && this._hasValue && !this._inert && !((this._selectionLimits.min ?? 0) > 0);
		}
		/** The input's placeholder: the source's state while it isn't usable, else the prompt. */
		get _inputPlaceholder() {
			if (this._busy) return this.loadingText;
			if (this._failure) return errorText(this._failure);
			return this._hasValue ? void 0 : this.placeholder;
		}
		/** Full error text (detail first) on hover, since the placeholder may truncate. */
		get _dsErrorTitle() {
			const err = this._failure;
			return err ? errorTitle(err) : void 0;
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
			if (value == null) return this._leafItems.find((item) => this._isSameValue(this._resolveItemValue(item), value));
			return this._leafIndex.get(unwrapReactive(value));
		}
		/**
		* Loaded leaf rows by RAW resolved value (first one wins, like the `.find()` it replaces).
		*
		* Every chip resolves its row through `_findLoadedItem` — `_resolvedValues` alone runs
		* 4–5 times a render, plus a label lookup per chip — and each was a linear scan of the
		* loaded rows: O(selected × loaded) per pass. Rebuilt when the source array, its length,
		* or the key / grouping config changes.
		*/
		get _leafIndex() {
			const src = this._ds.sourceItems;
			const key = [
				src,
				Array.isArray(src) ? src.length : -1,
				this.keyValue,
				this._grouped,
				this.group,
				this.groupItems
			];
			if (key.length !== this._leafIndexKey.length || key.some((v, i) => !Object.is(v, this._leafIndexKey[i]))) {
				const map = /* @__PURE__ */ new Map();
				for (const item of this._leafItems) {
					const v = unwrapReactive(this._resolveItemValue(item));
					if (v != null && !map.has(v)) map.set(v, item);
				}
				this._leafIndexMemo = map;
				this._leafIndexKey = key;
			}
			return this._leafIndexMemo;
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
			if (this._inert) return;
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
			if (this._inert) return;
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
			} catch (err) {
				this._ds.setError(err);
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
			if (this._isSelectAllSlotControl(event)) return;
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
			if (this._inert) return;
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
			if (this._inert) return;
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
			if (this._inert) return;
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
			if (this._inert) return;
			this._setValue(this._keepFloor([]), {
				sourceEvent: event,
				emitClear: true
			});
			this._close();
			this._inputEl?.focus();
		}
		_handleInput(event) {
			if (this._inert) return;
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
			if (this._inert) return;
			this._inputEl?.focus();
			this._moreOpen = false;
			if (this.searchable) this._open = true;
			else if (this._open) this._close();
			else this._open = true;
		}
		/** The chevron: the one mouse gesture that both opens and closes. */
		_toggleFromCaret(event) {
			event.stopPropagation();
			if (this._inert) return;
			this._moreOpen = false;
			if (this._open) this._close();
			else {
				this._open = true;
				this._inputEl?.focus();
			}
		}
		_handleKeydown(event) {
			if (this._retryKey(event)) return;
			if (this._inert) return;
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
        ${this._tooltip.render()}
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
			const canRemove = removable && !this._inert && this._canRemoveMore;
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
		/** Spinner while the source first loads, ↻ after it failed; else nothing. */
		_renderSourceState() {
			if (this._busy) return html`<span mono-ds-spinner role="status" aria-label=${this.loadingText}>${spinnerIcon()}</span>`;
			if (this._failure && !this.disabled) return html`
        <button
          type="button"
          tabindex="-1"
          mono-ds-retry
          aria-label=${this.retryLabel}
          title=${this.retryLabel}
          @mousedown=${(event) => event.preventDefault()}
          @click=${this._retry}
        >
          ${refreshIcon()}
        </button>
      `;
			return nothing;
		}
		_renderActions() {
			const showScroll = this._chipBehaviour === "inline" && this._chipStrip.overflowing;
			const showArrow = !this._showClear && !this._inert;
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
        ${this._renderSourceState()}
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
			const cls = [
				this._cls("mono-tag-input-item", "item"),
				this._cls("mono-tag-input-select-all", "selectAll"),
				"has-check",
				state !== "none" ? "selected" : "",
				pending ? "is-loading" : ""
			].filter(Boolean).join(" ");
			if (this._hasSelectAllSlotState) return html`
        <div
          role="option"
          tabindex="-1"
          class=${cls}
          mono-item
          mono-select-all
          mono-check
          ?mono-selected=${state !== "none"}
          ?mono-loading=${pending}
          aria-selected=${state === "all" ? "true" : "false"}
          aria-busy=${pending ? "true" : "false"}
          aria-disabled=${pending ? "true" : "false"}
          @mousedown=${(event) => event.preventDefault()}
          @click=${(event) => this._onSelectAllClick(usable, state, event)}
        >
          ${this._renderCheckBox(state, pending)}
          <div class=${this._cls("mono-tag-input-select-all-slot", "selectAllSlot")} mono-select-all-slot>
            ${this.renderSelectAllSlot()}
          </div>
        </div>
      `;
			return html`
      <button
        type="button"
        role="option"
        class=${cls}
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
		* Where the consumer's `slot="select-all"` content renders — overridden by the shadow build,
		* which projects it through a native `<slot>`. Light: a placeholder the build moves the
		* captured wrapper into, exactly as `renderListSlot` does for the rows.
		*/
		renderSelectAllSlot() {
			return html`<span data-mono-slot="select-all"></span>`;
		}
		/**
		* Whether a click on the "All" row actually landed on a control inside the consumer's slot
		* content. Walked through `composedPath()` so projected content counts in the shadow build too;
		* it stops at the row, so a `<label>` wrapping the whole panel cannot claim every click.
		*/
		_isSelectAllSlotControl(event) {
			if (!this._hasSelectAllSlotState) return false;
			const row = event.currentTarget;
			let inSlot = false;
			let control = false;
			for (const node of event.composedPath()) {
				if (node === row) break;
				if (!(node instanceof Element)) continue;
				if (node.matches(SELECT_ALL_SLOT_INTERACTIVE)) control = true;
				if (node.getAttribute("slot") === "select-all" || node.hasAttribute("mono-select-all-slot")) inSlot = true;
			}
			return inSlot && control;
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
			if (!this.dataForm || !this.keyForm) return;
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
			const text = this.dataSource && this._ds.loading ? this.loadingText : "No items";
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
			if (this._validation.moved) return html`${this._renderHelperText()}${this._renderMovedMessage()}`;
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
			return this._renderHelperText();
		}
		_renderHelperText() {
			const base = this._cls("mono-tag-input-message", "message");
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
        mono-label-position=${this.labelPosition === "top" ? nothing : this.labelPosition}
        mono-validation-position=${this.validationPosition === "bottom" ? nothing : this.validationPosition}
        mono-validation-state=${state === "default" ? nothing : state}
        ?mono-open=${this._open}
        ?mono-more-open=${this._moreOpen}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-clearable=${this.clearable}
        ?mono-checkable=${this.checkable}
        ?mono-searchable=${this.searchable}
        ?mono-ds-loading=${this._busy}
        ?mono-ds-error=${!!this._failure}
        aria-busy=${this._busy ? "true" : nothing}
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
            placeholder=${ifDefined(this._inputPlaceholder)}
            title=${ifDefined(this._dsErrorTitle)}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly || !this.searchable || this._dsInert}
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

          ${this._validation.renderIcon()}
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

        ${this._validation.renderFloat()}
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
			if (this._inert) return;
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
			if (this._inert) return;
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
			else if (name === "select-all") this._hasSelectAllSlotState = has;
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
	__decorate([property({
		type: String,
		attribute: "label-position"
	})], MonoTagInputCoreClass.prototype, "labelPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-position"
	})], MonoTagInputCoreClass.prototype, "validationPosition", void 0);
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
		attribute: "loading-text"
	})], MonoTagInputCoreClass.prototype, "loadingText", void 0);
	__decorate([property({
		type: String,
		attribute: "retry-label"
	})], MonoTagInputCoreClass.prototype, "retryLabel", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoTagInputCoreClass.prototype, "loading", void 0);
	__decorate([property({ attribute: "loading-error" })], MonoTagInputCoreClass.prototype, "loadingError", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoTagInputCoreClass.prototype, "helperText", void 0);
	__decorate([property()], MonoTagInputCoreClass.prototype, "tooltip", void 0);
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
	__decorate([state()], MonoTagInputCoreClass.prototype, "_hasSelectAllSlotState", void 0);
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
export { validateTagInputProps as n, MonoTagInputCore as r, normalizeSuggestions as t };