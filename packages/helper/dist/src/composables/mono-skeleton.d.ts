/** phantom-ui's options, camelCase (applied to the wrapper as kebab-case attributes). */
export interface MonoPhantomProps {
    /** `shimmer` (default) | `pulse` | `breathe` | `solid`. */
    animation?: 'shimmer' | 'pulse' | 'breathe' | 'solid' | (string & {});
    /** `skeleton` (default, hides the content) | `overlay` (dims it and sweeps). */
    mode?: 'skeleton' | 'overlay' | (string & {});
    shimmerDirection?: 'ltr' | 'rtl' | 'ttb' | 'btt' | (string & {});
    /** Sweep colour. Unset = the mono theme's (`--mono-skeleton-color`). */
    shimmerColor?: string;
    /** Block colour. Unset = the mono theme's (`--mono-skeleton-bg`). */
    backgroundColor?: string;
    /** Animation cycle, seconds (default 1.5). */
    duration?: number;
    /** Delay between blocks, seconds. */
    stagger?: number;
    /** Fade-out when loading ends, seconds. */
    reveal?: number;
    /** Repeat the measured row set N times (table placeholders). */
    count?: number;
    /** Gap between repeated rows, px. */
    countGap?: number;
    /** Radius for flat elements, px (default 4). */
    fallbackRadius?: number;
    /** Screen-reader announcement (default "Loading"). */
    loadingLabel?: string;
    /** Measure inside open shadow roots of slotted components. */
    pierceShadow?: boolean;
    /** Outline the measured blocks. */
    debug?: boolean;
}
/** The object form of `pending`: `active` plays the boolean's part (omitted = auto). */
export type MonoPendingOptions = {
    active?: boolean;
} & Partial<MonoPhantomProps>;
/** `pending` — `true` / `false`, or an object with phantom-ui options. `undefined` = auto. */
export type MonoPending = boolean | MonoPendingOptions;
/** `createMonoUI({ skeleton: {...} })` — global phantom defaults + the SSR flag. */
export interface MonoSkeletonDefaults extends Partial<MonoPhantomProps> {
    /**
     * Whether the app renders on the server. Decides the AUTO default of light elements:
     * `true` → pending on first connect, `false` → never pending unless asked. The Nuxt
     * module sets it from `nuxt.options.ssr`; unset, a Nuxt payload marker is sniffed.
     */
    ssr?: boolean;
    /**
     * Safety net for an automatic pending that never gets its "loaded" signal: released
     * after this many ms (default 15000; `0` disables).
     */
    maxWait?: number;
}
export interface MonoSkeletonStatus {
    /** `phantom-ui` is defined in this realm (and the skeleton is not disabled). */
    active: boolean;
    /** The configured SSR flag (`null` = not set, the sniffed value is used). */
    ssr: boolean | null;
    /** Elements whose first render happened BEFORE activation (no skeleton on that first paint). */
    createdBeforeActive: number;
    createdBeforeActiveTags: string[];
}
/** Which "loaded" signal an element's AUTO pending waits for. */
export type MonoPendingAuto = 'render' | 'data' | 'never';
/** Statics a Core may declare to tune the automatic behaviour. */
export interface MonoPendingStatics {
    /**
     * `'render'` (default) — released in the element's first update, before first paint.
     * `'data'` — released when `_monoPendingReady()` first returns true (re-checked on
     * every update; the Cores request one on each controller / source notify).
     * `'never'` — never automatic (overlays like modal / drawer); manual still works.
     */
    monoPendingAuto?: MonoPendingAuto;
    /**
     * `'wrap'` (default) — the mixin wraps `render()` in `<phantom-ui>`.
     * `'custom'` — the element draws its own placeholder from `monoPendingActive(this)`
     * (e.g. `mono-table-loading`); the mixin only resolves the state.
     */
    monoPendingMode?: 'wrap' | 'custom';
    /**
     * How the element's own pending is drawn. `'phantom'` (default) — phantom-ui measures the
     * content (a wrapper, one re-render per flip). `'css'` — only the `mono-pending` host
     * attribute, i.e. the CSS-only block: no wrapper, no re-render, right for small elements
     * whose measured skeleton would be one bar anyway (the table helpers). Render-driven
     * elements held by a loading page draw through phantom like everything else; the CSS lane
     * is their fallback while phantom-ui is not (yet) defined.
     */
    monoPendingDraw?: 'phantom' | 'css';
}
/** A render-driven element held by the page (internal). */
export interface MonoHeldElement {
    _monoReleaseHeld(): void;
}
interface MonoSkeletonState {
    active: boolean;
    disabled: boolean;
    ssr: boolean | null;
    ssrSniffed: boolean | null;
    defaults: MonoSkeletonDefaults;
    watching: boolean;
    createdBeforeActive: number;
    createdBeforeActiveTags: string[];
    warnedLate: boolean;
    /** Data-driven elements still waiting for their first load (the page is "loading"). */
    waiting: Set<object>;
    /** Render-driven elements held pending until `waiting` empties. */
    holders: Set<MonoHeldElement>;
}
/** Per-element slots the Cores can read without depending on the mixin's class shape. */
declare const TAG_DEFAULT: unique symbol;
declare const PENDING_ACTIVE: unique symbol;
declare const PENDING_GRACE: unique symbol;
declare const PENDING_PHANTOM: unique symbol;
/** Where `applyMonoUIDefaults` parks a tag's `pending` default (not assigned to the prop). */
export declare const MONO_PENDING_TAG_DEFAULT: unique symbol;
declare function isActive(): boolean;
/**
 * Start following the registry. Idempotent; a no-op on the server. Called by the mono
 * `customElement` decorator, so the watcher exists before any element constructs.
 */
