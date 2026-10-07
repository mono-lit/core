import { isServer } from "lit";
//#region src/composables/breakpoints.ts
/**
* Shared viewport breakpoints — Tailwind's values, so `auto-fullscreen="lg"` in a
* mono component and `lg:` in the consumer's utility classes agree on where the
* boundary is.
*
* The library already hard-codes `@media (max-width: 640px)` in `button.css`,
* `card.css` and `nav.css`; those stay as they are. This module exists because
* `autoFullscreen` needs the same five tokens in two components plus the matching
* JS check, and three copies of a magic number is where it stops being fine.
*
* `sidebar-utils.ts` keeps its own `SIDEBAR_AUTO_BREAKPOINT = 768` deliberately —
* re-pointing it here would silently change the sidebar's auto-temporary threshold.
*/
var MONO_BREAKPOINTS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536
};
var TOKENS = Object.keys(MONO_BREAKPOINTS);
var warned = false;
/**
* Normalise the prop to the breakpoint it should act at, or `null` when off.
*
* An unrecognised token falls back to `sm` rather than switching the feature off:
* the author clearly asked for auto-fullscreen, and silently ignoring them is the
* worse failure. Warns once in dev.
*/
function resolveAutoFullscreen(value) {
	if (value === false || value === null || value === void 0) return null;
	if (value === true) return "sm";
	const token = String(value).toLowerCase().trim();
	if (token === "" || token === "true") return "sm";
	if (token === "false") return null;
	if (TOKENS.includes(token)) return token;
	if (!warned && typeof console !== "undefined") {
		warned = true;
		console.warn(`[mono] auto-fullscreen: unknown breakpoint "${value}" — expected one of ${TOKENS.join(", ")}. Falling back to "sm".`);
	}
	return "sm";
}
/**
* Lit converter for the `auto-fullscreen` attribute.
*
* Modelled on `booleanStringConverter` (composables/hybird-prop.ts), including its
* non-string guard: nuxt-ssr-lit forwards the raw PROPERTY value into
* `fromAttribute`, so a real boolean can arrive here instead of a string.
*/
var autoFullscreenConverter = {
	fromAttribute(value) {
		if (value === null || value === void 0) return false;
		if (typeof value === "boolean") return value;
		const normalized = String(value).toLowerCase().trim();
		if (normalized === "" || normalized === "true") return true;
		if (normalized === "false") return false;
		return TOKENS.includes(normalized) ? normalized : true;
	},
	toAttribute(value) {
		if (!value) return null;
		return value === true ? "" : value;
	}
};
/**
* Is the viewport currently at or below `bp`?
*
* Guard order copied from `sidebar-utils.ts`: `typeof window === 'undefined'` alone
* is NOT a safe server check, because a DOM shim can define `window` without
* `matchMedia`. Check lit's `isServer` first, then feature-detect.
*
* Deliberately point-in-time with no listener — the only callers are pointer
* handlers (the modal's header drag, the drawer's resize start), so there is
* nothing to re-render from and nothing to leak. Every VISUAL decision is made by
* the `@media` blocks in modal.css / drawer.css, which have no SSR surface at all.
*/
function isBelowBreakpoint(bp) {
	if (isServer || typeof window === "undefined") return false;
	if (typeof window.matchMedia !== "function") return false;
	return window.matchMedia(`(max-width: ${MONO_BREAKPOINTS[bp] - .02}px)`).matches;
}
//#endregion
export { isBelowBreakpoint as n, resolveAutoFullscreen as r, autoFullscreenConverter as t };
