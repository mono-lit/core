import { a as __decorate, c as defineHybridPropAlias, d as optionalNumberConverter, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration, u as numberStringConverter, v as monoPendingGrace } from "../../hydration-flush-DHrl4_KK.js";
import { t as dispatchMonoEvent } from "../../mono-event-BPku9HpS.js";
import { n as toCssSize, t as buildSizeStyle } from "../../css-size-DWAPgQdT.js";
import { n as detachEventHandlers, t as applyProps } from "../../element-props-xvw0EB7H.js";
import { t as MonoFormControlCore } from "../../form-control-core-CIdMLXMo.js";
import { a as closeIcon, i as chevronIcon, n as caretIcon } from "../../field-icons-t8rXRCKs.js";
import { n as FieldTooltipController, t as field_tooltip_css_raw_default } from "../../field-tooltip.css_raw-DEctHXKm.js";
import { n as label_position_css_raw_default, r as FieldValidationController, t as field_validation_css_raw_default } from "../../field-validation.css_raw-B3Iu33rS.js";
import { n as applyPopupPlacement, r as computePopupPlacement, t as PopupPortalController } from "../../popup-portal-C8ttHDRX.js";
import { t as createNotifier } from "../../notifier-BIrqUzRh.js";
import { t as monoDataGrid } from "../../mono-data-grid-KDpu4d4_.js";
import { n as resolveChipLimit, r as visibleChipCap, t as ChipStripController } from "../../chip-strip-bNfLn52Z.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/dropdown-table/dropdown-table-core.ts
/** Sentinel so an initial `model-value === our last emit` guard never matches by accident. */
const SYMBOL_INIT = Symbol("init");
/**
* `MonoDropdownTableCore` — the field + popup shell for `<mono-dropdown-table>`. The
* FIELD mirrors `<mono-select>` (same size/color/variant/validation/label props and
* an identical look); the selection/value/display magic lives in the bound
* {@link MonoDropdownController} (`monoDataDropdown`). The consumer's native `<table>`
* + `mono-table-*` are slotted into the body-portaled panel; row clicks delegate to
* `dd.toggleRow`. The panel is sized independently of the field via the `dropdown`
* object (`matchWidth` is intentionally off). Reuses `PopupPortalController`,
* `buildSizeStyle`, and the global `.mono-chip` classes.
*/
const MonoDropdownTableCore = (superClass) => {
	class MonoDropdownTableCoreClass extends MonoFormControlCore(superClass) {
		static {
			this.monoPendingAuto = "data";
		}
		_monoPendingReady() {
			const grid = this._dd?.grid;
			if (!grid) return monoPendingGrace(this);
			if (grid.hasLoaded || grid.error) return true;
			return monoPendingGrace(this) && !grid.loading;
		}
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.labelPosition = "top";
			this.validationPosition = "bottom";
			this.label = "";
			this.placeholder = "Select…";
			this.helperText = "";
			this.tooltip = null;
			this._tooltip = new FieldTooltipController(this, () => this.tooltip);
			this._validation = new FieldValidationController(this, () => ({
				position: this.validationPosition,
				...this._validationNotice ?? {
					state: void 0,
					text: void 0
				},
				suppressed: this._isOpen || this._moreOpen
			}), () => this.renderRoot?.querySelector?.("[mono-dropdown-table] > [mono-dd-control] > [mono-dd-trigger]"));
			this.validationState = "default";
			this.validationMessage = "";
			this.errorMessage = "";
			this.successMessage = "";
			this.required = false;
			this.disabled = false;
			this.readonly = false;
			this.clearable = false;
			this.multiple = false;
			this.maxVisible = 5;
			this.chip = {};
			this.modelValue = void 0;
			this.placement = "bottom-start";
			this.flip = true;
			this.shift = true;
			this.offset = 6;
			this.autoFocusSearch = true;
			this.stayOpen = false;
			this.cssClass = {};
			this.cssClassName = "";
			this._moreOpen = false;
			this._resolvedSide = "bottom";
			this._lastEmitted = SYMBOL_INIT;
			this._chipStrip = new ChipStripController(this, {
				strip: () => this.renderRoot?.querySelector(".mono-dropdown-table-chip-strip"),
				enabled: () => this._inlineChips
			});
			this._popup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-dropdown-table-panel"),
				getAnchor: () => this.renderRoot.querySelector(".mono-dropdown-table-trigger"),
				getStyleScope: () => this.renderRoot.querySelector(".mono-dropdown-table"),
				isOpen: () => this._isOpen,
				matchWidth: false,
				...this._placementOpts(),
				onSideResolved: (side) => {
					this._resolvedSide = side;
					this._applySideClass();
				}
			});
			this._morePopup = new PopupPortalController(this, {
				getPanel: () => this.renderRoot.querySelector(".mono-dropdown-table-more"),
				getAnchor: () => this.renderRoot.querySelector(".mono-dropdown-table-more-chip"),
				getStyleScope: () => this.renderRoot.querySelector(".mono-dropdown-table"),
				isOpen: () => this._moreOpen,
				matchWidth: false,
				...this._morePlacementOpts()
			});
			this._ddPropsQueued = false;
			this._onTriggerKeydown = (e) => {
				if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
					e.preventDefault();
					this.open();
				} else if (e.key === "Escape" && this._isOpen) {
					e.preventDefault();
					this.close();
				}
			};
			this._onDocPointer = (e) => {
				if (this.stayOpen) return;
				if (!this._isOpen && !this._moreOpen) return;
				const path = e.composedPath();
				if (path.includes(this)) return;
				if (this._popup.containsInPath(path)) return;
				if (this._morePopup.containsInPath(path)) return;
				this.close();
			};
			this._onDocKey = (e) => {
				if (e.key !== "Escape") return;
				if (!this._isOpen && !this._moreOpen) return;
				const path = e.composedPath();
				if (this._popup.ownsNestedInPath(path) || this._popup.inLayerAbove(path)) return;
				this.close();
			};
			this._onPanelClick = (e) => {
				if (this.disabled || this.readonly) return;
				const path = e.composedPath();
				if (path.some((n) => n?.matches?.("mono-table-checkbox, mono-shadow-table-checkbox, mono-checkbox, mono-shadow-checkbox, .mono-checkbox, input, button, a, select, textarea"))) return;
				const row = path.find((n) => n?.matches?.("[data-row-key]"));
				if (!row) return;
				const key = row.getAttribute("data-row-key");
				if (key == null) return;
				this._activeRowKey = key;
				this._focusZone = "list";
				this._dd?.toggleRow(key);
				this._reflectSelection();
			};
			this._onViewportChange = () => {
				if (this._isOpen) this._positionPanel();
				if (this._moreOpen) this._positionMorePanel();
			};
			this._wasOpen = false;
			this._lastSelectedCount = 0;
			this._searchFocused = false;
			this._focusZone = "search";
			this._activeRowKey = null;
			this._panelTabHeld = false;
			this._panelTabConsumed = false;
			this._onPanelKeydown = (e) => {
				if (this.disabled || this.readonly || !this._isOpen) return;
				if (e.key === "Tab") {
					if (!this._searchEl()) return;
					e.preventDefault();
					if (!e.repeat) {
						this._panelTabHeld = true;
						this._panelTabConsumed = false;
					}
					return;
				}
				if (this._panelTabHeld && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
					e.preventDefault();
					this._panelTabConsumed = true;
					if (e.key === "ArrowDown") this._enterList();
					else this._enterSearch();
					return;
				}
				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
					if (this._focusZone !== "list") return;
					e.preventDefault();
					this._moveActiveRow(e.key === "ArrowDown" ? 1 : -1);
					return;
				}
				if (e.key === "Enter" && this._focusZone === "list") {
					e.preventDefault();
					this._selectActiveRow();
				}
			};
			this._onPanelKeyup = (e) => {
				if (e.key !== "Tab" || !this._panelTabHeld) return;
				this._panelTabHeld = false;
				if (this._panelTabConsumed) return;
				if (this._focusZone === "search") this._enterList();
				else this._enterSearch();
			};
			defineHybridPropAliases(this, [
				"labelPosition",
				"validationPosition",
				"dataDropdown",
				"modelValue",
				"cssClass",
				"autoFocusSearch",
				"stayOpen",
				"maxVisible",
				"minVisible"
			]);
			defineHybridPropAlias(this, "controlDataDropdown", "dataDropdown");
			for (const alias of ["css-class", "cssclass"]) Object.defineProperty(this, alias, {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
		}
		/** Normalize an object | JSON string | plain-string `css-class` value. */
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
				if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					this.cssClass = JSON.parse(trimmed);
					return;
				} catch {}
				this.cssClassName = trimmed;
			}
		}
		/** Append the consumer's per-part override to a built-in class. */
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		/**
		* `chip` is an object prop, so the real binding is `:chip.prop="{…}"`. This
		* covers the two ways a *string* can arrive: a hand-written JSON attribute
		* (`chip='{"size":"md"}'`, incl. DSD/SSR), and Vue's `String(value)` mirror
		* of a plain `:chip="{…}"` binding — which yields `"[object Object]"` and
		* must be ignored, or it would wipe the property set moments later.
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
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"css-class",
				"cssclass",
				"chip"
			];
		}
		attributeChangedCallback(name, old, value) {
			super.attributeChangedCallback(name, old, value);
			if (name === "css-class" || name === "cssclass") this._setCssClass(value);
			if (name === "chip") this._setChip(value);
		}
		/** The validation message and its state — the same precedence the message row uses. */
		get _validationNotice() {
			if (this.validationMessage) return {
				state: this._validationState,
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
		/** Imperatively sync the `is-<side>` class — see `_resolvedSide`. */
		_applySideClass() {
			const root = this.renderRoot.querySelector(".mono-dropdown-table");
			if (!root) return;
			root.classList.toggle("is-top", this._resolvedSide === "top");
			root.classList.toggle("is-bottom", this._resolvedSide === "bottom");
			root.classList.toggle("is-left", this._resolvedSide === "left");
			root.classList.toggle("is-right", this._resolvedSide === "right");
			if (root.getAttribute("mono-side") !== this._resolvedSide) root.setAttribute("mono-side", this._resolvedSide);
		}
		/** Shared by the light path (the controller) and the shadow path (`_positionMorePanel`). */
		_morePlacementOpts() {
			return {
				side: () => "bottom",
				align: () => "start",
				offset: () => 4,
				flip: () => true,
				shift: () => true,
				constrainSize: () => true
			};
		}
		/**
		* Placement options shared by the light path (the controller) and the shadow
		* path (`_positionPanel`), so both run the identical algorithm.
		*
		* `constrainSize` is on: a field low in a dense grid can have less room than
		* the panel wants on BOTH sides, so flipping alone isn't enough — the panel
		* also has to shrink and scroll internally (see dropdown-table.css).
		*/
		_placementOpts() {
			return {
				side: () => this._sideFromPlacement(this.placement),
				align: () => this._alignFromPlacement(this.placement),
				offset: () => this.offset,
				flip: () => this.flip,
				shift: () => this.shift,
				constrainSize: () => true
			};
		}
		_sideFromPlacement(p) {
			if (p.startsWith("top")) return "top";
			if (p.startsWith("left")) return "left";
			if (p.startsWith("right")) return "right";
			return "bottom";
		}
		_alignFromPlacement(p) {
			if (p.endsWith("-start")) return "start";
			if (p.endsWith("-end")) return "end";
			return "center";
		}
		get _dd() {
			return this.dataDropdown;
		}
		get _isOpen() {
			return !!this._dd?.open;
		}
		get _multi() {
			return this.multiple || !!this._dd?.multiple;
		}
		get _hasValue() {
			const v = this._dd?.value;
			return this._multi ? Array.isArray(v) && v.length > 0 : v != null;
		}
		/** Resolve the effective validation state (message props force it). */
		get _validationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.errorMessage) return "invalid";
			if (this.successMessage) return "valid";
			return "default";
		}
		get _wrapperClasses() {
			const v = this._validationState;
			return [
				"mono-dropdown-table",
				this.size,
				this.color,
				this.variant,
				`is-${this._resolvedSide}`,
				this._isOpen ? "open" : "",
				this._moreOpen ? "more-open" : "",
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				v !== "default" ? `is-${v}` : "",
				this._hasValue ? "has-value" : "",
				this._multi ? "multiple" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _triggerClasses() {
			return [
				"mono-dropdown-table-trigger",
				this.size,
				this.color,
				this.variant,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this.cssClass?.trigger
			].filter(Boolean).join(" ");
		}
		connectedCallback() {
			super.connectedCallback();
			this._subscribe();
			this._wireDropdown();
			if (!isServer) {
				document.addEventListener("pointerdown", this._onDocPointer, true);
				document.addEventListener("keydown", this._onDocKey, true);
				if (this._isShadowHost) {
					window.addEventListener("scroll", this._onViewportChange, true);
					window.addEventListener("resize", this._onViewportChange);
				}
			}
		}
		disconnectedCallback() {
			this._off?.();
			this._off = void 0;
			this._panelObserver?.disconnect();
			this._panelObserver = void 0;
			if (this._dropdownWired) this._dropdownWired.onValueChange = null;
			if (!isServer) {
				document.removeEventListener("pointerdown", this._onDocPointer, true);
				document.removeEventListener("keydown", this._onDocKey, true);
				window.removeEventListener("scroll", this._onViewportChange, true);
				window.removeEventListener("resize", this._onViewportChange);
			}
			super.disconnectedCallback();
		}
		willUpdate(changed) {
			if (changed.has("dataDropdown")) {
				this._subscribe();
				this._wireDropdown();
			}
			if (changed.has("modelValue")) this._pushModelToDd();
			if (changed.has("dataDropdown") || changed.has("max") || changed.has("min") || changed.has("chip")) this._pushLimits();
			super.willUpdate?.(changed);
		}
		/**
		* Second entry point for the props apply. `MonoFormControlCore` (composed
		* below this core) also overrides `update`, so chain `super`.
		*/
		update(changed) {
			this._scheduleApplyDropdownProps();
			super.update(changed);
		}
		_subscribe() {
			this._off?.();
			detachEventHandlers(this);
			this._off = this._dd?.subscribe(() => {
				this._scheduleApplyDropdownProps();
				this.requestUpdate();
			});
			this._scheduleApplyDropdownProps();
		}
		/**
		* Deferred + de-duplicated, and driven from `update()` as well as
		* `_subscribe()` — the same belt-and-braces the table base needed once two
		* cores were found replacing `_subscribe` without chaining `super`. The
		* deferral keeps the reactive writes out of the update cycle, so they can't
		* trip Lit's change-in-update warning.
		*/
		_scheduleApplyDropdownProps() {
			if (this._ddPropsQueued) return;
			if (typeof queueMicrotask !== "function") {
				this._applyDropdownProps();
				return;
			}
			this._ddPropsQueued = true;
			queueMicrotask(() => {
				this._ddPropsQueued = false;
				this._applyDropdownProps();
			});
		}
		/**
		* Pull `monoDataDropdown({ props: { dropdownTable } })` onto this element, so
		* the field needs nothing but `:data-dropdown.prop`. The CONTROLLER WINS for
		* keys it declares; the rest stay with the template.
		*/
		_applyDropdownProps() {
			const dd = this._dd;
			if (!dd?.props) return;
			applyProps(this, dd.props().dropdownTable);
		}
		_wireDropdown() {
			const dd = this._dd;
			if (this._dropdownWired && this._dropdownWired !== dd) this._dropdownWired.onValueChange = null;
			this._dropdownWired = dd;
			if (!dd) return;
			dd.onValueChange = (v) => {
				this._lastEmitted = v;
				this.modelValue = v;
				this._emitChange(v);
			};
			this._pushModelToDd();
		}
		/**
		* The selection limits the element asks for: `chip.max` / `chip.min` pin,
		* `max` / `min` are the fallback, and `undefined` leaves the controller's own
		* option in force. They are ENFORCED by the controller's check store (the one
		* place a row click, the keyboard, a `<mono-table-checkbox>` and the
		* select-all drain all go through), so the element only forwards them.
		*/
		_pushLimits() {
			const chip = this._chipProps;
			this._dd?.setLimits({
				max: resolveChipLimit(chip, "max", this.max),
				min: resolveChipLimit(chip, "min", this.min)
			});
		}
		/** Push an external `model-value` into the controller (guarding our own echo). */
		_pushModelToDd() {
			const dd = this._dd;
			if (!dd || this.modelValue === void 0) return;
			if (this._sameValue(this.modelValue, this._lastEmitted)) return;
			if (this._sameValue(this.modelValue, dd.value)) return;
			dd.setValue(this.modelValue);
		}
		_sameValue(a, b) {
			if (a === b) return true;
			if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => String(x) === String(b[i]));
			return String(a) === String(b);
		}
		_emitChange(value) {
			const detail = {
				modelValue: value,
				value,
				selectedItems: this._dd?.selectedItems() ?? []
			};
			dispatchMonoEvent(this, "change", detail);
		}
		/** Whether the panel is currently open. */
		get isOpen() {
			return this._isOpen;
		}
		open() {
			if (this.disabled || this.readonly) return;
			this._dd?.setOpen(true);
		}
		close() {
			this._moreOpen = false;
			this._dd?.setOpen(false);
			this.requestUpdate();
		}
		toggle() {
			if (this.disabled || this.readonly) return;
			this._moreOpen = false;
			this._dd?.setOpen(!this._isOpen);
		}
		/**
		* Where the `[data-row-key]` rows live: light = the captured table inside the
		* (portaled) panel; shadow = the SLOTTED table (host's light-DOM children).
		*/
		get _rowScope() {
			return this.renderRoot === this ? this._popup.panelRoot : this;
		}
		_reflectSelection() {
			const dd = this._dd;
			const root = this._rowScope;
			if (!dd || !root?.querySelectorAll) return;
			const rows = Array.from(root.querySelectorAll("[data-row-key]"));
			if ((this._focusZone === "list" || this._activeRowKey != null) && rows.length && !rows.some((el) => el.getAttribute("data-row-key") === this._activeRowKey)) this._activeRowKey = rows[0].getAttribute("data-row-key");
			rows.forEach((el) => {
				const key = el.getAttribute("data-row-key");
				const on = key != null && dd.isSelected(key);
				const active = key != null && key === this._activeRowKey;
				el.classList.toggle("mono-dd-row-selected", on);
				el.classList.toggle("mono-dd-row-active", active);
				el.toggleAttribute("mono-selected", on);
				el.toggleAttribute("mono-dd-selected", on);
				el.toggleAttribute("mono-dd-active", active);
				if (on) el.setAttribute("aria-selected", "true");
				else el.removeAttribute("aria-selected");
			});
		}
		/** Re-reflect after the consumer's Vue re-renders rows (paging/search). */
		_observePanel() {
			const root = this._rowScope;
			if (!root || this._panelObserver) return;
			this._panelObserver = new MutationObserver(() => this._reflectSelection());
			this._panelObserver.observe(root, {
				childList: true,
				subtree: true
			});
		}
		/** True for the shadow build — a shadow host keeps its panel in the shadow root. */
		get _isShadowHost() {
			return this.renderRoot !== this;
		}
		/**
		* Position the panel for the SHADOW build (renderRoot ≠ this): the popup
		* controller only portals/positions LIGHT hosts (`_canPortal`), so a shadow
		* host places its own `position:fixed` panel. It runs the SAME shared math as
		* the light path — flip, shift and size-constrain included. Light is untouched.
		*/
		_positionPanel() {
			if (isServer || !this._isShadowHost) return;
			if (!this._isOpen) return;
			const root = this.renderRoot;
			const panel = root.querySelector(".mono-dropdown-table-panel");
			const anchor = root.querySelector(".mono-dropdown-table-trigger");
			if (!panel || !anchor) return;
			const o = this._placementOpts();
			const placement = computePopupPlacement(anchor, panel, {
				side: o.side(),
				align: o.align(),
				offset: o.offset(),
				flip: o.flip(),
				shift: o.shift(),
				constrain: true
			});
			applyPopupPlacement(panel, placement, true);
			this._resolvedSide = placement.side;
			this._applySideClass();
		}
		/** The shadow build's in-place placement of the "+N more" panel — see `_positionPanel`. */
		_positionMorePanel() {
			if (isServer || !this._isShadowHost) return;
			if (!this._moreOpen) return;
			const root = this.renderRoot;
			const panel = root.querySelector(".mono-dropdown-table-more");
			const anchor = root.querySelector(".mono-dropdown-table-more-chip");
			if (!panel || !anchor) return;
			const o = this._morePlacementOpts();
			const placement = computePopupPlacement(anchor, panel, {
				side: o.side(),
				align: o.align(),
				offset: o.offset(),
				flip: o.flip(),
				shift: o.shift(),
				constrain: true
			});
			applyPopupPlacement(panel, placement, true);
		}
		updated(changed) {
			super.updated(changed);
			if (isServer) return;
			if (this._isOpen) {
				this._observePanel();
				this._reflectSelection();
				this._positionPanel();
			} else {
				this._panelObserver?.disconnect();
				this._panelObserver = void 0;
			}
			if (this._moreOpen) {
				if (!this._overflowItems(this._dd?.selectedItems() ?? []).length) {
					this._moreOpen = false;
					this.requestUpdate();
				} else this._positionMorePanel();
			}
			const selectedCount = this._dd?.selectedItems?.()?.length ?? 0;
			const capChanged = changed.has("maxVisible") || changed.has("minVisible") || changed.has("chip");
			if (selectedCount !== this._lastSelectedCount) {
				if (this._isOpen && selectedCount > this._lastSelectedCount && this._inlineChips) this._chipStrip.scrollToEnd();
				else this._chipStrip.invalidate();
			} else if (capChanged) this._chipStrip.invalidate();
			this._lastSelectedCount = selectedCount;
			if (this._isOpen !== this._wasOpen) {
				this._wasOpen = this._isOpen;
				if (this._isOpen) this._initPanelFocus();
				else {
					this._activeRowKey = null;
					this._focusZone = "search";
					this._panelTabHeld = false;
					this._restoreTriggerFocus();
				}
			}
		}
		/** The focusable trigger (`tabindex=0`), in both builds. */
		_triggerElement() {
			return this.renderRoot.querySelector(".mono-dropdown-table-trigger");
		}
		/**
		* Delegate focus to the trigger — the host itself isn't focusable. Needed by
		* anything that focuses the component from outside, e.g. the data grid
		* focusing the editor in a clicked cell (`focusRowCell`), which looks for an
		* inner `input/textarea/select/button` and otherwise falls back to calling
		* `focus()` on the element itself.
		*/
		focus(options) {
			this._triggerElement()?.focus(options);
		}
		blur() {
			this._triggerElement()?.blur();
		}
		/** The search region's slotted content — light: captured nodes; shadow: `<slot>`. */
		_searchRegionElements() {
			if (this._isShadowHost) {
				const slot = this.renderRoot.querySelector("slot[name=\"search\"]");
				return slot ? slot.assignedElements({ flatten: true }) : [];
			}
			const sel = "[data-mono-slot=\"search\"]";
			const region = this.querySelector(sel) ?? this._popup.panelRoot?.querySelector?.(sel);
			return region ? Array.from(region.children) : [];
		}
		/**
		* Focus the panel's search box once the panel is rendered, placed and (light
		* build) portaled. Deferred a microtask so a slotted element that hasn't
		* rendered its input yet gets a chance to — `updateComplete` on the search
		* element itself, since it updates independently of this host.
		*/
		/**
		* The element to focus for "the search box", or null when the panel has no
		* search region. `mono-table-search` / `mono-shadow-table-search` expose
		* `focus()` and delegate to their own input, so neither build needs a DOM
		* reach-in; anything else slotted in its place falls back to its first field.
		*/
		_searchEl() {
			for (const el of this._searchRegionElements()) {
				if (el.matches("mono-table-search, mono-shadow-table-search")) return el;
				const sel = "input:not([type=\"hidden\"]), textarea, select";
				const field = el.matches(sel) ? el : el.querySelector(sel) ?? el.shadowRoot?.querySelector(sel);
				if (field) return field;
			}
			return null;
		}
		async _focusSearch() {
			await this.updateComplete;
			if (!this._isOpen) return;
			const el = this._searchEl();
			if (!el) return;
			const pending = el.updateComplete;
			if (pending) await pending;
			if (!this._isOpen) return;
			el.focus({ preventScroll: true });
			this._focusZone = "search";
			this._searchFocused = true;
		}
		_rowEls() {
			const root = this._rowScope;
			if (!root?.querySelectorAll) return [];
			return Array.from(root.querySelectorAll("[data-row-key]"));
		}
		_panelEl() {
			return (this._popup.panelRoot ?? this.renderRoot)?.querySelector?.(".mono-dropdown-table-panel") ?? null;
		}
		_setActiveRow(key, reveal = false) {
			this._activeRowKey = key;
			this._reflectSelection();
			if (!reveal || key == null) return;
			this._rowEls().find((r) => r.getAttribute("data-row-key") === key)?.scrollIntoView?.({ block: "nearest" });
		}
		_moveActiveRow(delta) {
			const keys = this._rowEls().map((r) => r.getAttribute("data-row-key") ?? "");
			if (!keys.length) return;
			const i = this._activeRowKey == null ? -1 : keys.indexOf(this._activeRowKey);
			const next = i < 0 ? delta > 0 ? 0 : keys.length - 1 : Math.min(Math.max(i + delta, 0), keys.length - 1);
			this._setActiveRow(keys[next], true);
		}
		/** Move the keyboard into the row list, highlighting the first row. */
		_enterList() {
			this._focusZone = "list";
			if (this._activeRowKey == null) this._setActiveRow(this._rowEls()[0]?.getAttribute("data-row-key") ?? null, true);
			this._panelEl()?.focus({ preventScroll: true });
		}
		/** Move the keyboard back to the search box (no-op when there isn't one). */
		_enterSearch() {
			const el = this._searchEl();
			if (!el) return;
			this._focusZone = "search";
			el.focus({ preventScroll: true });
		}
		_selectActiveRow() {
			if (this._activeRowKey == null) return;
			this._dd?.toggleRow(this._activeRowKey);
			this._reflectSelection();
		}
		/**
		* Where the keyboard starts when the panel opens: the search box if there is
		* one, otherwise straight into the list with the first row highlighted.
		*/
		async _initPanelFocus() {
			await this.updateComplete;
			if (!this._isOpen) return;
			const selected = this._dd?.selectedItems?.() ?? [];
			if (selected.length) this._setActiveRow(String(selected[selected.length - 1].key), true);
			if (this._searchEl()) {
				this._focusZone = "search";
				if (this.autoFocusSearch) this._focusSearch();
				return;
			}
			this._enterList();
		}
		/**
		* Hand focus back to the trigger when a panel that HAD focus closes — hiding
		* the panel blurs its input to `<body>`, which would otherwise strand the
		* keyboard. Covers every close path (Escape, outside pointerdown, a
		* controller-driven auto-close after a single-select pick) because it hangs
		* off the state edge rather than off `close()`.
		*/
		_restoreTriggerFocus() {
			if (!this._searchFocused) return;
			this._searchFocused = false;
			const active = document.activeElement;
			const panel = this._popup.panelRoot?.querySelector?.(".mono-dropdown-table-panel");
			if (!(!active || active === document.body || this.contains(active) || !!panel?.contains(active))) return;
			this.focus({ preventScroll: true });
		}
		/** A panel region — light: a `data-mono-slot` capture target; shadow overrides with `<slot>`. */
		_renderRegion(cls, name) {
			return html`<div class="mono-dropdown-table-region ${cls}" mono-dd-region=${cls} data-mono-slot="${name}"></div>`;
		}
		_caretIcon() {
			return caretIcon();
		}
		_chevronIcon(dir) {
			return chevronIcon(dir);
		}
		/**
		* One scroll button. `active` false keeps the box — and therefore the row's
		* width — but hides it (`is-idle` → `visibility: hidden`), so reaching an end
		* of the strip costs no layout. `aria-hidden` keeps the hidden one out of
		* reach of assistive tech; `pointer-events: none` handles the pointer.
		*/
		_renderScrollButton(dir, active) {
			const back = dir === -1;
			const base = `mono-dropdown-table-scroll mono-dropdown-table-scroll-${back ? "prev" : "next"}${active ? "" : " is-idle"}`;
			return html`<span
        role="button"
        tabindex="-1"
        class=${this._cls(base, back ? "scrollPrev" : "scrollNext")}
        mono-dd-scroll=${back ? "prev" : "next"}
        ?mono-idle=${!active}
        aria-label=${back ? "Scroll selection backward" : "Scroll selection forward"}
        aria-hidden=${active ? "false" : "true"}
        @mousedown=${(e) => e.preventDefault()}
        @click=${(e) => {
				e.stopPropagation();
				this._chipStrip.page(dir);
			}}
        >${this._chevronIcon(dir)}</span
      >`;
		}
		/** The `chip` prop, always an object (it can be assigned null from a binding). */
		get _chipProps() {
			return this.chip ?? {};
		}
		/** Chip layout: `inline` = one scrolling line, anything else = today's wrap. */
		get _chipBehaviour() {
			return this._chipProps.behaviour === "inline" ? "inline" : "flex";
		}
		/** True where a scrolling strip actually renders: multi, inline, with chips. */
		get _inlineChips() {
			return this._multi && this._hasValue && this._chipBehaviour === "inline";
		}
		/**
		* How many chips to draw for `total` selected rows before the rest collapse
		* into "+N more" — Infinity when uncapped or under the collapse floor.
		* `chip.maxVisible` / `chip.minVisible` pin, the element props are the
		* fallback (`resolveChipLimit`). Applies to `inline` as well: the "+N more"
		* chip then sits in the strip after the visible ones and its panel lists the
		* rest, exactly as in `flex`.
		*/
		_visibleCap(total) {
			const chip = this._chipProps;
			return visibleChipCap(total, resolveChipLimit(chip, "maxVisible", this.maxVisible), resolveChipLimit(chip, "minVisible", this.minVisible));
		}
		/** The selection floor in force (element / chip / controller), 0 when none. */
		get _minSelected() {
			return this._dd?.limits().min ?? 0;
		}
		/** A chip can be removed while the selection sits above its floor. */
		get _canRemove() {
			return (this._dd?.selectedItems?.()?.length ?? 0) > this._minSelected;
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
		* Classes shared by the selection chips and the "+N more" chip, in
		* `mono-chip`'s own order (`mono-chip <size> <variant>-<color> <shape>`), so
		* chip.css paints them exactly as it paints a real `<mono-chip>`.
		*
		* `mono-dropdown-table-chip` is a marker only — it scopes the `--mono-chip-*`
		* bridge in dropdown-table.css so the bridge never reaches a `<mono-chip>` a
		* consumer slots into the panel. `chip.color` deliberately picks a hue OTHER
		* than the control accent, so it adds the `-pinned` marker that switches the
		* bridge back off.
		*/
		get _chipBaseClasses() {
			const chip = this._chipProps;
			return [
				"mono-dropdown-table-chip",
				chip.color ? "mono-dropdown-table-chip-pinned" : "",
				chip.size ?? (this.size === "xs" || this.size === "sm" ? "xs" : "sm"),
				`${this._chipVariantClass}-${this._chipColorClass}`,
				"",
				chip.dot ? "has-dot" : ""
			].filter(Boolean).join(" ");
		}
		/**
		* Class for one chip part. Both class APIs append: the field-level key
		* (`cssClass.chip` / `.chipLabel` / `.chipRemove`) and the chip-level one
		* (`chip.cssClass.*`, which additionally reaches the parts the field has no
		* key for — `main`, `content`, `dot`).
		*/
		_chipCls(base, chipKey, key) {
			return [
				base,
				key ? this.cssClass?.[key] : void 0,
				this._chipProps.cssClass?.[chipKey]
			].filter(Boolean).join(" ");
		}
		_renderChip(it) {
			const chip = this._chipProps;
			const removable = !this.disabled && !this.readonly && this._canRemove;
			return html`
        <div
          class=${this._chipCls(`${this._chipBaseClasses}${removable ? " removable" : ""}`, "root", "chip")}
          mono-dd-chip
          ?mono-dd-removable=${removable}
          mono-dd-chip-color=${chip.color ?? nothing}
          mono-dd-chip-rounded=${chip.rounded ?? nothing}
        >
          <span class=${ifDefined(chip.cssClass?.main)} mono-dd-chip-main>
            <span class=${this._chipCls("chip-content", "content")} mono-dd-chip-content>
              ${chip.dot ? html`<span class=${this._chipCls("chip-dot", "dot")} mono-dd-chip-dot aria-hidden="true"></span>` : nothing}
              <span class=${this._chipCls("chip-label", "label", "chipLabel")} mono-dd-chip-label>${it.text}</span>
              ${removable ? html`<button
                    type="button"
                    class=${this._chipCls("chip-close", "close", "chipRemove")}
                    mono-dd-chip-close
                    aria-label=${chip.closeLabel ?? `Remove ${it.text}`}
                    @click=${(e) => {
				e.stopPropagation();
				this._dd?.removeKey(it.key);
			}}
                  >
                    ${closeIcon()}
                  </button>` : nothing}
            </span>
          </span>
        </div>
      `;
		}
		/**
		* The chip region. `flex` returns the chips as bare children of the value
		* span, so they wrap — the historical markup, unchanged. `inline` nests them
		* in one `overflow-x: hidden` strip instead, which is what makes the row
		* scroll as a unit.
		*/
		_renderChipRegion(items) {
			const chips = this._renderChips(items);
			if (this._chipBehaviour !== "inline") return chips;
			return html`
        <span class=${this._cls("mono-dropdown-table-chip-strip", "chipStrip")} mono-dd-chip-strip>${chips}</span>
      `;
		}
		_renderChips(items) {
			const max = this._visibleCap(items.length);
			const visible = max === Infinity ? items : items.slice(0, max);
			const overflow = this._overflowItems(items);
			const chips = visible.map((it) => this._renderChip(it));
			if (overflow.length) chips.push(html`
          <div
            class=${this._cls(`${this._chipBaseClasses.replace(" has-dot", "")} clickable mono-dropdown-table-more-chip`, "moreChip")}
            mono-dd-chip
            mono-dd-more
            mono-dd-chip-color=${this._chipProps.color ?? nothing}
            mono-dd-chip-rounded=${this._chipProps.rounded ?? nothing}
          >
            <span
              class=${ifDefined(this._chipProps.cssClass?.main)}
              mono-dd-chip-main
              role="button"
              tabindex="0"
              @mousedown=${(e) => e.preventDefault()}
              @click=${(e) => {
				e.stopPropagation();
				const next = !this._moreOpen;
				this._dd?.setOpen(false);
				this._moreOpen = next;
				this.requestUpdate();
			}}
            >
              <span class=${this._chipCls("chip-content", "content")} mono-dd-chip-content
                ><span class=${this._chipCls("chip-label", "label")} mono-dd-chip-label
                  >+${overflow.length} more</span
                ></span
              >
            </span>
          </div>
        `);
			return chips;
		}
		/** Selected rows past the visible cap — empty when uncapped or under the collapse floor. */
		_overflowItems(items) {
			const max = this._visibleCap(items.length);
			return max === Infinity ? [] : items.slice(max);
		}
		/**
		* Always rendered, shown by the root's `more-open` class: the panel lives in
		* a body portal while open and a portaled node cannot be removed by a
		* conditional render (Lit's ChildPart no longer contains it).
		*/
		_renderMore(items) {
			const overflow = this._moreOpen ? this._overflowItems(items) : [];
			return html`<div class="mono-dropdown-table-more" mono-dd-more>${overflow.map((it) => this._renderChip(it))}</div>`;
		}
		_renderLabel() {
			if (!this.label) return nothing;
			return html`<label class=${this._cls("mono-dropdown-table-label", "label")} mono-dd-label
        >${this.label}${this.required ? html`<span class=${this._cls("mono-dropdown-table-required", "required")} mono-dd-required-mark>*</span>` : nothing}${this._tooltip.render()}</label
      >`;
		}
		_renderMessage() {
			const base = this._cls("mono-dropdown-table-message", "message");
			if (this._validation.moved) {
				const notice = this._validationNotice;
				return html`${this.helperText ? html`<div class="${base} helper" mono-dd-message="helper">${this.helperText}</div>` : nothing}<div
          class="${base} ${notice.state}"
          mono-dd-message=${notice.state}
          mono-sr-only
          role=${notice.state === "invalid" ? "alert" : nothing}
        >${notice.text}</div>`;
			}
			if (this.validationMessage) {
				const state = this._validationState;
				return html`<div class="${base} ${state}" mono-dd-message=${state} role=${state === "invalid" ? "alert" : nothing}>
          ${this.validationMessage}
        </div>`;
			}
			if (this.errorMessage) return html`<div class="${base} invalid" mono-dd-message="invalid" role="alert">${this.errorMessage}</div>`;
			if (this.successMessage) return html`<div class="${base} valid" mono-dd-message="valid">${this.successMessage}</div>`;
			if (this.helperText) return html`<div class="${base} helper" mono-dd-message="helper">${this.helperText}</div>`;
			return nothing;
		}
		_renderTrigger(items) {
			const dd = this._dd;
			const hasValue = this._hasValue;
			const inert = this.disabled || this.readonly;
			const canClear = this.clearable && hasValue && !inert && !(this._multi && this._minSelected > 0);
			const inlineChips = this._inlineChips;
			return html`
        <div
          class=${this._triggerClasses}
          mono-dd-trigger
          role="combobox"
          tabindex=${this.disabled ? -1 : 0}
          aria-expanded=${this._isOpen ? "true" : "false"}
          @click=${() => this.toggle()}
          @keydown=${this._onTriggerKeydown}
        >
          <span
            class="${this._cls("mono-dropdown-table-value", "value")}${hasValue ? "" : ` mono-dropdown-table-placeholder${this.cssClass?.placeholder ? ` ${this.cssClass.placeholder}` : ""}`}${inlineChips ? " is-inline" : ""}"
            mono-dd-value
            ?mono-dd-placeholder=${!hasValue}
            ?mono-inline=${inlineChips}
          >
            ${this._multi ? hasValue ? this._renderChipRegion(items) : this.placeholder : hasValue ? html`<span>${dd?.displayText()}</span>` : this.placeholder}
          </span>
          ${this._validation.renderIcon()}
          <span class=${this._cls("mono-dropdown-table-actions", "actions")} mono-dd-actions>
            ${inlineChips && this._chipStrip.overflowing ? html`${this._renderScrollButton(-1, this._chipStrip.canScrollStart)}
                    ${this._renderScrollButton(1, this._chipStrip.canScrollEnd)}` : nothing}
            ${canClear ? html`<span
                    role="button"
                    tabindex="-1"
                    class=${this._cls("mono-dropdown-table-clear", "clear")}
                    mono-dd-clear
                    aria-label="Clear"
                    @mousedown=${(e) => e.preventDefault()}
                    @click=${(e) => {
				e.stopPropagation();
				this._dd?.clear();
				this.close();
			}}
                    >${closeIcon()}</span
                  >` : nothing}
            ${!inert && !canClear ? html`<span
                    role="button"
                    tabindex="-1"
                    class=${this._cls("mono-dropdown-table-arrow", "arrow")}
                    mono-dd-arrow
                    aria-label="Toggle"
                    aria-expanded=${this._isOpen ? "true" : "false"}
                    @mousedown=${(e) => e.preventDefault()}
                    @click=${(e) => {
				e.stopPropagation();
				this.toggle();
			}}
                    >${this._caretIcon()}</span
                  >` : nothing}
          </span>
        </div>
      `;
		}
		/**
		* Panel-only sizing from the `dropdown` object.
		*
		* `maxHeight` is published as the custom property `--_mono-dropdown-table-panel-max-h` rather than a direct
		* `max-height`: the popup controller also constrains the panel (via `--mono-popup-avail-h`),
		* and two writers on the same declaration would clobber each other across renders. The CSS
		* combines both with `min()`. Everything else is a plain declaration.
		*
		* `height` is an EXACT height here now. It used to be the cap, because this object had no
		* `maxHeight`; it does now, and the three popup components share one meaning.
		*/
		_panelStyle() {
			const d = this.dropdown;
			if (!d) return {};
			const s = {};
			const w = toCssSize(d.width);
			const mw = toCssSize(d.minWidth);
			const xw = toCssSize(d.maxWidth);
			const h = toCssSize(d.height);
			const mh = toCssSize(d.minHeight);
			const xh = toCssSize(d.maxHeight);
			if (w) s.width = w;
			if (mw) s["min-width"] = mw;
			if (xw) s["max-width"] = xw;
			if (h) s.height = h;
			if (mh) s["min-height"] = mh;
			if (xh) s["--_mono-dropdown-table-panel-max-h"] = xh;
			return s;
		}
		render() {
			const items = this._dd?.selectedItems() ?? [];
			const state = this._validationState;
			return html`
        <div
          class=${this._wrapperClasses}
          style=${styleMap(buildSizeStyle(this))}
          mono-dropdown-table
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          mono-variant=${this.variant === "outlined" ? nothing : this.variant}
          mono-label-position=${this.labelPosition === "top" ? nothing : this.labelPosition}
          mono-validation-position=${this.validationPosition === "bottom" ? nothing : this.validationPosition}
          mono-validation-state=${state === "default" ? nothing : state}
          mono-side=${this._resolvedSide}
          ?mono-open=${this._isOpen}
          ?mono-more-open=${this._moreOpen}
          ?mono-disabled=${this.disabled}
          ?mono-readonly=${this.readonly}
          ?mono-required=${this.required}
          ?mono-clearable=${this.clearable}
          ?mono-multiple=${this._multi}
          ?mono-has-value=${this._hasValue}
        >
          ${this._renderLabel()}
          <div
            class="mono-dropdown-table-control${this._inlineChips ? " is-inline" : ""}"
            mono-dd-control
            ?mono-inline=${this._inlineChips}
          >
            ${this._renderTrigger(items)} ${this._renderMore(items)}
          </div>
          ${this._renderMessage()}
          ${this._validation.renderFloat()}
          <div
            class="mono-dropdown-table-panel ${this._isOpen ? "open" : ""}"
            mono-dd-panel
            role="dialog"
            tabindex="-1"
            style=${styleMap(this._panelStyle())}
            @click=${this._onPanelClick}
            @keydown=${this._onPanelKeydown}
            @keyup=${this._onPanelKeyup}
          >
            ${this._renderRegion("search", "search")}
            ${this._renderRegion("body", "body")}
            ${this._renderRegion("foot", "footer")}
          </div>
        </div>
      `;
		}
	}
	__decorate([property({ attribute: false })], MonoDropdownTableCoreClass.prototype, "dataDropdown", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "variant", void 0);
	__decorate([property({
		type: String,
		attribute: "label-position"
	})], MonoDropdownTableCoreClass.prototype, "labelPosition", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-position"
	})], MonoDropdownTableCoreClass.prototype, "validationPosition", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "label", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "placeholder", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoDropdownTableCoreClass.prototype, "helperText", void 0);
	__decorate([property()], MonoDropdownTableCoreClass.prototype, "tooltip", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoDropdownTableCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoDropdownTableCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoDropdownTableCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoDropdownTableCoreClass.prototype, "successMessage", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownTableCoreClass.prototype, "required", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownTableCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownTableCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownTableCoreClass.prototype, "clearable", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownTableCoreClass.prototype, "multiple", void 0);
	__decorate([property({ converter: optionalNumberConverter })], MonoDropdownTableCoreClass.prototype, "max", void 0);
	__decorate([property({ converter: optionalNumberConverter })], MonoDropdownTableCoreClass.prototype, "min", void 0);
	__decorate([property({
		attribute: "max-visible",
		converter: optionalNumberConverter
	})], MonoDropdownTableCoreClass.prototype, "maxVisible", void 0);
	__decorate([property({
		attribute: "min-visible",
		converter: optionalNumberConverter
	})], MonoDropdownTableCoreClass.prototype, "minVisible", void 0);
	__decorate([property({ attribute: false })], MonoDropdownTableCoreClass.prototype, "chip", void 0);
	__decorate([property({ attribute: "model-value" })], MonoDropdownTableCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoDropdownTableCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoDropdownTableCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoDropdownTableCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoDropdownTableCoreClass.prototype, "maxHeight", void 0);
	__decorate([property({ attribute: false })], MonoDropdownTableCoreClass.prototype, "dropdown", void 0);
	__decorate([property({ type: String })], MonoDropdownTableCoreClass.prototype, "placement", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDropdownTableCoreClass.prototype, "flip", void 0);
	__decorate([property({ converter: booleanStringConverter })], MonoDropdownTableCoreClass.prototype, "shift", void 0);
	__decorate([property({ converter: numberStringConverter })], MonoDropdownTableCoreClass.prototype, "offset", void 0);
	__decorate([property({
		attribute: "auto-focus-search",
		converter: booleanStringConverter
	})], MonoDropdownTableCoreClass.prototype, "autoFocusSearch", void 0);
	__decorate([property({
		attribute: "stay-open",
		reflect: true,
		converter: booleanStringConverter
	})], MonoDropdownTableCoreClass.prototype, "stayOpen", void 0);
	__decorate([property({ attribute: false })], MonoDropdownTableCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoDropdownTableCoreClass.prototype, "cssClassName", void 0);
	return MonoDropdownTableCoreClass;
};

