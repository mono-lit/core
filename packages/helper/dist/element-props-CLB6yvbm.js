//#region src/composables/element-props.ts
/**
* Whether `key` can actually be assigned on `obj` — a plain expando, or an
* accessor/data property that isn't read-only.
*
* This matters because a controller's `props` object legitimately carries keys
* that are NOT element props: `monoDataGrid`'s `th[].summary` includes `prefix`
* and `precision`, which the controller consumes for formatting. `prefix`
* collides with the read-only native `Element.prefix`, and assigning it throws —
* which took down the whole docs page render until this check existed.
*/
function isSettable(obj, key) {
	let o = obj;
	while (o) {
		const d = Object.getOwnPropertyDescriptor(o, key);
		if (d) return !!(d.set || d.writable);
		o = Object.getPrototypeOf(o);
	}
	return true;
}
var HANDLER_KEY = /^on[A-Z]/;
/** Whether a props key names an event handler (`onClick`, `onLoadingChange`). */
function isEventHandlerKey(key) {
	return HANDLER_KEY.test(key);
}
/**
* `onClick` → `click`, `onLoadingChange` → `loading-change`, `onMnoChange` →
* `mno-change` — the same rule Vue applies to an `on*` listener prop, so a key
* that works in a template works here.
*/
function eventNameFromHandlerKey(key) {
	const rest = key.slice(2);
	return rest.charAt(0).toLowerCase() + rest.slice(1).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
/** Per element: event name → the handler currently attached through `props`. */
var attached = /* @__PURE__ */ new WeakMap();
function applyHandler(el, key, value) {
	if (typeof value !== "function" && value !== null) return;
	const target = el;
	if (typeof target.addEventListener !== "function") return;
	const name = eventNameFromHandlerKey(key);
	let map = attached.get(el);
	const current = map?.get(name);
	if (value === null) {
		if (current) {
			target.removeEventListener(name, current.listener);
			map.delete(name);
		}
		return;
	}
	const fn = value;
	if (current?.fn === fn) return;
	if (current) target.removeEventListener(name, current.listener);
	const listener = (event) => {
		fn(event);
	};
	target.addEventListener(name, listener);
	if (!map) {
		map = /* @__PURE__ */ new Map();
		attached.set(el, map);
	}
	map.set(name, {
		fn,
		listener
	});
}
/**
* Remove every handler `applyProps` attached to `el`. Call it where an element
* leaves its controller (an unbind, a re-bind to a different one) so the old
* controller's handlers do not keep firing beside the new one's.
*/
function detachEventHandlers(el) {
	const map = attached.get(el);
	if (!map) return;
	const target = el;
	for (const [name, { listener }] of map) target.removeEventListener(name, listener);
	attached.delete(el);
}
/**
* Write a controller's props onto an element.
*
* Two guards, both load-bearing:
* - `undefined` values are skipped, so "not declared" never clobbers a value the
*   template set;
* - each write is equality-checked, so a sync can't schedule another update and
*   loop.
*
* Handler keys (`onClick`, `onToggle`, …) become event listeners — see the
* block above — never properties.
*
* Shared by `table-controller-core` (`monoDataGrid`/`monoDataDropdown` elements)
* and `form-control-core` (`monoForm` controls) — the write loop is identical
* and its failure modes are subtle enough to be worth having in one place.
*/
function applyProps(el, patch) {
	if (!patch) return false;
	const self = el;
	let changed = false;
	for (const [k, v] of Object.entries(patch)) {
		if (v === void 0) continue;
		if (isEventHandlerKey(k)) {
			applyHandler(el, k, v);
			continue;
		}
		if (!isSettable(self, k)) continue;
		if (!Object.is(self[k], v)) {
			self[k] = v;
			changed = true;
		}
	}
	return changed;
}
//#endregion
export { detachEventHandlers as n, applyProps as t };
