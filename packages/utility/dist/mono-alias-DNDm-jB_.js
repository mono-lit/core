import { c as resolveAppRoots } from "./app-roots-CvJnmXcs.js";
import { l as srcDirForType } from "./create-config-DdL3Fh6T.js";
import fs from "node:fs";
import path from "node:path";

//#region src/composables/mono-alias.ts
/**
* Strip `//` and `/* *​/` comments without touching string contents, so a
* commented-out `name:` never shadows the real one.
*
* Ported verbatim from `bin/mono-clone.mjs`.
*/
function stripCommentsSafe(code) {
	let out = "";
	let quote = null;
	let escaped = false;
	let inLineComment = false;
	let inBlockComment = false;
	for (let i = 0; i < code.length; i++) {
		const ch = code[i];
		const next = code[i + 1];
		if (inLineComment) {
			if (ch === "\n") {
				inLineComment = false;
				out += ch;
			}
			continue;
		}
		if (inBlockComment) {
			if (ch === "*" && next === "/") {
				inBlockComment = false;
				i++;
			}
			continue;
		}
		if (quote) {
			out += ch;
			if (escaped) {
				escaped = false;
				continue;
			}
			if (ch === "\\") {
				escaped = true;
				continue;
			}
			if (ch === quote) quote = null;
			continue;
		}
		if (ch === "\"" || ch === "'" || ch === "`") {
			quote = ch;
			out += ch;
			continue;
		}
		if (ch === "/" && next === "/") {
			inLineComment = true;
			i++;
			continue;
		}
		if (ch === "/" && next === "*") {
			inBlockComment = true;
			i++;
			continue;
		}
		out += ch;
	}
	return out;
}
/**
* Absolute path of the mono config file in `dir`, or `null`. The same lookup
* order every static reader here uses.
*/
function monoConfigFileFor(dir) {
	return findMonoConfigFile(dir);
}
function findMonoConfigFile(dir) {
	for (const name of [
		"mono.config.ts",
		"mono.config.js",
		"mono.config.mjs",
		"mono.config.cjs"
	]) {
		const file = path.resolve(dir, name);
		if (fs.existsSync(file)) return file;
	}
	return null;
}
/**
* Read the top-level `name: '...'` literal from mono.config.ts text without
* executing it. The first lowercase `name:` string literal is the config name —
* `apps[].name` entries appear later in the file.
*/
function extractConfigName(dir) {
	const file = findMonoConfigFile(dir);
	if (!file) return null;
	const clean = stripCommentsSafe(fs.readFileSync(file, "utf8"));
	return /\bname\s*:\s*(['"`])([^'"`]+)\1/.exec(clean)?.[2] ?? null;
}
/**
* Read the top-level `template: 'host' | 'remote'` literal from mono.config.ts
* text without executing it — the same trick `extractConfigName` uses, and for
* the same reason: `monoNuxtLayers()` runs while `nuxt.config` is being loaded,
* where the config's `extends` chain (which imports the host's own config
* through an alias that does not exist yet) cannot be resolved.
*
* Only the text BEFORE `apps:` is searched, so a per-app key can never be
* mistaken for the top-level one. `null` when absent — which, per `MonoTemplate`,
* reads as `'remote'`.
*/
function extractTemplate(dir) {
	const file = findMonoConfigFile(dir);
	if (!file) return null;
	const clean = stripCommentsSafe(fs.readFileSync(file, "utf8"));
	const head = clean.slice(0, /\bapps\s*:/.exec(clean)?.index ?? clean.length);
	return /\btemplate\s*:\s*(['"`])(host|remote)\1/.exec(head)?.[2] ?? null;
}
/**
* Index of the bracket that closes the one opened at `startIndex`, ignoring
* brackets inside strings. Ported from `bin/mono-clone.mjs`.
*/
function findMatchingBracket(code, startIndex, openChar, closeChar) {
	let depth = 0;
	let quote = null;
	let escaped = false;
	for (let i = startIndex; i < code.length; i++) {
		const ch = code[i];
		if (quote) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (ch === "\\") {
				escaped = true;
				continue;
			}
			if (ch === quote) quote = null;
			continue;
		}
		if (ch === "\"" || ch === "'" || ch === "`") {
			quote = ch;
			continue;
		}
		if (ch === openChar) depth++;
		if (ch === closeChar) {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}
/** Slice the `apps: [...]` array literal text out of comment-stripped config code. */
function extractAppsArrayText(clean) {
	const appsMatch = /\bapps\s*:/.exec(clean);
	if (!appsMatch) return null;
	const arrayStart = clean.indexOf("[", appsMatch.index + appsMatch[0].length);
	if (arrayStart === -1) return null;
	const arrayEnd = findMatchingBracket(clean, arrayStart, "[", "]");
	if (arrayEnd === -1) return null;
	return clean.slice(arrayStart, arrayEnd + 1);
}
/**
* Read a mono.config.ts's own `name`/`type` and its `apps[]` (name + type)
* WITHOUT executing it — `monoAlias` runs before the config is loaded, so it
* can only parse the source text. The apps array is eval'd in isolation (same
* approach as `bin/mono-clone.mjs`), so keep apps static (no variables/fns).
*
* The top-level `type` is read from the text BEFORE `apps:` so it can't be
* shadowed by an `apps[].type` (or a `fetching.api.*.type`). Declare the
* config's own `type` above `apps`.
*/
function extractConfig(dir) {
	const file = findMonoConfigFile(dir);
	if (!file) return {
		name: null,
		type: "vue",
		apps: []
	};
	const clean = stripCommentsSafe(fs.readFileSync(file, "utf8"));
	const name = /\bname\s*:\s*(['"`])([^'"`]+)\1/.exec(clean)?.[2] ?? null;
	const appsIndex = /\bapps\s*:/.exec(clean)?.index ?? clean.length;
	const head = clean.slice(0, appsIndex);
	const type = /\btype\s*:\s*(['"`])(vue|nuxt)\1/.exec(head)?.[2] ?? "vue";
	let apps = [];
	try {
		const text = extractAppsArrayText(clean);
		if (text) {
			const parsed = Function(`"use strict"; return (${text});`)();
			if (Array.isArray(parsed)) apps = parsed;
		}
	} catch {
		apps = [];
	}
	return {
		name,
		type,
		apps
	};
}
/**
* Statically read the top-level `skill: { url, envToken? }` literal of a
* mono.config.ts WITHOUT executing it — the `mono skills` CLI runs in a bare
* checkout where the config's `extends` imports (other apps' aliases) may not be
* resolvable, so it can only parse the source text, exactly like `extractConfig`.
*
* Read from THIS file only: `skill` is never inherited through `extends` (see
* `MonoConfig.skill`). The object literal is eval'd in isolation, so keep it
* static — no variables, no template expressions.
*
* `null` when the key is absent (the feature is off). THROWS when the key is
* present but is not a static object literal with a string `url` — a present
* but broken `skill` must surface as an error, not silently read as "off".
*/
function extractSkill(dir) {
	const file = findMonoConfigFile(dir);
	if (!file) return null;
	const clean = stripCommentsSafe(fs.readFileSync(file, "utf8"));
	const keyMatch = /\bskill\s*:\s*\{/.exec(clean);
	if (!keyMatch) return null;
	const objStart = keyMatch.index + keyMatch[0].length - 1;
	const objEnd = findMatchingBracket(clean, objStart, "{", "}");
	if (objEnd === -1) throw new Error(`mono.config.ts: unterminated \`skill: {\` literal in ${file}`);
	let parsed;
	try {
		parsed = Function(`"use strict"; return (${clean.slice(objStart, objEnd + 1)});`)();
	} catch (e) {
		throw new Error(`mono.config.ts: \`skill\` must be a static object literal ({ url, envToken? }) — ${e.message}`);
	}
	const obj = parsed;
	if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("mono.config.ts: `skill` must be an object literal ({ url, envToken? })");
	if (typeof obj.url !== "string" || !obj.url.trim()) throw new Error("mono.config.ts: `skill.url` must be a non-empty string literal");
	if (obj.envToken != null && (typeof obj.envToken !== "string" || !obj.envToken.trim())) throw new Error("mono.config.ts: `skill.envToken` must be a non-empty string (the env var NAME)");
	return {
		url: obj.url.trim(),
		...typeof obj.envToken === "string" ? { envToken: obj.envToken.trim() } : {}
	};
}
/**
* Every `apps[]` entry must say where it comes from: a `url` (`mono sync`
* clones it), a `path` (read in place), or both (`path` wins, `url` is the
* fallback when the directory is absent). An entry with neither is a config
* error, reported here by name rather than as a mysterious missing alias later.
*
* Run on the ROOT config only — a sibling's config is that sibling's business
* and is validated when IT runs.
*/
function assertAppSources(apps, file) {
	for (const app of apps) {
		const name = typeof app?.name === "string" && app.name ? app.name : JSON.stringify(app);
		const url = typeof app?.url === "string" && app.url.trim();
		const declaredPath = app?.path;
		if (declaredPath != null && (typeof declaredPath !== "string" || !declaredPath.trim())) throw new Error(`[mono] mono.config.ts (${file}): app '${name}' has a \`path\` that is not a non-empty string`);
		if (!url && !(typeof declaredPath === "string" && declaredPath.trim())) throw new Error(`[mono] mono.config.ts (${file}): app '${name}' declares neither url nor path — add \`url\` (synced by mono sync) or \`path\` (read in place).`);
	}
}
/**
* The root config's apps, plus ONE level of the apps each of those declares by
* `path` — resolved against THAT app's directory, not ours.
*
* In a mono-lith every sibling carries its own `mono.config.ts`, and a
* remote's config can name a third sibling this root never listed. Its
* `extends` chain then imports `@<third>-root/mono.config`, which only
* resolves if that app has an alias here. So "present" and "aliased" are
* decided by this one walk, and `monoAlias` / `monoMissingApps` both take its
* answer.
*
* One level, never recursive: a host and its remote list each other, and the
* cycle must not loop. A sibling's own `.mono/apps` is never listed
* (`listClones: false`) — its clones are its standalone-dev business — and a
* sibling's missing `path` is skipped silently (`onMissingPath: 'ignore'`):
* that sibling reports it when it runs.
*/
function resolveFederatedRoots(opts) {
	const { dirname, appsDir = "./.mono/apps", onMissingPath = "report" } = opts;
	const own = extractConfig(dirname);
	const roots = resolveAppRoots({
		dirname,
		appsDir,
		apps: own.apps,
		onMissingPath
	});
	const seen = new Set(roots.map((r) => r.name));
	if (own.name) seen.add(own.name);
	for (const root of [...roots]) {
		const declared = extractConfig(root.root).apps.filter((a) => a?.name && typeof a.path === "string" && a.path.trim() && !seen.has(a.name));
		if (!declared.length) continue;
		for (const found of resolveAppRoots({
			dirname: root.root,
			apps: declared,
			listClones: false,
			onMissingPath: "ignore"
		})) {
			if (seen.has(found.name)) continue;
			seen.add(found.name);
			roots.push({
				...found,
				via: root.name
			});
		}
	}
	return roots;
}
/**
* Build the mono alias map for both Vite's `resolve.alias` and the jiti alias
* that `getMonoConfig` needs to parse `mono.config.ts`.
*
* The source subdir of each app is derived from its `type` (`vue` -> `src`,
* `nuxt` -> `app`): the own type from the config's top-level `type`, each
* remote's from its `apps[].type`. Unknown types fall back to `srcDir`.
*
* Convention (keyed off app names; `<src>` = `srcDirForType(type)`):
* - `@<own-name>`        -> `<dirname>/<src>`
* - `@<own-name>-root`   -> `<dirname>`
* - `@<remote>`          -> `<dirname>/.mono/apps/<remote>/<src>`
* - `@<remote>-root`     -> `<dirname>/.mono/apps/<remote>`
* - `@mono-apps`              -> `<dirname>/.mono/apps`
*
* Name/type are read from `mono.config.ts` (or passed via `name`/`ownType`/
* `appTypes`). Remotes come from {@link resolveFederatedRoots}: the
* `.mono/apps/` listing, plus every app whose `apps[].path` names a directory
* — in which case `@<remote>` resolves THERE, in every command — plus the
* `path` apps those apps declare themselves. Returns absolute paths.
*/
function monoAlias(opts) {
	const { dirname, appsDir = "./.mono/apps", srcDir = "src", rootSuffix = "-root" } = opts;
	const appsRoot = path.resolve(dirname, appsDir);
	const parsed = extractConfig(dirname);
	const own = opts.name ?? parsed.name;
	if (!own) throw new Error("[@mono-lit/utility] monoAlias: could not read `name` from mono.config.ts. Pass { name } explicitly, or ensure name is a top-level string literal.");
	const typeMap = {};
	for (const app of parsed.apps) if (app?.name && app?.type) typeMap[app.name] = app.type;
	Object.assign(typeMap, opts.appTypes ?? {});
	const srcFor = (name) => {
		const t = typeMap[name];
		return t ? srcDirForType(t) : srcDir;
	};
	const ownType = opts.ownType ?? parsed.type;
	const ownSrc = ownType ? srcDirForType(ownType) : srcDir;
	const alias = {
		"@mono-apps": appsRoot,
		[`@${own}`]: path.resolve(dirname, ownSrc),
		[`@${own}${rootSuffix}`]: path.resolve(dirname, ".")
	};
	for (const { name, root, type } of resolveFederatedRoots({
		dirname,
		appsDir
	})) {
		if (type && !typeMap[name]) typeMap[name] = type;
		if (name === own) continue;
		alias[`@${name}`] = path.resolve(root, srcFor(name));
		alias[`@${name}${rootSuffix}`] = root;
	}
	return alias;
}
/** `from '@x/y'` / `import('@x')` — the alias specifiers a config file imports. */
const IMPORT_SPECIFIER_RE = /(?:\bfrom|\bimport)\s*\(?\s*['"]@([A-Za-z0-9_.-]+)(?:\/[^'"]*)?['"]/g;
/**
* Apps that are federated somewhere in the chain but aren't on disk.
*
* A cloned app never carries its own `.mono/` (gitignored, so it's absent from the
* archive `mono sync` downloads), so a host that federates apps of its own arrives
* with `import … from '@some-app-root/mono.config'` and nothing to resolve it
* against. `monoAlias` keys off the `.mono/apps/` DIRECTORY LISTING, so there is no
* key and jiti falls through to bare-package resolution — `Cannot find module`, and
* the config never loads. Finding those names first is what lets
* {@link monoStubAliases} neutralise them.
*
* Static only — {@link extractConfig} text-parses each config without executing it,
* which is the sole option: this runs BEFORE any config can be loaded.
*
* Two sources, union'd:
*  - names in any reachable `apps[]` with no directory (carries `envToken`)
*  - `@<name>-root/…` import specifiers with no alias key — covers a config that
*    imports an app it never declared in `apps[]`
*
* Only the `-root` suffix form is scanned for the second source: `@scope/pkg` npm
* imports are syntactically identical to `@app/file`, and mistaking `@vueuse/core`
* for a mono app would stub a real dependency out of the build.
*/
function monoMissingApps(opts) {
	const { dirname, appsDir = "./.mono/apps", rootSuffix = "-root" } = opts;
	const root = extractConfig(dirname);
	const rootFor = /* @__PURE__ */ new Map();
	for (const app of resolveFederatedRoots({
		dirname,
		appsDir
	})) rootFor.set(app.name, app.root);
	const present = new Set(rootFor.keys());
	const own = root.name;
	const missing = /* @__PURE__ */ new Map();
	const consider = (name, via, envToken) => {
		if (typeof name !== "string" || !name) return;
		if (name === own || present.has(name) || missing.has(name)) return;
		missing.set(name, {
			name,
			via,
			...typeof envToken === "string" && envToken ? { envToken } : {}
		});
	};
	const sources = [{
		dir: dirname,
		via: own ?? "<root>",
		config: root
	}];
	for (const [name, dir] of rootFor) sources.push({
		dir,
		via: name,
		config: extractConfig(dir)
	});
	for (const { dir, via, config } of sources) {
		for (const app of config.apps) consider(app?.name, via, app?.envToken);
		for (const name of importedAppAliases(dir, rootSuffix)) consider(name, via);
	}
	return [...missing.values()];
}
/** `@<name>-root` specifiers imported by a config, as bare `<name>`s. */
function importedAppAliases(dir, rootSuffix) {
	const file = findMonoConfigFile(dir);
	if (!file) return [];
	const clean = stripCommentsSafe(fs.readFileSync(file, "utf8"));
	const names = [];
	for (const match of clean.matchAll(IMPORT_SPECIFIER_RE)) {
		const specifier = match[1];
		if (!specifier.endsWith(rootSuffix) || specifier === rootSuffix) continue;
		names.push(specifier.slice(0, -rootSuffix.length));
	}
	return names;
}
/** Config filenames an `extends` import can name — each needs its own exact key. */
const STUB_SPECIFIERS = [
	"/mono.config",
	"/mono.config.ts",
	"/mono.config.js",
	"/mono.config.mjs"
];
/** Written once into `.mono/`; `.mono/` is generated and gitignored already. */
const STUB_FILENAME = "empty-mono-config.mjs";
const STUB_SOURCE = `// Generated by @mono-lit/utility — do not edit, do not commit (.mono/ is gitignored).
//
// Stands in for the \`mono.config\` of a federated app that isn't synced into
// .mono/apps/. Importing it makes the extends chain resolve; merging it
// contributes nothing. See \`monoStubAliases\` in @mono-lit/utility.
export default { apps: [], extends: [] }
`;
/**
* Alias entries that let a config chain load with apps missing from `.mono/apps/`.
*
* Each unsynced app gets EXACT keys for its config specifier only —
* `@<name>-root/mono.config` (+ `.ts`/`.js`/`.mjs`, and the `@<name>` form) — all
* pointing at one generated module that exports `{ apps: [], extends: [] }`. The
* import resolves, the layer merges to nothing, the build starts.
*
* Deliberately NOT the bare `@<name>` / `@<name>-root` prefixes: app code that
* imports a missing app (`@some-app/components/Foo.vue`) must still fail loudly. A
* page that can't exist is better than a page that silently renders blank.
*
* Exact keys work because alias matching (pathe's `resolveAlias`, used by jiti;
* the same rule in Vite) treats a key with no trailing segment as a full match, and
* sorts keys with more slashes first — so `@x-root/mono.config` is always tried
* before `@x-root`. For a missing app that prefix key doesn't exist anyway.
*
* Merge into BOTH alias maps: jiti's (so `getMonoConfig` can load) and Vite's (the
* browser graph resolves the same chain via `import monoConfig from '../mono.config'`
* in an app's `main.ts` — stub only jiti and the dev server starts, then dies on
* first page load).
*/
function monoStubAliases(opts) {
	const { dirname, appsDir = "./.mono/apps", rootSuffix = "-root" } = opts;
	const missing = opts.missing ?? monoMissingApps(opts);
	if (!missing.length) return {
		alias: {},
		missing,
		stubFile: null
	};
	const monoDir = path.resolve(dirname, appsDir, "..");
	const stubFile = path.join(monoDir, STUB_FILENAME);
	if (!fs.existsSync(stubFile)) {
		fs.mkdirSync(monoDir, { recursive: true });
		fs.writeFileSync(stubFile, STUB_SOURCE);
	}
	const alias = {};
	for (const { name } of missing) for (const base of [`@${name}`, `@${name}${rootSuffix}`]) for (const specifier of STUB_SPECIFIERS) alias[base + specifier] = stubFile;
	return {
		alias,
		missing,
		stubFile
	};
}
/**
* The warning for stubbed apps — names them, says what was lost, and gives the
* command that fixes it. `envToken` is the actionable part: a private repo fails to
* sync silently until someone knows which variable to set.
*/
function formatMissingApps(missing) {
	const lines = missing.map(({ name, via, envToken }) => {
		return `  • ${name}   (required by ${via})${envToken ? `   envToken: ${envToken}` : ""}`;
	});
	return [
		`[@mono-lit/utility] ${missing.length} federated app(s) are NOT synced into .mono/apps/:`,
		...lines,
		"Their `mono.config` imports were stubbed with an empty config so the build could start.",
		"Pages, components, composables and stores from them are NOT available.",
		"Fix: run `mono sync && mono prepare`, declare them in this app’s own `apps[]`,",
		"or point at a local checkout with `apps[].path`.",
		"If a repo is private, set its envToken in .env."
	].join("\n");
}

//#endregion
export { extractTemplate as a, monoConfigFileFor as c, resolveFederatedRoots as d, stripCommentsSafe as f, extractSkill as i, monoMissingApps as l, extractConfig as n, formatMissingApps as o, extractConfigName as r, monoAlias as s, assertAppSources as t, monoStubAliases as u };