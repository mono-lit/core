import type { CssSizeValue, PanelSizeProps } from '../../composables/css-size'
import type { DropdownPlacement } from '../dropdown/dropdown-types.js'
import type { MonoDropdownController, MonoDropdownItem } from './mono-data-dropdown.js'
import type { VisibilityProps } from '../../composables/visibility'
import type {
  ChipBehaviour,
  ChipColor,
  ChipCssClass,
  ChipRounded,
  ChipSize,
  ChipVariant,
} from '../chip/chip-types'
import type { ChipLimitProps } from '../../composables/chip-limits'

export type { DropdownPlacement, ChipBehaviour, ChipLimitProps }

/**
 * Configuration for the selection chips inside the field, passed as one object:
 * `<mono-dropdown-table :chip.prop="{ size: 'md', behaviour: 'inline' }">`.
 *
 * The same object `<mono-tag-input>` takes. The chips are rendered as `mono-chip`
 * markup and painted by `chip.css`, so every key here is the corresponding
 * `MonoChipProps` prop and takes the same values. Anything left unset follows
 * the control instead of a fixed default:
 *
 * - `color` — defaults to the control's `color`. Setting it pins the chips to a
 *   hue of their own.
 * - `variant` — defaults to a skin matching the control's `variant`
 *   (`outlined` → `soft`, `filled` → `solid`, `underlined` → `outline`).
 * - `size` — defaults to `sm` (`xs` on the two smallest field sizes).
 * - `shape` — defaults to `pill`.
 *
 * CHANGED: chips used to be hard-coded `soft-primary` regardless of the field's
 * `color`. They now follow it, like tag-input's always have. A field with a
 * non-primary `color` that wants the old look can pin it back with
 * `:chip.prop="{ color: 'primary' }"`.
 */
export interface DropdownTableChipProps extends ChipLimitProps {
  /**
   * How the chips are laid out in the field. Default `flex` — they wrap onto
   * new lines and the field grows taller.
   *
   * `inline` keeps them on ONE line in a horizontally scrolling strip, so the
   * field never changes height. The strip is moved ONLY by the `‹` / `›`
   * buttons rendered before the clear button / caret: no scrollbar is painted,
   * and wheel, click-drag and arrow-key scrolling are all inert.
   *
   * {@link DropdownTableProps.maxVisible} applies in both layouts: past it the
   * rest collapse into a "+N more" chip (in the strip, when inline) whose panel
   * lists them.
   */
  behaviour?: ChipBehaviour
  /** Chip scale. Defaults to `sm` (`xs` on `xs`/`sm` fields). */
  size?: ChipSize
  /** Chip hue. Defaults to the control's `color`; setting it pins the chips. */
  color?: ChipColor
  /** Chip skin. Defaults to the skin matching the control's `variant`. */
  variant?: ChipVariant
  /** Corner radius. Unset keeps the pill a chip has by default. */
  rounded?: ChipRounded
  /** Show a status dot before each label. */
  dot?: boolean
  /** Accessible label for the remove button. Default `Remove <label>`. */
  closeLabel?: string
  /** Per-part class overrides, same keys as `mono-chip`'s `cssClass`. */
  cssClass?: ChipCssClass
}

/** Visual size of the field. */
export type DropdownTableSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
/** Color theme (drives the focus/accent color). */
export type DropdownTableColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'teal'
  | 'purple'
  | 'neutral'
  | 'dark'
/** Field style variant. */
export type DropdownTableVariant = 'outlined' | 'filled' | 'underlined'
/** Validation appearance. */
export type DropdownTableValidationState = 'default' | 'valid' | 'invalid' | 'warning'

/**
 * Sizes the popup PANEL only (independent of the field). When unset the panel sizes to its table
 * content (min ~18rem). Bind with `.prop`: `:dropdown.prop="{ width: 520, maxHeight: 320 }"`.
 *
 * CHANGED: `height` used to be the panel's max-height, because this object had no separate cap
 * key. It now has one, so `height` is an exact height and `maxHeight` caps — matching
 * `<mono-select>` and `<mono-tag-input>`, which take the same object. A `{ height }` that meant
 * "cap it so the table scrolls" should become `{ maxHeight }`.
 */
