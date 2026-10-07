import fs from "node:fs";
import path from "node:path";

//#region src/composables/app-roots.ts
/**
* Where each federated app's source actually lives.
*
* Everything that consumes a remote — `monoAlias`, `monoMissingApps`,
* `monoEcosystem`, `mono prepare`, `mono sync`, `mono env`, the vite transform
* gates, the Nuxt module — used to answer that question by listing
* `.mono/apps/`. That is still the answer for a synced clone, but
* `MonoAppConfig.path` names a directory the app is read from DIRECTLY (a
* sibling folder in a mono-lith, a checkout beside this one), and a directory
* listing cannot see one. So the question is asked here, once, and every
* consumer takes the answer.
*
* Two properties this file has to preserve:
*
*  - **`path` is authoritative in every command.** Dev, build, prepare, sync,
*    env and the Nuxt module all read the same directory. There is no
*    "build reads the clone instead" mode any more: a bundle built from a lith
*    IS built from its siblings, and that is the point.
*  - **Nothing here is a delete target.** `MONO_APPS_DIR` stays the single
*    constant `mono sync` prunes inside (`bin/mono-git.mjs`). A resolved root is
*    only ever READ. The very first `path` option was removed precisely because
*    it fed the clone destination, and therefore the prune root, with a
*    user-supplied directory.
*/
/** Apps already warned about, so a repeated config load stays quiet. */
const warnedPaths = /* @__PURE__ */ new Set();
/**
* Resolve every federated app to the directory it is read from.
*
* Config-declared `path` apps (when the directory exists) UNIONed with the
* `.mono/apps/` listing. A `path` root SHADOWS a clone of the same name — the
* stale clone is left on disk, simply not read — and a `path` that does not
* exist falls back to the clone when the entry has a `url` to sync from.
*/
function resolveAppRoots(opts) {
	const { dirname, appsDir = "./.mono/apps", apps = [], listClones = true } = opts;
	const onMissingPath = opts.onMissingPath ?? (opts.warnMissingPath === false ? "ignore" : "report");
	const appsRoot = path.resolve(dirname, appsDir);
	const roots = [];
	const linked = /* @__PURE__ */ new Set();
	for (const app of apps) {
		const name = app?.name;
		const declared = typeof app?.path === "string" ? app.path.trim() : "";
		if (!name || !declared) continue;
		const root = path.isAbsolute(declared) ? declared : path.resolve(dirname, declared);
		if (!isDirectory(root)) {
			if (onMissingPath === "ignore") continue;
			if (hasUrl(app)) {
				warnMissingAppPath(name, declared, root);
				continue;
			}
			throw new Error(missingPathMessage(name, declared, root));
		}
		linked.add(name);
		roots.push({
			name,
			type: app.type,
			root,
			source: "path"
		});
	}
	if (!listClones) return roots;
	const typeOf = /* @__PURE__ */ new Map();
	for (const app of apps) if (app?.name) typeOf.set(app.name, app.type);
	let entries;
	try {
		entries = fs.readdirSync(appsRoot, { withFileTypes: true });
	} catch {
		return roots;
	}
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		if (linked.has(entry.name)) continue;
		roots.push({
			name: entry.name,
			type: typeOf.get(entry.name),
			root: path.join(appsRoot, entry.name),
			source: "clone"
		});
	}
	return roots;
}
/** Just the absolute roots — for `server.fs.allow` and the transform gates. */
function appRootDirs(roots) {
	return roots.map((r) => r.root);
}
/** The `path`-resolved subset. Used to tell the developer what is read in place. */
function pathAppRoots(roots) {
	return roots.filter((r) => r.source === "path");
}
/** @deprecated renamed {@link pathAppRoots}. */
const linkedAppRoots = pathAppRoots;
/** `true` when an app entry can be synced from GitHub. */
function hasUrl(app) {
	return typeof app?.url === "string" && app.url.trim().length > 0;
}
/** The error every entry point raises for a `path` with no directory and no `url`. */
function missingPathMessage(name, declared, resolved) {
	return `[mono] ${name}: path '${declared}' does not exist and no url is declared, so there is nothing to fall back to.\n[mono]   looked in ${resolved}`;
}
/** Recognise {@link missingPathMessage} from a caught error. */
function isMissingPathError(e) {
	return e instanceof Error && e.message.includes("does not exist and no url is declared");
}
function isDirectory(dir) {
	try {
		return fs.statSync(dir).isDirectory();
	} catch {
		return false;
	}
}
function warnMissingAppPath(name, declared, resolved) {
	const key = `${name} ${resolved}`;
	if (warnedPaths.has(key)) return;
	warnedPaths.add(key);
	console.warn(`[mono] ${name}: path '${declared}' does not exist — using the synced clone instead.\n[mono]   looked in ${resolved}`);
}
/** Test seam: forget which missing paths have been reported. */
function resetAppPathWarnings() {
	warnedPaths.clear();
}

//#endregion
export { missingPathMessage as a, resolveAppRoots as c, linkedAppRoots as i, hasUrl as n, pathAppRoots as o, isMissingPathError as r, resetAppPathWarnings as s, appRootDirs as t };