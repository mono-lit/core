import { g as monoHostChildNodes } from "../mono-ui-CK5wNw-7.js";
import { t as customElement } from "../mono-element-BP0RKeDD.js";
import { a as defineHybridPropAliases, i as defineHybridPropAlias, n as arrayHasChanged, r as booleanStringConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-BPku9HpS.js";
import { t as isIconifyClass } from "../icon-ClxnYhBG.js";
import { a as parkDetachedNodes, s as placeSlotNode } from "../light-slots-RAAINrYd.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { LitElement, html, isServer, nothing } from "lit";
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
	if (size < 1048576) return `${Math.round(size / 1024)} KB`;
	return `${(size / 1048576).toFixed(1)} MB`;
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
const numberStringConverter = {
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
const MonoFileUploadCore = (superClass) => {
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
//#region src/components/file-upload/mono-file-upload.ts
/** Named slots the light build captures: the dropzone icon and its two text lines. */
const FILE_UPLOAD_LIGHT_SLOTS = [
	"icon",
	"title",
	"subtitle"
];
let MonoFileUpload = class MonoFileUpload extends MonoFileUploadCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slots = {
			icon: [],
			title: [],
			subtitle: []
		};
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		super.connectedCallback();
		this._captureSlots();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated?.(changed);
		for (const name of FILE_UPLOAD_LIGHT_SLOTS) {
			this._placeSlot(name, this._slots[name]);
			this._parked = parkDetachedNodes(this._parked, this._slots[name]);
		}
	}
	/** Move light-DOM `slot="icon|title|subtitle"` children out for placement into their regions. */
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		for (const node of monoHostChildNodes(this)) {
			if (!(node instanceof Element)) continue;
			const name = node.getAttribute("slot");
			if (name && FILE_UPLOAD_LIGHT_SLOTS.includes(name)) {
				node.removeAttribute("slot");
				this._slots[name].push(node);
			}
		}
		this._hasIconSlot = this._slots.icon.length > 0;
		this._hasTitleSlot = this._slots.title.length > 0;
		this._hasSubtitleSlot = this._slots.subtitle.length > 0;
		for (const name of FILE_UPLOAD_LIGHT_SLOTS) for (const node of this._slots[name]) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoFileUpload = __decorate([customElement("mono-file-upload")], MonoFileUpload);

//#endregion
export { MonoFileUpload, createUploadItem, formatFileSize, getFileIcon, validateFileUploadProps };