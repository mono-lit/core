import { a as hasLiveDocument, i as destroyAllTooltipControllers, r as createTooltipController, u as setMonoTooltipGlobal } from "./control-tooltip-C3rA_nSH.js";
import "./tooltip-loader-Dcp9AUZn.js";

//#region src/components/tooltip/tooltip-declarative.ts
/** The two text attributes — `message` is an alias of `content`. */
const TOOLTIP_ATTRIBUTE_SELECTOR = "[mono-tooltip-content], [mono-tooltip-message]";
let declarative = null;
/**
* Per-element options, from `mono-tooltip-<option>` attributes:
*
* | attribute | option |
* | --- | --- |
* | `mono-tooltip-content` / `-message` | `content` (text) |
* | `mono-tooltip-placement` / `-variant` / `-color` / `-size` | same name |
* | `mono-tooltip-trigger` | `"hover focus"`, `"click"`, … |
* | `mono-tooltip-delay` | `"300"` or `"300 100"` |
* | `mono-tooltip-offset` / `-padding` | numbers |
* | `mono-tooltip-max-width` / `-class` | strings |
* | `mono-tooltip-arrow` / `-flip` / `-shift` / `-interactive` / `-html` / `-disabled` / `-hide-on-click` | booleans — present = on, `"false"` = off |
*/
function readTooltipAttributes(el) {
	const get = (name) => el.getAttribute(`mono-tooltip-${name}`);
	const str = (name) => get(name)?.trim() || void 0;
	const bool = (name) => {
		const v = get(name);
		return v === null ? void 0 : v.trim() !== "false";
	};
	const num = (name) => {
		const v = str(name);
		const n = v === void 0 ? NaN : Number(v);
		return Number.isFinite(n) ? n : void 0;
	};
	const list = (name) => str(name)?.split(/[\s,]+/).filter(Boolean);
	const content = get("content") ?? get("message") ?? void 0;
	const delay = list("delay")?.map(Number).filter(Number.isFinite);
	return {
		content,
		placement: str("placement"),
		variant: str("variant"),
		color: str("color"),
		size: str("size"),
		trigger: list("trigger"),
		delay: delay?.length ? delay.length > 1 ? [delay[0], delay[1]] : delay[0] : void 0,
		offset: num("offset"),
		padding: num("padding"),
		maxWidth: str("max-width"),
		class: str("class"),
		arrow: bool("arrow"),
		flip: bool("flip"),
		shift: bool("shift"),
		interactive: bool("interactive"),
		allowHTML: bool("html"),
		disabled: bool("disabled"),
		hideOnClick: bool("hide-on-click")
	};
}
/**
* Set the app-wide tooltip options AND switch on the `mono-tooltip-*` attributes.
* Call once — usually in `main.ts`:
*
* ```ts
* app.use(createMonoTooltip({ delay: [300, 0] }))
* // or simply
* createMonoTooltip()
* ```
*
* The options WIN over the ones passed to `controlMonoTooltip`; an element's own
* `mono-tooltip-*` attributes win over them. A later call replaces the previous
* global options wholesale. `attributes: false` keeps the options but turns the
* declarative attributes off.
*/
function createMonoTooltip(options = {}) {
	setMonoTooltipGlobal(options);
	const wantAttributes = options.attributes !== false;
	if (wantAttributes && !declarative && hasLiveDocument()) declarative = createTooltipController(TOOLTIP_ATTRIBUTE_SELECTOR, {}, readTooltipAttributes);
	else if (!wantAttributes && declarative) {
		declarative.destroy();
		declarative = null;
	}
	return {
		options: { ...options },
		install() {}
	};
}
/**
* Close and forget every live tooltip controller — the attribute one included
* (a later `createMonoTooltip()` turns the attributes back on). For tests and a
* full app teardown; the global options are kept.
*/
function destroyAllMonoTooltips() {
	destroyAllTooltipControllers();
	declarative = null;
}
/** Drop the global options and turn the attributes off (tests, runtime reconfiguration). */
function resetMonoTooltip() {
	setMonoTooltipGlobal(null);
	declarative?.destroy();
	declarative = null;
}

//#endregion
export { resetMonoTooltip as a, readTooltipAttributes as i, createMonoTooltip as n, destroyAllMonoTooltips as r, TOOLTIP_ATTRIBUTE_SELECTOR as t };