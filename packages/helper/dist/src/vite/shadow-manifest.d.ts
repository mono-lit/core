export declare const SHADOW_ENTRY_TO_TAGS: Record<string, readonly string[]>;
/** Flat list of every shadow-built custom-element tag. */
export declare const SHADOW_TAGS: readonly string[];
/**
 * Extract the set of shadow tags a script block opts into, by scanning its
 * `@mono-lit/helper/ui/shadow/<entry>` imports and mapping each entry to its tag(s).
 */
export declare function shadowTagsFromScript(script: string): Set<string>;
