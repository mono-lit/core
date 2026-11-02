import { d as buildSizeStyle, f as toCssSize, g as monoHostChildNodes, y as monoPendingGrace } from "../mono-ui-kvLVIf1V.js";
import { n as detachEventHandlers, t as applyProps } from "../element-props-xvw0EB7H.js";
import { t as monoDataDropdown } from "../mono-data-dropdown-BsY5IuIo.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, o as numberStringConverter, r as booleanStringConverter, s as optionalNumberConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { i as guardHostTextContent, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { n as applyPopupPlacement, r as computePopupPlacement, t as PopupPortalController } from "../popup-portal-CINuVjNY.js";
import { a as closeIcon, i as chevronIcon, n as caretIcon } from "../field-icons-t8rXRCKs.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { t as FieldTooltipController } from "../field-tooltip-Csk4s2ve.js";
import { t as FieldValidationController } from "../field-validation-CFmUmuDx.js";
import { n as visibleChipCap, r as ChipStripController, t as resolveChipLimit } from "../chip-limits-CFABydIL.js";
import { LitElement, html, isServer, nothing } from "lit";
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
				if (!this._isOpen && !this._moreOpen || this._viewportFrame) return;
				this._viewportFrame = requestAnimationFrame(() => {
					this._viewportFrame = 0;
					if (this._isOpen) this._positionPanel();
					if (this._moreOpen) this._positionMorePanel();
				});
			};
			this._viewportBound = false;
			this._viewportFrame = 0;
			this._docBound = false;
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
			if (!isServer) this._syncViewportListeners();
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
				this._docBound = false;
				window.removeEventListener("scroll", this._onViewportChange, true);
				window.removeEventListener("resize", this._onViewportChange);
				if (this._viewportFrame) cancelAnimationFrame(this._viewportFrame);
				this._viewportFrame = 0;
				this._viewportBound = false;
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
		_reflectSelection(rows = this._rowEls()) {
			const dd = this._dd;
			if (!dd) return;
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
				if (on !== el.hasAttribute("aria-selected")) {
					if (on) el.setAttribute("aria-selected", "true");
					else el.removeAttribute("aria-selected");
				}
			});
		}
		/** Re-reflect after the consumer's Vue re-renders rows (paging/search). */
		_observePanel() {
			const root = this._rowScope;
			if (!root || this._panelObserver) return;
			const touchesRows = (nodes) => {
				for (const n of Array.from(nodes)) {
					if (n.nodeType !== 1) continue;
					const el = n;
					if (el.matches("[data-row-key]") || el.querySelector("[data-row-key]")) return true;
				}
				return false;
			};
			this._panelObserver = new MutationObserver((records) => {
				if (records.some((r) => touchesRows(r.addedNodes) || touchesRows(r.removedNodes))) this._reflectSelection();
			});
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
		/**
		* Outside-dismiss listeners, both builds, bound while a panel is OPEN only (select's rule).
		* Both handlers bail when the list and "+N more" panels are closed, so at rest they cost
		* only dispatch — two capture-phase `document` listeners per field.
		*/
		_syncDocListeners() {
			const want = this.isConnected && (this._isOpen || this._moreOpen);
			if (want === this._docBound) return;
			this._docBound = want;
			if (want) {
				document.addEventListener("pointerdown", this._onDocPointer, true);
				document.addEventListener("keydown", this._onDocKey, true);
			} else {
				document.removeEventListener("pointerdown", this._onDocPointer, true);
				document.removeEventListener("keydown", this._onDocKey, true);
			}
		}
		/**
		* Shadow build only, and only while a panel is OPEN — the popup controller's rule. They used
		* to be bound at connect for every shadow instance: a capture-phase, non-passive `scroll`
		* listener on `window` per field, open or not, which also keeps the page's scrolling off the
		* compositor thread.
		*/
		_syncViewportListeners() {
			if (isServer) return;
			this._syncDocListeners();
			const want = this._isShadowHost && this.isConnected && (this._isOpen || this._moreOpen);
			if (want === this._viewportBound) return;
			if (want) {
				window.addEventListener("scroll", this._onViewportChange, {
					capture: true,
					passive: true
				});
				window.addEventListener("resize", this._onViewportChange, { passive: true });
			} else {
				window.removeEventListener("scroll", this._onViewportChange, true);
				window.removeEventListener("resize", this._onViewportChange);
				if (this._viewportFrame) cancelAnimationFrame(this._viewportFrame);
				this._viewportFrame = 0;
			}
			this._viewportBound = want;
		}
		updated(changed) {
			super.updated(changed);
			if (isServer) return;
			this._syncViewportListeners();
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
		/** `rows`: the caller's own `_rowEls()` — one query per arrow key, not three. */
		_setActiveRow(key, reveal = false, rows = this._rowEls()) {
			this._activeRowKey = key;
			this._reflectSelection(rows);
			if (!reveal || key == null) return;
			rows.find((r) => r.getAttribute("data-row-key") === key)?.scrollIntoView?.({ block: "nearest" });
		}
		_moveActiveRow(delta) {
			const rows = this._rowEls();
			const keys = rows.map((r) => r.getAttribute("data-row-key") ?? "");
			if (!keys.length) return;
			const i = this._activeRowKey == null ? -1 : keys.indexOf(this._activeRowKey);
			const next = i < 0 ? delta > 0 ? 0 : keys.length - 1 : Math.min(Math.max(i + delta, 0), keys.length - 1);
			this._setActiveRow(keys[next], true, rows);
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
//#region src/components/dropdown-table/mono-dropdown-table.ts
let MonoDropdownTable = class MonoDropdownTable extends MonoDropdownTableCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotSearch = [];
		this._slotBody = [];
		this._slotFooter = [];
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
		this._placeSlot("search", this._slotSearch);
		this._placeSlot("body", this._slotBody);
		this._placeSlot("footer", this._slotFooter);
		super.updated(changed);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const taken = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (slotName === "search") {
				node.removeAttribute("slot");
				this._slotSearch.push(node);
			} else if (slotName === "footer") {
				node.removeAttribute("slot");
				this._slotFooter.push(node);
			} else this._slotBody.push(node);
			taken.add(node);
		}
		for (const node of taken) if (node.parentNode === this) this.removeChild(node);
		guardHostTextContent(this, /* @__PURE__ */ new Map([
			["search", this._slotSearch],
			["body", this._slotBody],
			["footer", this._slotFooter]
		]), {
			fallback: "body",
			onWrite: () => this.requestUpdate()
		});
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const sel = `[data-mono-slot="${name}"]`;
		const target = this.querySelector(sel) ?? this._popup.panelRoot?.querySelector?.(sel);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoDropdownTable = __decorate([customElement("mono-dropdown-table")], MonoDropdownTable);

//#endregion
export { MonoDropdownTable, monoDataDropdown as controlMonoDataDropdown, monoDataDropdown };