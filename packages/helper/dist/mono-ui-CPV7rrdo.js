//#region src/composables/mono-skeleton.ts
/**
* "Is there a DOM to render into?" — deliberately NOT lit's `isServer`. That flag is a
* build-time constant of lit's node entry, so it is `true` wherever Node's export
* conditions pick that build — including a jsdom test run, where this feature must work.
* On a real server (`@lit-labs/ssr` + its dom shim) there is a `customElements` but no
* `document`, which is exactly the distinction that matters here.
*/
var hasDom = typeof document !== "undefined" && typeof customElements !== "undefined";
/**
* ONE store per realm, on `globalThis` (same reasoning as `mono-ui.ts`): the light and
* shadow builds are separate bundles and a pnpm peer fork can install two copies of the
* package, yet all of them must agree on "active" and on the defaults.
*/
var STATE_KEY$1 = Symbol.for("mono-helper.skeleton");
var state$1 = globalThis[STATE_KEY$1] ??= {
	active: false,
	disabled: false,
	ssr: null,
	ssrSniffed: null,
	defaults: {},
	watching: false,
	createdBeforeActive: 0,
	createdBeforeActiveTags: [],
	warnedLate: false,
	waiting: /* @__PURE__ */ new Set(),
	holders: /* @__PURE__ */ new Set()
};
var PHANTOM_TAG = "phantom-ui";
var DEFAULT_MAX_WAIT = 15e3;
/** Per-element slots the Cores can read without depending on the mixin's class shape. */
var TAG_DEFAULT = Symbol.for("mono-helper.skeleton.tagDefault");
var PENDING_ACTIVE = Symbol.for("mono-helper.skeleton.active");
var PENDING_GRACE = Symbol.for("mono-helper.skeleton.grace");
var PENDING_PHANTOM = Symbol.for("mono-helper.skeleton.phantom");
/** Where `applyMonoUIDefaults` parks a tag's `pending` default (not assigned to the prop). */
var MONO_PENDING_TAG_DEFAULT = TAG_DEFAULT;
function isActive() {
	return state$1.active && !state$1.disabled;
}
/**
* Start following the registry. Idempotent; a no-op on the server. Called by the mono
* `customElement` decorator, so the watcher exists before any element constructs.
*/
function watchSkeletonActivation() {
	if (!hasDom || state$1.watching) return;
	state$1.watching = true;
	const activate = () => {
		state$1.active = true;
		if (state$1.createdBeforeActive > 0 && !state$1.warnedLate) {
			state$1.warnedLate = true;
			const tags = state$1.createdBeforeActiveTags.slice(0, 5).join(", ");
			console.warn(`[mono-skeleton] phantom-ui was defined after ${state$1.createdBeforeActive} mono element(s) had rendered (${tags}); their first paint had no skeleton. Load "@aejkatappaja/phantom-ui" before the app mounts (main.ts import, or let @mono-lit/helper/nuxt do it).`);
		}
	};
	if (customElements.get(PHANTOM_TAG)) {
		activate();
		return;
	}
	customElements.whenDefined(PHANTOM_TAG).then(activate, () => {});
}
/**
* Is this an SSR app? The explicit flag (`createMonoUI({ skeleton: { ssr } })`, which the
* Nuxt module sets from `nuxt.options.ssr`) wins; otherwise the Nuxt payload marker is
* sniffed once (`<script id="__NUXT_DATA__" data-ssr="true">`).
*/
function isMonoSsrApp() {
	if (state$1.ssr !== null) return state$1.ssr;
	if (state$1.ssrSniffed === null) state$1.ssrSniffed = hasDom && document.getElementById("__NUXT_DATA__")?.getAttribute("data-ssr") === "true";
	return state$1.ssrSniffed;
}
/** Set the global defaults (`createMonoUI`'s `skeleton` key routes here). `false` disables the skeleton. */
function setMonoSkeletonDefaults(defaults) {
	if (defaults === false) {
		state$1.disabled = true;
		return;
	}
	state$1.disabled = false;
	const { ssr, ...rest } = defaults ?? {};
	state$1.ssr = typeof ssr === "boolean" ? ssr : null;
	state$1.defaults = { ...rest };
}
function getMonoSkeletonStatus() {
	return {
		active: isActive(),
		ssr: state$1.ssr,
		createdBeforeActive: state$1.createdBeforeActive,
		createdBeforeActiveTags: [...state$1.createdBeforeActiveTags]
	};
}
/** Drop defaults / flag / counters (tests). `active` stays — an element cannot be undefined. */
function resetMonoSkeleton() {
	state$1.disabled = false;
	state$1.ssr = null;
	state$1.ssrSniffed = null;
	state$1.defaults = {};
	state$1.createdBeforeActive = 0;
	state$1.createdBeforeActiveTags = [];
	state$1.warnedLate = false;
	state$1.waiting.clear();
	state$1.holders.clear();
}
var PHANTOM_KEYS = [
	"animation",
	"mode",
	"shimmerDirection",
	"shimmerColor",
	"backgroundColor",
	"duration",
	"stagger",
	"reveal",
	"count",
	"countGap",
	"fallbackRadius",
	"loadingLabel",
	"pierceShadow",
	"debug"
];
var kebab = (name) => name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
function isPendingObject(value) {
	return !!value && typeof value === "object";
}
/** The boolean a `pending` value carries (`undefined` = auto). */
function activeOf(value) {
	if (typeof value === "boolean") return value;
	if (isPendingObject(value)) return typeof value.active === "boolean" ? value.active : void 0;
}
/** Only the phantom options of a value (an object), as a plain record. */
function phantomOf(value) {
	const out = {};
	if (!isPendingObject(value)) return out;
	for (const key of PHANTOM_KEYS) {
		const v = value[key];
		if (v !== void 0) out[key] = v;
	}
	return out;
}
function shallowEqual(a, b) {
	const ka = Object.keys(a);
	const kb = Object.keys(b);
	if (ka.length !== kb.length) return false;
	for (const k of ka) if (a[k] !== b[k]) return false;
	return true;
}
/** `hasChanged` for the property: booleans by value, objects shallowly. */
function pendingChanged(next, prev) {
	if (isPendingObject(next) && isPendingObject(prev)) return !shallowEqual(next, prev);
	return next !== prev;
}
/**
* The attribute converter. The attribute form is boolean-only: `pending`,
* `pending="true"` → true; `pending="false"` → false; absent or `pending="auto"` → auto.
* A real boolean is accepted too (what a server renderer hands over).
*/
var pendingConverter = {
	fromAttribute(value) {
		if (value === null || value === void 0) return void 0;
		if (typeof value === "boolean") return value;
		const s = String(value).trim().toLowerCase();
		if (s === "auto") return void 0;
		return s === "" || s === "true";
	},
	toAttribute() {
		return null;
	}
};
/**
* Register the `pending` property on a registered element class. Called by the mono
* `customElement` decorator BEFORE `customElements.define`, so the attribute lands in
* Lit's attribute map when `observedAttributes` is read.
*/
function registerPendingProperty(cls) {
	cls.createProperty("pending", {
		attribute: "pending",
		reflect: false,
		converter: pendingConverter,
		hasChanged: pendingChanged
	});
}
/** Whether `pending` currently resolves to true for `el` (set before each render). */
function monoPendingActive(el) {
	return !!el[PENDING_ACTIVE];
}
/**
* True once one macrotask has passed since the element first resolved pending — lets a
* `'data'` Core say "no controller / source after one tick → nothing to wait for" without
* releasing before a binding made in the consumer's `onMounted`.
*/
function monoPendingGrace(el) {
	return !!el[PENDING_GRACE];
}
/**
* The phantom options resolved for `el` while pending (element object over tag default
* over global default), camelCase keys. Empty while not pending. For `'custom'` Cores
* that render their own `<phantom-ui>` and want a value in the template (e.g. `count`).
*/
function monoPhantomOptions(el) {
	return el[PENDING_PHANTOM] ?? {};
}
/**
* Apply the resolved phantom options to a `<phantom-ui>` element as attributes (used by
* the mixin for its wrapper, and by `'custom'` Cores for the phantom they render).
* Diffed against what was last applied to that element, so unchanged values cost nothing.
*/
function monoApplyPhantomOptions(el, target) {
	if (!target) return;
	const next = el[PENDING_PHANTOM] ?? {};
	const store = target;
	const prev = store[PENDING_PHANTOM] ?? {};
	if (shallowEqual(next, prev)) return;
	for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
		const value = next[key];
		const attr = kebab(key);
		if (value === void 0 || value === null || value === false) target.removeAttribute(attr);
		else if (value === true) target.setAttribute(attr, "");
		else target.setAttribute(attr, String(value));
	}
	store[PENDING_PHANTOM] = { ...next };
}
/** @internal */
var monoSkeletonInternals = {
	hasDom,
	isActive,
	state: state$1,
	slots: {
		TAG_DEFAULT,
		PENDING_ACTIVE,
		PENDING_GRACE,
		PENDING_PHANTOM
	},
	activeOf,
	phantomOf,
	PHANTOM_TAG,
	DEFAULT_MAX_WAIT
};
/** The `<phantom-ui>` wrapper the skeleton mixin renders around an element's content. */
function isMonoSkeletonWrapper(node) {
	return !!node && node.nodeType === 1 && node.localName === PHANTOM_TAG && node.hasAttribute("mono-skeleton");
}
/** `Array.from(host.childNodes)` minus the skeleton wrapper. */
function monoHostChildNodes(host) {
	return Array.from(host.childNodes).filter((n) => !isMonoSkeletonWrapper(n));
}
/** `Array.from(host.children)` minus the skeleton wrapper. */
function monoHostChildren(host) {
	return Array.from(host.children).filter((n) => !isMonoSkeletonWrapper(n));
}
//#endregion
//#region src/composables/mono-ui.ts
var STATE_KEY = Symbol.for("mono-helper.ui");
var state = globalThis[STATE_KEY] ??= {
	store: null,
	createdTotal: 0,
	createdTags: [],
	createdBeforeConfig: 0,
	createdBeforeConfigTags: [],
	warned: /* @__PURE__ */ new Set()
};
var SHADOW_PREFIX = "mono-shadow-";
function warnOnce(key, message) {
	if (state.warned.has(key)) return;
	state.warned.add(key);
	console.warn(`[mono-ui] ${message}`);
}
var camel = (name) => name.replace(/-([a-z0-9])/g, (_m, c) => c.toUpperCase());
/** Arrays and plain objects are copied per element, so one element cannot mutate the shared config. */
function fresh(value) {
	if (Array.isArray(value)) return [...value];
	if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) return { ...value };
	return value;
}
/**
* Set the app-wide default props. Call once, first — usually in `main.ts`:
*
* ```ts
* app.use(createMonoUI({ 'mono-button': { size: 'xs' } }))
* // or simply
* createMonoUI({ 'mono-button': { size: 'xs' } })
* ```
*
* A later call replaces the previous config for elements created afterwards.
*/
function createMonoUI(config = {}) {
	const next = {};
	setMonoSkeletonDefaults(config.skeleton);
	for (const [tag, props] of Object.entries(config)) {
		if (tag === "skeleton") continue;
		if (!/^mono-[a-z0-9-]+$/.test(tag)) {
			warnOnce(`tag:${tag}`, `"${tag}" is not a mono component tag — expected "mono-<name>". Ignored.`);
			continue;
		}
		if (!props || typeof props !== "object") continue;
		next[tag] = { ...props };
	}
	state.createdBeforeConfig = state.createdTotal;
	state.createdBeforeConfigTags = [...state.createdTags];
	if (state.createdTotal > 0 && typeof document !== "undefined") {
		const tags = state.createdTags.slice(0, 5).join(", ") + (state.createdTags.length > 5 ? ", …" : "");
		console.warn(`[mono-ui] createMonoUI() ran after ${state.createdTotal} mono element${state.createdTotal === 1 ? " was" : "s were"} created (${tags}); ${state.createdTotal === 1 ? "it keeps its" : "those keep their"} built-in defaults. Call createMonoUI() first in main.ts, before app.mount().`);
	}
	state.store = next;
	return {
		config: { ...next },
		install() {}
	};
}
/** The current config, or `null` when `createMonoUI` has not been called. */
function getMonoUI() {
	return state.store;
}
/** Whether the config is set, and how many elements were created before it was. */
function getMonoUIStatus() {
	return {
		configured: state.store !== null,
		createdBefore: state.store ? state.createdBeforeConfig : state.createdTotal,
		createdBeforeTags: state.store ? [...state.createdBeforeConfigTags] : [...state.createdTags]
	};
}
/** Drop the config (tests, or reconfiguring before mount). Elements created afterwards get built-in defaults. */
function resetMonoUI() {
	resetMonoSkeleton();
	state.store = null;
	state.createdTotal = 0;
	state.createdTags.length = 0;
	state.createdBeforeConfig = 0;
	state.createdBeforeConfigTags = [];
	state.warned.clear();
}
/**
* Apply the configured defaults to a freshly constructed element. Called by the
* mono `customElement` decorator at the end of construction — not public API.
* @internal
*/
function applyMonoUIDefaults(el, tag) {
	state.createdTotal++;
	if (!state.createdTags.includes(tag)) state.createdTags.push(tag);
	if (!state.store) return;
	const base = tag.startsWith(SHADOW_PREFIX) ? `mono-${tag.slice(12)}` : tag;
	const props = {
		...state.store[base] ?? {},
		...base !== tag ? state.store[tag] ?? {} : {}
	};
	for (const [key, value] of Object.entries(props)) {
		if (value === void 0) continue;
		const prop = camel(key);
		if (prop === "pending") {
			el[MONO_PENDING_TAG_DEFAULT] = fresh(value);
			continue;
		}
		if (!(prop in el)) {
			warnOnce(`prop:${base}:${prop}`, `<${base}> has no prop "${key}". Ignored.`);
			continue;
		}
		el[prop] = fresh(value);
	}
}
//#endregion
export { watchSkeletonActivation as _, resetMonoUI as a, monoApplyPhantomOptions as c, monoPendingActive as d, monoPendingGrace as f, resetMonoSkeleton as g, registerPendingProperty as h, getMonoUIStatus as i, monoHostChildNodes as l, monoSkeletonInternals as m, createMonoUI as n, getMonoSkeletonStatus as o, monoPhantomOptions as p, getMonoUI as r, isMonoSsrApp as s, applyMonoUIDefaults as t, monoHostChildren as u };
