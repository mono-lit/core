//#region src/composables/mono-size-attrs.d.ts
/** Apply the three attributes to one element. Re-run whenever one of them changes. */
export declare function applyMonoSizeAttributes(el: HTMLElement): void;
/**
 * Turn the attributes on for the whole document — idempotent, so every caller may call it.
 * Returns a stop function (tests; an app never needs it).
 */
export declare function startMonoSizeAttributes(): () => void;
export declare function stopMonoSizeAttributes(): void;
//#endregion