//#endregion
//#region \0raw:C:\Users\VCT-DEV\Desktop\libs\packages\helper\src\components\dropdown-table\dropdown-table.css?raw.js
var dropdown_table_css_raw_default = "/* LEGACY CLASS ALIASES — every `[mono-x]` below is wrapped as `:is([mono-x], .legacy)`\n   by `scripts/legacy-class-alias.mjs` (`.mono-dropdown-table-region.body`,\n   `tr.mono-dd-row-selected`, …), so host CSS and hand-written markup on the pre-port\n   class contract keep painting. Author with the attribute only; re-run the script. */\n/* =========================================================================\n   mono-dropdown-table — a dropdown whose panel is a native `<table>` for\n   picking row(s). An EXTENSION: Basecoat has no table picker, so the FIELD is\n   the multi-select combobox's chip box (`.combobox-chips` + `.combobox-chip`,\n   basecoat-css@1.0.2, vega style) on the `.field` / `.label` chrome, and the\n   PANEL is the combobox's `[data-popover]` holding a ported `<table mono-table>`\n   instead of a listbox — so the rows are the table's own rows.\n\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\n\n     <mono-dropdown-table size=\"sm\" color=\"danger\" label=\"Owner\" clearable multiple>\n     <div mono-dropdown-table mono-size=\"sm\" mono-color=\"danger\" mono-clearable mono-multiple>\n       <label mono-dd-label>Owner</label>\n       <div mono-dd-control>\n         <div mono-dd-trigger role=\"combobox\">\n           <span mono-dd-value>\n             <div mono-dd-chip mono-dd-removable><span mono-dd-chip-main><span mono-dd-chip-content>\n               <span mono-dd-chip-label>Ada</span><button mono-dd-chip-close>…</button></span></span></div>\n           </span>\n           <span mono-dd-actions><span mono-dd-arrow>…</span></span>\n         </div>\n       </div>\n       <div mono-dd-panel><div mono-dd-region=\"body\"><table mono-table>…</table></div></div>\n     </div>\n\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined). The element\n   renders these attributes on its wrapper (both builds) plus the STATES\n   `mono-open` / `mono-more-open` / `mono-has-value` / `mono-side`; the old\n   classes (`.mono-dropdown-table.sm.open`) are still emitted as inert hooks until\n   2.0 but no rule here reads them. The chips are NOT `.mono-chip`s any more: they\n   are Basecoat combobox chips painted here, and chip.css never sees them.\n\n   THE PARTS ARE FAMILY-UNIQUE (`mono-dd-*`), never the bare `mono-chip` /\n   `mono-panel` / `mono-actions` the field components use: the panel holds a whole\n   `<table mono-table>` whose cells may carry a consumer's `<mono-chip>`, and a\n   `[mono-dropdown-table] [mono-chip]` rule would repaint it.\n\n   Selector map (ours ≡ upstream):\n     [mono-dropdown-table]                          ≡ .field (gap-3, as margins) + .combobox (position: relative)\n     [mono-dropdown-table] > [mono-dd-label]        ≡ .field > label / .label\n     [mono-dd-trigger]                              ≡ .combobox-chips (min-h-9 gap-1.5 rounded-md border-input px-1.5 py-1.5 text-sm shadow-xs)\n     [mono-dd-value]                                ≡ the chip row; EXTENSION: the single value / placeholder text\n     [mono-dd-chip] > [mono-dd-chip-main]           ≡ .combobox-chip (h-5.5 gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium)\n     [mono-dd-chip] [mono-dd-chip-close]            ≡ .combobox-chip-remove (-ms-1 opacity-50 hover:100, svg size-3.5)\n     [mono-dd-chip][mono-dd-more]                   ≡ EXTENSION (the \"+N more\" counter chip, same box)\n     [mono-dd-actions] > [mono-dd-arrow] > svg      ≡ .combobox-trigger-icon (size-4 text-muted-foreground)\n     [mono-dd-actions] > [mono-dd-clear]            ≡ .combobox [data-clear] (size-6, painted as .btn[data-variant='ghost'])\n     [mono-dd-actions] > [mono-dd-scroll]           ≡ EXTENSION (the inline strip's ‹ › pager, same box)\n     [mono-dd-panel]                                ≡ .combobox [data-popover] (bg-popover ring-1 rounded-md shadow-md); EXTENSION: a flex column of regions\n     [mono-dd-region=\"search|body|foot\"]            ≡ EXTENSION (search box / the scrolling table / the pager)\n     [mono-dd-more]                                 ≡ [data-popover] holding the overflow chips\n     [mono-table] tbody tr[mono-selected]           ≡ .table tr data-[state=selected] — the TABLE's own rule paints it\n     [mono-table] tbody tr[mono-dd-active]          ≡ .combobox [role='option'].active (bg-muted) — the keyboard cursor\n     [mono-dd-message=\"…\"]                          ≡ .field > p / .field [role='alert']\n     [mono-validation-state=\"invalid\"]              ≡ .combobox-chips:has([aria-invalid=true]) + .field[data-invalid]\n     [mono-validation-state=\"valid|warning\"]        ≡ EXTENSION (the invalid pattern in --success / --warning)\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                  ≡ EXTENSION (the --mono-control-height-* ladder)\n     [mono-variant=\"filled\"]                        ≡ EXTENSION (luma's .combobox-chips)\n     [mono-variant=\"underlined\"]                    ≡ EXTENSION (sera's .combobox-chips: bottom edge only, no ring)\n\n   FLAVORS: the field IS the tag-input's chip box and the panel IS its popover, so\n   every metric here resolves `--mono-dropdown-table-<k>` → `--mono-tag-input-<k>`\n   → the base, through the SAME per-size chains tag-input.css uses — a flavour\n   that retunes the tag-input retunes this field for free, and no flavour file\n   carries a dropdown-table entry. Every fallback is vega's value.\n\n   THE PANELS ARE PORTALED (light build): [mono-dd-panel] and [mono-dd-more]\n   move into a `<div data-mono-popup-portal>` under <body> while open, and the\n   portal mirrors the wrapper's class AND mono-* attributes, so every rule here\n   is scoped under `[mono-dropdown-table]` and never relies on the panel being\n   inside the field. The shadow build keeps its panel in the shadow root and\n   SLOTS the consumer's light-DOM `<table>` into it — the row rules therefore\n   come in two forms: the portaled table, and the slotted one under the host.\n   ========================================================================= */\n\nmono-dropdown-table {\n  display: block;\n  width: 100%;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) {\n  /* ── palette: each slot is a public knob over the tag-input's, over a Basecoat token ── */\n  --_mono-dropdown-table-text: var(--mono-dropdown-table-text, var(--mono-tag-input-text, var(--foreground)));\n  --_mono-dropdown-table-placeholder: var(--mono-dropdown-table-placeholder, var(--mono-tag-input-placeholder, var(--muted-foreground)));\n  --_mono-dropdown-table-muted: var(--mono-dropdown-table-muted, var(--mono-tag-input-muted, var(--muted-foreground)));\n  --_mono-dropdown-table-primary: var(--mono-dropdown-table-primary, var(--mono-tag-input-primary, var(--ring)));\n  --_mono-dropdown-table-secondary: var(--mono-dropdown-table-secondary, var(--mono-tag-input-secondary, var(--muted-foreground)));\n  --_mono-dropdown-table-success: var(--mono-dropdown-table-success, var(--mono-tag-input-success, var(--success)));\n  --_mono-dropdown-table-danger: var(--mono-dropdown-table-danger, var(--mono-tag-input-danger, var(--destructive)));\n  --_mono-dropdown-table-warning: var(--mono-dropdown-table-warning, var(--mono-tag-input-warning, var(--warning)));\n  --_mono-dropdown-table-info: var(--mono-dropdown-table-info, var(--mono-tag-input-info, var(--info)));\n  --_mono-dropdown-table-teal: var(--mono-dropdown-table-teal, var(--mono-tag-input-teal, var(--teal)));\n  --_mono-dropdown-table-purple: var(--mono-dropdown-table-purple, var(--mono-tag-input-purple, var(--purple)));\n  --_mono-dropdown-table-neutral: var(--mono-dropdown-table-neutral, var(--mono-tag-input-neutral, var(--neutral)));\n  --_mono-dropdown-table-dark: var(--mono-dropdown-table-dark, var(--mono-tag-input-dark, var(--dark)));\n  --_mono-dropdown-table-valid: var(--mono-dropdown-table-valid, var(--mono-tag-input-valid, var(--success)));\n  --_mono-dropdown-table-invalid: var(--mono-dropdown-table-invalid, var(--mono-tag-input-invalid, var(--destructive)));\n\n  /* ── the painted result — three tiers, base = .combobox-chips (vega) ──── */\n  --_mono-dropdown-table-ring-color: var(--mono-dropdown-table-ring-color, var(--mono-dropdown-table-focus-color, var(--_mono-dropdown-table-ring-color-preset, var(--_mono-dropdown-table-primary))));\n  --_mono-dropdown-table-ring-width: var(--mono-dropdown-table-ring-width, var(--mono-tag-input-ring-width, var(--_mono-dropdown-table-ring-width-preset, var(--mono-ring-width))));\n  --_mono-dropdown-table-ring-alpha: var(--mono-dropdown-table-ring-alpha, var(--mono-tag-input-ring-alpha, var(--mono-ring-alpha)));\n  --_mono-dropdown-table-border-color: var(--mono-dropdown-table-rest-border, var(--mono-dropdown-table-border-color, var(--mono-dropdown-table-border, var(--mono-tag-input-rest-border, var(--mono-tag-input-border-color, var(--mono-tag-input-border, var(--_mono-dropdown-table-border-color-preset, var(--input))))))));\n  --_mono-dropdown-table-bg: var(--mono-dropdown-table-bg, var(--mono-dropdown-table-surface, var(--mono-tag-input-bg, var(--mono-tag-input-surface, var(--_mono-dropdown-table-bg-preset, var(--mono-mode-surface))))));\n  --_mono-dropdown-table-shadow: var(--mono-dropdown-table-shadow, var(--mono-tag-input-shadow, var(--_mono-dropdown-table-shadow-preset, 0 0 #0000)));\n  --_mono-dropdown-table-icon: var(--mono-dropdown-table-icon-size, var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 4)));\n\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\n        `<div mono-dropdown-table>` that names no size renders exactly like\n        size=\"md\". basecoat@1.0.2 styles/vega.css .combobox-chips — min-h-9\n        gap-1.5 rounded-md px-1.5 py-1.5 text-sm; .combobox-chip h-5.5 ── */\n  --_mono-dropdown-table-height: var(--mono-dropdown-table-height-md, var(--mono-tag-input-height-md, var(--mono-control-height-md)));\n  --_mono-dropdown-table-radius: var(--mono-dropdown-table-radius-md, var(--mono-tag-input-radius-md, var(--_mono-dropdown-table-radius-preset, var(--mono-dropdown-table-radius, var(--mono-tag-input-radius, var(--mono-radius-md))))));\n  --_mono-dropdown-table-padding-x: var(--mono-dropdown-table-padding-x-md, var(--mono-tag-input-padding-x-md, var(--mono-dropdown-table-padding-x, var(--mono-tag-input-padding-x, var(--_mono-dropdown-table-padding-x-preset, calc(var(--mono-spacing) * 1.5))))));\n  --_mono-dropdown-table-padding-y: var(--mono-dropdown-table-padding-y-md, var(--mono-tag-input-padding-y-md, var(--mono-dropdown-table-padding-y, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 1.5)))));\n  --_mono-dropdown-table-gap: var(--mono-dropdown-table-chip-gap, var(--mono-tag-input-chip-gap, calc(var(--mono-spacing) * 1.5)));\n  --_mono-dropdown-table-font-size: var(--mono-dropdown-table-font-md, var(--mono-tag-input-font-md, var(--mono-text-sm)));\n  --_mono-dropdown-table-line-height: var(--mono-dropdown-table-line-height, var(--mono-tag-input-line-height, var(--mono-dropdown-table-line-height-md, var(--mono-tag-input-line-height-md, var(--mono-text-sm--lh)))));\n  /* Same cap as tag-input's (see tag-input.css): one row of chips never outgrows the field's height. */\n  --_mono-dropdown-table-chip-fit: calc(var(--_mono-dropdown-table-height) - 2 * var(--_mono-dropdown-table-padding-y) - 2 * var(--mono-border-width));\n  --_mono-dropdown-table-chip-height: var(--mono-dropdown-table-chip-height-md, var(--mono-tag-input-chip-height-md, min(calc(var(--mono-spacing) * 5.5), var(--_mono-dropdown-table-chip-fit))));\n  --_mono-dropdown-table-chip-font-size: var(--mono-dropdown-table-chip-font-size, var(--mono-tag-input-chip-font-size, var(--mono-text-xs)));\n  --_mono-dropdown-table-chip-line-height: var(--mono-dropdown-table-chip-line-height, var(--mono-tag-input-chip-line-height, var(--mono-text-xs--lh)));\n  --_mono-dropdown-table-action: calc(var(--mono-spacing) * 6);\n  --_mono-dropdown-table-clear-glyph: calc(var(--mono-spacing) * 3.5);\n\n  /* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3; mono:\n     BLOCK flow with the gap as margins (see tag-input.css) */\n  --_mono-dropdown-table-gap-y: var(--mono-dropdown-table-gap, var(--mono-tag-input-gap, calc(var(--mono-spacing) * 3)));\n  position: relative;\n  display: block;\n  width: 100%;\n  font-family: inherit;\n  color: var(--_mono-dropdown-table-text);\n}\n\n/* The page's global `* { box-sizing: border-box }` does NOT cross the shadow\n   boundary; without this the trigger's `min-height` would be its CONTENT height\n   there (40px → 56px). Rewrites to `:host, :host *` in the shadow sheet. */\nmono-dropdown-table,\nmono-dropdown-table *,\n:is([mono-dropdown-table],.mono-dropdown-table),\n:is([mono-dropdown-table],.mono-dropdown-table) *,\n:is([mono-dropdown-table],.mono-dropdown-table) *::before,\n:is([mono-dropdown-table],.mono-dropdown-table) *::after {\n  box-sizing: border-box;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is(:is([mono-dd-label],.mono-dropdown-table-label), :is([mono-dd-message],.mono-dropdown-table-message))[mono-empty] {\n  display: none;\n}\n\n/* =========================================\n   Sizes — an EMPTY field's painted height IS the token (tests/perf/field-heights);\n   a second row of chips grows it. The same chains as tag-input.css, one tier up.\n   ========================================= */\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-size=\"xs\"],:where(.mono-dropdown-table.xs)) {\n  --_mono-dropdown-table-height: var(--mono-dropdown-table-height-xs, var(--mono-tag-input-height-xs, var(--mono-control-height-xs)));\n  --_mono-dropdown-table-radius: var(--mono-dropdown-table-radius-xs, var(--mono-tag-input-radius-xs, var(--_mono-dropdown-table-radius-preset, var(--mono-dropdown-table-radius, var(--mono-tag-input-radius, var(--mono-radius-md))))));\n  --_mono-dropdown-table-padding-x: var(--mono-dropdown-table-padding-x-xs, var(--mono-tag-input-padding-x-xs, var(--mono-dropdown-table-padding-x, var(--mono-tag-input-padding-x, var(--_mono-dropdown-table-padding-x-preset, var(--mono-spacing))))));\n  --_mono-dropdown-table-padding-y: var(--mono-dropdown-table-padding-y-xs, var(--mono-tag-input-padding-y-xs, var(--mono-dropdown-table-padding-y, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 0.5)))));\n  --_mono-dropdown-table-gap: var(--mono-dropdown-table-chip-gap, var(--mono-tag-input-chip-gap, var(--mono-spacing)));\n  --_mono-dropdown-table-font-size: var(--mono-dropdown-table-font-xs, var(--mono-tag-input-font-xs, var(--mono-text-xs)));\n  --_mono-dropdown-table-line-height: var(--mono-dropdown-table-line-height, var(--mono-tag-input-line-height, var(--mono-dropdown-table-line-height-xs, var(--mono-tag-input-line-height-xs, var(--mono-text-xs--lh)))));\n  --_mono-dropdown-table-chip-height: var(--mono-dropdown-table-chip-height-xs, var(--mono-tag-input-chip-height-xs, min(calc(var(--mono-spacing) * 4.5), var(--_mono-dropdown-table-chip-fit))));\n  --_mono-dropdown-table-icon: var(--mono-dropdown-table-icon-size, var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 3.5)));\n  --_mono-dropdown-table-action: calc(var(--mono-spacing) * 4);\n  --_mono-dropdown-table-clear-glyph: calc(var(--mono-spacing) * 3);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-size=\"sm\"],:where(.mono-dropdown-table.sm)) {\n  --_mono-dropdown-table-height: var(--mono-dropdown-table-height-sm, var(--mono-tag-input-height-sm, var(--mono-control-height-sm)));\n  --_mono-dropdown-table-radius: var(--mono-dropdown-table-radius-sm, var(--mono-tag-input-radius-sm, var(--_mono-dropdown-table-radius-preset, var(--mono-dropdown-table-radius, var(--mono-tag-input-radius, var(--mono-radius-md))))));\n  --_mono-dropdown-table-padding-x: var(--mono-dropdown-table-padding-x-sm, var(--mono-tag-input-padding-x-sm, var(--mono-dropdown-table-padding-x, var(--mono-tag-input-padding-x, var(--_mono-dropdown-table-padding-x-preset, var(--mono-spacing))))));\n  --_mono-dropdown-table-padding-y: var(--mono-dropdown-table-padding-y-sm, var(--mono-tag-input-padding-y-sm, var(--mono-dropdown-table-padding-y, var(--mono-tag-input-padding-y, var(--mono-spacing)))));\n  --_mono-dropdown-table-gap: var(--mono-dropdown-table-chip-gap, var(--mono-tag-input-chip-gap, var(--mono-spacing)));\n  --_mono-dropdown-table-font-size: var(--mono-dropdown-table-font-sm, var(--mono-tag-input-font-sm, var(--mono-dropdown-table-font-md, var(--mono-tag-input-font-md, var(--mono-text-sm)))));\n  --_mono-dropdown-table-line-height: var(--mono-dropdown-table-line-height, var(--mono-tag-input-line-height, var(--mono-dropdown-table-line-height-sm, var(--mono-tag-input-line-height-sm, var(--mono-text-sm--lh)))));\n  --_mono-dropdown-table-chip-height: var(--mono-dropdown-table-chip-height-sm, var(--mono-tag-input-chip-height-sm, min(calc(var(--mono-spacing) * 5), var(--_mono-dropdown-table-chip-fit))));\n  --_mono-dropdown-table-action: calc(var(--mono-spacing) * 5);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-size=\"lg\"],:where(.mono-dropdown-table.lg)) {\n  --_mono-dropdown-table-height: var(--mono-dropdown-table-height-lg, var(--mono-tag-input-height-lg, var(--mono-control-height-lg)));\n  --_mono-dropdown-table-radius: var(--mono-dropdown-table-radius-lg, var(--mono-tag-input-radius-lg, var(--_mono-dropdown-table-radius-preset, var(--mono-dropdown-table-radius, var(--mono-tag-input-radius, var(--mono-radius-md))))));\n  --_mono-dropdown-table-padding-x: var(--mono-dropdown-table-padding-x-lg, var(--mono-tag-input-padding-x-lg, var(--mono-dropdown-table-padding-x, var(--mono-tag-input-padding-x, var(--_mono-dropdown-table-padding-x-preset, calc(var(--mono-spacing) * 1.5))))));\n  --_mono-dropdown-table-padding-y: var(--mono-dropdown-table-padding-y-lg, var(--mono-tag-input-padding-y-lg, var(--mono-dropdown-table-padding-y, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 1.5)))));\n  --_mono-dropdown-table-font-size: var(--mono-dropdown-table-font-lg, var(--mono-tag-input-font-lg, var(--mono-dropdown-table-font-md, var(--mono-tag-input-font-md, var(--mono-text-sm)))));\n  --_mono-dropdown-table-line-height: var(--mono-dropdown-table-line-height, var(--mono-tag-input-line-height, var(--mono-dropdown-table-line-height-lg, var(--mono-tag-input-line-height-lg, var(--mono-text-sm--lh)))));\n  --_mono-dropdown-table-chip-height: var(--mono-dropdown-table-chip-height-lg, var(--mono-tag-input-chip-height-lg, min(calc(var(--mono-spacing) * 6), var(--_mono-dropdown-table-chip-fit))));\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-size=\"xl\"],:where(.mono-dropdown-table.xl)) {\n  --_mono-dropdown-table-height: var(--mono-dropdown-table-height-xl, var(--mono-tag-input-height-xl, var(--mono-control-height-xl)));\n  --_mono-dropdown-table-radius: var(--mono-dropdown-table-radius-xl, var(--mono-tag-input-radius-xl, var(--_mono-dropdown-table-radius-preset, var(--mono-dropdown-table-radius, var(--mono-tag-input-radius, var(--mono-radius-md))))));\n  --_mono-dropdown-table-padding-x: var(--mono-dropdown-table-padding-x-xl, var(--mono-tag-input-padding-x-xl, var(--mono-dropdown-table-padding-x, var(--mono-tag-input-padding-x, var(--_mono-dropdown-table-padding-x-preset, calc(var(--mono-spacing) * 2))))));\n  --_mono-dropdown-table-padding-y: var(--mono-dropdown-table-padding-y-xl, var(--mono-tag-input-padding-y-xl, var(--mono-dropdown-table-padding-y, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 2)))));\n  --_mono-dropdown-table-gap: var(--mono-dropdown-table-chip-gap, var(--mono-tag-input-chip-gap, calc(var(--mono-spacing) * 2)));\n  --_mono-dropdown-table-font-size: var(--mono-dropdown-table-font-xl, var(--mono-tag-input-font-xl, var(--mono-text-base)));\n  --_mono-dropdown-table-line-height: var(--mono-dropdown-table-line-height, var(--mono-tag-input-line-height, var(--mono-dropdown-table-line-height-xl, var(--mono-tag-input-line-height-xl, var(--mono-text-base--lh)))));\n  --_mono-dropdown-table-chip-height: var(--mono-dropdown-table-chip-height-xl, var(--mono-tag-input-chip-height-xl, min(calc(var(--mono-spacing) * 6.5), var(--_mono-dropdown-table-chip-fit))));\n  --_mono-dropdown-table-chip-font-size: var(--mono-dropdown-table-chip-font-size, var(--mono-tag-input-chip-font-size, var(--mono-text-sm)));\n  --_mono-dropdown-table-chip-line-height: var(--mono-dropdown-table-chip-line-height, var(--mono-tag-input-chip-line-height, var(--mono-text-sm--lh)));\n  --_mono-dropdown-table-icon: var(--mono-dropdown-table-icon-size, var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 5)));\n  --_mono-dropdown-table-action: calc(var(--mono-spacing) * 7);\n  --_mono-dropdown-table-clear-glyph: calc(var(--mono-spacing) * 4);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-size=\"xxl\"],:where(.mono-dropdown-table.xxl)) {\n  --_mono-dropdown-table-height: var(--mono-dropdown-table-height-xxl, var(--mono-tag-input-height-xxl, var(--mono-control-height-xxl)));\n  --_mono-dropdown-table-radius: var(--mono-dropdown-table-radius-xxl, var(--mono-tag-input-radius-xxl, var(--_mono-dropdown-table-radius-preset, var(--mono-dropdown-table-radius, var(--mono-tag-input-radius, var(--mono-radius-md))))));\n  --_mono-dropdown-table-padding-x: var(--mono-dropdown-table-padding-x-xxl, var(--mono-tag-input-padding-x-xxl, var(--mono-dropdown-table-padding-x, var(--mono-tag-input-padding-x, var(--_mono-dropdown-table-padding-x-preset, calc(var(--mono-spacing) * 2.5))))));\n  --_mono-dropdown-table-padding-y: var(--mono-dropdown-table-padding-y-xxl, var(--mono-tag-input-padding-y-xxl, var(--mono-dropdown-table-padding-y, var(--mono-tag-input-padding-y, calc(var(--mono-spacing) * 2)))));\n  --_mono-dropdown-table-gap: var(--mono-dropdown-table-chip-gap, var(--mono-tag-input-chip-gap, calc(var(--mono-spacing) * 2)));\n  --_mono-dropdown-table-font-size: var(--mono-dropdown-table-font-xxl, var(--mono-tag-input-font-xxl, var(--mono-text-lg)));\n  --_mono-dropdown-table-line-height: var(--mono-dropdown-table-line-height, var(--mono-tag-input-line-height, var(--mono-dropdown-table-line-height-xxl, var(--mono-tag-input-line-height-xxl, var(--mono-text-lg--lh)))));\n  --_mono-dropdown-table-chip-height: var(--mono-dropdown-table-chip-height-xxl, var(--mono-tag-input-chip-height-xxl, min(calc(var(--mono-spacing) * 7), var(--_mono-dropdown-table-chip-fit))));\n  --_mono-dropdown-table-chip-font-size: var(--mono-dropdown-table-chip-font-size, var(--mono-tag-input-chip-font-size, var(--mono-text-sm)));\n  --_mono-dropdown-table-chip-line-height: var(--mono-dropdown-table-chip-line-height, var(--mono-tag-input-chip-line-height, var(--mono-text-sm--lh)));\n  --_mono-dropdown-table-icon: var(--mono-dropdown-table-icon-size, var(--mono-tag-input-icon-size, calc(var(--mono-spacing) * 5)));\n  --_mono-dropdown-table-action: calc(var(--mono-spacing) * 8);\n  --_mono-dropdown-table-clear-glyph: calc(var(--mono-spacing) * 4);\n}\n\n/* =========================================\n   Variants — each writes only `*-preset` slots, read from the dropdown-table's\n   knob first and the tag-input's second (a flavour writes the latter)\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .combobox-chips — rounded-md border border-input\n   bg-transparent shadow-xs (dark:bg-input/30 via --mono-mode-surface) */\n:is([mono-dropdown-table],.mono-dropdown-table):is(:not([mono-variant]), :is([mono-variant=\"outlined\"],:where(.mono-dropdown-table.outlined))) {\n  --_mono-dropdown-table-bg-preset: var(--mono-dropdown-table-outline-bg, var(--mono-tag-input-outline-bg));\n  --_mono-dropdown-table-border-color-preset: var(--mono-dropdown-table-outline-border-color, var(--mono-tag-input-outline-border-color));\n  --_mono-dropdown-table-side-border-color-preset: var(--mono-dropdown-table-outline-side-border-color, var(--mono-tag-input-outline-side-border-color));\n  --_mono-dropdown-table-shadow-preset: var(--mono-dropdown-table-outline-shadow, var(--mono-tag-input-outline-shadow, var(--mono-shadow-xs)));\n  --_mono-dropdown-table-ring-width-preset: var(--mono-dropdown-table-outline-ring-width, var(--mono-tag-input-outline-ring-width));\n  --_mono-dropdown-table-radius-preset: var(--mono-dropdown-table-outline-radius, var(--mono-tag-input-outline-radius));\n  --_mono-dropdown-table-padding-x-preset: var(--mono-dropdown-table-outline-padding-x, var(--mono-tag-input-outline-padding-x));\n}\n\n/* EXTENSION — filled ≡ basecoat@1.0.2 styles/luma.css .combobox-chips */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-variant=\"filled\"],:where(.mono-dropdown-table.filled)) {\n  --_mono-dropdown-table-bg-preset: var(--mono-dropdown-table-filled-bg, var(--mono-tag-input-filled-bg, color-mix(in oklab, var(--input) 50%, transparent)));\n  --_mono-dropdown-table-border-color-preset: transparent;\n  --_mono-dropdown-table-shadow-preset: 0 0 #0000;\n}\n\n/* EXTENSION — underlined ≡ basecoat@1.0.2 styles/sera.css .combobox-chips */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-variant=\"underlined\"],:where(.mono-dropdown-table.underlined)) {\n  --_mono-dropdown-table-bg-preset: transparent;\n  --_mono-dropdown-table-side-border-color-preset: transparent;\n  --_mono-dropdown-table-shadow-preset: 0 0 #0000;\n  --_mono-dropdown-table-ring-width-preset: 0px;\n  --_mono-dropdown-table-radius-preset: 0;\n  --_mono-dropdown-table-padding-x-preset: 0;\n}\n\n/* =========================================\n   Colours — the `color` prop is the FOCUS colour (ring + focused border)\n   ========================================= */\n\n:is([mono-dropdown-table],.mono-dropdown-table):is(:not([mono-color]), :is([mono-color=\"primary\"],:where(.mono-dropdown-table.primary))) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-primary);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"secondary\"],:where(.mono-dropdown-table.secondary)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-secondary);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"success\"],:where(.mono-dropdown-table.success)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-success);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"danger\"],:where(.mono-dropdown-table.danger)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-danger);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"warning\"],:where(.mono-dropdown-table.warning)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-warning);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"info\"],:where(.mono-dropdown-table.info)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-info);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"teal\"],:where(.mono-dropdown-table.teal)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-teal);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"purple\"],:where(.mono-dropdown-table.purple)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-purple);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"neutral\"],:where(.mono-dropdown-table.neutral)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-neutral);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-color=\"dark\"],:where(.mono-dropdown-table.dark)) {\n  --_mono-dropdown-table-ring-color-preset: var(--_mono-dropdown-table-dark);\n}\n\n/* =========================================\n   Label\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — flex items-center\n   gap-2 text-sm leading-none font-medium select-none w-fit */\n:is([mono-dropdown-table],.mono-dropdown-table) > :is([mono-dd-label],.mono-dropdown-table-label) {\n  display: flex;\n  align-items: center;\n  width: fit-content;\n  margin: 0 0 var(--_mono-dropdown-table-gap-y);\n  gap: var(--mono-dropdown-table-label-gap, var(--mono-tag-input-label-gap, calc(var(--mono-spacing) * 2)));\n  font-size: var(--mono-dropdown-table-label-font-size, var(--mono-tag-input-label-font-size, var(--mono-text-sm)));\n  line-height: var(--mono-dropdown-table-label-line-height, var(--mono-tag-input-label-line-height, 1));\n  font-weight: var(--mono-dropdown-table-label-font-weight, var(--mono-tag-input-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium))));\n  text-transform: var(--mono-dropdown-table-label-text-transform, var(--mono-tag-input-label-text-transform, none));\n  letter-spacing: var(--mono-dropdown-table-label-letter-spacing, var(--mono-tag-input-label-letter-spacing, normal));\n  color: var(--_mono-dropdown-table-text);\n  user-select: none;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-disabled],.disabled) > :is([mono-dd-label],.mono-dropdown-table-label) {\n  opacity: 0.5;\n  pointer-events: none;\n}\n\n/* basecoat@1.0.2 styles/vega.css .field — data-invalid:text-destructive */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-validation-state=\"invalid\"],:where(.mono-dropdown-table.is-invalid)) > :is([mono-dd-label],.mono-dropdown-table-label) {\n  color: var(--_mono-dropdown-table-invalid);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-required-mark],.mono-dropdown-table-required) {\n  color: var(--_mono-dropdown-table-danger);\n}\n\n/* `tooltip` prop — the info icon at the end of the label row (the label's\n   flex gap spaces it). `pointer-events` is restored because a disabled field\n   switches its label's off, and a disabled field is exactly where the reason\n   is worth a hover. Knobs: --mono-dropdown-table-label-tooltip-size / -color / -opacity. */\n:where(:is([mono-dropdown-table],.mono-dropdown-table)) > :is([mono-dd-label],.mono-dropdown-table-label) > [mono-label-tooltip] {\n  display: inline-flex;\n  flex: none;\n  align-items: center;\n  justify-content: center;\n  font-size: var(--mono-dropdown-table-label-tooltip-size, 1.1em);\n  color: var(--mono-dropdown-table-label-tooltip-color, currentColor);\n  opacity: var(--mono-dropdown-table-label-tooltip-opacity, 0.6);\n  border-radius: 9999px;\n  cursor: help;\n  pointer-events: auto;\n  outline: none;\n  transition: opacity 150ms ease;\n}\n\n:where(:is([mono-dropdown-table],.mono-dropdown-table)) > :is([mono-dd-label],.mono-dropdown-table-label) > [mono-label-tooltip]:is(:hover, :focus-visible) {\n  opacity: 1;\n}\n\n:where(:is([mono-dropdown-table],.mono-dropdown-table)) > :is([mono-dd-label],.mono-dropdown-table-label) > [mono-label-tooltip]:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}\n\n:where(:is([mono-dropdown-table],.mono-dropdown-table)) > :is([mono-dd-label],.mono-dropdown-table-label) > [mono-label-tooltip] > [mono-icon] {\n  width: 1em;\n  height: 1em;\n}\n\n/* =========================================\n   The field — the chip box (role=\"combobox\"; the search box lives in the panel)\n   ========================================= */\n\n:is([mono-dropdown-table],.mono-dropdown-table) > :is([mono-dd-control],.mono-dropdown-table-control) {\n  position: relative;\n}\n\n/* The control is a grid/flex item in a host layout; once the value stops\n   wrapping (inline strip) its automatic minimum is the full strip — pin it. */\n:is([mono-dropdown-table],.mono-dropdown-table) > :is([mono-dd-control],.mono-dropdown-table-control):is([mono-inline],.is-inline) {\n  min-width: 0;\n}\n\n/* basecoat@1.0.2 components/combobox.css .combobox-chips — flex w-full min-w-0\n   flex-wrap items-center */\n/* basecoat@1.0.2 styles/vega.css .combobox-chips — min-h-9 gap-1.5 rounded-md\n   border border-input bg-transparent bg-clip-padding px-1.5 py-1.5 text-sm\n   shadow-xs transition-[color,box-shadow] focus-within:border-ring\n   focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:…;\n   mono: one row — the value area wraps INSIDE it and the actions stay centred */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-trigger],.mono-dropdown-table-trigger) {\n  --_mono-dropdown-table-bc: var(--_mono-dropdown-table-border-color);\n  --_mono-dropdown-table-side-bc: var(--mono-dropdown-table-side-border-color, var(--mono-tag-input-side-border-color, var(--_mono-dropdown-table-side-border-color-preset, var(--_mono-dropdown-table-bc))));\n  --_mono-dropdown-table-ring: 0 0 #0000;\n\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: var(--_mono-dropdown-table-gap);\n  width: 100%;\n  min-width: 0;\n  min-height: var(--_mono-dropdown-table-height);\n  padding-block: var(--_mono-dropdown-table-padding-y);\n  padding-inline: var(--_mono-dropdown-table-padding-x);\n  outline-style: none;\n  border: var(--mono-border-width) solid var(--_mono-dropdown-table-bc);\n  border-top-color: var(--_mono-dropdown-table-side-bc);\n  border-inline-color: var(--_mono-dropdown-table-side-bc);\n  border-radius: var(--_mono-dropdown-table-radius);\n  background: var(--_mono-dropdown-table-bg);\n  background-clip: padding-box;\n  color: var(--_mono-dropdown-table-text);\n  box-shadow: var(--_mono-dropdown-table-ring), var(--_mono-dropdown-table-shadow);\n  font-family: inherit;\n  font-size: var(--_mono-dropdown-table-font-size);\n  line-height: var(--_mono-dropdown-table-line-height);\n  cursor: pointer;\n  transition-property: color, box-shadow, border-color, background-color;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n}\n\n/* focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 — and\n   the OPEN state, which keeps the ring while the keyboard is in the panel */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-trigger],.mono-dropdown-table-trigger):focus-visible,\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-open],.open) :is([mono-dd-trigger],.mono-dropdown-table-trigger) {\n  --_mono-dropdown-table-bc: var(--_mono-dropdown-table-ring-color);\n  --_mono-dropdown-table-ring: 0 0 0 var(--_mono-dropdown-table-ring-width) color-mix(in oklab, var(--_mono-dropdown-table-ring-color) var(--_mono-dropdown-table-ring-alpha), transparent);\n}\n\n/* basecoat@1.0.2 styles/vega.css .combobox-chips — has-[[aria-invalid=true]]:border-destructive\n   has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-validation-state=\"invalid\"],:where(.mono-dropdown-table.is-invalid)) :is([mono-dd-trigger],.mono-dropdown-table-trigger) {\n  --_mono-dropdown-table-bc: var(--mono-mode-invalid-border);\n  --_mono-dropdown-table-ring: 0 0 0 var(--_mono-dropdown-table-ring-width) var(--mono-mode-invalid-ring);\n}\n\n/* EXTENSION — valid / warning are the invalid pattern in the role's colour */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-validation-state=\"valid\"],:where(.mono-dropdown-table.is-valid)) :is([mono-dd-trigger],.mono-dropdown-table-trigger) {\n  --_mono-dropdown-table-bc: color-mix(in oklab, var(--_mono-dropdown-table-valid) var(--mono-mode-state-border-alpha), transparent);\n  --_mono-dropdown-table-ring: 0 0 0 var(--_mono-dropdown-table-ring-width) color-mix(in oklab, var(--_mono-dropdown-table-valid) var(--mono-mode-state-ring-alpha), transparent);\n}\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-validation-state=\"warning\"],:where(.mono-dropdown-table.is-warning)) :is([mono-dd-trigger],.mono-dropdown-table-trigger) {\n  --_mono-dropdown-table-bc: color-mix(in oklab, var(--_mono-dropdown-table-warning) var(--mono-mode-state-border-alpha), transparent);\n  --_mono-dropdown-table-ring: 0 0 0 var(--_mono-dropdown-table-ring-width) color-mix(in oklab, var(--_mono-dropdown-table-warning) var(--mono-mode-state-ring-alpha), transparent);\n}\n\n/* EXTENSION — readonly: a muted surface */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-readonly],.readonly) :is([mono-dd-trigger],.mono-dropdown-table-trigger) {\n  background: var(--mono-dropdown-table-readonly-bg, var(--mono-tag-input-readonly-bg, var(--muted)));\n  cursor: default;\n}\n\n/* .combobox-chips > input:disabled — opacity-50 (on the box, so the chips fade\n   with it). The strip's ‹ › pager opts back in so the chips can still be read. */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-disabled],.disabled) :is([mono-dd-trigger],.mono-dropdown-table-trigger) {\n  opacity: 0.5;\n  pointer-events: none;\n  cursor: not-allowed;\n  background: var(--mono-dropdown-table-disabled-bg, var(--mono-tag-input-disabled-bg, var(--_mono-dropdown-table-bg)));\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-disabled],.disabled) :is([mono-dd-scroll],.mono-dropdown-table-scroll):not(:is([mono-idle],.is-idle)) {\n  pointer-events: auto;\n  cursor: pointer;\n}\n\n/* ── the value area: chips (multi) or one line of text ────────────────── */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-value],.mono-dropdown-table-value) {\n  flex: 1 1 auto;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: var(--_mono-dropdown-table-gap);\n  min-width: 0;\n  /* the chip row is the box's height; an empty value never exceeds it */\n  min-height: var(--_mono-dropdown-table-chip-height);\n  overflow: hidden;\n  color: var(--_mono-dropdown-table-text);\n}\n\n/* EXTENSION — a text value (single select, or the placeholder) sits where a\n   `.select` puts its text (px-3), not where a chip does (px-1.5): the inset is\n   what keeps this field's text in line with a `<mono-select>` beside it. */\n:is([mono-dropdown-table],.mono-dropdown-table):not([mono-multiple][mono-has-value]) :is([mono-dd-value],.mono-dropdown-table-value) {\n  padding-inline-start: var(--mono-dropdown-table-text-inset, calc(var(--mono-spacing) * 1.5));\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-value],.mono-dropdown-table-value):is([mono-dd-placeholder],.mono-dropdown-table-placeholder) {\n  color: var(--_mono-dropdown-table-placeholder);\n  white-space: nowrap;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-value],.mono-dropdown-table-value) > span {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* =========================================\n   Chips\n   ========================================= */\n\n/* basecoat@1.0.2 components/combobox.css .combobox-chip — inline-flex w-fit\n   shrink-0 items-center whitespace-nowrap */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) {\n  display: inline-flex;\n  width: fit-content;\n  max-width: 100%;\n  flex-shrink: 0;\n  align-items: center;\n  white-space: nowrap;\n  vertical-align: middle;\n  line-height: 1;\n}\n\n/* basecoat@1.0.2 styles/vega.css .combobox-chip — h-5.5 gap-1 rounded-sm bg-muted\n   px-1.5 text-xs font-medium text-foreground, has-[>.combobox-chip-remove]:pe-0 */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) > [mono-dd-chip-main] {\n  display: inline-flex;\n  align-items: center;\n  height: var(--_mono-dropdown-table-chip-height);\n  max-width: 100%;\n  gap: var(--mono-dropdown-table-chip-content-gap, var(--mono-tag-input-chip-content-gap, var(--mono-spacing)));\n  margin: 0;\n  padding-inline: var(--mono-dropdown-table-chip-padding-x, var(--mono-tag-input-chip-padding-x, calc(var(--mono-spacing) * 1.5)));\n  border: 0;\n  border-radius: var(--mono-dropdown-table-chip-radius, var(--mono-tag-input-chip-radius, var(--mono-radius-sm)));\n  background: var(--mono-dropdown-table-chip-bg, var(--mono-tag-input-chip-bg, var(--muted)));\n  color: var(--mono-dropdown-table-chip-color, var(--mono-tag-input-chip-color, var(--_mono-dropdown-table-text)));\n  font-family: inherit;\n  font-size: var(--_mono-dropdown-table-chip-font-size);\n  line-height: var(--_mono-dropdown-table-chip-line-height);\n  font-weight: var(--mono-dropdown-table-chip-font-weight, var(--mono-tag-input-chip-font-weight, var(--mono-font-weight-medium)));\n  text-decoration: none;\n  cursor: default;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-removable] > [mono-dd-chip-main] {\n  padding-inline-end: 0;\n}\n\n/* EXTENSION — `chip.rounded`: the chip's own corner scale over the combobox\n   chip's rounded-sm (the same words `<mono-chip rounded>` takes) */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"none\"] > [mono-dd-chip-main] { border-radius: 0; }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"xs\"] > [mono-dd-chip-main] { border-radius: var(--mono-radius-xs); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"sm\"] > [mono-dd-chip-main] { border-radius: var(--mono-radius-sm); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"md\"] > [mono-dd-chip-main] { border-radius: var(--mono-radius-md); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"lg\"] > [mono-dd-chip-main] { border-radius: var(--mono-radius-lg); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"xl\"] > [mono-dd-chip-main] { border-radius: var(--mono-radius-xl); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"xxl\"] > [mono-dd-chip-main] { border-radius: var(--mono-radius-2xl); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-rounded=\"full\"] > [mono-dd-chip-main] { border-radius: var(--mono-radius-full); }\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) [mono-dd-chip-content] {\n  display: inline-flex;\n  align-items: center;\n  gap: inherit;\n  min-width: 0;\n  max-width: 100%;\n  height: 100%;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) [mono-dd-chip-label] {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* EXTENSION — `chip.dot`: a coloured dot before the label (the badge's dot idiom) */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) [mono-dd-chip-dot] {\n  flex: 0 0 auto;\n  width: calc(var(--mono-spacing) * 1.5);\n  height: calc(var(--mono-spacing) * 1.5);\n  border-radius: var(--mono-radius-full);\n  background: currentColor;\n}\n\n/* EXTENSION — `chip.color` pins a hue: the tonal pattern (bg-x/10 text-x, dark 20).\n   Without one the chips follow the field's `color` — the ring colour — the way\n   they always did here. */\n:is([mono-dropdown-table],.mono-dropdown-table):not(:is(:not([mono-color]), :is([mono-color=\"primary\"],:where(.mono-dropdown-table.primary)))) :is([mono-dd-chip],.mono-dropdown-table-chip):not([mono-dd-chip-color]) > [mono-dd-chip-main] {\n  background: color-mix(in oklab, var(--_mono-dropdown-table-ring-color) var(--mono-mode-tint), transparent);\n  color: var(--_mono-dropdown-table-ring-color);\n}\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"primary\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--primary) var(--mono-mode-tint), transparent); color: var(--primary); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"secondary\"] > [mono-dd-chip-main] { background: var(--secondary); color: var(--secondary-foreground); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"success\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--success) var(--mono-mode-tint), transparent); color: var(--success); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"danger\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--destructive) var(--mono-mode-tint), transparent); color: var(--destructive); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"warning\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--warning) var(--mono-mode-tint), transparent); color: var(--warning); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"info\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--info) var(--mono-mode-tint), transparent); color: var(--info); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"teal\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--teal) var(--mono-mode-tint), transparent); color: var(--teal); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"purple\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--purple) var(--mono-mode-tint), transparent); color: var(--purple); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"neutral\"] > [mono-dd-chip-main] { background: color-mix(in oklab, var(--neutral) var(--mono-mode-tint), transparent); color: var(--neutral); }\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip)[mono-dd-chip-color=\"dark\"] > [mono-dd-chip-main] { background: var(--dark); color: var(--dark-foreground); }\n\n/* basecoat@1.0.2 components/combobox.css .combobox-chip-remove — inline-flex\n   shrink-0 items-center justify-center */\n/* basecoat@1.0.2 styles/vega.css .combobox-chip-remove — -ms-1 opacity-50\n   hover:opacity-100, svg size-3.5 */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) [mono-dd-chip-close] {\n  display: inline-flex;\n  flex-shrink: 0;\n  align-items: center;\n  justify-content: center;\n  /* explicit: the element still carries chip.css's `.chip-close` class as a hook,\n     which pins a 1rem box — the raw markup has no such class */\n  width: auto;\n  height: 100%;\n  min-width: 0;\n  margin: 0;\n  transform: none;\n  margin-inline-start: calc(var(--mono-spacing) * -1);\n  padding: 0 var(--mono-spacing);\n  border: 0;\n  border-radius: inherit;\n  background: transparent;\n  color: inherit;\n  font: inherit;\n  line-height: 1;\n  opacity: 0.5;\n  cursor: pointer;\n  outline-style: none;\n  transition-property: opacity;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) [mono-dd-chip-close]:focus-visible {\n  opacity: 1;\n}\n\n@media (hover: hover) {\n  :is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) [mono-dd-chip-close]:hover {\n    opacity: 1;\n  }\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip) [mono-dd-chip-close] > :is(svg, .mono-icon, :is([mono-icon],.mono-icon)) {\n  display: block;\n  width: calc(var(--mono-spacing) * 3.5);\n  height: calc(var(--mono-spacing) * 3.5);\n  pointer-events: none;\n}\n\n/* EXTENSION — the \"+N more\" counter chip is a control */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip):is([mono-dd-more],.mono-dropdown-table-more) > [mono-dd-chip-main] {\n  cursor: pointer;\n  outline-style: none;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip):is([mono-dd-more],.mono-dropdown-table-more) > [mono-dd-chip-main]:focus-visible {\n  box-shadow: 0 0 0 var(--_mono-dropdown-table-ring-width) color-mix(in oklab, var(--_mono-dropdown-table-ring-color) var(--_mono-dropdown-table-ring-alpha), transparent);\n}\n\n@media (hover: hover) {\n  :is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip],.mono-dropdown-table-chip):is([mono-dd-more],.mono-dropdown-table-more) > [mono-dd-chip-main]:hover {\n    background: var(--mono-mode-surface-hover);\n  }\n}\n\n/* ── the inline chip strip (`chip.behaviour: 'inline'`) ──────────────────\n   One line that never grows: the value stops wrapping, the chips live in their\n   own strip, and the strip absorbs the overflow instead of the field.\n\n   `overflow-x: hidden` — NOT `auto` — is the whole scroll contract. Hidden still\n   honours a programmatic `scrollLeft`, so `ChipStripController` can page the\n   strip while the browser paints no scrollbar and refuses to scroll it from the\n   wheel, a click-drag or the arrow keys. */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-value],.mono-dropdown-table-value):is([mono-inline],.is-inline) {\n  flex-wrap: nowrap;\n}\n\n/* Two attributes deliberately: the strip is a direct `span` child of the value\n   area, so the `[mono-dd-value] > span` ellipsis rule above matches it too. */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-value],.mono-dropdown-table-value) > :is([mono-dd-chip-strip],.mono-dropdown-table-chip-strip) {\n  display: flex;\n  flex-wrap: nowrap;\n  align-items: center;\n  gap: var(--_mono-dropdown-table-gap);\n  flex: 0 1 auto;\n  min-width: 0;\n  overflow-x: hidden;\n  overflow-y: hidden;\n  text-overflow: clip;\n  /* NO `scroll-behavior: smooth` — see ChipStripController (one scroll event per\n     frame would reposition every open popup). */\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-chip-strip],.mono-dropdown-table-chip-strip) > * {\n  flex-shrink: 0;\n}\n\n/* =========================================\n   Actions — ‹ › pager, clear, caret\n   ========================================= */\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-actions],.mono-dropdown-table-actions) {\n  display: flex;\n  align-items: center;\n  gap: var(--mono-spacing);\n  flex: 0 0 auto;\n  line-height: 1;\n  /* The row's buttons are size-6 — 2px taller than a chip — and they sit IN the\n     flex row (centred beside a wrapping value, unlike tag-input's pinned corner),\n     so on their own they would floor the field 2px above the token. A negative\n     block margin folds that back: the row costs exactly one chip height. */\n  margin-block: calc((var(--_mono-dropdown-table-chip-height) - var(--_mono-dropdown-table-action)) / 2);\n}\n\n/* basecoat@1.0.2 components/combobox.css .combobox [data-clear] — size-6 border-0\n   bg-transparent p-0 text-current; the caret ≡ .combobox-trigger-icon (size-4\n   text-muted-foreground), the pager the same box. Painted as .btn[data-variant='ghost']. */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-clear],.mono-dropdown-table-clear),\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-arrow],.mono-dropdown-table-arrow),\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-scroll],.mono-dropdown-table-scroll) {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex: 0 0 auto;\n  width: var(--_mono-dropdown-table-action);\n  height: var(--_mono-dropdown-table-action);\n  margin: 0;\n  padding: 0;\n  border: 0;\n  border-radius: var(--mono-dropdown-table-clear-radius, var(--mono-tag-input-clear-radius, calc(var(--radius) - 5px)));\n  background: transparent;\n  color: var(--_mono-dropdown-table-muted);\n  font: inherit;\n  line-height: 1;\n  cursor: pointer;\n  outline-style: none;\n  transition-property: color, background-color, transform;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is(:is([mono-dd-clear],.mono-dropdown-table-clear), :is([mono-dd-arrow],.mono-dropdown-table-arrow), :is([mono-dd-scroll],.mono-dropdown-table-scroll)) > :is(svg, .mono-icon, :is([mono-icon],.mono-icon)) {\n  display: block;\n  width: var(--_mono-dropdown-table-icon);\n  height: var(--_mono-dropdown-table-icon);\n  pointer-events: none;\n  transition-property: transform;\n  transition-timing-function: var(--mono-ease);\n  transition-duration: var(--mono-duration);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-clear],.mono-dropdown-table-clear) > :is(svg, .mono-icon, :is([mono-icon],.mono-icon)) {\n  width: var(--_mono-dropdown-table-clear-glyph);\n  height: var(--_mono-dropdown-table-clear-glyph);\n}\n\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted hover:text-foreground */\n@media (hover: hover) {\n  :is([mono-dropdown-table],.mono-dropdown-table) :is(:is([mono-dd-clear],.mono-dropdown-table-clear), :is([mono-dd-arrow],.mono-dropdown-table-arrow), :is([mono-dd-scroll],.mono-dropdown-table-scroll)):hover {\n    background: var(--mono-mode-ghost-hover);\n    color: var(--_mono-dropdown-table-text);\n  }\n}\n\n/* EXTENSION — the caret turns while the panel is open */\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-open],.open) :is([mono-dd-arrow],.mono-dropdown-table-arrow) > :is(svg, .mono-icon, :is([mono-icon],.mono-icon)) {\n  transform: rotate(180deg);\n}\n\n/* At an end of the strip the pager keeps its box but disappears — hiding it with\n   `display: none` would shrink the row and shove the strip sideways mid-click. */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-scroll],.mono-dropdown-table-scroll):is([mono-idle],.is-idle) {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n/* =========================================\n   The \"+N more\" overflow panel — a popover holding the overflow chips\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover ring-1\n   ring-foreground/10 rounded-md shadow-md; EXTENSION: p-1.5 gap-1.5 flex-wrap.\n   Portaled to <body> and placed `fixed` from the \"+N more\" chip by its own\n   popup controller in the light build; in the shadow build `_positionMorePanel`\n   runs the same math in place — the absolute rule is the pre-placement fallback. */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-more],.mono-dropdown-table-more) {\n  position: absolute;\n  top: calc(100% + calc(var(--mono-spacing) * 1.5));\n  left: 0;\n  z-index: var(--mono-popup-z, 1000);\n  display: none;\n  flex-wrap: wrap;\n  align-items: flex-start;\n  gap: var(--_mono-dropdown-table-gap);\n  max-width: 20rem;\n  /* `--mono-popup-avail-h` = the room left on the side the panel opened on. */\n  max-height: min(14rem, var(--mono-popup-avail-h, 100vh));\n  overflow: auto;\n  /* Portaled + anchored: a chained scroll would drag this panel off-screen. */\n  overscroll-behavior: contain;\n  padding: calc(var(--mono-spacing) * 1.5);\n  border-radius: var(--mono-dropdown-table-dropdown-radius, var(--mono-tag-input-dropdown-radius, var(--mono-radius-md)));\n  background: var(--mono-dropdown-table-dropdown-bg, var(--mono-tag-input-dropdown-bg, var(--popover)));\n  color: var(--mono-dropdown-table-dropdown-color, var(--mono-tag-input-dropdown-color, var(--popover-foreground)));\n  box-shadow: var(--mono-dropdown-table-dropdown-ring, var(--mono-tag-input-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent))), var(--mono-dropdown-table-dropdown-shadow, var(--mono-tag-input-dropdown-shadow, var(--mono-shadow-md)));\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-more-open],.more-open) :is([mono-dd-more],.mono-dropdown-table-more) {\n  display: flex;\n}\n\n/* =========================================\n   The panel — sized by the `dropdown` prop, NOT the field\n   ========================================= */\n\n/* basecoat@1.0.2 components/popover.css [data-popover] — absolute z-50 overflow;\n   mono: `display: none` while closed, `position: fixed` (the popup controller\n   sets top/left), `--mono-popup-z` from the shared stack */\n/* basecoat@1.0.2 styles/vega.css .combobox [data-popover] — bg-popover\n   text-popover-foreground ring-foreground/10 rounded-md p-0 shadow-md ring-1;\n   EXTENSION: a flex column of three regions, the middle one scrolling */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-panel],.mono-dropdown-table-panel) {\n  display: none;\n  position: fixed;\n  z-index: var(--mono-popup-z, 1000);\n  flex-direction: column;\n  width: max-content;\n  min-width: var(--mono-dropdown-table-dropdown-min-width, 18rem);\n  max-width: min(90vw, 60rem);\n  /* Two independent caps, combined so neither can clobber the other:\n     --_mono-dropdown-table-panel-max-h  the consumer's `:dropdown.prop=\"{ maxHeight }\"` (else 60vh)\n     --mono-popup-avail-h                the room actually left between the field and the\n                                         viewport edge on the side the panel opened on */\n  max-height: min(var(--_mono-dropdown-table-panel-max-h, 60vh), var(--mono-popup-avail-h, 100vh));\n  overflow: hidden;\n  isolation: isolate;\n  border-radius: var(--mono-dropdown-table-dropdown-radius, var(--mono-tag-input-dropdown-radius, var(--mono-radius-md)));\n  background: var(--mono-dropdown-table-dropdown-bg, var(--mono-tag-input-dropdown-bg, var(--popover)));\n  color: var(--mono-dropdown-table-dropdown-color, var(--mono-tag-input-dropdown-color, var(--popover-foreground)));\n  box-shadow: var(--mono-dropdown-table-dropdown-ring, var(--mono-tag-input-dropdown-ring, 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent))), var(--mono-dropdown-table-dropdown-shadow, var(--mono-tag-input-dropdown-shadow, var(--mono-shadow-md)));\n  font-size: var(--_mono-dropdown-table-font-size);\n  line-height: var(--_mono-dropdown-table-line-height);\n  outline-style: none;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table):is([mono-open],.open) :is([mono-dd-panel],.mono-dropdown-table-panel) {\n  display: flex;\n}\n\n/* The panel is a container; its own ring would just outline the whole popup. */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-panel],.mono-dropdown-table-panel):focus,\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-panel],.mono-dropdown-table-panel):focus-visible {\n  outline: none;\n}\n\n/* EXTENSION — the search box above the rows, the pager below, on hairlines */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region=\"search\"],:where(.mono-dropdown-table-region.search)) {\n  flex: 0 0 auto;\n  padding: var(--mono-dropdown-table-region-padding, calc(var(--mono-spacing) * 2));\n  border-bottom: var(--mono-border-width) solid var(--border);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region=\"body\"],:where(.mono-dropdown-table-region.body)) {\n  flex: 1 1 auto;\n  /* `min-height: 0` lets the body shrink below its content height inside the flex\n     column — without it the region floors at its intrinsic size and the panel\n     overflows its own max-height instead of scrolling the table. */\n  min-height: 0;\n  overflow: auto;\n  overscroll-behavior: contain;\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region=\"foot\"],:where(.mono-dropdown-table-region.foot)) {\n  flex: 0 0 auto;\n  padding: var(--mono-dropdown-table-region-padding, calc(var(--mono-spacing) * 2));\n  border-top: var(--mono-border-width) solid var(--border);\n}\n\n/* light: a region with nothing captured is `:empty`; shadow: regions wrap a\n   `<slot>` (never `:empty`), so the element marks an unassigned one `mono-empty` */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region],.mono-dropdown-table-region):empty,\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region],.mono-dropdown-table-region)[mono-empty] {\n  display: none;\n}\n\n/* =========================================\n   The rows — the ported table's own rows, in TWO contexts\n   -----------------------------------------\n   light:  the captured `<table mono-table>` inside the (portaled) body region;\n   shadow: the SLOTTED table — a light-DOM child of the host, so the host tag is\n           the scope (these rules reach it from the page sheet, not the shadow one).\n\n   A picked row is the TABLE's `mono-selected` row (the element sets it, the same\n   attribute `<mono-table-checkbox>` sets), so the table's own wash + rail paint\n   it and a flavour that retunes `--mono-table-selected-bg` retunes it here. The\n   keyboard cursor is Basecoat's `.active` option — the `--muted` row, like hover.\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .table tr — hover:bg-muted/50; the table ships\n   with hover off, the picker turns it on through the table's PUBLIC knob */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region=\"body\"],:where(.mono-dropdown-table-region.body)),\nmono-shadow-dropdown-table {\n  --mono-table-hover-bg: var(--mono-dropdown-table-row-hover-bg, color-mix(in oklab, var(--muted) 50%, var(--mono-table-surface, var(--background))));\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region=\"body\"],:where(.mono-dropdown-table-region.body)) :is([mono-table],.mono-table) tbody tr[data-row-key],\nmono-shadow-dropdown-table :is([mono-table],.mono-table) tbody tr[data-row-key] {\n  cursor: pointer;\n}\n\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='option'].active, .select:not(select) [role='option']:focus-visible — bg-muted text-foreground\n   Written the way table.css asks a row state to be written:\n   the row-colour variable AND the paint, so a pinned cell follows. */\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region=\"body\"],:where(.mono-dropdown-table-region.body)) :is([mono-table],.mono-table) tbody tr:is([mono-dd-active],.mono-dd-row-active),\nmono-shadow-dropdown-table :is([mono-table],.mono-table) tbody tr:is([mono-dd-active],.mono-dd-row-active) {\n  --_mono-table-row-bg: var(--mono-dropdown-table-row-active-bg, var(--mono-tag-input-option-active-bg, var(--muted)));\n  background: var(--_mono-table-row-bg);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-region=\"body\"],:where(.mono-dropdown-table-region.body)) :is([mono-table],.mono-table) tbody tr:is([mono-selected],.mono-dd-row-selected) > td,\nmono-shadow-dropdown-table :is([mono-table],.mono-table) tbody tr:is([mono-selected],.mono-dd-row-selected) > td {\n  font-weight: var(--mono-font-weight-medium);\n}\n\n/* =========================================\n   Message\n   ========================================= */\n\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p */\n:is([mono-dropdown-table],.mono-dropdown-table) > :is([mono-dd-message],.mono-dropdown-table-message) {\n  display: block;\n  margin-top: var(--_mono-dropdown-table-gap-y);\n  font-size: var(--mono-dropdown-table-message-font-size, var(--mono-tag-input-message-font-size, var(--mono-text-sm)));\n  line-height: var(--mono-dropdown-table-message-line-height, var(--mono-tag-input-message-line-height, var(--mono-leading-normal)));\n  font-weight: var(--mono-font-weight-normal);\n  text-align: start;\n  color: var(--_mono-dropdown-table-muted);\n}\n\n/* basecoat@1.0.2 styles/vega.css .field [role=\"alert\"] — text-destructive text-sm */\n:is([mono-dropdown-table],.mono-dropdown-table) > :is([mono-dd-message=\"invalid\"],:where(.mono-dropdown-table-message.invalid)) {\n  color: var(--_mono-dropdown-table-invalid);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) > :is([mono-dd-message=\"valid\"],:where(.mono-dropdown-table-message.valid)) {\n  color: var(--_mono-dropdown-table-valid);\n}\n\n:is([mono-dropdown-table],.mono-dropdown-table) > :is([mono-dd-message=\"warning\"],:where(.mono-dropdown-table-message.warning)) {\n  color: var(--_mono-dropdown-table-warning);\n}\n\n@media (prefers-reduced-motion: reduce) {\n  :is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-trigger],.mono-dropdown-table-trigger),\n  :is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-clear],.mono-dropdown-table-clear),\n  :is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-arrow],.mono-dropdown-table-arrow),\n  :is([mono-dropdown-table],.mono-dropdown-table) :is([mono-dd-scroll],.mono-dropdown-table-scroll),\n  :is([mono-dropdown-table],.mono-dropdown-table) [mono-dd-chip-close] {\n    transition: none;\n  }\n}\n\n/* =========================================\n   label-position — the slots form/label-position.css reads\n   (top / notched / left / right; public knobs: --mono-dropdown-table-label-width,\n   -label-side-gap, -label-notch-font-size, -label-notch-bg)\n   ========================================= */\n\n[mono-dropdown-table][mono-label-position] {\n  --_mono-lp-width: var(--mono-dropdown-table-label-width, auto);\n  --_mono-lp-gap: var(--mono-dropdown-table-label-side-gap, calc(var(--mono-spacing) * 3));\n  --_mono-lp-height: var(--_mono-dropdown-table-height);\n  --_mono-lp-box-min: var(--_mono-dropdown-table-height);\n  /* + the single-value text inset (multi chips start at the padding) */\n  --_mono-lp-padding-x: calc(var(--_mono-dropdown-table-padding-x) + var(--mono-dropdown-table-text-inset, calc(var(--mono-spacing) * 1.5)));\n  --_mono-lp-padding-y: var(--_mono-dropdown-table-padding-y);\n  --_mono-lp-font: var(--mono-dropdown-table-label-notch-font-size, var(--mono-text-xs));\n  --_mono-lp-notch-bg: var(--mono-dropdown-table-label-notch-bg, var(--background));\n  --_mono-lp-field-bg: var(--_mono-dropdown-table-bg);\n}\n";