export type DropdownPanelOptions = PanelSizeProps

/**
 * Per-part class overrides for `<mono-dropdown-table>` (mirrors `SelectCssClass`).
 * Each value is appended to the built-in class of that field part. Pass via the
 * `cssClass` prop / `css-class` attribute (an object, or a JSON string in HTML).
 */
export interface DropdownTableCssClass {
  /** The wrapper (grid stack). */
  root?: string
  /** The `<label>`. */
  label?: string
  /** The required `*` marker. */
  required?: string
  /** The clickable field box. */
  trigger?: string
  /** The value / placeholder text region. */
  value?: string
  /** The placeholder text (added on top of `value` when empty). */
  placeholder?: string
  /** The trailing actions wrapper (scroll buttons + clear / arrow). */
  actions?: string
  /** The clear (✕) button. */
  clear?: string
  /** The caret arrow. Shown in place of `clear` when there is no value. */
  arrow?: string
  /** One selection chip. */
  chip?: string
  /** A chip's label span. */
  chipLabel?: string
  /** A chip's remove button. */
  chipRemove?: string
  /** The clickable "+N more" chip. */
  moreChip?: string
  /** The one-line scrolling chip strip (`chip.behaviour: 'inline'` only). */
  chipStrip?: string
  /** The `‹` scroll-back button (inline only). */
  scrollPrev?: string
  /** The `›` scroll-forward button (inline only). */
  scrollNext?: string
  /** The helper / validation message line. */
  message?: string
}

/**
 * Props for `<mono-dropdown-table>`. The selection / value / display magic lives in
 * the bound {@link MonoDropdownController} (`monoDataDropdown`); the field presentation
 * mirrors `<mono-select>`.
 */
export interface DropdownTableProps extends VisibilityProps {
  /** The dropdown controller. Bind with `.prop`: `:data-dropdown.prop="dd"`. */
  dataDropdown?: MonoDropdownController
  'data-dropdown'?: MonoDropdownController
  /** Renamed — `:control-data-dropdown` / `:controlDataDropdown` alias `dataDropdown`. */
  controlDataDropdown?: MonoDropdownController
  'control-data-dropdown'?: MonoDropdownController

  /** Visual size of the field. */
  size?: DropdownTableSize
  /** Color theme applied to the field (focus ring / accent). */
  color?: DropdownTableColor
  /** Field style variant. */
  variant?: DropdownTableVariant

  /** Text label shown above the field. */
  label?: string
  /** Placeholder shown in the field when nothing is selected. */
  placeholder?: string
  /** Helper text shown below the field. */
  helperText?: string
  'helper-text'?: string

  /** Validation state controlling the field's appearance. */
  validationState?: DropdownTableValidationState
  'validation-state'?: DropdownTableValidationState
  /** Validation message shown below the field. */
  validationMessage?: string
  'validation-message'?: string
  /** Error message shown below the field (forces the invalid state). */
  errorMessage?: string
  'error-message'?: string
  /** Success message shown below the field (forces the valid state). */
  successMessage?: string
  'success-message'?: string

  /** Mark the field required (shows a `*` next to the label). */
  required?: boolean
  /** Disable the control (no open, no selection). */
  disabled?: boolean
  /** Read-only — the panel opens but selection can't change. */
  readonly?: boolean
  /** Show a clear (✕) button in the field when there is a value. */
  clearable?: boolean

  /** Multi-select — array value + chips. Falls back to the controller's `multiple`. */
  multiple?: boolean
  /**
   * Most rows the user can select (multi). Unset = unlimited. A pick past it is
   * rejected — the row stays enabled, the pick just does not land and a
   * `<mono-table-checkbox>` un-ticks itself. Overrides the controller's `max`;
   * `chip.max` overrides this. A `model-value` pushed in is never trimmed.
   */
  max?: number
  /**
   * Fewest rows the user can leave selected (multi). Unset = 0. At the floor the
   * chips lose their ✕, un-ticking is rejected and the clear button hides.
   * Overrides the controller's `min`; `chip.min` overrides this.
   */
  min?: number
  /**
   * Chips drawn before the rest collapse into a "+N more" chip (multi). Default
   * `5`; `0` = draw all. Applies in `flex` AND `inline` — in the strip the
   * "+N more" chip sits after the visible chips. `chip.maxVisible` overrides.
   */
  maxVisible?: number
  'max-visible'?: number
  /**
   * Collapse floor: while the selection is at or under this, every chip is drawn
   * regardless of `max-visible`. Unset = collapse as soon as `max-visible` is
   * exceeded. `chip.minVisible` overrides.
   */
  minVisible?: number
  'min-visible'?: number

