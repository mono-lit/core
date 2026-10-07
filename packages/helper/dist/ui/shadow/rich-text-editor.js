import { a as __decorate, d as optionalNumberConverter, f as customElement, i as withShadowUtilityStyles, l as defineHybridPropAliases, r as toShadowCss, s as booleanStringConverter, t as flushSsrHydration } from "../../hydration-flush-RB5Tz5nl.js";
import { t as dispatchMonoEvent } from "../../mono-event-Bi1qP9uN.js";
import { n as toCssSize, t as buildSizeStyle } from "../../css-size-DhHSVZJK.js";
import { t as MonoFormControlCore } from "../../form-control-core-B8d7k6vk.js";
import { LitElement, html, isServer, nothing, unsafeCSS } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
//#region src/components/rich-text-editor/rich-text-editor-loader.ts
var INSTALL_HINT = "[mono-rich-text-editor] needs the optional peer dependency \"suneditor\". Install it in your app: pnpm add suneditor@^3.3.3";
function withHint(err) {
	const message = err instanceof Error ? err.message : String(err);
	return /* @__PURE__ */ new Error(`${INSTALL_HINT}${message ? ` (original error: ${message})` : ""}`);
}
var _corePromise = null;
/** The `suneditor` default export (`{ create, init }`), cached; a failure resets so a later attempt retries. */
function loadSunEditor() {
	_corePromise ??= import("suneditor").then((m) => m?.default ?? m).catch((err) => {
		_corePromise = null;
		throw withHint(err);
	});
	return _corePromise;
}
var _cssPromise = null;
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
var _pluginsPromise = null;
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
var LANGS = {
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
var SUNEDITOR_LANG_CODES = Object.keys(LANGS);
var _langPromises = /* @__PURE__ */ new Map();
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
var SUNEDITOR_CORE_BUTTONS = new Set([
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
var AUTO_EXCLUDED_PLUGINS = new Set([
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
var SPECIAL = /^(\||\/|-left|-right|-center|#fix)$/;
/**
* SunEditor's own default (`DEFAULTS.BUTTON_LIST`) — no plugin buttons at all.
* Mirrored here rather than imported so the presets stay pure.
*/
var TOOLBAR_DEFAULT = [
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
var TOOLBAR_BASIC = [
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
var TOOLBAR_STANDARD = [
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
var TOOLBAR_FULL = [
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
var TOOLBAR_PRESETS = {
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
var MonoRichTextEditorCore = (superClass) => {
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
//#region src/components/rich-text-editor/rich-text-editor.css?raw
var rich_text_editor_default = "/* =========================================================================\r\n   mono-rich-text-editor — a mono form field whose input is a SunEditor v3\r\n   instance. An EXTENSION: Basecoat has no editor, so the CHROME is the ported\r\n   textarea's `.field` (basecoat-css@1.0.2, vega style) — label, frame, message\r\n   — and the EDITOR is SunEditor's own DOM, styled by ITS stylesheet\r\n   (`suneditor/css/editor`, loaded by the element at runtime) and themed from\r\n   here by remapping its `--se-*` tokens onto the Basecoat tokens.\r\n\r\n   Styled by ATTRIBUTE, like Basecoat — and the attributes mirror the element's\r\n   props one for one, so hand-written markup reads like the Lit / Vue tag:\r\n\r\n     <mono-rich-text-editor size=\"sm\" color=\"danger\" label=\"Body\" helper-text=\"…\">\r\n     <div mono-rich-text-editor mono-size=\"sm\" mono-color=\"danger\">\r\n       <label mono-rte-label>Body</label>\r\n       <div mono-rte-field><div mono-rte-mount>…SunEditor…</div></div>\r\n       <div mono-rte-footer><div mono-rte-message-wrap><div mono-rte-message=\"helper\">…</div></div></div>\r\n     </div>\r\n\r\n   An absent attribute is the prop's default (`:not([mono-size])` = md,\r\n   `:not([mono-color])` = primary, `:not([mono-variant])` = outlined). The element\r\n   renders these on its root (both builds) plus the STATES `mono-disabled` /\r\n   `mono-readonly` / `mono-required` / `mono-loading` / `mono-unavailable` /\r\n   `mono-has-value` and `mono-validation-state=\"valid|invalid|warning\"`. The\r\n   old classes (`.mono-rich-text-editor.md.primary.outlined`) are still emitted\r\n   as inert hooks until 2.0 but no rule here reads them.\r\n\r\n   THE PARTS ARE FAMILY-UNIQUE (`mono-rte-*`): the frame holds SunEditor's whole\r\n   DOM, and a consumer's content may carry anything.\r\n\r\n   Selector map (ours ≡ upstream):\r\n     [mono-rich-text-editor]                       ≡ .field (flex w-full flex-col gap-3)\r\n     [mono-rich-text-editor] > [mono-rte-label]    ≡ .field > label / .label\r\n     [mono-rte-field]                              ≡ .textarea's box (rounded-md border-input bg-transparent shadow-xs,\r\n                                                     focus-within: border-ring ring-3 ring-ring/50) — the editor sits inside\r\n     [mono-rte-mount] .sun-editor .se-toolbar      ≡ EXTENSION (a muted band under the frame's top edge)\r\n     [mono-rte-footer] > [mono-rte-message-wrap] > [mono-rte-message=\"…\"] ≡ .field > p / .field [role='alert']\r\n     [mono-validation-state=\"invalid\"]             ≡ aria-invalid:border-destructive aria-invalid:ring-destructive/20\r\n     [mono-validation-state=\"valid|warning\"]       ≡ EXTENSION (the same treatment in --success / --warning)\r\n     [mono-size=\"xs|sm|lg|xl|xxl\"]                 ≡ EXTENSION (the textarea's font ladder; icons step with it)\r\n     [mono-variant=\"filled\"]                       ≡ EXTENSION (luma / mira / rhea's textarea)\r\n     [mono-variant=\"underlined\"]                   ≡ EXTENSION (sera's: the bottom edge only, no ring)\r\n     [mono-rte-unavailable]                        ≡ EXTENSION (the peer-missing notice)\r\n     .se-tooltip-text (SunEditor's)                ≡ [data-tooltip]::before (bg-foreground text-background rounded-md px-3 py-1.5 text-xs)\r\n\r\n   FLAVORS: the frame IS the textarea's box, so every metric resolves\r\n   `--mono-rich-text-editor-<k>` → `--mono-textarea-<k>` → the base through the\r\n   SAME chains textarea.css uses — a flavour that retunes the textarea retunes\r\n   this frame, and no flavour file carries an editor entry. SunEditor's own\r\n   popovers (dropdowns, the modal layer it parks on <body>) take the select\r\n   panel's popover chain (`--mono-select-dropdown-*`), like every other popover.\r\n\r\n   The editor DOM is LIGHT DOM in both builds (see `rich-text-editor-core.ts`),\r\n   so the `--se-*` remap is declared on the frame and inherited by the mount —\r\n   through a `<slot>` in the shadow build, which custom properties cross — and\r\n   DELIVERED on `.sun-editor` from the PAGE sheet (the shadow sheet cannot reach\r\n   a slotted descendant). Nothing below reaches into SunEditor's selectors except\r\n   to flatten the frame it paints around itself, which the mono frame replaces.\r\n   ========================================================================= */\r\n\r\nmono-rich-text-editor {\r\n  display: block;\r\n}\r\n\r\n/* The token block — on the element root AND on SunEditor's carrier (the layer it\r\n   parks on <body> for its dropdown lists, dialogs and alerts), which is outside\r\n   every frame and can inherit nothing from it. The element's own props (`color`,\r\n   `size`) cannot reach the carrier either: it takes the defaults. */\r\n[mono-rich-text-editor],\r\n.sun-editor.sun-editor-carrier-wrapper {\r\n  /* ── palette: each slot is a public knob over the textarea's, over a Basecoat token ── */\r\n  --_mono-rte-text: var(--mono-rich-text-editor-text, var(--mono-textarea-text, var(--foreground)));\r\n  --_mono-rte-placeholder: var(--mono-rich-text-editor-placeholder, var(--mono-textarea-placeholder, var(--muted-foreground)));\r\n  --_mono-rte-muted: var(--mono-rich-text-editor-muted, var(--mono-textarea-muted, var(--muted-foreground)));\r\n  --_mono-rte-primary: var(--mono-rich-text-editor-primary, var(--mono-textarea-primary, var(--ring)));\r\n  --_mono-rte-secondary: var(--mono-rich-text-editor-secondary, var(--mono-textarea-secondary, var(--muted-foreground)));\r\n  --_mono-rte-success: var(--mono-rich-text-editor-success, var(--mono-textarea-success, var(--success)));\r\n  --_mono-rte-danger: var(--mono-rich-text-editor-danger, var(--mono-textarea-danger, var(--destructive)));\r\n  --_mono-rte-warning: var(--mono-rich-text-editor-warning, var(--mono-textarea-warning, var(--warning)));\r\n  --_mono-rte-info: var(--mono-rich-text-editor-info, var(--mono-textarea-info, var(--info)));\r\n  --_mono-rte-teal: var(--mono-rich-text-editor-teal, var(--mono-textarea-teal, var(--teal)));\r\n  --_mono-rte-purple: var(--mono-rich-text-editor-purple, var(--mono-textarea-purple, var(--purple)));\r\n  --_mono-rte-neutral: var(--mono-rich-text-editor-neutral, var(--mono-textarea-neutral, var(--neutral)));\r\n  --_mono-rte-dark: var(--mono-rich-text-editor-dark, var(--mono-textarea-dark, var(--dark)));\r\n  --_mono-rte-valid: var(--mono-rich-text-editor-valid, var(--mono-textarea-valid, var(--success)));\r\n  --_mono-rte-invalid: var(--mono-rich-text-editor-invalid, var(--mono-textarea-invalid, var(--destructive)));\r\n\r\n  /* ── the painted result — three tiers, base = vega's .textarea ─────────── */\r\n  --_mono-rte-ring-color: var(--mono-rich-text-editor-ring-color, var(--mono-rich-text-editor-focus-color, var(--_mono-rte-ring-color-preset, var(--_mono-rte-primary))));\r\n  --_mono-rte-ring-width: var(--mono-rich-text-editor-ring-width, var(--mono-textarea-ring-width, var(--_mono-rte-ring-width-preset, var(--mono-ring-width))));\r\n  --_mono-rte-ring-alpha: var(--mono-rich-text-editor-ring-alpha, var(--mono-textarea-ring-alpha, var(--mono-ring-alpha)));\r\n  --_mono-rte-border-color: var(--mono-rich-text-editor-rest-border, var(--mono-rich-text-editor-border-color, var(--mono-rich-text-editor-border, var(--mono-textarea-rest-border, var(--mono-textarea-border-color, var(--_mono-rte-border-color-preset, var(--input)))))));\r\n  --_mono-rte-side-border-color: var(--_mono-rte-side-border-color-preset, var(--_mono-rte-border-color));\r\n  --_mono-rte-bg: var(--mono-rich-text-editor-bg, var(--mono-rich-text-editor-surface, var(--mono-textarea-bg, var(--mono-textarea-surface, var(--_mono-rte-bg-preset, var(--mono-mode-surface))))));\r\n  --_mono-rte-shadow: var(--mono-rich-text-editor-shadow, var(--mono-textarea-shadow, var(--_mono-rte-shadow-preset, var(--mono-shadow-xs))));\r\n  --_mono-rte-border-width: var(--mono-rich-text-editor-border-width, var(--mono-textarea-border-width, var(--mono-border-width)));\r\n  --_mono-rte-radius: var(--mono-rich-text-editor-radius, var(--mono-textarea-radius, var(--_mono-rte-radius-preset, var(--mono-radius-md))));\r\n\r\n  /* ── md metrics live on the unqualified root ON PURPOSE: hand-written\r\n        `<div mono-rich-text-editor>` that names no size renders like size=\"md\" ── */\r\n  --_mono-rte-font-size: var(--mono-rich-text-editor-font-size, var(--mono-rich-text-editor-font-md, var(--mono-textarea-font-md, var(--mono-text-sm))));\r\n  --_mono-rte-icon-size: var(--mono-rich-text-editor-icon-size, var(--_mono-rte-icon-size-preset, 18px));\r\n  --_mono-rte-font-family: var(--mono-rich-text-editor-font-family, inherit);\r\n  --_mono-rte-min-height: var(--mono-rich-text-editor-min-height, 10rem);\r\n  /* EXTENSION — the toolbar band: a muted wash under the frame's top edge */\r\n  --_mono-rte-toolbar-bg: var(--mono-rich-text-editor-toolbar-bg, color-mix(in oklab, var(--muted) 60%, var(--_mono-rte-bg)));\r\n\r\n  /* ── SunEditor's popovers (dropdowns, dialogs) are the select panel's popover ── */\r\n  --_mono-rte-popover-bg: var(--mono-rich-text-editor-popover-bg, var(--mono-select-dropdown-bg, var(--popover)));\r\n  --_mono-rte-popover-color: var(--mono-rich-text-editor-popover-color, var(--mono-select-dropdown-color, var(--popover-foreground)));\r\n  --_mono-rte-popover-radius: var(--mono-rich-text-editor-popover-radius, var(--mono-select-dropdown-radius, var(--mono-radius-md)));\r\n  --_mono-rte-popover-shadow: var(--mono-rich-text-editor-popover-shadow, var(--mono-select-dropdown-shadow, var(--mono-shadow-md)));\r\n\r\n  /* basecoat@1.0.2 styles/vega.css [data-tooltip]::before — bg-foreground text-background rounded-md px-3 py-1.5 text-xs\r\n     SunEditor's toolbar tooltips; the corner is the style's shared tooltip token */\r\n  --_mono-rte-tooltip-bg: var(--mono-rich-text-editor-tooltip-bg, var(--mono-tooltip-bg, var(--foreground)));\r\n  --_mono-rte-tooltip-color: var(--mono-rich-text-editor-tooltip-color, var(--mono-tooltip-color, var(--background)));\r\n  --_mono-rte-tooltip-radius: var(--mono-rich-text-editor-tooltip-radius, var(--mono-tooltip-radius, var(--mono-radius-md)));\r\n\r\n  /* ── SunEditor's tokens, remapped onto the theme ─────────────────────────\r\n     Declared on the FRAME'S ancestor so the light-DOM mount inherits them in\r\n     both builds. `.sun-editor` re-declares every one of these on itself with\r\n     its defaults, so each is delivered again on `.sun-editor` below — this\r\n     block is what a consumer sees and overrides; that one is the delivery. */\r\n  --_se-main-color: var(--_mono-rte-text);\r\n  --_se-main-color-lighter: var(--_mono-rte-muted);\r\n  --_se-main-background: var(--_mono-rte-bg);\r\n  --_se-main-border: var(--border);\r\n  --_se-main-divider: var(--border);\r\n  --_se-main-outline: var(--_mono-rte-ring-color);\r\n  /* the accent: links and the focus outline */\r\n  --_se-active: var(--_mono-rte-ring-color);\r\n  --_se-active-dark: color-mix(in oklab, var(--_mono-rte-ring-color) 85%, var(--foreground));\r\n  /* basecoat@1.0.2 styles/vega.css .btn[data-variant='ghost'] — hover:bg-accent hover:text-accent-foreground\r\n     a pressed toolbar button and a checked list item are the toggle-on state:\r\n     the accent WASH with the foreground ink, never a primary tint */\r\n  --_se-active-ink: var(--mono-rich-text-editor-active-color, var(--accent-foreground, var(--_mono-rte-text)));\r\n  --_se-active-light: var(--mono-rich-text-editor-active-bg, var(--accent, var(--muted)));\r\n  --_se-active-light2: var(--mono-mode-surface-hover);\r\n  --_se-hover: var(--_mono-rte-text);\r\n  --_se-hover-light: var(--mono-mode-ghost-hover);\r\n  --_se-hover-light2: var(--mono-mode-surface-hover);\r\n  --_se-error: var(--_mono-rte-danger);\r\n  --_se-success: var(--_mono-rte-success);\r\n  --_se-placeholder: var(--_mono-rte-placeholder);\r\n  --_se-radius: var(--mono-radius-sm);\r\n  --_se-radius-lg: var(--_mono-rte-popover-radius);\r\n  --_se-shadow-layer: var(--_mono-rte-popover-shadow);\r\n  --_se-font-family: var(--_mono-rte-font-family);\r\n  --_se-font-size: var(--_mono-rte-font-size);\r\n  --_se-icon-size: var(--_mono-rte-icon-size);\r\n  --_se-min-height: var(--_mono-rte-min-height);\r\n\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field — flex w-full flex-col gap-3 */\r\n[mono-rich-text-editor] {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: var(--mono-rich-text-editor-gap, var(--mono-textarea-gap, calc(var(--mono-spacing) * 3)));\r\n  width: 100%;\r\n  min-width: 0;\r\n  color: var(--_mono-rte-text);\r\n  font-family: inherit;\r\n}\r\n\r\n[mono-rich-text-editor],\r\n:where([mono-rich-text-editor]) > *,\r\n:where([mono-rich-text-editor]) > * > *::before,\r\n:where([mono-rich-text-editor]) > * > *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n/* the shadow build renders every region and marks the empty ones; the light\r\n   build renders only what exists */\r\n[mono-rich-text-editor] :is([mono-rte-label], [mono-rte-message], [mono-rte-footer])[mono-empty] {\r\n  display: none;\r\n}\r\n\r\n[mono-rich-text-editor] > [mono-rte-message-outlet]:not(:has([mono-rte-footer]:not([mono-empty]))) {\r\n  display: none;\r\n}\r\n\r\n/* =========================================\r\n   Sizes — EXTENSION: the textarea's font ladder; the icons step with it\r\n   ========================================= */\r\n\r\n[mono-rich-text-editor][mono-size=\"xs\"] {\r\n  --_mono-rte-font-size: var(--mono-rich-text-editor-font-size, var(--mono-rich-text-editor-font-xs, var(--mono-textarea-font-xs, var(--mono-text-xs))));\r\n  --_mono-rte-icon-size-preset: 14px;\r\n}\r\n[mono-rich-text-editor][mono-size=\"sm\"] {\r\n  --_mono-rte-font-size: var(--mono-rich-text-editor-font-size, var(--mono-rich-text-editor-font-sm, var(--mono-textarea-font-sm, var(--mono-textarea-font-md, var(--mono-text-sm)))));\r\n  --_mono-rte-icon-size-preset: 16px;\r\n}\r\n[mono-rich-text-editor][mono-size=\"lg\"] {\r\n  --_mono-rte-font-size: var(--mono-rich-text-editor-font-size, var(--mono-rich-text-editor-font-lg, var(--mono-textarea-font-lg, var(--mono-textarea-font-md, var(--mono-text-sm)))));\r\n  --_mono-rte-icon-size-preset: 20px;\r\n}\r\n[mono-rich-text-editor][mono-size=\"xl\"] {\r\n  --_mono-rte-font-size: var(--mono-rich-text-editor-font-size, var(--mono-rich-text-editor-font-xl, var(--mono-textarea-font-xl, var(--mono-text-base))));\r\n  --_mono-rte-icon-size-preset: 22px;\r\n}\r\n[mono-rich-text-editor][mono-size=\"xxl\"] {\r\n  --_mono-rte-font-size: var(--mono-rich-text-editor-font-size, var(--mono-rich-text-editor-font-xxl, var(--mono-textarea-font-xxl, var(--mono-text-base))));\r\n  --_mono-rte-icon-size-preset: 24px;\r\n}\r\n\r\n/* =========================================\r\n   Colours — EXTENSION: the `color` prop is the FOCUS colour, which is also the\r\n   editor's active state and links\r\n   ========================================= */\r\n\r\n[mono-rich-text-editor][mono-color=\"secondary\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-secondary);\r\n}\r\n[mono-rich-text-editor][mono-color=\"success\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-success);\r\n}\r\n[mono-rich-text-editor][mono-color=\"danger\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-danger);\r\n}\r\n[mono-rich-text-editor][mono-color=\"warning\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-warning);\r\n}\r\n[mono-rich-text-editor][mono-color=\"info\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-info);\r\n}\r\n[mono-rich-text-editor][mono-color=\"teal\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-teal);\r\n}\r\n[mono-rich-text-editor][mono-color=\"purple\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-purple);\r\n}\r\n[mono-rich-text-editor][mono-color=\"neutral\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-neutral);\r\n}\r\n[mono-rich-text-editor][mono-color=\"dark\"] {\r\n  --_mono-rte-ring-color-preset: var(--_mono-rte-dark);\r\n}\r\n\r\n/* =========================================\r\n   Label\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > label, .label\r\n   — text-sm leading-snug font-medium */\r\n:where([mono-rich-text-editor]) > [mono-rte-label] {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: calc(var(--mono-spacing) * 1);\r\n  font-size: var(--mono-rich-text-editor-label-font-size, var(--mono-textarea-label-font-size, var(--mono-text-sm)));\r\n  line-height: var(--mono-rich-text-editor-label-line-height, var(--mono-textarea-label-line-height, var(--mono-leading-snug)));\r\n  font-weight: var(--mono-rich-text-editor-label-font-weight, var(--mono-textarea-label-font-weight, var(--mono-label-font-weight, var(--mono-font-weight-medium))));\r\n  color: var(--mono-rich-text-editor-label-color, var(--mono-textarea-label-color, var(--_mono-rte-text)));\r\n}\r\n\r\n[mono-rich-text-editor][mono-validation-state=\"invalid\"] > [mono-rte-label] {\r\n  color: var(--mono-rich-text-editor-label-color, var(--mono-textarea-label-color, var(--_mono-rte-invalid)));\r\n}\r\n\r\n:where([mono-rich-text-editor]) [mono-rte-required-mark] {\r\n  color: var(--mono-rich-text-editor-required-color, var(--mono-textarea-required-color, var(--destructive)));\r\n}\r\n\r\n[mono-rich-text-editor][mono-disabled] > [mono-rte-label] {\r\n  opacity: 0.5;\r\n}\r\n\r\n/* =========================================\r\n   The frame — the textarea's box, holding the editor\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > textarea, .textarea\r\n   — rounded-md border border-input bg-transparent shadow-xs\r\n   transition-[color,box-shadow] (dark:bg-input/30 via --mono-mode-surface);\r\n   mono: no padding — the editor's toolbar and page fill the box edge to edge */\r\n:where([mono-rich-text-editor]) [mono-rte-field] {\r\n  --_mono-rte-ring: 0 0 #0000;\r\n  position: relative;\r\n  width: 100%;\r\n  min-width: 0;\r\n  border: var(--_mono-rte-border-width) solid var(--_mono-rte-side-border-color);\r\n  border-bottom-color: var(--_mono-rte-border-color);\r\n  border-radius: var(--_mono-rte-radius);\r\n  background-color: var(--_mono-rte-bg);\r\n  color: var(--_mono-rte-text);\r\n  box-shadow: var(--_mono-rte-ring), var(--_mono-rte-shadow);\r\n  /* the editor paints its own corners; clip so the toolbar's top corners follow\r\n     the frame's radius */\r\n  overflow: hidden;\r\n  transition-property: color, background-color, border-color, box-shadow, opacity;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n\r\n/* Before the editor loads (and on the server) the frame is a quiet box the\r\n   size of the editing area, so the form does not jump when it lands. */\r\n[mono-rich-text-editor][mono-loading] [mono-rte-field] {\r\n  min-height: calc(var(--_mono-rte-min-height) + 2.75rem);\r\n}\r\n[mono-rich-text-editor][mono-unavailable] [mono-rte-field] {\r\n  display: none;\r\n}\r\n\r\n/* focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 —\r\n   the focus is on SunEditor's contenteditable inside the frame */\r\n:where([mono-rich-text-editor]) [mono-rte-field]:focus-within {\r\n  border-color: var(--_mono-rte-side-border-color);\r\n  border-bottom-color: var(--_mono-rte-ring-color);\r\n  --_mono-rte-ring: 0 0 0 var(--_mono-rte-ring-width) color-mix(in oklab, var(--_mono-rte-ring-color) var(--_mono-rte-ring-alpha), transparent);\r\n}\r\n[mono-rich-text-editor]:is(:not([mono-variant]), [mono-variant=\"outlined\"], [mono-variant=\"filled\"]) [mono-rte-field]:focus-within {\r\n  border-color: var(--_mono-rte-ring-color);\r\n}\r\n\r\n/* aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20\r\n   (dark: /50 and /40, carried by the mode tokens) */\r\n[mono-rich-text-editor][mono-validation-state=\"invalid\"] [mono-rte-field] {\r\n  --_mono-rte-border-color: var(--mono-mode-invalid-border);\r\n  --_mono-rte-ring: 0 0 0 var(--_mono-rte-ring-width) var(--mono-mode-invalid-ring);\r\n}\r\n\r\n/* EXTENSION — the same treatment in the success / warning roles */\r\n[mono-rich-text-editor][mono-validation-state=\"valid\"] [mono-rte-field] {\r\n  --_mono-rte-border-color: color-mix(in oklab, var(--_mono-rte-valid) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-rte-ring: 0 0 0 var(--_mono-rte-ring-width) color-mix(in oklab, var(--_mono-rte-valid) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n[mono-rich-text-editor][mono-validation-state=\"warning\"] [mono-rte-field] {\r\n  --_mono-rte-border-color: color-mix(in oklab, var(--_mono-rte-warning) var(--mono-mode-state-border-alpha), transparent);\r\n  --_mono-rte-ring: 0 0 0 var(--_mono-rte-ring-width) color-mix(in oklab, var(--_mono-rte-warning) var(--mono-mode-state-ring-alpha), transparent);\r\n}\r\n\r\n/* disabled:cursor-not-allowed disabled:opacity-50 */\r\n[mono-rich-text-editor][mono-disabled] [mono-rte-field] {\r\n  opacity: 0.5;\r\n  cursor: not-allowed;\r\n  background-color: var(--mono-rich-text-editor-disabled-bg, var(--mono-textarea-disabled-bg, var(--_mono-rte-bg)));\r\n}\r\n\r\n/* EXTENSION — readonly is legible, not dimmed: a muted surface */\r\n[mono-rich-text-editor][mono-readonly]:not([mono-disabled]) [mono-rte-field] {\r\n  --_se-main-background: var(--mono-rich-text-editor-readonly-bg, var(--mono-textarea-readonly-bg, var(--muted)));\r\n  background-color: var(--mono-rich-text-editor-readonly-bg, var(--mono-textarea-readonly-bg, var(--muted)));\r\n}\r\n\r\n/* =========================================\r\n   Variants — EXTENSION: the two other looks Basecoat's styles ship, through\r\n   the textarea's own knobs so a flavour that restyles the textarea restyles this\r\n   ========================================= */\r\n\r\n[mono-rich-text-editor]:is(:not([mono-variant]), [mono-variant=\"outlined\"]) {\r\n  --_mono-rte-bg-preset: var(--mono-rich-text-editor-outline-bg, var(--mono-textarea-outline-bg));\r\n  --_mono-rte-border-color-preset: var(--mono-rich-text-editor-outline-border-color, var(--mono-textarea-outline-border-color));\r\n  --_mono-rte-side-border-color-preset: var(--mono-rich-text-editor-outline-side-border-color, var(--mono-textarea-outline-side-border-color));\r\n  --_mono-rte-shadow-preset: var(--mono-rich-text-editor-outline-shadow, var(--mono-textarea-outline-shadow, var(--mono-shadow-xs)));\r\n  --_mono-rte-radius-preset: var(--mono-rich-text-editor-outline-radius, var(--mono-textarea-outline-radius));\r\n  --_mono-rte-ring-width-preset: var(--mono-rich-text-editor-outline-ring-width, var(--mono-textarea-outline-ring-width));\r\n}\r\n\r\n/* `filled` ≡ luma / mira / rhea's textarea: a tinted surface, no border, no shadow */\r\n[mono-rich-text-editor][mono-variant=\"filled\"] {\r\n  --_mono-rte-bg-preset: var(--mono-rich-text-editor-filled-bg, var(--mono-textarea-filled-bg, color-mix(in oklab, var(--input) 50%, transparent)));\r\n  --_mono-rte-border-color-preset: transparent;\r\n  --_mono-rte-shadow-preset: 0 0 #0000;\r\n}\r\n\r\n/* `underlined` ≡ sera's: square, the bottom edge only, and no ring */\r\n[mono-rich-text-editor][mono-variant=\"underlined\"] {\r\n  --_mono-rte-radius-preset: 0;\r\n  --_mono-rte-bg-preset: transparent;\r\n  --_mono-rte-side-border-color-preset: transparent;\r\n  --_mono-rte-shadow-preset: 0 0 #0000;\r\n  --_mono-rte-ring-width-preset: 0px;\r\n}\r\n[mono-rich-text-editor][mono-variant=\"underlined\"] [mono-rte-field] {\r\n  --_se-main-background: transparent;\r\n  --_mono-rte-toolbar-bg: transparent;\r\n}\r\n\r\n/* =========================================\r\n   Footer — the message row\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .fieldset legend + p, .field > p, .field section > p\r\n   — text-sm text-muted-foreground leading-normal font-normal */\r\n:where([mono-rich-text-editor]) [mono-rte-footer] {\r\n  display: flex;\r\n  align-items: flex-start;\r\n  justify-content: space-between;\r\n  gap: calc(var(--mono-spacing) * 2);\r\n}\r\n\r\n:where([mono-rich-text-editor]) [mono-rte-message-wrap] {\r\n  flex: 1 1 auto;\r\n  min-width: 0;\r\n}\r\n\r\n:where([mono-rich-text-editor]) [mono-rte-message] {\r\n  font-size: var(--mono-rich-text-editor-message-font-size, var(--mono-textarea-message-font-size, var(--mono-text-sm)));\r\n  line-height: var(--mono-rich-text-editor-message-line-height, var(--mono-textarea-message-line-height, var(--mono-leading-normal)));\r\n  font-weight: var(--mono-font-weight-normal);\r\n  color: var(--_mono-rte-muted);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field [role=\"alert\"] — text-destructive text-sm */\r\n:where([mono-rich-text-editor]) [mono-rte-message=\"invalid\"] {\r\n  color: var(--_mono-rte-invalid);\r\n}\r\n:where([mono-rich-text-editor]) [mono-rte-message=\"valid\"] {\r\n  color: var(--_mono-rte-valid);\r\n}\r\n:where([mono-rich-text-editor]) [mono-rte-message=\"warning\"] {\r\n  color: var(--_mono-rte-warning);\r\n}\r\n\r\n/* EXTENSION — the peer-missing notice: reads like a validation message, never like a crash */\r\n:where([mono-rich-text-editor]) [mono-rte-unavailable] {\r\n  padding: calc(var(--mono-spacing) * 2.5) calc(var(--mono-spacing) * 3);\r\n  border: var(--mono-border-width) dashed var(--_mono-rte-danger);\r\n  border-radius: var(--_mono-rte-radius);\r\n  background: color-mix(in oklab, var(--_mono-rte-danger) var(--mono-mode-tint), transparent);\r\n  color: var(--_mono-rte-danger);\r\n  font-size: var(--mono-text-sm);\r\n  line-height: var(--mono-leading-normal);\r\n  overflow-wrap: anywhere;\r\n}\r\n\r\n/* =========================================\r\n   SunEditor inside the frame — from the PAGE sheet (the mount is light DOM)\r\n   ========================================= */\r\n\r\n[mono-rte-mount] {\r\n  display: block;\r\n  width: 100%;\r\n  min-width: 0;\r\n}\r\n\r\n/* Deliver the remap. `.sun-editor` sets every `--se-*` on itself from\r\n   SunEditor's sheet, so the same selector (plus ours for specificity) has to\r\n   set them again — the values, though, come from the frame's `--_se-*` above,\r\n   which the mount inherits. Only the tokens a theme is made of; the rest keep\r\n   SunEditor's defaults. */\r\n[mono-rte-mount] .sun-editor,\r\n[mono-rte-mount] .sun-editor-editable,\r\n.sun-editor.sun-editor-carrier-wrapper {\r\n  --se-main-font-family: var(--_se-font-family);\r\n  --se-content-font-family: var(--_se-font-family);\r\n  --se-main-font-size: var(--_se-font-size);\r\n  --se-btn-font-size: var(--_se-font-size);\r\n  --se-edit-font-size: calc(var(--_se-font-size) * 1.1);\r\n  --se-icon-size: var(--_se-icon-size);\r\n  --se-min-height: var(--_se-min-height);\r\n  --se-border-radius: var(--_se-radius);\r\n  --se-border-radius-lg: var(--_se-radius-lg);\r\n\r\n  --se-main-color: var(--_se-main-color);\r\n  --se-main-color-lighter: var(--_se-main-color-lighter);\r\n  --se-main-font-color: var(--_se-main-color);\r\n  --se-main-background-color: var(--_se-main-background);\r\n  --se-main-border-color: var(--_se-main-border);\r\n  --se-main-divider-color: var(--_se-main-divider);\r\n  --se-main-outline-color: var(--_se-main-outline);\r\n  --se-main-shadow-color: var(--_se-main-divider);\r\n  --se-statusbar-font-color: var(--_se-main-color-lighter);\r\n  --se-dropdown-font-color: var(--_se-main-color);\r\n\r\n  --se-edit-font-color: var(--_se-main-color);\r\n  --se-edit-background-color: var(--_se-main-background);\r\n  --se-edit-anchor: var(--_se-active);\r\n  --se-caret-color: var(--_se-main-color);\r\n  --se-placeholder-color: var(--_se-placeholder);\r\n\r\n  --se-hover-color: var(--_se-hover);\r\n  --se-hover-dark-color: var(--_se-main-border);\r\n  --se-hover-light-color: var(--_se-hover-light);\r\n  --se-hover-light2-color: var(--_se-hover-light2);\r\n  --se-hover-light3-color: var(--_se-hover-light2);\r\n\r\n  /* the accent for outlines and links; the toggle-on state for buttons and\r\n     checked list items (ink = --se-active-dark3/4, wash = --se-active-light*) */\r\n  --se-active-color: var(--_se-active);\r\n  --se-active-hover-color: var(--_se-active-ink);\r\n  --se-active-dark-color: var(--_se-main-border);\r\n  --se-active-dark2-color: var(--_se-active-dark);\r\n  --se-active-dark3-color: var(--_se-active-ink);\r\n  --se-active-dark4-color: var(--_se-main-border);\r\n  --se-active-dark5-color: var(--_se-active-dark);\r\n  --se-active-light-color: var(--_se-active-light);\r\n  --se-active-light2-color: var(--_se-active-light);\r\n  --se-active-light3-color: var(--_se-active-light2);\r\n  --se-active-light4-color: var(--_se-active-light);\r\n  --se-active-light5-color: var(--_se-active-light2);\r\n  --se-active-light6-color: var(--_se-active-light2);\r\n\r\n  --se-error-color: var(--_se-error);\r\n  --se-success-color: var(--_se-success);\r\n\r\n  --se-select-menu-hover-bg: var(--_se-hover-light);\r\n  --se-select-menu-active-bg: var(--_se-active-light);\r\n  --se-modal-background-color: var(--_mono-rte-popover-bg);\r\n  --se-modal-color: var(--_mono-rte-popover-color);\r\n  --se-modal-border-color: var(--_se-main-border);\r\n  --se-modal-anchor-color: var(--_se-active);\r\n  --se-shadow-layer: var(--_se-shadow-layer);\r\n\r\n  /* ── the sub-surfaces SunEditor paints from its own light palette ────────\r\n     code view, the table picker, the floating controllers, the modal chrome,\r\n     the overlay, the editing area's own colours — every one a page token now */\r\n  --se-codeview-font-family: var(--font-mono, ui-monospace, monospace);\r\n  --se-markdown-font-family: var(--font-mono, ui-monospace, monospace);\r\n  --se-code-view-color: var(--_mono-rte-text);\r\n  --se-code-view-background-color: var(--_se-main-background);\r\n  --se-code-view-line-color: var(--_mono-rte-muted);\r\n  --se-code-view-line-background-color: var(--muted);\r\n  --se-markdown-view-color: var(--_mono-rte-text);\r\n  --se-markdown-view-background-color: var(--_se-main-background);\r\n  --se-markdown-view-line-color: var(--_mono-rte-muted);\r\n  --se-markdown-view-line-background-color: var(--muted);\r\n\r\n  --se-table-picker-color: var(--_mono-rte-popover-bg);\r\n  --se-table-picker-border-color: var(--_se-main-border);\r\n  --se-table-picker-highlight-color: color-mix(in oklab, var(--_se-active) var(--mono-mode-tint), var(--_mono-rte-popover-bg));\r\n  --se-table-picker-highlight-border-color: var(--_se-active);\r\n\r\n  --se-controller-background-color: var(--_mono-rte-popover-bg);\r\n  --se-controller-color: var(--_mono-rte-popover-color);\r\n  --se-controller-border-color: var(--_se-main-border);\r\n  --se-shadow-controller: var(--_se-shadow-layer);\r\n  --se-shadow-controller-color: transparent;\r\n  --se-shadow-layer-color: transparent;\r\n  --se-overlay-background-color: var(--mono-mode-backdrop, #000);\r\n\r\n  --se-modal-preview-color: var(--_mono-rte-muted);\r\n  --se-modal-file-input-background-color: var(--muted);\r\n  --se-modal-input-disabled-color: var(--_mono-rte-muted);\r\n  --se-modal-input-disabled-background-color: var(--muted);\r\n  --se-input-btn-border-color: var(--_se-main-border);\r\n  --se-input-btn-disabled-color: var(--_mono-rte-muted);\r\n  --se-main-out-color: var(--_se-main-border);\r\n  --se-hover-dark2-color: var(--_se-main-border);\r\n  --se-hover-dark3-color: var(--_se-main-border);\r\n  --se-loading-color: var(--_se-active);\r\n\r\n  --se-drag-caret-color: var(--_se-active);\r\n  --se-edit-active: var(--_se-active);\r\n  --se-edit-hover: var(--_se-active-light);\r\n  --se-edit-outline: var(--_se-main-border);\r\n  --se-edit-font-pre: var(--_mono-rte-text);\r\n  --se-edit-font-quote: var(--_mono-rte-muted);\r\n  --se-edit-background-pre: var(--muted);\r\n  --se-edit-border-light: var(--_se-main-border);\r\n  --se-edit-border-dark: var(--_se-main-border);\r\n  --se-edit-border-dark-n1: var(--_se-main-border);\r\n  --se-edit-border-dark-n2: var(--_se-main-border);\r\n  --se-edit-border-table: var(--_se-main-border);\r\n  --se-edit-hr-color: var(--_se-main-border);\r\n  --se-edit-hr-on-back: var(--_se-active-light);\r\n  --se-edit-anchor-on-back: color-mix(in oklab, var(--_se-active) var(--mono-mode-tint), transparent);\r\n  --se-edit-anchor-on-font: var(--_se-active);\r\n\r\n  --se-success-dark-color: var(--_se-success);\r\n  --se-success-dark2-color: var(--_se-success);\r\n  --se-success-dark3-color: var(--_se-success);\r\n  --se-success-light-color: color-mix(in oklab, var(--_se-success) var(--mono-mode-tint), transparent);\r\n  --se-success-light2-color: color-mix(in oklab, var(--_se-success) var(--mono-mode-tint), transparent);\r\n  --se-success-light3-color: color-mix(in oklab, var(--_se-success) var(--mono-mode-tint-hover), transparent);\r\n  --se-success-light4-color: var(--_se-success);\r\n  --se-success-light5-color: var(--_se-success);\r\n  --se-error-dark-color: var(--_se-error);\r\n  --se-error-dark2-color: var(--_se-error);\r\n  --se-error-dark3-color: var(--_se-error);\r\n  --se-error-light-color: color-mix(in oklab, var(--_se-error) var(--mono-mode-tint-hover), transparent);\r\n  --se-error-light2-color: color-mix(in oklab, var(--_se-error) var(--mono-mode-tint), transparent);\r\n  --se-error-light3-color: color-mix(in oklab, var(--_se-error) var(--mono-mode-tint), transparent);\r\n  --se-error-light4-color: color-mix(in oklab, var(--_se-error) var(--mono-mode-tint), transparent);\r\n  --se-error-light5-color: color-mix(in oklab, var(--_se-error) var(--mono-mode-tint), transparent);\r\n}\r\n\r\n/* In the carrier \"main background\" is the LAYER surface — the dropdown lists,\r\n   dialogs and alerts — so it is the popover surface there, not the editing\r\n   surface (which is transparent in light mode: an invisible list). */\r\n.sun-editor.sun-editor-carrier-wrapper {\r\n  --se-main-background-color: var(--_mono-rte-popover-bg);\r\n  --se-main-font-color: var(--_mono-rte-popover-color);\r\n  --se-dropdown-font-color: var(--_mono-rte-popover-color);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .select:not(select) [role='option'].active, .select:not(select) [role='option']:focus-visible — bg-muted text-foreground\r\n   a checked list item (the current font, size, format …) is a selected option:\r\n   SunEditor only re-inks it, and its ink was the primary tint */\r\n[mono-rte-mount] .sun-editor .se-list-inner li.se-checked > button,\r\n.sun-editor.sun-editor-carrier-wrapper .se-list-inner li.se-checked > button {\r\n  background-color: var(--_se-active-light);\r\n  color: var(--_se-active-ink);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .field > textarea, .textarea — placeholder:text-muted-foreground\r\n   Every placeholder the editor shows — the Size / Font inputs in the toolbar,\r\n   the empty editing area, a dialog's fields — is the field placeholder: the\r\n   muted ink, OPAQUE. Left alone, a host page's preflight (Tailwind / UnoCSS)\r\n   makes a placeholder 50% translucent currentColor, which over a tinted page\r\n   reads as a colour of its own; and SunEditor inks its empty-area placeholder\r\n   with its OUTLINE token, the accent. */\r\n[mono-rte-mount] .sun-editor input::placeholder,\r\n[mono-rte-mount] .sun-editor textarea::placeholder,\r\n.sun-editor.sun-editor-carrier-wrapper input::placeholder,\r\n.sun-editor.sun-editor-carrier-wrapper textarea::placeholder {\r\n  color: var(--_mono-rte-placeholder);\r\n  opacity: 1;\r\n}\r\n[mono-rte-mount] .sun-editor .se-wrapper .se-placeholder,\r\n[mono-rte-mount] .sun-editor .se-wrapper .se-placeholder-line:before {\r\n  color: var(--_mono-rte-placeholder);\r\n}\r\n\r\n/* The frame replaces SunEditor's own — no double border, no second radius. */\r\n[mono-rte-mount] .sun-editor {\r\n  border: 0;\r\n  border-radius: 0;\r\n  background: transparent;\r\n  width: 100% !important;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css [data-tooltip]::before — bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs\r\n   SunEditor's toolbar tooltips, painted as Basecoat's tooltip: it drew them in\r\n   `--se-main-font-color` on `--se-main-background-color`, which in dark mode\r\n   is a translucent wash under near-white text. (0,5,0) over SunEditor's (0,4,0). */\r\n[mono-rte-mount] .sun-editor .se-tooltip .se-tooltip-inner .se-tooltip-text,\r\n.sun-editor.sun-editor-carrier-wrapper .se-tooltip .se-tooltip-inner .se-tooltip-text {\r\n  padding: calc(var(--mono-spacing) * 1.5) calc(var(--mono-spacing) * 3);\r\n  border-radius: var(--_mono-rte-tooltip-radius);\r\n  background-color: var(--_mono-rte-tooltip-bg);\r\n  color: var(--_mono-rte-tooltip-color);\r\n  /* the page font, handed over by the element: a tooltip inside the font list\r\n     would otherwise inherit the item's own face */\r\n  font-family: var(--_mono-rte-page-font, inherit);\r\n  font-size: var(--mono-text-xs);\r\n  line-height: var(--mono-text-xs--lh);\r\n  font-weight: var(--mono-font-weight-normal);\r\n  white-space: nowrap;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css [data-tooltip]::before — the dropdown items (font family,\r\n   font size, the colour palettes …) carried native `title` tooltips, which no theme can\r\n   paint; the element rewrites them into `data-tooltip`, drawn here the way Basecoat\r\n   draws its own: a pseudo-element with the attribute as content, above the item\r\n   (the anchor is `position: relative`, as in Basecoat's compiled `[data-tooltip]`) */\r\n[mono-rte-mount] .sun-editor [data-tooltip],\r\n.sun-editor.sun-editor-carrier-wrapper [data-tooltip] {\r\n  position: relative;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css [data-tooltip]::before — bg-foreground text-background inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs */\r\n[mono-rte-mount] .sun-editor [data-tooltip]::after,\r\n.sun-editor.sun-editor-carrier-wrapper [data-tooltip]::after {\r\n  content: attr(data-tooltip);\r\n  position: absolute;\r\n  left: 50%;\r\n  bottom: calc(100% + calc(var(--mono-spacing) * 1.5));\r\n  z-index: 60;\r\n  width: max-content;\r\n  max-width: 20rem;\r\n  padding: calc(var(--mono-spacing) * 1.5) calc(var(--mono-spacing) * 3);\r\n  border-radius: var(--_mono-rte-tooltip-radius);\r\n  background-color: var(--_mono-rte-tooltip-bg);\r\n  color: var(--_mono-rte-tooltip-color);\r\n  font-family: var(--_mono-rte-page-font, inherit);\r\n  font-size: var(--mono-text-xs);\r\n  line-height: var(--mono-text-xs--lh);\r\n  font-weight: var(--mono-font-weight-normal);\r\n  font-style: normal;\r\n  text-indent: 0;\r\n  text-transform: none;\r\n  letter-spacing: normal;\r\n  white-space: nowrap;\r\n  text-overflow: ellipsis;\r\n  overflow: hidden;\r\n  pointer-events: none;\r\n  visibility: hidden;\r\n  opacity: 0;\r\n  transform: translateX(-50%) scale(0.95);\r\n  transform-origin: bottom center;\r\n  transition-property: opacity, transform, visibility;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration-fast, 100ms);\r\n}\r\n\r\n[mono-rte-mount] .sun-editor [data-tooltip]:hover::after,\r\n[mono-rte-mount] .sun-editor [data-tooltip]:focus-visible::after,\r\n.sun-editor.sun-editor-carrier-wrapper [data-tooltip]:hover::after,\r\n.sun-editor.sun-editor-carrier-wrapper [data-tooltip]:focus-visible::after {\r\n  visibility: visible;\r\n  opacity: 1;\r\n  transform: translateX(-50%) scale(1);\r\n}\r\n\r\n/* a dropdown layer clips its own overflow, so a tooltip above the FIRST row of a\r\n   palette would be cut off at the layer edge: that row opens its tooltips below */\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet:first-child [data-tooltip]::after,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet:first-child [data-tooltip]::after {\r\n  bottom: auto;\r\n  top: calc(100% + calc(var(--mono-spacing) * 1.5));\r\n  transform-origin: top center;\r\n}\r\n\r\n/* SunEditor shrinks a hovered / active swatch with `transform: scale(.8)`. A\r\n   transform makes the button a stacking context, so its tooltip — a child —\r\n   can never rise above the swatches painted after it (the next row covers a\r\n   first-row tooltip) and shrinks with it. The same \"pressed\" read as an inset\r\n   ring of the layer surface instead; the hovered swatch lifts above its row. */\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet button:hover,\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet button.active,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet button:hover,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet button.active {\r\n  transform: none;\r\n  box-shadow: inset 0 0 0 3px var(--_mono-rte-popover-bg, var(--popover));\r\n}\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet button:hover,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet button:hover {\r\n  z-index: 1;\r\n}\r\n\r\n/* …and the same clip sideways: a centred tooltip on the first / last column of\r\n   a palette row runs past the layer's edge, so those hang from the item's own\r\n   outer edge instead */\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet li:first-child [data-tooltip]::after,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet li:first-child [data-tooltip]::after {\r\n  left: 0;\r\n  transform: scale(0.95);\r\n  transform-origin: left center;\r\n}\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet li:last-child [data-tooltip]::after,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet li:last-child [data-tooltip]::after {\r\n  left: auto;\r\n  right: 0;\r\n  transform: scale(0.95);\r\n  transform-origin: right center;\r\n}\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet li:is(:first-child, :last-child) [data-tooltip]:hover::after,\r\n[mono-rte-mount] .sun-editor .se-dropdown .se-color-pallet li:is(:first-child, :last-child) [data-tooltip]:focus-visible::after,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet li:is(:first-child, :last-child) [data-tooltip]:hover::after,\r\n.sun-editor.sun-editor-carrier-wrapper .se-dropdown .se-color-pallet li:is(:first-child, :last-child) [data-tooltip]:focus-visible::after {\r\n  transform: scale(1);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css [data-tooltip][data-arrow]::after — bg-foreground */\r\n[mono-rte-mount] .sun-editor .se-tooltip .se-tooltip-inner .se-tooltip-text:after,\r\n.sun-editor.sun-editor-carrier-wrapper .se-tooltip .se-tooltip-inner .se-tooltip-text:after {\r\n  border-color: transparent transparent var(--_mono-rte-tooltip-bg) transparent;\r\n}\r\n[mono-rte-mount] .sun-editor .se-toolbar.se-toolbar-bottom .se-tooltip .se-tooltip-inner .se-tooltip-text:after {\r\n  border-color: var(--_mono-rte-tooltip-bg) transparent transparent transparent;\r\n}\r\n\r\n/* EXTENSION — the toolbar band, on a hairline */\r\n[mono-rte-mount] .sun-editor .se-toolbar {\r\n  background: var(--_mono-rte-toolbar-bg);\r\n  box-shadow: inset 0 calc(var(--mono-border-width) * -1) 0 0 var(--border);\r\n}\r\n\r\n/* The carrier — modals, alerts and the dropdown lists SunEditor parks on <body>\r\n   — is in the token block and the delivery rule above: it paints exactly like\r\n   the frame it belongs to, at the element's default `color` and `size`. */\r\n\r\n/* =========================================\r\n   SunEditor's dialogs — the modal SunEditor parks in its carrier: its chrome\r\n   is the page's dialog, its fields the ported input, its buttons the ported\r\n   button, its tabs the ported tabs. Selectors mirror SunEditor's own chains\r\n   (prefixed by the scope) so they out-weigh them by exactly the scope.\r\n   ========================================= */\r\n\r\n/* basecoat@1.0.2 styles/vega.css .dialog > * — bg-popover text-popover-foreground */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-content {\r\n  border: var(--mono-border-width) solid var(--_se-main-border);\r\n  border-radius: var(--_mono-rte-popover-radius);\r\n  box-shadow: var(--_mono-rte-popover-shadow);\r\n  color: var(--_mono-rte-popover-color);\r\n}\r\n\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-header .se-modal-title {\r\n  font-size: var(--mono-text-base);\r\n  font-weight: var(--mono-font-weight-semibold);\r\n  color: var(--_mono-rte-popover-color);\r\n}\r\n\r\n/* the close button: a ghost button, muted at rest */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-header .se-close-btn {\r\n  color: var(--_mono-rte-muted);\r\n  text-shadow: none;\r\n  border-radius: var(--mono-radius-sm);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .tabs > [role='tablist'] — the modal's Image / Link tabs:\r\n   a text tab with the accent under the active one, not a boxed strip */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-tabs {\r\n  /* SunEditor floats the tab buttons inside a 25px-high strip; as a flex row the\r\n     strip is as tall as the tabs and stays in flow above the form */\r\n  display: flex;\r\n  align-items: stretch;\r\n  gap: calc(var(--mono-spacing) * 1);\r\n  height: auto;\r\n  margin-bottom: calc(var(--mono-spacing) * 3);\r\n  border-bottom: var(--mono-border-width) solid var(--_se-main-border);\r\n}\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-tabs button {\r\n  background-color: transparent;\r\n  border: 0;\r\n  border-bottom: 2px solid transparent;\r\n  margin-bottom: calc(var(--mono-border-width) * -1);\r\n  padding: calc(var(--mono-spacing) * 1.5) calc(var(--mono-spacing) * 3);\r\n  color: var(--_mono-rte-muted);\r\n  font-size: var(--mono-text-sm);\r\n  font-weight: var(--mono-font-weight-medium);\r\n  transition-property: color, border-color;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-tabs button:hover {\r\n  background-color: transparent;\r\n  color: var(--_mono-rte-text);\r\n}\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-tabs button.active {\r\n  background-color: transparent;\r\n  border-bottom-color: var(--_se-active);\r\n  color: var(--_mono-rte-text);\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .input-group — rounded-md border border-input\r\n   the modal's text fields and selects are the ported input: its surface, edge,\r\n   corner and ring, through the input's own public knobs */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form .se-input-form,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form .se-input-select,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form select,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-controller input[type='text'],\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-controller select {\r\n  background-color: var(--mono-input-bg, var(--mono-input-surface, var(--mono-input-outline-bg, var(--mono-mode-surface))));\r\n  border: var(--mono-border-width) solid var(--mono-input-rest-border, var(--mono-input-border-color, var(--mono-input-outline-border-color, var(--input))));\r\n  border-radius: var(--mono-input-radius-sm, var(--mono-input-outline-radius, var(--mono-input-radius, var(--mono-radius-md))));\r\n  color: var(--_mono-rte-text);\r\n  box-shadow: var(--mono-input-outline-shadow, var(--mono-shadow-xs));\r\n  font-size: var(--mono-text-sm);\r\n  outline: none;\r\n  transition-property: border-color, box-shadow;\r\n  transition-timing-function: var(--mono-ease);\r\n  transition-duration: var(--mono-duration);\r\n}\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form .se-input-form:focus,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form select:focus {\r\n  border-color: var(--_se-active);\r\n  box-shadow: 0 0 0 var(--mono-ring-width) color-mix(in oklab, var(--_se-active) var(--mono-ring-alpha), transparent);\r\n}\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner input:disabled {\r\n  opacity: 0.5;\r\n}\r\n\r\n/* the file drop area: a dashed muted panel */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form .se-flex-input-wrapper > .se-input-form-abs {\r\n  border-radius: var(--mono-input-radius-sm, var(--mono-input-outline-radius, var(--mono-input-radius, var(--mono-radius-md))));\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn — Submit is the primary button */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-btn-primary,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-content .se-btn-primary {\r\n  background-color: var(--mono-button-bg, var(--primary));\r\n  border: var(--mono-border-width) solid transparent;\r\n  border-radius: var(--mono-button-sm-radius, var(--mono-button-radius, var(--mono-radius-md)));\r\n  color: var(--mono-button-color, var(--primary-foreground));\r\n  font-size: var(--mono-text-sm);\r\n  font-weight: var(--mono-font-weight-medium);\r\n  box-shadow: var(--mono-shadow-xs);\r\n}\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-btn-primary:hover,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-btn-primary:focus {\r\n  background-color: color-mix(in oklab, var(--mono-button-bg, var(--primary)) 90%, transparent);\r\n  border-color: transparent;\r\n  color: var(--mono-button-color, var(--primary-foreground));\r\n}\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-btn-primary:disabled {\r\n  opacity: 0.5;\r\n}\r\n\r\n/* basecoat@1.0.2 styles/vega.css .btn[data-variant='outline'] — the modal's secondary buttons */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-btn-revert,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form .se-modal-form-files .se-modal-files-edge-button,\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-modal-area .se-modal-inner .se-modal-form .se-modal-flex-form .se-btn {\r\n  border: var(--mono-border-width) solid var(--input);\r\n  border-radius: var(--mono-button-sm-radius, var(--mono-button-radius, var(--mono-radius-md)));\r\n  background-color: var(--background);\r\n  color: var(--_mono-rte-text);\r\n  opacity: 1;\r\n}\r\n\r\n/* the native checkboxes and radios take the accent */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) input[type='checkbox'],\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) input[type='radio'] {\r\n  accent-color: var(--_se-active);\r\n}\r\n\r\n/* the floating controllers (link / image / table) are popovers */\r\n:is([mono-rte-mount] .sun-editor, .sun-editor.sun-editor-carrier-wrapper) .se-controller {\r\n  border-radius: var(--_mono-rte-popover-radius);\r\n}\r\n\r\n/* Full screen — SunEditor fixes its root over the page (inline style, no class of\r\n   its own; the element marks the mount when SunEditor reports the toggle, and the\r\n   inline style is the fallback). The frame stays behind, so the editor takes the\r\n   PAGE surface itself: opaque, in the mode's colours, the toolbar band on top. */\r\n[mono-rte-mount][mono-fullscreen] .sun-editor,\r\n[mono-rte-mount] .sun-editor[style*=\"position: fixed\"] {\r\n  --_se-main-background: var(--mono-rich-text-editor-fullscreen-bg, var(--background));\r\n  --_mono-rte-toolbar-bg: var(--mono-rich-text-editor-toolbar-bg, color-mix(in oklab, var(--muted) 60%, var(--mono-rich-text-editor-fullscreen-bg, var(--background))));\r\n  background: var(--mono-rich-text-editor-fullscreen-bg, var(--background));\r\n  color: var(--_mono-rte-text);\r\n}\r\n\r\n/* code view: the page's mono face on the editing surface, the line column muted */\r\n[mono-rte-mount] .sun-editor .se-wrapper .se-code-viewer,\r\n[mono-rte-mount] .sun-editor .se-wrapper .se-code-wrapper .se-code-view-line {\r\n  font-family: var(--font-mono, ui-monospace, monospace);\r\n  font-size: var(--mono-text-sm);\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  :where([mono-rich-text-editor]) [mono-rte-field] {\r\n    transition: none;\r\n  }\r\n}\r\n";
//#endregion
//#region src/components/rich-text-editor/mono-rich-text-editor.shadow.ts
var SHADOW_EXTRA_CSS = `
[mono-rte-label][mono-empty],
[mono-rte-message][mono-empty],
[mono-rte-footer][mono-empty] {
  display: none;
}
`;
var MonoRichTextEditorShadow = class MonoRichTextEditorShadow extends withShadowUtilityStyles(MonoRichTextEditorCore(LitElement)) {
	static {
		this.disableWarning?.("change-in-update");
	}
	static {
		this.styles = [unsafeCSS(toShadowCss(rich_text_editor_default, {
			host: "mono-rich-text-editor",
			append: SHADOW_EXTRA_CSS
		}))];
	}
	get _slotsAlwaysRender() {
		return true;
	}
	get _useNativeSlots() {
		return true;
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
		super.updated(changed);
		if (!isServer) this._scanSlots();
	}
	_slotFor(name) {
		return this.renderRoot.querySelector(`slot[name="${name}"]`);
	}
	_slotHasContent(slot) {
		return !!slot && slot.assignedNodes({ flatten: true }).some((n) => n.nodeType === Node.ELEMENT_NODE || !!(n.textContent ?? "").trim());
	}
	_onSlotChange(name, event) {
		this._setSlotState(name, this._slotHasContent(event.target));
	}
	/** Reconcile the 2 slot-presence flags from their slots' assigned content. */
	_scanSlots() {
		for (const name of ["label", "helper"]) {
			const has = this._slotHasContent(this._slotFor(name));
			if (has !== (name === "label" ? this._hasLabelSlotState : this._hasHelperSlotState)) this._setSlotState(name, has);
		}
	}
	/** Native `<slot>` carrying the prop fallback as native slot content. */
	_slotOutlet(name, fallback = nothing) {
		return html`<slot name=${name} @slotchange=${(e) => this._onSlotChange(name, e)}>${fallback}</slot>`;
	}
	/** The frame projects the light-DOM mount the core keeps on the host. */
	_renderEditorOutlet(fieldClass) {
		return html`<div class=${fieldClass} mono-rte-field><slot name="editor"></slot></div>`;
	}
};
MonoRichTextEditorShadow = __decorate([customElement("mono-shadow-rich-text-editor")], MonoRichTextEditorShadow);
//#endregion
export { AUTO_EXCLUDED_PLUGINS, MonoRichTextEditorCore, MonoRichTextEditorShadow, SUNEDITOR_CORE_BUTTONS, SUNEDITOR_LANG_CODES, TOOLBAR_BASIC, TOOLBAR_DEFAULT, TOOLBAR_FULL, TOOLBAR_PRESETS, TOOLBAR_STANDARD, loadSunEditor, loadSunEditorCss, loadSunEditorLang, loadSunEditorPlugins, pruneToolbar, resolvePlugins, resolveToolbar };
