import { o as pathAppRoots, t as appRootDirs } from "./app-roots-CvJnmXcs.js";
import { c as resolveMonoConfig, l as srcDirForType, o as resolveExtendsAppNames, s as resolveExtendsEcosystems } from "./create-config-DdL3Fh6T.js";
import { n as mergeEcosystem, r as monoEcosystem, t as ecosystemSubAllowed } from "./merge-file-CtyKTu5L.js";
import { t as getMonoConfig } from "./config-node-UzJrXg0Z.js";
import { d as resolveFederatedRoots, n as extractConfig, o as formatMissingApps, s as monoAlias, t as assertAppSources, u as monoStubAliases } from "./mono-alias-DNDm-jB_.js";
import { a as defaultMonoExpose, i as monoRouterLinkToNuxtLink, l as remoteGate, o as sanitizeForExpose, s as parsePageMeta } from "./mono-link-YlOQ2PVS.js";
import { r as registerMonoNuxtLayers, t as monoLayerCandidates } from "./nuxt-layers-DP1m7f1-.js";
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import { addComponentsDir, addImportsDir, addPlugin, addPluginTemplate, addRouteMiddleware, addTemplate, addVitePlugin, defineNuxtModule, extendPages, extendViteConfig } from "@nuxt/kit";

//#region src/nuxt/nuxt-ecosystem.ts
/**
* The built-in ecosystem map, given THIS app's `template`.
*
* `pages`/`imports`/`components` are role-independent — a host absorbs its
* remotes' features, a remote absorbs its host's, and both want the same four
* folders. The shell is where the roles disagree:
*
* - `layouts` follows `mono.vite()` exactly (`monoLayoutsOptions`): a `host`
*   owns the shared shell and must not adopt a remote's `default.vue`, while a
*   `remote` — and an ABSENT `template`, which has always read as `remote` —
*   consumes the host's.
* - `middleware` / `plugins` have no `mono.vite()` analogue, so there is no
*   prior behaviour to preserve. They are enabled for an EXPLICIT `remote`
*   only: quietly running a remote's global middleware or its Sentry plugin
*   inside an existing Nuxt host would be a regression, not a fix. A host that
*   wants them opts in by restating the entry in `mono.utils.ecosystem`.
*/
function nuxtEcosystemDefaults(template) {
	return {
		pages: {
			type: "pages",
			relDir: "pages"
		},
		composables: {
			type: "imports",
			relDir: "composables"
		},
		stores: {
			type: "imports",
			relDir: "stores"
		},
		components: {
			type: "components",
			relDir: "components"
		},
		layouts: {
			type: "layouts",
			relDir: "layouts",
			enabled: template !== "host"
		},
		middleware: {
			type: "middleware",
			relDir: "middleware",
			enabled: template === "remote"
		},
		plugins: {
			type: "plugins",
			relDir: "plugins",
			enabled: template === "remote"
		}
	};
}
/**
* Default page-exclude globs for the federated `pages` dirs.
*
* Only the root `index.vue` is ever in question, and the answer is visible on
* disk: an app that ships its own `pages/index.vue` owns `/`, so a federated
* root index would clobber it. An app that does NOT — every remote, which takes
* the host's login page as `/` — must let it through. Same derivation as
* `monoPagesOptions` (`src/vite/mono-vite.ts`), which reads `ownsRoot` off the
* filesystem rather than asking the config.
*
* Deeper `<folder>/index.vue` pages are never excluded by this.
*/
function remotePageExcludes(ownPagesDir) {
	return existsSync(join(ownPagesDir, "index.vue")) ? ["index.vue"] : [];
}
/**
* The identity two files fight over when one is federated and one is the app's
* own: the basename, minus its extension and minus a trailing Nuxt mode/scope
* suffix (`.client` / `.server` / `.global`).
*
* Dropping the suffix is deliberate — an app's own `plugins/mono.ts` should win
* over a host's `plugins/mono.client.ts`, since they are two versions of one
* plugin rather than two plugins.
*/
function ecosystemFileKey(file) {
	return (file.replaceAll("\\", "/").split("/").pop() ?? file).replace(/\.(vue|[cm]?[jt]sx?)$/, "").replace(/\.(client|server|global)$/, "");
}
/**
* The `ecosystemFileKey`s this app ships in its OWN `<srcDir>/<sub>` folder.
*
* Used to skip a federated layout/middleware/plugin the app has replaced. Nuxt
* already refuses to clobber for layouts (`app.layouts`) and middleware
* (`addRouteMiddleware` matches on name), but `addPlugin` dedupes on absolute
* `src` — which never matches across two checkouts — so the rule is applied
* here for all three rather than relying on three different behaviours.
*/
function ownEcosystemKeys(ownDir) {
	const keys = /* @__PURE__ */ new Set();
	if (!existsSync(ownDir)) return keys;
	for (const entry of readdirSync(ownDir, { withFileTypes: true })) {
		if (entry.isDirectory()) continue;
		keys.add(ecosystemFileKey(entry.name));
	}
	return keys;
}
/** Recursively collect files under `dir` whose extension is in `exts`. */
function walkFiles(dir, exts) {
	const out = [];
	if (!existsSync(dir) || !statSync(dir).isDirectory()) return out;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walkFiles(full, exts));
		else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
	}
	return out;
}
/** Top-level files only (no recursion) whose extension is in `exts`. */
function topLevelFiles(dir, exts) {
	if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
	return readdirSync(dir, { withFileTypes: true }).filter((e) => !e.isDirectory() && exts.some((ext) => e.name.endsWith(ext))).map((e) => join(dir, e.name));
}
/**
* `layouts/home.vue` -> `home`, `layouts/admin/users.vue` -> `admin-users` —
* the same path-to-name flattening Nuxt applies to its own `layouts/` dir.
*/
function layoutNameFor(layoutsDir, file) {
	return relative(layoutsDir, file).replace(/\.vue$/, "").split(sep).join("-");
}
/** `route-guard.global.ts` -> `{ name: 'route-guard', global: true }`. */
function middlewareNameFor(file) {
	const base = (file.replaceAll("\\", "/").split("/").pop() ?? file).replace(/\.[cm]?[jt]sx?$/, "");
	const global = base.endsWith(".global");
	return {
		name: global ? base.slice(0, -7) : base,
		global
	};
}
/** Source extensions Nuxt accepts for middleware / plugins. */
const SCRIPT_EXTENSIONS = [
	".ts",
	".mts",
	".cts",
	".js",
	".mjs",
	".cjs",
	".tsx",
	".jsx"
];

