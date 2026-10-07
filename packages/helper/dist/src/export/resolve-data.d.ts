/**
 * Turning live data sources in `options.data` into plain arrays.
 *
 * A template can only loop over an array, but the thing a consumer *has* is
 * usually a devextreme DataSource. Rather than making everyone drain it by hand
 * before every export, any DataSource-shaped value in `data` is drained here
 * first — in chunks, honouring whatever filter / search / sort the source
 * already carries — so the template just sees rows:
 *
 * ```ts
 * data: { program: dataSourceProgramTransfer.value }
 * ```
 * ```hbs
 * {{#each program}}| {{NoDokumen}} | {{currency TotalBudget}} |
 * {{/each}}
 * ```
 */
/**
 * Replace every DataSource / store in `data`'s **top level** with its rows.
 *
 * Top-level only, deliberately: it's predictable, and a deep walk would mean
 * inspecting every record of every array already in `data` — a real cost for a
 * 10k-row export, to support a nesting nobody has asked for. A source nested
 * deeper stays the caller's job (`await table.getData()` and pass the array).
 *
 * Sources are drained concurrently — several are independent queries, and a
 * report with three of them shouldn't take three times as long.
 */
export declare function resolveExportData(data: Record<string, unknown> | undefined, options?: {
    chunkSize?: number;
}): Promise<Record<string, unknown>>;
