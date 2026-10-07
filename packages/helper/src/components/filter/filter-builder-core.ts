// @unocss-include

import { LitElement, html, isServer, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'

import { OPERATOR_ARITY, operatorsFor } from './filter-operators.js'
import { splitMulti } from './filter-odata.js'
import type {
  MonoFilterController,
  MonoFilterDataType,
  MonoFilterGroup,
  MonoFilterGroupOperator,
  MonoFilterNode,
  MonoFilterOperator,
  MonoFilterRule,
  MonoFilterSize,
} from './filter-types.js'
import { defineHybridPropAlias, defineHybridPropAliases, type Constructor } from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event.js'
import { buildSizeStyle, type CssSizeValue } from '../../composables/css-size'
import { applyProps, detachEventHandlers } from '../../composables/element-props'

/** Per-build icon hooks the core delegates to. */
export type FilterIconName = 'nested' | 'trash' | 'plus'

/** Public surface added by the filter-builder core mixin. */
export declare class MonoFilterBuilderCoreInterface extends LitElement {
  dataFilter?: MonoFilterController
  size: MonoFilterSize
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue
  protected renderIcon(name: FilterIconName): TemplateResult
  /** Pull `controlMonoFilterBuilder({ props })` onto this element. */
  protected _applyControllerProps(): void
}

const GROUP_OPS: MonoFilterGroupOperator[] = ['and', 'or', 'notAnd', 'notOr']

/**
 * `MonoFilterBuilderCore` — render-mode-agnostic logic for `mono-filter-builder`.
 *
 * Renders the controller's node tree as nested inline rows:
 *
 * ```
 * Match [any ▾] of the following rules:
 *   | field ▾ | operator ▾ | value | ⑃ | 🗑 |
 * ```
 *
 * Per repo convention it renders **native** `<select>` / `<input>` carrying
 * its OWN control classes — no component here embeds another `mono-*`
 * element (`mono-table-search` set that precedent), so the controls match the rest
 * of the library without a cross-element dependency.
 */
export const MonoFilterBuilderCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoFilterBuilderCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)
      // camelCase only — an already-lowercase name self-aliases and recurses.
      defineHybridPropAliases(this, [
        'dataFilter',
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
      ])
      // Renamed controller binding — `:control-filter-builder` /
      // `:controlFilterBuilder` alias the canonical `dataFilter`.
      defineHybridPropAlias(this, 'controlFilterBuilder', 'dataFilter')
    }

    /** The controller, bound with `:data-filter.prop` / `:dataFilter`. */
    @property({ attribute: false })
    dataFilter?: MonoFilterController

    /**
     * Visual size of the inner controls. Maps to the same theme tokens
     * `mono-input` / `mono-button` use, so `size="xs"` makes the field selects,
     * inputs and buttons `xs` too. Default `sm`.
     */
    @property({ type: String })
    size: MonoFilterSize = 'sm'

    /** Builder width (CSS length or px number). */
    @property({ type: String })
    width?: CssSizeValue

    /** Builder height — when bounded, the rules scroll between pinned chrome. */
    @property({ type: String })
    height?: CssSizeValue

    @property({ attribute: 'min-width', type: String })
    minWidth?: CssSizeValue

    @property({ attribute: 'max-width', type: String })
    maxWidth?: CssSizeValue

    @property({ attribute: 'min-height', type: String })
    minHeight?: CssSizeValue

    /** Caps the builder height so a long rule list scrolls instead of growing. */
    @property({ attribute: 'max-height', type: String })
    maxHeight?: CssSizeValue

    /** Bumped on every controller notify to force a re-render. */
    @state() private _tick = 0

    private _off?: () => void

    override connectedCallback(): void {
      super.connectedCallback()
      this._subscribe()
    }

    override disconnectedCallback(): void {
      this._off?.()
      this._off = undefined
      super.disconnectedCallback()
    }

    override willUpdate(changed: Map<string, unknown>): void {
      // The controller arrives via `.prop` after the first render.
      if (changed.has('dataFilter')) this._subscribe()
      // Chain, or mixins composed below this one lose their `willUpdate`.
      // @ts-ignore — the generic mixin base may not declare it, LitElement does.
      super.willUpdate?.(changed)
    }

    /**
     * Drive the apply from `update()` as well as `_subscribe()` — every render
     * reaches here, so a controller that arrives late (or a `setProps` that
     * lands between subscriptions) can't be missed. This is the lesson
     * `table-controller-core` records: hanging the apply off `_subscribe` alone
     * silently skips anything that overrides it.
     */
    protected override update(changed: Map<string, unknown>): void {
      this._scheduleApplyProps()
      super.update(changed)
    }

    private _subscribe(): void {
      if (isServer) return
      this._off?.()
      detachEventHandlers(this)
      this._off = this.dataFilter?.subscribe(() => {
        this._tick += 1
        this._scheduleApplyProps()
        this._emitChange()
      })
      this._scheduleApplyProps()
    }

    private _applyQueued = false

    /**
     * Deferred + de-duplicated: the apply writes reactive props, and doing that
     * inside the update cycle would trip Lit's change-in-update warning.
     */
    private _scheduleApplyProps(): void {
      if (isServer) return
      if (this._applyQueued) return
      if (typeof queueMicrotask !== 'function') {
        this._applyControllerProps()
        return
      }
      this._applyQueued = true
      queueMicrotask(() => {
        this._applyQueued = false
        this._applyControllerProps()
      })
    }

    /**
     * Pull `controlMonoFilterBuilder({ props })` onto this element, so the
     * template needs nothing but the controller binding.
     *
     * The CONTROLLER WINS for keys it declares (matching `monoDataGrid` and
     * `monoForm`); keys it doesn't mention are left to whatever the template set.
     * `applyProps` supplies the skip-undefined, read-only and equality guards, so
     * a sync can neither throw nor schedule another update cycle.
     *
     * `?.props` is optional-called on purpose: a controller built before this
     * option existed simply contributes nothing.
     */
    protected _applyControllerProps(): void {
      applyProps(this, this.dataFilter?.props?.())
    }

    private _emitChange(): void {
      const ctrl = this.dataFilter
      if (!ctrl) return
      dispatchMonoEvent(this, 'change', {
        filter: ctrl.changed(),
        array: ctrl.changed({ type: 'array' }),
        string: ctrl.changed({ type: 'string' }),
      })
    }

    /** Internal icon — light: UnoCSS classes; shadow: inline SVG. */
    protected renderIcon(_name: FilterIconName): TemplateResult {
      return html``
    }

    private get _texts() {
      return this.dataFilter?.texts
    }

    private _dataType(field: string): MonoFilterDataType {
      return this.dataFilter?.fields.find((f) => f.field === field)?.dataType ?? 'string'
    }

    /**
     * One `<option>` whose selection is bound as a **property**.
     *
     * Binding `.value` on the `<select>` instead is unreliable here: an operator
     * list changes in the SAME render as the value it should show (picking a number
     * field swaps the whole option set), and the assignment lands before the new
     * options exist — leaving the browser on a stale `selectedIndex`. Setting
     * `.selected` per option moves `selectedIndex` after the options are in place.
     */
    private _option(value: string, label: string, current: string): TemplateResult {
      return html`<option value=${value} .selected=${value === current}>${label}</option>`
    }

    // ── value cell ───────────────────────────────────────────────────────────
    /**
     * The value editor for a rule. Arity decides the shape: `0` disables the cell
     * (the blank checks need no operand), `2` renders a from/to pair, `many` takes
     * comma-separated entry, and a field with `values` renders a select.
     */
    private _renderValue(rule: MonoFilterRule): TemplateResult {
      const t = this._texts
      const arity = OPERATOR_ARITY[rule.operator]
      const dt = this._dataType(rule.field)
      const def = this.dataFilter?.fields.find((f) => f.field === rule.field)
      const nativeType = dt === 'number' ? 'number' : dt === 'date' ? 'date' : dt === 'datetime' ? 'datetime-local' : 'text'
      const cls = 'mono-filter-control mono-filter-value'

      if (arity === 0) {
        return html`<input class=${cls} mono-filter-control mono-filter-value disabled placeholder="—" aria-label="No value needed" />`
      }

      if (def?.values?.length) {
        return html`
          <select
            class=${cls} mono-filter-control mono-filter-value
            @change=${(e: Event) =>
              this.dataFilter?.updateRule(rule.id, { value: (e.target as HTMLSelectElement).value })}
          >
            ${this._option('', t?.valuePlaceholder ?? '', String(rule.value ?? ''))}
            ${def.values.map((v) =>
              this._option(String(v.value), v.label ?? String(v.value), String(rule.value ?? '')),
            )}
          </select>
        `
      }

      if (dt === 'boolean') {
        return html`
          <select
            class=${cls} mono-filter-control mono-filter-value
            @change=${(e: Event) =>
              this.dataFilter?.updateRule(rule.id, { value: (e.target as HTMLSelectElement).value })}
          >
            ${this._option('', t?.valuePlaceholder ?? '', String(rule.value ?? ''))}
            ${this._option('true', 'true', String(rule.value ?? ''))}
            ${this._option('false', 'false', String(rule.value ?? ''))}
          </select>
        `
      }

      if (arity === 2) {
        const pair = Array.isArray(rule.value) ? rule.value : ['', '']
        const setAt = (idx: number, v: string): void => {
          const next = [pair[0] ?? '', pair[1] ?? '']
          next[idx] = v
          this.dataFilter?.updateRule(rule.id, { value: next })
        }
        return html`
          <span class="mono-filter-range" mono-filter-range>
            <input
              class=${cls} mono-filter-control mono-filter-value
              type=${nativeType}
              .value=${String(pair[0] ?? '')}
              @input=${(e: Event) => setAt(0, (e.target as HTMLInputElement).value)}
            />
            <input
              class=${cls} mono-filter-control mono-filter-value
              type=${nativeType}
              .value=${String(pair[1] ?? '')}
              @input=${(e: Event) => setAt(1, (e.target as HTMLInputElement).value)}
            />
          </span>
        `
      }

      const shown = Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value ?? '')
      return html`
        <input
          class=${cls} mono-filter-control mono-filter-value
          type=${arity === 'many' ? 'text' : nativeType}
          .value=${shown}
          placeholder=${arity === 'many' ? t?.multiValuePlaceholder ?? '' : t?.valuePlaceholder ?? ''}
          @input=${(e: Event) => {
            const raw = (e.target as HTMLInputElement).value
            this.dataFilter?.updateRule(rule.id, {
              value: arity === 'many' ? splitMulti(raw) : raw,
            })
          }}
        />
      `
    }

    // ── one rule row ─────────────────────────────────────────────────────────
    private _renderRule(rule: MonoFilterRule): TemplateResult {
      const ctrl = this.dataFilter
      const t = this._texts
      const ops = operatorsFor(this._dataType(rule.field))
      return html`
        <div class="mono-filter-row" mono-filter-row data-rule=${rule.id}>
          <select
            class="mono-filter-control mono-filter-field" mono-filter-control mono-filter-field
            @change=${(e: Event) =>
              ctrl?.updateRule(rule.id, { field: (e.target as HTMLSelectElement).value })}
          >
            ${ctrl?.fields.map((f) => this._option(f.field, f.caption ?? f.field, rule.field))}
          </select>

          <select
            class="mono-filter-control mono-filter-op" mono-filter-control mono-filter-op
            @change=${(e: Event) =>
              ctrl?.updateRule(rule.id, {
                operator: (e.target as HTMLSelectElement).value as MonoFilterOperator,
              })}
          >
            ${ops.map((op) => this._option(op, t?.[op] ?? op, rule.operator))}
          </select>

          <span class="mono-filter-value-cell" mono-filter-value-cell>${this._renderValue(rule)}</span>

          <button
            type="button"
            class="mono-filter-icon-btn" mono-filter-icon-btn
            title=${t?.addNested ?? ''}
            aria-label=${t?.addNested ?? ''}
            @click=${() => ctrl?.nest(rule.id)}
          >
            ${this.renderIcon('nested')}
          </button>
          <button
            type="button"
            class="mono-filter-icon-btn danger" mono-filter-icon-btn mono-danger
            title=${t?.remove ?? ''}
            aria-label=${t?.remove ?? ''}
            @click=${() => ctrl?.remove(rule.id)}
          >
            ${this.renderIcon('trash')}
          </button>
        </div>
      `
    }

    // ── a group (the root renders headerless-but-same) ───────────────────────
    private _renderGroup(group: MonoFilterGroup, level: number): TemplateResult {
      const ctrl = this.dataFilter
      const t = this._texts
      const isRoot = level === 0
      return html`
        <div class="mono-filter-group" mono-filter-group data-group=${group.id} style=${`--_mono-filter-level:${level}`}>
          <div class="mono-filter-group-head" mono-filter-group-head>
            <span class="mono-filter-match" mono-filter-match>${t?.matchPrefix}</span>
            <select
              class="mono-filter-control mono-filter-group-op" mono-filter-control mono-filter-group-op
              @change=${(e: Event) =>
                ctrl?.setGroupOperator(
                  group.id,
                  (e.target as HTMLSelectElement).value as MonoFilterGroupOperator,
                )}
            >
              ${GROUP_OPS.map((op) => this._option(op, t?.[op] ?? op, group.operator))}
            </select>
            <span class="mono-filter-match" mono-filter-match>${t?.matchSuffix}</span>
            ${isRoot
              ? nothing
              : html`
                  <span class="mono-filter-group-actions" mono-filter-group-actions>
                    <button
                      type="button"
                      class="mono-filter-icon-btn" mono-filter-icon-btn
                      title=${t?.addRule ?? ''}
                      @click=${() => ctrl?.addRule(group.id)}
                    >
                      ${this.renderIcon('plus')}
                    </button>
                    <button
                      type="button"
                      class="mono-filter-icon-btn danger" mono-filter-icon-btn mono-danger
                      title=${t?.remove ?? ''}
                      @click=${() => ctrl?.remove(group.id)}
                    >
                      ${this.renderIcon('trash')}
                    </button>
                  </span>
                `}
          </div>

          <div class="mono-filter-children" mono-filter-children>
            ${group.children.map((child) => this._renderNode(child, level + 1))}
            ${isRoot && !group.children.length
              ? html`<div class="mono-filter-empty" mono-filter-empty>${t?.emptyHint}</div>`
              : nothing}
          </div>
        </div>
      `
    }

    private _renderNode(node: MonoFilterNode, level: number): TemplateResult {
      return node.kind === 'group' ? this._renderGroup(node, level) : this._renderRule(node)
    }

    protected override render(): TemplateResult {
      const ctrl = this.dataFilter
      if (!ctrl) return html``
      const t = ctrl.texts
      void this._tick // reactive dependency — re-render on controller notify
      return html`
        <div
          class="mono-filter ${this.size}"
          mono-filter-builder
          mono-size=${this.size === 'sm' ? nothing : this.size}
          style=${styleMap(buildSizeStyle(this))}
        >
          ${ctrl.actions
            ? html`
                <div class="mono-filter-actions" mono-filter-actions>
                  <button
                    type="button"
                    class="mono-filter-btn primary" mono-filter-btn
                    @click=${() =>
                      dispatchMonoEvent(this, 'apply', {
                        filter: ctrl.changed(),
                        array: ctrl.changed({ type: 'array' }),
                        string: ctrl.changed({ type: 'string' }),
                      })}
                  >
                    ${t.apply}
                  </button>
                  <button
                    type="button"
                    class="mono-filter-btn ghost" mono-filter-btn mono-variant="ghost"
                    @click=${() => {
                      ctrl.clear()
                      dispatchMonoEvent(this, 'clear', { filter: null })
                    }}
                  >
                    ${t.clear}
                  </button>
                </div>
              `
            : nothing}
          ${this._renderGroup(ctrl.tree, 0)}
          <div class="mono-filter-add" mono-filter-add>
            <button type="button" class="mono-filter-link" mono-filter-link @click=${() => ctrl.addRule()}>
              ${t.addRule}
            </button>
            <button type="button" class="mono-filter-link" mono-filter-link @click=${() => ctrl.addGroup()}>
              ${t.addGroup}
            </button>
          </div>
        </div>
      `
    }
  }

  return MonoFilterBuilderCoreClass as unknown as Constructor<MonoFilterBuilderCoreInterface> & T
}
