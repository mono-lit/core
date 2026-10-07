import "lit";
import "lit/directives/unsafe-svg.js";
//#region src/composables/icon.ts
/**
* Detect whether an icon string is an iconify utility class — e.g.
* `i-mdi-close`, `i-tabler-upload`. UnoCSS's preset-icons resolves these to a
* background/mask, so components render them as an empty `<span class="i-...">`.
*
* Single source of truth — components re-export this from their own
* `*-utils.ts` so their public API stays stable.
*/
function isIconifyClass(icon) {
	if (!icon || typeof icon !== "string") return false;
	return /^i-[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(icon.trim());
}
//#endregion
export { isIconifyClass as t };
