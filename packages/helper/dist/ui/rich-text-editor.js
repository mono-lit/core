import { d as buildSizeStyle, f as toCssSize, g as monoHostChildNodes } from "../mono-ui-kvLVIf1V.js";
import { t as customElement } from "../mono-element-CKcT0rwv.js";
import { a as defineHybridPropAliases, r as booleanStringConverter, s as optionalNumberConverter, t as __decorate } from "../decorate-DbYFpi8R.js";
import { t as dispatchMonoEvent } from "../mono-event-CAZf0F_k.js";
import { s as placeSlotNode } from "../light-slots-B5Ck0t_E.js";
import { t as MonoFormControlCore } from "../form-control-core-CRZPZ1ru.js";
import { LitElement, html, isServer, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

//#region src/components/rich-text-editor/rich-text-editor-loader.ts
const INSTALL_HINT = "[mono-rich-text-editor] needs the optional peer dependency \"suneditor\". Install it in your app: pnpm add suneditor@^3.3.3";
function withHint(err) {
	const message = err instanceof Error ? err.message : String(err);
	return /* @__PURE__ */ new Error(`${INSTALL_HINT}${message ? ` (original error: ${message})` : ""}`);
}
let _corePromise = null;
/** The `suneditor` default export (`{ create, init }`), cached; a failure resets so a later attempt retries. */
function loadSunEditor() {
	_corePromise ??= import("suneditor").then((m) => m?.default ?? m).catch((err) => {
		_corePromise = null;
		throw withHint(err);
	});
	return _corePromise;
}
let _cssPromise = null;
/**
* SunEditor's UI stylesheet (`suneditor/css/editor`), injected ONCE per page by
* the consumer's bundler as a side-effect import. Failure is not fatal — the
* editor still works, unstyled — so it is reported once and swallowed.
*/
function loadSunEditorCss() {
	_cssPromise ??= import("suneditor/css/editor").then(() => void 0).catch((err) => {
		console.warn("[mono-rich-text-editor] could not load \"suneditor/css/editor\" — the editor will render unstyled. Import the stylesheet yourself and set load-css=\"false\" if your bundler cannot import CSS from a dynamic import.", err);
	});
	return _cssPromise;
}
let _pluginsPromise = null;
/** Every built-in plugin, keyed by name (`suneditor/plugins`' default export). */
function loadSunEditorPlugins() {
	_pluginsPromise ??= import("suneditor/plugins").then((m) => m?.default ?? m).catch((err) => {
		_pluginsPromise = null;
		throw withHint(err);
	});
	return _pluginsPromise;
}
/**
* The language packs SunEditor ships, each behind its own static import so the
* consumer's bundler can split them. Unknown codes fall back to English (the
* editor's own default) with a warning rather than failing the build.
*/
const LANGS = {
	ckb: () => import("suneditor/langs/ckb"),
	cs: () => import("suneditor/langs/cs"),
	da: () => import("suneditor/langs/da"),
	de: () => import("suneditor/langs/de"),
	en: () => import("suneditor/langs/en"),
	es: () => import("suneditor/langs/es"),
	fa: () => import("suneditor/langs/fa"),
	fr: () => import("suneditor/langs/fr"),
	he: () => import("suneditor/langs/he"),
	hu: () => import("suneditor/langs/hu"),
	it: () => import("suneditor/langs/it"),
	ja: () => import("suneditor/langs/ja"),
	km: () => import("suneditor/langs/km"),
	ko: () => import("suneditor/langs/ko"),
	lv: () => import("suneditor/langs/lv"),
	nl: () => import("suneditor/langs/nl"),
	pl: () => import("suneditor/langs/pl"),
	pt_br: () => import("suneditor/langs/pt_br"),
	ro: () => import("suneditor/langs/ro"),
	ru: () => import("suneditor/langs/ru"),
	se: () => import("suneditor/langs/se"),
	tr: () => import("suneditor/langs/tr"),
	uk: () => import("suneditor/langs/uk"),
	ur: () => import("suneditor/langs/ur"),
	zh_cn: () => import("suneditor/langs/zh_cn")
};
/** Codes `lang` accepts. */
const SUNEDITOR_LANG_CODES = Object.keys(LANGS);
const _langPromises = /* @__PURE__ */ new Map();
/**
* A language pack by code (`ko`, `pt-BR` → `pt_br`, `zh-CN` → `zh_cn`, …), or
* `undefined` for English / an unknown code (SunEditor then uses its default).
*/
function loadSunEditorLang(code) {
	const key = code.trim().toLowerCase().replace(/-/g, "_");
	if (!key || key === "en") return Promise.resolve(void 0);
	const loader = LANGS[key];
	if (!loader) {
		console.warn(`[mono-rich-text-editor] unknown lang "${code}" — SunEditor ships: ${SUNEDITOR_LANG_CODES.join(", ")}. Using English.`);
		return Promise.resolve(void 0);
	}
	let p = _langPromises.get(key);
	if (!p) {
		p = loader().then((m) => m?.default ?? m).catch((err) => {
			_langPromises.delete(key);
			throw withHint(err);
		});
		_langPromises.set(key, p);
	}
	return p;
}

//#endregion
//#region src/components/rich-text-editor/rich-text-editor-toolbar.ts
/**
* Buttons SunEditor's core provides WITHOUT a plugin (v3 `_defaultButtons`).
* Anything else in a `buttonList` is the `key` of a plugin that has to be in
* `plugins`, so a preset is filtered against the plugins actually loaded.
*/
const SUNEDITOR_CORE_BUTTONS = /* @__PURE__ */ new Set([
	"bold",
	"underline",
	"italic",
	"strike",
	"subscript",
	"superscript",
	"removeFormat",
	"copyFormat",
	"indent",
	"outdent",
	"fullScreen",
	"showBlocks",
	"codeView",
	"markdownView",
	"undo",
	"redo",
	"preview",
	"print",
	"copy",
	"dir",
	"dir_ltr",
	"dir_rtl",
	"finder",
	"save",
	"newDocument",
	"selectAll",
	"pageBreak",
	"pageUp",
	"pageDown",
	"pageNavigator"
]);
/**
* Built-ins `plugins="auto"` leaves OUT: each needs configuration SunEditor
* warns about when it is missing (a server `url` / `uploadUrl`, a `templates` or
* `layouts` list, an external KaTeX / MathJax / PDF service). Ask for them by
* name — `plugins="auto, image­Gallery"` is not a thing, but
* `:plugins.prop="[...]"` with the class or `plugins="font, link, template"`
* is — and supply their options through `options`.
*/
const AUTO_EXCLUDED_PLUGINS = /* @__PURE__ */ new Set([
	"exportPDF",
	"fileUpload",
	"layout",
	"template",
	"math",
	"imageGallery",
	"videoGallery",
	"audioGallery",
	"fileGallery",
	"fileBrowser"
]);
/** Markers a `buttonList` may carry besides button names. */
const SPECIAL = /^(\||\/|-left|-right|-center|#fix)$/;
/**
* SunEditor's own default (`DEFAULTS.BUTTON_LIST`) — no plugin buttons at all.
* Mirrored here rather than imported so the presets stay pure.
*/
const TOOLBAR_DEFAULT = [
	["undo", "redo"],
	"|",
	[
		"bold",
		"underline",
		"italic",
		"strike",
		"|",
		"subscript",
		"superscript"
	],
	"|",
	["removeFormat"],
	"|",
	["outdent", "indent"],
	"|",
	[
		"fullScreen",
		"showBlocks",
		"codeView"
	],
	"|",
	["preview", "print"]
];
/** The essentials: a comment box, a note field. */
const TOOLBAR_BASIC = [
	["undo", "redo"],
	"|",
	[
		"bold",
		"underline",
		"italic",
		"strike"
	],
	"|",
	[
		"list_bulleted",
		"list_numbered",
		"link"
	],
	"|",
	["removeFormat"]
];
/** The default: what a document / description / email body needs. */
const TOOLBAR_STANDARD = [
	["undo", "redo"],
	"|",
	[
		"blockStyle",
		"font",
		"fontSize"
	],
	"|",
	[
		"bold",
		"underline",
		"italic",
		"strike"
	],
	["fontColor", "backgroundColor"],
	"|",
	[
		"align",
		"list_bulleted",
		"list_numbered",
		"outdent",
		"indent"
	],
	"|",
	[
		"table",
		"link",
		"image",
		"video"
	],
	"|",
	[
		"blockquote",
		"codeBlock",
		"hr"
	],
	"|",
	["removeFormat"],
	"|",
	["codeView", "fullScreen"]
];
/**
* Every built-in that works with no extra configuration. Left out on purpose:
* the galleries / file browser (need a server `url`), `template` (needs a
* `templates` list), `math` and `exportPDF` (need external libraries) — pass
* those through `toolbar` + `options` when the app provides what they need.
*/
const TOOLBAR_FULL = [
	["undo", "redo"],
	"|",
	[
		"blockStyle",
		"paragraphStyle",
		"font",
		"fontSize",
		"lineHeight"
	],
	"|",
	[
		"bold",
		"underline",
		"italic",
		"strike",
		"subscript",
		"superscript"
	],
	[
		"fontColor",
		"backgroundColor",
		"textStyle",
		"copyFormat",
		"removeFormat"
	],
	"|",
	[
		"align",
		"list_bulleted",
		"list_numbered",
		"outdent",
		"indent",
		"dir_ltr",
		"dir_rtl"
	],
	"|",
	[
		"table",
		"layout",
		"link",
		"image",
		"video",
		"audio",
		"embed",
		"drawing"
	],
	"|",
	[
		"blockquote",
		"codeBlock",
		"hr",
		"pageBreak"
	],
	"|",
	[
		"showBlocks",
		"codeView",
		"markdownView",
		"fullScreen"
	],
	"|",
	[
		"finder",
		"selectAll",
		"preview",
		"print"
	]
];
const TOOLBAR_PRESETS = {
	basic: TOOLBAR_BASIC,
	standard: TOOLBAR_STANDARD,
	full: TOOLBAR_FULL,
	default: TOOLBAR_DEFAULT
};
function isToolbarPreset(value) {
	return typeof value === "string" && value in TOOLBAR_PRESETS;
}
/**
* The `buttonList` for a `toolbar` prop value: a preset name, an array, its
* JSON, or a string of names — `bold, italic | link` (`|` and `/` are honoured
* as separators, `,`/whitespace split the rest). Unknown → the `standard` preset.
*/
function resolveToolbar(toolbar) {
	if (toolbar == null || toolbar === "") return TOOLBAR_STANDARD;
	if (Array.isArray(toolbar)) return toolbar;
	if (isToolbarPreset(toolbar)) return TOOLBAR_PRESETS[toolbar];
	if (typeof toolbar !== "string") return TOOLBAR_STANDARD;
	const trimmed = toolbar.trim();
	if (trimmed.startsWith("[")) try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) return parsed;
	} catch {}
	const out = [];
	let group = [];
	for (const token of trimmed.split(/[\s,]+/).filter(Boolean)) if (SPECIAL.test(token)) {
		if (group.length) out.push(group);
		group = [];
		out.push(token);
	} else group.push(token);
	if (group.length) out.push(group);
	return out.length ? out : TOOLBAR_STANDARD;
}
/**
* Drop the plugin buttons a `buttonList` names that are NOT among `available`
* plugin keys, so `plugins="none"` (or a trimmed list) with the default toolbar
* degrades to the core buttons instead of SunEditor rejecting the list.
* Separators left with nothing on either side are dropped too.
*/
function pruneToolbar(list, available) {
	const keep = (name) => SPECIAL.test(name) || SUNEDITOR_CORE_BUTTONS.has(name) || available.has(name);
	const out = [];
	for (const item of list) if (Array.isArray(item)) {
		const group = item.filter(keep);
		if (group.some((n) => !SPECIAL.test(n))) out.push(group);
	} else if (keep(item)) out.push(item);
	const cleaned = [];
	for (const item of out) {
		const isSep = typeof item === "string" && SPECIAL.test(item);
		const prev = cleaned[cleaned.length - 1];
		if (isSep && (cleaned.length === 0 || typeof prev === "string" && SPECIAL.test(prev))) continue;
		cleaned.push(item);
	}
	while (cleaned.length && typeof cleaned[cleaned.length - 1] === "string") cleaned.pop();
	return cleaned;
}
/**
* The plugin set to hand SunEditor, from the `plugins` prop and (when needed)
* the full built-in map. Returns `{ plugins, keys }` — `keys` is what
* `pruneToolbar` filters against.
*
* - `'auto'` / unset → every built-in that needs no configuration (`all` must
*   be supplied; see {@link AUTO_EXCLUDED_PLUGINS}).
* - `'none'` → nothing.
* - an array → plugin classes kept as they are, NAMES looked up in `all`.
* - an object → SunEditor's own `{ name: class }` form.
* - a string → comma/space-separated names.
*/
function resolvePlugins(plugins, all) {
	const out = [];
	const keys = /* @__PURE__ */ new Set();
	const push = (key, cls) => {
		if (!cls || out.includes(cls)) return;
		out.push(cls);
		const k = key ?? pluginKey(cls);
		if (k) keys.add(k);
	};
	if (plugins == null || plugins === "" || plugins === "auto") {
		for (const [key, cls] of Object.entries(all ?? {})) if (!AUTO_EXCLUDED_PLUGINS.has(key)) push(key, cls);
		return {
			plugins: out,
			keys
		};
	}
	if (plugins === "none") return {
		plugins: out,
		keys
	};
	if (typeof plugins === "string") {
		for (const name of plugins.split(/[\s,]+/).filter(Boolean)) push(name, all?.[name]);
		return {
			plugins: out,
			keys
		};
	}
	if (Array.isArray(plugins)) {
		for (const entry of plugins) if (typeof entry === "string") push(entry, all?.[entry]);
		else push(void 0, entry);
		return {
			plugins: out,
			keys
		};
	}
	for (const [key, cls] of Object.entries(plugins)) push(key, cls);
	return {
		plugins: out,
		keys
	};
}
/** A SunEditor v3 plugin class carries its button name as `static key`. */
function pluginKey(cls) {
	const key = cls?.key;
	return typeof key === "string" ? key : void 0;
}
/** Whether `plugins` needs the full built-in map to be resolved. */
function pluginsNeedCatalog(plugins) {
	if (plugins == null || plugins === "" || plugins === "auto") return true;
	if (plugins === "none") return false;
	if (typeof plugins === "string") return true;
	if (Array.isArray(plugins)) return plugins.some((p) => typeof p === "string");
	return false;
}

