//#region src/composables/mono-event.ts
/**
* Device-originated event names — decorated when native, never synthesized.
* See the header for why.
*/
var MONO_DEVICE_EVENTS = new Set([
	"click",
	"dblclick",
	"auxclick",
	"contextmenu",
	"mousedown",
	"mouseup",
	"mousemove",
	"mouseenter",
	"mouseleave",
	"mouseover",
	"mouseout",
	"pointerdown",
	"pointerup",
	"pointermove",
	"pointerenter",
	"pointerleave",
	"pointerover",
	"pointerout",
	"pointercancel",
	"keydown",
	"keyup",
	"keypress",
	"touchstart",
	"touchend",
	"touchmove",
	"touchcancel",
	"wheel"
]);
/**
* Plain names dispatched WITHOUT bubbling when synthesized: their native
* namesakes do not bubble either, and something above the element (a form, the
* window's error reporting, a focus trap) would act on a stray one.
*/
var MONO_NON_BUBBLING_ALIASES = new Set([
	"focus",
	"blur",
	"submit",
	"reset",
	"error",
	"load",
	"abort",
	"scroll",
	"resize",
	"invalid"
]);
/** `loading-change` → `loadingChange`; a single word is unchanged. */
function toCamelEventName(name) {
	return name.split("-").map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
/**
* Whether `event`, dispatched where it was, will arrive at `host` on its own.
*
* At the host itself: yes. From inside the host's shadow tree: only if it is
* composed (`input`, `click`, `focus` are; `change` is not). From a light-DOM
* descendant: only if it bubbles (`focus` / `blur` do not). From anywhere else
* (a document-level listener's event, say): no.
*/
function reachesHost(event, host) {
	const target = event.target;
	if (!target || !(host instanceof Node)) return false;
	if (target === host) return true;
	if (!(target instanceof Node)) return false;
	const shadow = host.shadowRoot;
	if (shadow && shadow.contains(target)) return event.composed;
	if (host.contains(target)) return event.bubbles;
	return false;
}
/**
* Attach the mono payload to a native event as its `detail`, keeping the
* browser's own value (a click count, an input's `detail` of 0) as `nativeDetail`.
*/
function decorateEvent(event, detail) {
	if (!Object.getOwnPropertyDescriptor(event, "detail") && !("nativeDetail" in event)) Object.defineProperty(event, "nativeDetail", {
		value: event.detail,
		configurable: true,
		enumerable: false
	});
	Object.defineProperty(event, "detail", {
		value: detail,
		configurable: true,
		enumerable: true
	});
}
/**
* Dispatch a mono component event: the plain name (`change`), plus the
* `mno-change` / `mnoChange` aliases. Bubbling + composed, so every form crosses
* the shadow boundary. See the header for the plain name's decorate /
* synthesize rule.
*
*   dispatchMonoEvent(this, 'change', detail)                          // change + mno-change + mnoChange
*   dispatchMonoEvent(this, 'click', detail, { sourceEvent: event })   // decorates the native click; mno-click + mnoClick
*   dispatchMonoEvent(this, 'click', detail, { alias: 'toggle' })      // toggle + mno-click + mnoClick
*   dispatchMonoEvent(this, 'loading-change', detail)                  // loading-change + loadingChange + mno-loading-change + mnoLoadingChange
*/
function dispatchMonoEvent(target, name, detail, options = {}) {
	const init = {
		detail,
		bubbles: true,
		composed: true
	};
	const camel = toCamelEventName(`mno-${name}`);
	target.dispatchEvent(new CustomEvent(`mno-${name}`, init));
	target.dispatchEvent(new CustomEvent(camel, init));
	const alias = options.alias === false ? null : options.alias ?? name;
	if (!alias) return;
	const fromDetail = detail?.sourceEvent;
	const source = options.sourceEvent !== void 0 ? options.sourceEvent : fromDetail instanceof Event ? fromDetail : null;
	if (source && source.type === alias && reachesHost(source, target)) {
		decorateEvent(source, detail);
		return;
	}
	if (MONO_DEVICE_EVENTS.has(alias)) return;
	const plainInit = {
		detail,
		bubbles: !MONO_NON_BUBBLING_ALIASES.has(alias),
		composed: true
	};
	target.dispatchEvent(new CustomEvent(alias, plainInit));
	const plainCamel = toCamelEventName(alias);
	if (plainCamel !== alias) target.dispatchEvent(new CustomEvent(plainCamel, plainInit));
}
//#endregion
export { dispatchMonoEvent as t };
