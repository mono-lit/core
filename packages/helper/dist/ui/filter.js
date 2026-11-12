import { d as OPERATOR_ARITY, l as treeToArray, m as operatorsFor, n as arrayToTree, s as odataStringToArray, t as arrayToODataString, u as DEFAULT_TEXTS } from "../filter-odata-GsczYKNC.js";
import { t as monoFilterBuilder } from "../filter-builder-vbqIuPhX.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as MonoFilterBuilderCore } from "../filter-builder-core-DyWjbBP7.js";
import { LitElement, html } from "lit";

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