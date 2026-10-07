import { MonoSkeletonDefaults } from './mono-skeleton';
/**
 * Tag → props map for typed configs. `scripts/gen-vue-types.mjs` augments it in
 * the published types (`'mono-button': ButtonProps`, …); it is empty in source.
 */
export interface MonoUIComponents {
}
type KnownConfig = {
    [K in keyof MonoUIComponents]?: Partial<MonoUIComponents[K]>;
};
/**
 * Per-component default props. Keys are tags (`mono-button`); props are camelCase or kebab-case.
 * The reserved `skeleton` key holds the global defaults of the automatic skeleton
 * (`pending`, see ./mono-skeleton.ts) and its `ssr` flag; `false` disables it.
 */
export type MonoUIConfig = KnownConfig & {
    skeleton?: MonoSkeletonDefaults | false;
} & {
    [tag: `mono-${string}`]: Record<string, unknown> | undefined;
};
export interface MonoUI {
    readonly config: Readonly<MonoUIConfig>;
    /** Vue plugin hook — a no-op; the call already applied the config. */
    install(app?: unknown): void;
}
export interface MonoUIStatus {
    /** `createMonoUI` has been called (and not reset). */
    configured: boolean;
    /** Mono elements constructed BEFORE the current config was set — they kept built-in defaults. */
    createdBefore: number;
    /** Their tags, first occurrence order. */
    createdBeforeTags: string[];
}
/**
 * Set the app-wide default props. Call once, first — usually in `main.ts`:
 *
 * ```ts
 * app.use(createMonoUI({ 'mono-button': { size: 'xs' } }))
 * // or simply
 * createMonoUI({ 'mono-button': { size: 'xs' } })
 * ```
 *
 * A later call replaces the previous config for elements created afterwards.
 */
export declare function createMonoUI(config?: MonoUIConfig): MonoUI;
/** The current config, or `null` when `createMonoUI` has not been called. */
export declare function getMonoUI(): Readonly<MonoUIConfig> | null;
/** Whether the config is set, and how many elements were created before it was. */
export declare function getMonoUIStatus(): MonoUIStatus;
/** Drop the config (tests, or reconfiguring before mount). Elements created afterwards get built-in defaults. */
export declare function resetMonoUI(): void;
/**
 * Apply the configured defaults to a freshly constructed element. Called by the
 * mono `customElement` decorator at the end of construction — not public API.
 * @internal
 */
export declare function applyMonoUIDefaults(el: HTMLElement, tag: string): void;
export {};
