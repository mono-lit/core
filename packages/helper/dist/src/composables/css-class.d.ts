/**
 * Append a per-part class override (if present) to a base class string.
 *
 *   cssPart({ inner: 'px-4' }, 'mono-nav-inner', 'inner') // 'mono-nav-inner px-4'
 *   cssPart(undefined,        'mono-nav-inner', 'inner') // 'mono-nav-inner'
 */
export declare function cssPart<T extends object>(cssClass: T | undefined, base: string, key: keyof T): string;
/**
 * Apply a `css-class` value to an element's `cssClass`/`cssClassName`.
 *
 *  - `null`/`undefined`/empty string → reset both
 *  - object                          → `cssClass`
 *  - `'{ … }'` JSON string           → parsed into `cssClass`
 *  - plain string                    → `cssClassName` (root class fallback)
 *
 * Mutates the element's reactive properties directly (so Lit picks up the
 * change). Used by each component's `_setCssClass`.
 */
export declare function applyCssClass<T extends object>(target: {
    cssClass: T;
    cssClassName: string;
}, value: unknown): void;
/**
 * Define `css-class` and `cssclass` instance aliases (Vue interop) that route to
 * `set`. Lets consumers write `<el :css-class="…">` / `:cssclass` / `:cssClass`.
 */
export declare function defineCssClassAliases(target: object, set: (value: unknown) => void): void;