//#endregion
//#region src/components/dropdown-table/mono-dropdown-table.shadow.ts
let MonoDropdownTableShadow = class MonoDropdownTableShadow extends withShadowUtilityStyles(MonoDropdownTableCore(LitElement)) {
	constructor(..._args) {
		super(..._args);
		this._onSlotChange = () => {
			this._scanRegions();
			this.requestUpdate();
		};
	}
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(dropdown_table_css_raw_default + label_position_css_raw_default + field_tooltip_css_raw_default + field_validation_css_raw_default, { host: "mono-dropdown-table" }))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated(changed);
		if (!isServer) this._scanRegions();
	}
	/** Mark a region whose `<slot>` has no assigned content `mono-empty` (light uses `:empty`). */
	_scanRegions() {
		if (isServer) return;
		this.renderRoot.querySelectorAll("[mono-dd-region]").forEach((region) => {
			const slot = region.querySelector("slot");
			const has = !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
			region.toggleAttribute("mono-empty", !has);
		});
	}
	/** Native `<slot>` per region (body = the default unnamed slot for the `<table>`). */
	_renderRegion(cls, name) {
		const slot = name === "body" ? html`<slot @slotchange=${this._onSlotChange}></slot>` : html`<slot name=${name} @slotchange=${this._onSlotChange}></slot>`;
		return html`<div class="mono-dropdown-table-region ${cls}" mono-dd-region=${cls}>${slot}</div>`;
	}
};
MonoDropdownTableShadow = __decorate([customElement("mono-shadow-dropdown-table")], MonoDropdownTableShadow);

