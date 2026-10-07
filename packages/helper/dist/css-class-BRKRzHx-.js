//#region src/composables/css-class.ts
/**
* Append a per-part class override (if present) to a base class string.
*
*   cssPart({ inner: 'px-4' }, 'mono-nav-inner', 'inner') // 'mono-nav-inner px-4'
*   cssPart(undefined,        'mono-nav-inner', 'inner') // 'mono-nav-inner'
*/
function cssPart(cssClass, base, key) {
	const extra = cssClass?.[key];
	return extra ? `${base} ${extra}` : base;
}
/**
* Apply a `css-class` value to an element's `cssClass`/`cssClassName`.
*
*  - `null`/`undefined`/empty string → reset both
*  - object                          → `cssClass`
*  - `'{ … }'` JSON string           → parsed into `cssClass`
*  - plain string                    → `cssClassName` (root class fallback)
*
* Mutates the element's reactive properties directly (so Lit picks up the
* change). Used by each component's `_setCssClass`.
*/
function applyCssClass(target, value) {
	if (value == null) {
		target.cssClass = {};
		target.cssClassName = "";
		return;
	}
	if (typeof value === "object") {
		target.cssClass = value;
		return;
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) {
			target.cssClass = {};
			target.cssClassName = "";
			return;
		}
		if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
			target.cssClass = JSON.parse(trimmed);
			return;
		} catch {}
		target.cssClassName = trimmed;
	}
}
/**
* Define `css-class` and `cssclass` instance aliases (Vue interop) that route to
* `set`. Lets consumers write `<el :css-class="…">` / `:cssclass` / `:cssClass`.
*/
function defineCssClassAliases(target, set) {
	for (const alias of ["css-class", "cssclass"]) Object.defineProperty(target, alias, {
		get: () => target.cssClass,
		set,
		configurable: true,
		enumerable: false
	});
}
//#endregion
export { cssPart as n, defineCssClassAliases as r, applyCssClass as t };
