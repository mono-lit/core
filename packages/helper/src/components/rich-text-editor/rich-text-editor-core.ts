import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, state } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'

import type {
  RichTextEditorColor,
  RichTextEditorCssClass,
  RichTextEditorErrorEventDetail,
  RichTextEditorFocusEventDetail,
  RichTextEditorInstance,
  RichTextEditorMode,
  RichTextEditorModelEventDetail,
  RichTextEditorOptions,
  RichTextEditorPlugins,
  RichTextEditorReadyEventDetail,
  RichTextEditorSize,
  RichTextEditorToolbar,
  RichTextEditorValidationState,
  RichTextEditorVariant,
} from './rich-text-editor-types.js'
import {
  loadSunEditor,
  loadSunEditorCss,
  loadSunEditorLang,
  loadSunEditorPlugins,
} from './rich-text-editor-loader.js'
import { pluginsNeedCatalog, pruneToolbar, resolvePlugins, resolveToolbar } from './rich-text-editor-toolbar.js'

import {
  booleanStringConverter,
  defineHybridPropAliases,
  optionalNumberConverter,
  type Constructor,
} from '../../composables/hybird-prop'
import { buildSizeStyle, toCssSize, type CssSizeValue } from '../../composables/css-size'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { MonoFormControlCore } from '../form/form-control-core.js'

/** Named slots projected by `mono-rich-text-editor` (light: captured; shadow: native). */
export type RichTextEditorSlotName = 'label' | 'helper'

/**
 * `MonoRichTextEditorCore` — render-mode-agnostic logic for `mono-rich-text-editor`,
 * a form field whose input is a [SunEditor](https://suneditor.com) v3 instance.
 *
 * **The peer is optional.** `suneditor` is externalized from mono's build and
 * loaded the first time an element renders (`rich-text-editor-loader.ts`). An
 * app that has not installed it gets an inline message naming the package and
 * the command, plus an `mno-error` event — never a crash.
 *
 * **The editor's DOM lives in LIGHT DOM, in both builds.** SunEditor is styled by
 * one global stylesheet and parks its modals in a `.sun-editor-carrier-wrapper`
 * on `<body>`, so neither could ever be adopted into a shadow root. The core
 * therefore creates ONE mount node (`.mono-rich-text-editor-mount`) and each
 * build decides where it shows: the light build re-homes it into the rendered
 * field frame, the shadow build keeps it as a light child projected through
 * `<slot name="editor">`. Either way it inherits the `--se-*` theme remap the
 * frame declares, and the page sheet reaches it. SSR renders the chrome only —
 * an editor is client state, exactly like `mono-chart` and `mono-date`.
 *
 * **Lifecycle mirrors `date-core`.** `_ensureEditor()` is idempotent and runs
 * from `firstUpdated`, `connectedCallback` and every `updated()` that finds no
 * instance, so a `v-if` / `<KeepAlive>` round trip rebuilds the editor instead
 * of leaving a dead field. A build token plus an `isConnected` re-check after
 * every `await` keeps a superseded build from constructing an editor on a
 * detached node that nothing would ever destroy. `disconnectedCallback`
 * destroys BEFORE `super` so the DOM is still in the tree.
 *
 * **Value model.** `modelValue` is the HTML. SunEditor → element: `onChange`
 * emits `mno-change`, `onInput` emits `mno-input` (the textarea detail shape),
 * an empty editor is published as `''` so `required` means what it says.
 * Element → editor: an outside `modelValue` write reaches `$.html.set()` only
 * when it differs from the last value the editor itself produced — no caret
 * jumps, no echo. `monoForm` binds through {@link MonoFormControlCore} exactly
 * as `mono-textarea` does.
 */
