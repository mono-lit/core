//#region src/components/tooltip/tooltip-loader.ts
/**
* Cached loader for the OPTIONAL `@floating-ui/dom` peer (which itself depends on
* `@floating-ui/core` — both are the consumer's to install).
*
* Loaded on the FIRST show, never at import: registering a tooltip in
* `<script setup>` costs nothing until somebody actually hovers. Externalized by
* `NEVER_BUNDLE` in `tsdown.config.ts`, so the consumer's bundler resolves and splits it.
*/
let _floatingPromise = null;
function loadFloatingUi() {
	_floatingPromise ??= import("@floating-ui/dom").catch((err) => {
		_floatingPromise = null;
		throw new Error("[mono-tooltip] needs the optional peer dependencies \"@floating-ui/dom\" and \"@floating-ui/core\". Install them in your app: pnpm add @floating-ui/dom @floating-ui/core" + (err?.message ? ` (original error: ${err.message})` : ""));
	});
	return _floatingPromise;
}

//#endregion
export { loadFloatingUi };