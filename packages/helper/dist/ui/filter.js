import { c as splitMulti, d as OPERATOR_ARITY, l as treeToArray, m as operatorsFor, n as arrayToTree, s as odataStringToArray, t as arrayToODataString, u as DEFAULT_TEXTS } from "../filter-odata-C1vSGZaY.js";
import { t as monoFilterBuilder } from "../filter-builder-Bke3qOgJ.js";
import { n as detachEventHandlers, t as applyProps } from "../element-props-CLB6yvbm.js";
import { t as customElement } from "../mono-element-B0kP_96P.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, t as __decorate } from "../decorate-DEXtNagw.js";
import { t as dispatchMonoEvent } from "../mono-event-Bi1qP9uN.js";
import { t as buildSizeStyle } from "../css-size-DhHSVZJK.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/filter/filter-builder-core.ts
var GROUP_OPS = [
	"and",
	"or",
	"notAnd",
	"notOr"
];
/**
* `MonoFilterBuilderCore` — render-mode-agnostic logic for `mono-filter-builder`.
*
* Renders the controller's node tree as nested inline rows:
*
* ```
* Match [any ▾] of the following rules:
*   | field ▾ | operator ▾ | value | ⑃ | 🗑 |
* ```
*
* Per repo convention it renders **native** `<select>` / `<input>` carrying
* its OWN control classes — no component here embeds another `mono-*`
* element (`mono-table-search` set that precedent), so the controls match the rest
* of the library without a cross-element dependency.
*/
var MonoFilterBuilderCore = (superClass) => {
	class MonoFilterBuilderCoreClass extends superClass {
		constructor(...args) {
			super(...args);
			this.size = "sm";
			this._tick = 0;
			this._applyQueued = false;
			defineHybridPropAliases(this, [
				"dataFilter",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
			defineHybridPropAlias(this, "controlFilterBuilder", "dataFilter");
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
			if (changed.has("dataFilter")) this._subscribe();
			super.willUpdate?.(changed);
		}
		/**
		* Drive the apply from `update()` as well as `_subscribe()` — every render
		* reaches here, so a controller that arrives late (or a `setProps` that
		* lands between subscriptions) can't be missed. This is the lesson
		* `table-controller-core` records: hanging the apply off `_subscribe` alone
		* silently skips anything that overrides it.
		*/
		update(changed) {
			this._scheduleApplyProps();
			super.update(changed);
		}
		_subscribe() {
			if (isServer) return;
			this._off?.();
			detachEventHandlers(this);
			this._off = this.dataFilter?.subscribe(() => {
				this._tick += 1;
				this._scheduleApplyProps();
				this._emitChange();
			});
			this._scheduleApplyProps();
		}
		/**
		* Deferred + de-duplicated: the apply writes reactive props, and doing that
		* inside the update cycle would trip Lit's change-in-update warning.
		*/
		_scheduleApplyProps() {
			if (isServer) return;
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
		* Pull `controlMonoFilterBuilder({ props })` onto this element, so the
		* template needs nothing but the controller binding.
		*
		* The CONTROLLER WINS for keys it declares (matching `monoDataGrid` and
		* `monoForm`); keys it doesn't mention are left to whatever the template set.
		* `applyProps` supplies the skip-undefined, read-only and equality guards, so
		* a sync can neither throw nor schedule another update cycle.
		*
		* `?.props` is optional-called on purpose: a controller built before this
		* option existed simply contributes nothing.
		*/
		_applyControllerProps() {
			applyProps(this, this.dataFilter?.props?.());
		}
		_emitChange() {
			const ctrl = this.dataFilter;
			if (!ctrl) return;
			dispatchMonoEvent(this, "change", {
				filter: ctrl.changed(),
				array: ctrl.changed({ type: "array" }),
				string: ctrl.changed({ type: "string" })
			});
		}
		/** Internal icon — light: UnoCSS classes; shadow: inline SVG. */
		renderIcon(_name) {
			return html``;
		}
		get _texts() {
			return this.dataFilter?.texts;
		}
		_dataType(field) {
			return this.dataFilter?.fields.find((f) => f.field === field)?.dataType ?? "string";
		}
		/**
		* One `<option>` whose selection is bound as a **property**.
		*
		* Binding `.value` on the `<select>` instead is unreliable here: an operator
		* list changes in the SAME render as the value it should show (picking a number
		* field swaps the whole option set), and the assignment lands before the new
		* options exist — leaving the browser on a stale `selectedIndex`. Setting
		* `.selected` per option moves `selectedIndex` after the options are in place.
		*/
		_option(value, label, current) {
			return html`<option value=${value} .selected=${value === current}>${label}</option>`;
		}
		/**
		* The value editor for a rule. Arity decides the shape: `0` disables the cell
		* (the blank checks need no operand), `2` renders a from/to pair, `many` takes
		* comma-separated entry, and a field with `values` renders a select.
		*/
		_renderValue(rule) {
			const t = this._texts;
			const arity = OPERATOR_ARITY[rule.operator];
			const dt = this._dataType(rule.field);
			const def = this.dataFilter?.fields.find((f) => f.field === rule.field);
			const nativeType = dt === "number" ? "number" : dt === "date" ? "date" : dt === "datetime" ? "datetime-local" : "text";
			const cls = "mono-filter-control mono-filter-value";
			if (arity === 0) return html`<input class=${cls} mono-filter-control mono-filter-value disabled placeholder="—" aria-label="No value needed" />`;
			if (def?.values?.length) return html`
          <select
            class=${cls} mono-filter-control mono-filter-value
            @change=${(e) => this.dataFilter?.updateRule(rule.id, { value: e.target.value })}
          >
            ${this._option("", t?.valuePlaceholder ?? "", String(rule.value ?? ""))}
            ${def.values.map((v) => this._option(String(v.value), v.label ?? String(v.value), String(rule.value ?? "")))}
          </select>
        `;
			if (dt === "boolean") return html`
          <select
            class=${cls} mono-filter-control mono-filter-value
            @change=${(e) => this.dataFilter?.updateRule(rule.id, { value: e.target.value })}
          >
            ${this._option("", t?.valuePlaceholder ?? "", String(rule.value ?? ""))}
            ${this._option("true", "true", String(rule.value ?? ""))}
            ${this._option("false", "false", String(rule.value ?? ""))}
          </select>
        `;
			if (arity === 2) {
				const pair = Array.isArray(rule.value) ? rule.value : ["", ""];
				const setAt = (idx, v) => {
					const next = [pair[0] ?? "", pair[1] ?? ""];
					next[idx] = v;
					this.dataFilter?.updateRule(rule.id, { value: next });
				};
				return html`
          <span class="mono-filter-range" mono-filter-range>
            <input
              class=${cls} mono-filter-control mono-filter-value
              type=${nativeType}
              .value=${String(pair[0] ?? "")}
              @input=${(e) => setAt(0, e.target.value)}
            />
            <input
              class=${cls} mono-filter-control mono-filter-value
              type=${nativeType}
              .value=${String(pair[1] ?? "")}
              @input=${(e) => setAt(1, e.target.value)}
            />
          </span>
        `;
			}
			const shown = Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value ?? "");
			return html`
        <input
          class=${cls} mono-filter-control mono-filter-value
          type=${arity === "many" ? "text" : nativeType}
          .value=${shown}
          placeholder=${arity === "many" ? t?.multiValuePlaceholder ?? "" : t?.valuePlaceholder ?? ""}
          @input=${(e) => {
				const raw = e.target.value;
				this.dataFilter?.updateRule(rule.id, { value: arity === "many" ? splitMulti(raw) : raw });
			}}
        />
      `;
		}
		_renderRule(rule) {
			const ctrl = this.dataFilter;
			const t = this._texts;
			const ops = operatorsFor(this._dataType(rule.field));
			return html`
        <div class="mono-filter-row" mono-filter-row data-rule=${rule.id}>
          <select
            class="mono-filter-control mono-filter-field" mono-filter-control mono-filter-field
            @change=${(e) => ctrl?.updateRule(rule.id, { field: e.target.value })}
          >
            ${ctrl?.fields.map((f) => this._option(f.field, f.caption ?? f.field, rule.field))}
          </select>

          <select
            class="mono-filter-control mono-filter-op" mono-filter-control mono-filter-op
            @change=${(e) => ctrl?.updateRule(rule.id, { operator: e.target.value })}
          >
            ${ops.map((op) => this._option(op, t?.[op] ?? op, rule.operator))}
          </select>

          <span class="mono-filter-value-cell" mono-filter-value-cell>${this._renderValue(rule)}</span>

          <button
            type="button"
            class="mono-filter-icon-btn" mono-filter-icon-btn
            title=${t?.addNested ?? ""}
            aria-label=${t?.addNested ?? ""}
            @click=${() => ctrl?.nest(rule.id)}
          >
            ${this.renderIcon("nested")}
          </button>
          <button
            type="button"
            class="mono-filter-icon-btn danger" mono-filter-icon-btn mono-danger
            title=${t?.remove ?? ""}
            aria-label=${t?.remove ?? ""}
            @click=${() => ctrl?.remove(rule.id)}
          >
            ${this.renderIcon("trash")}
          </button>
        </div>
      `;
		}
		_renderGroup(group, level) {
			const ctrl = this.dataFilter;
			const t = this._texts;
			const isRoot = level === 0;
			return html`
        <div class="mono-filter-group" mono-filter-group data-group=${group.id} style=${`--_mono-filter-level:${level}`}>
          <div class="mono-filter-group-head" mono-filter-group-head>
            <span class="mono-filter-match" mono-filter-match>${t?.matchPrefix}</span>
            <select
              class="mono-filter-control mono-filter-group-op" mono-filter-control mono-filter-group-op
              @change=${(e) => ctrl?.setGroupOperator(group.id, e.target.value)}
            >
              ${GROUP_OPS.map((op) => this._option(op, t?.[op] ?? op, group.operator))}
            </select>
            <span class="mono-filter-match" mono-filter-match>${t?.matchSuffix}</span>
            ${isRoot ? nothing : html`
                  <span class="mono-filter-group-actions" mono-filter-group-actions>
                    <button
                      type="button"
                      class="mono-filter-icon-btn" mono-filter-icon-btn
                      title=${t?.addRule ?? ""}
                      @click=${() => ctrl?.addRule(group.id)}
                    >
                      ${this.renderIcon("plus")}
                    </button>
                    <button
                      type="button"
                      class="mono-filter-icon-btn danger" mono-filter-icon-btn mono-danger
                      title=${t?.remove ?? ""}
                      @click=${() => ctrl?.remove(group.id)}
                    >
                      ${this.renderIcon("trash")}
                    </button>
                  </span>
                `}
          </div>

          <div class="mono-filter-children" mono-filter-children>
            ${group.children.map((child) => this._renderNode(child, level + 1))}
            ${isRoot && !group.children.length ? html`<div class="mono-filter-empty" mono-filter-empty>${t?.emptyHint}</div>` : nothing}
          </div>
        </div>
      `;
		}
		_renderNode(node, level) {
			return node.kind === "group" ? this._renderGroup(node, level) : this._renderRule(node);
		}
		render() {
			const ctrl = this.dataFilter;
			if (!ctrl) return html``;
			const t = ctrl.texts;
			this._tick;
			return html`
        <div
          class="mono-filter ${this.size}"
          mono-filter-builder
          mono-size=${this.size === "sm" ? nothing : this.size}
          style=${styleMap(buildSizeStyle(this))}
        >
          ${ctrl.actions ? html`
                <div class="mono-filter-actions" mono-filter-actions>
                  <button
                    type="button"
                    class="mono-filter-btn primary" mono-filter-btn
                    @click=${() => dispatchMonoEvent(this, "apply", {
				filter: ctrl.changed(),
				array: ctrl.changed({ type: "array" }),
				string: ctrl.changed({ type: "string" })
			})}
                  >
                    ${t.apply}
                  </button>
                  <button
                    type="button"
                    class="mono-filter-btn ghost" mono-filter-btn mono-variant="ghost"
                    @click=${() => {
				ctrl.clear();
				dispatchMonoEvent(this, "clear", { filter: null });
			}}
                  >
                    ${t.clear}
                  </button>
                </div>
              ` : nothing}
          ${this._renderGroup(ctrl.tree, 0)}
          <div class="mono-filter-add" mono-filter-add>
            <button type="button" class="mono-filter-link" mono-filter-link @click=${() => ctrl.addRule()}>
              ${t.addRule}
            </button>
            <button type="button" class="mono-filter-link" mono-filter-link @click=${() => ctrl.addGroup()}>
              ${t.addGroup}
            </button>
          </div>
        </div>
      `;
		}
	}
	__decorate([property({ attribute: false })], MonoFilterBuilderCoreClass.prototype, "dataFilter", void 0);
	__decorate([property({ type: String })], MonoFilterBuilderCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoFilterBuilderCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoFilterBuilderCoreClass.prototype, "height", void 0);
	__decorate([property({
		attribute: "min-width",
		type: String
	})], MonoFilterBuilderCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		attribute: "max-width",
		type: String
	})], MonoFilterBuilderCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		attribute: "min-height",
		type: String
	})], MonoFilterBuilderCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		attribute: "max-height",
		type: String
	})], MonoFilterBuilderCoreClass.prototype, "maxHeight", void 0);
	__decorate([state()], MonoFilterBuilderCoreClass.prototype, "_tick", void 0);
	return MonoFilterBuilderCoreClass;
};
//#endregion
//#region src/components/filter/filter.css?raw
var filter_default = "/* =========================================================================\r\n   mono-filter-builder — inline OData filter builder, a Basecoat EXTENSION\r\n\r\n   Upstream has no filter builder. Every surface here borrows the shape of the\r\n   Basecoat control it most resembles — the rule's field / operator / value\r\n   controls are `.field > select` and `.input`, Apply is `.btn`, Clear is\r\n   `.btn[data-variant='outline']`, the trash and \"add nested\" toggles are\r\n   `.btn[data-variant='ghost'][data-size='icon']`, and \"Add rule\" / \"Add group\"\r\n   are `.btn[data-variant='link']` — cited where each does.\r\n\r\n   The controls are styled HERE rather than by nesting three `<mono-input>`s per\r\n   row: that would couple this sheet to another component's PRIVATE resolvers.\r\n   They read the input's, select's and button's PUBLIC knobs instead —\r\n   `--mono-input-outline-radius`, `--mono-button-<size>-radius`,\r\n   `--mono-control-height-<size>` — which is exactly what a flavour writes, so\r\n   an `xs` builder matches an `xs` field and maia's pill, sera's square and\r\n   lyra's `text-xs` all arrive here by construction. There are no per-flavour\r\n   deltas for this component on purpose; there is nothing for them to drift from.\r\n\r\n   Styling is by ATTRIBUTE: the root is `[mono-filter-builder]` with `mono-size`\r\n   (`sm` is the default and emits nothing), and every part is family-unique\r\n   (`[mono-filter-row]`, `[mono-filter-control]`, …) so it needs no scoping and\r\n   cannot collide with the table's `[mono-th-filter-*]` / `[mono-search-filter-*]`.\r\n   The old classes are still emitted as inert hooks until 2.0.\r\n\r\n   Specificity: a part's resting rule is one attribute — (0,1,0) — so a\r\n   `cssClass` utility wins by source order; prop and state rules stay heavier.\r\n   ========================================================================= */\r\n\r\nmono-filter-builder,\r\nmono-shadow-filter-builder {\r\n  display: block;\r\n}\r\n\r\n[mono-filter-builder] {\r\n  /* ── ink and surface ────────────────────────────────────────────────────\r\n     Public `--mono-filter-*` → private resolvers (the library-wide pattern):\r\n     set any of them on the element, inline, or a wrapper — they inherit and\r\n     pierce the shadow boundary. */\r\n  --_mono-filter-primary: var(--mono-filter-primary, var(--primary));\r\n  --_mono-filter-on-primary: var(--mono-filter-on-primary, var(--primary-foreground));\r\n  /* the ink of the links and the group operator — upstream's `.btn[data-variant='link']` is `text-primary` */\r\n  --_mono-filter-accent: var(--mono-filter-accent, var(--primary));\r\n  --_mono-filter-text: var(--mono-filter-text, var(--foreground));\r\n  --_mono-filter-muted: var(--mono-filter-muted, var(--muted-foreground));\r\n  /* basecoat@1.0.2 styles/vega.css .field > select, select.select — border-input */\r\n  --_mono-filter-border: var(--mono-filter-border, var(--input));\r\n  /* the guide down a nested group — the page border, not the control edge */\r\n  --_mono-filter-guide: var(--mono-filter-guide, var(--border));\r\n  /* a control is `bg-transparent` upstream (`dark:bg-input/30` on the dark side) */\r\n  --_mono-filter-surface: var(--mono-filter-surface, var(--mono-mode-surface, transparent));\r\n  --_mono-filter-ring: var(--mono-filter-ring, var(--ring));\r\n  --_mono-filter-danger: var(--mono-filter-danger, var(--destructive));\r\n  --_mono-filter-indent: var(--mono-filter-indent, 1.25rem);\r\n\r\n  /* ── the size scale — sm on the unqualified root ON PURPOSE ─────────────\r\n     basecoat@1.0.2 styles/vega.css .btn[data-size='sm'] — h-8 gap-1 px-2.5 rounded-[min(var(--radius-md),10px)]\r\n     The metrics read the SAME public knobs mono-input / mono-select /\r\n     mono-button consume, so a flavour that retunes a field retunes these. */\r\n  --_mono-filter-height: var(--mono-filter-height-sm, var(--mono-input-height-sm, var(--mono-control-height-sm)));\r\n  --_mono-filter-font: var(--mono-filter-font-sm, var(--mono-input-font-sm, var(--mono-input-font-md, var(--mono-text-sm))));\r\n  /* outline → the field's own radius → the scale: lyra squares a field through\r\n     `--mono-input-radius`, sera and maia through `--mono-input-outline-radius` */\r\n  --_mono-filter-radius: var(--mono-filter-radius, var(--mono-input-outline-radius, var(--mono-input-radius, var(--mono-radius-md))));\r\n  --_mono-filter-btn-radius: var(--mono-filter-btn-radius-sm, var(--mono-button-sm-radius, var(--mono-radius-md)));\r\n  --_mono-filter-icon: var(--mono-filter-icon-sm, 0.875rem);\r\n  --_mono-filter-gap: var(--mono-filter-gap, calc(var(--mono-spacing) * 2));\r\n\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: calc(var(--_mono-filter-gap) * 1.5);\r\n  width: 100%;\r\n  /* Allow the rules region to shrink/scroll inside a bounded height. */\r\n  min-height: 0;\r\n  font-family: inherit;\r\n  color: var(--_mono-filter-text);\r\n  box-sizing: border-box;\r\n}\r\n\r\n[mono-filter-builder][mono-size=\"xs\"] {\r\n  --_mono-filter-height: var(--mono-filter-height-xs, var(--mono-input-height-xs, var(--mono-control-height-xs)));\r\n  --_mono-filter-font: var(--mono-filter-font-xs, var(--mono-input-font-xs, var(--mono-text-xs)));\r\n  --_mono-filter-btn-radius: var(--mono-filter-btn-radius-xs, var(--mono-button-xs-radius, var(--mono-radius-md)));\r\n  --_mono-filter-icon: var(--mono-filter-icon-xs, 0.7rem);\r\n}\r\n[mono-filter-builder][mono-size=\"md\"] {\r\n  --_mono-filter-height: var(--mono-filter-height-md, var(--mono-input-height-md, var(--mono-control-height-md)));\r\n  --_mono-filter-font: var(--mono-filter-font-md, var(--mono-input-font-md, var(--mono-text-sm)));\r\n  --_mono-filter-btn-radius: var(--mono-filter-btn-radius-md, var(--mono-button-md-radius, var(--mono-radius-md)));\r\n  --_mono-filter-icon: var(--mono-filter-icon-md, 1rem);\r\n}\r\n[mono-filter-builder][mono-size=\"lg\"] {\r\n  --_mono-filter-height: var(--mono-filter-height-lg, var(--mono-input-height-lg, var(--mono-control-height-lg)));\r\n  --_mono-filter-font: var(--mono-filter-font-lg, var(--mono-input-font-lg, var(--mono-input-font-md, var(--mono-text-sm))));\r\n  --_mono-filter-btn-radius: var(--mono-filter-btn-radius-lg, var(--mono-button-lg-radius, var(--mono-radius-md)));\r\n  --_mono-filter-icon: var(--mono-filter-icon-lg, 1.125rem);\r\n}\r\n[mono-filter-builder][mono-size=\"xl\"] {\r\n  --_mono-filter-height: var(--mono-filter-height-xl, var(--mono-input-height-xl, var(--mono-control-height-xl)));\r\n  --_mono-filter-font: var(--mono-filter-font-xl, var(--mono-input-font-xl, var(--mono-input-font-md, var(--mono-text-base))));\r\n  --_mono-filter-btn-radius: var(--mono-filter-btn-radius-xl, var(--mono-button-xl-radius, var(--mono-radius-md)));\r\n  --_mono-filter-icon: var(--mono-filter-icon-xl, 1.25rem);\r\n}\r\n[mono-filter-builder][mono-size=\"xxl\"] {\r\n  --_mono-filter-height: var(--mono-filter-height-xxl, var(--mono-input-height-xxl, var(--mono-control-height-xxl)));\r\n  --_mono-filter-font: var(--mono-filter-font-xxl, var(--mono-input-font-xxl, var(--mono-input-font-md, var(--mono-text-base))));\r\n  --_mono-filter-btn-radius: var(--mono-filter-btn-radius-xxl, var(--mono-button-xxl-radius, var(--mono-radius-md)));\r\n  --_mono-filter-icon: var(--mono-filter-icon-xxl, 1.375rem);\r\n}\r\n\r\n[mono-filter-builder] *,\r\n[mono-filter-builder] *::before,\r\n[mono-filter-builder] *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* ── Scroll layout ─────────────────────────────────────────────────────────\r\n   Apply/Clear stay pinned at the top, Add rule/group at the bottom; the ROOT\r\n   group is the only scroll region, so a bounded `height` / `max-height` scrolls\r\n   JUST the rules. (Nested groups are deeper, so the child combinator skips them.) */\r\n[mono-filter-builder] > [mono-filter-actions],\r\n[mono-filter-builder] > [mono-filter-add] {\r\n  flex: 0 0 auto;\r\n}\r\n[mono-filter-builder] > [mono-filter-group] {\r\n  flex: 1 1 auto;\r\n  min-height: 0;\r\n  overflow: auto;\r\n  /* Portaled + anchored: a chained scroll would drag this panel off-screen\r\n     (see `[mono-th-filter-list]`). */\r\n  overscroll-behavior: contain;\r\n  padding-right: calc(var(--mono-spacing) * 1);\r\n}\r\n\r\n/* ── Apply / Clear — ABOVE the rules, not below ─────────────────────────── */\r\n[mono-filter-actions] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: var(--_mono-filter-gap);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn — inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-3 disabled:opacity-50 */\r\n[mono-filter-btn] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 0 calc(var(--mono-spacing) * 2.5);\r\n  height: var(--_mono-filter-height);\r\n  border-radius: var(--_mono-filter-btn-radius);\r\n  border: var(--mono-border-width) solid transparent;\r\n  font: inherit;\r\n  font-size: var(--_mono-filter-font);\r\n  font-weight: var(--mono-font-weight-medium);\r\n  white-space: nowrap;\r\n  cursor: pointer;\r\n  transition:\r\n    background-color var(--mono-duration-fast, 150ms) ease,\r\n    color var(--mono-duration-fast, 150ms) ease,\r\n    border-color var(--mono-duration-fast, 150ms) ease;\r\n}\r\n/* basecoat@1.0.2 styles/vega.css .btn:not([data-variant]), .btn[data-variant='primary'] — bg-primary text-primary-foreground hover:bg-primary/90 */\r\n[mono-filter-btn]:not([mono-variant]) {\r\n  background: var(--_mono-filter-primary);\r\n  color: var(--_mono-filter-on-primary);\r\n}\r\n[mono-filter-btn]:not([mono-variant]):hover {\r\n  background: color-mix(in oklab, var(--_mono-filter-primary) 90%, transparent);\r\n}\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='outline'] — border bg-background hover:bg-accent hover:text-accent-foreground */\r\n[mono-filter-btn][mono-variant=\"ghost\"] {\r\n  background: var(--background);\r\n  border-color: var(--_mono-filter-border);\r\n  color: var(--_mono-filter-text);\r\n}\r\n[mono-filter-btn][mono-variant=\"ghost\"]:hover {\r\n  background: var(--accent);\r\n  color: var(--accent-foreground);\r\n}\r\n[mono-filter-btn]:focus-visible {\r\n  outline: none;\r\n  box-shadow: 0 0 0 3px color-mix(in oklab, var(--_mono-filter-ring) 50%, transparent);\r\n}\r\n\r\n/* ── Group ──────────────────────────────────────────────────────────────── */\r\n[mono-filter-group] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--_mono-filter-gap);\r\n}\r\n/* Nested groups indent; the root sits flush. */\r\n[mono-filter-children] [mono-filter-group] {\r\n  padding-left: var(--_mono-filter-indent);\r\n  border-left: var(--mono-border-width) dashed var(--_mono-filter-guide);\r\n}\r\n[mono-filter-group-head] {\r\n  display: flex;\r\n  align-items: center;\r\n  flex-wrap: wrap;\r\n  gap: calc(var(--_mono-filter-gap) * 0.75);\r\n  font-size: var(--_mono-filter-font);\r\n  color: var(--_mono-filter-muted);\r\n}\r\n[mono-filter-match] {\r\n  white-space: nowrap;\r\n}\r\n[mono-filter-group-actions] {\r\n  display: inline-flex;\r\n  gap: calc(var(--mono-spacing) * 0.5);\r\n  margin-left: auto;\r\n}\r\n\r\n[mono-filter-children] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--_mono-filter-gap);\r\n}\r\n\r\n/* ── Rule row ───────────────────────────────────────────────────────────── */\r\n[mono-filter-row] {\r\n  display: grid;\r\n  /* field | operator | value | nested | trash */\r\n  grid-template-columns: minmax(8rem, 1.4fr) minmax(8rem, 1.2fr) minmax(8rem, 2fr) auto auto;\r\n  align-items: center;\r\n  gap: var(--_mono-filter-gap);\r\n}\r\n@media (max-width: 720px) {\r\n  [mono-filter-row] {\r\n    grid-template-columns: 1fr 1fr auto auto;\r\n  }\r\n  [mono-filter-value-cell] {\r\n    grid-column: 1 / -1;\r\n  }\r\n}\r\n\r\n[mono-filter-value-cell],\r\n[mono-filter-range] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: calc(var(--_mono-filter-gap) * 0.75);\r\n  min-width: 0;\r\n}\r\n\r\n/* ── Controls (selects + inputs) ─────────────────────────────────────────── */\r\n/* basecoat@1.0.2 styles/vega.css .field > select, select.select — border-input h-9 rounded-md border bg-transparent py-1 ps-2.5 pe-8 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3\r\n   The text input is the same box; the flavour's outline knob decides the corner\r\n   for both, exactly as it does for `<mono-input>` and `<mono-select>`. */\r\n[mono-filter-control] {\r\n  width: 100%;\r\n  min-width: 0;\r\n  height: var(--_mono-filter-height);\r\n  padding: 0 calc(var(--mono-spacing) * 2.5);\r\n  border: var(--mono-border-width) solid var(--_mono-filter-border);\r\n  border-radius: var(--_mono-filter-radius);\r\n  background-color: var(--_mono-filter-surface);\r\n  color: var(--_mono-filter-text);\r\n  font: inherit;\r\n  font-size: var(--_mono-filter-font);\r\n  box-shadow: var(--mono-shadow-xs, none);\r\n  /* stated in both directions: a host page's preflight (Tailwind, UnoCSS) sets\r\n     `appearance: none` on a select and a shadow root escapes it — so without\r\n     this the light build lost its caret and the shadow build kept the native\r\n     one. Upstream draws its own; so does this. */\r\n  appearance: none;\r\n  outline: none;\r\n  transition:\r\n    border-color var(--mono-duration-fast, 150ms) ease,\r\n    box-shadow var(--mono-duration-fast, 150ms) ease;\r\n}\r\n[mono-filter-control]:focus,\r\n[mono-filter-control]:focus-visible {\r\n  border-color: var(--_mono-filter-ring);\r\n  box-shadow: 0 0 0 3px color-mix(in oklab, var(--_mono-filter-ring) 50%, transparent);\r\n  outline: none;\r\n}\r\n/* `disabled:opacity-50` */\r\n[mono-filter-control]:disabled {\r\n  opacity: 0.5;\r\n  cursor: not-allowed;\r\n}\r\n/* `placeholder:text-muted-foreground` — stated, so a host page's own placeholder\r\n   colour cannot reach a portaled builder */\r\n[mono-filter-control]::placeholder {\r\n  color: var(--_mono-filter-muted);\r\n  opacity: 1;\r\n}\r\n[mono-filter-range] > [mono-filter-control] {\r\n  min-width: 0;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > select, select.select — pe-8 bg-[image:var(--chevron-down-icon-50)] bg-no-repeat bg-position-[center_right_0.625rem] bg-size-[1rem]\r\n   The caret, drawn the way upstream draws it — the same token the ported\r\n   `<mono-select>` paints with, so it sits at the same place in every flavour. */\r\nselect[mono-filter-control] {\r\n  padding-right: calc(var(--mono-spacing) * 8);\r\n  background-image: var(--chevron-down-icon-50);\r\n  background-repeat: no-repeat;\r\n  background-position: right calc(var(--mono-spacing) * 2.5) center;\r\n  background-size: 1rem;\r\n}\r\n\r\n/* The group operator sits inline in a sentence, so it must NOT grow — otherwise it\r\n   pushes the trailing \"of the following rules:\" to the far edge. Otherwise it\r\n   is a control like every other: bordered, and at the control HEIGHT rather\r\n   than `auto` — a bare select's intrinsic height differs between a page under\r\n   a preflight and a shadow root, which put the shadow build's rows 5px higher. */\r\n[mono-filter-group-op] {\r\n  flex: 0 0 auto;\r\n  width: auto;\r\n  min-width: 6rem;\r\n  color: var(--_mono-filter-accent);\r\n  font-weight: var(--mono-font-weight-semibold);\r\n}\r\n\r\n/* ── Icon buttons ───────────────────────────────────────────────────────── */\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-accent hover:text-accent-foreground */\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-size='icon'] — size-9 */\r\n[mono-filter-icon-btn] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-filter-height);\r\n  height: var(--_mono-filter-height);\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--_mono-filter-btn-radius);\r\n  background: transparent;\r\n  color: var(--_mono-filter-muted);\r\n  line-height: 0;\r\n  cursor: pointer;\r\n  transition:\r\n    color var(--mono-duration-fast, 150ms) ease,\r\n    background-color var(--mono-duration-fast, 150ms) ease;\r\n}\r\n[mono-filter-icon-btn]:hover,\r\n[mono-filter-icon-btn]:focus-visible {\r\n  background: var(--accent);\r\n  color: var(--accent-foreground);\r\n  outline: none;\r\n}\r\n[mono-filter-icon-btn]:focus-visible {\r\n  box-shadow: 0 0 0 3px color-mix(in oklab, var(--_mono-filter-ring) 50%, transparent);\r\n}\r\n[mono-filter-icon-btn][mono-danger]:hover,\r\n[mono-filter-icon-btn][mono-danger]:focus-visible {\r\n  color: var(--_mono-filter-danger);\r\n}\r\n[mono-filter-icon-btn] .mono-icon,\r\n[mono-filter-icon-btn] > svg {\r\n  width: var(--_mono-filter-icon);\r\n  height: var(--_mono-filter-icon);\r\n}\r\n\r\n/* ── Add rule / group links ─────────────────────────────────────────────── */\r\n[mono-filter-add] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: calc(var(--_mono-filter-gap) * 2);\r\n}\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='link'] — text-primary underline-offset-4 hover:underline */\r\n[mono-filter-link] {\r\n  padding: 0;\r\n  border: 0;\r\n  background: none;\r\n  font: inherit;\r\n  font-size: var(--_mono-filter-font);\r\n  color: var(--_mono-filter-accent);\r\n  text-underline-offset: 4px;\r\n  cursor: pointer;\r\n}\r\n[mono-filter-link]:hover {\r\n  text-decoration: underline;\r\n}\r\n[mono-filter-link]:focus-visible {\r\n  outline: none;\r\n  border-radius: var(--mono-radius-sm);\r\n  box-shadow: 0 0 0 3px color-mix(in oklab, var(--_mono-filter-ring) 50%, transparent);\r\n}\r\n\r\n[mono-filter-empty] {\r\n  padding: calc(var(--mono-spacing) * 1) 0;\r\n  font-size: var(--_mono-filter-font);\r\n  color: var(--_mono-filter-muted);\r\n}\r\n";
//#endregion
//#region src/components/filter/mono-filter-builder.ts
var MonoFilterBuilder = class MonoFilterBuilder extends MonoFilterBuilderCore(LitElement) {
	static {
		this.styles = [unsafeCSS(filter_default)];
	}
	createRenderRoot() {
		return this;
	}
	renderIcon(name) {
		if (name === "trash") return html`<span class="mono-icon i-mdi-trash-can-outline"></span>`;
		if (name === "plus") return html`<span class="mono-icon i-mdi-plus"></span>`;
		return html`<span class="mono-icon i-mdi-file-tree-outline"></span>`;
	}
};
MonoFilterBuilder = __decorate([customElement("mono-filter-builder")], MonoFilterBuilder);
//#endregion
export { DEFAULT_TEXTS, MonoFilterBuilder, OPERATOR_ARITY, arrayToODataString, arrayToTree, monoFilterBuilder as controlMonoFilterBuilder, monoFilterBuilder, odataStringToArray, operatorsFor, treeToArray };