//#endregion
//#region src/components/dropdown-table/mono-data-dropdown.ts
function monoDataDropdown(source = null, opts = {}) {
	const keyExpr = opts.keyExpr ?? "Id";
	const displayExpr = opts.displayExpr;
	const multiple = !!opts.multiple;
	const { state: _stateRef, max: _optMax, min: _optMin, ...gridOpts } = opts;
	const grid = monoDataGrid(source, gridOpts);
	const optionLimits = {
		max: opts.max,
		min: opts.min
	};
	let elementLimits = {};
	function effectiveLimits() {
		return {
			max: elementLimits.max ?? optionLimits.max,
			min: elementLimits.min ?? optionLimits.min
		};
	}
	function applyLimits() {
		const { max, min } = effectiveLimits();
		grid.check().configure({
			max: max ?? null,
			min: min ?? null
		});
	}
	function setLimits(next) {
		if (next.max === elementLimits.max && next.min === elementLimits.min) return;
		elementLimits = {
			max: next.max,
			min: next.min
		};
		applyLimits();
		notify();
	}
	if (multiple) applyLimits();
	/** The field element's own props — the one slot the inner grid knows nothing about. */
	const dropdownTableProps = { ...opts.props?.dropdownTable ?? {} };
	/** Merged element props: the grid's slots plus this dropdown's field slot. */
	function props() {
		return {
			...grid.props(),
			dropdownTable: dropdownTableProps
		};
	}
	function propsSnapshot() {
		const g = grid.props();
		return {
			...g,
			th: (g.th ?? []).map((c) => ({ ...c })),
			dropdownTable: { ...dropdownTableProps }
		};
	}
	const notifier = createNotifier({ onFlush: () => {
		if (opts.state) opts.state.value = propsSnapshot();
	} });
	const notify = notifier.notify;
	let _value = multiple ? [] : null;
	const cache = /* @__PURE__ */ new Map();
	const keyStr = (k) => String(k);
	/** Coerce a key to the source's key type (number vs string), inferred from a row. */
	function normKey(k) {
		if (k == null || k === "") return k;
		if (typeof grid.items[0]?.[keyExpr] === "number" && !Number.isNaN(Number(k))) return Number(k);
		return k;
	}
	function displayOf(row) {
		if (row == null) return "";
		if (typeof displayExpr === "function") return String(displayExpr(row) ?? "");
		if (typeof displayExpr === "string" && displayExpr) return String(row[displayExpr] ?? "");
		return String(row[keyExpr] ?? "");
	}
	function keysOf(v) {
		if (multiple) return Array.isArray(v) ? v : v == null ? [] : [v];
		return v == null ? [] : [v];
	}
	function cacheRow(key, data) {
		const nk = normKey(key);
		cache.set(keyStr(nk), {
			key: nk,
			text: displayOf(data),
			data
		});
	}
	/** Find a currently-loaded row by key (so a clicked row caches its display text). */
	function findRow(key) {
		const ks = keyStr(normKey(key));
		return grid.items.find((r) => keyStr(normKey(r?.[keyExpr])) === ks);
	}
	function emitChange() {
		ctrl.onValueChange?.(multiple ? checkedKeys() : _value);
	}
	/**
	* MULTI-SELECT IS THE GRID'S `check()` STORE — there is not a second one.
	*
	* The dropdown used to keep its own `_value` array beside the grid's selection,
	* which is why `<mono-table-checkbox>` could bind to `dd.table` and tick without
	* the chips ever moving: it drove the other store. Delegating means every
	* `mono-table-*` helper works in the panel the same way, and drain / `pending` /
	* per-page / the drain memo come from the grid instead of being reimplemented.
	*
	* `_value` stays the SINGLE-select store only, and remains the shape consumers
	* bind (`modelValue`): for multi it is derived from the check store on read.
	*/
	const check = () => grid.check();
	/**
	* A row for `check()` to key by. It stores rows, but a selection can name a key
	* whose row is not loaded (a preset `modelValue`, or a key resolved later), so
	* fall back to a stub carrying just the key — `rowKeyOf` only reads `keyExpr`.
	*/
	function rowFor(key, rowData) {
		const nk = normKey(key);
		return rowData ?? findRow(nk) ?? cache.get(keyStr(nk))?.data ?? { [keyExpr]: nk };
	}
	/** What is selected right now, whichever store owns it. */
	function currentKeys() {
		return multiple ? checkedKeys() : keysOf(_value);
	}
	/** The multi-select value, derived from the check store (insertion order). */
	function checkedKeys() {
		return check().rows().map((row) => normKey(row?.[keyExpr]));
	}
	function isSelected(key) {
		if (multiple) return check().isChecked(keyStr(normKey(key)));
		const ks = keyStr(normKey(key));
		return keysOf(_value).some((k) => keyStr(normKey(k)) === ks);
	}
	function toggleRow(key, rowData) {
		const nk = normKey(key);
		const data = rowData ?? findRow(nk);
		if (data !== void 0) cacheRow(nk, data);
		if (multiple) {
			const on = check().isChecked(keyStr(nk));
			check().toggle(rowFor(nk, data), !on);
		} else {
			_value = nk;
			setOpen(false);
		}
		emitChange();
		notify();
	}
	function removeKey(key) {
		const nk = normKey(key);
		if (multiple) check().toggle(rowFor(nk), false);
		else _value = null;
		emitChange();
		notify();
	}
	function clear() {
		if (multiple) check().clear();
		else _value = null;
		emitChange();
		notify();
	}
	/**
	* Rows this controller already holds, indexed by key — the check store first
	* (it keeps whole row objects, not just keys), then the loaded page.
	*
	* Built lazily and ONLY when a key actually missed the cache: after a drain
	* `check().rows()` can hold thousands of rows, and it allocates a fresh array
	* on every call, so touching it per render would be a real cost for nothing.
	*/
	function heldRows() {
		const index = /* @__PURE__ */ new Map();
		const add = (row) => {
			const key = row?.[keyExpr];
			if (key === void 0 || key === null) return;
			const ks = keyStr(normKey(key));
			if (!index.has(ks)) index.set(ks, row);
		};
		for (const row of grid.items) add(row);
		if (multiple) for (const row of check().rows()) add(row);
		return index;
	}
	/**
	* Selected keys, labelled.
	*
	* A cache miss falls back to the rows already in memory before degrading to
	* `String(key)`. Without that, selecting through the GRID — which is what
	* `<mono-table-checkbox>` does, since it calls `check.selectAll()` directly
	* rather than `dd.selectAll()` — showed every chip as its own key: only
	* `selectAll()` primes the cache, and the grid subscription just notifies.
	* The row was in `check().rows()` the whole time.
	*/
	function selectedItems() {
		const keys = currentKeys();
		let held;
		return keys.map((k) => {
			const nk = normKey(k);
			const ks = keyStr(nk);
			const hit = cache.get(ks);
			if (hit) return hit;
			held ??= heldRows();
			const row = held.get(ks);
			if (row === void 0) return {
				key: nk,
				text: String(nk),
				data: void 0
			};
			cacheRow(nk, row);
			return cache.get(ks) ?? {
				key: nk,
				text: displayOf(row),
				data: row
			};
		});
	}
	function displayText() {
		return selectedItems().map((i) => i.text).join(", ");
	}
	/**
	* Seed the display cache from rows you already hold, so `resolveSelected` has
	* nothing left to fetch. The point of `setValue`'s `rows` argument and of
	* {@link selectAll}: without it, setting N keys costs N/50 `in` requests to
	* re-read text that was already in hand.
	*/
	function primeCache(rows) {
		if (!rows?.length) return;
		for (const row of rows) cacheRow(row?.[keyExpr], row);
	}
	function setValue(next, rows) {
		primeCache(rows);
		if (multiple) check().replace(keysOf(next).map((k) => rowFor(k)));
		else _value = next;
		resolveSelected();
		notify();
	}
	/**
	* Select every row the source can return — the dropdown's answer to the table's
	* `<mono-table-checkbox type="all" mode="all">`.
	*
	* `table.getData()` does the draining (chunked `store.load`, paging left alone)
	* and honours the live filter + search, so "search, then select all" selects the
	* matches and nothing else. The drained rows prime the cache, so this costs the
	* drain and NO display-resolution requests.
	*
	* Emits like `toggleRow` rather than going through `setValue`: `setValue` is the
	* inbound path (the element pushes `modelValue` down it) and deliberately does
	* not emit, so a silent bulk change would leave the element's `modelValue` stale
	* and the next push would overwrite the selection with it.
	*/
	async function selectAll() {
		if (!multiple) return;
		await check().selectAll();
		primeCache(check().rows());
		emitChange();
		notify();
	}
	function setOpen(next) {
		if (ctrl.open === next) return;
		ctrl.open = next;
		notify();
	}
	function hasStore() {
		const s = grid.dataSource;
		return typeof s?.store === "function" && !!s.store();
	}
	function storeRows(res) {
		return Array.isArray(res) ? res : res?.data ?? [];
	}
	function chunk(arr, size) {
		const out = [];
		for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
		return out;
	}
	const selectFields = () => typeof displayExpr === "string" && displayExpr ? [keyExpr, displayExpr] : void 0;
	async function resolveSelected() {
		const missing = currentKeys().filter((k) => !cache.has(keyStr(normKey(k))));
		if (!missing.length) return;
		const s = grid.dataSource;
		if (hasStore()) {
			const store = s.store();
			let rows = [];
			try {
				rows = (await Promise.all(chunk(missing, 50).map((part) => store.load({
					filter: [
						keyExpr,
						"in",
						part
					],
					select: selectFields()
				})))).flatMap(storeRows);
			} catch {
				const orFilter = (arr) => arr.map((v) => [
					keyExpr,
					"=",
					v
				]).reduce((a, b) => a ? [
					a,
					"or",
					b
				] : b, null);
				rows = (await Promise.all(chunk(missing, 15).map((part) => store.load({
					filter: orFilter(part),
					select: selectFields()
				})))).flatMap(storeRows);
			}
			for (const row of rows) cacheRow(row?.[keyExpr], row);
		} else if (typeof s?.data === "function") {
			const all = s.data();
			const byKey = new Map(all.map((r) => [keyStr(r?.[keyExpr]), r]));
			for (const k of missing) {
				const row = byKey.get(keyStr(normKey(k)));
				if (row) cacheRow(k, row);
			}
		}
		notify();
	}
	const offGrid = grid.subscribe(() => notify());
	const ctrl = {
		grid,
		/** Alias of {@link grid} — the inner `controlMonoTable`. Preferred in new
		*  code (`dd.table.load()` / `:control-table.prop="dd.table"`); `grid` stays. */
		table: grid,
		props,
		multiple,
		open: false,
		onValueChange: null,
		get value() {
			return multiple ? checkedKeys() : _value;
		},
		get selectAllPending() {
			return multiple ? check().pending : false;
		},
		set value(next) {
			setValue(next);
		},
		isSelected,
		limits: effectiveLimits,
		setLimits,
		toggleRow,
		removeKey,
		clear,
		selectAll,
		selectedItems,
		displayText,
		setValue,
		setOpen,
		resolveSelected,
		subscribe: notifier.subscribe,
		bind(next) {
			grid.bind(next);
			cache.clear();
			resolveSelected();
			notify();
		},
		dispose() {
			offGrid();
			notifier.clear();
			grid.dispose();
		}
	};
	return ctrl;
}

//#endregion
export { MonoDropdownTableCore, MonoDropdownTableShadow, monoDataDropdown };