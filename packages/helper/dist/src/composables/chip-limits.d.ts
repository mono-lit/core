/**
 * Selection limits and display caps shared by `<mono-tag-input>` and
 * `<mono-dropdown-table>`.
 *
 * Two independent pairs:
 *
 * - `max` / `min` — how many chips the USER can have selected. A pick past `max`
 *   is rejected (nothing is disabled — the row stays clickable, the pick simply
 *   does not land); a removal under `min` is rejected the same way, chips at the
 *   floor lose their ✕ and the field's clear button hides.
 * - `maxVisible` / `minVisible` — how many chips are DRAWN. Past `maxVisible` the
 *   rest collapse into a "+N more" chip whose panel lists them, in `flex` and
 *   `inline` alike. `minVisible` is the collapse floor: while the total is at or
 *   under it every chip is drawn, however small `maxVisible` is — so a field is
 *   never collapsed for the sake of one or two chips.
 *
 * Each key can be set on the element (`max`, `max-visible`, …) or on the `chip`
 * object, camel or kebab (`chip.maxVisible`, `chip['max-visible']`). The chip key
 * PINS, the element prop is the fallback — the rule `chip.color` / `chip.variant`
 * already follow.
 */
export type ChipLimitKey = 'max' | 'min' | 'maxVisible' | 'minVisible';
/** The limit keys the `chip` object accepts, in both spellings. */
export interface ChipLimitProps {
    /** Most chips the user can select (unset = unlimited). Pins the element's `max`. */
    max?: number;
    /** Fewest chips the user can leave (unset = 0). Pins the element's `min`. */
    min?: number;
    /** Chips drawn before "+N more" (unset = all). Pins the element's `max-visible`. */
    maxVisible?: number;
    'max-visible'?: number;
    /** Never collapse while the total is at or under this. Pins `min-visible`. */
    minVisible?: number;
    'min-visible'?: number;
}
/** A non-negative integer, or undefined for anything that is not one (`''`, null, NaN, -1). */
export declare function limitNumber(value: unknown): number | undefined;
/**
 * Resolve one limit: the `chip` object's key (camel, then kebab) pins, the
 * element's own prop is the fallback. Sanitised through {@link limitNumber}.
 */
export declare function resolveChipLimit(chip: ChipLimitProps | null | undefined, key: ChipLimitKey, elementValue: unknown): number | undefined;
/**
 * How many chips to draw before the rest collapse into "+N more" — `Infinity`
 * when there is no cap, when the cap is `0` (uncapped, like before), or while
 * the total sits at or under the collapse floor.
 */
export declare function visibleChipCap(total: number, maxVisible: number | undefined, minVisible: number | undefined): number;