//#endregion
//#region src/components/rich-text-editor/rich-text-editor-core.ts
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
const MonoRichTextEditorCore = (superClass) => {
	class MonoRichTextEditorCoreClass extends MonoFormControlCore(superClass) {
		constructor(...args) {
			super(...args);
			this.size = "md";
			this.color = "primary";
			this.variant = "outlined";
			this.modelValue = "";
			this.value = "";
			this.name = "";
			this.placeholder = "";
			this.label = "";
			this.helperText = "";
			this.validationState = "default";
			this.validationMessage = "";
			this.errorMessage = "";
			this.successMessage = "";
			this.disabled = false;
			this.readonly = false;
			this.required = false;
			this.cssClass = {};
			this.cssClassName = "";
			this.mode = "classic";
			this.charCounter = false;
			this.statusbar = true;
			this.loadCss = true;
			this._hasLabelSlotState = false;
			this._hasHelperSlotState = false;
			this._error = "";
			this._loading = false;
			this._fieldId = `mono-rich-text-editor-${Math.random().toString(36).slice(2)}`;
			this._messageId = `${this._fieldId}-message`;
			this._editor = null;
			this._building = false;
			this._buildToken = 0;
			this._lastEmitted = "";
			this._lastChanged = "";
			this._ready = false;
			this._titleObservers = [];
			this._onToggleFullScreen = (params) => {
				this._mount?.toggleAttribute("mono-fullscreen", !!params?.is);
			};
			this._onLoad = () => {
				this._ready = true;
				this._loading = false;
				this._applyState();
				this._applyAria();
				const editor = this._editor;
				if (editor) dispatchMonoEvent(this, "ready", { editor });
			};
			this._onChange = (params) => {
				this._publish("change", params);
			};
			this._onInput = (params) => {
				this._publish("input", params);
			};
			this._onFocus = (params) => {
				dispatchMonoEvent(this, "focus", {
					name: this.name || void 0,
					sourceEvent: params
				});
			};
			this._onBlur = (params) => {
				dispatchMonoEvent(this, "blur", {
					name: this.name || void 0,
					sourceEvent: params
				});
			};
			defineHybridPropAliases(this, [
				"modelValue",
				"helperText",
				"validationState",
				"validationMessage",
				"errorMessage",
				"successMessage",
				"charCounter",
				"maxLength",
				"loadCss",
				"textDirection",
				"ariaLabelText",
				"cssClass",
				"minWidth",
				"maxWidth",
				"minHeight",
				"maxHeight"
			]);
			for (const alias of ["css-class", "cssclass"]) Object.defineProperty(this, alias, {
				get: () => this.cssClass,
				set: (value) => this._setCssClass(value),
				configurable: true,
				enumerable: false
			});
			for (const alias of [
				"ariaLabel",
				"aria-label",
				"arialabel"
			]) Object.defineProperty(this, alias, {
				get: () => this.ariaLabelText,
				set: (value) => {
					this.ariaLabelText = value == null ? void 0 : String(value);
				},
				configurable: true,
				enumerable: false
			});
		}
		static get observedAttributes() {
			return [
				...super.observedAttributes ?? [],
				"modelvalue",
				"helpertext",
				"validationstate",
				"validationmessage",
				"errormessage",
				"successmessage",
				"charcounter",
				"maxlength",
				"loadcss",
				"textdirection",
				"arialabeltext",
				"arialabel",
				"css-class",
				"cssclass"
			];
		}
		attributeChangedCallback(name, oldValue, newValue) {
			super.attributeChangedCallback(name, oldValue, newValue);
			if (oldValue === newValue) return;
			switch (name) {
				case "modelvalue":
					this.modelValue = newValue ?? "";
					return;
				case "helpertext":
					this.helperText = newValue ?? "";
					return;
				case "validationstate":
					this.validationState = newValue ?? "default";
					return;
				case "validationmessage":
					this.validationMessage = newValue ?? "";
					return;
				case "errormessage":
					this.errorMessage = newValue ?? "";
					return;
				case "successmessage":
					this.successMessage = newValue ?? "";
					return;
				case "charcounter":
					this.charCounter = this._toBoolean(newValue);
					return;
				case "maxlength":
					this.maxLength = optionalNumberConverter.fromAttribute(newValue);
					return;
				case "loadcss":
					this.loadCss = this._toBoolean(newValue);
					return;
				case "textdirection":
					this.textDirection = newValue === "rtl" ? "rtl" : newValue === "ltr" ? "ltr" : void 0;
					return;
				case "arialabeltext":
				case "arialabel":
					this.ariaLabelText = newValue ?? void 0;
					return;
				case "css-class":
				case "cssclass": this._setCssClass(newValue);
			}
		}
		static {
			this._configKeys = [
				"mode",
				"toolbar",
				"plugins",
				"language",
				"textDirection",
				"charCounter",
				"maxLength",
				"statusbar",
				"sticky",
				"options",
				"placeholder",
				"height",
				"minHeight",
				"maxHeight"
			];
		}
		willUpdate(changed) {
			super.willUpdate?.(changed);
			for (const key of [
				"disabled",
				"readonly",
				"required",
				"charCounter",
				"statusbar",
				"loadCss"
			]) {
				const v = this[key];
				if (typeof v !== "boolean") this[key] = this._toBoolean(v);
			}
			if (changed.has("modelValue") && this.value !== this.modelValue) this.value = this.modelValue ?? "";
			if (changed.has("value") && this.modelValue !== this.value) this.modelValue = String(this.value ?? "");
		}
		connectedCallback() {
			super.connectedCallback();
			if (isServer) return;
			this._ensureMount();
			if (this.hasUpdated) this._ensureEditor();
		}
		disconnectedCallback() {
			this._destroyEditor();
			super.disconnectedCallback();
		}
		firstUpdated() {
			if (isServer) return;
			this._ensureEditor();
		}
		updated(changed) {
			super.updated?.(changed);
			if (isServer) return;
			this._placeMount();
			if (!this._editor) {
				if (!this._building && MonoRichTextEditorCoreClass._configKeys.some((k) => changed.has(k))) this._error = "";
				this._ensureEditor();
				return;
			}
			if (MonoRichTextEditorCoreClass._configKeys.some((k) => changed.has(k))) {
				this._rebuild();
				return;
			}
			if (changed.has("modelValue")) this._applyModelValue();
			if (changed.has("disabled") || changed.has("readonly")) this._applyState();
			if (changed.has("ariaLabelText") || changed.has("label") || changed.has("placeholder")) this._applyAria();
		}
		/** Create the light-DOM mount once. Where it goes is the build's call (`_placeMount`). */
		_ensureMount() {
			if (this._mount) return;
			const mount = document.createElement("div");
			mount.className = "mono-rich-text-editor-mount";
			mount.setAttribute("mono-rte-mount", "");
			this._mount = mount;
		}
		/**
		* Put the mount where this build shows it. Light: inside the rendered
		* `[data-mono-slot="editor"]` frame. Shadow: a light child of the host, with
		* `slot="editor"` so `<slot name="editor">` projects it. Idempotent.
		*/
		_placeMount() {
			const mount = this._mount;
			if (!mount) return;
			if (this._useNativeSlots) {
				if (mount.getAttribute("slot") !== "editor") mount.setAttribute("slot", "editor");
				if (mount.parentNode !== this) this.appendChild(mount);
				return;
			}
			const outlet = this.renderRoot.querySelector("[data-mono-slot=\"editor\"]");
			if (outlet && mount.parentNode !== outlet) outlet.appendChild(mount);
		}
		/**
		* Build the instance if there is none — idempotent, safe from every hook.
		* Every `await` is followed by the token / connection re-check: an element
		* that left the tree mid-import must not end up owning an editor.
		*/
		async _ensureEditor() {
			if (isServer || this._editor || this._building) return;
			const mount = this._mount;
			if (!mount?.isConnected) return;
			this._building = true;
			this._loading = true;
			const token = ++this._buildToken;
			try {
				const [SUNEDITOR] = await Promise.all([loadSunEditor(), this.loadCss ? loadSunEditorCss() : Promise.resolve()]);
				const catalog = pluginsNeedCatalog(this.plugins) ? await loadSunEditorPlugins() : null;
				const lang = typeof this.language === "string" ? await loadSunEditorLang(this.language) : this.language;
				if (token !== this._buildToken || !this.isConnected || !mount.isConnected || this._editor) return;
				mount.replaceChildren();
				const target = document.createElement("div");
				target.className = "mono-rich-text-editor-target";
				mount.appendChild(target);
				this._lastEmitted = this._lastChanged = this.modelValue || "";
				this._ready = false;
				this._editor = SUNEDITOR.create(target, this._buildOptions(catalog, lang));
				this._error = "";
				this._themeTooltips(mount);
			} catch (err) {
				if (token !== this._buildToken) return;
				const message = err instanceof Error ? err.message : String(err);
				this._error = message;
				this._loading = false;
				dispatchMonoEvent(this, "error", {
					message,
					error: err
				});
			} finally {
				if (token === this._buildToken) this._building = false;
			}
		}
		/**
		* SunEditor labels its dropdown items (font family, font size, the colour
		* palettes …) with `title`, which the browser draws as the OS tooltip — white,
		* system font, out of every theme's reach. Rewrite each into `data-tooltip`
		* (+ `aria-label`, so nothing is lost to assistive tech), which the sheet
		* paints as Basecoat's tooltip; a title that only repeats the item's own text
		* is dropped. The lists are built lazily, on first open, so the mount — and
		* the modal carrier SunEditor parks on <body> — are watched for new ones.
		*/
		_themeTooltips(mount) {
			this._titleObservers.forEach((o) => o.disconnect());
			this._titleObservers = [];
			mount.style.setProperty("--_mono-rte-page-font", getComputedStyle(this).fontFamily);
			const retitle = (root) => {
				const nodes = root.matches("[title]") ? [root, ...root.querySelectorAll("[title]")] : [...root.querySelectorAll("[title]")];
				for (const el of nodes) {
					const title = el.getAttribute("title")?.trim();
					el.removeAttribute("title");
					if (!title) continue;
					if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", title);
					if ((el.textContent ?? "").trim() === title) continue;
					el.setAttribute("data-tooltip", title);
				}
			};
			const watch = (root) => {
				retitle(root);
				if (typeof MutationObserver === "undefined") return;
				const mo = new MutationObserver((records) => {
					for (const r of records) {
						if (r.type === "attributes") {
							if (r.target.hasAttribute("title")) retitle(r.target);
							continue;
						}
						r.addedNodes.forEach((n) => {
							if (n.nodeType === Node.ELEMENT_NODE) retitle(n);
						});
					}
				});
				mo.observe(root, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ["title"]
				});
				this._titleObservers.push(mo);
			};
			watch(mount);
			const carriers = document.querySelectorAll(".sun-editor-carrier-wrapper");
			const carrier = carriers[carriers.length - 1];
			if (carrier) {
				carrier.style.setProperty("--_mono-rte-page-font", getComputedStyle(this).fontFamily);
				watch(carrier);
			}
		}
		_buildOptions(catalog, lang) {
			const { plugins, keys } = resolvePlugins(this.plugins, catalog);
			const buttonList = pruneToolbar(resolveToolbar(this.toolbar), keys);
			const consumer = this.options ?? {};
			const consumerEvents = consumer.events ?? {};
			const chain = (mine, name) => (params) => {
				const theirs = consumerEvents[name];
				const result = typeof theirs === "function" ? theirs(params) : void 0;
				mine(params);
				return result;
			};
			const options = {
				value: this.modelValue || "",
				placeholder: this.placeholder || void 0,
				mode: this.mode,
				buttonList,
				plugins,
				lang: lang ?? void 0,
				textDirection: this.textDirection,
				charCounter: this.charCounter || this.maxLength != null,
				charCounter_max: this.maxLength ?? void 0,
				statusbar: this.statusbar,
				toolbar_sticky: this.sticky ?? -1,
				width: "100%",
				height: toCssSize(this.height) ?? "auto",
				minHeight: toCssSize(this.minHeight) ?? void 0,
				maxHeight: toCssSize(this.maxHeight) ?? void 0,
				...consumer,
				events: {
					...consumerEvents,
					onload: chain(this._onLoad, "onload"),
					onChange: chain(this._onChange, "onChange"),
					onInput: chain(this._onInput, "onInput"),
					onFocus: chain(this._onFocus, "onFocus"),
					onBlur: chain(this._onBlur, "onBlur"),
					onToggleFullScreen: chain(this._onToggleFullScreen, "onToggleFullScreen")
				}
			};
			for (const key of Object.keys(options)) if (options[key] === void 0) delete options[key];
			return options;
		}
		_destroyEditor() {
			this._buildToken++;
			this._building = false;
			const editor = this._editor;
			this._editor = null;
			this._ready = false;
			this._loading = false;
			this._titleObservers.forEach((o) => o.disconnect());
			this._titleObservers = [];
			if (editor) try {
				editor.destroy();
			} catch {}
			this._mount?.replaceChildren();
		}
		/** Destroy + create, keeping the current HTML (it lives in `modelValue`). */
		_rebuild() {
			this._destroyEditor();
			this._ensureEditor();
		}
		/** The editor's HTML as the field's value — `''` when it holds nothing. */
		_read(data) {
			const editor = this._editor;
			if (!editor) return "";
			try {
				if (editor.isEmpty()) return "";
			} catch {}
			return typeof data === "string" ? data : editor.$.html.get();
		}
		_publish(kind, params) {
			if (this.disabled || this.readonly) return;
			const next = this._read(params?.data);
			const oldValue = this.modelValue;
			if (kind === "change") {
				if (next === this._lastChanged) return;
				this._lastChanged = next;
			}
			this._lastEmitted = next;
			this.value = next;
			this.modelValue = next;
			dispatchMonoEvent(this, kind, {
				modelValue: next,
				currentValue: next,
				oldValue,
				value: next,
				name: this.name || void 0,
				sourceEvent: params
			});
		}
		/** Push an OUTSIDE `modelValue` into the editor — only when it is genuinely new. */
		_applyModelValue() {
			const editor = this._editor;
			if (!editor) return;
			const next = this.modelValue || "";
			if (next === this._lastEmitted) return;
			this._lastEmitted = this._lastChanged = next;
			try {
				editor.$.html.set(next);
			} catch (err) {
				console.warn("[mono-rich-text-editor] could not set the editor content", err);
			}
		}
		_applyState() {
			const editor = this._editor;
			if (!editor || !this._ready) return;
			try {
				if (this.disabled) editor.$.ui.disable();
				else {
					editor.$.ui.enable();
					editor.$.ui.readOnly(!!this.readonly);
				}
			} catch (err) {
				console.warn("[mono-rich-text-editor] could not apply disabled/readonly", err);
			}
		}
		_applyAria() {
			const editor = this._editor;
			if (!editor || !this._ready) return;
			const wysiwyg = editor.$.frameContext?.get?.("wysiwyg");
			if (!wysiwyg) return;
			const label = this.ariaLabelText || this.label || this.placeholder;
			if (label) wysiwyg.setAttribute("aria-label", label);
			else wysiwyg.removeAttribute("aria-label");
			wysiwyg.setAttribute("aria-invalid", this._resolvedValidationState === "invalid" ? "true" : "false");
			if (this._shouldShowFooter) wysiwyg.setAttribute("aria-describedby", this._messageId);
			else wysiwyg.removeAttribute("aria-describedby");
		}
		/** The live SunEditor instance, or `null` before it loads / when the peer is missing. */
		get editor() {
			return this._editor;
		}
		/** The HTML as SunEditor serialises it (`''` when empty). */
		getHtml() {
			return this._read();
		}
		/** Replace the content. Emits `mno-change` like a user edit would. */
		setHtml(html) {
			this.modelValue = html ?? "";
			this._applyModelValue();
		}
		/** Insert HTML at the caret. */
		insertHtml(html) {
			this._editor?.$.html.insert(html);
		}
		/** The plain text of the content. */
		getText() {
			return (this._editor?.$.frameContext?.get?.("wysiwyg"))?.innerText ?? "";
		}
		isEmpty() {
			return this._read() === "";
		}
		focus() {
			this._editor?.$.focusManager.focus();
		}
		blur() {
			this._editor?.$.focusManager.blur();
		}
		/** Toggle (or set) the HTML source view. */
		codeView(value) {
			this._editor?.$.viewer.codeView(value);
		}
		/** Toggle (or set) full screen. */
		fullScreen(value) {
			this._editor?.$.viewer.fullScreen(value);
		}
		_setCssClass(value) {
			if (value == null) {
				this.cssClass = {};
				this.cssClassName = "";
				return;
			}
			if (typeof value === "object") {
				this.cssClass = value;
				return;
			}
			if (typeof value === "string") {
				const trimmed = value.trim();
				if (!trimmed) {
					this.cssClass = {};
					this.cssClassName = "";
					return;
				}
				if (trimmed.startsWith("{") && trimmed.endsWith("}")) try {
					this.cssClass = JSON.parse(trimmed);
					return;
				} catch {}
				this.cssClassName = trimmed;
			}
		}
		_toBoolean(value) {
			if (typeof value === "boolean") return value;
			if (typeof value === "string") {
				const normalized = value.toLowerCase().trim();
				return normalized === "" || normalized === "true";
			}
			return Boolean(value);
		}
		_cls(base, key) {
			const extra = this.cssClass?.[key];
			return extra ? `${base} ${extra}` : base;
		}
		get _resolvedValidationState() {
			if (this.validationState && this.validationState !== "default") return this.validationState;
			if (this.errorMessage) return "invalid";
			if (this.successMessage) return "valid";
			return "default";
		}
		get _wrapperClasses() {
			return [
				"mono-rich-text-editor",
				this.size,
				this.color,
				this.variant,
				`mode-${this.mode.replace(":", "-")}`,
				this.disabled ? "disabled" : "",
				this.readonly ? "readonly" : "",
				this._resolvedValidationState !== "default" ? `is-${this._resolvedValidationState}` : "",
				this.value ? "has-value" : "",
				this._loading ? "is-loading" : "",
				this._error ? "is-unavailable" : "",
				this.cssClassName,
				this.cssClass?.root
			].filter(Boolean).join(" ");
		}
		get _fieldClasses() {
			return [
				this._cls("mono-rich-text-editor-field", "field"),
				this.size,
				this.color,
				this.variant
			].filter(Boolean).join(" ");
		}
		get _shouldShowFooter() {
			return Boolean(this.validationMessage || this.errorMessage || this.successMessage || this.helperText || this._hasHelperSlotState);
		}
		_renderLabel() {
			const hasContent = !!this.label || this._hasLabelSlotState;
			if (!hasContent && !this._slotsAlwaysRender) return nothing;
			return html`
        <label class=${this._cls("mono-rich-text-editor-label", "label")} mono-rte-label ?mono-empty=${!hasContent} ?data-empty=${!hasContent}>
          ${this._slotOutlet("label", this.label)}
          ${this.required ? html`<span class=${this._cls("mono-rich-text-editor-required", "required")} mono-rte-required-mark>*</span>` : nothing}
        </label>
      `;
		}
		_renderMessage() {
			const base = this._cls("mono-rich-text-editor-message", "message");
			if (this.validationMessage) {
				const state = this._resolvedValidationState;
				return html`<div class=${`${base} ${state}`} mono-rte-message=${state} role=${state === "invalid" ? "alert" : nothing}>${this.validationMessage}</div>`;
			}
			if (this.errorMessage) return html`<div class=${`${base} invalid`} mono-rte-message="invalid" role="alert">${this.errorMessage}</div>`;
			if (this.successMessage) return html`<div class=${`${base} valid`} mono-rte-message="valid">${this.successMessage}</div>`;
			if (this.helperText || this._hasHelperSlotState || this._slotsAlwaysRender) {
				const empty = !this.helperText && !this._hasHelperSlotState;
				return html`
          <div class=${`${base} helper`} mono-rte-message="helper" ?mono-empty=${empty} ?data-empty=${empty}>
            ${this._slotOutlet("helper", this.helperText)}
          </div>
        `;
			}
			return nothing;
		}
		_renderFooter() {
			if (!this._shouldShowFooter && !this._slotsAlwaysRender) return nothing;
			return html`
        <div class=${this._cls("mono-rich-text-editor-footer", "footer")} mono-rte-footer ?mono-empty=${!this._shouldShowFooter} ?data-empty=${!this._shouldShowFooter}>
          <div class=${this.cssClass?.messageWrap ?? ""} mono-rte-message-wrap>${this._renderMessage()}</div>
        </div>
      `;
		}
		/**
		* The peer-missing / build-failure notice. A SIBLING of the field frame, never
		* inside it: the frame's children are the mount the build re-homes there, and
		* a Lit child part beside a node Lit did not render would clear it on update.
		*/
		_renderUnavailable() {
			if (!this._error) return nothing;
			return html`<div class="mono-rich-text-editor-unavailable" mono-rte-unavailable role="alert">${this._error}</div>`;
		}
		render() {
			const state = this._resolvedValidationState;
			return html`
        <div
          class=${this._wrapperClasses}
          style=${styleMap(buildSizeStyle({
				width: this.width,
				minWidth: this.minWidth,
				maxWidth: this.maxWidth
			}))}
          mono-rich-text-editor
          mono-size=${this.size === "md" ? nothing : this.size}
          mono-color=${this.color === "primary" ? nothing : this.color}
          mono-variant=${this.variant === "outlined" ? nothing : this.variant}
          mono-validation-state=${state === "default" ? nothing : state}
          mono-mode=${this.mode === "classic" ? nothing : this.mode}
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
      `;
		}
		/** Whether the `label` / `helper` regions render even when empty. Light: no. Shadow: yes. */
		get _slotsAlwaysRender() {
			return false;
		}
		/** Whether slots are native `<slot>`s (shadow) rather than captured placeholders (light). */
		get _useNativeSlots() {
			return false;
		}
		_setSlotState(name, has) {
			if (name === "label") this._hasLabelSlotState = has;
			else this._hasHelperSlotState = has;
		}
		/**
		* Slot outlet for `label` / `helper`. Light (default): a `data-mono-slot`
		* placeholder the captured nodes are re-parented into when present, else the
		* prop `fallback`. Shadow overrides with a native `<slot name>`.
		*/
		_slotOutlet(name, fallback = nothing) {
			return (name === "label" ? this._hasLabelSlotState : this._hasHelperSlotState) ? html`<span data-mono-slot=${name}></span>` : html`${fallback}`;
		}
		/**
		* The field frame the editor mount shows in. Its children are NOT Lit's:
		* light — the mount is appended by `_placeMount`; shadow — overridden to hold
		* a `<slot name="editor">`. Nothing else may ever render inside it.
		*/
		_renderEditorOutlet(fieldClass) {
			return html`<div class=${fieldClass} mono-rte-field data-mono-slot="editor"></div>`;
		}
	}
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "size", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "color", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "variant", void 0);
	__decorate([property({
		type: String,
		attribute: "model-value"
	})], MonoRichTextEditorCoreClass.prototype, "modelValue", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "value", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "name", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "placeholder", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "label", void 0);
	__decorate([property({
		type: String,
		attribute: "helper-text"
	})], MonoRichTextEditorCoreClass.prototype, "helperText", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-state"
	})], MonoRichTextEditorCoreClass.prototype, "validationState", void 0);
	__decorate([property({
		type: String,
		attribute: "validation-message"
	})], MonoRichTextEditorCoreClass.prototype, "validationMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "error-message"
	})], MonoRichTextEditorCoreClass.prototype, "errorMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "success-message"
	})], MonoRichTextEditorCoreClass.prototype, "successMessage", void 0);
	__decorate([property({
		type: String,
		attribute: "aria-label"
	})], MonoRichTextEditorCoreClass.prototype, "ariaLabelText", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoRichTextEditorCoreClass.prototype, "disabled", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoRichTextEditorCoreClass.prototype, "readonly", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoRichTextEditorCoreClass.prototype, "required", void 0);
	__decorate([property({ attribute: false })], MonoRichTextEditorCoreClass.prototype, "cssClass", void 0);
	__decorate([property({ attribute: false })], MonoRichTextEditorCoreClass.prototype, "cssClassName", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "mode", void 0);
	__decorate([property({ attribute: "toolbar" })], MonoRichTextEditorCoreClass.prototype, "toolbar", void 0);
	__decorate([property({ attribute: "plugins" })], MonoRichTextEditorCoreClass.prototype, "plugins", void 0);
	__decorate([property({ attribute: "language" })], MonoRichTextEditorCoreClass.prototype, "language", void 0);
	__decorate([property({
		type: String,
		attribute: "text-direction"
	})], MonoRichTextEditorCoreClass.prototype, "textDirection", void 0);
	__decorate([property({
		attribute: "char-counter",
		reflect: true,
		converter: booleanStringConverter
	})], MonoRichTextEditorCoreClass.prototype, "charCounter", void 0);
	__decorate([property({
		attribute: "max-length",
		converter: optionalNumberConverter
	})], MonoRichTextEditorCoreClass.prototype, "maxLength", void 0);
	__decorate([property({
		reflect: true,
		converter: booleanStringConverter
	})], MonoRichTextEditorCoreClass.prototype, "statusbar", void 0);
	__decorate([property({ converter: optionalNumberConverter })], MonoRichTextEditorCoreClass.prototype, "sticky", void 0);
	__decorate([property({
		attribute: "load-css",
		converter: booleanStringConverter
	})], MonoRichTextEditorCoreClass.prototype, "loadCss", void 0);
	__decorate([property({ attribute: false })], MonoRichTextEditorCoreClass.prototype, "options", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "width", void 0);
	__decorate([property({ type: String })], MonoRichTextEditorCoreClass.prototype, "height", void 0);
	__decorate([property({
		type: String,
		attribute: "min-width"
	})], MonoRichTextEditorCoreClass.prototype, "minWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "max-width"
	})], MonoRichTextEditorCoreClass.prototype, "maxWidth", void 0);
	__decorate([property({
		type: String,
		attribute: "min-height"
	})], MonoRichTextEditorCoreClass.prototype, "minHeight", void 0);
	__decorate([property({
		type: String,
		attribute: "max-height"
	})], MonoRichTextEditorCoreClass.prototype, "maxHeight", void 0);
	__decorate([state()], MonoRichTextEditorCoreClass.prototype, "_hasLabelSlotState", void 0);
	__decorate([state()], MonoRichTextEditorCoreClass.prototype, "_hasHelperSlotState", void 0);
	__decorate([state()], MonoRichTextEditorCoreClass.prototype, "_error", void 0);
	__decorate([state()], MonoRichTextEditorCoreClass.prototype, "_loading", void 0);
	return MonoRichTextEditorCoreClass;
};

