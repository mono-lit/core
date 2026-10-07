/**
 * Refcounted document-level layout variables.
 *
 * Several components publish their own size as a custom property on
 * `document.documentElement` so page content can offset itself —
 * `--mono-nav-height`, `--mono-sidebar-left-width`, `--mono-sidebar-right-width`.
 * The property is global but the writers are not: two navs, or two sidebars on the
 * same side, all write the SAME property.
 *
 * Removing it outright on the first unmount blanked the offset for every writer that
 * was still mounted — the page content jumped back underneath a nav or sidebar that
 * is still on screen. That bug was found independently in BOTH `mono-sidebar` and
 * `mono-nav`, which is why the fix lives here rather than being written twice.
 *
 * Ownership is therefore refcounted: the property is removed only when the LAST
 * owner releases it, and until then it is handed back to a remaining owner's last
 * known value. Note that a refcount has two failure modes — releasing too early
 * (survivor loses the var) and never reaching zero (the var is stranded on the
 * document forever). Both are covered by assertions in `docs/e2e/stress.mjs` (repo root).
 */
/**
 * Publish `value` for `name` on behalf of `owner`.
 *
 * Re-claiming with the same owner just updates that owner's value, so this is safe
 * to call on every render.
 */
export declare function claimLayoutVar(name: string, owner: object, value: string): void;
/**
 * Drop `owner`'s claim on `name`.
 *
 * The property is only removed once nobody holds it; while another owner remains,
 * that owner's last published value is restored instead.
 */
export declare function releaseLayoutVar(name: string, owner: object): void;
