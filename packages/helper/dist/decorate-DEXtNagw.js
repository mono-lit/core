//#region src/composables/hybird-prop.ts
function toKebabCase(value) {
	return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
function toLowerCaseProp(value) {
	return value.toLowerCase();
}
function defineHybridPropAliases(target, props) {
	for (const prop of props) {
		const kebabProp = toKebabCase(prop);
		const lowerProp = toLowerCaseProp(prop);
		defineAlias(target, kebabProp, prop);
		if (lowerProp !== prop && lowerProp !== kebabProp) defineAlias(target, lowerProp, prop);
	}
}
/**
* Register a cross-name alias for a controller-binding prop — e.g.
* `defineHybridPropAlias(el, 'controlTable', 'dataGrid')` makes `controlTable`,
* `control-table` and `controltable` all read/write the canonical reactive
* `dataGrid` property (so `.controlTable = …` still triggers Lit's update
* cycle). Used to rename the controller props without a breaking change: the
* new `control-*` spellings land here while the old `data-*` ones keep working.
*/
function defineHybridPropAlias(target, aliasCamel, realProp) {
	const kebab = toKebabCase(aliasCamel);
	const lower = toLowerCaseProp(aliasCamel);
	defineAlias(target, aliasCamel, realProp);
	defineAlias(target, kebab, realProp);
	if (lower !== aliasCamel && lower !== kebab) defineAlias(target, lower, realProp);
}
function defineAlias(target, alias, realProp) {
	if (Object.prototype.hasOwnProperty.call(target, alias)) return;
	Object.defineProperty(target, alias, {
		get() {
			return this[realProp];
		},
		set(value) {
			this[realProp] = value;
		},
		configurable: true,
		enumerable: false
	});
}
/**
* Lit `hasChanged` for an array prop.
*
* **Load-bearing**, for exactly the reason `rateLimitHasChanged` is (see
* `composables/rate-limit.ts`): `:items="[...]"` in a template allocates a NEW array
* on every parent re-render. Under Lit's default `!==` the element sees a change
* each time, so anything gated on `changed.has('items')` — resetting an
* infinite-scroll page, invalidating a search memo, rebuilding a cache — runs on
* renders where nothing about the data actually moved.
*
* Element-wise identity rather than a deep compare: rows are normally stable objects
* owned by a store, so this catches the re-created-wrapper case cheaply. If the
* consumer also rebuilds each row object the arrays are reported as different, which
* is the safe direction.
*
* **Why this needs no "repair" step, unlike `mono-button-dropdown`.** That element
* compares entries by CONTENT and deliberately ignores function fields, so it reports
* "same" for entries that really were rebuilt — leaving cached listener state pointing
* at the previous array (hence `_retargetItemParts()`). `arrayHasChanged` says "same"
* only when the array holds literally the same objects in the same order, so nothing
* item-related can have moved and there is nothing to retarget. Reach for the deeper
* compare only where the callbacks are resolved late, and prove it.
*
* **Do NOT add this (or any `hasChanged`) to these — they hang real work off the
* update cycle, so suppressing an update silently drops it:**
*   - `chart-core.ts` — `updated()` IS the chart pipeline; its last step `_applyData()`
*     is the only place chart.js is redrawn. A skipped update freezes the canvas.
*   - `date-core.ts` — `updated()` drives `_rebuild()` / `_applyModelValue()`, so
*     flatpickr would be stranded on stale config.
*   - every `mono-table-*` element — `table-controller-core.ts` overrides `update()` to
*     pull each element's slice of `monoDataGrid({ props })`.
*   - every `monoForm`-bound control and `filter-builder-core.ts` — same `update()` hook
*     (`form-control-core.ts`), used for form binding and visibility.
*
* Surveyed 2026-08-17 across all 26 component directories; the guarded props are
* `select`/`tag-input` `items`, `tag-input` `modelValue`/`value`, `menu` +
* `mono-menu-list` `items`, `tabs` `items`, both `breadcrumb` `items`, and
* `file-upload` `modelValue`.
*/
function arrayHasChanged(value, old) {
	if (value === old) return false;
	if (!Array.isArray(value) || !Array.isArray(old)) return true;
	if (value.length !== old.length) return true;
	for (let i = 0; i < value.length; i++) if (value[i] !== old[i]) return true;
	return false;
}
var booleanStringConverter = {
	fromAttribute(value) {
		if (value === null || value === void 0) return false;
		if (typeof value === "boolean") return value;
		const normalized = String(value).toLowerCase().trim();
		return normalized === "" || normalized === "true";
	},
	toAttribute(value) {
		return value ? "" : null;
	}
};
var numberStringConverter = {
	fromAttribute(value) {
		if (value === null || value === "") return 0;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	},
	toAttribute(value) {
		if (value === void 0 || value === null) return null;
		return String(value);
	}
};
/**
* Like {@link numberStringConverter}, but an absent/blank attribute stays
* `undefined` instead of collapsing to `0`.
*
* Needed wherever 0 is a meaningful value AND "not set" has to mean "fall back to
* whatever the component computes" — e.g. `mono-modal` / `mono-drawer`'s `z-index`,
* where 0 is a legal stacking level and unset means "let the popup stack decide".
* Using the plain number converter there would pin every dialog to `z-index: 0`.
*/
var optionalNumberConverter = {
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
//#endregion
//#region \0@oxc-project+runtime@0.133.0/helpers/esm/decorate.js
function __decorate(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
}
//#endregion
export { defineHybridPropAliases as a, defineHybridPropAlias as i, arrayHasChanged as n, numberStringConverter as o, booleanStringConverter as r, optionalNumberConverter as s, __decorate as t };
