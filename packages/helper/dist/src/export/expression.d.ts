/**
 * Template source preprocessing — everything that must happen *before*
 * Handlebars sees the template.
 *
 * Two rewrites live here, both driven by the same single-pass scanner so that
 * fenced code blocks and inline code spans are never touched (a template that
 * *documents* `{{= … }}` in a code block must keep it verbatim):
 *
 * 1. `{{= expr }}` → `{{__jexl "expr"}}` — Handlebars has no `{{=` syntax at
 *    all (it's a parse error), so inline expressions are rewritten into a call
 *    to the Jexl helper.
 * 2. Mustaches on a GFM **table row** are wrapped in `{{esc …}}`, so a value
 *    containing a `|` can't split the cell and shift every column after it.
 *    `{{{triple}}}` opts out.
 */
/**
 * Evaluate one Jexl expression.
 *
 * Jexl is used instead of `eval()` so a template can never reach globals, the
 * DOM, or `fetch` — the worst a malicious template can do is compute a wrong
 * number.
 */
export declare function evaluateExpression(expression: string, context: unknown): unknown;
/**
 * Rewrite a template's mustaches. Single pass, line-aware (for table rows) and
 * code-aware (fenced blocks + inline spans are copied verbatim).
 */
export declare function preprocessTemplate(src: string, opts?: {
    escapeTableCells?: boolean;
}): string;
/**
 * Escape an interpolated value for a GFM table cell. Registered as the `esc`
 * helper and applied automatically to table-row mustaches by
 * {@link preprocessTemplate}; also callable by hand.
 */
export declare function escapeForCell(value: unknown): string;
