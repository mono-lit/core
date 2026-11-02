import { o as loadFloatingUi, t as controlMonoTooltip } from "./control-tooltip-CoPD37_h.js";

//#region src/components/tooltip/field-tooltip-addon.ts
/**
* The tooltip addon as `field-tooltip` lazy-loads it — ONE module, imported dynamically and
* from nowhere else.
*
* `field-tooltip` used to `import()` `control-tooltip` and `tooltip-loader` directly. Both are
* also imported STATICALLY by the root entry, so rolldown had to hand the dynamic importer a
* synthesized namespace object (`__exportAll`) — and its runtime helpers sat in the report
* engine's markdown chunk, so `import … from '@mono-lit/helper'` loaded and evaluated ~500KB of
* remark/micromark. A module that is only ever dynamically imported is its own chunk entry, and
* `import()` returns its real namespace: no helper, no markdown.
*/
/** `controlMonoTooltip` once the optional `@floating-ui/dom` peer has loaded; rejects without it. */
async function loadFieldTooltipAddon() {
	await loadFloatingUi();
	return controlMonoTooltip;
}

//#endregion
export { loadFieldTooltipAddon };