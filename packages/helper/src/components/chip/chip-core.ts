// @unocss-include

import { LitElement } from 'lit'
import { property, state, query } from 'lit/decorators.js'

import type {
  ChipSize,
  ChipColor,
  ChipVariant,
  ChipRounded,
  ChipIconPosition,
  ChipCssClass,
  ChipModelEventDetail,
} from './chip-types.js'

import {
  booleanStringConverter,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'

type ChipLikeElement = HTMLSpanElement | HTMLAnchorElement

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoChipCoreInterface {
  size: ChipSize
  color: ChipColor
  variant: ChipVariant
  rounded?: ChipRounded
  label?: string
  dot: boolean
  removable: boolean
  clickable: boolean
  disabled: boolean
  modelValue: boolean
  selected: boolean
  href?: string
  target?: string
  iconPosition: ChipIconPosition
  ariaLabelText?: string
  closeLabel: string
  cssClass: ChipCssClass
  focus(): void
  blur(): void
  click(): void

  // Shared-protected surface used / overridden by the light/shadow render()s.
  protected _isActive: boolean
  protected _hasIcon: boolean
  protected _chipElement?: ChipLikeElement
  protected _toBoolean(value: unknown): boolean
  protected _cls(base: string, key: keyof ChipCssClass): string
  protected get _chipClasses(): string
  protected get _isInteractive(): boolean
  protected _createModelDetail(args: {
    modelValue: boolean
    oldValue: boolean
    sourceEvent?: Event
  }): ChipModelEventDetail
  protected _handleClick(event: MouseEvent): void
  protected _handleKeyDown(event: KeyboardEvent): void
  protected _handleFocus(): void
  protected _handleBlur(): void
  protected _handleClose(event: MouseEvent): void
}

/**
 * `MonoChipCore` — all render-mode-agnostic logic for `mono-chip`: reactive
 * props, hybrid aliases (incl. the `ariaLabel`/`aria-label`/`arialabel` →
 * `ariaLabelText` getters), camelCase attribute fallbacks, the `modelValue`↔
 * `selected` sync + SSR boolean coercion in `willUpdate`, class computation,
 * click/keyboard/close interactivity (`mno-click`/`mno-close`), and the imperative
 * `focus/blur/click`. No `render()` — the light build keeps its `[data-mono-slot]`
 * capture strategy and the shadow build uses native `<slot>` (mirrors `mono-button`).
 *
 * SSR-safe: no `document`/`window` access; `_chipElement` (`@query`) is lazy and
 * `focus/blur/click` only run client-side.
 */
export const MonoChipCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoChipCoreClass extends superClass {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, [
        'modelValue',
        'iconPosition',
        'ariaLabelText',
        'closeLabel',
        'cssClass',
      ])

      // `ariaLabel` / `aria-label` / `arialabel` all map to `ariaLabelText`.
      for (const name of ['ariaLabel', 'aria-label', 'arialabel']) {
        Object.defineProperty(this, name, {
          get: () => this.ariaLabelText,
          set: (value: unknown) => {
            this.ariaLabelText = value == null ? undefined : String(value)
          },
          configurable: true,
          enumerable: false,
        })
      }

      this.size = 'md'
      this.color = 'primary'
      this.variant = 'soft'

      this.label = undefined

      this.dot = false
      this.removable = false
      this.clickable = false
      this.disabled = false
      this.modelValue = false
      this.selected = false

      this.href = undefined
      this.target = undefined
      this.iconPosition = 'left'
      this.ariaLabelText = undefined
      this.closeLabel = 'Remove'

      this._isActive = false
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'modelvalue',
        'iconposition',
        'closelabel',
        'arialabeltext',
        'arialabel',
      ]
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)

      if (oldValue === newValue) return

      if (name === 'modelvalue') {
        this.modelValue = this._toBoolean(newValue)
        return
      }

      if (name === 'iconposition') {
        this.iconPosition = (newValue ?? 'left') as ChipIconPosition
        return
      }

      if (name === 'closelabel') {
        this.closeLabel = newValue ?? 'Remove'
        return
      }

      if (name === 'arialabeltext' || name === 'arialabel') {
        this.ariaLabelText = newValue ?? undefined
      }
    }

    @property({ type: String })
    size!: ChipSize

    @property({ type: String })
    color!: ChipColor

    @property({ type: String })
    variant!: ChipVariant

    @property({ type: String })
    rounded?: ChipRounded

    @property({ type: String })
    label?: string

    @property({ reflect: true, converter: booleanStringConverter })
    dot!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    removable!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    clickable!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    disabled!: boolean

    @property({ attribute: 'model-value', reflect: true, converter: booleanStringConverter })
    modelValue!: boolean

    @property({ reflect: true, converter: booleanStringConverter })
    selected!: boolean

    @property({ type: String })
    href?: string

    @property({ type: String })
    target?: string

    @property({ type: String, attribute: 'icon-position' })
    iconPosition!: ChipIconPosition

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ type: String, attribute: 'close-label' })
    closeLabel!: string

    @property({ attribute: false })
    cssClass: ChipCssClass = {}

    @state()
    protected _isActive!: boolean

    /** Whether an icon is slotted. Light sets it from capture; shadow from `assignedNodes`. */
    @state()
    protected _hasIcon = false

    @query('div > span, div > a')
    protected _chipElement?: ChipLikeElement

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards a bare boolean attribute (`<mono-chip removable>`)
      // to the SSR renderer as the PROPERTY string `""` (these props use
      // `booleanStringConverter`, not `type: Boolean`). Coerce to real booleans so
      // the server and client renders match. See project_shadow_boolean_prop_ssr.
      for (const key of [
        'dot',
        'removable',
        'clickable',
        'disabled',
        'modelValue',
        'selected',
      ] as const) {
        if (typeof (this as any)[key] === 'string') {
          ;(this as any)[key] = this._toBoolean((this as any)[key])
        }
      }

      // Keep `modelValue` and `selected` in sync (two-way).
      //
      // The FIRST update is special: the constructor assigns both defaults, so
      // both keys are always in `changed` and "which one did the consumer set"
      // cannot be read from the change set. Going by VALUE can: both default to
      // false, so whichever is true is the one that was asked for. Without this,
      // `modelValue`'s default won the race and a plain `<mono-chip selected>`
      // silently deselected itself — in every build, HTML and framework alike.
      if (!this.hasUpdated) {
        const on = this.selected || this.modelValue
        if (this.selected !== on) this.selected = on
        if (this.modelValue !== on) this.modelValue = on
      } else {
        if (changed.has('modelValue') && this.selected !== this.modelValue) {
          this.selected = this.modelValue
        }
        if (changed.has('selected') && this.modelValue !== this.selected) {
          this.modelValue = this.selected
        }
      }

      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
    }

    protected _toBoolean(value: unknown): boolean {
      if (typeof value === 'boolean') return value

      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim()
        return normalized === '' || normalized === 'true'
      }

      return Boolean(value)
    }

    protected _cls(base: string, key: keyof ChipCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    protected get _isInteractive(): boolean {
      return this.clickable || Boolean(this.href) || this.removable
    }

    protected get _chipClasses(): string {
      const classes: string[] = ['mono-chip']

      classes.push(this.size)

      if (this.variant === 'soft') {
        classes.push(`soft-${this.color}`)
      } else if (this.variant === 'solid') {
        classes.push(`solid-${this.color}`)
      } else if (this.variant === 'outline') {
        classes.push(`outline-${this.color}`)
      }

      // NOT emitted as a class: `rounded-<step>` is Tailwind/UnoCSS's own
      // utility namespace, so on a page that ships those the "inert hook" would
      // really round the chip's outer box. The shape is `mono-rounded` only.

      if (this.dot) classes.push('has-dot')
      if (this.removable) classes.push('removable')
      if (this.clickable || this.href) classes.push('clickable')
      if (this.disabled) classes.push('disabled')
      if (this.selected || this._isActive) classes.push('selected')
      if (this.cssClass?.root) classes.push(this.cssClass.root)

      return classes.join(' ')
    }

    protected _createModelDetail(args: {
      modelValue: boolean
      oldValue: boolean
      sourceEvent?: Event
    }): ChipModelEventDetail {
      return {
        modelValue: args.modelValue,
        currentValue: args.modelValue,
        oldValue: args.oldValue,
        value: args.modelValue,
        selected: args.modelValue,
        label: this.label ?? '',
        sourceEvent: args.sourceEvent,
      }
    }

    private _emitClick(detail: ChipModelEventDetail): void {
      // A real click: the plain `click` is the native one, decorated.
      dispatchMonoEvent(this, 'click', detail)
    }

    private _emitClose(detail: ChipModelEventDetail): void {
      dispatchMonoEvent(this, 'close', detail)
    }

    protected _handleClick(event: MouseEvent): void {
      if (this.disabled) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      const oldValue = this.modelValue
      let nextValue = this.modelValue

      if (this.clickable && !this.href) {
        nextValue = !this.modelValue
        this.modelValue = nextValue
        this.selected = nextValue
      }

      const detail = this._createModelDetail({
        modelValue: nextValue,
        oldValue,
        sourceEvent: event,
      })

      this._emitClick(detail)
    }

    protected _handleKeyDown(event: KeyboardEvent): void {
      if (this.disabled) return

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        this._chipElement?.click()
      }

      if ((event.key === 'Backspace' || event.key === 'Delete') && this.removable) {
        event.preventDefault()

        const detail = this._createModelDetail({
          modelValue: this.modelValue,
          oldValue: this.modelValue,
          sourceEvent: event,
        })

        this._emitClose(detail)
      }
    }

    protected _handleFocus(): void {
      this._isActive = true
    }

    protected _handleBlur(): void {
      this._isActive = false
    }

    protected _handleClose(event: MouseEvent): void {
      event.preventDefault()
      event.stopPropagation()

      if (this.disabled) return

      const detail = this._createModelDetail({
        modelValue: this.modelValue,
        oldValue: this.modelValue,
        sourceEvent: event,
      })

      this._emitClose(detail)
    }

    public override focus(): void {
      this._chipElement?.focus()
    }

    public override blur(): void {
      this._chipElement?.blur()
    }

    public override click(): void {
      this._chipElement?.click()
    }
  }

  return MonoChipCoreClass as unknown as Constructor<MonoChipCoreInterface> & T
}