export declare function watchSkeletonActivation(): void;
/**
 * Is this an SSR app? The explicit flag (`createMonoUI({ skeleton: { ssr } })`, which the
 * Nuxt module sets from `nuxt.options.ssr`) wins; otherwise the Nuxt payload marker is
 * sniffed once (`<script id="__NUXT_DATA__" data-ssr="true">`).
 */
export declare function isMonoSsrApp(): boolean;
/** Set the global defaults (`createMonoUI`'s `skeleton` key routes here). `false` disables the skeleton. */
export declare function setMonoSkeletonDefaults(defaults: MonoSkeletonDefaults | false | undefined): void;
export declare function getMonoSkeletonStatus(): MonoSkeletonStatus;
/** Drop defaults / flag / counters (tests). `active` stays — an element cannot be undefined. */
export declare function resetMonoSkeleton(): void;
/** The boolean a `pending` value carries (`undefined` = auto). */
declare function activeOf(value: MonoPending | undefined): boolean | undefined;
/** Only the phantom options of a value (an object), as a plain record. */
declare function phantomOf(value: unknown): Record<string, unknown>;
/** `hasChanged` for the property: booleans by value, objects shallowly. */
export declare function pendingChanged(next: unknown, prev: unknown): boolean;
/**
 * The attribute converter. The attribute form is boolean-only: `pending`,
 * `pending="true"` → true; `pending="false"` → false; absent or `pending="auto"` → auto.
 * A real boolean is accepted too (what a server renderer hands over).
 */
export declare const pendingConverter: {
    fromAttribute(value: unknown): MonoPending | undefined;
    toAttribute(): null;
};
/**
 * Register the `pending` property on a registered element class. Called by the mono
 * `customElement` decorator BEFORE `customElements.define`, so the attribute lands in
 * Lit's attribute map when `observedAttributes` is read.
 */
export declare function registerPendingProperty(cls: unknown): void;
/** Whether `pending` currently resolves to true for `el` (set before each render). */
export declare function monoPendingActive(el: object): boolean;
/**
 * True once one macrotask has passed since the element first resolved pending — lets a
 * `'data'` Core say "no controller / source after one tick → nothing to wait for" without
 * releasing before a binding made in the consumer's `onMounted`.
 */
export declare function monoPendingGrace(el: object): boolean;
/**
 * The phantom options resolved for `el` while pending (element object over tag default
 * over global default), camelCase keys. Empty while not pending. For `'custom'` Cores
 * that render their own `<phantom-ui>` and want a value in the template (e.g. `count`).
 */
export declare function monoPhantomOptions(el: object): Readonly<Record<string, unknown>>;
/**
 * Apply the resolved phantom options to a `<phantom-ui>` element as attributes (used by
 * the mixin for its wrapper, and by `'custom'` Cores for the phantom they render).
 * Diffed against what was last applied to that element, so unchanged values cost nothing.
 */
export declare function monoApplyPhantomOptions(el: object, target: Element | null | undefined): void;
/** @internal */
export declare const monoSkeletonInternals: {
    readonly hasDom: boolean;
    readonly isActive: typeof isActive;
    readonly state: MonoSkeletonState;
    readonly slots: {
        readonly TAG_DEFAULT: typeof TAG_DEFAULT;
        readonly PENDING_ACTIVE: typeof PENDING_ACTIVE;
        readonly PENDING_GRACE: typeof PENDING_GRACE;
        readonly PENDING_PHANTOM: typeof PENDING_PHANTOM;
    };
    readonly activeOf: typeof activeOf;
    readonly phantomOf: typeof phantomOf;
    readonly PHANTOM_TAG: "phantom-ui";
    readonly DEFAULT_MAX_WAIT: 15000;
};
/** The `<phantom-ui>` wrapper the skeleton mixin renders around an element's content. */
export declare function isMonoSkeletonWrapper(node: Node | null | undefined): boolean;
/** `Array.from(host.childNodes)` minus the skeleton wrapper. */
export declare function monoHostChildNodes(host: Node): Node[];
/** `Array.from(host.children)` minus the skeleton wrapper. */
export declare function monoHostChildren(host: Element): Element[];
export {};
