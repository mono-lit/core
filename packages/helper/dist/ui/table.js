import { a as parseFieldPath, c as toODataClause, l as toODataSelector, n as isPath, r as mergePatch, s as setFieldValue, t as getFieldValue } from "../field-path-DK2VBWHl.js";
import { a as buildGroups, c as isGroupNode, o as collectGroupPaths, s as flattenLeaves } from "../data-source-read-uKJpRAzx.js";
import { A as resolveSearchEntries, D as isWildcardPattern, O as normalizeSearchExpr, c as resolveErrorMessages, k as plainSearchColumns, l as setErrorMessages, n as describeError, r as errorStatus, s as normalizeError, t as DEFAULT_ERROR_MESSAGES, w as expandWildcard } from "../normalize-error-BEcd1tmS.js";
import { _ as monoArraySource } from "../data-source-options-DJUNU26C.js";
import { t as monoDataGrid } from "../mono-data-grid-DJkp96N-.js";
import { _ as monoHostChildren } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { n as bucketHasContent, o as placeLightSlots, r as captureLightSlots, s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { a as MonoTableErrorCore, c as MonoTableSortCore, d as MonoTablePagingGroupCore, f as MonoTablePagingCore, i as MonoTableLoadingCore, l as MonoTableInfoCore, n as MonoTableDetailCore, o as MonoTableEmptyCore, p as MonoTableSearchCore, r as MonoTableSummaryCore, s as MonoTableThCore, t as MonoTableCheckboxCore, u as MonoTablePageSizeCore } from "../mono-table-checkbox-core-BKOMx8R5.js";
import { LitElement, html } from "lit";

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
//#region src/components/table/mono-table-paging.ts
let MonoTablePaging = class MonoTablePaging extends MonoTablePagingCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTablePaging = __decorate([customElement("mono-table-paging")], MonoTablePaging);

//#endregion
//#region src/components/table/mono-table-paging-group.ts
let MonoTablePagingGroup = class MonoTablePagingGroup extends MonoTablePagingGroupCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTablePagingGroup = __decorate([customElement("mono-table-paging-group")], MonoTablePagingGroup);

//#endregion
//#region src/components/table/mono-table-page-size.ts
let MonoTablePageSize = class MonoTablePageSize extends MonoTablePageSizeCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTablePageSize = __decorate([customElement("mono-table-page-size")], MonoTablePageSize);

//#endregion
//#region src/components/table/mono-table-info.ts
let MonoTableInfo = class MonoTableInfo extends MonoTableInfoCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableInfo = __decorate([customElement("mono-table-info")], MonoTableInfo);

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
//#region src/components/table/mono-table-error.ts
let MonoTableError = class MonoTableError extends MonoTableErrorCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableError = __decorate([customElement("mono-table-error")], MonoTableError);

//#endregion
//#region src/components/table/mono-table-loading.ts
let MonoTableLoading = class MonoTableLoading extends MonoTableLoadingCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableLoading = __decorate([customElement("mono-table-loading")], MonoTableLoading);

//#endregion
//#region src/components/table/mono-table-summary.ts
let MonoTableSummary = class MonoTableSummary extends MonoTableSummaryCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableSummary = __decorate([customElement("mono-table-summary")], MonoTableSummary);

//#endregion
//#region src/components/table/mono-table-detail.ts
let MonoTableDetail = class MonoTableDetail extends MonoTableDetailCore(LitElement) {
	createRenderRoot() {
		return this;
	}
};
MonoTableDetail = __decorate([customElement("mono-table-detail")], MonoTableDetail);

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