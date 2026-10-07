// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import {
  MonoTableControllerCore,
  type MonoTableControllerCoreInterface,
} from './table-controller-core.js'
import type { MonoCheckMode } from './mono-data-grid.js'
import type {
  CheckboxColor,
  CheckboxCssClass,
  CheckboxSize,
} from '../checkbox/checkbox-types.js'
import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'

/** Which job this checkbox does. */
export type TableCheckboxType = 'all' | 'single'

/** `detail` of the `mno-change` event `<mono-table-checkbox>` emits. */
export interface TableCheckboxChangeEventDetail<T = any> {
  /** The state it moved TO. */
  checked: boolean
  /** The row, for `type="single"`; `null` for the select-all. */
  item: T | null
  /** How many rows are selected after the change (a drain fills in later). */
  count: number
}

export type TableCheckboxChangeEvent<T = any> = CustomEvent<TableCheckboxChangeEventDetail<T>>

/** Events emitted by `<mono-table-checkbox>` (feeds the generated Vue types). */
export interface TableCheckboxEvents {
  // The plain names — what a template listens to (`@change`, `@click`, …).
  change: TableCheckboxChangeEvent
  // Kept as aliases for existing code: the `mno-` prefix and its camel twin.
  'mno-change': TableCheckboxChangeEvent
  mnoChange: TableCheckboxChangeEvent
}

/** Public surface added by the table-checkbox core mixin. */
export declare class MonoTableCheckboxCoreInterface extends MonoTableControllerCoreInterface {
  type: TableCheckboxType
  item?: unknown
  keyValue?: string | string[]
  mode: MonoCheckMode
  chunk: number
  size: CheckboxSize
  color: CheckboxColor
  disabled: boolean
  label: string
  /** Secondary line under the label. */
  sublabel: string
  /** The same as `sublabel`, kept for existing code. */
  description: string
  ariaLabelText?: string
  cssClass: CheckboxCssClass
  cssClassName: string
  /** The spinner shown mid-drain — the shadow build swaps in inline SVG. */
  protected _renderLoadingIcon(): TemplateResult
}

/**
 * `MonoTableCheckboxCore` — render-mode-agnostic logic for `mono-table-checkbox`,
 * a checkbox that knows about the grid.
 *
 * Two jobs, chosen with `type`:
 * - **`type="single"`** (default) — one row's checkbox. Give it the row with
 *   `:item.prop="row"`; it reads and writes `table.check()`.
 * - **`type="all"`** — the select-all. In `mode="all"` (default) checking it
 *   drains the SOURCE in `chunk`-sized requests and selects every row the active
 *   search/filter matches — including rows never fetched for display, which is the
 *   point of the component. `mode="per-page"` selects the loaded page with no
 *   request at all. **Every checkbox on the grid is disabled while a drain runs**
 *   (the selection is still filling in), but only the select-all shows the spinner.
 *
 * ```html
 * <th><mono-table-checkbox type="all" :control-table.prop="table" key-value="Id" /></th>
 * <td><mono-table-checkbox :control-table.prop="table" :item.prop="row" /></td>
 * ```
 *
 * The `<th>` one canNOT render the `<td>` ones — the library never renders your
 * `<tbody>` — so both are declared; the row one needs only `:item.prop`.
 *
 * **It renders `mono-checkbox`'s markup and classes rather than embedding the
 * element**, so `size` / `color` / `disabled` / `label` behave identically and the
 * whole size × color matrix comes from `checkbox.css`. Same trade `mono-table-search`
 * makes with `mono-input` — and embedding a light `<mono-*>` inside another light
 * component would steal the parent's Lit-rendered children.
 *
 * SSR-safe: the controller is undefined on the server, so it renders an unchecked
 * shell and touches no DOM.
 */
