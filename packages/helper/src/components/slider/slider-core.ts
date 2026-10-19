// @unocss-include

import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  SliderSize,
  SliderColor,
  SliderType,
  SliderFill,
  SliderValueTooltip,
  SliderValidationState,
  SliderValue,
  SliderCssClass,
  SliderModelEventDetail,
} from './slider-types.js'
import {
  coerceNumbers,
  fromRatio,
  isStacked,
  markPoints,
  moveRun,
  moveThumb,
  nearestThumb,
  normalise,
  resolveScale,
  stepFrom,
  stripNoise,
  thumbBounds,
  toPercent,
  trackPieces,
  type SliderMarkPoint,
  type SliderPiece,
  type SliderScale,
} from './slider-math.js'
import { applyFormat, parseFormat, type InputFormat } from '../input/input-format.js'

import {
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { cssPart } from '../../composables/css-class'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { toCssSize, type CssSizeValue } from '../../composables/css-size'
import { MonoFormControlCore } from '../form/form-control-core.js'
import { FieldTooltipController, type FieldTooltipValue } from '../../composables/field-tooltip'

export type SliderSlotName = 'label' | 'helper'

/** Pixels a press must travel before a press between two thumbs becomes a segment drag. */
const SEGMENT_DRAG_THRESHOLD = 3

/**
 * `true` unless the attribute says `"false"` — for props that are ON by default (`show-value`),
 * where an ABSENT attribute must not read as off.
 */
const defaultOnConverter = {
  fromAttribute: (v: string | null) => (v === null ? true : booleanStringConverter.fromAttribute(v)),
}

/** A model that holds the same numbers in the same shape is not a change (Vue re-sends arrays). */
export function sliderValueHasChanged(value: unknown, old: unknown): boolean {
  if (value === old) return false
  const a = coerceNumbers(value)
  const b = coerceNumbers(old)
  if (!a || !b) return a !== b
  if (Array.isArray(value) !== Array.isArray(old)) return true
  return a.length !== b.length || a.some((n, i) => n !== b[i])
}

/** Public surface added by the core mixin (for typing the wrappers + tag map). */
export declare class MonoSliderCoreInterface {
  modelValue: SliderValue | string
  value: SliderValue | string
  min: number | string
  max: number | string
  step: number | string
  stops?: number[] | string
  minGap: number | string
  type: SliderType
  marks: boolean | unknown[] | string
  fill: SliderFill
  trackGap: number | string
  valueTooltip: SliderValueTooltip
  showValue: boolean
  valueSeparator: string
  formatDisplay?: InputFormat
  formatLocale?: string
  size: SliderSize
  color: SliderColor
  label: string
  helperText: string
  tooltip: FieldTooltipValue
  validationState: SliderValidationState
  validationMessage: string
  error: boolean
  errorMessage: string
  success: boolean
  successMessage: string
  disabled: boolean
  readonly: boolean
  required: boolean
  name: string
  ariaLabelText?: string
  width?: CssSizeValue
  height?: CssSizeValue
  cssClass: SliderCssClass
  cssClassName: string
  /** The thumb positions, always as a sorted array. */
  readonly values: number[]
  focus(options?: FocusOptions): void
  blur(): void

  protected _hasLabelSlotState: boolean
  protected _hasHelperSlotState: boolean
  protected readonly _sliderId: string
  protected readonly _messageId: string
  protected readonly _tooltip: FieldTooltipController
  protected readonly _resolvedValidationState: SliderValidationState
  protected readonly _hasLabel: boolean
  protected _cls(base: string, key: keyof SliderCssClass): string
  protected _renderLabel(): TemplateResult | typeof nothing
  protected _renderLabelText(): TemplateResult | string
  protected _renderMessage(): TemplateResult | typeof nothing
  protected _renderReadout(): TemplateResult
}

/**
 * `MonoSliderCore` — everything `mono-slider` does that does not depend on light vs shadow DOM:
 * props + hybrid aliases, the value maths (slider-math.ts), pointer + keyboard interaction,
 * events, form binding, and the shared `render()`. The label / message regions are hooks the
 * shadow build overrides with native `<slot>`s (the light build captures `slot="label|helper"`
 * children and drops them into `[data-mono-slot]` placeholders, like mono-input).
 *
 * Thumbs are `role="slider"` elements, not native range inputs: N thumbs on one track, blocking,
 * stops, gaps and segment drags are all beyond `<input type="range">`.
 */
export const MonoSliderCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoSliderCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)
      defineHybridPropAliases(this, [
        'modelValue',
        'minGap',
        'trackGap',
        'valueTooltip',
        'showValue',
        'valueSeparator',
        'formatDisplay',
        'formatLocale',
        'helperText',
        'validationState',
        'validationMessage',
        'errorMessage',
        'successMessage',
        'ariaLabelText',
        'cssClass',
      ])
      // `value` is the other name of `modelValue`.
      defineHybridPropAlias(this, 'value', 'modelValue')

      for (const alias of ['ariaLabel', 'aria-label', 'arialabel']) {
        Object.defineProperty(this, alias, {
          get: () => this.ariaLabelText,
          set: (v: unknown) => {
            this.ariaLabelText = v == null ? undefined : String(v)
          },
          configurable: true,
          enumerable: false,
        })
      }
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'value',
        'modelvalue',
        'mingap',
        'trackgap',
        'valuetooltip',
        'showvalue',
        'valueseparator',
        'formatdisplay',
        'format-display',
        'formatlocale',
        'helpertext',
        'validationstate',
        'validationmessage',
        'errormessage',
        'successmessage',
        'arialabel',
        'arialabeltext',
        'css-class',
        'cssclass',
      ]
    }

    override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
      super.attributeChangedCallback(name, oldValue, newValue)
      if (oldValue === newValue) return
      switch (name) {
        case 'value':
        case 'modelvalue':
          this.modelValue = newValue ?? ''
          return
        case 'mingap':
          this.minGap = newValue ?? 0
          return
        case 'trackgap':
          this.trackGap = newValue ?? 0
          return
        case 'valuetooltip':
          this.valueTooltip = (newValue ?? 'auto') as SliderValueTooltip
          return
        case 'showvalue':
          this.showValue = defaultOnConverter.fromAttribute(newValue)
          return
        case 'valueseparator':
          this.valueSeparator = newValue ?? ' – '
          return
        case 'formatdisplay':
        case 'format-display':
          // A function set through `.prop` is never overwritten by an attribute, and Vue's
          // stringified copy of that function is ignored (same guard as mono-input).
          if (typeof this.formatDisplay === 'function') return
          if (newValue && /^(?:async\s+)?(?:function|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(newValue.trim())) return
          this.formatDisplay = newValue ?? undefined
          return
        case 'formatlocale':
          this.formatLocale = newValue ?? undefined
          return
        case 'helpertext':
          this.helperText = newValue ?? ''
          return
        case 'validationstate':
          this.validationState = (newValue ?? 'default') as SliderValidationState
          return
        case 'validationmessage':
          this.validationMessage = newValue ?? ''
          return
        case 'errormessage':
          this.errorMessage = newValue ?? ''
          return
        case 'successmessage':
          this.successMessage = newValue ?? ''
          return
        case 'arialabel':
        case 'arialabeltext':
          this.ariaLabelText = newValue ?? undefined
          return
        case 'css-class':
        case 'cssclass':
          this.cssClassName = newValue ?? ''
          return
      }
    }

    // ── props ───────────────────────────────────────────────────────────

    /** Number (one thumb) or array (N thumbs); the shape you give is the shape you get back. */
    @property({ attribute: 'model-value', hasChanged: sliderValueHasChanged })
    modelValue: SliderValue | string = 0

    declare value: SliderValue | string

    @property()
    min: number | string = 0

    @property()
    max: number | string = 100

    @property()
    step: number | string = 1

    /** Discrete snap points (array, or a JSON / comma string from markup). Replaces `step`. */
    @property({ hasChanged: sliderValueHasChanged })
    stops?: number[] | string

    @property({ attribute: 'min-gap' })
    minGap: number | string = 0

    /** `vertical` runs bottom (min) → top (max). */
    @property({ type: String })
    type: SliderType = 'horizontal'

    /** `true` / a bare `marks` attribute = a tick per step (or stop); or a list of values / `{ value, label }`. */
    @property()
    marks: boolean | unknown[] | string = false

    @property({ type: String })
    fill: SliderFill = 'auto'

    @property({ attribute: 'track-gap' })
    trackGap: number | string = 0

    @property({ type: String, attribute: 'value-tooltip' })
    valueTooltip: SliderValueTooltip = 'auto'

    @property({ attribute: 'show-value', converter: defaultOnConverter })
    showValue = true

    @property({ type: String, attribute: 'value-separator' })
    valueSeparator = ' – '

    /** A pattern (`"{}%"`) or a function; shapes the readout, bubbles, mark labels, aria-valuetext. */
    @property({ attribute: false })
    formatDisplay?: InputFormat

    @property({ type: String, attribute: 'format-locale' })
    formatLocale?: string

    @property({ type: String })
    size: SliderSize = 'md'

    @property({ type: String })
    color: SliderColor = 'primary'

    @property({ type: String })
    label = ''

    @property({ type: String, attribute: 'helper-text' })
    helperText = ''

    /** The label's ⓘ (a mono-tooltip) — not the thumb bubble, which is `value-tooltip`. */
    @property()
    tooltip: FieldTooltipValue = null

    protected readonly _tooltip = new FieldTooltipController(this, () => this.tooltip)

    @property({ type: String, attribute: 'validation-state' })
    validationState: SliderValidationState = 'default'

    @property({ type: String, attribute: 'validation-message' })
    validationMessage = ''

    @property({ reflect: true, converter: booleanStringConverter })
    error = false

    @property({ type: String, attribute: 'error-message' })
    errorMessage = ''

    @property({ reflect: true, converter: booleanStringConverter })
    success = false

    @property({ type: String, attribute: 'success-message' })
    successMessage = ''

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    readonly = false

    @property({ reflect: true, converter: booleanStringConverter })
    required = false

    @property({ type: String })
    name = ''

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ type: String })
    width?: CssSizeValue

    /** Track length when vertical. */
    @property({ type: String })
    height?: CssSizeValue

    @property({ attribute: false })
    cssClass: SliderCssClass = {}

    @property({ type: String, attribute: 'css-class' })
    cssClassName = ''

    // ── state ───────────────────────────────────────────────────────────

    @state() protected _values: number[] = [0]
    /** The thumb drawn on top (last touched) — so a stack lifts the one you are moving. */
    @state() protected _active = 0
    @state() protected _dragging = -1
    @state() protected _hasLabelSlotState = false
    @state() protected _hasHelperSlotState = false

    protected _scale: SliderScale = resolveScale({})
    protected readonly _sliderId = `mono-slider-${Math.random().toString(36).slice(2)}`
    protected readonly _messageId = `${this._sliderId}-message`

    /** The live pointer gesture, if any. */
    private _gesture: null | {
      pointerId: number
      mode: 'thumb' | 'stack' | 'segment-pending' | 'segment'
      index: number
      run?: [number, number]
      stack?: [number, number]
      startX: number
      startY: number
      startRaw: number
      startValues: number[]
    } = null

    /** The thumb positions, always as a sorted array. */
    get values(): number[] {
      return this._values.slice()
    }

    // ── value resolution ────────────────────────────────────────────────

    protected override willUpdate(changed: Map<string, unknown>): void {
      const scaleKeys = ['min', 'max', 'step', 'stops', 'minGap']
      if (scaleKeys.some((k) => changed.has(k))) {
        this._scale = resolveScale({ min: this.min, max: this.max, step: this.step, stops: this.stops, minGap: this.minGap })
      }
      if (changed.has('modelValue') || scaleKeys.some((k) => changed.has(k))) {
        const raw = coerceNumbers(this.modelValue) ?? [this._scale.min]
        const next = normalise(raw, this._scale)
        if (next.length !== this._values.length || next.some((n, i) => n !== this._values[i])) {
          this._values = next
          if (this._active >= next.length) this._active = next.length - 1
        }
      }
      super.willUpdate?.(changed)
    }

    /** True when the model is (or was handed over as) a list — the shape we hand back. */
    protected get _isArrayModel(): boolean {
      const v = this.modelValue
      return Array.isArray(v) || (typeof v === 'string' && (v.trim().startsWith('[') || v.includes(',')))
    }

    protected _out(values: number[]): SliderValue {
      return this._isArrayModel || values.length > 1 ? values.slice() : values[0]
    }

    // ── formatting ──────────────────────────────────────────────────────

    /** A value as text, through `format-display` (pattern or function), padded like a commit. */
    protected _format(v: number): string {
      const raw = String(stripNoise(v))
      const fmt = this.formatDisplay
      if (!fmt) return raw
      if (typeof fmt === 'function') return String(fmt({ value: raw, type: 'slider', locale: this.formatLocale }) ?? '')
      const descriptor = parseFormat(fmt)
      return descriptor ? applyFormat(raw, descriptor, this.formatLocale, { pad: true }) : raw
    }

    protected get _readoutText(): string {
      return this._values.map((v) => this._format(v)).join(this.valueSeparator)
    }

    // ── geometry ────────────────────────────────────────────────────────

    protected get _vertical(): boolean {
      return this.type === 'vertical'
    }

    protected get _trackEl(): HTMLElement | null {
      return this.renderRoot.querySelector('[mono-slider-track]')
    }

    protected _thumbEl(i: number): HTMLElement | null {
      return this.renderRoot.querySelector(`[mono-slider-thumb][data-index="${i}"]`)
    }

    /** True when the slider is laid out right-to-left (horizontal only flips). */
    protected _isRtl(): boolean {
      if (this._vertical || typeof getComputedStyle === 'undefined') return false
      return getComputedStyle(this).direction === 'rtl'
    }

    /**
     * The unsnapped value under a pointer. A thumb's CENTRE travels from half a thumb in to half a
     * thumb short of the end (where a native range thumb sits), so the usable length is the track
     * minus one thumb.
     */
    protected _rawAt(event: PointerEvent): number {
      const rect = this._trackEl?.getBoundingClientRect()
      if (!rect) return this._scale.min
      const thumb = this._thumbEl(0)
      let ratio: number
      if (this._vertical) {
        const along = thumb?.offsetHeight ?? 0
        const usable = rect.height - along
        ratio = usable > 0 ? (rect.bottom - along / 2 - event.clientY) / usable : 0
      } else {
        const along = thumb?.offsetWidth ?? 0
        const usable = rect.width - along
        ratio = usable > 0 ? (event.clientX - rect.left - along / 2) / usable : 0
        if (this._isRtl()) ratio = 1 - ratio
      }
      return fromRatio(ratio, this._scale)
    }

    // ── committing ──────────────────────────────────────────────────────

    /**
     * Take `next` as the new value and announce it. `next === this._values` (identity — the maths
     * returns the same array when nothing moved) is a no-op for `input`.
     */
    protected _commit(next: number[], index: number, kind: 'input' | 'change', sourceEvent?: Event, oldValues?: number[]): void {
      if (kind === 'input' && next === this._values) return
      const old = oldValues ?? this._values
      this._values = next
      const out = this._out(next)
      const oldOut = this._out(old)
      this.modelValue = out
      const detail: SliderModelEventDetail = {
        modelValue: out,
        currentValue: out,
        oldValue: oldOut,
        value: out,
        values: next.slice(),
        index,
        name: this.name || undefined,
        sourceEvent,
      }
      dispatchMonoEvent(this, kind, detail)
    }

    protected get _interactive(): boolean {
      return !this.disabled && !this.readonly
    }

    // ── pointer ─────────────────────────────────────────────────────────

    protected _onPointerDown(event: PointerEvent): void {
      if (event.button !== 0 || this.disabled) return
      const control = event.currentTarget as HTMLElement
      const thumb = (event.composedPath() as Element[]).find((n) => n instanceof Element && n.hasAttribute?.('mono-slider-thumb')) as HTMLElement | undefined

      if (this.readonly) {
        // Readonly still takes focus (so the value can be read out), it just never moves.
        if (thumb) thumb.focus({ preventScroll: true })
        return
      }
      event.preventDefault()

      const raw = this._rawAt(event)
      const values = this._values
      let index = thumb ? Number(thumb.dataset.index) : nearestThumb(values, raw)
      let mode: 'thumb' | 'stack' | 'segment-pending' = 'thumb'
      let stack: [number, number] | undefined
      let run: [number, number] | undefined

      if (thumb && isStacked(values, index)) {
        // A press ON a stack cannot know which thumb it means until it moves.
        let first = index
        let last = index
        while (first > 0 && values[first - 1] === values[index]) first--
        while (last < values.length - 1 && values[last + 1] === values[index]) last++
        stack = [first, last]
        mode = 'stack'
      } else if (!thumb && values.length > 1) {
        // A press on a FILLED stretch between two thumbs may be the start of a segment drag —
        // decided by whether it moves before release.
        const k = values.findIndex((v) => v > raw)
        if (k > 0) {
          const pieces = trackPieces(values, this._scale, this.fill)
          if (pieces[k]?.filled) {
            run = [k - 1, k]
            mode = 'segment-pending'
          }
        }
      }

      this._gesture = {
        pointerId: event.pointerId,
        mode,
        index,
        run,
        stack,
        startX: event.clientX,
        startY: event.clientY,
        startRaw: raw,
        startValues: values,
      }
      control.setPointerCapture?.(event.pointerId)

      if (mode === 'thumb') {
        this._active = index
        this._dragging = index
        this._focusThumb(index)
        // A press on the bare track jumps the nearest thumb there.
        if (!thumb) this._commit(moveThumb(values, index, raw, this._scale), index, 'input', event)
      }
    }

    protected _onPointerMove(event: PointerEvent): void {
      const g = this._gesture
      if (!g || g.pointerId !== event.pointerId) return
      const raw = this._rawAt(event)

      if (g.mode === 'stack' && g.stack) {
        if (raw === g.startRaw) return
        g.index = raw > g.startRaw ? g.stack[1] : g.stack[0]
        g.mode = 'thumb'
        this._active = g.index
        this._dragging = g.index
        this._focusThumb(g.index)
      }

      if (g.mode === 'segment-pending') {
        const moved = Math.hypot(event.clientX - g.startX, event.clientY - g.startY)
        if (moved < SEGMENT_DRAG_THRESHOLD) return
        g.mode = 'segment'
        this._dragging = g.run![0]
      }

      if (g.mode === 'segment' && g.run) {
        const next = moveRun(g.startValues, g.run[0], g.run[1], raw - g.startRaw, this._scale)
        const same = next.length === this._values.length && next.every((n, i) => n === this._values[i])
        if (!same) this._commit(next, -1, 'input', event)
        return
      }

      if (g.mode === 'thumb') {
        this._commit(moveThumb(this._values, g.index, raw, this._scale), g.index, 'input', event)
      }
    }

    protected _onPointerUp(event: PointerEvent): void {
      const g = this._gesture
      if (!g || g.pointerId !== event.pointerId) return
      this._gesture = null
      ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)

      // A press between two thumbs that never moved was a CLICK: jump the nearest thumb.
      if (g.mode === 'segment-pending') {
        const raw = this._rawAt(event)
        const index = nearestThumb(this._values, raw)
        this._active = index
        this._focusThumb(index)
        this._commit(moveThumb(this._values, index, raw, this._scale), index, 'input', event)
      }

      this._dragging = -1
      const moved = g.startValues.length !== this._values.length || g.startValues.some((n, i) => n !== this._values[i])
      if (moved) this._commit(this._values, g.mode === 'segment' ? -1 : g.index, 'change', event, g.startValues)
    }

    protected _onPointerCancel(event: PointerEvent): void {
      const g = this._gesture
      if (!g || g.pointerId !== event.pointerId) return
      this._onPointerUp(event)
    }

    protected _focusThumb(i: number): void {
      this.updateComplete.then(() => this._thumbEl(i)?.focus({ preventScroll: true }))
    }

    // ── keyboard ────────────────────────────────────────────────────────

    protected _onThumbKeydown(event: KeyboardEvent): void {
      if (!this._interactive) return
      let i = Number((event.currentTarget as HTMLElement).dataset.index)
      const values = this._values
      const rtl = this._isRtl()
      let dir: 1 | -1 | 0 = 0
      let big = false
      let edge: 'lo' | 'hi' | null = null

      switch (event.key) {
        case 'ArrowUp':
          dir = 1
          break
        case 'ArrowDown':
          dir = -1
          break
        case 'ArrowRight':
          dir = rtl ? -1 : 1
          break
        case 'ArrowLeft':
          dir = rtl ? 1 : -1
          break
        case 'PageUp':
          dir = 1
          big = true
          break
        case 'PageDown':
          dir = -1
          big = true
          break
        case 'Home':
          edge = 'lo'
          break
        case 'End':
          edge = 'hi'
          break
        default:
          return
      }
      event.preventDefault()

      // A stacked thumb moving up hands over to the top of the stack (and down to the bottom),
      // otherwise its own neighbour would block it forever.
      if (dir && isStacked(values, i)) {
        let j = i
        if (dir > 0) while (j < values.length - 1 && values[j + 1] === values[i]) j++
        else while (j > 0 && values[j - 1] === values[i]) j--
        if (j !== i) {
          i = j
          this._focusThumb(i)
        }
      }

      const { lo, hi } = thumbBounds(values, i, this._scale)
      const target = edge === 'lo' ? lo : edge === 'hi' ? hi : stepFrom(values[i], dir as 1 | -1, big, this._scale)
      const next = moveThumb(values, i, target, this._scale)
      this._active = i
      if (next === values) return
      this._commit(next, i, 'input', event)
      this._commit(next, i, 'change', event, values)
    }

    // ── classes / state ─────────────────────────────────────────────────

    protected get _resolvedValidationState(): SliderValidationState {
      if (this.validationState && this.validationState !== 'default') return this.validationState
      if (this.error || this.errorMessage) return 'invalid'
      if (this.success || this.successMessage) return 'valid'
      return 'default'
    }

    protected _cls(base: string, key: keyof SliderCssClass): string {
      return cssPart(this.cssClass, base, key)
    }

    protected get _hasLabel(): boolean {
      return !!(this.label || this._hasLabelSlotState)
    }

    protected get _describedBy(): string | undefined {
      return this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlotState
        ? this._messageId
        : undefined
    }

    protected _thumbLabel(i: number): string | undefined {
      const base = this.ariaLabelText || this.label || undefined
      const n = this._values.length
      if (n === 1) return base
      const which = n === 2 ? (i === 0 ? 'minimum' : 'maximum') : `${i + 1} of ${n}`
      return base ? `${base} (${which})` : which
    }

    public override focus(options?: FocusOptions): void {
      this._thumbEl(this._active)?.focus(options)
    }

    public override blur(): void {
      const el = this._thumbEl(this._active)
      el?.blur()
    }

    // ── render ──────────────────────────────────────────────────────────

    /** Label text region — light: placeholder for the captured slot; shadow overrides with `<slot>`. */
    protected _renderLabelText(): TemplateResult | string {
      return this._hasLabelSlotState ? html`<span data-mono-slot="label"></span>` : this.label
    }

    protected _renderReadout(): TemplateResult {
      return html`<span class=${this._cls('mono-slider-value', 'value')} mono-slider-value aria-hidden="true">${this._readoutText}</span>`
    }

    /** The label row: text, required mark, ⓘ, and the value at its end. */
    protected _renderLabel(): TemplateResult | typeof nothing {
      if (!this._hasLabel) return nothing
      return html`
        <div mono-label-row>
          <label class=${this._cls('mono-slider-label', 'label')} mono-label id=${`${this._sliderId}-label`}>
            ${this._renderLabelText()}
            ${this.required ? html`<span class=${this._cls('mono-slider-required', 'required')} mono-required-mark>*</span>` : nothing}
            ${this._tooltip.render()}
          </label>
          ${this.showValue ? this._renderReadout() : nothing}
        </div>
      `
    }

    protected _renderMessage(): TemplateResult | typeof nothing {
      const base = this._cls('mono-slider-message', 'message')
      if (this.validationMessage) {
        const s = this._resolvedValidationState
        return html`<div class=${`${base} ${s}`} mono-message=${s} role=${s === 'invalid' ? 'alert' : nothing}>${this.validationMessage}</div>`
      }
      if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-message="invalid" role="alert">${this.errorMessage}</div>`
      if (this.successMessage) return html`<div class=${`${base} valid`} mono-message="valid">${this.successMessage}</div>`
      if (this.helperText || this._hasHelperSlotState) {
        return html`<div class=${`${base} helper`} mono-message="helper">${this._hasHelperSlotState ? html`<span data-mono-slot="helper"></span>` : this.helperText}</div>`
      }
      return nothing
    }

    protected _renderPieces(pieces: SliderPiece[]): TemplateResult {
      return html`${pieces.map(
        (p, k) => html`<span
          class=${this._cls('mono-slider-fill', 'fill')}
          mono-slider-piece
          ?mono-filled=${p.filled}
          ?mono-cut-start=${p.cutStart}
          ?mono-cut-end=${p.cutEnd}
          data-k=${k}
          style=${`--a: ${p.from / 100}; --b: ${p.to / 100}`}
        ></span>`,
      )}`
    }

    protected _renderMarks(marks: SliderMarkPoint[], pieces: SliderPiece[]): TemplateResult | typeof nothing {
      if (!marks.length) return nothing
      const filled = pieces.filter((p) => p.filled)
      const active = (pct: number) => filled.some((p) => pct >= p.from - 1e-9 && pct <= p.to + 1e-9)
      // Labels only for an explicit list: `marks` = true is a texture of ticks, not a scale.
      const labelled = Array.isArray(this.marks) || (typeof this.marks === 'string' && this.marks.trim().startsWith('['))
      return html`
        <div class=${this._cls('mono-slider-marks', 'marks')} mono-slider-marks aria-hidden="true">
          ${marks.map(
            (m) => html`<span
              class=${this._cls('mono-slider-mark', 'mark')}
              mono-slider-mark
              ?mono-active=${active(m.pct)}
              style=${`--p: ${m.pct / 100}`}
            >${labelled
              ? html`<span class=${this._cls('mono-slider-mark-label', 'markLabel')} mono-slider-mark-label>${m.label ?? this._format(m.value)}</span>`
              : nothing}</span>`,
          )}
        </div>
      `
    }

    protected _renderThumb(v: number, i: number): TemplateResult {
      const { lo, hi } = thumbBounds(this._values, i, this._scale)
      const text = this._format(v)
      const raw = String(stripNoise(v))
      return html`<div
        class=${this._cls('mono-slider-thumb', 'thumb')}
        mono-slider-thumb
        role="slider"
        data-index=${i}
        tabindex=${this.disabled ? -1 : 0}
        style=${`--p: ${toPercent(v, this._scale) / 100}`}
        ?mono-active=${i === this._active}
        ?mono-dragging=${i === this._dragging}
        aria-valuemin=${lo}
        aria-valuemax=${hi}
        aria-valuenow=${raw}
        aria-valuetext=${ifDefined(text !== raw ? text : undefined)}
        aria-orientation=${this._vertical ? 'vertical' : 'horizontal'}
        aria-label=${ifDefined(this._thumbLabel(i))}
        aria-labelledby=${ifDefined(!this.ariaLabelText && this._hasLabel && this._values.length === 1 ? `${this._sliderId}-label` : undefined)}
        aria-disabled=${ifDefined(this.disabled ? 'true' : undefined)}
        aria-readonly=${ifDefined(this.readonly ? 'true' : undefined)}
        aria-required=${ifDefined(this.required ? 'true' : undefined)}
        aria-invalid=${ifDefined(this._resolvedValidationState === 'invalid' ? 'true' : undefined)}
        aria-describedby=${ifDefined(this._describedBy)}
        @keydown=${this._onThumbKeydown}
        @focus=${() => {
          this._active = i
        }}
      >${this.valueTooltip === 'never'
        ? nothing
        : html`<span class=${this._cls('mono-slider-tooltip', 'tooltip')} mono-slider-tooltip aria-hidden="true">${text}</span>`}</div>`
    }

    protected _renderHidden(): TemplateResult | typeof nothing {
      if (!this.name) return nothing
      const many = this._values.length > 1 || this._isArrayModel
      const name = many && !this.name.endsWith('[]') ? `${this.name}[]` : this.name
      return html`${this._values.map(
        (v) => html`<input type="hidden" mono-slider-hidden name=${name} .value=${String(v)} ?disabled=${this.disabled} />`,
      )}`
    }

    protected override render(): TemplateResult {
      const pieces = trackPieces(this._values, this._scale, this.fill)
      const marks = markPoints(this.marks === '' ? true : this.marks, this._scale)
      const state = this._resolvedValidationState
      const gap = Number(this.trackGap) || 0
      const labelledMarks = marks.length > 0 && (Array.isArray(this.marks) || (typeof this.marks === 'string' && this.marks.trim().startsWith('[')))

      const style: Record<string, string> = {}
      const width = toCssSize(this.width)
      if (width) style.width = width
      const length = toCssSize(this.height)
      if (length) style['--_mono-slider-length'] = length
      if (gap > 0) style['--_mono-slider-track-gap'] = `${gap}px`

      return html`<div
        class=${[
          'mono-slider',
          this.size,
          this.color,
          this._vertical ? 'vertical' : '',
          this.disabled ? 'disabled' : '',
          this.cssClassName,
          this.cssClass?.root,
        ].filter(Boolean).join(' ')}
        style=${styleMap(style)}
        mono-slider
        mono-size=${this.size === 'md' ? nothing : this.size}
        mono-color=${this.color === 'primary' ? nothing : this.color}
        mono-type=${this._vertical ? 'vertical' : nothing}
        mono-validation-state=${state === 'default' ? nothing : state}
        mono-value-tooltip=${this.valueTooltip === 'auto' ? nothing : this.valueTooltip}
        ?mono-track-gap=${gap > 0}
        ?mono-marks-labelled=${labelledMarks}
        ?mono-disabled=${this.disabled}
        ?mono-readonly=${this.readonly}
        ?mono-required=${this.required}
        ?mono-dragging=${this._dragging >= 0}
      >
        ${this._renderLabel()}
        <div mono-slider-field>
          <div
            class=${this._cls('mono-slider-control', 'control')}
            mono-slider-control
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerCancel}
          >
            <div class=${this._cls('mono-slider-track', 'track')} mono-slider-track>${this._renderPieces(pieces)}</div>
            ${this._renderMarks(marks, pieces)}
            ${this._values.map((v, i) => this._renderThumb(v, i))}
          </div>
          ${!this._hasLabel && this.showValue ? this._renderReadout() : nothing}
        </div>
        ${this._renderHidden()}
        <div id=${this._messageId} class=${this.cssClass?.messageWrap ?? ''} mono-message-wrap>${this._renderMessage()}</div>
      </div>`
    }
  }

  return MonoSliderCoreClass as unknown as Constructor<MonoSliderCoreInterface> & T
}
