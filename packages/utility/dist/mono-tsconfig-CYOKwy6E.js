import { r as hostedAppRoots, u as resolveAppRoots } from "./app-roots-LpDrHF_J.js";
import { l as srcDirForType } from "./create-config-DdL3Fh6T.js";
import { f as stripCommentsSafe, n as extractConfig, s as monoAlias } from "./mono-alias-BU2B0tYL.js";
import fs from "node:fs";
import path from "node:path";
import { readTSConfig, writeTSConfig } from "pkg-types";

//#region src/composables/mono-tsconfig.ts
/** Folder (relative to an app root) that holds the generated tsconfig. */
const MONO_DIR = ".mono";
/** Reference to the generated tsconfig, as written into the root `extends`. */
const MONO_TSCONFIG_REF = `./${MONO_DIR}/tsconfig.json`;
/** Folder (relative to an app root) that holds the cloned remotes. */
const MONO_APPS_DIR = `${MONO_DIR}/apps`;
/**
* Turn an absolute path into a POSIX, tsconfig-friendly relative path from
* `fromDir`, always prefixed with `./` or `../` so TypeScript treats it as a
* path mapping rather than a bare module name.
*/
function toRelativePosix(fromDir, absTarget) {
	let rel = path.relative(fromDir, absTarget).split(path.sep).join("/");
	if (rel === "") rel = ".";
	if (!rel.startsWith(".")) rel = `./${rel}`;
	return rel;
}
/**
* Build the `compilerOptions.paths` map for `.mono/tsconfig.json` from the mono
* alias map.
*
* `monoAlias` returns absolute directory paths keyed WITHOUT a `/*` glob (e.g.
* `@mono-host` -> `<abs>/src`). tsconfig `paths` need the `/*` glob on both the
* key and the value, and the value must be relative to the `.mono/` folder that
* the file lives in. So `@mono-host` -> `{ "@mono-host/*": ["../src/*"] }`.
*
* All alias/type/srcDir rules are inherited from `monoAlias` — nothing is
* re-implemented here.
*/
function monoTsconfigPaths(opts) {
	const monoDir = path.resolve(opts.dirname, MONO_DIR);
	const alias = monoAlias(opts);
	const paths = {};
	for (const [key, absDir] of Object.entries(alias)) {
		const rel = toRelativePosix(monoDir, absDir);
		paths[`${key}/*`] = [`${rel}/*`];
	}
	return paths;
}
/** The object written to `<dirname>/.mono/tsconfig.json`. */
function buildMonoTsconfig(opts) {
	return { compilerOptions: { paths: monoTsconfigPaths(opts) } };
}
/** Normalise a tsconfig `extends` field (string | string[] | undefined) to an array. */
function extendsToArray(value) {
	if (!value) return [];
	return Array.isArray(value) ? [...value] : [value];
}
/**
* Point every cloned remote's `tsconfig.json` at the host's generated
* `.mono/tsconfig.json` (as `../../tsconfig.json`), and strip the inline alias
* keys that file now owns.
*
* WHY: a clone arrives with no usable `paths`. Its own `.mono/tsconfig.json` is
* gitignored, so it is absent from the archive `mono sync` downloads, and
* `sanitizeClonedTsconfig` then strips the dangling `.mono` `extends` from it.
* That matters beyond editor comfort: `@vue/compiler-sfc` resolves the type-only
* imports in `defineProps<ImportedType>()` through the NEAREST tsconfig's `paths`
* (`ts.findConfigFile` walks up from the SFC and stops at the clone's own
* tsconfig — it never reaches the host's). Vite's `resolve.alias` is invisible to
* it. So a remote whose SFCs do `defineProps<NodeWrapperProps>()` with
* `import type { NodeWrapperProps } from '@some-app/types'` breaks the host build
* with `Failed to resolve import source "@some-app/types"` unless the clone's
* tsconfig maps the alias.
*
* The host already has every mapping it needs — `.mono/tsconfig.json` covers each
* remote (`@flow-app/*` -> `./apps/flow-app/src/*`) and its `paths` are relative
* to `.mono/`, so they stay correct when inherited from a clone two levels down.
* Wiring it here means remotes need no committed workaround of their own.
*
* The ref goes LAST for the same reason as the root tsconfig: tsconfig replaces
* the whole `paths` object with the last config that defines it, so the generated
* map wins over anything else the clone extends. Idempotent.
*/
async function wireClonedApps(dirname, monoTsconfigPath, writtenKeys) {
	const wired = [];
	const roots = resolveAppRoots({
		dirname,
		appsDir: MONO_APPS_DIR,
		apps: extractConfig(dirname).apps,
		onMissingPath: "ignore"
	});
	for (const { name: appName, root: appDir } of roots.filter((r) => r.source === "clone")) {
		const appTsconfigPath = path.join(appDir, "tsconfig.json");
		if (!fs.existsSync(appTsconfigPath)) continue;
		const ref = toRelativePosix(appDir, monoTsconfigPath);
		try {
			const raw = fs.readFileSync(appTsconfigPath, "utf8");
			const app = await readTSConfig(appTsconfigPath);
			if (Object.keys(app).length === 0 && stripCommentsSafe(raw).replace(/\s+/g, "") !== "{}") continue;
			const before = extendsToArray(app.extends);
			const next = [...before.filter((r) => r !== ref), ref];
			let strippedPaths = false;
			const appPaths = app.compilerOptions?.paths;
			if (appPaths) {
				for (const key of writtenKeys) if (key in appPaths) {
					delete appPaths[key];
					strippedPaths = true;
				}
				if (Object.keys(appPaths).length === 0) delete app.compilerOptions.paths;
			}
			if (before.length === next.length && before.every((r, i) => r === next[i]) && !strippedPaths) continue;
			app.extends = next;
			await writeTSConfig(appTsconfigPath, app);
			wired.push(appName);
		} catch {}
	}
	return wired;
}
/**
* Generate `<dirname>/.mono/tsconfig.json` from the mono alias map and wire it
* into the root `tsconfig.json` via `extends`, stripping the now-redundant
* inline `@mono-*` paths. Idempotent: safe to run repeatedly.
*/
async function runMonoPrepare(opts) {
	const { dirname } = opts;
	const tsconfig = buildMonoTsconfig({ dirname });
	const writtenKeys = Object.keys(tsconfig.compilerOptions?.paths ?? {});
	const writtenPaths = tsconfig.compilerOptions?.paths ?? {};
	const monoDir = path.resolve(dirname, MONO_DIR);
	if (!fs.existsSync(monoDir)) fs.mkdirSync(monoDir, { recursive: true });
	const monoTsconfigPath = path.join(monoDir, "tsconfig.json");
	await writeTSConfig(monoTsconfigPath, tsconfig);
	const rootTsconfigPath = path.resolve(dirname, "tsconfig.json");
	if (!fs.existsSync(rootTsconfigPath)) throw new Error(`[@mono-lit/utility] mono prepare: no tsconfig.json found at ${rootTsconfigPath}`);
	const root = await readTSConfig(rootTsconfigPath);
	const outsideProject = pathsOutsideProject(dirname, writtenPaths);
	const rootDir = root.compilerOptions?.rootDir;
	if (rootDir && outsideProject.length) console.warn(`[mono] tsconfig.json sets rootDir "${rootDir}" but ${outsideProject.join(", ")} map outside the project (apps[].path siblings). Remove rootDir, or set it to the folder that contains every sibling (e.g. "../").`);
	const previousExtends = extendsToArray(root.extends);
	const addedExtends = !previousExtends.includes(MONO_TSCONFIG_REF);
	root.extends = [...previousExtends.filter((ref) => ref !== MONO_TSCONFIG_REF), MONO_TSCONFIG_REF];
	const removedKeys = [];
	const rootPaths = root.compilerOptions?.paths;
	if (rootPaths) {
		for (const key of writtenKeys) if (key in rootPaths) {
			delete rootPaths[key];
			removedKeys.push(key);
		}
		if (Object.keys(rootPaths).length === 0) delete root.compilerOptions.paths;
	}
	await writeTSConfig(rootTsconfigPath, root);
	const wiredApps = await wireClonedApps(dirname, monoTsconfigPath, writtenKeys);
	const hostedApps = adoptHostedApps(dirname);
	const unpreparedApps = unpreparedPathApps(dirname);
	if (unpreparedApps.length) console.warn(`[mono] ${unpreparedApps.join(", ")}: tsconfig.json extends ./.mono/tsconfig.json but the file is missing — run \`mono prepare\` in that app.`);
	return {
		monoTsconfigPath,
		rootTsconfigPath,
		writtenKeys,
		removedKeys,
		addedExtends,
		wiredApps,
		outsideProject,
		unpreparedApps,
		hostedApps
	};
}
/**
* Prepare every HOSTED (mini) app read in place through `apps[].path`, from the
* host's side — the mini has no `package.json`, so it can never run a
* `mono prepare` (or an install) of its own.
*
* Only a mini that names THIS host in its own `apps[]` (by name — typically a
* `url` entry — or by a `path` landing here) is prepared: the wiring is declared
* on both sides, never inferred. Any other hosted app is skipped with a warning
* that spells out the entry to add.
*
*  1. `<mini>/node_modules` becomes a link (a junction on Windows — no admin
*     rights needed) to the host's `node_modules`. A sibling outside the host
*     has no `node_modules` above it, so every bare import in its files —
*     `vue`, `@mono-lit/utility/*` — fails in Vite AND in jiti (the host's c12
*     loads the mini's `mono.config.ts`). One link fixes Vite, jiti, vue-tsc and
*     the editor together, and because the realpaths ARE the host's, there is
*     still exactly one copy of Vue. A real directory there is never touched.
*  2. `<mini>/.mono/tsconfig.json` extends the host's config (Nuxt host:
*     `.nuxt/tsconfig.app.json`, Vite host: `tsconfig.json`), and — when the
*     mini has none — `<mini>/tsconfig.json` extends that, so the editor
*     type-checks the mini against the host's aliases and generated
*     auto-import/route types.
*
* Unlike `wireClonedApps`' rule for full `path` apps, this DOES write into the
* sibling — but only files a mini gitignores (`node_modules`, `.mono/`, the
* generated `tsconfig.json`). Nothing it commits is ever edited. A clone under `.mono/apps` needs none
* of this: Node already walks up to the host's `node_modules`.
*/
function adoptHostedApps(dirname) {
	const host = extractConfig(dirname);
	const roots = resolveAppRoots({
		dirname,
		appsDir: MONO_APPS_DIR,
		apps: host.apps,
		onMissingPath: "ignore",
		listClones: false
	});
	const hostModules = path.join(dirname, "node_modules");
	const base = host.type === "nuxt" ? path.join(dirname, ".nuxt", "tsconfig.app.json") : path.join(dirname, "tsconfig.json");
	const prepared = [];
	for (const { name, type, root } of hostedAppRoots(roots)) {
		if (!namesHost(root, dirname, host.name)) {
			const hint = `{ name: '${host.name ?? path.basename(dirname)}', url: '<the host repo>', type: '${host.type}' }`;
			console.warn(`[mono] ${name}: not prepared — its mono.config.ts does not name this host. Add ${hint} to its apps[].`);
			continue;
		}
		const link = linkHostModules(name, root, hostModules);
		const miniMono = path.join(root, MONO_DIR);
		if (!fs.existsSync(miniMono)) fs.mkdirSync(miniMono, { recursive: true });
		const tsconfigPath = path.join(miniMono, "tsconfig.json");
		const rel = (abs) => toRelativePosix(miniMono, abs);
		const miniSrc = srcDirForType(type ?? host.type);
		const include = host.type === "nuxt" ? [rel(path.join(dirname, ".nuxt", "nuxt.d.ts"))] : [`${rel(dirname)}/*.d.ts`, `${rel(path.join(dirname, srcDirForType(host.type)))}/**/*.d.ts`];
		const json = {
			extends: rel(base),
			compilerOptions: { rootDir: rel(commonDir(dirname, root)) },
			include: [
				`../${miniSrc}/**/*`,
				"../mono.config.ts",
				"../*.d.ts",
				...include
			],
			exclude: ["../node_modules", `${rel(hostModules)}`]
		};
		const text = `${JSON.stringify(json, null, 2)}\n`;
		if (!fs.existsSync(tsconfigPath) || fs.readFileSync(tsconfigPath, "utf8") !== text) fs.writeFileSync(tsconfigPath, text);
		const entryPath = path.join(root, "tsconfig.json");
		if (!fs.existsSync(entryPath)) fs.writeFileSync(entryPath, `${JSON.stringify({ extends: MONO_TSCONFIG_REF }, null, 2)}\n`);
		prepared.push({
			name,
			link,
			tsconfig: tsconfigPath
		});
	}
	return prepared;
}
/** Point `<root>/node_modules` at the host's. Never replaces a real directory. */
function linkHostModules(name, root, hostModules) {
	if (!fs.existsSync(hostModules)) {
		console.warn(`[mono] ${name}: the host has no node_modules yet — install the host first.`);
		return "skipped";
	}
	const linkPath = path.join(root, "node_modules");
	let stat;
	try {
		stat = fs.lstatSync(linkPath);
	} catch {
		stat = void 0;
	}
	if (stat) {
		if (!stat.isSymbolicLink()) {
			console.warn(`[mono] ${name}: ${linkPath} is a real directory — a hosted app uses the host's node_modules; delete it to let mono link them.`);
			return "skipped";
		}
		let current = "";
		try {
			current = fs.realpathSync(linkPath);
		} catch {}
		if (current && samePath(current, fs.realpathSync(hostModules))) return "kept";
		fs.unlinkSync(linkPath);
	}
	fs.symlinkSync(hostModules, linkPath, process.platform === "win32" ? "junction" : "dir");
	return "created";
}
/**
* Does the app at `root` name this host in its `apps[]`? By the host's `name` (a
* `url` entry, the usual way), or by a `path` that lands on `hostDir`. Read
* statically, like every other `apps[]` read before the config can execute.
*/
function namesHost(root, hostDir, hostName) {
	return extractConfig(root).apps.some((app) => hostName !== null && app.name === hostName || typeof app.path === "string" && samePath(path.resolve(root, app.path), hostDir));
}
function samePath(a, b) {
	const norm = (p) => {
		const r = path.resolve(p);
		return process.platform === "win32" ? r.toLowerCase() : r;
	};
	return norm(a) === norm(b);
}
/** Deepest directory containing both `a` and `b`. */
function commonDir(a, b) {
	const pa = path.resolve(a).split(path.sep);
	const pb = path.resolve(b).split(path.sep);
	const eq = (x, y) => process.platform === "win32" ? x.toLowerCase() === y.toLowerCase() : x === y;
	let i = 0;
	while (i < pa.length && i < pb.length && eq(pa[i], pb[i])) i++;
	return pa.slice(0, i).join(path.sep) || path.sep;
}
/** Written alias keys whose target directory is not under `dirname`. */
function pathsOutsideProject(dirname, paths) {
	const monoDir = path.resolve(dirname, MONO_DIR);
	const outside = [];
	for (const [key, targets] of Object.entries(paths)) for (const target of targets) {
		const abs = path.resolve(monoDir, target.replace(/\/\*$/, ""));
		const rel = path.relative(dirname, abs);
		if (rel.startsWith("..") || path.isAbsolute(rel)) {
			outside.push(key);
			break;
		}
	}
	return outside;
}
/** `path` apps whose tsconfig extends a `.mono/tsconfig.json` that does not exist. */
function unpreparedPathApps(dirname) {
	const names = [];
	const roots = resolveAppRoots({
		dirname,
		appsDir: MONO_APPS_DIR,
		apps: extractConfig(dirname).apps,
		onMissingPath: "ignore",
		listClones: false
	});
	for (const { name, root } of roots) {
		const tsconfigPath = path.join(root, "tsconfig.json");
		if (!fs.existsSync(tsconfigPath)) continue;
		let refs = [];
		try {
			refs = extendsToArray(JSON.parse(stripCommentsSafe(fs.readFileSync(tsconfigPath, "utf8")))?.extends);
		} catch {
			continue;
		}
		const ref = refs.find((r) => r.replace(/\\/g, "/").endsWith(`${MONO_DIR}/tsconfig.json`));
		if (ref && !fs.existsSync(path.resolve(root, ref))) names.push(name);
	}
	return names;
}

//#endregion
export { buildMonoTsconfig as a, adoptHostedApps as i, MONO_DIR as n, monoTsconfigPaths as o, MONO_TSCONFIG_REF as r, runMonoPrepare as s, MONO_APPS_DIR as t };