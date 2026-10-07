// @unocss-include

import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { applyProps, detachEventHandlers } from '../../composables/element-props'
import { applyVisibility, type MonoVisibleType } from '../../composables/visibility'
import type { MonoFormController, MonoFormListEntry } from './form-types.js'

/** Public surface added by the form-control mixin. */
export declare class MonoFormControlCoreInterface {
  dataForm?: MonoFormController
  keyForm?: string
  visible: boolean
  visibleType: MonoVisibleType
  protected _formOff?: () => void
  protected _syncFromForm(): void
  /** Publish resolved options onto `form.items()[key].list` — list controls only. */
  protected _publishList(entries: MonoFormListEntry[]): void
}

/**
 * `MonoFormControlCore` — the element half of {@link monoForm}.
 *
 * Mirrors `table/table-controller-core.ts`: a `.prop`-bound controller
 * (`attribute: false`), hybrid aliases so `:data-form` / `:dataForm` /
 * `dataform` all land, and a subscribe lifecycle that re-syncs on notify. On top
 * of that it does three things the table base doesn't need:
 *
 * 1. **Reports changes.** Listens to its own `mno-input` / `mno-change` and
 *    pushes them into the controller with the matching timing (`live` /
 *    `change`), which is what drives the rules.
 * 2. **Applies state.** On every notify it writes the form's value, validation
 *    and merged props onto itself — assigning ONLY when the value differs, so an
 *    element updating itself can't feed back into another notify.
 * 3. **Lets the form win.** The controller owns the value, so it overwrites a
 *    local `:model-value`; `inputs[key].props` is merged last by the controller and so
 *    beats both the `setProp()` method and anything the template set.
 *
 * SSR-safe: `dataForm` can't cross Declarative Shadow DOM, so on the server this
 * is inert and the element renders its normal shell.
 */
