import { a as __decorate, c as defineHybridPropAlias, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, o as arrayHasChanged, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as mdiGlyph, t as isIconifyClass } from "../../icon-CJkTlmTb.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, query, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
//#region src/components/file-upload/file-upload-utils.ts
function validateFileUploadProps(props) {
	const validVariants = ["default", "compact"];
	const validStates = [
		"default",
		"valid",
		"invalid",
		"warning"
	];
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.validationState && !validStates.includes(props.validationState)) return false;
	return true;
}
function formatFileSize(size) {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
/**
* Pick a default file-type icon. Returns an MDI iconify utility class
* (`i-mdi-*`, resolved by UnoCSS preset-icons) — see
* https://icon-sets.iconify.design/mdi/ . The render layer paints these as a
* masked SVG via {@link isIconifyClass}. The full set is safelisted in
* `uno.config.ts` so the CSS ships in `dist/ui/index.css`.
*/
function getFileIcon(type, name) {
	const ext = name.split(".").pop()?.toLowerCase() ?? "";
	if (type.startsWith("image/")) return "i-mdi-file-image";
	if (type.includes("pdf") || ext === "pdf") return "i-mdi-file-pdf-box";
	if (type.includes("sheet") || [
		"xls",
		"xlsx",
		"csv"
	].includes(ext)) return "i-mdi-file-excel";
	if (type.includes("word") || ["doc", "docx"].includes(ext)) return "i-mdi-file-word";
	if (type.includes("zip") || [
		"zip",
		"rar",
		"7z"
	].includes(ext)) return "i-mdi-zip-box";
	if (type.includes("video/")) return "i-mdi-file-video";
	if (type.includes("audio/")) return "i-mdi-file-music";
	return "i-mdi-file";
}
function createUploadItem(file) {
	const isImage = file.type.startsWith("image/");
	return {
		id: `${file.name}-${file.size}-${file.lastModified}`,
		file,
		name: file.name,
		size: file.size,
		type: file.type,
		previewUrl: isImage ? URL.createObjectURL(file) : void 0
	};
}
//#endregion
//#region src/components/file-upload/file-upload-core.ts
var numberStringConverter = {
	fromAttribute(value) {
		if (value === null || value === "") return 0;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	},
	toAttribute(value) {
		if (value === void 0 || value === null) return null;
		return String(value);
	}
};
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
var MonoFileUploadCore = (superClass) => {
	class MonoFileUploadCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.label = "";
			this.helperText = "";
			this.icon = "";
			this.removeIcon = "";
			this.accept = "";
			this.multiple = false;
			this.disabled = false;
			this.required = false;
			this.dragdrop = true;
			this.maxFileSize = 0;
			this.maxFiles = 0;
			this.modelValue = [];
			this.cssClass = {};
			this.variant = "default";
			this.validationState = "default";
			this.validationMessage = "";
			this._dragOver = false;
			this._hasIconSlot = false;
			this._hasTitleSlot = false;
			this._hasSubtitleSlot = false;
			this._previewsRevoked = false;
			defineHybridPropAliases(this, [
				"helperText",
				"maxFileSize",
				"maxFiles",
				"modelValue",
				"validationState",
				"validationMessage",
				"cssClass",
				"removeIcon"
			]);
			defineHybridPropAlias(this, "placeholder", "title");
			defineHybridPropAlias(this, "subtext", "subtitle");
			this.title = "Klik atau seret file ke sini";
			this.subtitle = "Pilih file untuk diunggah";
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"helpertext",
				"maxfilesize",
				"maxfiles",
				"modelvalue",
				"validationstate",
				"validationmessage",
				"removeicon",
				"remove-icon",
				"placeholder",
				"subtext"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			if (name === "helpertext") {
				this.helperText = newValue ?? "";
				return;
			}
			if (name === "maxfilesize") {
				this.maxFileSize = this._toNumber(newValue);
				return;
			}
			if (name === "maxfiles") {
				this.maxFiles = this._toNumber(newValue);
				return;
			}
			if (name === "modelvalue") {
				this.modelValue = this._toFileUploadItems(newValue);
				return;
			}
			if (name === "validationstate") {
				this.validationState = newValue ?? "default";
				return;
			}
			if (name === "validationmessage") {
				this.validationMessage = newValue ?? "";
				return;
			}
			if (name === "removeicon" || name === "remove-icon") {
				this.removeIcon = newValue ?? "";
				return;
			}
			if (name === "placeholder") {
				this.title = newValue ?? "";
				return;
			}
			if (name === "subtext") this.subtitle = newValue ?? "";
		}
		willUpdate(changed) {
			for (const key of [
				"multiple",
				"disabled",
				"required",
				"dragdrop"
			]) if (typeof this[key] === "string") {
				const normalized = this[key].toLowerCase().trim();
				this[key] = normalized === "" || normalized === "true";
			}
			if (typeof this.modelValue === "string") this.modelValue = this._toFileUploadItems(this.modelValue);
			super.willUpdate?.(changed);
		}
		connectedCallback() {
			super.connectedCallback?.();
			this._restorePreviews();
		}
		disconnectedCallback() {
			this._revokePreviews();
			this._previewsRevoked = true;
			super.disconnectedCallback();
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
		_restorePreviews() {
			if (isServer || !this._previewsRevoked) return;
			this._previewsRevoked = false;
			let restored = false;
			for (const item of this.modelValue) {
				if (!item.file || !item.previewUrl) continue;
				item.previewUrl = URL.createObjectURL(item.file);
				restored = true;
			}
			if (restored) this.requestUpdate();
		}
		_toNumber(value) {
			if (typeof value === "number") return Number.isFinite(value) ? value : 0;
			if (typeof value === "string") {
				const parsed = Number(value);
				return Number.isFinite(parsed) ? parsed : 0;
			}
			return 0;
		}
		_toFileUploadItems(value) {
			if (Array.isArray(value)) return value;
			if (typeof value === "string") {
				if (!value.trim()) return [];
				try {
					const parsed = JSON.parse(value);
					return Array.isArray(parsed) ? parsed : [];
				} catch {
					return [];
				}
			}
			return [];
		}
		get _wrapperClasses() {
			return [
				"mono-file-upload",
				this.variant,
				this.disabled ? "disabled" : "",
				this._dragOver ? "dragover" : "",
				this.validationState !== "default" ? this.validationState : "",
				this.cssClass?.root ?? ""
			].filter(Boolean).join(" ");
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		_cloneValue(value) {
			return [...value];
		}
		_createModelDetail(args) {
			const currentValue = this._cloneValue(args.modelValue);
			return {
				modelValue: currentValue,
				currentValue,
				oldValue: this._cloneValue(args.oldValue),
				files: currentValue,
				addedFiles: args.addedFiles ? this._cloneValue(args.addedFiles) : [],
				removedFile: args.removedFile,
				action: args.action,
				sourceEvent: args.sourceEvent
			};
		}
		_emitChange(detail) {
			dispatchMonoEvent(this, "change", detail);
		}
		_emitRemove(detail) {
			dispatchMonoEvent(this, "remove", detail);
		}
		_emitError(detail) {
			dispatchMonoEvent(this, "error", detail);
		}
		_emitValueEvents(detail) {
			this._emitChange(detail);
		}
		_revokePreviews(files = this.modelValue) {
			files.forEach((item) => {
				if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
			});
		}
		_openPicker() {
			if (this.disabled) return;
			this._inputEl?.click();
		}
		_validateFiles(files, sourceEvent) {
			let nextFiles = files;
			if (this.maxFileSize > 0) {
				const oversized = nextFiles.find((file) => file.size > this.maxFileSize);
				if (oversized) {
					this._emitError({
						message: `File "${oversized.name}" exceeds the maximum size limit.`,
						reason: "max-file-size",
						file: oversized,
						maxFileSize: this.maxFileSize,
						sourceEvent
					});
					nextFiles = nextFiles.filter((file) => file.size <= this.maxFileSize);
				}
			}
			if (this.maxFiles > 0) {
				const existingCount = this.multiple ? this.modelValue.length : 0;
				const allowed = Math.max(this.maxFiles - existingCount, 0);
				if (nextFiles.length > allowed) {
					this._emitError({
						message: `Only ${this.maxFiles} file(s) are allowed.`,
						reason: "max-files",
						maxFiles: this.maxFiles,
						sourceEvent
					});
					nextFiles = nextFiles.slice(0, allowed);
				}
			}
			return nextFiles;
		}
		_addFiles(files, sourceEvent) {
			if (!files.length) return;
			const validFiles = this._validateFiles(files, sourceEvent);
			if (!validFiles.length) return;
			const oldValue = this._cloneValue(this.modelValue);
			const addedFiles = validFiles.map((file) => createUploadItem(file));
			let action = "add";
			if (this.multiple) this.modelValue = [...this.modelValue, ...addedFiles];
			else {
				const replacedFiles = this._cloneValue(this.modelValue);
				this._revokePreviews(replacedFiles);
				this.modelValue = addedFiles.slice(0, 1);
				action = oldValue.length ? "replace" : "add";
			}
			const detail = this._createModelDetail({
				modelValue: this.modelValue,
				oldValue,
				addedFiles,
				action,
				sourceEvent
			});
			this._emitValueEvents(detail);
		}
		_handleInputChange(event) {
			const input = event.currentTarget;
			const files = Array.from(input.files ?? []);
			this._addFiles(files, event);
			input.value = "";
		}
		_handleDragOver(event) {
			if (!this.dragdrop || this.disabled) return;
			event.preventDefault();
			this._dragOver = true;
		}
		_handleDragLeave() {
			this._dragOver = false;
		}
		_handleDrop(event) {
			if (!this.dragdrop || this.disabled) return;
			event.preventDefault();
			this._dragOver = false;
			const files = Array.from(event.dataTransfer?.files ?? []);
			this._addFiles(files, event);
		}
		_removeFile(id, sourceEvent) {
			const removedFile = this.modelValue.find((file) => file.id === id);
			if (!removedFile) return;
			const oldValue = this._cloneValue(this.modelValue);
			if (removedFile.previewUrl) URL.revokeObjectURL(removedFile.previewUrl);
			this.modelValue = this.modelValue.filter((file) => file.id !== id);
			const detail = this._createModelDetail({
				modelValue: this.modelValue,
				oldValue,
				removedFile,
				action: "remove",
				sourceEvent
			});
			this._emitRemove({
				...detail,
				removedFile,
				action: "remove"
			});
			this._emitValueEvents(detail);
		}
		clear() {
			if (!this.modelValue.length) return;
			const oldValue = this._cloneValue(this.modelValue);
			this._revokePreviews();
			this.modelValue = [];
			const detail = this._createModelDetail({
				modelValue: this.modelValue,
				oldValue,
				action: "clear"
			});
			this._emitValueEvents(detail);
		}
		/** Shadow build returns true to render the icon via a native `<slot>`. */
		_useIconSlots() {
			return false;
		}
		/** Default dropzone glyph. Shadow build overrides with an inline SVG. */
		_renderDefaultGlyph() {
			return html`<span
        class="mono-file-upload-default-icon i-mdi-cloud-upload-outline"
        mono-glyph
        aria-hidden="true"
      ></span>`;
		}
		_renderDropzoneIcon() {
			const cls = this._cls("mono-file-upload-icon", "icon");
			if (this._hasIconSlot) return html`<div class=${cls} mono-icon aria-hidden="true"><span data-mono-slot="icon"></span></div>`;
			if (this.icon && isIconifyClass(this.icon)) return html`<div class=${cls} mono-icon aria-hidden="true"><span class=${`mono-file-upload-iconify ${this.icon}`} mono-glyph></span></div>`;
			if (this.icon) return html`<div class=${cls} mono-icon aria-hidden="true">${this.icon}</div>`;
			return html`<div class=${cls} mono-icon aria-hidden="true">${this._renderDefaultGlyph()}</div>`;
		}
		/** Classes of the secondary line — the new `subtitle` key and the old `subtext` one. */
		get _subtitleClasses() {
			return [
				"mono-file-upload-subtitle",
				"mono-file-upload-subtext",
				this.cssClass?.subtitle ?? "",
				this.cssClass?.subtext ?? ""
			].filter(Boolean).join(" ");
		}
		/**
		* Dropzone headline. A `slot="title"` child beats the prop: the light build
		* renders an empty `[data-mono-slot]` region it re-parents the captured node
		* into; the shadow build overrides this with a native `<slot>` whose fallback
		* is the prop text. (A separate template per branch — Lit's trailing child
		* part would otherwise clear nodes appended after it.)
		*/
		_renderTitle() {
			const cls = this._cls("mono-file-upload-title", "title");
			if (this._hasTitleSlot) return html`<div class=${cls} mono-title data-mono-slot="title"></div>`;
			return html`<div class=${cls} mono-title ?mono-empty=${!this.title}>${this.title}</div>`;
		}
		/** Dropzone secondary line — `mono-subtitle`, plus the old `mono-subtext` hook. */
		_renderSubtitle() {
			const cls = this._subtitleClasses;
			if (this._hasSubtitleSlot) return html`<div class=${cls} mono-subtitle mono-subtext data-mono-slot="subtitle"></div>`;
			return html`<div class=${cls} mono-subtitle mono-subtext ?mono-empty=${!this.subtitle}>${this.subtitle}</div>`;
		}
		_renderRemoveIcon() {
			if (this.removeIcon && isIconifyClass(this.removeIcon)) return html`<span class=${`mono-file-upload-iconify ${this.removeIcon}`} mono-glyph></span>`;
			if (this.removeIcon) return html`${this.removeIcon}`;
			return html`<span class="mono-file-upload-iconify mono-icon i-mdi-close" mono-glyph aria-hidden="true"></span>`;
		}
		/** File-type thumb glyph (non-image). Shadow build overrides with an inline SVG. */
		_renderThumbGlyph(item) {
			const icon = getFileIcon(item.type, item.name);
			return isIconifyClass(icon) ? html`<span class=${`mono-file-upload-iconify ${icon}`} mono-glyph aria-hidden="true"></span>` : html`${icon}`;
		}
		_renderMessage() {
			const extra = this.cssClass?.message ?? "";
			if (this.validationMessage) return html`
          <div
            class="mono-file-upload-message ${this.validationState} ${extra}"
            mono-message=${this.validationState}
            role=${this.validationState === "invalid" ? "alert" : nothing}
          >
            ${this.validationMessage}
          </div>
        `;
			if (this.helperText) return html`
          <div class="mono-file-upload-message helper ${extra}" mono-message="helper">${this.helperText}</div>
        `;
			return nothing;
		}
		_renderList() {
			if (!this.modelValue.length) return nothing;
			return html`
        <div class=${this._cls("mono-file-upload-list", "list")} mono-list>
          ${this.modelValue.map((item) => html`
              <div class=${this._cls("mono-file-upload-item", "item")} mono-item>
                <div class=${this._cls("mono-file-upload-thumb", "thumb")} mono-thumb>
                  ${item.previewUrl ? html`<img src=${item.previewUrl} alt=${item.name} />` : this._renderThumbGlyph(item)}
                </div>

                <div class=${this._cls("mono-file-upload-file", "file")} mono-file>
                  <div class=${this._cls("mono-file-upload-name", "name")} mono-name>${item.name}</div>
                  <div class=${this._cls("mono-file-upload-meta", "meta")} mono-meta>${formatFileSize(item.size)}</div>
                </div>

                <button
                  type="button"
                  class=${this._cls("mono-file-upload-remove", "remove")}
                  mono-remove
                  aria-label=${ifDefined(`Remove ${item.name}`)}
                  @click=${(event) => this._removeFile(item.id, event)}
                >
                  ${this._renderRemoveIcon()}
                </button>
              </div>
            `)}
        </div>
      `;
		}
		render() {
			return html`
        <div
          class=${this._wrapperClasses}
          mono-file-upload
          mono-variant=${this.variant === "default" ? nothing : this.variant}
          mono-validation-state=${this.validationState === "default" ? nothing : this.validationState}
          ?mono-disabled=${this.disabled}
          ?mono-required=${this.required}
          ?mono-multiple=${this.multiple}
          ?mono-no-dragdrop=${!this.dragdrop}
          ?mono-dragover=${this._dragOver}
          title=""
        >
          ${this.label ? html`
                <label class=${this._cls("mono-file-upload-label", "label")} mono-label>
                  ${this.label}
                  ${this.required ? html`<span class=${this._cls("mono-file-upload-required", "required")} mono-required-mark>*</span>` : nothing}
                </label>
              ` : nothing}

          <div
            class=${this._cls("mono-file-upload-dropzone", "dropzone")}
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
              class=${this._cls("mono-file-upload-input", "input")}
              mono-native
              type="file"
              accept=${ifDefined(this.accept || void 0)}
              ?multiple=${this.multiple}
              ?disabled=${this.disabled}
              @change=${this._handleInputChange}
            />
          </div>

          ${this._renderList()}
          ${this._renderMessage()}
        </div>
      `;
		}
	}
	__decorate([property({ type: String })], MonoFileUploadCoreClass.prototype, "label", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoFileUploadCoreClass.prototype, "helperText", void 0);
	__decorate([property({ type: String })], MonoFileUploadCoreClass.prototype, "title", void 0);
	__decorate([property({ type: String })], MonoFileUploadCoreClass.prototype, "subtitle", void 0);
	__decorate([property({ type: String })], MonoFileUploadCoreClass.prototype, "icon", void 0);
	__decorate([property({
		type: String,
		attribute: "remove-icon"
	})], MonoFileUploadCoreClass.prototype, "removeIcon", void 0);
	__decorate([property({ type: String })], MonoFileUploadCoreClass.prototype, "accept", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoFileUploadCoreClass.prototype, "multiple", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoFileUploadCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoFileUploadCoreClass.prototype, "required", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoFileUploadCoreClass.prototype, "dragdrop", void 0);
	__decorate([property({
		attribute: "max-file-size",
		converter: numberStringConverter
	})], MonoFileUploadCoreClass.prototype, "maxFileSize", void 0);
	__decorate([property({
		attribute: "max-files",
		converter: numberStringConverter
	})], MonoFileUploadCoreClass.prototype, "maxFiles", void 0);
	__decorate([property({
		attribute: false,
		hasChanged: arrayHasChanged
	})], MonoFileUploadCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ attribute: false })], MonoFileUploadCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ type: String })], MonoFileUploadCoreClass.prototype, "variant", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoFileUploadCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoFileUploadCoreClass.prototype, "validationMessage", void 0);
	__decorate([state()], MonoFileUploadCoreClass.prototype, "_dragOver", void 0);
	__decorate([state()], MonoFileUploadCoreClass.prototype, "_hasIconSlot", void 0);
	__decorate([state()], MonoFileUploadCoreClass.prototype, "_hasTitleSlot", void 0);
	__decorate([state()], MonoFileUploadCoreClass.prototype, "_hasSubtitleSlot", void 0);
	__decorate([query(".mono-file-upload-input")], MonoFileUploadCoreClass.prototype, "_inputEl", void 0);
	return MonoFileUploadCoreClass;
};
//#endregion
//#region src/components/file-upload/file-upload.css?raw
var file_upload_default = "/* =========================================================================\r\n   mono-file-upload — a port of Basecoat's `.empty` (the dropzone) and `.item`\r\n   (the file rows) inside a `.field` (basecoat-css@1.0.2, vega style).\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-file-upload variant=\"compact\" label=\"Docs\" title=\"Drop here\" subtitle=\"PDF, DOCX\">\r\n     <div mono-file-upload mono-variant=\"compact\">\r\n       <label mono-label>Docs</label>\r\n       <label mono-dropzone>\r\n         <span mono-icon><span mono-glyph class=\"i-mdi-cloud-upload-outline\"></span></span>\r\n         <span mono-title>Drop here</span>\r\n         <span mono-subtitle>PDF, DOCX</span>\r\n         <input mono-native type=\"file\" />\r\n       </label>\r\n       <div mono-list>\r\n         <div mono-item>\r\n           <span mono-thumb>…</span>\r\n           <span mono-file><span mono-name>a.pdf</span><span mono-meta>12 KB</span></span>\r\n           <button mono-remove type=\"button\">…</button>\r\n         </div>\r\n       </div>\r\n       <div mono-message=\"helper\">…</div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-variant])` = default,\r\n   no `mono-validation-state` = default). The element renders these on its root\r\n   (both builds) plus the states `mono-disabled` / `mono-required` /\r\n   `mono-multiple` / `mono-no-dragdrop` (drag-drop is ON by default, so the\r\n   attribute marks the exception) and the live `mono-dragover`. The old\r\n   classes (`.mono-file-upload.compact.invalid`) are still emitted as inert\r\n   hooks until 2.0 but no rule here reads them.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-file-upload]              ≡ .field (flex w-full flex-col gap-3)\r\n     [mono-label]                    ≡ .field > label / .label (text-sm leading-snug font-medium)\r\n     [mono-dropzone]                 ≡ .empty (flex flex-col items-center justify-center text-center\r\n                                       text-balance, gap-4 rounded-lg border-dashed p-12) — the border\r\n                                       WIDTH is the `border` utility upstream puts in the markup, and\r\n                                       the gap is `.empty > header`'s gap-2 because our title and\r\n                                       subtext are flat siblings, not a nested <header>\r\n     [mono-icon]                     ≡ .empty figure + .empty figure:has(> svg:only-child)\r\n                                       (mb-2, bg-muted text-foreground size-10 rounded-lg, glyph size-6)\r\n     [mono-title]                    ≡ .empty :is(h2, h3, h4) (text-lg font-medium tracking-tight)\r\n     [mono-subtitle]/[mono-subtext]  ≡ .empty > header > p (text-sm/relaxed text-muted-foreground)\r\n     [mono-native]                   ≡ .field > input[type='file'] — HIDDEN here: the whole dropzone\r\n                                       is the picker, so the native control never shows\r\n     [mono-list]                     ≡ .item-group (flex w-full flex-col, gap-2.5 beside sm items)\r\n     [mono-item]                     ≡ .item[data-variant='outline'][data-size='sm']\r\n                                       (flex flex-wrap items-center border-border rounded-md text-sm,\r\n                                        gap-2.5 px-3 py-2.5, transition-colors)\r\n     [mono-thumb]                    ≡ .item > figure:has(> img) at sm (size-8 rounded-sm overflow-hidden,\r\n                                       img size-full object-cover) + figure:has(> svg:only-child) (glyph size-4)\r\n     [mono-file]                     ≡ .item > section (flex flex-1 flex-col gap-1)\r\n     [mono-name]                     ≡ .item :is(h2, h3, h4) (line-clamp-1 text-sm/snug font-medium)\r\n     [mono-meta]                     ≡ .item p (text-sm/normal text-muted-foreground line-clamp-2)\r\n     [mono-remove]                   ≡ .btn[data-variant='ghost'][data-size='icon-sm']\r\n                                       (size-8 rounded-[min(radius-md,10px)] hover:bg-muted, glyph size-4)\r\n     [mono-message=\"…\"]              ≡ .field > p / .field [role='alert'] (text-sm, destructive when invalid)\r\n     [mono-validation-state=\"invalid\"] ≡ aria-invalid:border-destructive aria-invalid:ring-destructive/20\r\n     [mono-validation-state=\"valid|warning\"] ≡ EXTENSION (the same treatment in --success / --warning)\r\n     [mono-variant=\"compact\"]        ≡ the `.empty` + `.item` metrics the COMPACT styles use\r\n                                       (nova/lyra/mira: .empty p-6, figure size-8 with a size-4 glyph,\r\n                                        title text-sm; rows drop to .item[data-size='xs'])\r\n     [mono-dragover]                 ≡ EXTENSION (the .item focus-visible treatment: border-ring +\r\n                                       ring-[3px] ring-ring/50, plus an accent tint)\r\n     [mono-disabled]                 ≡ .btn disabled:opacity-50\r\n\r\n   Upstream's dropzone is genuinely large — `.empty` is `p-12` — so this port is\r\n   TALLER than the pre-Basecoat uploader (which padded 1.2rem). `compact` is the\r\n   short one, and `--mono-file-upload-dropzone-padding` is one line either way.\r\n\r\n   Specificity contract (same as the pre-port class sheet): a part's RESTING rule\r\n   is exactly one attribute strong — `:where([mono-file-upload]) [mono-item]` =\r\n   (0,1,0) — so a utility class handed in through `cssClass` wins by source\r\n   order, while the prop and state rules stay heavier and win over it.\r\n\r\n   The two variants own SEPARATE public knobs (`-dropzone-padding` vs\r\n   `-compact-padding`, `-item-padding-x` vs `-compact-item-padding-x`, …): a\r\n   flavor writing one shared knob would repaint both looks at once, which is the\r\n   bug that made every style's `underlined` textarea come out filled.\r\n\r\n   FLAVORS set `--mono-file-upload-{radius,dropzone-padding,dropzone-gap,\r\n   icon-offset,icon-size,icon-glyph-size,icon-radius,title-font-size,\r\n   title-transform,item-radius,item-padding-*,item-gap,list-gap,thumb-size,\r\n   thumb-radius,…}` — the DEFAULT variant's set; `compact` has its own\r\n   `--mono-file-upload-compact-*` twins so one look never repaints the other; every fallback\r\n   here is vega's value\r\n   (`node scripts/basecoat-styles.mjs --varying \"^\\.(empty|item)\"`).\r\n   ========================================================================= */\r\n\r\nmono-file-upload {\r\n  display: block;\r\n}\r\n\r\n[mono-file-upload] {\r\n  /* ── palette: each slot is a public knob over a Basecoat token ─────────── */\r\n  --_mono-file-upload-text: var(--mono-file-upload-text, var(--foreground));\r\n  --_mono-file-upload-muted: var(--mono-file-upload-muted, var(--muted-foreground));\r\n  /* the accent: the dropzone glyph, and the ring the dragover state paints */\r\n  --_mono-file-upload-primary: var(--mono-file-upload-primary, var(--primary));\r\n  --_mono-file-upload-success: var(--mono-file-upload-success, var(--success));\r\n  --_mono-file-upload-danger: var(--mono-file-upload-danger, var(--destructive));\r\n  --_mono-file-upload-warning: var(--mono-file-upload-warning, var(--warning));\r\n\r\n  /* `-border` is the pre-Basecoat public name for the dropzone edge — kept as\r\n     the fallback so a consumer that set it keeps working */\r\n  --_mono-file-upload-border-color: var(--mono-file-upload-border-color, var(--mono-file-upload-border, var(--border)));\r\n  --_mono-file-upload-border-width: var(--mono-file-upload-border-width, var(--mono-border-width));\r\n  --_mono-file-upload-border-style: var(--mono-file-upload-border-style, dashed);\r\n  /* .empty has no fill of its own; `-background` is the pre-Basecoat name */\r\n  --_mono-file-upload-dropzone-bg: var(--mono-file-upload-dropzone-bg, var(--mono-file-upload-background, transparent));\r\n  /* hover: the ghost treatment (bg-muted, dark:bg-muted/50) */\r\n  --_mono-file-upload-dropzone-hover-bg: var(--mono-file-upload-dropzone-hover-bg, var(--mono-mode-ghost-hover));\r\n  --_mono-file-upload-radius: var(--mono-file-upload-radius, var(--mono-radius-lg));\r\n\r\n  --_mono-file-upload-ring-color: var(--mono-file-upload-ring-color, var(--ring));\r\n  --_mono-file-upload-ring-width: var(--mono-file-upload-ring-width, var(--mono-ring-width));\r\n  --_mono-file-upload-ring-alpha: var(--mono-file-upload-ring-alpha, var(--mono-ring-alpha));\r\n\r\n  /* the icon plate — .empty figure:has(> svg:only-child) is a muted square */\r\n  --_mono-file-upload-icon-bg: var(--mono-file-upload-icon-bg, var(--muted));\r\n  --_mono-file-upload-icon-color: var(--mono-file-upload-icon-color, var(--_mono-file-upload-text));\r\n  --_mono-file-upload-icon-radius: var(--mono-file-upload-icon-radius, var(--mono-radius-lg));\r\n\r\n  /* the file rows — .item[data-variant='outline'] rings, it does not fill.\r\n     `-surface` is the pre-Basecoat name for the row background. */\r\n  --_mono-file-upload-item-bg: var(--mono-file-upload-item-bg, var(--mono-file-upload-surface, transparent));\r\n  --_mono-file-upload-item-border-color: var(--mono-file-upload-item-border-color, var(--border));\r\n  --_mono-file-upload-item-border-width: var(--mono-file-upload-item-border-width, var(--mono-border-width));\r\n  --_mono-file-upload-item-radius: var(--mono-file-upload-item-radius, var(--mono-radius-md));\r\n  --_mono-file-upload-thumb-bg: var(--mono-file-upload-thumb-bg, var(--muted));\r\n  --_mono-file-upload-thumb-radius: var(--mono-file-upload-thumb-radius, var(--mono-radius-sm));\r\n\r\n  /* ── the DEFAULT variant's metrics; `compact` re-points every preset ───────\r\n     basecoat@1.0.2 styles/vega.css .empty — gap-4 rounded-lg border-dashed p-12;\r\n     .empty figure — mb-2; .empty figure:has(> svg:only-child) — size-10 rounded-lg\r\n     with a size-6 glyph; .empty :is(h2,h3,h4) — text-lg; .item[data-size='sm'] —\r\n     gap-2.5 px-3 py-2.5 with a size-8 image figure; .item-group — gap-2.5 */\r\n  --_mono-file-upload-dropzone-padding: var(--_mono-file-upload-dropzone-padding-preset, calc(var(--mono-spacing) * 12));\r\n  --_mono-file-upload-dropzone-gap: var(--_mono-file-upload-dropzone-gap-preset, calc(var(--mono-spacing) * 2));\r\n  --_mono-file-upload-icon-offset: var(--_mono-file-upload-icon-offset-preset, calc(var(--mono-spacing) * 4));\r\n  --_mono-file-upload-icon-size: var(--_mono-file-upload-icon-size-preset, calc(var(--mono-spacing) * 10));\r\n  --_mono-file-upload-icon-glyph-size: var(--_mono-file-upload-icon-glyph-size-preset, calc(var(--mono-spacing) * 6));\r\n  --_mono-file-upload-title-font-size: var(--_mono-file-upload-title-font-size-preset, var(--mono-text-lg));\r\n  --_mono-file-upload-title-line-height: var(--_mono-file-upload-title-line-height-preset, var(--mono-text-lg--lh));\r\n  --_mono-file-upload-list-gap: var(--_mono-file-upload-list-gap-preset, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-file-upload-item-gap: var(--_mono-file-upload-item-gap-preset, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-file-upload-item-padding-x: var(--_mono-file-upload-item-padding-x-preset, calc(var(--mono-spacing) * 3));\r\n  --_mono-file-upload-item-padding-y: var(--_mono-file-upload-item-padding-y-preset, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-file-upload-file-gap: var(--_mono-file-upload-file-gap-preset, var(--mono-spacing));\r\n  --_mono-file-upload-thumb-size: var(--_mono-file-upload-thumb-size-preset, calc(var(--mono-spacing) * 8));\r\n  --_mono-file-upload-meta-font-size: var(--_mono-file-upload-meta-font-size-preset, var(--mono-text-sm));\r\n\r\n  /* basecoat@1.0.2 components/field.css .field — flex w-full flex-col;\r\n     styles/vega.css .field — gap-3 */\r\n  display: flex;\r\n  flex-direction: column;\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n  gap: var(--mono-file-upload-gap, calc(var(--mono-spacing) * 3));\r\n  color: var(--_mono-file-upload-text);\r\n  font-family: inherit;\r\n}\r\n\r\n[mono-file-upload] *,\r\n[mono-file-upload] *::before,\r\n[mono-file-upload] *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* The shadow build renders every region and marks the empty ones; this hides\r\n   them. It must out-specify the region rules below, hence the root attribute. */\r\n[mono-file-upload] :is([mono-label], [mono-icon], [mono-title], [mono-subtitle], [mono-subtext], [mono-list], [mono-message])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Variants — the DEFAULT look, and the compact one\r\n   ========================================= */\r\n\r\n/* `default` is vega's `.empty` + `.item[data-size='sm']`. The knobs are scoped\r\n   to the variant so a flavor can restyle one look without touching the other. */\r\n[mono-file-upload]:not([mono-variant=\"compact\"]) {\r\n  --_mono-file-upload-dropzone-padding-preset: var(--mono-file-upload-dropzone-padding);\r\n  --_mono-file-upload-dropzone-gap-preset: var(--mono-file-upload-dropzone-gap);\r\n  --_mono-file-upload-icon-offset-preset: var(--mono-file-upload-icon-offset);\r\n  --_mono-file-upload-icon-size-preset: var(--mono-file-upload-icon-size);\r\n  --_mono-file-upload-icon-glyph-size-preset: var(--mono-file-upload-icon-glyph-size);\r\n  --_mono-file-upload-title-font-size-preset: var(--mono-file-upload-title-font-size);\r\n  --_mono-file-upload-title-line-height-preset: var(--mono-file-upload-title-line-height);\r\n  --_mono-file-upload-list-gap-preset: var(--mono-file-upload-list-gap);\r\n  --_mono-file-upload-item-gap-preset: var(--mono-file-upload-item-gap);\r\n  --_mono-file-upload-item-padding-x-preset: var(--mono-file-upload-item-padding-x);\r\n  --_mono-file-upload-item-padding-y-preset: var(--mono-file-upload-item-padding-y);\r\n  --_mono-file-upload-file-gap-preset: var(--mono-file-upload-file-gap);\r\n  --_mono-file-upload-thumb-size-preset: var(--mono-file-upload-thumb-size);\r\n  --_mono-file-upload-meta-font-size-preset: var(--mono-file-upload-meta-font-size);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/nova.css .empty — rounded-xl p-6;\r\n   styles/nova.css .empty figure:has(> svg:only-child) — size-8 with a size-4 glyph;\r\n   styles/nova.css .empty :is(h2, h3, h4) — text-sm;\r\n   styles/vega.css .item[data-size='xs'] — gap-2 px-2.5 py-2;\r\n   styles/vega.css .item[data-size='xs'] > section — gap-0;\r\n   styles/vega.css .item[data-size='xs'] p — text-xs;\r\n   styles/vega.css .item[data-size='xs'] > figure:has(> img) — size-6;\r\n   styles/vega.css .item-group:has(> .item[data-size='xs']) — gap-2\r\n   — DEVIATION: the radius stays the default variant's (a flavor owns that axis). */\r\n[mono-file-upload][mono-variant=\"compact\"] {\r\n  --_mono-file-upload-dropzone-padding-preset: var(--mono-file-upload-compact-padding, calc(var(--mono-spacing) * 6));\r\n  --_mono-file-upload-dropzone-gap-preset: var(--mono-file-upload-compact-gap, var(--mono-spacing));\r\n  --_mono-file-upload-icon-offset-preset: var(--mono-file-upload-compact-icon-offset, calc(var(--mono-spacing) * 3));\r\n  --_mono-file-upload-icon-size-preset: var(--mono-file-upload-compact-icon-size, calc(var(--mono-spacing) * 8));\r\n  --_mono-file-upload-icon-glyph-size-preset: var(--mono-file-upload-compact-icon-glyph-size, calc(var(--mono-spacing) * 4));\r\n  --_mono-file-upload-title-font-size-preset: var(--mono-file-upload-compact-title-font-size, var(--mono-text-sm));\r\n  --_mono-file-upload-title-line-height-preset: var(--mono-file-upload-compact-title-line-height, var(--mono-leading-snug));\r\n  --_mono-file-upload-list-gap-preset: var(--mono-file-upload-compact-list-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-file-upload-item-gap-preset: var(--mono-file-upload-compact-item-gap, calc(var(--mono-spacing) * 2));\r\n  --_mono-file-upload-item-padding-x-preset: var(--mono-file-upload-compact-item-padding-x, calc(var(--mono-spacing) * 2.5));\r\n  --_mono-file-upload-item-padding-y-preset: var(--mono-file-upload-compact-item-padding-y, calc(var(--mono-spacing) * 2));\r\n  --_mono-file-upload-file-gap-preset: var(--mono-file-upload-compact-file-gap, 0px);\r\n  --_mono-file-upload-thumb-size-preset: var(--mono-file-upload-compact-thumb-size, calc(var(--mono-spacing) * 6));\r\n  --_mono-file-upload-meta-font-size-preset: var(--mono-file-upload-compact-meta-font-size, var(--mono-text-xs));\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label — text-sm leading-snug font-medium */\r\n:where([mono-file-upload]) > [mono-label] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  width: fit-content;\r\n  gap: calc(var(--mono-spacing) * 1);\r\n  font-size: var(--mono-file-upload-label-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-file-upload-label-line-height, var(--mono-leading-snug));\r\n  font-weight: var(--mono-file-upload-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium)));\r\n  color: var(--mono-file-upload-label-color, var(--_mono-file-upload-text));\r\n}\r\n\r\n[mono-file-upload][mono-validation-state=\"invalid\"] > [mono-label] {\r\n  color: var(--mono-file-upload-label-color, var(--_mono-file-upload-danger));\r\n}\r\n\r\n:where([mono-file-upload]) [mono-required-mark] {\r\n  color: var(--mono-file-upload-required-color, var(--destructive));\r\n}\r\n\r\n/* =========================================\r\n   Dropzone — `.empty`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/empty.css .empty — flex w-full min-w-0 flex-col\r\n   items-center justify-center text-center text-balance;\r\n   styles/vega.css .empty — gap-4 rounded-lg border-dashed p-12\r\n   — the border WIDTH comes from the `border` utility upstream writes in markup,\r\n   so it is a knob here; `transition-[color,box-shadow]` is the field treatment. */\r\n:where([mono-file-upload]) [mono-dropzone] {\r\n  display: flex;\r\n  width: 100%;\r\n  min-width: 0;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  justify-content: center;\r\n  text-align: center;\r\n  text-wrap: balance;\r\n  gap: var(--_mono-file-upload-dropzone-gap);\r\n  padding: var(--_mono-file-upload-dropzone-padding);\r\n  border: var(--_mono-file-upload-border-width) var(--_mono-file-upload-border-style)\r\n    var(--_mono-file-upload-border-color);\r\n  border-radius: var(--_mono-file-upload-radius);\r\n  background-color: var(--_mono-file-upload-dropzone-bg);\r\n  cursor: pointer;\r\n  transition:\r\n    color var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    border-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease);\r\n  /* the two-slot stack the ports share: the ring is written by a state rule */\r\n  box-shadow: var(--_mono-file-upload-ring, 0 0 #0000);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted\r\n   (dark:hover:bg-muted/50), carried by --mono-mode-ghost-hover */\r\n@media (hover: hover) {\r\n  [mono-file-upload]:not([mono-disabled]) [mono-dropzone]:hover {\r\n    border-color: var(--mono-file-upload-hover-border-color, var(--_mono-file-upload-primary));\r\n    background-color: var(--_mono-file-upload-dropzone-hover-bg);\r\n  }\r\n}\r\n\r\n/* EXTENSION — the drag-over state wears the `.item` focus treatment\r\n   (basecoat@1.0.2 components/item.css .item — focus-visible:border-ring\r\n   focus-visible:ring-[3px] focus-visible:ring-ring/50) in the accent colour */\r\n[mono-file-upload][mono-dragover] [mono-dropzone] {\r\n  border-color: var(--_mono-file-upload-primary);\r\n  border-style: solid;\r\n  background-color: color-mix(in oklab, var(--_mono-file-upload-primary) var(--mono-mode-tint), transparent);\r\n  --_mono-file-upload-ring: 0 0 0 var(--_mono-file-upload-ring-width)\r\n    color-mix(in oklab, var(--_mono-file-upload-primary) var(--_mono-file-upload-ring-alpha), transparent);\r\n}\r\n\r\n/* basecoat@1.0.2 components/button.css .btn — disabled:pointer-events-none disabled:opacity-50 */\r\n[mono-file-upload][mono-disabled] [mono-dropzone] {\r\n  opacity: 0.5;\r\n  cursor: not-allowed;\r\n  pointer-events: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > textarea, .textarea —\r\n   aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3\r\n   (dark: destructive/50 and /40, carried by the mode tokens) */\r\n[mono-file-upload][mono-validation-state=\"invalid\"] [mono-dropzone] {\r\n  border-color: var(--mono-file-upload-invalid-border-color, var(--mono-mode-invalid-border));\r\n  --_mono-file-upload-ring: 0 0 0 var(--_mono-file-upload-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* EXTENSION — the same treatment in --success / --warning */\r\n[mono-file-upload][mono-validation-state=\"valid\"] [mono-dropzone] {\r\n  border-color: var(--_mono-file-upload-success);\r\n  --_mono-file-upload-ring: 0 0 0 var(--_mono-file-upload-ring-width)\r\n    color-mix(in oklab, var(--_mono-file-upload-success) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n[mono-file-upload][mono-validation-state=\"warning\"] [mono-dropzone] {\r\n  border-color: var(--_mono-file-upload-warning);\r\n  --_mono-file-upload-ring: 0 0 0 var(--_mono-file-upload-ring-width)\r\n    color-mix(in oklab, var(--_mono-file-upload-warning) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n/* =========================================\r\n   Dropzone contents — figure, title, subtext\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .empty figure — mb-2;\r\n   styles/vega.css .empty figure:has(> svg:only-child) — bg-muted text-foreground\r\n   flex size-10 shrink-0 items-center justify-center rounded-lg\r\n   — DEVIATION: keyed off the part attribute, not `:has(> svg:only-child)`: the\r\n   light build paints the glyph with an `i-*` MASK span and the shadow build with\r\n   an inline <svg>, so a shape test would style one build and not the other. */\r\n:where([mono-file-upload]) [mono-icon] {\r\n  display: flex;\r\n  flex-shrink: 0;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-file-upload-icon-size);\r\n  height: var(--_mono-file-upload-icon-size);\r\n  margin-bottom: var(--_mono-file-upload-icon-offset);\r\n  border-radius: var(--_mono-file-upload-icon-radius);\r\n  background-color: var(--_mono-file-upload-icon-bg);\r\n  color: var(--_mono-file-upload-icon-color);\r\n  font-size: var(--_mono-file-upload-icon-glyph-size);\r\n  line-height: 1;\r\n  overflow: hidden;\r\n}\r\n\r\n/* `[&_svg:not([class*='size-'])]:size-6` — our glyph is a mask span (light) or an\r\n   inline SVG (shadow); both are sized by the same box. Only [mono-glyph] is\r\n   touched: a slotted custom icon is light DOM in BOTH builds, so a bare `svg`\r\n   descendant rule would reach it in light and not in shadow. */\r\n:where([mono-file-upload]) [mono-icon] [mono-glyph] {\r\n  display: block;\r\n  width: var(--_mono-file-upload-icon-glyph-size);\r\n  height: var(--_mono-file-upload-icon-glyph-size);\r\n  flex-shrink: 0;\r\n  color: inherit;\r\n}\r\n\r\n:where([mono-file-upload]) [mono-icon] [mono-glyph] > svg {\r\n  display: block;\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .empty :is(h2, h3, h4) — text-lg font-medium tracking-tight */\r\n:where([mono-file-upload]) [mono-title] {\r\n  font-size: var(--_mono-file-upload-title-font-size);\r\n  line-height: var(--_mono-file-upload-title-line-height);\r\n  font-weight: var(--mono-file-upload-title-font-weight, var(--mono-font-weight-medium));\r\n  letter-spacing: var(--mono-file-upload-title-tracking, var(--mono-tracking-tight));\r\n  text-transform: var(--mono-file-upload-title-transform, none);\r\n  color: var(--_mono-file-upload-text);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .empty > header > p — text-muted-foreground text-sm/relaxed\r\n   `mono-subtitle` is the current part name; the element still emits the old\r\n   `mono-subtext` beside it, and hand-written markup may use either. The CSS vars\r\n   keep their `-subtext-` names. */\r\n:where([mono-file-upload]) :is([mono-subtitle], [mono-subtext]) {\r\n  font-size: var(--mono-file-upload-subtext-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-file-upload-subtext-line-height, var(--mono-leading-relaxed));\r\n  color: var(--mono-file-upload-subtext-color, var(--_mono-file-upload-muted));\r\n}\r\n\r\n/* The whole dropzone IS the picker — the native control never shows. */\r\n:where([mono-file-upload]) [mono-native] {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   File list — `.item-group` and `.item`\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 components/item.css .item-group — flex w-full flex-col;\r\n   styles/vega.css .item-group:has(> .item[data-size='sm']) — gap-2.5 */\r\n:where([mono-file-upload]) [mono-list] {\r\n  display: flex;\r\n  width: 100%;\r\n  flex-direction: column;\r\n  gap: var(--_mono-file-upload-list-gap);\r\n}\r\n\r\n/* basecoat@1.0.2 components/item.css .item — flex w-full flex-wrap items-center\r\n   border transition-colors duration-100 outline-none;\r\n   styles/vega.css .item — rounded-md border text-sm;\r\n   styles/vega.css .item[data-variant='outline'] — border-border;\r\n   styles/vega.css .item[data-size='sm'] — gap-2.5 px-3 py-2.5 */\r\n:where([mono-file-upload]) [mono-item] {\r\n  display: flex;\r\n  width: 100%;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: var(--_mono-file-upload-item-gap);\r\n  padding-inline: var(--_mono-file-upload-item-padding-x);\r\n  padding-block: var(--_mono-file-upload-item-padding-y);\r\n  border: var(--_mono-file-upload-item-border-width) solid var(--_mono-file-upload-item-border-color);\r\n  border-radius: var(--_mono-file-upload-item-radius);\r\n  background-color: var(--_mono-file-upload-item-bg);\r\n  font-size: var(--mono-file-upload-item-font-size, var(--mono-text-sm));\r\n  transition:\r\n    background-color 100ms var(--mono-ease),\r\n    border-color 100ms var(--mono-ease);\r\n  outline: none;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .item[data-size='sm'] > figure:has(> img) — size-8;\r\n   styles/vega.css .item > figure:has(> img) — overflow-hidden rounded-sm;\r\n   components/item.css .item > figure:has(> img) — [&_img]:size-full [&_img]:object-cover;\r\n   styles/vega.css .item > figure:has(> svg:only-child) — a size-4 glyph */\r\n:where([mono-file-upload]) [mono-thumb] {\r\n  display: inline-flex;\r\n  flex-shrink: 0;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--_mono-file-upload-thumb-size);\r\n  height: var(--_mono-file-upload-thumb-size);\r\n  overflow: hidden;\r\n  border-radius: var(--_mono-file-upload-thumb-radius);\r\n  background-color: var(--_mono-file-upload-thumb-bg);\r\n  color: var(--mono-file-upload-thumb-color, var(--_mono-file-upload-muted));\r\n  font-size: calc(var(--mono-spacing) * 4);\r\n  line-height: 1;\r\n}\r\n\r\n:where([mono-file-upload]) [mono-thumb] > img {\r\n  width: 100%;\r\n  height: 100%;\r\n  object-fit: cover;\r\n}\r\n\r\n:where([mono-file-upload]) [mono-thumb] [mono-glyph] {\r\n  display: block;\r\n  width: calc(var(--mono-spacing) * 4);\r\n  height: calc(var(--mono-spacing) * 4);\r\n  flex-shrink: 0;\r\n}\r\n\r\n:where([mono-file-upload]) [mono-thumb] [mono-glyph] > svg {\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n/* basecoat@1.0.2 components/item.css .item > section — flex flex-1 flex-col;\r\n   styles/vega.css .item > section — gap-1 (gap-0 at data-size='xs') */\r\n:where([mono-file-upload]) [mono-file] {\r\n  display: flex;\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n  flex-direction: column;\r\n  gap: var(--_mono-file-upload-file-gap);\r\n}\r\n\r\n/* basecoat@1.0.2 components/item.css .item :is(h2, h3, h4) — line-clamp-1 flex\r\n   w-fit items-center;\r\n   styles/vega.css .item :is(h2, h3, h4) — text-sm leading-snug font-medium\r\n   — DEVIATION: one line ellipsised with `text-overflow`, not `line-clamp-1`: a\r\n   file name is a single line and must truncate mid-word, which the WebKit box\r\n   clamp does not do. */\r\n:where([mono-file-upload]) [mono-name] {\r\n  max-width: 100%;\r\n  font-size: var(--mono-file-upload-name-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-file-upload-name-line-height, var(--mono-leading-snug));\r\n  font-weight: var(--mono-file-upload-name-font-weight, var(--mono-font-weight-medium));\r\n  color: var(--_mono-file-upload-text);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n}\r\n\r\n/* basecoat@1.0.2 components/item.css .item p — text-muted-foreground line-clamp-2\r\n   text-start font-normal;\r\n   styles/vega.css .item p — text-sm leading-normal (text-xs at data-size='xs') */\r\n:where([mono-file-upload]) [mono-meta] {\r\n  font-size: var(--_mono-file-upload-meta-font-size);\r\n  line-height: var(--mono-file-upload-meta-line-height, var(--mono-leading-normal));\r\n  font-weight: var(--mono-font-weight-normal);\r\n  text-align: start;\r\n  color: var(--mono-file-upload-meta-color, var(--_mono-file-upload-muted));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-muted\r\n   hover:text-foreground (dark:hover:bg-muted/50);\r\n   styles/vega.css .btn[data-size='icon-sm'] — size-8 rounded-[min(var(--radius-md),10px)]\r\n   — DEVIATION: the hover ink is the DANGER role, not `--foreground`: this ghost\r\n   button deletes the row it sits in. */\r\n:where([mono-file-upload]) [mono-remove] {\r\n  display: inline-flex;\r\n  flex-shrink: 0;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: var(--mono-file-upload-remove-size, calc(var(--mono-spacing) * 8));\r\n  height: var(--mono-file-upload-remove-size, calc(var(--mono-spacing) * 8));\r\n  padding: 0;\r\n  border: 0;\r\n  border-radius: var(--mono-file-upload-remove-radius, min(var(--mono-radius-md), 10px));\r\n  background: transparent;\r\n  color: var(--_mono-file-upload-muted);\r\n  font: inherit;\r\n  font-size: calc(var(--mono-spacing) * 4);\r\n  line-height: 1;\r\n  cursor: pointer;\r\n  transition:\r\n    color var(--mono-duration) var(--mono-ease),\r\n    background-color var(--mono-duration) var(--mono-ease),\r\n    box-shadow var(--mono-duration) var(--mono-ease);\r\n  box-shadow: var(--_mono-file-upload-remove-ring, 0 0 #0000);\r\n}\r\n\r\n@media (hover: hover) {\r\n  :where([mono-file-upload]) [mono-remove]:hover {\r\n    background-color: var(--mono-mode-ghost-hover);\r\n    color: var(--_mono-file-upload-danger);\r\n  }\r\n}\r\n\r\n/* basecoat@1.0.2 components/item.css .item — focus-visible:border-ring\r\n   focus-visible:ring-[3px] focus-visible:ring-ring/50 */\r\n:where([mono-file-upload]) [mono-remove]:focus-visible {\r\n  outline: none;\r\n  color: var(--_mono-file-upload-text);\r\n  --_mono-file-upload-remove-ring: 0 0 0 var(--_mono-file-upload-ring-width)\r\n    color-mix(in oklab, var(--_mono-file-upload-ring-color) var(--_mono-file-upload-ring-alpha), transparent);\r\n}\r\n\r\n:where([mono-file-upload]) [mono-remove] [mono-glyph] {\r\n  display: block;\r\n  width: calc(var(--mono-spacing) * 4);\r\n  height: calc(var(--mono-spacing) * 4);\r\n  flex-shrink: 0;\r\n  color: inherit;\r\n}\r\n\r\n:where([mono-file-upload]) [mono-remove] [mono-glyph] > svg {\r\n  width: 100%;\r\n  height: 100%;\r\n}\r\n\r\n[mono-file-upload][mono-disabled] [mono-remove] {\r\n  opacity: 0.5;\r\n  pointer-events: none;\r\n}\r\n\r\n/* =========================================\r\n   Message\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p\r\n   — text-sm text-muted-foreground leading-normal font-normal */\r\n:where([mono-file-upload]) [mono-message] {\r\n  font-size: var(--mono-file-upload-message-font-size, var(--mono-text-sm));\r\n  line-height: var(--mono-file-upload-message-line-height, var(--mono-leading-normal));\r\n  color: var(--mono-file-upload-message-color, var(--_mono-file-upload-muted));\r\n}\r\n\r\n/* basecoat@1.0.2 components/field.css .field >> [role='alert'] — the invalid message\r\n   is the destructive one (styles/vega.css gives it text-sm) */\r\n:where([mono-file-upload]) [mono-message=\"invalid\"] {\r\n  color: var(--_mono-file-upload-danger);\r\n}\r\n\r\n:where([mono-file-upload]) [mono-message=\"valid\"] {\r\n  color: var(--_mono-file-upload-success);\r\n}\r\n\r\n:where([mono-file-upload]) [mono-message=\"warning\"] {\r\n  color: var(--_mono-file-upload-warning);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-file-upload]) :is([mono-dropzone], [mono-item], [mono-remove]) {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/file-upload/mono-file-upload.shadow.ts
/** The glyphs this build draws itself — the light build's defaults, verbatim. */
var DEFAULT_ICON = "i-mdi-cloud-upload-outline";
var REMOVE_ICON = "i-mdi-close";
var FALLBACK_FILE_ICON = "i-mdi-file";
var SHADOW_EXTRA_CSS = `
[mono-icon] slot[name="icon"] { display: contents; }
`;
var MonoFileUploadShadow = class MonoFileUploadShadow extends withShadowUtilityStyles(MonoFileUploadCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(file_upload_default, {
			host: "mono-file-upload",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	connectedCallback() {
		super.connectedCallback();
		if (isServer) return;
		flushSsrHydration(this);
	}
	firstUpdated(changed) {
		super.firstUpdated?.(changed);
		if (isServer) return;
		this._scanSlots();
	}
	updated(changed) {
		super.updated?.(changed);
		if (!isServer) this._scanSlots();
	}
	/**
	* Slot presence from `assignedNodes()` (DSD assigns slotted content at parse
	* time, so `slotchange` may never fire after upgrade). Only ASSIGNED nodes
	* count — `flatten` would return the prop fallback for an empty slot.
	*/
	_slotHas(name) {
		const slot = this.renderRoot.querySelector(`slot[name="${name}"]`);
		return !!slot && slot.assignedNodes().some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_scanSlots() {
		const icon = this._slotHas("icon");
		if (icon !== this._hasIconSlot) this._hasIconSlot = icon;
		const title = this._slotHas("title");
		if (title !== this._hasTitleSlot) this._hasTitleSlot = title;
		const subtitle = this._slotHas("subtitle");
		if (subtitle !== this._hasSubtitleSlot) this._hasSubtitleSlot = subtitle;
	}
	_useIconSlots() {
		return true;
	}
	/** Native slot; the `title` prop is its fallback content (paints with no JS). */
	_renderTitle() {
		return html`<div
      class=${this._cls("mono-file-upload-title", "title")}
      mono-title
      ?mono-empty=${!this._hasTitleSlot && !this.title}
    ><slot name="title" @slotchange=${this._scanSlots}>${this.title || nothing}</slot></div>`;
	}
	/** Native slot; the `subtitle` prop is its fallback content. */
	_renderSubtitle() {
		return html`<div
      class=${this._subtitleClasses}
      mono-subtitle
      mono-subtext
      ?mono-empty=${!this._hasSubtitleSlot && !this.subtitle}
    ><slot name="subtitle" @slotchange=${this._scanSlots}>${this.subtitle || nothing}</slot></div>`;
	}
	_renderDropzoneIcon() {
		return html`<div class=${this._cls("mono-file-upload-icon", "icon")} mono-icon aria-hidden="true">
      <slot name="icon">${this.icon && !isIconifyClass(this.icon) ? html`${this.icon}` : this._renderIconifyGlyph(this.icon) ?? this._renderDefaultGlyph()}</slot>
    </div>`;
	}
	_renderDefaultGlyph() {
		return html`<span class="mono-file-upload-default-icon" mono-glyph aria-hidden="true">
      ${mdiGlyph(DEFAULT_ICON)}
    </span>`;
	}
	_renderRemoveIcon() {
		if (this.removeIcon && !isIconifyClass(this.removeIcon)) return html`${this.removeIcon}`;
		return this._renderIconifyGlyph(this.removeIcon) ?? html`<span class="mono-file-upload-iconify" mono-glyph aria-hidden="true">
        ${mdiGlyph(REMOVE_ICON)}
      </span>`;
	}
	_renderThumbGlyph(item) {
		const icon = getFileIcon(item.type, item.name);
		return this._renderIconifyGlyph(icon) ?? html`<span class="mono-file-upload-iconify" mono-glyph aria-hidden="true">
        ${mdiGlyph(FALLBACK_FILE_ICON)}
      </span>`;
	}
	/**
	* An `i-mdi-*` class as inline SVG, or `undefined` when that glyph is not
	* bundled (`scripts/mdi-glyphs.mjs` lists what is). The light build masks the
	* class through the page's UnoCSS, which cannot cross the shadow boundary.
	*/
	_renderIconifyGlyph(icon) {
		if (!icon || !isIconifyClass(icon)) return void 0;
		const glyph = mdiGlyph(icon);
		if (!glyph) return void 0;
		return html`<span class=${`mono-file-upload-iconify ${icon}`} mono-glyph aria-hidden="true">
      ${glyph}
    </span>`;
	}
};
MonoFileUploadShadow = __decorate([customElement("mono-shadow-file-upload")], MonoFileUploadShadow);
//#endregion
export { MonoFileUploadCore, MonoFileUploadShadow, createUploadItem, formatFileSize, getFileIcon, validateFileUploadProps };
