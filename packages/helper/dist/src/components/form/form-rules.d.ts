import { MonoFormRule, MonoFormRuleCtx } from './form-types.js';
/** Empty for validation purposes: null/undefined, blank string, empty array. */
export declare function isBlank(value: unknown): boolean;
/**
 * Run a single rule. Returns `true` when it passes, or the failure message.
 *
 * A `schema` on the rule takes precedence over its `type`/`validate` — that's
 * the documented override, so a rule can be declared as a built-in and later
 * swapped to a schema without moving it.
 */
export declare function runRule<V>(rule: MonoFormRule<V>, ctx: MonoFormRuleCtx<V>): Promise<true | string>;
/**
 * Run a field's rules and return the FIRST failure (so one message shows at a
 * time, matching how the components render a single `validation-message`).
 *
 * `timing` filters which rules apply: `undefined` runs them all (that's
 * `form.validate()`), otherwise only rules whose effective timing matches.
 */
export declare function runRules<V>(rules: MonoFormRule<V>[] | undefined, ctx: MonoFormRuleCtx<V>, opts: {
    timing?: 'live' | 'change';
    defaultTiming: 'live' | 'change';
}): Promise<{
    success: boolean;
    message: string;
}>;