export const MonoFormControlCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoFormControlCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)
      // `visible` is deliberately absent — it is already lowercase, so aliasing
      // it would define `visible` in terms of itself and recurse forever.
      defineHybridPropAliases(this, ['dataForm', 'keyForm', 'visibleType'])
      // Renamed controller binding — `:control-form` / `:controlForm` alias the
      // canonical `dataForm`.
      defineHybridPropAlias(this, 'controlForm', 'dataForm')
    }

    /** The form controller (bind with `.prop`: `:data-form="form"`). */
    @property({ attribute: false })
    dataForm?: MonoFormController

    /**
     * Which field in the form this control is.
     *
     * Reflected: the hybrid aliases make `'key-form' in el` true, so Vue sets it
     * as a PROPERTY and no attribute would otherwise reach the DOM — leaving
     * nothing to inspect in devtools or select in CSS/tests.
     */
    @property({ type: String, attribute: 'key-form', reflect: true })
    keyForm?: string

    /**
     * Whether the control is shown. Purely presentational — a hidden field keeps
     * its value and its rules still run, so a hidden `required` field can still
     * fail `form.validate()`. The controller knows nothing about this prop; it
     * rides in through `setProp()` like any other.
     */
    @property({ converter: booleanStringConverter })
    visible = true

    /** How it hides: `display: none` (default) or `visibility: hidden`. */
    @property({ attribute: 'visible-type' })
    visibleType: MonoVisibleType = 'none'

    protected _formOff?: () => void
    private _formUnregister?: () => void
    /** Set while writing form state onto ourselves, so our own events don't echo. */
    private _applying = false

    override connectedCallback(): void {
      super.connectedCallback()
      this._bindForm()
      this.addEventListener('mno-input', this._onFormInput as EventListener)
      this.addEventListener('mno-change', this._onFormChange as EventListener)
    }

    override disconnectedCallback(): void {
      this.removeEventListener('mno-input', this._onFormInput as EventListener)
      this.removeEventListener('mno-change', this._onFormChange as EventListener)
      this._unbindForm()
      super.disconnectedCallback()
    }

    /**
     * Re-bind when the controller or key arrives — Vue assigns `.prop` bindings
     * after construction, so `connectedCallback` alone is too early.
     *
     * This hooks `update()`, NOT `willUpdate()`: most component cores override
     * `willUpdate` without chaining `super`, so a `willUpdate` here would
     * silently never run. `updated()` is out for the same reason — `date-core`
     * overrides it without calling `super.updated()`. Of the ten form controls
     * only `dropdown-table-core` overrides `update()`, and it does chain `super`.
     */
    protected override update(changed: Map<string, unknown>): void {
      if (changed.has('dataForm') || changed.has('keyForm')) this._bindForm()
      this._applyVisibility()
      super.update(changed)
    }

    /**
     * Push `visible` / `visibleType` onto the host's inline style.
     *
     * Runs on every update, not just when the two props change: the style lives
     * on the host, which nothing else here owns, so re-asserting it is cheap and
     * survives anything that resets it.
     */
    private _applyVisibility(): void {
      // Under `nuxt-ssr-lit` a boolean prop can arrive as `''` server-side,
      // which would read as "hidden" — same coercion the shadow builds carry.
      const visible =
        typeof this.visible === 'string'
          ? booleanStringConverter.fromAttribute(this.visible)
          : this.visible !== false
      const type = this.visibleType === 'invisible' ? 'invisible' : 'none'
      applyVisibility(this as unknown as HTMLElement, visible, type)
    }

    private _bindForm(): void {
      this._unbindForm()
      const form = this.dataForm
      const key = this.keyForm
      if (!form || !key) return
      this._formUnregister = form._register(key, this)
      this._formOff = form.subscribe(() => this._syncFromForm())
      // Deferred: the first sync writes reactive props, and doing that inside
      // the update cycle would trip Lit's change-in-update warning. Later syncs
      // arrive via the controller's own (already microtask-coalesced) notify.
      if (typeof queueMicrotask === 'function') queueMicrotask(() => this._syncFromForm())
      else this._syncFromForm()
    }

    private _unbindForm(): void {
      this._formOff?.()
      this._formOff = undefined
      this._formUnregister?.()
      this._formUnregister = undefined
      // The old form's `props.on*` listeners leave with it, so a re-bind to
      // another form cannot report to both.
      detachEventHandlers(this)
    }

    /**
     * Publish this control's RESOLVED options onto `form.items()[key].list`, so a `slot="list"`
     * can loop them.
     *
     * A list component calls this from its render path, so it fires on every render — the
     * controller's identity guard is what stops that becoming a notify loop, and it is why the
     * caller must hand over a NEW array only when the rows actually moved.
     *
     * A control with no list never calls it, and its `list` stays `[]`.
     */
    protected _publishList(entries: MonoFormListEntry[]): void {
      const form = this.dataForm
      const key = this.keyForm
      if (!form?._reportList || !key) return

      form._reportList(key, entries)
    }

    private _valueOf(e: Event): unknown {
      const detail = (e as CustomEvent<{ modelValue?: unknown; value?: unknown }>).detail
      if (detail && typeof detail === 'object') {
        if ('modelValue' in detail) return detail.modelValue
        if ('value' in detail) return detail.value
      }
      return (this as unknown as { modelValue?: unknown }).modelValue
    }

    // The originating CustomEvent is forwarded, not just its value — watchers
    // read it back as `event` / `peerEvent`.
    private _onFormInput = (e: Event): void => {
      if (this._applying) return
      const form = this.dataForm
      const key = this.keyForm
      if (!form || !key) return
      form._report(key, this._valueOf(e), 'live', e)
    }

    private _onFormChange = (e: Event): void => {
      if (this._applying) return
      const form = this.dataForm
      const key = this.keyForm
      if (!form || !key) return
      form._report(key, this._valueOf(e), 'change', e)
    }

    /**
     * Pull value + validation + props from the controller onto this element.
     * Every write is guarded by an equality check so a sync can't trigger a
     * further update cycle.
     */
    protected _syncFromForm(): void {
      const form = this.dataForm
      const key = this.keyForm
      if (!form || !key) return
      const item = form.items()[key]
      if (!item) return

      const self = this as unknown as Record<string, unknown>
      let changed = false
      this._applying = true
      try {
        if (!Object.is(self.modelValue, item.currentValue)) {
          self.modelValue = item.currentValue
          changed = true
        }

        // Validation only lands on controls that actually render it; checkbox /
        // radio / switch have no validation props today, so this is a no-op there.
        if ('validationState' in self) {
          const nextState = item.validate.success ? 'default' : 'invalid'
          if (self.validationState !== nextState) {
            self.validationState = nextState
            changed = true
          }
          const nextMessage = item.validate.success ? '' : item.validate.message
          if (self.validationMessage !== nextMessage) {
            self.validationMessage = nextMessage
            changed = true
          }
        }

        if (applyProps(this, form._propsFor(key))) changed = true
      } finally {
        this._applying = false
      }
      // Re-render only when this sync wrote something. It used to be unconditional, so EVERY form
      // notify re-rendered EVERY bound control, and each re-render re-ran its list publish
      // (`_syncListEntries` → `_reportList` → notify): a control whose entries were not stable
      // render-to-render (primitive rows are re-wrapped each time) turned that into an endless
      // notify loop the moment its panel opened. The property writes above schedule their own
      // update through Lit, so nothing is lost.
      if (changed) this.requestUpdate()
    }
  }

  return MonoFormControlCoreClass as unknown as Constructor<MonoFormControlCoreInterface> & T
}