//#endregion
//#region src/components/rich-text-editor/mono-rich-text-editor.ts
let MonoRichTextEditor = class MonoRichTextEditor extends MonoRichTextEditorCore(LitElement) {
	constructor(..._args) {
		super(..._args);
		this._slotsCaptured = false;
		this._slotLabel = [];
		this._slotHelper = [];
	}
	createRenderRoot() {
		return this;
	}
	connectedCallback() {
		this._captureSlots();
		super.connectedCallback();
		if (this.isConnected) this.performUpdate();
	}
	updated(changed) {
		super.updated(changed);
		this._placeSlot("label", this._slotLabel);
		this._placeSlot("helper", this._slotHelper);
	}
	_captureSlots() {
		if (this._slotsCaptured) return;
		this._slotsCaptured = true;
		const captured = monoHostChildNodes(this);
		const capturedSlotNodes = /* @__PURE__ */ new Set();
		for (const node of captured) {
			if (!(node instanceof Element)) continue;
			const slotName = node.getAttribute("slot");
			if (slotName === "label") {
				node.removeAttribute("slot");
				this._slotLabel.push(node);
				capturedSlotNodes.add(node);
			}
			if (slotName === "helper") {
				node.removeAttribute("slot");
				this._slotHelper.push(node);
				capturedSlotNodes.add(node);
			}
		}
		this._hasLabelSlotState = this._slotLabel.length > 0;
		this._hasHelperSlotState = this._slotHelper.length > 0;
		for (const node of capturedSlotNodes) if (node.parentNode === this) this.removeChild(node);
	}
	_placeSlot(name, nodes) {
		if (!nodes.length) return;
		const target = this.querySelector(`[data-mono-slot="${name}"]`);
		if (!target) return;
		for (const node of nodes) placeSlotNode(target, node);
	}
};
MonoRichTextEditor = __decorate([customElement("mono-rich-text-editor")], MonoRichTextEditor);

//#endregion
export { AUTO_EXCLUDED_PLUGINS, MonoRichTextEditor, SUNEDITOR_CORE_BUTTONS, SUNEDITOR_LANG_CODES, TOOLBAR_BASIC, TOOLBAR_DEFAULT, TOOLBAR_FULL, TOOLBAR_PRESETS, TOOLBAR_STANDARD, loadSunEditor, loadSunEditorCss, loadSunEditorLang, loadSunEditorPlugins, pruneToolbar, resolvePlugins, resolveToolbar };