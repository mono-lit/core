import { c as resolveAppRoots } from "./app-roots-CvJnmXcs.js";
import { f as stripCommentsSafe, n as extractConfig, s as monoAlias } from "./mono-alias-DNDm-jB_.js";
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
		unpreparedApps
	};
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
export { monoTsconfigPaths as a, buildMonoTsconfig as i, MONO_DIR as n, runMonoPrepare as o, MONO_TSCONFIG_REF as r, MONO_APPS_DIR as t };