export const MonoTableCheckboxCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoTableCheckboxCoreClass extends MonoTableControllerCore(superClass) {
    constructor(...args: any[]) {
      super(...args)
      // `type`, `item`, `mode`, `chunk`, `size`, `color`, `label`, `sublabel`
      // and `disabled` are already lowercase — aliasing one would define it in
      // terms of itself and recurse forever.
      defineHybridPropAliases(this, ['keyValue', 'ariaLabelText', 'cssClass'])
      // `description` is the other name of `sublabel` (one storage), as on
      // mono-checkbox — so `props: { checkbox: { description } }` keeps working.
      defineHybridPropAlias(this, 'description', 'sublabel')
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [...base, 'description']
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)
      if (name === 'description' && oldValue !== newValue) this.sublabel = newValue ?? ''
    }

    /** Reads `monoDataGrid({ props: { checkbox } })`. */
    protected override _propsSlot = 'checkbox' as const

    /** `'single'` (a row) or `'all'` (the select-all). */
    @property({ type: String })
    type: TableCheckboxType = 'single'

    /** The row this checkbox represents — `type="single"` only. Bind with `.prop`. */
    @property({ attribute: false })
    item?: unknown

    /**
     * Field(s) `table.check().getAll()` projects each selected row down to.
     * Path-aware and shape-preserving: `['Company.Name', 'Transaction.[*].Id']`
     * gives `{ Company: { Name }, Transaction: [{ Id }] }`. Omit for whole rows.
     *
     * An attribute may carry one field (`key-value="Id"`) or a JSON array; a list
     * is normally bound with `.prop` or declared once in `props.checkbox`.
     */
    @property({ attribute: 'key-value' })
    keyValue?: string | string[]

    /** `'all'` drains the server; `'per-page'` selects the loaded page. */
    @property({ type: String })
    mode: MonoCheckMode = 'all'

    /** Rows per request while draining in `mode="all"`. */
    @property({ type: Number })
    chunk = 100

    @property({ type: String })
    size: CheckboxSize = 'md'

    @property({ type: String })
    color: CheckboxColor = 'primary'

    @property({ converter: booleanStringConverter })
    disabled = false

    @property({ type: String })
    label = ''

    /** Secondary line under the label. */
    @property({ type: String })
    sublabel = ''

    /** The same as `sublabel` — an instance accessor (see constructor). */
    declare description: string

    @property({ attribute: 'aria-label-text' })
    ariaLabelText?: string

    /** Per-part class overrides — the same keys as `mono-checkbox`'s `cssClass`. */
    @property({ attribute: false })
    cssClass: CheckboxCssClass = {}

    /** Root-only class, from the `css-class` attribute. */
    @property({ attribute: 'css-class' })
    cssClassName = ''

    /** `keyValue` as a list — an attribute may hold JSON or a comma list. */
    private get _keys(): string[] | undefined {
      const raw = this.keyValue
      if (raw == null || raw === '') return undefined
      if (Array.isArray(raw)) return raw
      const text = String(raw).trim()
      if (text.startsWith('[')) {
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) return parsed
        } catch {
          /* fall through to the plain-string reading */
        }
      }
      return text.includes(',') ? text.split(',').map((s) => s.trim()).filter(Boolean) : [text]
    }

    /**
     * Push this element's config onto the shared selection state, so declaring
     * `key-value` once (on the select-all, or in `props.checkbox`) covers every
     * row checkbox. Undefined values are skipped by `configure`.
     */
    private _syncConfig(): void {
      this.dataGrid?.check?.().configure({
        keyValue: this._keys,
        mode: this.mode,
        chunk: this.chunk,
      })
    }

    protected override update(changed: Map<string, unknown>): void {
      this._syncConfig()
      super.update(changed)
    }

    protected override updated(changed: Map<string, unknown>): void {
      // @ts-ignore — the generic base may not declare `updated`.
      super.updated?.(changed)
      if (isServer || this.type !== 'single') return
      // Tint the whole row, using the class table.css already ships.
      const row = this.closest('tr')
      // the legacy class stays as an inert hook until 2.0; the attribute styles
      row?.classList.toggle('mono-table-row-selected', this._checked)
      if (this._checked) row?.setAttribute('mono-selected', '')
      else row?.removeAttribute('mono-selected')
    }

    /** Whether this box is ticked right now. */
    private get _checked(): boolean {
      const check = this.dataGrid?.check?.()
      if (!check) return false
      if (this.type === 'all') return check.allChecked
      return this.item == null ? false : check.isChecked(this.item as never)
    }

    /** The select-all shows mixed while only some rows are ticked. */
    private get _indeterminate(): boolean {
      if (this.type !== 'all') return false
      return this.dataGrid?.check?.().someChecked ?? false
    }

    /**
     * A `mode="all"` drain is running.
     *
     * **Every** checkbox bound to the grid goes inert while it lands, not just
     * the select-all that started it: the selection is still filling in, so a row
     * ticked mid-drain would be overwritten (or fight) the rows arriving behind
     * it. They all re-render because each one subscribes to the controller, and
     * the drain notifies on entry and exit.
     */
    private get _pending(): boolean {
      return this.dataGrid?.check?.().pending ?? false
    }

    /**
     * Whether THIS box shows the spinner. Only the select-all does: it is the one
     * the user acted on, and eight rows spinning in sympathy reads as eight
     * separate operations rather than one. The rows still go disabled — they are
     * just quietly inert.
     */
    private get _loading(): boolean {
      return this.type === 'all' && this._pending
    }

    private get _isDisabled(): boolean {
      return this.disabled || this._pending
    }

    protected _handleChange(event: Event): void {
      const input = event.target as HTMLInputElement
      const checked = input.checked
      const check = this.dataGrid?.check?.()

      if (!check) {
        // No controller bound — keep the DOM honest rather than lying about state.
        input.checked = false
        return
      }

      if (this.type === 'all') {
        if (!checked) check.clear()
        else if (this.mode === 'per-page') check.selectPage()
        // The drain is async: `pending` renders progress and the controller
        // notifies as it lands, so nothing is awaited here.
        else void check.selectAll()
      } else if (this.item != null) {
        check.toggle(this.item as never, checked)
      }

      // The store may have REJECTED the flip (a `max` / `min` on the selection).
      // The native box has already toggled itself, and Lit's `.checked=${…}`
      // will not rewrite a value it thinks is unchanged — so put the DOM back to
      // what the store says, synchronously, before anything paints. Not during a
      // `mode: 'all'` drain: the store only fills in as it lands, and the box is
      // inert (`pending`) until then anyway.
      const actual = check.pending ? checked : this._checked
      if (input.checked !== actual) input.checked = actual

      // Plain `change` is the checkbox's native change, decorated, in the light
      // build; synthesized in the shadow build where it cannot cross.
      dispatchMonoEvent<TableCheckboxChangeEventDetail>(
        this,
        'change',
        {
          checked: actual,
          item: this.type === 'all' ? null : (this.item ?? null),
          count: check.count(),
        },
        { sourceEvent: event },
      )

      this.requestUpdate()
    }

    /** `mono-checkbox`'s class recipe, so one stylesheet drives both elements. */
    private _cls(base: string, key: keyof CheckboxCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    private get _wrapperClasses(): string {
      return [
        'mono-checkbox',
        'mono-table-checkbox',
        this.color,
        this._loading ? 'is-loading' : '',
        this._isDisabled ? 'disabled' : '',
        this._checked ? 'mono-checkbox-checked' : '',
        this._indeterminate ? 'mono-checkbox-indeterminate' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    private _renderLabelBlock(): TemplateResult | typeof nothing {
      if (!this.label && !this.sublabel) return nothing
      return html`
        <span class=${this._cls('mono-checkbox-label', 'label')} mono-label>
          ${this.label
            ? html`<span class=${this._cls('mono-checkbox-label-text', 'labelText')} mono-label-text>${this.label}</span>`
            : nothing}
          ${this.sublabel
            ? html`<span class=${this._cls('mono-checkbox-description', 'description')} mono-description>${this.sublabel}</span>`
            : nothing}
        </span>
      `
    }

    /**
     * The mid-drain spinner. Light uses the global icon utility class; the shadow
     * build overrides this with inline SVG, which page-level CSS can't reach.
     */
    protected _renderLoadingIcon(): TemplateResult {
      return html`<span class="mono-icon i-mdi-loading mono-table-checkbox-spinner" aria-hidden="true"></span>`
    }

    protected override render(): TemplateResult {
      const checked = this._checked
      const indeterminate = this._indeterminate
      const loading = this._loading

      // `has-custom-icon` / `has-custom-indeterminate-icon` are checkbox.css's own
      // opt-outs for its `::before` tick and `::after` dash — set them so the
      // spinner is the only glyph in the box while the drain runs.
      const boxClasses = [
        this._cls('mono-checkbox-box', 'box'),
        this.size,
        loading ? 'has-custom-icon has-custom-indeterminate-icon' : '',
      ]
        .filter(Boolean)
        .join(' ')
      const ariaLabel =
        this.ariaLabelText || this.label || (this.type === 'all' ? 'Select all rows' : 'Select row')

      return html`
        <label
          class=${this._wrapperClasses}
          mono-checkbox
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-color=${this.color === 'primary' ? nothing : this.color}
          ?mono-checked=${checked}
          ?mono-indeterminate=${indeterminate}
          ?mono-disabled=${this._isDisabled}
          ?mono-loading=${loading}
        >
          <input
            class=${this._cls('mono-checkbox-input', 'input')}
            mono-input
            type="checkbox"
            .checked=${checked}
            .indeterminate=${indeterminate}
            ?disabled=${this._isDisabled}
            aria-checked=${indeterminate ? 'mixed' : String(checked)}
            aria-label=${ifDefined(ariaLabel)}
            aria-busy=${this._pending ? 'true' : 'false'}
            @change=${this._handleChange}
          />

          <span
            class=${boxClasses}
            mono-box
            ?mono-custom-icon=${loading}
            ?mono-custom-indeterminate-icon=${loading}
            aria-hidden="true"
          >
            ${loading ? this._renderLoadingIcon() : nothing}
          </span>

          ${this._renderLabelBlock()}
        </label>
      `
    }
  }

  return MonoTableCheckboxCoreClass as unknown as Constructor<MonoTableCheckboxCoreInterface> & T
}
