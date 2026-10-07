//#region src/composables/reactive.ts
/**
* Unwrap a `ref()` / `computed()` wrapper and a `reactive()` proxy to the raw
* target underneath. Returns the value unchanged when it isn't reactive.
*/
function unwrapReactive(value) {
	let out = value;
	if (out && typeof out === "object" && out.__v_isRef) out = out.value;
	if (out && typeof out === "object" && out.__v_raw) out = out.__v_raw;
	return out;
}
/**
* Read a {@link MaybeReactive} option: call a getter, unwrap a ref/computed or a
* reactive proxy, unbox a plain `{ value }`. Never caches — the caller decides
* when "now" is.
*/
function resolveMaybeReactive(option) {
	if (option === void 0 || option === null) return void 0;
	if (typeof option === "function") return option();
	const raw = unwrapReactive(option);
	if (raw && typeof raw === "object") {
		const keys = Object.keys(raw);
		if (keys.length === 1 && keys[0] === "value") return unwrapReactive(raw.value);
	}
	return raw;
}
/**
* {@link unwrapReactive}, then — for an **array** — unwrap each element too.
*
* Reading an index off a deep-reactive array yields a proxy of that element, so
* unwrapping only the container still leaves proxies inside. One level of
* elements is all the value models here need; this deliberately does not recurse
* into nested objects, which would rewrite data the consumer owns.
*/
function unwrapReactiveDeep(value) {
	const out = unwrapReactive(value);
	if (!Array.isArray(out)) return out;
	let changed = false;
	const items = out.map((item) => {
		const raw = unwrapReactive(item);
		if (raw !== item) changed = true;
		return raw;
	});
	return changed ? items : out;
}
//#endregion
export { unwrapReactive as n, unwrapReactiveDeep as r, resolveMaybeReactive as t };
