// @unocss-include

import { LitElement, html, nothing, isServer, type TemplateResult } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

import type {
  FileUploadCssClass,
  FileUploadItem,
  FileUploadValidationState,
  FileUploadVariant,
  FileUploadAction,
  FileUploadModelEventDetail,
  FileUploadRemoveEventDetail,
  FileUploadErrorEventDetail,
} from './file-upload-types.js'

import {
  createUploadItem,
  formatFileSize,
  getFileIcon,
  isIconifyClass,
} from './file-upload-utils.js'

import {
  arrayHasChanged,
  booleanStringConverter,
  defineHybridPropAlias,
  defineHybridPropAliases,
  type Constructor,
} from '../../composables/hybird-prop'
import { dispatchMonoEvent } from '../../composables/mono-event'
import { MonoFormControlCore } from '../form/form-control-core.js'

const numberStringConverter = {
  fromAttribute(value: string | null): number {
    if (value === null || value === '') return 0
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  },
  toAttribute(value: number): string | null {
    if (value === undefined || value === null) return null
    return String(value)
  },
}

/** Public + shared-protected surface added by the core mixin. */
export declare class MonoFileUploadCoreInterface {
  label: string
  helperText: string
  /** Dropzone headline. `placeholder` is the old name, kept as an alias. */
  title: string
  /** Dropzone secondary line. `subtext` is the old name, kept as an alias. */
  subtitle: string
  /** @deprecated alias of `title` */
  placeholder: string
  /** @deprecated alias of `subtitle` */
  subtext: string
  icon: string
  removeIcon: string
  accept: string
  multiple: boolean
  disabled: boolean
  required: boolean
  dragdrop: boolean
  maxFileSize: number
  maxFiles: number
  modelValue: FileUploadItem[]
  cssClass: FileUploadCssClass
  variant: FileUploadVariant
  validationState: FileUploadValidationState
  validationMessage: string
  clear(): void

  // Shared-protected surface used / overridden by the light/shadow builds.
  protected _hasIconSlot: boolean
  protected _hasTitleSlot: boolean
  protected _hasSubtitleSlot: boolean
  protected _inputEl: HTMLInputElement
  protected _cls(base: string, key: keyof FileUploadCssClass): string
  protected get _wrapperClasses(): string
  protected get _subtitleClasses(): string
  protected _useIconSlots(): boolean
  protected _renderDropzoneIcon(): TemplateResult
  protected _renderTitle(): TemplateResult
  protected _renderSubtitle(): TemplateResult
  protected _renderDefaultGlyph(): TemplateResult
  protected _renderRemoveIcon(): TemplateResult
  protected _renderThumbGlyph(item: FileUploadItem): TemplateResult
}

/**
 * `MonoFileUploadCore` — all render-mode-agnostic logic for `mono-file-upload`:
 * reactive props (incl. SSR boolean + modelValue-array coercion), hybrid aliases,
 * camelCase attribute fallbacks, the file pipeline (validate / add / drag-drop /
 * remove / clear), the `mno-change`/`mno-remove`/`mno-error` events, and the
 * dropzone/list/message `render()`. Icon rendering goes through overridable hooks
 * (`_renderDropzoneIcon`/`_renderDefaultGlyph`/`_renderRemoveIcon`/
 * `_renderThumbGlyph`) — the light build keeps `data-mono-slot` + `i-mdi-*` iconify
 * classes; the shadow build uses native `<slot>` + inline SVG (iconify can't paint
 * inside a shadow root).
 *
 * SSR-safe: no `document`/`window` access at module/ctor scope; the file pipeline
 * and `_inputEl` (`@query`) only run client-side from user interaction.
 */