export const MonoRichTextEditorCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoRichTextEditorCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, [
        'modelValue',
        'helperText',
        'validationState',
        'validationMessage',
        'errorMessage',
        'successMessage',
        'charCounter',
        'maxLength',
        'loadCss',
        'textDirection',
        'ariaLabelText',
        'cssClass',
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
      ])

      // `:css-class` / `:cssclass` land on the object OR the root-class string.
      for (const alias of ['css-class', 'cssclass']) {
        Object.defineProperty(this, alias, {
          get: () => this.cssClass,
          set: (value: unknown) => this._setCssClass(value),
          configurable: true,
          enumerable: false,
        })
      }
      for (const alias of ['ariaLabel', 'aria-label', 'arialabel']) {
        Object.defineProperty(this, alias, {
          get: () => this.ariaLabelText,
          set: (value: unknown) => {
            this.ariaLabelText = value == null ? undefined : String(value)
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
        'modelvalue',
        'helpertext',
        'validationstate',
        'validationmessage',
        'errormessage',
        'successmessage',
        'charcounter',
        'maxlength',
        'loadcss',
        'textdirection',
        'arialabeltext',
        'arialabel',
        'css-class',
        'cssclass',
      ]
    }

    override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
      super.attributeChangedCallback(name, oldValue, newValue)
      if (oldValue === newValue) return

      switch (name) {
        case 'modelvalue':
          this.modelValue = newValue ?? ''
          return
        case 'helpertext':
          this.helperText = newValue ?? ''
          return
        case 'validationstate':
          this.validationState = (newValue ?? 'default') as RichTextEditorValidationState
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
        case 'charcounter':
          this.charCounter = this._toBoolean(newValue)
          return
        case 'maxlength':
          this.maxLength = optionalNumberConverter.fromAttribute(newValue)
          return
        case 'loadcss':
          this.loadCss = this._toBoolean(newValue)
          return
        case 'textdirection':
          this.textDirection = newValue === 'rtl' ? 'rtl' : newValue === 'ltr' ? 'ltr' : undefined
          return
        case 'arialabeltext':
        case 'arialabel':
          this.ariaLabelText = newValue ?? undefined
          return
        case 'css-class':
        case 'cssclass':
          this._setCssClass(newValue)
      }
    }

    // ── field chrome props (textarea's) ───────────────────────────────────

    @property({ type: String })
    size: RichTextEditorSize = 'md'

    @property({ type: String })
    color: RichTextEditorColor = 'primary'

    @property({ type: String })
    variant: RichTextEditorVariant = 'outlined'

    /**
     * The HTML. NOT reflected, unlike the other fields: a document with inline
     * images is kilobytes of attribute for nothing, and `has-value` is the CSS hook.
     */
    @property({ type: String, attribute: 'model-value' })
    modelValue = ''

    @property({ type: String })
    value = ''

    @property({ type: String })
    name = ''

    @property({ type: String })
    placeholder = ''

    @property({ type: String })
    label = ''

    @property({ type: String, attribute: 'helper-text' })
    helperText = ''

    @property({ type: String, attribute: 'validation-state' })
    validationState: RichTextEditorValidationState = 'default'

    @property({ type: String, attribute: 'validation-message' })
    validationMessage = ''

    @property({ type: String, attribute: 'error-message' })
    errorMessage = ''

    @property({ type: String, attribute: 'success-message' })
    successMessage = ''

    @property({ type: String, attribute: 'aria-label' })
    ariaLabelText?: string

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    readonly = false

    @property({ reflect: true, converter: booleanStringConverter })
    required = false

    @property({ attribute: false })
    cssClass: RichTextEditorCssClass = {}

    /** Plain root class fallback: `css-class="my-editor"`. */
    @property({ attribute: false })
    cssClassName = ''

    // ── editor props ──────────────────────────────────────────────────────

    /** Toolbar placement — see {@link RichTextEditorMode}. */
    @property({ type: String })
    mode: RichTextEditorMode = 'classic'

    /**
     * A preset name, a SunEditor `buttonList` (`.prop`) or its JSON. Default
     * `standard`. Buttons naming a plugin that is not loaded are dropped rather
     * than rejected, so a trimmed `plugins` list never breaks the toolbar.
     */
    @property({ attribute: 'toolbar' })
    toolbar?: RichTextEditorToolbar

    /**
     * `'auto'` (every built-in, the default — one lazy chunk owned by your
     * bundler), `'none'`, plugin classes / names (`.prop`), or a name → class
     * object. Trim it to trim the download.
     */
    @property({ attribute: 'plugins' })
    plugins?: RichTextEditorPlugins

    /**
     * Language code (`ko`, `de`, `zh-CN`, …) loaded on demand, or a language
     * object via `.prop`. Named `language`, not `lang` — that is the host's own
     * HTML attribute and stays the page's business.
     */
    @property({ attribute: 'language' })
    language?: string | Record<string, unknown>

    /** Content direction (`textDirection`). Not the host's `dir`, which stays native. */
    @property({ type: String, attribute: 'text-direction' })
    textDirection?: 'ltr' | 'rtl'

    @property({ attribute: 'char-counter', reflect: true, converter: booleanStringConverter })
    charCounter = false

    /** Character cap (`charCounter_max`) — turns the counter on. */
    @property({ attribute: 'max-length', converter: optionalNumberConverter })
    maxLength?: number

    /** The status bar (resize grip, element path, counters). Default on. */
    @property({ reflect: true, converter: booleanStringConverter })
    statusbar = true

    /**
     * Sticky toolbar offset in px while the WINDOW scrolls (`toolbar_sticky`).
     * Unset = not sticky, which is the safe default inside a scrolling panel or
     * a modal, where SunEditor's window-based stickiness has nothing to stick to.
     */
    @property({ converter: optionalNumberConverter })
    sticky?: number

    /** Load `suneditor/css/editor` on first render (default). `false` when the app ships it. */
    @property({ attribute: 'load-css', converter: booleanStringConverter })
    loadCss = true

    /** Raw SunEditor `InitOptions`, merged LAST. Bind with `.prop`. */
    @property({ attribute: false })
    options?: RichTextEditorOptions

    /** Field width; `height` / `min-height` / `max-height` size the EDITING AREA. */
    @property({ type: String })
    width?: CssSizeValue

    @property({ type: String })
    height?: CssSizeValue

    @property({ type: String, attribute: 'min-width' })
    minWidth?: CssSizeValue

    @property({ type: String, attribute: 'max-width' })
    maxWidth?: CssSizeValue

    @property({ type: String, attribute: 'min-height' })
    minHeight?: CssSizeValue

    @property({ type: String, attribute: 'max-height' })
    maxHeight?: CssSizeValue

    // ── state ─────────────────────────────────────────────────────────────

    @state()
    protected _hasLabelSlotState = false

    @state()
    protected _hasHelperSlotState = false

    /** Why the editor could not be built — rendered in place of it. */
    @state()
    protected _error = ''

    /** `true` from the first `_ensureEditor()` until the instance reports `onload`. */
    @state()
    protected _loading = false

    private readonly _fieldId = `mono-rich-text-editor-${Math.random().toString(36).slice(2)}`
    private readonly _messageId = `${this._fieldId}-message`

    /** The light-DOM node SunEditor is built inside. Created once, re-homed by the build. */
    protected _mount?: HTMLDivElement
    private _editor: RichTextEditorInstance | null = null
    private _building = false
    /** Invalidates in-flight async builds (the dynamic imports). */
    private _buildToken = 0
    /** The last HTML the editor itself produced (input OR change) — what an outside write is compared to. */
    private _lastEmitted = ''
    /** The last HTML published as a CHANGE, so a programmatic set's echo is not news. */
    private _lastChanged = ''
    /** `true` once `onload` fired for the current instance. */
    private _ready = false

    /** Props whose change needs a fresh instance (SunEditor reads them at construction). */
    private static readonly _configKeys: readonly string[] = [
      'mode',
      'toolbar',
      'plugins',
      'language',
      'textDirection',
      'charCounter',
      'maxLength',
      'statusbar',
      'sticky',
      'options',
      'placeholder',
      'height',
      'minHeight',
      'maxHeight',
    ]

    // ── lifecycle ─────────────────────────────────────────────────────────

    override willUpdate(changed: Map<string, unknown>): void {
      super.willUpdate?.(changed)
      // SSR (nuxt-ssr-lit) can set a boolean prop to a raw string (e.g. '');
      // coerce so render() sees real booleans and hydration matches.
      for (const key of ['disabled', 'readonly', 'required', 'charCounter', 'statusbar', 'loadCss'] as const) {
        const v = this[key] as unknown
        if (typeof v !== 'boolean') (this as unknown as Record<string, unknown>)[key] = this._toBoolean(v)
      }

      if (changed.has('modelValue') && this.value !== this.modelValue) this.value = this.modelValue ?? ''
      if (changed.has('value') && this.modelValue !== this.value) this.modelValue = String(this.value ?? '')
    }

    override connectedCallback(): void {
      super.connectedCallback()
      if (isServer) return
      this._ensureMount()
      // A plain reattach schedules no update, so `updated()` would never rebuild.
      if (this.hasUpdated) void this._ensureEditor()
    }

    override disconnectedCallback(): void {
      // Before `super`, while the mount is still in the tree for SunEditor to unhook.
      this._destroyEditor()
      super.disconnectedCallback()
    }

    override firstUpdated(): void {
      if (isServer) return
      void this._ensureEditor()
    }

    protected override updated(changed: Map<string, unknown>): void {
      super.updated?.(changed)
      if (isServer) return

      this._placeMount()

      if (!this._editor) {
        // Re-create after a reconnect (or a failed attempt whose props changed)
        // rather than bailing out forever.
        if (!this._building && MonoRichTextEditorCoreClass._configKeys.some((k) => changed.has(k))) this._error = ''
        void this._ensureEditor()
        return
      }

      if (MonoRichTextEditorCoreClass._configKeys.some((k) => changed.has(k))) {
        this._rebuild()
        return
      }
      if (changed.has('modelValue')) this._applyModelValue()
      if (changed.has('disabled') || changed.has('readonly')) this._applyState()
      if (changed.has('ariaLabelText') || changed.has('label') || changed.has('placeholder')) this._applyAria()
    }

    // ── the mount ─────────────────────────────────────────────────────────

    /** Create the light-DOM mount once. Where it goes is the build's call (`_placeMount`). */
    private _ensureMount(): void {
      if (this._mount) return
      const mount = document.createElement('div')
      mount.className = 'mono-rich-text-editor-mount'
      // the page sheet delivers the `--se-*` remap on this attribute (the mount
      // is light DOM in both builds, so the shadow sheet cannot)
      mount.setAttribute('mono-rte-mount', '')
      this._mount = mount
    }

    /**
     * Put the mount where this build shows it. Light: inside the rendered
     * `[data-mono-slot="editor"]` frame. Shadow: a light child of the host, with
     * `slot="editor"` so `<slot name="editor">` projects it. Idempotent.
     */
    protected _placeMount(): void {
      const mount = this._mount
      if (!mount) return
      if (this._useNativeSlots) {
        if (mount.getAttribute('slot') !== 'editor') mount.setAttribute('slot', 'editor')
        if (mount.parentNode !== this) this.appendChild(mount)
        return
      }
      const outlet = this.renderRoot.querySelector('[data-mono-slot="editor"]')
      if (outlet && mount.parentNode !== outlet) outlet.appendChild(mount)
    }

    // ── SunEditor glue ────────────────────────────────────────────────────

    /**
     * Build the instance if there is none — idempotent, safe from every hook.
     * Every `await` is followed by the token / connection re-check: an element
     * that left the tree mid-import must not end up owning an editor.
     */
    private async _ensureEditor(): Promise<void> {
      if (isServer || this._editor || this._building) return
      const mount = this._mount
      if (!mount?.isConnected) return

      this._building = true
      this._loading = true
      const token = ++this._buildToken

      try {
        const [SUNEDITOR] = await Promise.all([
          loadSunEditor(),
          this.loadCss ? loadSunEditorCss() : Promise.resolve(),
        ])
        const catalog = pluginsNeedCatalog(this.plugins) ? await loadSunEditorPlugins() : null
        const lang = typeof this.language === 'string' ? await loadSunEditorLang(this.language) : this.language

        if (token !== this._buildToken || !this.isConnected || !mount.isConnected || this._editor) return

        // A fresh target per build: SunEditor rewires the one it is given.
        mount.replaceChildren()
        const target = document.createElement('div')
        target.className = 'mono-rich-text-editor-target'
        mount.appendChild(target)

        this._lastEmitted = this._lastChanged = this.modelValue || ''
        this._ready = false
        this._editor = SUNEDITOR.create(target, this._buildOptions(catalog, lang)) as RichTextEditorInstance
        this._error = ''
        this._themeTooltips(mount)
      } catch (err) {
        if (token !== this._buildToken) return
        const message = err instanceof Error ? err.message : String(err)
        this._error = message
        this._loading = false
        dispatchMonoEvent<RichTextEditorErrorEventDetail>(this, 'error', { message, error: err })
      } finally {
        if (token === this._buildToken) this._building = false
      }
    }

    // ── tooltips ──────────────────────────────────────────────────────────

    private _titleObservers: MutationObserver[] = []

    /**
     * SunEditor labels its dropdown items (font family, font size, the colour
     * palettes …) with `title`, which the browser draws as the OS tooltip — white,
     * system font, out of every theme's reach. Rewrite each into `data-tooltip`
     * (+ `aria-label`, so nothing is lost to assistive tech), which the sheet
     * paints as Basecoat's tooltip; a title that only repeats the item's own text
     * is dropped. The lists are built lazily, on first open, so the mount — and
     * the modal carrier SunEditor parks on <body> — are watched for new ones.
     */
    private _themeTooltips(mount: HTMLElement): void {
      this._titleObservers.forEach((o) => o.disconnect())
      this._titleObservers = []
      // the tooltip pseudo-element cannot inherit the page font from the frame
      // through an item that sets its own (the font list does); hand it over
      mount.style.setProperty('--_mono-rte-page-font', getComputedStyle(this).fontFamily)
      const retitle = (root: Element): void => {
        const nodes = root.matches('[title]') ? [root, ...root.querySelectorAll('[title]')] : [...root.querySelectorAll('[title]')]
        for (const el of nodes) {
          const title = el.getAttribute('title')?.trim()
          el.removeAttribute('title')
          if (!title) continue
          if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', title)
          // "Arial" on the item that reads "Arial" says nothing twice
          if ((el.textContent ?? '').trim() === title) continue
          el.setAttribute('data-tooltip', title)
        }
      }
      const watch = (root: Element): void => {
        retitle(root)
        if (typeof MutationObserver === 'undefined') return
        const mo = new MutationObserver((records) => {
          for (const r of records) {
            if (r.type === 'attributes') {
              if ((r.target as Element).hasAttribute('title')) retitle(r.target as Element)
              continue
            }
            r.addedNodes.forEach((n) => {
              if (n.nodeType === Node.ELEMENT_NODE) retitle(n as Element)
            })
          }
        })
        mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] })
        this._titleObservers.push(mo)
      }
      watch(mount)
      // the carrier is created by `create()`; the newest one is this editor's
      const carriers = document.querySelectorAll('.sun-editor-carrier-wrapper')
      const carrier = carriers[carriers.length - 1] as HTMLElement | undefined
      if (carrier) {
        // the carrier sits on <body>, outside the frame: it gets the page font too
        carrier.style.setProperty('--_mono-rte-page-font', getComputedStyle(this).fontFamily)
        watch(carrier)
      }
    }

    private _buildOptions(catalog: Record<string, unknown> | null, lang: unknown): Record<string, unknown> {
      const { plugins, keys } = resolvePlugins(this.plugins, catalog)
      const buttonList = pruneToolbar(resolveToolbar(this.toolbar), keys)
      const consumer = this.options ?? {}
      const consumerEvents = (consumer.events ?? {}) as Record<string, unknown>

      // The consumer's handler runs first; ours always runs. Returning `false`
      // from theirs still cancels SunEditor's default the way it would alone.
      const chain =
        (mine: (params: any) => void, name: string) =>
        (params: any): unknown => {
          const theirs = consumerEvents[name]
          const result = typeof theirs === 'function' ? theirs(params) : undefined
          mine(params)
          return result
        }

      const options: Record<string, unknown> = {
        value: this.modelValue || '',
        placeholder: this.placeholder || undefined,
        mode: this.mode,
        buttonList,
        plugins,
        lang: lang ?? undefined,
        textDirection: this.textDirection,
        charCounter: this.charCounter || this.maxLength != null,
        charCounter_max: this.maxLength ?? undefined,
        statusbar: this.statusbar,
        // SunEditor's own default is "sticky at 0" — see the `sticky` prop.
        toolbar_sticky: this.sticky ?? -1,
        width: '100%',
        height: toCssSize(this.height) ?? 'auto',
        minHeight: toCssSize(this.minHeight) ?? undefined,
        maxHeight: toCssSize(this.maxHeight) ?? undefined,
        ...consumer,
        events: {
          ...consumerEvents,
          onload: chain(this._onLoad, 'onload'),
          onChange: chain(this._onChange, 'onChange'),
          onInput: chain(this._onInput, 'onInput'),
          onFocus: chain(this._onFocus, 'onFocus'),
          onBlur: chain(this._onBlur, 'onBlur'),
          onToggleFullScreen: chain(this._onToggleFullScreen, 'onToggleFullScreen'),
        },
      }

      // `undefined` keys would still override SunEditor's defaults in its own merge.
      for (const key of Object.keys(options)) if (options[key] === undefined) delete options[key]
      return options
    }

    private _destroyEditor(): void {
      this._buildToken++
      this._building = false
      const editor = this._editor
      this._editor = null
      this._ready = false
      this._loading = false
      this._titleObservers.forEach((o) => o.disconnect())
      this._titleObservers = []
      if (editor) {
        try {
          editor.destroy()
        } catch {
          // A half-built instance can throw on teardown; nothing to keep.
        }
      }
      this._mount?.replaceChildren()
    }

    /** Destroy + create, keeping the current HTML (it lives in `modelValue`). */
    private _rebuild(): void {
      this._destroyEditor()
      void this._ensureEditor()
    }

    /**
     * Full screen lifts SunEditor's root out of the frame (`position: fixed`,
     * inline) — and the frame is what carried the surface: the editing area is
     * `bg-transparent` in light mode and a translucent wash in dark, so the page
     * showed through. The mount is marked so the sheet can give the editor an
     * opaque page surface for the duration. Both builds: the mount is light DOM.
     */
    private _onToggleFullScreen = (params: { is?: boolean } | undefined): void => {
      this._mount?.toggleAttribute('mono-fullscreen', !!params?.is)
    }

    private _onLoad = (): void => {
      this._ready = true
      this._loading = false
      this._applyState()
      this._applyAria()
      const editor = this._editor
      if (editor) dispatchMonoEvent<RichTextEditorReadyEventDetail>(this, 'ready', { editor })
    }

    /** The editor's HTML as the field's value — `''` when it holds nothing. */
    private _read(data?: string): string {
      const editor = this._editor
      if (!editor) return ''
      try {
        if (editor.isEmpty()) return ''
      } catch {
        // Before `onload` the frame context may not exist yet — fall through.
      }
      return typeof data === 'string' ? data : editor.$.html.get()
    }

    private _publish(kind: 'input' | 'change', params: { data?: string } | undefined): void {
      if (this.disabled || this.readonly) return
      const next = this._read(params?.data)
      const oldValue = this.modelValue
      // A programmatic `set()` echoes back through `onChange` with SunEditor's
      // canonical serialisation — that is not a user edit, and not news.
      if (kind === 'change') {
        if (next === this._lastChanged) return
        this._lastChanged = next
      }

      this._lastEmitted = next
      this.value = next
      this.modelValue = next

      dispatchMonoEvent<RichTextEditorModelEventDetail>(this, kind, {
        modelValue: next,
        currentValue: next,
        oldValue,
        value: next,
        name: this.name || undefined,
        sourceEvent: params,
      })
    }

    private _onChange = (params: { data?: string }): void => {
      this._publish('change', params)
    }

    private _onInput = (params: { data?: string }): void => {
      this._publish('input', params)
    }

    private _onFocus = (params: unknown): void => {
      dispatchMonoEvent<RichTextEditorFocusEventDetail>(this, 'focus', {
        name: this.name || undefined,
        sourceEvent: params,
      })
    }

    private _onBlur = (params: unknown): void => {
      dispatchMonoEvent<RichTextEditorFocusEventDetail>(this, 'blur', {
        name: this.name || undefined,
        sourceEvent: params,
      })
    }

    /** Push an OUTSIDE `modelValue` into the editor — only when it is genuinely new. */
    private _applyModelValue(): void {
      const editor = this._editor
      if (!editor) return
      const next = this.modelValue || ''
      if (next === this._lastEmitted) return
      this._lastEmitted = this._lastChanged = next
      try {
        editor.$.html.set(next)
      } catch (err) {
        console.warn('[mono-rich-text-editor] could not set the editor content', err)
      }
    }

    private _applyState(): void {
      const editor = this._editor
      if (!editor || !this._ready) return
      try {
        // The two are not independent in SunEditor: `enable()` clears read-only
        // and `readOnly(false)` re-enables the toolbar `disable()` just turned
        // off. So: disabled wins outright; otherwise enable, then layer read-only.
        if (this.disabled) {
          editor.$.ui.disable()
        } else {
          editor.$.ui.enable()
          editor.$.ui.readOnly(!!this.readonly)
        }
      } catch (err) {
        console.warn('[mono-rich-text-editor] could not apply disabled/readonly', err)
      }
    }

    private _applyAria(): void {
      const editor = this._editor
      if (!editor || !this._ready) return
      const wysiwyg = editor.$.frameContext?.get?.('wysiwyg') as HTMLElement | undefined
      if (!wysiwyg) return
      const label = this.ariaLabelText || this.label || this.placeholder
      if (label) wysiwyg.setAttribute('aria-label', label)
      else wysiwyg.removeAttribute('aria-label')
      wysiwyg.setAttribute('aria-invalid', this._resolvedValidationState === 'invalid' ? 'true' : 'false')
      if (this._shouldShowFooter) wysiwyg.setAttribute('aria-describedby', this._messageId)
      else wysiwyg.removeAttribute('aria-describedby')
    }

    // ── public API ────────────────────────────────────────────────────────

    /** The live SunEditor instance, or `null` before it loads / when the peer is missing. */
    get editor(): RichTextEditorInstance | null {
      return this._editor
    }

    /** The HTML as SunEditor serialises it (`''` when empty). */
    getHtml(): string {
      return this._read()
    }

    /** Replace the content. Emits `mno-change` like a user edit would. */
    setHtml(html: string): void {
      this.modelValue = html ?? ''
      this._applyModelValue()
    }

    /** Insert HTML at the caret. */
    insertHtml(html: string): void {
      this._editor?.$.html.insert(html)
    }

    /** The plain text of the content. */
    getText(): string {
      const wysiwyg = this._editor?.$.frameContext?.get?.('wysiwyg') as HTMLElement | undefined
      return wysiwyg?.innerText ?? ''
    }

    isEmpty(): boolean {
      return this._read() === ''
    }

    public override focus(): void {
      this._editor?.$.focusManager.focus()
    }

    public override blur(): void {
      this._editor?.$.focusManager.blur()
    }

    /** Toggle (or set) the HTML source view. */
    codeView(value?: boolean): void {
      this._editor?.$.viewer.codeView(value)
    }

    /** Toggle (or set) full screen. */
    fullScreen(value?: boolean): void {
      this._editor?.$.viewer.fullScreen(value)
    }

    // ── chrome (textarea's) ───────────────────────────────────────────────

    private _setCssClass(value: unknown): void {
      if (value == null) {
        this.cssClass = {}
        this.cssClassName = ''
        return
      }
      if (typeof value === 'object') {
        this.cssClass = value as RichTextEditorCssClass
        return
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) {
          this.cssClass = {}
          this.cssClassName = ''
          return
        }
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            this.cssClass = JSON.parse(trimmed) as RichTextEditorCssClass
            return
          } catch {
            // fall back to the root class
          }
        }
        this.cssClassName = trimmed
      }
    }

    private _toBoolean(value: unknown): boolean {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim()
        return normalized === '' || normalized === 'true'
      }
      return Boolean(value)
    }

    private _cls(base: string, key: keyof RichTextEditorCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    private get _resolvedValidationState(): RichTextEditorValidationState {
      if (this.validationState && this.validationState !== 'default') return this.validationState
      if (this.errorMessage) return 'invalid'
      if (this.successMessage) return 'valid'
      return 'default'
    }

    private get _wrapperClasses(): string {
      return [
        'mono-rich-text-editor',
        this.size,
        this.color,
        this.variant,
        `mode-${this.mode.replace(':', '-')}`,
        this.disabled ? 'disabled' : '',
        this.readonly ? 'readonly' : '',
        this._resolvedValidationState !== 'default' ? `is-${this._resolvedValidationState}` : '',
        this.value ? 'has-value' : '',
        this._loading ? 'is-loading' : '',
        this._error ? 'is-unavailable' : '',
        this.cssClassName,
        this.cssClass?.root,
      ]
        .filter(Boolean)
        .join(' ')
    }

    private get _fieldClasses(): string {
      return [this._cls('mono-rich-text-editor-field', 'field'), this.size, this.color, this.variant]
        .filter(Boolean)
        .join(' ')
    }

    private get _shouldShowFooter(): boolean {
      return Boolean(
        this.validationMessage ||
          this.errorMessage ||
          this.successMessage ||
          this.helperText ||
          this._hasHelperSlotState,
      )
    }

    private _renderLabel(): TemplateResult | typeof nothing {
      const hasContent = !!this.label || this._hasLabelSlotState
      if (!hasContent && !this._slotsAlwaysRender) return nothing

      return html`
        <label class=${this._cls('mono-rich-text-editor-label', 'label')} mono-rte-label ?mono-empty=${!hasContent} ?data-empty=${!hasContent}>
          ${this._slotOutlet('label', this.label)}
          ${this.required
            ? html`<span class=${this._cls('mono-rich-text-editor-required', 'required')} mono-rte-required-mark>*</span>`
            : nothing}
        </label>
      `
    }

    private _renderMessage(): TemplateResult | typeof nothing {
      const base = this._cls('mono-rich-text-editor-message', 'message')
      if (this.validationMessage) {
        const state = this._resolvedValidationState
        return html`<div class=${`${base} ${state}`} mono-rte-message=${state} role=${state === 'invalid' ? 'alert' : nothing}>${this.validationMessage}</div>`
      }
      if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-rte-message="invalid" role="alert">${this.errorMessage}</div>`
      if (this.successMessage) return html`<div class=${`${base} valid`} mono-rte-message="valid">${this.successMessage}</div>`
      if (this.helperText || this._hasHelperSlotState || this._slotsAlwaysRender) {
        const empty = !this.helperText && !this._hasHelperSlotState
        return html`
          <div class=${`${base} helper`} mono-rte-message="helper" ?mono-empty=${empty} ?data-empty=${empty}>
            ${this._slotOutlet('helper', this.helperText)}
          </div>
        `
      }
      return nothing
    }

    private _renderFooter(): TemplateResult | typeof nothing {
      if (!this._shouldShowFooter && !this._slotsAlwaysRender) return nothing
      return html`
        <div class=${this._cls('mono-rich-text-editor-footer', 'footer')} mono-rte-footer ?mono-empty=${!this._shouldShowFooter} ?data-empty=${!this._shouldShowFooter}>
          <div class=${this.cssClass?.messageWrap ?? ''} mono-rte-message-wrap>${this._renderMessage()}</div>
        </div>
      `
    }

    /**
     * The peer-missing / build-failure notice. A SIBLING of the field frame, never
     * inside it: the frame's children are the mount the build re-homes there, and
     * a Lit child part beside a node Lit did not render would clear it on update.
     */
    private _renderUnavailable(): TemplateResult | typeof nothing {
      if (!this._error) return nothing
      return html`<div class="mono-rich-text-editor-unavailable" mono-rte-unavailable role="alert">${this._error}</div>`
    }

    protected override render(): TemplateResult {
      // The root's `mono-*` attributes mirror the props one for one and are what
      // rich-text-editor.css styles; a prop at its default emits NO attribute.
      // `mono-loading` / `mono-unavailable` / `mono-has-value` are STATES. The
      // classes stay as inert hooks until 2.0.
      const state = this._resolvedValidationState
      return html`
        <div
          class=${this._wrapperClasses}
          style=${styleMap(buildSizeStyle({ width: this.width, minWidth: this.minWidth, maxWidth: this.maxWidth }))}
          mono-rich-text-editor
          mono-size=${this.size === 'md' ? nothing : this.size}
          mono-color=${this.color === 'primary' ? nothing : this.color}
          mono-variant=${this.variant === 'outlined' ? nothing : this.variant}
          mono-validation-state=${state === 'default' ? nothing : state}
          mono-mode=${this.mode === 'classic' ? nothing : this.mode}
          ?mono-disabled=${this.disabled}
          ?mono-readonly=${this.readonly}
          ?mono-required=${this.required}
          ?mono-loading=${this._loading}
          ?mono-unavailable=${!!this._error}
          ?mono-has-value=${!!this.value}
        >
          ${this._renderLabel()}
          ${this._renderEditorOutlet(this._fieldClasses)}
          ${this._renderUnavailable()}
          <div id=${this._messageId} mono-rte-message-outlet>${this._renderFooter()}</div>
        </div>
      `
    }

    // ── build hooks ───────────────────────────────────────────────────────

    /** Whether the `label` / `helper` regions render even when empty. Light: no. Shadow: yes. */
    protected get _slotsAlwaysRender(): boolean {
      return false
    }

    /** Whether slots are native `<slot>`s (shadow) rather than captured placeholders (light). */
    protected get _useNativeSlots(): boolean {
      return false
    }

    protected _setSlotState(name: RichTextEditorSlotName, has: boolean): void {
      if (name === 'label') this._hasLabelSlotState = has
      else this._hasHelperSlotState = has
    }

    /**
     * Slot outlet for `label` / `helper`. Light (default): a `data-mono-slot`
     * placeholder the captured nodes are re-parented into when present, else the
     * prop `fallback`. Shadow overrides with a native `<slot name>`.
     */
    protected _slotOutlet(name: RichTextEditorSlotName, fallback: unknown = nothing): TemplateResult {
      const has = name === 'label' ? this._hasLabelSlotState : this._hasHelperSlotState
      return has ? html`<span data-mono-slot=${name}></span>` : html`${fallback}`
    }

    /**
     * The field frame the editor mount shows in. Its children are NOT Lit's:
     * light — the mount is appended by `_placeMount`; shadow — overridden to hold
     * a `<slot name="editor">`. Nothing else may ever render inside it.
     */
    protected _renderEditorOutlet(fieldClass: string): TemplateResult {
      return html`<div class=${fieldClass} mono-rte-field data-mono-slot="editor"></div>`
    }
  }

  return MonoRichTextEditorCoreClass as unknown as Constructor<MonoRichTextEditorCoreInterface> & T
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoRichTextEditorCoreInterface {
  size: RichTextEditorSize
  color: RichTextEditorColor
  variant: RichTextEditorVariant
  modelValue: string
  value: string
  name: string
  placeholder: string
  label: string
  helperText: string
  validationState: RichTextEditorValidationState
  validationMessage: string
  errorMessage: string
  successMessage: string
  ariaLabelText?: string
  disabled: boolean
  readonly: boolean
  required: boolean
  cssClass: RichTextEditorCssClass
  cssClassName: string
  mode: RichTextEditorMode
  toolbar?: RichTextEditorToolbar
  plugins?: RichTextEditorPlugins
  language?: string | Record<string, unknown>
  textDirection?: 'ltr' | 'rtl'
  charCounter: boolean
  maxLength?: number
  statusbar: boolean
  sticky?: number
  loadCss: boolean
  options?: RichTextEditorOptions
  width?: CssSizeValue
  height?: CssSizeValue
  minWidth?: CssSizeValue
  maxWidth?: CssSizeValue
  minHeight?: CssSizeValue
  maxHeight?: CssSizeValue

  readonly editor: RichTextEditorInstance | null
  getHtml(): string
  setHtml(html: string): void
  insertHtml(html: string): void
  getText(): string
  isEmpty(): boolean
  focus(): void
  blur(): void
  codeView(value?: boolean): void
  fullScreen(value?: boolean): void

  // Shared-protected surface used / overridden by the light + shadow wrappers.
  protected _hasLabelSlotState: boolean
  protected _hasHelperSlotState: boolean
  protected _mount?: HTMLDivElement
  protected get _slotsAlwaysRender(): boolean
  protected get _useNativeSlots(): boolean
  protected _setSlotState(name: RichTextEditorSlotName, has: boolean): void
  protected _slotOutlet(name: RichTextEditorSlotName, fallback?: unknown): TemplateResult
  protected _renderEditorOutlet(fieldClass: string): TemplateResult
  protected _placeMount(): void
}
