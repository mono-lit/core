//#region src/composables/create-config.ts
/** Source subdir for each app kind. The single place the convention lives. */
const MONO_SRC_DIR = {
	vue: "src",
	nuxt: "app"
};
/** Map an app `type` to its source subdir (`vue` -> `src`, `nuxt` -> `app`). */
function srcDirForType(type) {
	return MONO_SRC_DIR[type];
}
/**
* Browser-safe defineConfig.
*
* No C12 here.
* No process here.
* No filesystem here.
*
* NOTE on mutually-extending configs: when two configs extend each other via
* `extends: [() => other]`, TypeScript hits a circular type reference
* ("'default' implicitly has type 'any' … referenced … in its own initializer").
* The fix lives in the config file, not here — annotate the thunk's return type
* so TS stops inferring through the cycle:
*   `extends: [(): MonoConfig => otherConfig]`
* (or annotate the export: `const config: MonoConfig = defineConfig({...})`).
*/
function defineConfig(config) {
	return config;
}
function isPlainObject(value) {
	return value != null && typeof value === "object" && !Array.isArray(value);
}
/**
* Deep-merge `override` onto `base`:
* - plain objects merge recursively,
* - arrays concatenate (base first, then override),
* - everything else (scalars, functions, class constructors) is overwritten.
*
* The generic rule. Config layers go through {@link mergeConfigLayer} instead,
* which overrides this for `env` (layer beats block) and for the name-keyed
* arrays `apps`/`menu`/`cookie` (same-key override, not concatenation). Every
* OTHER array — e.g. `mockIndexedDB` seed rows — concatenates as described here.
*/
function deepMergeLayer(base, override) {
	const out = { ...base };
	for (const key of Object.keys(override)) {
		const o = override[key];
		const b = base[key];
		if (o === void 0) continue;
		if (Array.isArray(o) && Array.isArray(b)) out[key] = [...b, ...o];
		else if (isPlainObject(o) && isPlainObject(b)) out[key] = deepMergeLayer(b, o);
		else out[key] = o;
	}
	return out;
}
/** Dedupe a name-keyed list, keeping the FIRST occurrence of each key. */
function dedupeBy(list, key) {
	if (!Array.isArray(list)) return list;
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const item of list) {
		const k = key(item);
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(item);
	}
	return out;
}
/** The config arrays that are keyed by a name rather than positional. */
const NAME_KEYED_ARRAYS = {
	apps: (a) => a.name,
	menu: (m) => m.title,
	cookie: (c) => c.name
};
/**
* Merge one name-keyed config array over another: a same-key entry from the
* override layer REPLACES the base layer's, and leads the list; entries only the
* base layer declares survive, in their original relative order.
*
* Concatenating override-first and keeping the first occurrence of each key does
* both in one pass.
*
* @example
* // host:  [{title:'A', url:'/host-a'}, {title:'B'}]
* // local: [{title:'A', url:'/my-a'}]
* // ->     [{title:'A', url:'/my-a'}, {title:'B'}]
*/
function mergeKeyedList(base, override, key) {
	if (!Array.isArray(base)) return override;
	if (!Array.isArray(override)) return base;
	return dedupeBy([...override, ...base], key);
}
/**
* Collapse the name-keyed arrays of a single config. The layer merge already
* dedupes pairwise ({@link mergeKeyedList}), so this is the safety net for a
* config that repeats a key inside its own array — and the ONE rule the C12 node
* loader shares, so the two can never disagree about precedence.
*/
function dedupeConfigArrays(config) {
	return {
		...config,
		apps: dedupeBy(config.apps, NAME_KEYED_ARRAYS.apps) ?? config.apps,
		menu: dedupeBy(config.menu, NAME_KEYED_ARRAYS.menu),
		cookie: dedupeBy(config.cookie, NAME_KEYED_ARRAYS.cookie)
	};
}
/**
* Merge two {@link MonoEnvConfig} blocks so that LAYER precedence outranks BLOCK
* precedence.
*
* `deepMergeLayer` alone merges env block-by-block (`default` with `default`,
* `development` with `development`). {@link resolveEnv} then spreads the active
* mode block over `default` — which silently hands a base layer's per-mode value
* a win over the overriding layer's `default`:
*
*   host  env: { development: { MONO_URL: 'https://host.api' } }
*   local env: { default:     { MONO_URL: 'https://mine.api' } }
*   -> resolveEnv(..., 'development') used to return the HOST url.
*
* The rule this restores: the repo you are in wins over everything it extends,
* and mode-beats-default only applies WITHIN one layer. So every key the
* override layer declares in its own `default` erases that key from the inherited
* mode blocks — unless the override layer also spoke about it in that same mode
* block, in which case its more specific value stands.
*
* Keys the override layer never mentions keep the base layer's per-mode values,
* so a remote still inherits the host's whole per-environment matrix.
*
* Mode-independent on purpose: the merge must not bake in `detectMode()`, or
* `resolveEnv(config, someOtherMode)` would read a config resolved for a
* different environment.
*/
function mergeEnvLayer(base, override) {
	if (!isPlainObject(base)) return override;
	if (!isPlainObject(override)) return base;
	const merged = deepMergeLayer(base, override);
	const overrideDefault = override.default;
	if (!isPlainObject(overrideDefault)) return merged;
	for (const mode of Object.keys(merged)) {
		if (mode === "default") continue;
		const mergedBlock = merged[mode];
		if (!isPlainObject(mergedBlock)) continue;
		const overrideBlock = override[mode];
		const block = { ...mergedBlock };
		for (const key of Object.keys(overrideDefault)) {
			if (isPlainObject(overrideBlock) && key in overrideBlock) continue;
			delete block[key];
		}
		merged[mode] = block;
	}
	return merged;
}
/**
* Merge one config layer onto another. Everything goes through
* {@link deepMergeLayer} — which concatenates arrays and lets the override win on
* every scalar — except two keys that need their own precedence rule:
*
* - `env`, which needs layer-over-block precedence ({@link mergeEnvLayer}),
* - the name-keyed arrays, which override per key rather than by concatenation
*   ({@link mergeKeyedList}).
*/
function mergeConfigLayer(base, override) {
	const merged = deepMergeLayer(base, override);
	if ("env" in base || "env" in override) {
		const env = mergeEnvLayer(base.env, override.env);
		if (env === void 0) delete merged.env;
		else merged.env = env;
	}
	for (const [key, keyOf] of Object.entries(NAME_KEYED_ARRAYS)) {
		if (!(key in base) && !(key in override)) continue;
		const list = mergeKeyedList(base[key], override[key], keyOf);
		if (list === void 0) delete merged[key];
		else merged[key] = list;
	}
	return merged;
}
/** Safety cap for pathological extends chains that don't share object identity. */
const MAX_EXTENDS_DEPTH = 50;
/**
* Resolve a config's `extends` at runtime by merging any object layers.
*
* Only object entries are merged here (browser-safe). String/path entries are a
* C12-loader concern and are ignored (with a warning), since the filesystem
* isn't available at runtime. The current config takes precedence over its
* layers — every key, and for `env` every block (see {@link mergeEnvLayer}) —
* and name-keyed arrays (apps/menu/cookie) are combined and de-duped with the
* current config's entries winning and leading the list.
*
* Circular references are supported: two configs may extend each other (e.g.
* mono-host ⇄ mono-vue). A layer already on the current resolution path is
* skipped, so whichever config is loaded as the root wins on conflicts.
*
* Called automatically by `createMono`/`initMono`, so apps don't normally
* need to invoke it directly.
*/
function resolveMonoConfig(config) {
	return resolveLayer(config, /* @__PURE__ */ new Set(), 0);
}
/**
* The active `NODE_ENV` used to pick a block out of {@link MonoEnvConfig}.
*
* `import.meta.env` FIRST, because that is the only one of the two that exists
* in a browser bundle: `process` is not defined there, so the `NODE_ENV` branch
* below is dead in every Vite build. `NODE_ENV` is the Node-side fallback —
* the mono convention is that each `.env.<x>` sets it (e.g. `.env.dev` ->
* `NODE_ENV=development`) and `mono env` loads that into `process.env` before
* Vite starts, which covers `vite.config.ts` and bare-node config eval
* (odata2ts/jiti), where `import.meta.env` does not exist.
*
* `import.meta.env` below must survive type-stripping as a VERBATIM token —
* Vite replaces that whole member expression with an object literal at build
* time and does NOT expose it as a real runtime object. The cast is on
* `import.meta` only so the emitted JS is still exactly `import.meta.env`;
* aliasing `import.meta` itself (`const meta = import.meta; meta.env`) or
* optional-chaining between the two defeats the replacement and yields
* `undefined` at runtime, which makes {@link resolveEnv} silently fall back to
* `env.default` (dev URLs) even in a production build. Same pattern as each
* app's `mono.env.ts`.
*/
function detectMode() {
	try {
		const metaEnv = import.meta.env;
		if (metaEnv) {
			if (metaEnv.MODE) return String(metaEnv.MODE);
			if (metaEnv.PROD) return "production";
			if (metaEnv.DEV) return "development";
		}
	} catch {}
	if (typeof process !== "undefined" && process.env?.NODE_ENV) return process.env.NODE_ENV;
}
/**
* Flatten a config's {@link MonoEnvConfig} into the values for the active
* environment: `env.default` merged first, then the active `env[mode]` block on
* top (active wins). Returns `{}` when there is no `env` field.
*
* `config` MUST be already resolved (post-{@link resolveMonoConfig}) — that is
* where the layer-beats-block rule is applied. Handed a raw config whose
* `extends` were never merged, this returns only that one config's values; handed
* a naively block-merged one, a layer's per-mode value would outrank the root's
* `default`. Prefer the runtime `monoEnv()` accessor, which always reads the
* resolved config out of `monoState()`.
*/
function resolveEnv(config, mode = detectMode()) {
	const env = config?.env;
	if (!env) return {};
	return {
		...env.default ?? {},
		...mode && env[mode] || {}
	};
}
/**
* The `name`s of the apps a config activates through its `extends` array — the
* authoritative "which remotes are switched on" set.
*
* Each `extends` entry (a thunk `() => config` or an already-imported object)
* is resolved and its `name` collected; string/path entries have no name and
* are skipped. Only the top-level layer's `name` is read — this never recurses
* into a layer's own `extends`, so it is safe with the circular host⇄remote
* import graph.
*
* Callers use this to gate rendering (page/route + auto-import discovery, and
* the sidebar menu) on `extends`, so commenting an `extends` entry fully
* removes that remote while `apps[]` (the `mono sync` clone source) is left
* untouched. Returns `[]` when there is no `extends` field.
*/
function resolveExtendsAppNames(config) {
	const names = [];
	for (const entry of normalizeExtendsEntries(config?.extends)) {
		const name = entry.layer?.name;
		if (typeof name === "string") names.push(name);
	}
	return names;
}
/**
* The per-app ecosystem allowlists declared in `extends`.
*
* Keyed by each layer's own `name`, which is also that remote's name in
* `apps[]` — the same identity `resolveExtendsAppNames` already gates
* activation on. An app **absent** from the result is unrestricted; an app
* mapped to `[]` contributes no directories at all.
*
* Read from the RAW config for the same reason as `resolveExtendsAppNames`:
* `resolveMonoConfig` strips `extends` before any consumer could see it.
*/
function resolveExtendsEcosystems(config) {
	const out = {};
	for (const entry of normalizeExtendsEntries(config?.extends)) {
		const name = entry.layer?.name;
		if (typeof name !== "string" || !entry.ecosystems) continue;
		out[name] = entry.ecosystems;
	}
	return out;
}
/** The `{ config, … }` selective form, as opposed to a bare config object. */
function isExtendsOptions(value) {
	if (!isPlainObject(value) || !("config" in value)) return false;
	const inner = value.config;
	return typeof inner === "function" || isPlainObject(inner);
}
/** Resolve one layer source. A thunk that throws contributed nothing. */
function callLayer(value) {
	if (typeof value === "function") try {
		return value();
	} catch {
		return;
	}
	return isPlainObject(value) ? value : void 0;
}
/**
* The single reader for `extends`, in every shape it accepts.
*
* `resolveExtendsAppNames` and `resolveLayer` each used to normalize the array
* and unwrap thunks themselves. They share this now so the two can never drift
* on which entry forms they understand — the selective form had to be taught to
* both, and a second copy is how that goes wrong later.
*/
function normalizeExtendsEntries(ext) {
	if (ext == null) return [];
	return (Array.isArray(ext) ? ext : [ext]).map((entry) => {
		if (typeof entry === "string" || Array.isArray(entry)) return { pathLayer: entry };
		if (isExtendsOptions(entry)) return {
			layer: callLayer(entry.config),
			merges: entry.merges && [...entry.merges],
			ecosystems: entry.ecosystems && [...entry.ecosystems]
		};
		return { layer: callLayer(entry) };
	});
}
/** Allowlist copy. An empty list yields `{}` — the layer contributes nothing. */
function pickKeys(layer, keys) {
	const out = {};
	for (const key of keys) if (key in layer) out[key] = layer[key];
	return out;
}
function resolveLayer(config, stack, depth) {
	const { extends: ext, ...current } = config;
	if (!ext || depth > MAX_EXTENDS_DEPTH) return current;
	const entries = normalizeExtendsEntries(ext);
	const objectLayers = entries.filter((e) => e.layer);
	const pathLayers = entries.filter((e) => e.pathLayer).map((e) => e.pathLayer);
	if (pathLayers.length && typeof console !== "undefined") console.warn("[@mono-lit/utility/config] `extends` string/path sources are only resolved by the C12 node loader (getMonoConfig). At runtime, import the config and pass the object in `extends` instead.", pathLayers);
	if (!objectLayers.length) return current;
	stack.add(config);
	let merged = {};
	for (const entry of objectLayers) {
		const layer = entry.layer;
		if (stack.has(layer)) continue;
		const resolved = resolveLayer(layer, stack, depth + 1);
		const { template: _ownRoleOnly, skill: _ownSkillOnly, ...contribution } = entry.merges ? pickKeys(resolved, entry.merges) : resolved;
		merged = mergeConfigLayer(merged, contribution);
	}
	merged = mergeConfigLayer(merged, current);
	stack.delete(config);
	return dedupeConfigArrays(merged);
}

//#endregion
export { resolveEnv as a, resolveMonoConfig as c, defineConfig as i, srcDirForType as l, dedupeBy as n, resolveExtendsAppNames as o, dedupeConfigArrays as r, resolveExtendsEcosystems as s, MONO_SRC_DIR as t };