export const MonoFileUploadCore = <T extends Constructor<LitElement>>(superClass: T) => {
  class MonoFileUploadCoreClass extends MonoFormControlCore(superClass) {
    constructor(...args: any[]) {
      super(...args)

      defineHybridPropAliases(this, [
        'helperText',
        'maxFileSize',
        'maxFiles',
        'modelValue',
        'validationState',
        'validationMessage',
        'cssClass',
        'removeIcon',
      ])
      // The old dropzone-text names forward to `title` / `subtitle` — one
      // storage, so whichever is written last wins.
      defineHybridPropAlias(this, 'placeholder', 'title')
      defineHybridPropAlias(this, 'subtext', 'subtitle')

      this.title = 'Klik atau seret file ke sini'
      this.subtitle = 'Pilih file untuk diunggah'
    }

    static get observedAttributes(): string[] {
      // @ts-ignore — `super` statics are untyped through the generic mixin base.
      const base: string[] = super.observedAttributes ?? []
      return [
        ...base,
        'helpertext',
        'maxfilesize',
        'maxfiles',
        'modelvalue',
        'validationstate',
        'validationmessage',
        'removeicon',
        'remove-icon',
        // the old dropzone-text names, as attributes (their properties are aliases)
        'placeholder',
        'subtext',
      ]
    }

    override attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ): void {
      super.attributeChangedCallback(name, oldValue, newValue)

      if (oldValue === newValue) return

      if (name === 'helpertext') {
        this.helperText = newValue ?? ''
        return
      }
      if (name === 'maxfilesize') {
        this.maxFileSize = this._toNumber(newValue)
        return
      }
      if (name === 'maxfiles') {
        this.maxFiles = this._toNumber(newValue)
        return
      }
      if (name === 'modelvalue') {
        this.modelValue = this._toFileUploadItems(newValue)
        return
      }
      if (name === 'validationstate') {
        this.validationState = (newValue ?? 'default') as FileUploadValidationState
        return
      }
      if (name === 'validationmessage') {
        this.validationMessage = newValue ?? ''
        return
      }
      if (name === 'removeicon' || name === 'remove-icon') {
        this.removeIcon = newValue ?? ''
        return
      }
      if (name === 'placeholder') {
        this.title = newValue ?? ''
        return
      }
      if (name === 'subtext') {
        this.subtitle = newValue ?? ''
      }
    }

    @property({ type: String })
    label = ''

    @property({ type: String, attribute: 'helper-text' })
    helperText = ''

    /**
     * Dropzone headline (`slot="title"` replaces it). A `title` ATTRIBUTE on the
     * host is also the browser's native tooltip; the rendered root carries
     * `title=""`, which stops it from reaching anything inside the field.
     */
    @property({ type: String })
    override title!: string

    /** Dropzone secondary line (`slot="subtitle"` replaces it). */
    @property({ type: String })
    subtitle!: string

    /** @deprecated alias of `title` — an instance accessor (see constructor). */
    declare placeholder: string

    /** @deprecated alias of `subtitle`. */
    declare subtext: string

    @property({ type: String })
    icon = ''

    @property({ type: String, attribute: 'remove-icon' })
    removeIcon = ''

    @property({ type: String })
    accept = ''

    @property({ reflect: true, converter: booleanStringConverter })
    multiple = false

    @property({ reflect: true, converter: booleanStringConverter })
    disabled = false

    @property({ reflect: true, converter: booleanStringConverter })
    required = false

    @property({ reflect: true, converter: booleanStringConverter })
    dragdrop = true

    @property({ attribute: 'max-file-size', converter: numberStringConverter })
    maxFileSize = 0

    @property({ attribute: 'max-files', converter: numberStringConverter })
    maxFiles = 0

    @property({ attribute: false, hasChanged: arrayHasChanged })
    modelValue: FileUploadItem[] = []

    @property({ attribute: false })
    cssClass: FileUploadCssClass = {}

    @property({ type: String })
    variant: FileUploadVariant = 'default'

    @property({ type: String, attribute: 'validation-state' })
    validationState: FileUploadValidationState = 'default'

    @property({ type: String, attribute: 'validation-message' })
    validationMessage = ''

    @state()
    protected _dragOver = false

    @state()
    protected _hasIconSlot = false

    /** `slot="title"` — replaces the `title` text. */
    @state()
    protected _hasTitleSlot = false

    /** `slot="subtitle"` — replaces the `subtitle` text. */
    @state()
    protected _hasSubtitleSlot = false

    @query('.mono-file-upload-input')
    protected _inputEl!: HTMLInputElement

    override willUpdate(changed: Map<string, unknown>): void {
      // nuxt-ssr-lit forwards bare boolean attributes as the PROPERTY string `""`
      // and `:model-value="<json>"` as a string — coerce so server/client match.
      for (const key of ['multiple', 'disabled', 'required', 'dragdrop'] as const) {
        if (typeof (this as any)[key] === 'string') {
          const normalized = (this as any)[key].toLowerCase().trim()
          ;(this as any)[key] = normalized === '' || normalized === 'true'
        }
      }
      if (typeof (this.modelValue as unknown) === 'string') {
        this.modelValue = this._toFileUploadItems(this.modelValue)
      }
      // @ts-ignore — super may not declare willUpdate through the generic base.
      super.willUpdate?.(changed)
    }

    /**
     * True while this element's preview URLs are revoked but its files are still
     * held — i.e. between a disconnect and the next connect.
     */
    private _previewsRevoked = false

    connectedCallback(): void {
      // @ts-ignore — the generic mixin base may not declare it; LitElement does.
      super.connectedCallback?.()
      this._restorePreviews()
    }

    disconnectedCallback(): void {
      this._revokePreviews()
      this._previewsRevoked = true
      super.disconnectedCallback()
    }

    /**
     * Re-create the object URLs that `disconnectedCallback` revoked.
     *
     * Revoking on unmount is right — a blob URL pins the whole file in memory — but
     * the files SURVIVE a reconnect (a `v-if` toggle, `<KeepAlive>`, Vue moving the
     * node), and nothing re-created their previews. `modelValue` kept the same
     * `previewUrl` STRING pointing at a dead URL, so every thumbnail was broken from
     * then on. It hid well: an `<img>` already decoded before the unmount keeps
     * painting, so the damage only surfaced once a later re-render built a fresh
     * `<img>` from the same src.
     *
     * Only the disconnect path restores. `clear()` and the single-select replace also
     * revoke, but those files are gone for good and must NOT come back.
     *
     * Mutates the items in place rather than rebuilding `modelValue`: the consumer
     * holds these same object references, so an in-place write keeps both sides on
     * one live URL and avoids emitting a change event for what was never a user edit.
     */
    private _restorePreviews(): void {
      if (isServer || !this._previewsRevoked) return
      this._previewsRevoked = false

      let restored = false
      for (const item of this.modelValue) {
        // `previewUrl` present means this item HAD a preview (images only) — reuse
        // that decision rather than re-deriving the is-image rule.
        if (!item.file || !item.previewUrl) continue
        item.previewUrl = URL.createObjectURL(item.file)
        restored = true
      }
      if (restored) this.requestUpdate()
    }

    private _toNumber(value: unknown): number {
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0
      if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
      }
      return 0
    }

    protected _toFileUploadItems(value: unknown): FileUploadItem[] {
      if (Array.isArray(value)) return value as FileUploadItem[]
      if (typeof value === 'string') {
        if (!value.trim()) return []
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? (parsed as FileUploadItem[]) : []
        } catch {
          return []
        }
      }
      return []
    }

    protected get _wrapperClasses(): string {
      return [
        'mono-file-upload',
        this.variant,
        this.disabled ? 'disabled' : '',
        this._dragOver ? 'dragover' : '',
        this.validationState !== 'default' ? this.validationState : '',
        this.cssClass?.root ?? '',
      ]
        .filter(Boolean)
        .join(' ')
    }

    protected _cls(base: string, key: keyof FileUploadCssClass): string {
      const extra = this.cssClass?.[key]
      return extra ? `${base} ${extra}` : base
    }

    private _cloneValue(value: FileUploadItem[]): FileUploadItem[] {
      return [...value]
    }

    private _createModelDetail(args: {
      modelValue: FileUploadItem[]
      oldValue: FileUploadItem[]
      addedFiles?: FileUploadItem[]
      removedFile?: FileUploadItem
      action: FileUploadAction
      sourceEvent?: Event
    }): FileUploadModelEventDetail {
      const currentValue = this._cloneValue(args.modelValue)
      const oldValue = this._cloneValue(args.oldValue)
      return {
        modelValue: currentValue,
        currentValue,
        oldValue,
        files: currentValue,
        addedFiles: args.addedFiles ? this._cloneValue(args.addedFiles) : [],
        removedFile: args.removedFile,
        action: args.action,
        sourceEvent: args.sourceEvent,
      }
    }

    private _emitChange(detail: FileUploadModelEventDetail): void {
      // Plain `change`: the file input's native change decorated when it is
      // the source (a pick), synthesized for drops / removals / `clear()`.
      dispatchMonoEvent(this, 'change', detail)
    }

    private _emitRemove(detail: FileUploadRemoveEventDetail): void {
      dispatchMonoEvent(this, 'remove', detail)
    }

    private _emitError(detail: FileUploadErrorEventDetail): void {
      // Plain `error` is dispatched non-bubbling: nothing above the field
      // (window error reporting included) should mistake it for its own.
      dispatchMonoEvent(this, 'error', detail)
    }

    private _emitValueEvents(detail: FileUploadModelEventDetail): void {
      this._emitChange(detail)
    }

    private _revokePreviews(files = this.modelValue): void {
      files.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }

    private _openPicker(): void {
      if (this.disabled) return
      this._inputEl?.click()
    }

    private _validateFiles(files: File[], sourceEvent?: Event): File[] {
      let nextFiles = files

      if (this.maxFileSize > 0) {
        const oversized = nextFiles.find((file) => file.size > this.maxFileSize)
        if (oversized) {
          this._emitError({
            message: `File "${oversized.name}" exceeds the maximum size limit.`,
            reason: 'max-file-size',
            file: oversized,
            maxFileSize: this.maxFileSize,
            sourceEvent,
          })
          nextFiles = nextFiles.filter((file) => file.size <= this.maxFileSize)
        }
      }

      if (this.maxFiles > 0) {
        const existingCount = this.multiple ? this.modelValue.length : 0
        const allowed = Math.max(this.maxFiles - existingCount, 0)
        if (nextFiles.length > allowed) {
          this._emitError({
            message: `Only ${this.maxFiles} file(s) are allowed.`,
            reason: 'max-files',
            maxFiles: this.maxFiles,
            sourceEvent,
          })
          nextFiles = nextFiles.slice(0, allowed)
        }
      }

      return nextFiles
    }

    private _addFiles(files: File[], sourceEvent?: Event): void {
      if (!files.length) return

      const validFiles = this._validateFiles(files, sourceEvent)
      if (!validFiles.length) return

      const oldValue = this._cloneValue(this.modelValue)
      const addedFiles = validFiles.map((file) => createUploadItem(file))

      let action: FileUploadAction = 'add'

      if (this.multiple) {
        this.modelValue = [...this.modelValue, ...addedFiles]
      } else {
        const replacedFiles = this._cloneValue(this.modelValue)
        this._revokePreviews(replacedFiles)
        this.modelValue = addedFiles.slice(0, 1)
        action = oldValue.length ? 'replace' : 'add'
      }

      const detail = this._createModelDetail({
        modelValue: this.modelValue,
        oldValue,
        addedFiles,
        action,
        sourceEvent,
      })

      this._emitValueEvents(detail)
    }

    private _handleInputChange(event: Event): void {
      const input = event.currentTarget as HTMLInputElement
      const files = Array.from(input.files ?? [])
      this._addFiles(files, event)
      input.value = ''
    }

    private _handleDragOver(event: DragEvent): void {
      if (!this.dragdrop || this.disabled) return
      event.preventDefault()
      this._dragOver = true
    }

    private _handleDragLeave(): void {
      this._dragOver = false
    }

    private _handleDrop(event: DragEvent): void {
      if (!this.dragdrop || this.disabled) return
      event.preventDefault()
      this._dragOver = false
      const files = Array.from(event.dataTransfer?.files ?? [])
      this._addFiles(files, event)
    }

    private _removeFile(id: string, sourceEvent?: Event): void {
      const removedFile = this.modelValue.find((file) => file.id === id)
      if (!removedFile) return

      const oldValue = this._cloneValue(this.modelValue)

      if (removedFile.previewUrl) URL.revokeObjectURL(removedFile.previewUrl)

      this.modelValue = this.modelValue.filter((file) => file.id !== id)

      const detail = this._createModelDetail({
        modelValue: this.modelValue,
        oldValue,
        removedFile,
        action: 'remove',
        sourceEvent,
      })

      this._emitRemove({ ...detail, removedFile, action: 'remove' })
      this._emitValueEvents(detail)
    }

    public clear(): void {
      if (!this.modelValue.length) return

      const oldValue = this._cloneValue(this.modelValue)

      this._revokePreviews()
      this.modelValue = []

      const detail = this._createModelDetail({
        modelValue: this.modelValue,
        oldValue,
        action: 'clear',
      })

      this._emitValueEvents(detail)
    }

    /* --------------------------- Icon hooks --------------------------- */

    /** Shadow build returns true to render the icon via a native `<slot>`. */
    protected _useIconSlots(): boolean {
      return false
    }

    /** Default dropzone glyph. Shadow build overrides with an inline SVG. */
    protected _renderDefaultGlyph(): TemplateResult {
      return html`<span
        class="mono-file-upload-default-icon i-mdi-cloud-upload-outline"
        mono-glyph
        aria-hidden="true"
      ></span>`
    }

    protected _renderDropzoneIcon(): TemplateResult {
      const cls = this._cls('mono-file-upload-icon', 'icon')

      if (this._hasIconSlot) {
        return html`<div class=${cls} mono-icon aria-hidden="true"><span data-mono-slot="icon"></span></div>`
      }
      if (this.icon && isIconifyClass(this.icon)) {
        return html`<div class=${cls} mono-icon aria-hidden="true"><span class=${`mono-file-upload-iconify ${this.icon}`} mono-glyph></span></div>`
      }
      if (this.icon) {
        return html`<div class=${cls} mono-icon aria-hidden="true">${this.icon}</div>`
      }
      return html`<div class=${cls} mono-icon aria-hidden="true">${this._renderDefaultGlyph()}</div>`
    }

    /* ------------------------- Text-line hooks ------------------------ */

    /** Classes of the secondary line — the new `subtitle` key and the old `subtext` one. */
    protected get _subtitleClasses(): string {
      return [
        'mono-file-upload-subtitle',
        'mono-file-upload-subtext',
        this.cssClass?.subtitle ?? '',
        this.cssClass?.subtext ?? '',
      ]
        .filter(Boolean)
        .join(' ')
    }

    /**
     * Dropzone headline. A `slot="title"` child beats the prop: the light build
     * renders an empty `[data-mono-slot]` region it re-parents the captured node
     * into; the shadow build overrides this with a native `<slot>` whose fallback
     * is the prop text. (A separate template per branch — Lit's trailing child
     * part would otherwise clear nodes appended after it.)
     */
    protected _renderTitle(): TemplateResult {
      const cls = this._cls('mono-file-upload-title', 'title')
      if (this._hasTitleSlot) {
        return html`<div class=${cls} mono-title data-mono-slot="title"></div>`
      }
      return html`<div class=${cls} mono-title ?mono-empty=${!this.title}>${this.title}</div>`
    }

    /** Dropzone secondary line — `mono-subtitle`, plus the old `mono-subtext` hook. */
    protected _renderSubtitle(): TemplateResult {
      const cls = this._subtitleClasses
      if (this._hasSubtitleSlot) {
        return html`<div class=${cls} mono-subtitle mono-subtext data-mono-slot="subtitle"></div>`
      }
      return html`<div class=${cls} mono-subtitle mono-subtext ?mono-empty=${!this.subtitle}>${this.subtitle}</div>`
    }

    protected _renderRemoveIcon(): TemplateResult {
      if (this.removeIcon && isIconifyClass(this.removeIcon)) {
        return html`<span class=${`mono-file-upload-iconify ${this.removeIcon}`} mono-glyph></span>`
      }
      if (this.removeIcon) return html`${this.removeIcon}`
      return html`<span class="mono-file-upload-iconify mono-icon i-mdi-close" mono-glyph aria-hidden="true"></span>`
    }

    /** File-type thumb glyph (non-image). Shadow build overrides with an inline SVG. */
    protected _renderThumbGlyph(item: FileUploadItem): TemplateResult {
      const icon = getFileIcon(item.type, item.name)
      return isIconifyClass(icon)
        ? html`<span class=${`mono-file-upload-iconify ${icon}`} mono-glyph aria-hidden="true"></span>`
        : html`${icon}`
    }

    /* ----------------------------- Render ----------------------------- */

    private _renderMessage(): TemplateResult | typeof nothing {
      const extra = this.cssClass?.message ?? ''

      if (this.validationMessage) {
        return html`
          <div
            class="mono-file-upload-message ${this.validationState} ${extra}"
            mono-message=${this.validationState}
            role=${this.validationState === 'invalid' ? 'alert' : nothing}
          >
            ${this.validationMessage}
          </div>
        `
      }
      if (this.helperText) {
        return html`
          <div class="mono-file-upload-message helper ${extra}" mono-message="helper">${this.helperText}</div>
        `
      }
      return nothing
    }

    private _renderList(): TemplateResult | typeof nothing {
      if (!this.modelValue.length) return nothing

      return html`
        <div class=${this._cls('mono-file-upload-list', 'list')} mono-list>
          ${this.modelValue.map(
            (item) => html`
              <div class=${this._cls('mono-file-upload-item', 'item')} mono-item>
                <div class=${this._cls('mono-file-upload-thumb', 'thumb')} mono-thumb>
                  ${item.previewUrl
                    ? html`<img src=${item.previewUrl} alt=${item.name} />`
                    : this._renderThumbGlyph(item)}
                </div>

                <div class=${this._cls('mono-file-upload-file', 'file')} mono-file>
                  <div class=${this._cls('mono-file-upload-name', 'name')} mono-name>${item.name}</div>
                  <div class=${this._cls('mono-file-upload-meta', 'meta')} mono-meta>${formatFileSize(item.size)}</div>
                </div>

                <button
                  type="button"
                  class=${this._cls('mono-file-upload-remove', 'remove')}
                  mono-remove
                  aria-label=${ifDefined(`Remove ${item.name}`)}
                  @click=${(event: Event) => this._removeFile(item.id, event)}
                >
                  ${this._renderRemoveIcon()}
                </button>
              </div>
            `,
          )}
        </div>
      `
    }

    protected override render(): TemplateResult {
      return html`
        <div
          class=${this._wrapperClasses}
          mono-file-upload
          mono-variant=${this.variant === 'default' ? nothing : this.variant}
          mono-validation-state=${this.validationState === 'default' ? nothing : this.validationState}
          ?mono-disabled=${this.disabled}
          ?mono-required=${this.required}
          ?mono-multiple=${this.multiple}
          ?mono-no-dragdrop=${!this.dragdrop}
          ?mono-dragover=${this._dragOver}
          title=""
        >
          ${this.label
            ? html`
                <label class=${this._cls('mono-file-upload-label', 'label')} mono-label>
                  ${this.label}
                  ${this.required
                    ? html`<span class=${this._cls('mono-file-upload-required', 'required')} mono-required-mark>*</span>`
                    : nothing}
                </label>
              `
            : nothing}

          <div
            class=${this._cls('mono-file-upload-dropzone', 'dropzone')}
            mono-dropzone
            @click=${this._openPicker}
            @dragover=${this._handleDragOver}
            @dragleave=${this._handleDragLeave}
            @drop=${this._handleDrop}
          >
            ${this._renderDropzoneIcon()}
            ${this._renderTitle()}
            ${this._renderSubtitle()}

            <input
              class=${this._cls('mono-file-upload-input', 'input')}
              mono-native
              type="file"
              accept=${ifDefined(this.accept || undefined)}
              ?multiple=${this.multiple}
              ?disabled=${this.disabled}
              @change=${this._handleInputChange}
            />
          </div>

          ${this._renderList()}
          ${this._renderMessage()}
        </div>
      `
    }
  }

  return MonoFileUploadCoreClass as unknown as Constructor<MonoFileUploadCoreInterface> & T
}