//#endregion
//#region src/nuxt/host-nuxt.ts
/**
* Mono Nuxt module — the Nuxt equivalent of the Vite side's `mono.vite()`
* ecosystem block, and like it, ONE module serving both roles. A Nuxt HOST
* absorbs its remotes' features; a Nuxt REMOTE (`template: 'remote'`) absorbs
* its host's shell. `mono.config.ts`'s `template` is what says which, exactly as
* it does for `mono.vite()` — the file is still named `host-nuxt.ts` only
* because the export path `@mono-lit/utility/nuxt` is public.
*
* At BUILD time it:
*
*  - builds the `monoAlias` map (`@<own>`, `@<remote>`, `@mono-apps`, …) and
*    applies it to Nuxt + jiti, plus any `mono.alias` overrides
*  - resolves `mono.config.ts` (incl. its `extends` chain) via c12/jiti and
*    exposes a trimmed, serialisable subset to the client as the compile-time
*    global `__MONO_CONFIG_EXPOSE__`
*  - discovers folders across every federated app under `.mono/apps/<name>` (via
*    `mergeEcosystem`) per the `ecosystem` map and wires each into Nuxt:
*      - type 'pages'      -> routes via `extendPages` (layout/title from `definePage`)
*      - type 'imports'    -> `addImportsDir` (composables/stores auto-import)
*      - type 'components' -> `addComponentsDir`
*      - type 'layouts'    -> `app.layouts` via the `app:templates` hook
*      - type 'middleware' -> `addRouteMiddleware` (`.global` honoured)
*      - type 'plugins'    -> `addPlugin` (`.client`/`.server` honoured)
*    Defaults cover pages/composables/stores/components for every role, plus
*    layouts/middleware/plugins for a remote — see `nuxtEcosystemDefaults`. A
*    file this app ships itself always wins over the federated one of the same
*    name.
*  - rewrites the unplugin-vue-router macro `definePage({ meta: X })` to Nuxt's
*    `definePageMeta(X)` for the out-of-tree remote `.vue` files
*  - rewrites `<RouterLink>` -> `<NuxtLink>` in remote templates, so remote links
*    prefetch and handle external URLs like the host's own
*  - opens Vite's dev-server `fs.allow` to `.apps/` and excludes the
*    web-components lib from dep pre-bundling (single `customElements.define`).
*
* Configure via the `mono` key in `nuxt.config.ts`; register with
* `modules: ['@mono-lit/utility/nuxt']`.
*/
/**
* Turn an `ecosystems` policy into a plain allow/deny for one custom
* `dir`/`sub` ecosystem entry.
*
* `mergeEcosystem` matches the policy against each resolved directory, but a
* custom entry's `dir` is arbitrary (`dir: 'shared/widgets'`) and carries no
* sub name to match on. So decide per app up front, using the entry's own
* identity as the sub, and hand `mergeEcosystem` a verdict instead: `[]` blocks
* that app, an absent key leaves it untouched.
*
* Returns `undefined` when no app is blocked, so the common path stays free of
* an empty filter object.
*/
function gateCustomEntry(ecosystems, sub) {
	const blocked = {};
	for (const [app, allow] of Object.entries(ecosystems)) if (!ecosystemSubAllowed(sub, allow)) blocked[app] = [];
	return Object.keys(blocked).length ? blocked : void 0;
}
const monoNuxtModule = defineNuxtModule({
	meta: {
		name: "mono-nuxt",
		configKey: "mono"
	},
	defaults: {},
	async setup(options, nuxt) {
		const rootDir = nuxt.options.rootDir;
		const u = options.utils ?? options;
		const optimizeExclude = u.optimizeExclude ?? ["@mono-lit/helper"];
		assertAppSources(extractConfig(rootDir).apps, rootDir);
		const appRoots = resolveFederatedRoots({ dirname: rootDir });
		const alias = monoAlias({ dirname: rootDir });
		for (const [key, value] of Object.entries(u.alias ?? {})) {
			const dir = value?.dir;
			if (!dir) continue;
			alias[key] = isAbsolute(dir) ? dir : resolve(rootDir, dir);
		}
		nuxt.options.alias = {
			...alias,
			...nuxt.options.alias
		};
		const { alias: stubAlias, missing } = u.stubMissing === false ? {
			alias: {},
			missing: []
		} : monoStubAliases({ dirname: rootDir });
		if (missing.length && u.warnMissing !== false) console.warn(formatMissingApps(missing));
		const rawConfig = await getMonoConfig({
			cwd: rootDir,
			jitiOptions: { alias: {
				...alias,
				...stubAlias
			} }
		});
		const hasExtends = rawConfig.extends != null;
		const activeNames = resolveExtendsAppNames(rawConfig);
		const activeApps = hasExtends ? (rawConfig.apps ?? []).filter((a) => activeNames.includes(a.name)) : rawConfig.apps ?? [];
		const activeRoots = appRoots.filter((r) => activeApps.some((a) => a.name === r.name));
		const extendsEcosystems = resolveExtendsEcosystems(rawConfig);
		const monoConfig = {
			...resolveMonoConfig(rawConfig),
			apps: rawConfig.apps,
			...rawConfig.extends != null ? { extends: rawConfig.extends } : {}
		};
		const ownSrcDir = join(rootDir, srcDirForType(rawConfig.type ?? "nuxt"));
		const ecosystem = {
			...nuxtEcosystemDefaults(rawConfig.template),
			...u.ecosystem ?? {}
		};
		const layerCandidates = monoLayerCandidates({
			apps: activeApps,
			appRoots,
			template: rawConfig.template
		});
		const layered = registerMonoNuxtLayers({
			nuxt,
			candidates: layerCandidates
		});
		dedupeLayerPlugins(nuxt, layerCandidates, ownSrcDir);
		const mergeApps = activeApps.filter((app) => !layered.has(app.name));
		const mergeNames = activeNames.filter((name) => !layered.has(name));
		if (layered.size) console.log(`[mono-nuxt] merged  via native Nuxt layers: ${[...layered].join(", ")}`);
		for (const [name, entry] of Object.entries(ecosystem)) {
			if (!entry || entry.enabled === false) continue;
			if (hasExtends && activeApps.length === 0) break;
			const entryApps = entry.type === "imports" ? activeApps : mergeApps;
			const entryNames = entry.type === "imports" ? activeNames : mergeNames;
			if (!entryApps.length && hasExtends) continue;
			const dirs = entry.relDir != null ? monoEcosystem({
				dirname: rootDir,
				apps: entryApps,
				subs: entry.relDir,
				appDir: entry.appDir,
				includes: entry.includes,
				excludes: entry.excludes,
				ecosystems: extendsEcosystems,
				dirIncludes: entry.dirIncludes,
				dirExcludes: entry.dirExcludes
			}) : mergeEcosystem({
				dirname: rootDir,
				dir: entry.dir,
				sub: entry.sub,
				appDir: entry.appDir,
				appDirs: entry.appDirs,
				includes: entry.includes ?? (hasExtends ? entryNames : void 0),
				excludes: entry.excludes,
				ecosystems: gateCustomEntry(extendsEcosystems, entry.sub ?? name),
				dirIncludes: entry.dirIncludes,
				dirExcludes: entry.dirExcludes
			});
			switch (entry.type) {
				case "imports":
					for (const dir of dirs) if (existsSync(dir)) addImportsDir([dir, join(dir, "**")]);
					break;
				case "components": {
					const pathPrefix = entry.pathPrefix !== false;
					for (const dir of dirs) if (existsSync(dir) && statSync(dir).isDirectory()) addComponentsDir({
						path: dir,
						pathPrefix
					});
					break;
				}
				case "pages":
					registerRemotePages(dirs, entry.exclude ?? remotePageExcludes(join(ownSrcDir, "pages")), name);
					break;
				case "layouts":
					registerRemoteLayouts(nuxt, dirs, entry.exclude ?? [], ownSrcDir, name);
					break;
				case "middleware":
					registerRemoteMiddleware(dirs, entry.exclude ?? [], ownSrcDir, name);
					break;
				case "plugins":
					registerRemotePlugins(dirs, entry.exclude ?? [], ownSrcDir, name);
					break;
			}
		}
		extendViteConfig((config) => {
			config.define = {
				...config.define,
				__MONO_CONFIG_EXPOSE__: JSON.stringify(sanitizeForExpose((u.expose ?? defaultMonoExpose)(monoConfig)) ?? {})
			};
			if (Object.keys(stubAlias).length) {
				config.resolve ??= {};
				const existing = config.resolve.alias;
				config.resolve.alias = Array.isArray(existing) ? [...Object.entries(stubAlias).map(([find, replacement]) => ({
					find,
					replacement
				})), ...existing] : {
					...stubAlias,
					...existing
				};
			}
			config.server ??= {};
			config.server.fs ??= {};
			config.server.fs.allow = [
				...config.server.fs.allow ?? [],
				rootDir,
				join(rootDir, ".mono", "apps"),
				...appRootDirs(pathAppRoots(appRoots))
			];
			config.optimizeDeps ??= {};
			config.optimizeDeps.exclude = [...config.optimizeDeps.exclude ?? [], ...optimizeExclude];
			config.ssr ??= {};
			config.ssr.noExternal = [
				...Array.isArray(config.ssr.noExternal) ? config.ssr.noExternal : [],
				"@mono-lit/utility",
				"notivue",
				"devextreme",
				"exceljs",
				"file-saver-es",
				"@odata2ts/http-client-fetch",
				"uuid",
				"tslib"
			];
		});
		if (u.nuxtLink !== false) addVitePlugin(monoRouterLinkToNuxtLink({ appsRoots: appRootDirs(appRoots) }));
		const isRemoteFile = remoteGate({ appsRoots: appRootDirs(appRoots) });
		addVitePlugin({
			name: "mono-define-page-to-pagemeta",
			enforce: "pre",
			transform(code, id) {
				const file = id?.split("?")[0]?.replace(/\\/g, "/");
				if (!file || !file.endsWith(".vue") || !isRemoteFile(file)) return;
				if (!code.includes("definePage")) return;
				const out = code.replace(/\bdefinePage\s*\(\s*\{\s*meta\s*:\s*(\{[\s\S]*?\})\s*,?\s*\}\s*\)/g, "definePageMeta($1)");
				return out === code ? void 0 : {
					code: out,
					map: null
				};
			}
		});
		addPluginTemplate({
			filename: "mono-state-init.mjs",
			getContents: () => [
				"import { initMono } from \"@mono-lit/utility/runtime\"",
				"export default defineNuxtPlugin(() => {",
				"  initMono(__MONO_CONFIG_EXPOSE__)",
				"})"
			].join("\n")
		});
		if (usesPreFetchModule(nuxt)) {
			defaultPreFetchLearning(nuxt);
			registerPreFetchLearning(nuxt, monoConfig);
			registerPreFetchDirs(nuxt, activeRoots);
			registerPreFetchServer(nuxt, sanitizeForExpose((u.expose ?? defaultMonoExpose)(monoConfig)) ?? {});
			addPluginTemplate({
				filename: "mono-prefetch-bridge.client.mjs",
				mode: "client",
				getContents: () => [
					"import { monoSetPrefetchBridge } from \"@mono-lit/utility/fetching\"",
					"// Runs after @mono-lit/nuxt-pre-fetch's `pre` plugin, which provides $nuxtPreFetch.",
					"export default defineNuxtPlugin({",
					"  name: \"mono:prefetch-bridge\",",
					"  setup(nuxtApp) {",
					"    const api = nuxtApp.$nuxtPreFetch",
					"    if (api && api.serving) monoSetPrefetchBridge(api)",
					"  },",
					"})"
				].join("\n")
			});
		}
	}
});
function usesPreFetchModule(nuxt) {
	return (nuxt.options.modules ?? []).map((entry) => Array.isArray(entry) ? entry[0] : entry).some((name) => typeof name === "string" && name.includes("nuxt-pre-fetch")) || nuxt.options.nuxtPreFetch !== void 0;
}
/**
* Learning follows the data layer the app installs, unless the app sets `nuxtPreFetch.learn.enabled`
* itself: `@mono-lit/data` describes a page's OData calls on the server (`definePrefetch`), so the
* first visit is prefetched and nothing needs learning; plain DevExtreme stores can't, so their calls
* marked `prefetch: true` are learned and prefetched from the next visit. (This module runs before
* nuxt-pre-fetch, which reads the option with the default in place.)
*/
function defaultPreFetchLearning(nuxt) {
	const options = nuxt.options.nuxtPreFetch ??= {};
	options.learn ??= {};
	if (typeof options.learn.enabled === "boolean") return;
	options.learn.enabled = !dataLayerDescribesRequests(nuxt);
}
/**
* Whether `@mono-lit/devextreme` — as this app resolves it: an alias, a pnpm override, or the package
* itself — is `@mono-lit/data`, the data layer that describes its requests on the server.
*/
function dataLayerDescribesRequests(nuxt) {
	const DATA_LAYER = "@mono-lit/devextreme";
	try {
		const aliased = nuxt.options.alias[DATA_LAYER];
		let dir = aliased && isAbsolute(aliased) ? aliased : realpathSync(resolve(nuxt.options.rootDir, "node_modules", DATA_LAYER));
		for (let i = 0; i < 6; i++) {
			const manifest = join(dir, "package.json");
			if (existsSync(manifest)) return JSON.parse(readFileSync(manifest, "utf8")).name === "@mono-lit/data";
			dir = resolve(dir, "..");
		}
	} catch {}
	return false;
}
/**
* The pages of every merged app are compiled into this one, so their `definePrefetch` files are
* too: each active app's `app/prefetch` (or `src/prefetch`) is appended to nuxt-pre-fetch's
* `prefetchDir` (this module runs before it, so the option is read with them).
*/
function registerPreFetchDirs(nuxt, roots) {
	const dirs = roots.flatMap(({ root }) => ["app/prefetch", "src/prefetch"].map((dir) => resolve(root, dir))).filter((dir) => existsSync(dir));
	if (!dirs.length) return;
	const options = nuxt.options.nuxtPreFetch ??= {};
	const own = options.prefetchDir ?? "prefetch";
	options.prefetchDir = [...new Set([...Array.isArray(own) ? own : [own], ...dirs])];
}
/** Hosts of every `fetching.api` entry and the auth cookie names, for learned requests. */
function registerPreFetchLearning(nuxt, monoConfig) {
	const fetching = monoConfig.fetching;
	const hosts = /* @__PURE__ */ new Set();
	for (const entry of Object.values(fetching?.api ?? {})) {
		if (typeof entry?.url !== "string") continue;
		try {
			hosts.add(new URL(entry.url).host.toLowerCase());
		} catch {}
	}
	const auth = fetching?.auth ?? {};
	const use = auth.use && typeof auth.use === "object" ? auth.use : {};
	const cookies = [
		auth.token,
		auth.tokenRefresh,
		use.apiRequest,
		use.refreshTokenRequest
	].filter((name) => typeof name === "string" && !!name);
	const headers = Object.keys(fetching?.headers ?? {}).map((name) => name.toLowerCase());
	const runtimeConfig = nuxt.options.runtimeConfig;
	runtimeConfig.nuxtPreFetch ??= {};
	const dynamic = runtimeConfig.nuxtPreFetch.dynamic ??= {};
	const merge = (current, add) => [...new Set([...Array.isArray(current) ? current : [], ...add])];
	dynamic.allowedHosts = merge(dynamic.allowedHosts, [...hosts]);
	dynamic.authCookies = merge(dynamic.authCookies, cookies);
	if (headers.length) dynamic.forwardHeaders = merge(dynamic.forwardHeaders ?? ["accept"], headers);
}
/**
* `definePrefetch` files call `monoFetch.prefetch` / `monoFetchOdata.prefetch` on the SERVER:
* Nitro needs the same (exposed) mono config the browser gets, and has to bundle the packages
* whose folder-style deep imports (`devextreme/core/utils/deferred`) plain Node can't load.
*/
function registerPreFetchServer(nuxt, exposed) {
	const plugin = addTemplate({
		filename: "mono/prefetch-init.mjs",
		write: true,
		getContents: () => [
			"import { initMono } from \"@mono-lit/utility/runtime\"",
			"import config from \"#mono/config\"",
			"export default function monoPrefetchInit() { initMono(config) }"
		].join("\n")
	});
	nuxt.hook("nitro:config", (nitroConfig) => {
		nitroConfig.virtual ??= {};
		nitroConfig.virtual["#mono/config"] = () => `export default ${JSON.stringify(exposed)}`;
		nitroConfig.plugins ??= [];
		nitroConfig.plugins.push(plugin.dst);
		nitroConfig.alias = {
			...appPackageAliases(nuxt.options.rootDir, "@mono-lit/utility"),
			...nitroConfig.alias
		};
		nitroConfig.externals ??= {};
		nitroConfig.externals.inline = [
			...nitroConfig.externals.inline ?? [],
			"@mono-lit/utility",
			"@mono-lit/devextreme",
			"@mono-lit/data",
			"devextreme",
			plugin.dst
		];
	});
}
/**
* `<pkg>` and each of its `exports` subpaths, resolved to the copy THIS app links (its
* `node_modules/<pkg>`, symlinks followed): exact-path aliases that pin one instance. Empty when
* the app doesn't link it.
*/
function appPackageAliases(rootDir, pkg) {
	try {
		const dir = realpathSync(resolve(rootDir, "node_modules", pkg));
		const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
		const aliases = {};
		for (const [subpath, target] of Object.entries(manifest.exports ?? {})) {
			const entry = typeof target === "string" ? target : target?.import ?? target?.default;
			if (typeof entry !== "string" || subpath.includes("*")) continue;
			aliases[subpath === "." ? pkg : `${pkg}${subpath.slice(1)}`] = resolve(dir, entry);
		}
		return aliases;
	} catch {
		return {};
	}
}
/**
* Register every `.vue` under the given remote `dirs` as a Nuxt route, skipping
* files matching any `exclude` glob and never clobbering an existing host route.
*/
function registerRemotePages(dirs, exclude, label) {
	extendPages((pages) => {
		const existing = new Set(pages.map((p) => p.path));
		const added = [];
		for (const dir of dirs) {
			if (!existsSync(dir)) continue;
			for (const file of walkVue(dir)) {
				const rel = relative(dir, file).split(sep).join("/");
				if (exclude.some((pattern) => globMatch(pattern, rel))) continue;
				const routePath = toRoutePath(rel);
				if (existing.has(routePath)) continue;
				existing.add(routePath);
				pages.push({
					name: "remote-" + rel.replace(/\.vue$/, "").replace(/[^a-zA-Z0-9]+/g, "-"),
					path: routePath,
					file,
					meta: parsePageMeta(safeRead(file))
				});
				added.push(routePath);
			}
		}
		if (added.length) console.log(`[mono-nuxt] merged  remote route(s) [${label}]:`, added.join(", "));
	});
}
/**
* Give this app's own plugins priority over a Nuxt LAYER's, by name.
*
* Nuxt gives layouts and middleware that rule for free but not plugins, which it
* dedupes on absolute `src` — so a remote's `plugins/mono.ts` and its host's
* both survive, and both call `createMono()` with a different config. Dropping
* the layer's copy is the whole fix.
*
* Runs on `app:resolve`, the one point where `app.plugins` exists and is still
* mutable. A no-op when this app ships no plugins of its own.
*/
function dedupeLayerPlugins(nuxt, candidates, ownSrcDir) {
	if (!candidates.length) return;
	const ownKeys = ownEcosystemKeys(join(ownSrcDir, "plugins"));
	if (!ownKeys.size) return;
	const roots = candidates.map((c) => normalize(c.root).toLowerCase());
	const inLayer = (src) => {
		const file = normalize(src).toLowerCase();
		return roots.some((root) => file.startsWith(root + sep));
	};
	nuxt.hook("app:resolve", (app) => {
		const dropped = [];
		app.plugins = app.plugins.filter((plugin) => {
			const src = plugin?.src;
			if (!src || !inLayer(src)) return true;
			if (!ownKeys.has(ecosystemFileKey(src))) return true;
			dropped.push(relative(rootOf(candidates, src), src).split(sep).join("/"));
			return false;
		});
		if (dropped.length) console.log(`[mono-nuxt] shadowed federated plugin(s) with this app's own:`, dropped.join(", "));
	});
}
/** The layer root a file sits in, for a readable log line. */
function rootOf(candidates, file) {
	const lower = normalize(file).toLowerCase();
	return candidates.find((c) => lower.startsWith(normalize(c.root).toLowerCase() + sep))?.root ?? "";
}
/**
* Register every `.vue` under the given federated `layouts` dirs as a Nuxt
* layout, so a remote renders inside its host's shell.
*
* Done through the `app:templates` hook rather than kit's `addLayout` on
* purpose: `addLayout` routes the file through `addTemplate`, which COPIES it
* into `.nuxt/` — a snapshot that breaks HMR on the host's shell and any
* path-relative import inside it. Writing `app.layouts` directly is what Nuxt
* itself does for `<srcDir>/layouts`, and it points at the real file.
*
* The hook runs after Nuxt has resolved this app's own layouts, so the
* `layoutName in app.layouts` guard already gives own-file-wins; the
* `ownEcosystemKeys` check in front of it makes the same rule explicit and
* consistent with middleware/plugins.
*/
function registerRemoteLayouts(nuxt, dirs, exclude, ownSrcDir, label) {
	const own = ownEcosystemKeys(join(ownSrcDir, "layouts"));
	const found = [];
	for (const dir of dirs) for (const file of walkFiles(dir, [".vue"])) {
		const rel = relative(dir, file).split(sep).join("/");
		if (exclude.some((pattern) => globMatch(pattern, rel))) continue;
		if (own.has(ecosystemFileKey(file))) continue;
		found.push({
			name: layoutNameFor(dir, file),
			file
		});
	}
	if (!found.length) return;
	nuxt.hook("app:templates", (app) => {
		const added = [];
		for (const { name, file } of found) {
			if (name in app.layouts) continue;
			app.layouts[name] = {
				name,
				file
			};
			added.push(name);
		}
		if (added.length) console.log(`[mono-nuxt] merged  federated layout(s) [${label}]:`, added.join(", "));
	});
}
/**
* Register the top-level files of the given federated `middleware` dirs as Nuxt
* route middleware, honouring the `.global` suffix.
*
* TOP LEVEL ONLY, deliberately: Nuxt treats every file in `middleware/` as a
* middleware, but a federated app nests plain helper modules underneath —
* mono-nuxt-host keeps its guard dispatcher in `middleware/run-guards.ts` and
* the guards themselves in `middleware/guards/`, imported BY the global
* middleware rather than registered alongside it. Recursing would register four
* guards as four independent middlewares.
*
* `addRouteMiddleware` matches on `name`, so a name this app already defines is
* left alone (it warns rather than overwrites); the `ownEcosystemKeys` check
* skips it before that happens.
*/
function registerRemoteMiddleware(dirs, exclude, ownSrcDir, label) {
	const own = ownEcosystemKeys(join(ownSrcDir, "middleware"));
	const added = [];
	for (const dir of dirs) for (const file of topLevelFiles(dir, SCRIPT_EXTENSIONS)) {
		const rel = relative(dir, file).split(sep).join("/");
		if (exclude.some((pattern) => globMatch(pattern, rel))) continue;
		if (own.has(ecosystemFileKey(file))) continue;
		const { name, global } = middlewareNameFor(file);
		addRouteMiddleware({
			name,
			path: file,
			global
		});
		added.push(global ? `${name} (global)` : name);
	}
	if (added.length) console.log(`[mono-nuxt] merged  federated middleware [${label}]:`, added.join(", "));
}
/**
* Register the top-level files of the given federated `plugins` dirs as Nuxt
* plugins. `normalizePlugin` reads the `.client` / `.server` suffix off the
* path itself, so no `mode` is passed.
*
* `append: true` keeps discovery order — `addPlugin` unshifts by default, which
* would reverse a whole directory.
*
* This is the one destination where own-file-wins is load-bearing rather than
* belt-and-braces: `addPlugin` dedupes on the absolute `src`, which never
* matches across two checkouts. A remote shipping its own `plugins/mono.ts`
* (pointing `createMono` at ITS config instead of the host's) relies on this.
*/
function registerRemotePlugins(dirs, exclude, ownSrcDir, label) {
	const own = ownEcosystemKeys(join(ownSrcDir, "plugins"));
	const added = [];
	for (const dir of dirs) for (const file of topLevelFiles(dir, SCRIPT_EXTENSIONS)) {
		const rel = relative(dir, file).split(sep).join("/");
		if (exclude.some((pattern) => globMatch(pattern, rel))) continue;
		if (own.has(ecosystemFileKey(file))) continue;
		addPlugin({ src: file }, { append: true });
		added.push(rel);
	}
	if (added.length) console.log(`[mono-nuxt] merged  federated plugin(s) [${label}]:`, added.join(", "));
}
/** Recursively collect `.vue` files under a directory. */
function walkVue(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walkVue(full));
		else if (entry.name.endsWith(".vue")) out.push(full);
	}
	return out;
}
/** `budget/alokasi/index.vue` -> `/budget/alokasi`, `budget/[id].vue` -> `/budget/:id`. */
function toRoutePath(rel) {
	let p = rel.replace(/\.vue$/, "").replace(/\/index$/, "").replace(/\[([^\]]+)\]/g, ":$1");
	p = "/" + p;
	if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
	return p;
}
function safeRead(file) {
	try {
		return readFileSync(file, "utf-8");
	} catch {
		return "";
	}
}
/**
* Minimal glob matcher for a `/`-joined relative path. Supports `**` (any path
* segments), `*` (any chars within a segment) and `?` (single char). No
* dependency — enough for page-exclude patterns like `index.vue` (root only).
*/
function globMatch(pattern, input) {
	const re = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\0").replace(/\*/g, "[^/]*").replace(/ /g, ".*").replace(/\?/g, "[^/]");
	return new RegExp(`^${re}$`).test(input);
}

//#endregion
export { monoNuxtModule as default };