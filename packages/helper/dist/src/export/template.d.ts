import { MonoExportOptions } from './types';
/**
 * Render a report template to Markdown (still carrying directive tokens).
 *
 * `noEscape` is deliberate: Handlebars' default escaping is *HTML* escaping,
 * which would turn `&` into `&amp;` and `"` into `&quot;` inside a spreadsheet
 * cell. Table cells are protected instead by the `esc` helper, which the
 * preprocessor injects only where it matters (see `expression.ts`).
 */
export declare function renderTemplate(options: Pick<MonoExportOptions, 'md' | 'data' | 'helpers' | 'partials' | 'formatting'>): Promise<string>;
