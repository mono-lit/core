import { o as pathAppRoots, t as appRootDirs } from "./app-roots-CvJnmXcs.js";
import { c as resolveMonoConfig, l as srcDirForType, o as resolveExtendsAppNames, s as resolveExtendsEcosystems } from "./create-config-DdL3Fh6T.js";
import { r as monoEcosystem } from "./merge-file-CtyKTu5L.js";
import { t as getMonoConfig } from "./config-node-UzJrXg0Z.js";
import { c as monoConfigFileFor, d as resolveFederatedRoots, n as extractConfig, o as formatMissingApps, s as monoAlias, t as assertAppSources, u as monoStubAliases } from "./mono-alias-DNDm-jB_.js";
import { a as defaultMonoExpose, c as parsePageMetaFromFile, i as monoRouterLinkToNuxtLink, l as remoteGate, n as monoNuxtLinkToRouterLink, o as sanitizeForExpose, r as monoRouterLink, s as parsePageMeta, t as monoNuxtLink } from "./mono-link-YlOQ2PVS.js";
import { existsSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

//#region src/vite/mono-pagemeta.ts
/**
* Remove every `definePageMeta( … )` call from `code`, matching the call's
* argument list with a balanced-delimiter scan (so nested `{}`/`[]`/`()`,
* strings, template literals and comments inside the args are handled). Returns
* the original string unchanged if there's nothing to strip, or `null` if the
* source looks malformed (unterminated call) so the caller can bail safely.
*/
function stripDefinePageMeta(code) {
	const MACRO = "definePageMeta";
	let out = "";
	let last = 0;
	let i = 0;
	while (i < code.length) {
		const at = code.indexOf(MACRO, i);
		if (at === -1) break;
		const before = at > 0 ? code[at - 1] : "";
		if (before && /[A-Za-z0-9_$]/.test(before)) {
			i = at + 14;
			continue;
		}
		let p = at + 14;
		while (p < code.length && /\s/.test(code[p])) p++;
		if (code[p] !== "(") {
			i = at + 14;
			continue;
		}
		const close = matchClose(code, p);
		if (close === -1) return null;
		out += code.slice(last, at);
		last = close + 1;
		i = close + 1;
	}
	if (last === 0) return code;
	out += code.slice(last);
	return out;
}
/** Index of the `)` matching the `(` at `open`, or -1 if unbalanced. */
function matchClose(code, open) {
	let depth = 0;
	for (let i = open; i < code.length; i++) {
		const c = code[i];
		if (c === "\"" || c === "'" || c === "`") {
			i = skipString(code, i);
			if (i === -1) return -1;
			continue;
		}
		if (c === "/" && code[i + 1] === "/") {
			const nl = code.indexOf("\n", i + 2);
			if (nl === -1) return -1;
			i = nl;
			continue;
		}
		if (c === "/" && code[i + 1] === "*") {
			const end = code.indexOf("*/", i + 2);
			if (end === -1) return -1;
			i = end + 1;
			continue;
		}
		if (c === "(" || c === "{" || c === "[") depth++;
		else if (c === ")" || c === "}" || c === "]") {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}
/** Index of the closing quote for the string/template starting at `start`. */
function skipString(code, start) {
	const quote = code[start];
	for (let i = start + 1; i < code.length; i++) {
		const c = code[i];
		if (c === "\\") {
			i++;
			continue;
		}
		if (c === quote) return i;
	}
	return -1;
}
/**
* Vite plugin: strip the Nuxt page macro `definePageMeta({ … })` from synced
* remote `.vue` files (those under `.mono/apps/`) so it never reaches the Vue/Vite
* host's runtime.
*
* The Vue host doesn't need the macro: route META (layout/title) is injected
* separately by the host's `extendRoute` via `parsePageMetaFromFile`, which reads
* the page from disk (and so is unaffected by this in-memory strip). Removing the
* call outright — rather than rewriting it to unplugin-vue-router's `definePage`
* — means we don't depend on vue-router's own macro-stripping transform (and its
* `transform.filter`/ordering) ever running on the same module. Our single
* `enforce: 'pre'` transform, before `@vitejs/plugin-vue` compiles the SFC, is
* all that's required.
*
* `enforce: 'pre'` so it runs before the SFC is compiled — place `monoVue()`
* before `VueRouter()` in the plugins array.
*/
function monoPageMetaToDefinePage(options = {}) {
	const isRemote = remoteGate(options);
	return {
		name: "mono-strip-pagemeta",
		enforce: "pre",
		transform(code, id) {
			const file = id?.split("?")[0]?.replace(/\\/g, "/");
			if (!file || !file.endsWith(".vue") || !isRemote(file)) return;
			if (!code.includes("definePageMeta")) return;
			const out = stripDefinePageMeta(code);
			return !out || out === code ? void 0 : {
				code: out,
				map: null
			};
		}
	};
}
/** Clearer alias for {@link monoPageMetaToDefinePage}. */
const monoStripPageMeta = monoPageMetaToDefinePage;

//#endregion
//#region src/vite/mono-layout-slot.ts
/**
* Vite plugin: rewrite a synced remote **layout**'s default `<slot/>` (the
* Nuxt page outlet) into `<router-view />` for the Vue/Vite host.
*
* `vite-plugin-vue-layouts-next`'s `setupLayouts` wraps each page as a CHILD
* route of its layout, so the layout component must render `<router-view/>` for
* the page to appear. Nuxt layouts instead use `<slot/>` (NuxtLayout injects the
* page into the default slot). Without this rewrite the page renders nowhere — the
* layout chrome shows but the page content is blank.
*
* Scope: `.vue` files under a remote `.mono/apps/.../layouts/` dir. Only the DEFAULT
* slot is rewritten — named slots (`<slot name="…">`) are left untouched, since
* those are real content slots, not the page outlet. `<router-view>` is globally
* registered by `app.use(router)`, so no import is needed.
*
* Mirror of `mono-pagemeta`'s transform; the Nuxt host never runs this (it uses
* the same layout files via `<slot/>`).
*/
function monoLayoutSlotToRouterView(options = {}) {
	const isRemote = remoteGate(options);
	return {
		name: "mono-layout-slot-to-router-view",
		enforce: "pre",
		transform(code, id) {
			const file = id?.split("?")[0]?.replace(/\\/g, "/");
			if (!file || !file.endsWith(".vue") || !isRemote(file) || !file.includes("/layouts/")) return;
			if (!code.includes("<slot")) return;
			const out = code.replace(/<slot(?![^>]*\bname=)\b[^>]*\/>/g, "<router-view />").replace(/<slot(?![^>]*\bname=)\b[^>]*>\s*<\/slot>/g, "<router-view />");
			return out === code ? void 0 : {
				code: out,
				map: null
			};
		}
	};
}

//#endregion
//#region src/vite/mono-nuxt-state.ts
/** Files we can inject an import into. */
const SCRIPT_RE = /\.(?:vue|[cm]?[jt]sx?)$/;
/** `<script …> … <\/script>` — captured as (open, body, close). */
const SCRIPT_BLOCK_RE = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g;
/** `import <clause> from '…'` — clause captured, lazy so it stops at its own `from`. */
const IMPORT_CLAUSE_RE = /import\s+([\s\S]*?)\s+from\s*['"][^'"]+['"]/g;
/** `import { … } from '#imports' | '#app' | '#app/…'` — Nuxt's virtual modules. */
const NUXT_VIRTUAL_IMPORT_RE = /import\s*\{([^}]*)\}\s*from\s*(['"])#[^'"]*\2\s*;?[^\S\n]*\n?/g;
const DEFAULT_COMPOSABLES = ["useState", "clearNuxtState"];
/**
* Vite plugin: make Nuxt's `useState()` work in a Vue/Vite host.
*
* A synced Nuxt remote writes `const msg = useState('msg', () => 'hello')` and
* relies on Nuxt auto-importing it. Nothing provides that name in a plain Vue app,
* so the page dies with `useState is not defined`. This plugin rewrites the
* remote's modules to pull the name from `@mono-lit/utility/runtime`, whose
* {@link ../composables/nuxt-state.useState | shim} is the same thing minus the
* SSR payload: a keyed ref registry, so `useState('msg', () => 'hello')` resolves
* to a shared `ref('hello')` and a keyless call to a plain one.
*
* Injecting an import (rather than textually rewriting the call to `ref(...)`)
* keeps the KEY meaningful — two components on the same key must see one ref,
* which a per-call `ref()` can't do — and doesn't depend on the host auto-importing
* `ref`.
*
* Scope: files under `.mono/apps/` (the `appsMarker` option; pass `''` to cover the
* host's own sources too). A file is left alone when it already binds the name
* itself — an explicit import, a local `const`/`function`, or an aliased
* (`useState as x`) Nuxt import. A PLAIN import from a Nuxt virtual module
* (`#imports` / `#app`) is stripped first, since those specifiers resolve to
* nothing outside Nuxt.
*
* `enforce: 'pre'` so `.vue` files are still raw SFC source — register before
* `@vitejs/plugin-vue`, alongside the other `monoVue()` plugins.
*/
function monoNuxtStateToRef(options = {}) {
	const isRemote = remoteGate(options);
	const importFrom = options.importFrom ?? "@mono-lit/utility/runtime";
	const composables = options.composables?.length ? options.composables : DEFAULT_COMPOSABLES;
	return {
		name: "mono-nuxt-state-to-ref",
		enforce: "pre",
		transform(code, id) {
			const file = id?.split("?")[0]?.replace(/\\/g, "/");
			if (!file || !SCRIPT_RE.test(file) || !isRemote(file)) return;
			if (!composables.some((name) => code.includes(name))) return;
			const source = stripNuxtVirtualImports(code, composables);
			const out = file.endsWith(".vue") ? injectIntoSfc(source, composables, importFrom) : injectIntoModule(source, composables, importFrom);
			return out === code ? void 0 : {
				code: out,
				map: null
			};
		}
	};
}
/** Clearer alias for {@link monoNuxtStateToRef}. */
const monoNuxtState = monoNuxtStateToRef;
/**
* Drop the shimmed names from `import { … } from '#imports'`-style statements
* (dead specifiers in a Vue/Vite host), removing the statement entirely once it's
* empty. ALIASED specifiers (`useState as counter`) are kept as-is: the local name
* is the alias, so our injected import wouldn't satisfy the call — better to leave
* the file untouched and let the unresolved `#imports` error say so.
*/
function stripNuxtVirtualImports(code, composables) {
	if (!code.includes("#")) return code;
	return code.replace(NUXT_VIRTUAL_IMPORT_RE, (statement, specifiers) => {
		const all = specifiers.split(",").map((s) => s.trim()).filter(Boolean);
		const kept = all.filter((s) => !composables.includes(s));
		if (kept.length === all.length) return statement;
		if (!kept.length) return "";
		return statement.replace(specifiers, ` ${kept.join(", ")} `);
	});
}
/** The names `code` actually uses that nothing else in it already binds. */
function missingBindings(code, composables) {
	return composables.filter((name) => isReferenced(code, name) && !isBound(code, name));
}
/**
* `name` used as a free identifier — a call, or a bare reference like
* `onUnmounted(clearNuxtState)`. Not `obj.name`, not `myName`, not an object key
* (`{ useState: … }`). A mention inside a comment or string can slip through; the
* cost is one unused import, so the false positive is the cheap direction.
*/
function isReferenced(code, name) {
	return new RegExp(`(?<![\\w$.])${name}(?![\\w$])\\s*(?!:)`).test(code);
}
/** Already imported, declared, or aliased-in under this exact name. */
function isBound(code, name) {
	for (const match of code.matchAll(IMPORT_CLAUSE_RE)) if (new RegExp(`\\b${name}\\b`).test(match[1] ?? "")) return true;
	return new RegExp(`(?:const|let|var|function)\\s+${name}\\b`).test(code) || new RegExp(`as\\s+${name}\\b`).test(code);
}
function importStatement(names, from) {
	return `import { ${names.join(", ")} } from '${from}'`;
}
/** Non-SFC module: imports hoist, so the top of the file is always safe. */
function injectIntoModule(code, composables, from) {
	const missing = missingBindings(code, composables);
	if (!missing.length) return code;
	return `${importStatement(missing, from)}\n${code}`;
}
/**
* SFC: inject per `<script>` block, right after its opening tag (each block is its
* own module — `<script>` and `<script setup>` don't share bindings). A call that
* appears only in the template is skipped: that name has to come from setup, and
* there's no scope to put an import in.
*/
function injectIntoSfc(code, composables, from) {
	return code.replace(SCRIPT_BLOCK_RE, (block, open, body, close) => {
		const missing = missingBindings(body, composables);
		if (!missing.length) return block;
		return `${open}\n${importStatement(missing, from)}${body}${close}`;
	});
}

//#endregion
//#region src/vite/extend-route.ts
/** Resolved default-component filepath, tolerating the Map or a plain-object shape. */
function componentFile(route) {
	if (typeof route.component === "string") return route.component;
	const c = route.components;
	if (!c) return void 0;
	if (c instanceof Map) return c.get("default") ?? c.values().next().value;
	return Object.values(c)[0];
}
/**
* Build a `VueRouter({ extendRoute })` callback that does two things.
*
* **1. Seeds meta for synced remote pages** (component path under `appsMarker`,
* default `/.mono/apps/`). Remote Nuxt pages declare meta with `definePageMeta`,
* which vue-router does not read from disk (and which `monoVue()` strips from the
* runtime build), so it's parsed from the source and added to the route where
* `setupLayouts` can see `meta.layout`.
*
* **2. Gives every route an explicit layout, so no page is wrapped twice.**
* `setupLayouts` wraps in two independent places: every TOP-LEVEL record, and any
* record that declares `meta.layout`. A page folder becomes a component-less GROUP
* record (`{ path: '/module-one', children: [{ path: 'example', … }] }`), and the
* plugin's guard against wrapping such a group only fires when the group's `''`
* child is already a layout — i.e. only when the folder has an `index.vue` that
* itself declares a layout. Any other shape gets the default layout around the
* group AND the page's own layout inside it:
*
*     "/module-one"  L(default)      <-- group, wrapped because it is top-level
*       ""  (group)
*         "example"  L(home)         <-- page, wrapped because it declares a layout
*           ""  PAGE
*
* So `pages/module-one/example.vue` renders two nested layouts while
* `pages/flow/{index,create}.vue` renders one. Fixed per node, no child lookahead:
*  - a group (no component) gets `layout: false`, which `setupLayouts` honours by
*    leaving the record alone — killing the outer wrapper
*  - a page that declares no layout gets `defaultLayout`, so removing that wrapper
*    can't leave a page unwrapped
*
* Layout normalisation applies to EVERY route, not just remote ones: a host-owned
* nested folder doubles exactly the same way. `meta.layout` is read from the page
* SOURCE because `EditableTreeNode.meta` deliberately excludes `definePage()` meta.
* A page declaring `layout: false` keeps it — never overwrite an explicit value.
*
* Reads the default component filepath via `route.component` — NOT
* `Object.values(route.components)`, which yields `[]` because `components` is a `Map`.
*
*   import { monoExtendRoute } from '@mono-lit/utility/vite'
*   VueRouter({ routesFolder: [...], extendRoute: monoExtendRoute() })
*/
function monoExtendRoute(options = {}) {
	const isRemote = remoteGate(options);
	const normalizeLayouts = options.normalizeLayouts !== false;
	const defaultLayout = options.defaultLayout ?? "default";
	return (route) => {
		const file = componentFile(route);
		if (!file) {
			if (normalizeLayouts) route.addToMeta({ layout: false });
			return;
		}
		const meta = parsePageMetaFromFile(file);
		if (isRemote(file) && (meta.layout !== void 0 || meta.title)) route.addToMeta(meta);
		if (!normalizeLayouts) return;
		if ((meta.layout ?? route.meta?.layout) === void 0) route.addToMeta({ layout: defaultLayout });
	};
}

//#endregion
//#region src/vite/mono-lith.ts
const MONO_APPS_VIRTUAL_ID = "virtual:mono-apps";
const RESOLVED_VIRTUAL_ID = "\0virtual:mono-apps";
/** `C:\a\B` -> `c:/a/b` — chokidar and Vite slash paths differently, and Windows is case-insensitive. */
function normalizeFsPath(value) {
	const slashed = value.replace(/\\/g, "/");
	return process.platform === "win32" ? slashed.toLowerCase() : slashed;
}
/** Forward-slashed absolute path, safe inside a JS string literal. */
function importSpecifier(file) {
	return JSON.stringify(file.replace(/\\/g, "/"));
}
function createMonoLithHooks(options = {}) {
	const rootDir = options.dirname ?? process.cwd();
	const appRoots = options.appRoots ?? resolveFederatedRoots({
		dirname: rootDir,
		...options.appsDir ? { appsDir: options.appsDir } : {}
	});
	const siblings = pathAppRoots(appRoots);
	const active = options.activeNames ? appRoots.filter((r) => options.activeNames.includes(r.name)) : appRoots;
	const configFiles = [];
	const ownName = extractConfig(rootDir).name ?? "<root>";
	const ownConfig = monoConfigFileFor(rootDir);
	if (ownConfig) configFiles.push({
		name: ownName,
		file: ownConfig
	});
	for (const root of active) {
		const file = monoConfigFileFor(root.root);
		if (file) configFiles.push({
			name: root.name,
			file
		});
	}
	const configByPath = new Map(configFiles.map((c) => [normalizeFsPath(c.file), c.name]));
	const load = (id) => {
		if (id !== RESOLVED_VIRTUAL_ID) return void 0;
		return [
			"// Generated by @mono-lit/utility (virtual:mono-apps): one lazy import per",
			"// federated app’s mono.config, whether it is a sibling or a clone.",
			"export default {",
			...active.flatMap((r) => {
				const file = monoConfigFileFor(r.root);
				return file ? [`  ${JSON.stringify(r.name)}: () => import(${importSpecifier(file)}),`] : [];
			}),
			"}",
			""
		].join("\n");
	};
	const configureServer = (server) => {
		if (options.watchSiblings !== false) for (const sibling of siblings) server.watcher.add(join(sibling.root, srcDirForType(sibling.type ?? "vue")));
		if (options.restartOnConfigChange === false) return;
		for (const { file } of configFiles) server.watcher.add(file);
		let restarting = false;
		const onConfigEvent = (file) => {
			const name = configByPath.get(normalizeFsPath(file));
			if (!name || restarting) return;
			restarting = true;
			server.config.logger.info(`[mono] mono.config changed (${name}) — restarting`, { timestamp: true });
			server.restart();
		};
		server.watcher.on("change", onConfigEvent);
		server.watcher.on("add", onConfigEvent);
		server.watcher.on("unlink", onConfigEvent);
	};
	return {
		fsAllow: siblings.map((r) => r.root),
		appRoots,
		configureServer,
		resolveId: (id) => id === "virtual:mono-apps" ? RESOLVED_VIRTUAL_ID : void 0,
		load
	};
}
/**
* Standalone plugin for a long-hand `vite.config.ts`. `monoRepo().vite()` /
* `mono.plugin` already include these hooks — do not register both.
*
* ```ts
* import { monoLith } from '@mono-lit/utility/vite'
* plugins: [VueRouter({ … }), vue(), monoLith({ dirname: __dirname })]
* ```
*/
function monoLith(options = {}) {
	const hooks = createMonoLithHooks(options);
	return {
		name: "mono-lith",
		config() {
			if (!hooks.fsAllow.length) return;
			return { server: { fs: { allow: [options.dirname ?? process.cwd(), ...hooks.fsAllow] } } };
		},
		configureServer: hooks.configureServer,
		resolveId: hooks.resolveId,
		load: hooks.load
	};
}

//#endregion
//#region src/vite/resolve-from-root.ts
/**
* Import the consumer's own copy of an ecosystem plugin.
*
* `mono.vite()` registers plugins (`vue-router/vite`, `unplugin-auto-import`,
* …) that belong to the **app**, not to @mono-lit/utility. Two ways to reach them, and
* only one is correct:
*
*  - A bare `await import('unocss/vite')` happens to work from the plain
*    `.pnpm/mono-utils@…/` layout, because the app's `node_modules` is an
*    ancestor of the real path and Node's upward walk finds it. But that is
*    phantom-dependency resolution: undeclared, unversioned, and silently
*    dependent on the plugin being a *direct* dep of the app.
*
*  - Declaring them as peerDependencies is worse. pnpm's `autoInstallPeers` is on
*    (no `.npmrc` in any template), so declaring a peer installs a SECOND copy
*    under @mono-lit/utility's own `node_modules/`. That already happens:
*    `mono-nuxt-host` carries `@unhead/vue` twice at the identical version 3.1.3
*    under different peer-hash directories. Two `vue-router` instances would mean
*    two `vue-router/auto-routes` virtual modules, two UnoCSS contexts, two
*    auto-import dts writers racing on the same file.
*
* So resolve from the app root explicitly. `monoRepo()` already computes it.
*/
/**
* Build a {@link RootLoader} anchored at `rootDir`.
*
* `createRequire` needs a *file* to resolve from — `noop.js` never has to exist,
* it only fixes the directory the walk starts in.
*/
function createRootLoader(rootDir) {
	const req = createRequire(pathToFileURL(join(rootDir, "noop.js")));
	return async (id) => {
		try {
			return await import(pathToFileURL(req.resolve(id)).href);
		} catch {
			return await import(id);
		}
	};
}
/**
* Pull the plugin factory out of a module namespace.
*
* `createRequire().resolve()` picks the **`require`** condition, so a package
* that ships both (vue-router does: `dist/unplugin/vite.cjs`) resolves to CJS.
* Importing a `.cjs` puts `module.exports` on `default` — and since that export
* is itself `{ default: fn }`, the factory ends up at `default.default`. ESM
* builds put it at `default` directly, and a few packages are the bare
* namespace. Unwrap all three rather than guessing per package.
*/
function interopDefault(mod) {
	const first = mod?.default ?? mod;
	if (typeof first !== "function" && typeof first?.default === "function") return first.default;
	return first;
}
/** Read a named export, looking through the same CJS `default` wrapper. */
function interopNamed(mod, key) {
	return mod?.[key] ?? mod?.default?.[key];
}
/** `true` when `id` can be resolved from the app root. Never throws. */
function canResolveFromRoot(rootDir, id) {
	const req = createRequire(pathToFileURL(join(rootDir, "noop.js")));
	try {
		req.resolve(id);
		return true;
	} catch (error) {
		return error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED";
	}
}

//#endregion
//#region src/vite/mono-vite.ts
/** Upstream plugin name for each key — used for the duplicate warning. */
const MONO_ECO_PLUGIN_NAMES = {
	pages: "vue-router",
	layouts: "vite-plugin-vue-layouts-next",
	composables: "unplugin-auto-import",
	components: "unplugin-vue-components"
};
/**
* Which ecosystem a `mono.ecosystem(sub)` call belongs to, by first path
* segment — `composables/shared` and `stores/shared` both feed auto-import.
*/
const MONO_ECO_SUB_KEYS = {
	pages: "pages",
	layouts: "layouts",
	components: "components",
	composables: "composables",
	stores: "composables"
};
/** Map one ecosystem subpath to the plugin that consumes it, if any. */
function ecoKeyForSub(sub) {
	return MONO_ECO_SUB_KEYS[String(sub).split("/")[0]];
}
/**
* Resolve `own` to absolute, existing dirs. `undefined` falls back to
* `fallback`, which may name several dirs — auto-import wants both
* `composables/` and `composables/shared/`, the same pair it already asks every
* federated app for. Non-existent dirs are dropped, so naming one an app does
* not have costs nothing.
*/
function ownDirs(rootDir, own, fallback) {
	if (own === false) return [];
	return (own === void 0 ? Array.isArray(fallback) ? fallback : [fallback] : Array.isArray(own) ? own : [own]).map((dir) => isAbsolute(dir) ? dir : resolve(rootDir, dir)).filter((dir) => existsSync(dir));
}
/**
* The auto-import presets worth defaulting. Each is gated on being resolvable
* from the app root — an app without `pinia` must not have its dev server die
* because mono assumed the template's dependency list.
*/
async function defaultAutoImports(rootDir, load) {
	const presets = [
		"vue",
		"vue-router",
		"@vueuse/core",
		"pinia"
	].filter((id) => canResolveFromRoot(rootDir, id));
	if (canResolveFromRoot(rootDir, "@unhead/vue")) {
		const preset = interopNamed(await load("@unhead/vue"), "unheadVueComposablesImports");
		if (preset) presets.push(preset);
	}
	if (canResolveFromRoot(rootDir, "vue-router/unplugin")) {
		const preset = interopNamed(await load("vue-router/unplugin"), "VueRouterAutoImports");
		if (preset) presets.push(preset);
	}
	return presets;
}
/**
* Make the compat transforms beat `vue-router`'s own macro transform no matter
* where they land in the array.
*
* `enforce: 'pre'` only buckets them WITH vue-router (which is also `pre`);
* within a bucket, array order decides. That was fine while `vite()` owned the
* whole array, but the moment a consumer writes `mono.pages()` above
* `mono.vite()` the compat rewrites would run *after* vue-router had already
* transformed the module — and `mono-strip-pagemeta` has to get there first.
*
* Vite re-partitions on the HOOK-level `order` field globally
* (`getSortedPluginsByHook`), so promoting `transform` to its object form makes
* the ordering intrinsic rather than positional. Applied here rather than in
* each plugin file so `monoVue()`'s existing standalone behaviour is untouched.
*/
function transformFirst(plugins) {
	return plugins.map((plugin) => {
		const hook = plugin.transform;
		if (typeof hook !== "function") return plugin;
		return {
			...plugin,
			transform: {
				order: "pre",
				handler: hook
			}
		};
	});
}
/** `VueRouter()` options: own + federated page folders, plus `extendRoute`. */
function monoPagesOptions(ctx, opts = {}, extendRouteOpts) {
	ctx.built.add("pages");
	const { rootDir, ownType, ecosystem, extendRoute } = ctx;
	const { own, ...pass } = opts;
	const pagesDirs = ownDirs(rootDir, own, `${srcDirForType(ownType)}/pages`);
	const remote = pagesDirs.some((dir) => existsSync(join(dir, "index.vue"))) ? { exclude: ["*/index.vue"] } : {};
	return {
		routesFolder: [...pagesDirs.map((dir) => ({ src: dir })), ...ecosystem("pages").map((dir) => ({
			src: dir,
			...remote
		}))],
		...extendRouteOpts !== false && { extendRoute: extendRoute(extendRouteOpts || void 0) },
		...pass
	};
}
/**
* `Layouts()` options: own layout dirs, plus the federated ones unless this app
* is the host.
*
* Layouts are the one ecosystem where the two roles genuinely disagree. A HOST
* ships the shared shell, so it renders its own `layouts/` and must not adopt a
* remote's — a remote's `default.vue` would otherwise compete with the shell's.
* A REMOTE is the opposite: it has no shell of its own and consumes the host's.
* `template` in `mono.config.ts` is what says which, and it is the only thing
* that can — the distinction is not visible on disk (an app with no `layouts/`
* looks the same either way, and `ownDirs` already drops it).
*
* `template` sets a DEFAULT, not a lock: `layoutsDirs` replaces the whole list,
* so one call can always opt out without a mono-specific knob.
*/
function monoLayoutsOptions(ctx, opts = {}) {
	ctx.built.add("layouts");
	const { rootDir, ownType, ecosystem, template } = ctx;
	const { own, ...pass } = opts;
	return {
		layoutsDirs: [...ownDirs(rootDir, own, `${srcDirForType(ownType)}/layouts`), ...template === "host" ? [] : ecosystem("layouts")],
		defaultLayout: "default",
		...pass
	};
}
/**
* `AutoImport()` options: own + federated composables AND stores dirs.
*
* `imports` covers only the preset NAMES that resolve from this app. The object
* presets (`unheadVueComposablesImports`, `VueRouterAutoImports`) need a module
* load, which cannot happen synchronously — import them in your config and pass
* your own `imports`, or use `mono.autoImport()`, which resolves them for you.
*/
function monoAutoImportOptions(ctx, opts = {}) {
	ctx.built.add("composables");
	const { rootDir, ownType, ecosystem } = ctx;
	const { composables = {}, stores = {}, ...pass } = opts;
	const src = srcDirForType(ownType);
	const wantComposables = composables !== false;
	const wantStores = stores !== false;
	return {
		imports: [
			"vue",
			"vue-router",
			"@vueuse/core",
			"pinia"
		].filter((id) => canResolveFromRoot(rootDir, id)),
		dts: `${src}/auto-imports.d.ts`,
		vueTemplate: true,
		dirs: [
			...wantComposables ? ownDirs(rootDir, (composables || {}).own, [`${src}/composables`, `${src}/composables/shared`]) : [],
			...wantStores ? ownDirs(rootDir, (stores || {}).own, [`${src}/stores`, `${src}/stores/shared`]) : [],
			...ecosystem([...wantComposables ? ["composables/shared", "composables"] : [], ...wantStores ? ["stores/shared", "stores"] : []])
		],
		...pass
	};
}
/** `Components()` options: own + federated component dirs. */
function monoComponentsOptions(ctx, opts = {}) {
	ctx.built.add("components");
	const { rootDir, ownType, ecosystem } = ctx;
	const { own, ...pass } = opts;
	const src = srcDirForType(ownType);
	return {
		extensions: ["vue"],
		include: [/\.vue$/, /\.vue\?vue/],
		dts: `${src}/components.d.ts`,
		directoryAsNamespace: true,
		collapseSamePrefixes: true,
		dirs: [...ownDirs(rootDir, own, `${src}/components`), ...ecosystem("components")],
		...pass
	};
}
/** `vue-router/vite` + `ecosystem('pages')` + `extendRoute`. `enforce: 'pre'`. */
function monoPages(ctx, opts = {}, extendRouteOpts) {
	const options = monoPagesOptions(ctx, opts, extendRouteOpts);
	return (async () => {
		return tagEco(interopDefault(await createRootLoader(ctx.rootDir)("vue-router/vite"))(options), "pages");
	})();
}
/** `vite-plugin-vue-layouts-next` + `ecosystem('layouts')`. `enforce: 'pre'`. */
function monoLayouts(ctx, opts = {}) {
	const options = monoLayoutsOptions(ctx, opts);
	return (async () => {
		return tagEco(interopDefault(await createRootLoader(ctx.rootDir)("vite-plugin-vue-layouts-next"))(options), "layouts");
	})();
}
/**
* `unplugin-auto-import/vite` + the federated composables AND stores dirs.
* `enforce: 'post'`. One plugin covers both ecosystems, so `stores` is a
* dirs-only companion option rather than its own factory.
*/
function monoAutoImport(ctx, opts = {}) {
	const options = monoAutoImportOptions(ctx, opts);
	return (async () => {
		const load = createRootLoader(ctx.rootDir);
		return tagEco(interopDefault(await load("unplugin-auto-import/vite"))({
			...options,
			imports: opts.imports ?? await defaultAutoImports(ctx.rootDir, load)
		}), "composables");
	})();
}
/** `unplugin-vue-components/vite` + `ecosystem('components')`. `enforce: 'post'`. */
function monoComponents(ctx, opts = {}) {
	const options = monoComponentsOptions(ctx, opts);
	return (async () => {
		return tagEco(interopDefault(await createRootLoader(ctx.rootDir)("unplugin-vue-components/vite"))(options), "components");
	})();
}
/**
* Build the federated plugin stack.
*
* Returned order matters only WITHIN each `enforce` bucket, and that is exactly
* what this controls: compat transforms before `VueRouter` (both `pre`), and
* `mono.plugin` after auto-import/components (both `post`).
*
* Any ecosystem plugin already built via its own factory earlier in the same
* `plugins` array is skipped, so mixing the two styles never double-registers.
*/
async function monoVite(ctx, opts = {}) {
	const { apps, hostResolver, plugin, built } = ctx;
	const out = [];
	// @vitejs/plugin-vue then read.
	const compat = opts.nuxtCompat;
	if (typeof compat === "boolean" ? compat : compat != null || !built.has("compat") && apps.some((app) => app.type === "nuxt")) out.push(...transformFirst(hostResolver(typeof compat === "object" ? compat : {})));
	/**
	* Should `vite()` build this ecosystem's plugin?
	*
	*  - `false`        never
	*  - an object      always — an explicit option outranks the skip, so
	*                   `vite({ components: {…} })` wins even if something else
	*                   marked it
	*  - `undefined`    only if the consumer has not already wired it (via a mono
	*                   factory, `.options()`, or `mono.ecosystem(<that sub>)`)
	*/
	const wanted = (key, value) => value !== false && (value != null || !built.has(key));
	if (wanted("pages", opts.pages)) out.push(await monoPages(ctx, opts.pages || {}, opts.extendRoute));
	if (wanted("layouts", opts.layouts)) out.push(await monoLayouts(ctx, opts.layouts || {}));
	if (wanted("composables", opts.composables) || wanted("composables", opts.stores)) {
		const { own, ...rest } = (opts.composables === false ? {} : opts.composables) ?? {};
		out.push(await monoAutoImport(ctx, {
			...rest,
			composables: opts.composables === false ? false : own === void 0 ? {} : { own },
			stores: opts.stores
		}));
	}
	if (wanted("components", opts.components)) out.push(await monoComponents(ctx, opts.components || {}));
	if (!built.has("plugin")) out.push(plugin);
	return out;
}
/** Marks a plugin instance mono built, and for which ecosystem. */
const MONO_ECO_TAG = "__monoEco";
/** Marks an instance mono has already stood down. */
const MONO_NEUTRALIZED = "__monoNeutralized";
/** Tag every plugin object a builder produced (a factory may return an array). */
function tagEco(built, key) {
	const walk = (entry) => {
		if (Array.isArray(entry)) return entry.forEach(walk);
		if (entry && typeof entry === "object") entry[MONO_ECO_TAG] = key;
	};
	walk(built);
	return built;
}
/** A hook that does nothing. `transform`/`resolveId`/`load` must return null. */
function noopHook(name) {
	return [
		"transform",
		"resolveId",
		"load"
	].includes(name) ? () => null : () => void 0;
}
/**
* Stand a plugin instance down without removing it.
*
* Vite fixes the plugin list before any `config()` hook runs, so a duplicate
* cannot be spliced out. Its hooks CAN be replaced, though. Hooks are replaced with
* no-ops rather than deleted, because `getSortedPluginsByHook` may already have
* captured this plugin as a hook owner, and it would then call `undefined`.
*/
function neutralize(plugin) {
	if (plugin[MONO_NEUTRALIZED]) return;
	plugin[MONO_NEUTRALIZED] = true;
	if (plugin.transformInclude) plugin.transformInclude = () => false;
	for (const name of [
		"transform",
		"resolveId",
		"load",
		"buildStart",
		"buildEnd",
		"configureServer",
		"closeBundle",
		"writeBundle",
		"generateBundle"
	]) {
		const hook = plugin[name];
		if (hook == null) continue;
		plugin[name] = typeof hook === "object" ? {
			...hook,
			handler: noopHook(name)
		} : noopHook(name);
	}
}
/**
* Make `mono.vite()` win when an ecosystem is registered twice.
*
* The long-hand config registers `VueRouter`/`AutoImport`/`Components`/`Layouts`
* by hand. Passing that ecosystem to `vite({ components: {…} })` says "mono owns
* this one now" — so mono's instance stays live and the hand-written one is
* stood down, leaving exactly one active plugin per ecosystem.
*
* When neither instance is mono's, nothing is touched: that is the consumer's
* own duplicate, and silently disabling one would be worse than saying so.
*/
function reconcileEcoPlugins(plugins) {
	const known = new Set(Object.values(MONO_ECO_PLUGIN_NAMES));
	const byName = /* @__PURE__ */ new Map();
	const walk = (entry) => {
		if (Array.isArray(entry)) return entry.forEach(walk);
		const plugin = entry;
		if (!plugin || typeof plugin !== "object") return;
		const name = plugin.name;
		if (!name || !known.has(name)) return;
		byName.set(name, [...byName.get(name) ?? [], plugin]);
	};
	walk(plugins);
	const won = [];
	const conflicting = [];
	for (const [name, list] of byName) {
		if (list.length < 2) continue;
		const mine = list.find((plugin) => plugin[MONO_ECO_TAG]);
		if (!mine) {
			conflicting.push(name);
			continue;
		}
		for (const plugin of list) if (plugin !== mine) neutralize(plugin);
		won.push(name);
	}
	if (won.length) console.info(`[mono] ${won.join(", ")}: mono.vite() options given, so mono's instance is active and the hand-written one was stood down.`);
	if (conflicting.length) console.warn(`[mono] ${conflicting.join(", ")} registered more than once, neither by mono.\n[mono] Two unplugin-auto-import instances race on one auto-imports.d.ts and two\n[mono] vue-router instances scan every page twice. Remove one, or hand the\n[mono] ecosystem to mono.vite({ … }) and let it own the plugin.`);
	return {
		won,
		conflicting
	};
}

//#endregion
//#region src/vite/mono-repo.ts
/** Default `__MONO_CONFIG_EXPOSE__` shape — kept in sync with `host-nuxt.ts`. */
/**
* Merge the computed `monoAlias` UNDER the host's own `resolve.alias` so the
* host's explicit aliases always win (mirrors `nuxt.options.alias = { ...alias,
* ...nuxt.options.alias }` in `host-nuxt.ts`). Handles both the object and the
* `[{ find, replacement }]` array forms Vite accepts.
*/
function composeAlias(userAlias, mono) {
	if (Array.isArray(userAlias)) return [...userAlias, ...Object.entries(mono).map(([find, replacement]) => ({
		find,
		replacement
	}))];
	if (userAlias && typeof userAlias === "object") return {
		...mono,
		...userAlias
	};
	return mono;
}
/**
* Mono Vite host helper — the single-call Vite equivalent of the Nuxt host's
* `@mono-lit/utility/nuxt` module.
*
* Loads `mono.config.ts` ONCE (c12/jiti, taught the `monoAlias` map), resolves
* the `extends`-active apps, and returns:
*  - `plugin`: a Vite plugin (register LAST) wiring `resolve.alias`,
*    `__MONO_CONFIG_EXPOSE__`, `server.fs.allow` and dep dedup
*  - `ecosystem(subs)`: type-aware remote dir discovery (`nuxt` -> `app/<sub>`,
*    `vue` -> `src/<sub>`) to feed AutoImport / Components / Layouts / VueRouter
*    `routesFolder` at registration time
*  - `config` / `alias` / `apps`: the resolved values, for advanced use
*
* Why async + explicit dirs (not post-registration injection): current
* `unplugin-auto-import` exposes no `api`, `unplugin-vue-components`' `api` has
* no `options`, and `vue-router` / `vite-plugin-vue-layouts-next` capture their
* dirs option in a closure — so none of them can be mutated after registration.
* Passing dirs at registration is the only reliable path; this helper just
* centralises the config load so you discover them with one-liner
* `mono.ecosystem(...)` instead of repeating `monoAlias` / `getMonoConfig` /
* `activeApps` / `define` / `server.fs` in every host.
*
*   import { monoRepo } from '@mono-lit/utility/vite'
*
*   export default defineConfig(async ({ mode }) => {
*     const mono = await monoRepo()
*     return {
*       plugins: [
*         vue({ template: { compilerOptions: { isCustomElement } } }),
*         UnoCSS(),
*         mono.vite(), // ← VueRouter + layouts + auto-import + components + plugin
*       ],
*     }
*   })
*
* The same file works whether the federated remote is a Nuxt app or a Vue one —
* `vite()` reads `apps[].type` and adds the Nuxt-compat transforms only when one
* is a Nuxt remote. `ecosystem()` stays public for anything `vite()` does not
* own, and any ecosystem key can be turned off to register it by hand:
*
*   mono.vite({ layouts: false }),
*   Layouts({ layoutsDirs: mono.ecosystem('layouts') }),
*/
async function monoRepo(options = {}) {
	const rootDir = options.dirname ?? process.cwd();
	assertAppSources(extractConfig(rootDir).apps, rootDir);
	const alias = monoAlias({
		dirname: rootDir,
		...options.appsDir ? { appsDir: options.appsDir } : {}
	});
	const appRoots = resolveFederatedRoots({
		dirname: rootDir,
		...options.appsDir ? { appsDir: options.appsDir } : {}
	});
	const linked = pathAppRoots(appRoots);
	if (linked.length && options.warnMissing !== false) console.info(`[mono] reading ${linked.map((a) => a.name).join(", ")} from apps[].path — the same directories are used by build, prepare and sync.`);
	for (const [key, value] of Object.entries(options.alias ?? {})) {
		const dir = value?.dir;
		if (!dir) continue;
		alias[key] = isAbsolute(dir) ? dir : resolve(rootDir, dir);
	}
	const { alias: stubAlias, missing } = options.stubMissing === false ? {
		alias: {},
		missing: []
	} : monoStubAliases({
		dirname: rootDir,
		...options.appsDir ? { appsDir: options.appsDir } : {}
	});
	if (missing.length && options.warnMissing !== false) console.warn(formatMissingApps(missing));
	const rawConfig = await getMonoConfig({
		cwd: rootDir,
		jitiOptions: { alias: {
			...alias,
			...stubAlias
		} }
	});
	const hasExtends = rawConfig.extends != null;
	const activeNames = resolveExtendsAppNames(rawConfig);
	const apps = (rawConfig.apps ?? []).filter((a) => hasExtends ? activeNames.includes(a.name) : true).map((a) => ({
		name: a.name,
		type: a.type,
		...a.path ? { path: a.path } : {}
	}));
	const monoConfig = {
		...resolveMonoConfig(rawConfig),
		apps: rawConfig.apps,
		...rawConfig.extends != null ? { extends: rawConfig.extends } : {}
	};
	const ecosystems = resolveExtendsEcosystems(rawConfig);
	const built = /* @__PURE__ */ new Set();
	const ecosystem = (subs) => {
		for (const sub of Array.isArray(subs) ? subs : [subs]) {
			const key = ecoKeyForSub(sub);
			if (key) built.add(key);
		}
		return monoEcosystem({
			dirname: rootDir,
			apps,
			subs,
			ecosystems
		});
	};
	const nuxt = () => ({
		hostResolver: (userOpts = {}) => {
			built.add("compat");
			const opts = {
				...userOpts,
				appsRoots: userOpts.appsRoots ?? appRootDirs(appRoots)
			};
			const plugins = [monoPageMetaToDefinePage(opts), monoLayoutSlotToRouterView(opts)];
			if (opts.nuxtState !== false) plugins.push(monoNuxtStateToRef(opts));
			if (opts.nuxtLink !== false) plugins.push(monoNuxtLinkToRouterLink(opts));
			if (opts.defineImportMeta !== false) plugins.push({
				name: "mono-define-import-meta",
				config() {
					return { define: {
						"import.meta.server": "false",
						"import.meta.client": "true"
					} };
				}
			});
			return plugins;
		},
		extendRoute: (opts = {}) => extendRoute(opts)
	});
	let didConfig = false;
	let didConfigResolved = false;
	const lith = createMonoLithHooks({
		dirname: rootDir,
		appRoots,
		activeNames: apps.map((a) => a.name),
		restartOnConfigChange: options.restartOnConfigChange,
		watchSiblings: options.watchSiblings
	});
	const plugin = {
		name: "mono-repo",
		enforce: "post",
		configureServer: lith.configureServer,
		resolveId: lith.resolveId,
		load: lith.load,
		configResolved(resolved) {
			if (didConfigResolved) return;
			didConfigResolved = true;
			reconcileEcoPlugins(resolved.plugins);
		},
		config(config) {
			if (didConfig) return;
			didConfig = true;
			return {
				resolve: { alias: composeAlias(config.resolve?.alias, {
					...stubAlias,
					...alias
				}) },
				define: { __MONO_CONFIG_EXPOSE__: JSON.stringify(sanitizeForExpose((options.expose ?? defaultMonoExpose)(monoConfig)) ?? null) },
				server: { fs: { allow: [
					rootDir,
					join(rootDir, ".mono", "apps"),
					...appRootDirs(linked)
				] } },
				optimizeDeps: { exclude: [...options.optimizeExclude ?? ["@mono-lit/helper"]] }
			};
		}
	};
	const extendRoute = (opts = {}) => monoExtendRoute({
		appsRoots: appRootDirs(appRoots),
		...opts
	});
	const viteCtx = {
		rootDir,
		ownType: monoConfig.type ?? "vue",
		...monoConfig.template ? { template: monoConfig.template } : {},
		apps,
		ecosystem,
		extendRoute,
		hostResolver: nuxt().hostResolver,
		plugin,
		built
	};
	const vite = (opts = {}) => monoVite(viteCtx, opts);
	const pages = Object.assign((opts = {}) => monoPages(viteCtx, opts), { options: (opts = {}) => monoPagesOptions(viteCtx, opts) });
	const layouts = Object.assign((opts = {}) => monoLayouts(viteCtx, opts), { options: (opts = {}) => monoLayoutsOptions(viteCtx, opts) });
	const autoImport = Object.assign((opts = {}) => monoAutoImport(viteCtx, opts), { options: (opts = {}) => monoAutoImportOptions(viteCtx, opts) });
	const result = {
		vite,
		pages,
		layouts,
		autoImport,
		composables: autoImport,
		components: Object.assign((opts = {}) => monoComponents(viteCtx, opts), { options: (opts = {}) => monoComponentsOptions(viteCtx, opts) }),
		plugin,
		ecosystem,
		extendRoute,
		nuxt,
		config: monoConfig,
		alias,
		apps,
		appRoots
	};
	Object.defineProperty(result, "plugin", {
		enumerable: true,
		configurable: true,
		get() {
			built.add("plugin");
			return plugin;
		}
	});
	return result;
}

//#endregion
//#region src/vite/index.ts
/**
* Vite-host compatibility layer for running a **Nuxt remote** inside a plain
* Vue 3 + Vite host. Returns the plugins needed for the narrow Nuxt surface the
* synced remote code uses:
*  - strips the Nuxt `definePageMeta({…})` macro from `.mono/apps/*.vue` (route meta is
*    injected separately by the host's `extendRoute` via `parsePageMetaFromFile`)
*  - rewrites a remote layout's default `<slot/>` -> `<router-view/>` (so Nuxt
*    `<slot>` layouts render the page under `setupLayouts`' nested routes)
*  - points Nuxt's auto-imported `useState()` at the `@mono-lit/utility/runtime` shim
*    (a keyed ref registry — `useState('k', () => 'hello')` -> a shared `ref('hello')`)
*  - rewrites `<NuxtLink>` -> `<RouterLink>` (`external` adds `target="_blank"`,
*    so the browser navigates for real; an absolute-URL `to` becomes an `<a>`)
*  - defines `import.meta.server`/`import.meta.client` (SPA client constants)
*
* Mirrors `@mono-lit/helper/vite`'s `monoSsr()` shape. Register before `VueRouter()`:
*   import { monoVue } from '@mono-lit/utility/vite'
*   plugins: [ ...monoVue(), VueRouter({...}), vue(), ... ]
*/
function monoVue(options = {}) {
	const plugins = [monoPageMetaToDefinePage(options), monoLayoutSlotToRouterView(options)];
	if (options.nuxtState !== false) plugins.push(monoNuxtStateToRef(options));
	if (options.nuxtLink !== false) plugins.push(monoNuxtLinkToRouterLink(options));
	if (options.defineImportMeta !== false) plugins.push({
		name: "mono-define-import-meta",
		config() {
			return { define: {
				"import.meta.server": "false",
				"import.meta.client": "true"
			} };
		}
	});
	return plugins;
}

//#endregion
export { MONO_APPS_VIRTUAL_ID, MONO_ECO_PLUGIN_NAMES, MONO_ECO_SUB_KEYS, canResolveFromRoot, createMonoLithHooks, createRootLoader, ecoKeyForSub, monoAutoImport, monoAutoImportOptions, monoComponents, monoComponentsOptions, monoExtendRoute, monoLayoutSlotToRouterView, monoLayouts, monoLayoutsOptions, monoLith, monoVue as monoNuxtHost, monoVue, monoNuxtLink, monoNuxtLinkToRouterLink, monoNuxtState, monoNuxtStateToRef, monoPageMetaToDefinePage, monoPages, monoPagesOptions, monoRepo, monoRouterLink, monoRouterLinkToNuxtLink, monoStripPageMeta, monoVite, parsePageMeta, parsePageMetaFromFile, reconcileEcoPlugins, sanitizeForExpose };