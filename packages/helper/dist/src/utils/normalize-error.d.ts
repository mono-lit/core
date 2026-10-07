/**
 * A readable message for `raw`, or `fallback` when nothing legible can be found.
 *
 * Never throws, and never returns an empty string — a caller rendering this into
 * an error bar has to have something to render, and a blank bar is worse than a
 * generic one.
 */
export declare function normalizeError(raw: unknown, fallback?: string): string;
/**
 * Keys of the preset map: an HTTP status, `'network'` for "the request never
 * got an answer" (status 0, `TypeError: Failed to fetch`, devextreme's
 * "Unspecified network error"), and `'default'` for everything else.
 */
export type MonoErrorMessageKey = number | 'network' | 'default';
/** Wording overrides — per grid (`monoDataGrid({ errorMessages })`) or app-wide (`setErrorMessages`). */
export type MonoErrorMessages = Partial<Record<MonoErrorMessageKey, string>>;
/**
 * What the bar says for a status. English; an app puts its own language in
 * ONCE with `setErrorMessages()` rather than on every table.
 */
export declare const DEFAULT_ERROR_MESSAGES: Readonly<Record<MonoErrorMessageKey, string>>;
/**
 * App-wide wording, merged over the defaults; `null` restores them. A grid's own
 * `errorMessages` merges over this in turn, so a single table can still differ.
 */
export declare function setErrorMessages(messages: MonoErrorMessages | null): void;
/** Defaults ← app-wide ← `local`, same shape as the filter builder's `resolveTexts`. */
export declare function resolveErrorMessages(local?: MonoErrorMessages): Record<MonoErrorMessageKey, string>;
/**
 * The HTTP status an error carries, `0` for a network failure, `undefined` when
 * it has none.
 *
 * Reads the fields the common transports use — devextreme's `httpStatus`, a
 * fetch `Response` / axios error's `status` and `response.status`, ofetch's
 * `statusCode`, an OData error body's numeric `code` — on an `Error` instance as
 * readily as on a plain object, since devextreme `extend()`s them onto an
 * `Error`.
 */
export declare function errorStatus(raw: unknown): number | undefined;
export interface DescribedError {
    /** The headline: the preset for the status when there is one, else the error's own text. */
    message: string;
    /** The HTTP status, `0` for a network failure, absent when the error carries none. */
    status?: number;
    /**
     * Text the server (or the error itself) added beyond the status — the part a
     * user CAN act on ("Budget period is closed"). Never a bare reason phrase.
     */
    detail?: string;
}
/**
 * The line a person should read for `raw`.
 *
 * Order: a preset for the status (`'network'` for 0) → the error's own text →
 * `messages.default`. When a preset is the headline, whatever the server said
 * on top of the status becomes `detail`; without a preset, the raw text IS the
 * headline and only a distinct server body is a detail. Never throws, never
 * returns an empty `message`.
 */
export declare function describeError(raw: unknown, messages?: MonoErrorMessages): DescribedError;
