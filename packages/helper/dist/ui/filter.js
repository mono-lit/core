import { c as splitMulti, d as OPERATOR_ARITY, l as treeToArray, m as operatorsFor, n as arrayToTree, s as odataStringToArray, t as arrayToODataString, u as DEFAULT_TEXTS } from "../filter-odata-Bi27XUpQ.js";
import { t as monoFilterBuilder } from "../filter-builder-C0T3pMx2.js";
import { d as buildSizeStyle } from "../mono-ui-CK5wNw-7.js";
import { n as detachEventHandlers, t as applyProps } from "../element-props-xvw0EB7H.js";
import { t as customElement } from "../mono-element-BP0RKeDD.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { LitElement, html, isServer, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/filter/filter-builder-core.ts
const GROUP_OPS = [
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
const MonoFilterBuilderCore = (superClass) => {
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
//#region src/components/filter/mono-filter-builder.ts
let MonoFilterBuilder = class MonoFilterBuilder extends MonoFilterBuilderCore(LitElement) {
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