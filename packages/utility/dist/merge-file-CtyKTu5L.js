import { c as resolveAppRoots } from "./app-roots-CvJnmXcs.js";
import { l as srcDirForType } from "./create-config-DdL3Fh6T.js";
import fs from "node:fs";
import path from "node:path";

//#region src/composables/merge-file.ts
function toArray(value) {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
}
function uniq(value) {
	return [...new Set(value)];
}
function resolveDirValue({ dir, sub }) {
	const dirs = toArray(dir);
	if (!dirs.length && sub) return [path.join("src", sub)];
	if (!sub) return dirs;
	return dirs.map((d) => path.join(d, sub));
}
/** `.\Foo\bar/` -> `Foo/bar`, so policy and candidate compare on equal terms. */
function normalizeSub(value) {
	return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
}
/**
* Does `sub` fall inside an `ecosystems` allowlist?
*
* Matching is **segment-wise**, not `startsWith`: `'composables'` admits
* `'composables/shared'` (the shape hosts actually pass), while `'compos'`
* admits nothing and `'composables/shared'` admits only itself.
*
* `undefined` means no policy was declared, so everything is allowed; an empty
* list is an explicit "nothing".
*/
function ecosystemSubAllowed(sub, allow) {
	if (!allow) return true;
	if (!allow.length) return false;
	const target = normalizeSub(sub);
	return allow.some((entry) => {
		const allowed = normalizeSub(entry);
		return target === allowed || target.startsWith(`${allowed}/`);
	});
}
/**
* Reduce a candidate relative dir to the sub an `ecosystems` list is written
* in: `app/pages` and `src/pages` both mean `pages`. Lets the policy apply in
* {@link mergeEcosystem}, which — unlike {@link monoEcosystem} — only ever sees
* resolved directories, never the sub names they came from.
*/
function candidateSub(rel) {
	const normalized = normalizeSub(rel);
	const [head, ...rest] = normalized.split("/");
	return rest.length && (head === "src" || head === "app") ? rest.join("/") : normalized;
}
function matches(value, matcher) {
	if (typeof matcher === "string") return value.includes(matcher);
	if (matcher instanceof RegExp) return matcher.test(value);
	return matcher(value);
}
function passDirFilter({ dir, dirIncludes, dirExcludes }) {
	const normalized = dir.replaceAll("\\", "/");
	if (dirIncludes?.length) {
		if (!dirIncludes.some((m) => matches(normalized, m))) return false;
	}
	if (dirExcludes?.length) {
		if (dirExcludes.some((m) => matches(normalized, m))) return false;
	}
	return true;
}
function mergeEcosystem({ dirname, appDir = "./.mono/apps", appRoots, includes, excludes, dir, sub, appDirs = {}, ecosystems, dirIncludes, dirExcludes, map }) {
	const appsDir = path.resolve(dirname, appDir);
	const roots = appRoots ?? (fs.existsSync(appsDir) ? fs.readdirSync(appsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => ({
		name: d.name,
		root: path.join(appsDir, d.name)
	})) : []);
	if (!roots.length) return [];
	return roots.filter(({ name }) => {
		if (includes?.length && !includes.includes(name)) return false;
		if (excludes?.length && excludes.includes(name)) return false;
		return true;
	}).flatMap(({ name: appName, root: appRoot }) => {
		return uniq((appDirs[appName] ? toArray(appDirs[appName]) : resolveDirValue({
			dir,
			sub
		})).filter((rel) => ecosystemSubAllowed(candidateSub(rel), ecosystems?.[appName]))).map((rel) => path.resolve(appRoot, rel)).filter((resolvedDir) => fs.existsSync(resolvedDir)).filter((resolvedDir) => passDirFilter({
			dir: resolvedDir,
			dirIncludes,
			dirExcludes
		})).map((resolvedDir) => {
			if (map) return map(resolvedDir, {
				appName,
				appRoot
			});
			return resolvedDir;
		});
	});
}
/**
* Type-aware wrapper over {@link mergeEcosystem}: builds per-app `appDirs` from
* each app's `type` (`vue` -> `src/<sub>`, `nuxt` -> `app/<sub>`) so a host can
* pull in a remote without hardcoding its source folder. Only apps present in
* both `apps` and {@link resolveAppRoots} produce dirs — which means the
* `.mono/apps/` clone, or the local checkout an app's `path` names. Returns
* absolute, existing dirs.
*/
function monoEcosystem({ dirname, apps, subs, appDir, includes, excludes, ecosystems, dirIncludes, dirExcludes }) {
	const subList = toArray(subs);
	const appDirs = {};
	for (const app of apps) {
		if (!app?.name || !app?.type) continue;
		const keep = subList.filter((s) => ecosystemSubAllowed(s, ecosystems?.[app.name]));
		if (!keep.length) continue;
		const src = srcDirForType(app.type);
		appDirs[app.name] = keep.map((s) => path.join(src, s));
	}
	return mergeEcosystem({
		dirname,
		appDir,
		appRoots: resolveAppRoots({
			dirname,
			...appDir ? { appsDir: appDir } : {},
			apps,
			onMissingPath: "ignore"
		}),
		appDirs,
		includes,
		excludes,
		dirIncludes,
		dirExcludes
	});
}

//#endregion
export { mergeEcosystem as n, monoEcosystem as r, ecosystemSubAllowed as t };