  /**
   * Chip configuration — the `mono-chip` props to apply to every selection chip,
   * plus `behaviour` for the one-line scrolling layout. The same object
   * `<mono-tag-input>` takes.
   *
   * Bind it as a real property (`:chip.prop="{ behaviour: 'inline' }"`); a plain
   * `chip='{"size":"md"}'` JSON attribute also works for static HTML.
   */
  chip?: DropdownTableChipProps | string

  /** v-model value — scalar (single) or array (multi). Bind `:model-value` + `@change`. */
  modelValue?: unknown
  'model-value'?: unknown

  /**
   * Field sizing (the trigger + wrapper). A CSS length string (`"320px"`, `"80%"`) or
   * a number (px). Distinct from `dropdown`, which sizes the popup panel.
   */
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  'min-width'?: CssSizeValue
  maxWidth?: CssSizeValue
  'max-width'?: CssSizeValue
  minHeight?: CssSizeValue
  'min-height'?: CssSizeValue
  maxHeight?: CssSizeValue
  'max-height'?: CssSizeValue

  /** Sizes the popup panel only (independent of the field). Bind with `.prop`. */
  dropdown?: DropdownPanelOptions

  /**
   * Preferred side + cross-axis alignment of the panel, e.g. `"bottom-start"`
   * (default) or `"top-end"`. Same 12 values as `<mono-dropdown>`. With `flip`
   * left on this is only a *preference* — the panel still moves out of the way
   * of a viewport edge.
   */
  placement?: DropdownPlacement

  /**
   * Open on the opposite side when the preferred one lacks room — e.g. a field
   * near the bottom of the viewport drops UPWARD instead of being clipped.
   * Default `true`.
   */
  flip?: boolean

  /**
   * Slide the panel along the cross axis so it stays inside the viewport — e.g.
   * a field near the right edge keeps its full width instead of overflowing.
   * Default `true`.
   */
  shift?: boolean

  /** Gap between the field and the panel, in px. Default `6`. */
  offset?: number

  /**
   * Focus the panel's search box (a `<mono-table-search slot="search">`) as soon
   * as the panel opens, so the user can type straight away. Default `true`.
   * Turn it off when the focus would be unwelcome — e.g. on touch devices, where
   * focusing an input pops the virtual keyboard over the rows.
   */
  autoFocusSearch?: boolean
  'auto-focus-search'?: boolean

  /**
   * Exempt this dropdown from every automatic close — clicking or focusing
   * anything outside it, which includes opening another one. Not a lock: its own
   * trigger, Escape and picking a row still close it.
   */
  stayOpen?: boolean
  'stay-open'?: boolean
  stayopen?: boolean

  /** Per-part class overrides. Object, or a JSON string via the `css-class` attribute. */
  cssClass?: DropdownTableCssClass
  cssclass?: DropdownTableCssClass
  'css-class'?: DropdownTableCssClass | string
  /** A single class added to the root (the string form of `css-class`). */
  cssClassName?: string
}

/** `detail` of the `change` event `<mono-dropdown-table>` emits on every selection change. */
export interface DropdownTableChangeEventDetail {
  /** The new value — a scalar (single) or an array (multiple). */
  modelValue: unknown
  value: unknown
  /** The selected rows, resolved: `{ key, text, data }` each. */
  selectedItems: Array<MonoDropdownItem>
}

export type DropdownTableChangeEvent = CustomEvent<DropdownTableChangeEventDetail>

/** Events emitted by `<mono-dropdown-table>` (feeds the generated Vue types). */
export interface DropdownTableEvents {
  // The plain name — what a template listens to.
  change: DropdownTableChangeEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-change': DropdownTableChangeEvent
  mnoChange: DropdownTableChangeEvent
}
