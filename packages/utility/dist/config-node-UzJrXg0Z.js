import { r as dedupeConfigArrays } from "./create-config-DdL3Fh6T.js";
import { loadConfig } from "c12";

//#region src/composables/config-node.ts
function getCwd() {
	return typeof process !== "undefined" ? process.cwd() : void 0;
}
/**
* Collapse name-keyed arrays that may carry one duplicate per layer, so the
* loaded config behaves like a single config.
*
* Delegates to `dedupeConfigArrays` from `create-config` rather than owning a
* rule: this used to keep the FIRST occurrence while the runtime resolver keeps
* the LAST, which are opposite precedence rules for the same data. It is a no-op
* while `extend: false` (below) leaves c12 with only the root config's own
* arrays, but the two must never be able to disagree.
*/
function normalizeMergedConfig(config) {
	return dedupeConfigArrays(config);
}
async function loadMonoConfig(options = {}) {
	const result = await loadConfig({
		name: "mono",
		cwd: options.cwd ?? getCwd(),
		extend: false,
		defaults: {
			apps: [],
			name: "mono-app",
			type: "vue",
			menu: [],
			cookie: [],
			jwt: {}
		},
		...options
	});
	return {
		...result,
		config: normalizeMergedConfig(result.config)
	};
}
async function getMonoConfig(options = {}) {
	try {
		return (await loadMonoConfig(options)).config;
	} catch (error) {
		throw describeConfigLoadError(error);
	}
}
/** `Cannot find module '@some-app-root/mono.config'` — the shape jiti throws. */
const MISSING_ALIAS_RE = /Cannot find module ['"](@[^'"]+)['"]/;
/**
* Turn an unresolved mono alias into an error that says what to do.
*
* `mono.config.ts` reaches other apps through ordinary `import`s resolved by jiti
* against the alias map, and those aliases come from the `.mono/apps/` directory
* listing. An app that isn't synced therefore surfaces as a bare `Cannot find
* module '@x-root/mono.config'` — a specifier nobody typed by hand, thrown from
* inside c12, naming no file and no fix.
*
* Pattern-based on purpose: this module knows nothing about the alias map, and
* shouldn't. Covers the paths that never call `monoStubAliases` (the `mono db` CLI)
* and the specifiers a config-only stub can't satisfy (a host config importing a
* missing app's OData service).
*/
function describeConfigLoadError(error) {
	const message = error instanceof Error ? error.message : String(error);
	const specifier = MISSING_ALIAS_RE.exec(message)?.[1];
	if (!specifier) return error;
	return new Error([
		`[@mono-lit/utility] Failed to load mono.config: cannot resolve '${specifier}'.`,
		"That looks like a federated mono app that isn't present in .mono/apps/.",
		"Run `mono sync && mono prepare`. If the repo is private, set its envToken in .env."
	].join("\n"), { cause: error });
}

//#endregion
export { loadMonoConfig as n, getMonoConfig as t };