import { controlMonoTooltip } from "./control-tooltip.js";
//#region src/components/tooltip/field-tooltip-addon.d.ts
/** `controlMonoTooltip` once the optional `@floating-ui/dom` peer has loaded; rejects without it. */
export declare function loadFieldTooltipAddon(): Promise<typeof controlMonoTooltip>;
//#endregion