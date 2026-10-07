# mono-table-sort — dual chevron indicator (active by color)

## Context
The sort header indicator had become a single state-driven chevron. Reverted to the classic
DevExtreme-style **dual** indicator: both `i-mdi-chevron-up` and `i-mdi-chevron-down` always render
(stacked), and the **active** direction is shown by **monochrome color** — active = dark gray
(`--mt-text`), inactive = faint gray (`--mt-faint`), unsorted = both faint.

The active direction is driven by the datasource's current sort: `mono-table-sort` already derives it
in `_current` (`dataGrid.sortField === field ? dataGrid.sortOrder : null`) and writes it to `data-dir`
on the button, so a pre-sorted column shows the right dark arrow on first render. No sort-logic change.

## Changes
- `src/components/table/mono-table-sort.ts` (render): replaced the single-icon ternary with two
  carets — `.mono-table-sort-caret.up i-mdi-chevron-up` and `.down i-mdi-chevron-down`.
- `src/components/table/table.css` (`.mono-table-sort-ind` / `.mono-table-sort-caret`): both carets
  flat (`0.85rem × 0.6rem`) and `--mt-faint` by default, stacked tight (`gap:1px; line-height:0`);
  `[data-dir='asc'] .up` / `[data-dir='desc'] .down` → `--mt-text` (dark).

No safelist change — both chevrons were already safelisted.

## Verification
- `npm run build` (package + vitepress) clean.
- Sortable grid: unsorted → both faint; asc → up dark; desc → down dark; pre-sorted column correct on
  load; pair compact, equal size, not clipped. Material flavor colors resolve via `--mt-text`/`--mt-faint`.

## Tuning knobs
`.mono-table-sort-caret` `width`/`height` + `.mono-table-sort-ind` `gap`.
