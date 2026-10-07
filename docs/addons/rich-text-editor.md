# Rich Text Editor

A WYSIWYG field built on [SunEditor](https://suneditor.com) v3. `<mono-rich-text-editor>` is a mono **form field** — label, helper and validation chrome, `size` / `color` / `variant`, `monoForm` binding — whose input is a SunEditor instance. The value is HTML.

```ts
import '@mono-lit/helper/ui/rich-text-editor'
```

```vue
<mono-rich-text-editor
  label="Description"
  :model-value="html"
  @change="html = $event.detail.modelValue"
/>
```

::: tip Install
SunEditor is an **optional peer** — it isn't bundled, so nothing pays for it unless a page renders the editor.

```sh
pnpm add suneditor@^3.3.3
```

If it's missing, the element renders an inline message naming the package and the command (and emits `error`) rather than failing silently. The editor's own stylesheet (`suneditor/css/editor`) is loaded by the element the first time one renders; set `load-css="false"` if your app ships it itself.
:::

::: warning Plain JS, not a wrapper
There is no published web-component or Vue build of SunEditor — the "Web Components" example on suneditor.com is a fifteen-line custom element around the core package, and `suneditor-vue` is an empty repository. This element wraps the core `suneditor` package the same way that example does (a light-DOM mount, created on connect and destroyed on disconnect) and adds what it lacks: lazy loading, `v-model` and `monoForm`, the mono chrome and theming.
:::

## Basic

`model-value` is the HTML. `change` fires when SunEditor commits an edit, `input` on every keystroke — both carry the textarea's detail shape (`modelValue`, `oldValue`, `name`). An emptied editor reports `''`, never SunEditor's `<p><br></p>`, so `required` means what it says.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="basic" />
</ClientOnly>

## Toolbar

`toolbar` takes a preset name, a SunEditor `buttonList` (bind with `.prop`), its JSON, or a string of button names where `|` separates groups.

| preset | buttons |
| --- | --- |
| `basic` | undo/redo · bold, underline, italic, strike · bulleted, numbered, link · remove format |
| `standard` (default) | + block style, font, size · font & background colour · align, indent · table, link, image, video · blockquote, code block, hr · code view, full screen |
| `full` | every built-in that needs no configuration |
| `default` | SunEditor's own list — no plugin buttons |

Buttons that name a plugin which is not loaded are dropped from the list rather than rejected, so trimming `plugins` never breaks a preset.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="toolbar" />
</ClientOnly>

## Plugins

Most toolbar buttons are SunEditor **plugins**. `plugins` defaults to `auto`: every built-in that works without configuration, loaded on demand from `suneditor/plugins` as one chunk your bundler owns. Trim it and the download shrinks:

```vue
<script setup>
import { ref, onMounted } from 'vue'
const plugins = ref()
onMounted(async () => {
  const { font, image, link } = await import('suneditor/plugins')
  plugins.value = [font, image, link]
})
</script>

<mono-rich-text-editor v-if="plugins" :plugins.prop="plugins" />
<mono-rich-text-editor plugins="font, link, table" />
<mono-rich-text-editor plugins="none" />
```

::: warning Import plugins on the client
SunEditor's modules read `window` when they are imported, so a **static** `import { font } from 'suneditor/plugins'` in a component that is server-rendered (Nuxt, VitePress) throws before the page exists. Import them from `onMounted` (or a client-only module) as above — or use the **name** form, which mono loads on demand and is server-safe as written.
:::

Left out of `auto` because each needs configuration SunEditor warns about otherwise: `imageGallery` / `videoGallery` / `audioGallery` / `fileGallery` / `fileBrowser` (a server `url`), `fileUpload` (an `uploadUrl`), `template` and `layout` (a list), `math` (KaTeX / MathJax), `exportPDF` (an API). Ask for them by name and pass their options through `options`.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="plugins" />
</ClientOnly>

## Form

Bind it like any other field — `:control-form` and `key-form` — and the controller owns the value, runs the rules and paints the state. `required` fails on an emptied editor; `min` / `max` measure the HTML string.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="form" />
</ClientOnly>

## Modes

`mode` places the toolbar: `classic` (default) above the content, `classic:bottom` below, `inline` / `inline:bottom` shown only while the editor has focus, `balloon` / `balloon-always` floating over the selection.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="modes" />
</ClientOnly>

## Sizes

`size` scales the toolbar, its icons and the editing font off the `--theme-control-font-*` ladder. The height is the editing area's — `height` (default `auto`), `min-height` (default `10rem`) and `max-height` size it; `width` / `min-width` / `max-width` size the field.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="sizes" />
</ClientOnly>

## Colors

Pick a colour and every variant takes it. The frame is the textarea's: `outlined`, `filled`, `underlined`, and `color` retargets the focus ring, the active toolbar state and links inside the content.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="colors" />
</ClientOnly>

## States

`disabled` turns SunEditor's toolbar and editing off; `readonly` shows the content and refuses edits. `error-message` / `success-message` / `validation-state` paint the frame like the other fields. `max-length` caps the character count and shows SunEditor's counter (`char-counter` shows it without a cap).

<ClientOnly>
<DemoSingle name="rich-text-editor" id="states" />
</ClientOnly>

## Language and direction

`language` takes a SunEditor language code (`ko`, `ja`, `zh-CN`, `pt-BR`, …) and loads that pack on demand, or a language object bound with `.prop`. `text-direction="rtl"` flips the content (the host's own `dir` attribute is left to the page).

<ClientOnly>
<DemoSingle name="rich-text-editor" id="lang" />
</ClientOnly>

## Options and the instance

`options` (bind with `.prop`) is SunEditor's `InitOptions`, merged **last** over everything the props produce — upload URLs, counters, whitelists, `events`. A handler under `options.events` runs before mono's own for the same event and can still `return false` to cancel SunEditor's default.

The element exposes the instance and the operations a form usually needs: `editor` (the SunEditor instance, `null` until `ready`), `getHtml()`, `setHtml(html)`, `insertHtml(html)`, `getText()`, `isEmpty()`, `focus()`, `blur()`, `codeView()`, `fullScreen()`. Everything else is on `editor.$` — `editor.$.html`, `editor.$.viewer`, `editor.$.ui`.

<ClientOnly>
<DemoSingle name="rich-text-editor" id="options" />
</ClientOnly>

## Displaying saved HTML

The editor's stylesheet is for the editor. Content shown elsewhere — a detail page, a print view — needs SunEditor's **content** sheet and the `sun-editor-editable` class so tables, alignment and code blocks look as they did when written:

```ts
import 'suneditor/css/contents'
```

```vue
<div class="sun-editor-editable" v-html="html"></div>
```

<ClientOnly>
<DemoSingle name="rich-text-editor" id="content" />
</ClientOnly>

## Theming

The frame **is** the textarea's box: every knob falls back to the matching [`--mono-textarea-*`](../ui/textarea#css-variables) one, so a flavour that retunes the textarea retunes this field (lyra's square, luma's pill, sera's underline) with nothing set. SunEditor's UI is built on `--se-*` custom properties, and the element remaps the ones a theme is made of onto the Basecoat tokens — the focus colour for its active state and links, `--foreground` / `--muted-foreground` for ink, `--border` for hairlines, the mode's hover washes, and the **select panel's popover** (`--mono-select-dropdown-*`) for its dropdowns and the modal layer it parks on `<body>`. Dark mode is the same tokens flipped. Nothing reaches into SunEditor's selectors except to flatten the frame it paints around itself, which the mono frame replaces, and to give the toolbar its muted band.

| variable | default | purpose |
| --- | --- | --- |
| `--mono-rich-text-editor-primary` … `-info` | `--mono-textarea-*` → `--ring`, `--muted-foreground`, `--success`, `--destructive`, `--warning`, `--info` | the accent per `color` — the focus ring, SunEditor's active state and links |
| `--mono-rich-text-editor-text` / `-placeholder` / `-muted` | `--foreground` / `--muted-foreground` / `--muted-foreground` | inks |
| `--mono-rich-text-editor-border` (or `-border-color` / `-rest-border`) | `--mono-textarea-*` → `--input` | the frame edge |
| `--mono-rich-text-editor-bg` (or `-surface`) | `--mono-textarea-*` → `--mono-mode-surface` | the frame and editing surface |
| `--mono-rich-text-editor-shadow` / `-radius` / `-border-width` | `--mono-shadow-xs` / `--mono-radius-md` / `--mono-border-width` | the frame |
| `--mono-rich-text-editor-ring-color` / `-ring-width` / `-ring-alpha` | the `color` hue / `--mono-ring-width` / `--mono-ring-alpha` | the focus ring |
| `--mono-rich-text-editor-outline-*` / `-filled-bg` / `-readonly-bg` / `-disabled-bg` | the textarea's | per-variant and per-state presets |
| `--mono-rich-text-editor-font-size` / `-font-<size>` / `-font-family` / `-icon-size` | `--mono-textarea-font-<size>` → `--mono-text-sm` / inherit / per size | toolbar and content typography |
| `--mono-rich-text-editor-toolbar-bg` | `--muted` 60% on the surface | the toolbar band |
| `--mono-rich-text-editor-fullscreen-bg` | `--background` | the surface SunEditor paints when it goes full screen — its root lifts out of the frame (`position: fixed`, inline), so the editor takes the page surface itself, opaque, in the mode's colours; the mount carries `mono-fullscreen` while it lasts |
| `--mono-rich-text-editor-popover-bg` / `-color` / `-radius` / `-shadow` | `--mono-select-dropdown-*` → `--popover` / `--popover-foreground` / `--mono-radius-md` / `--mono-shadow-md` | SunEditor's dropdowns and dialogs |
| `--mono-rich-text-editor-tooltip-bg` / `-tooltip-color` / `-tooltip-radius` | `--foreground` / `--background` / `--mono-tooltip-radius` → `--mono-radius-md` | every tooltip — the toolbar's, and the dropdown items' (SunEditor gives those native `title`s, which no theme can paint; the element rewrites them into `data-tooltip` + `aria-label`) — as Basecoat's `[data-tooltip]`: bg-foreground text-background text-xs in the page font, at the style's corner (luma / rhea xl, maia 2xl, lyra / sera square) |
| `--mono-rich-text-editor-min-height` | `10rem` | default editing-area height |
| `--mono-rich-text-editor-label-*` / `-message-*` / `-gap` | the textarea's | label and message type, label / field / footer spacing |

Deprecated and honoured as no-ops until 2.0: `--mono-rich-text-editor-focus-rgb`, `--mono-rich-text-editor-background`, `--mono-rich-text-editor-underline-glow` (the underline is sera's line now), and the `--theme-*` bridge — every default reads a Basecoat token.

The editor DOM itself is light DOM in both builds (SunEditor's sheet is global and its modals live on `<body>`, neither of which a shadow root can adopt), so any `--se-*` override you set on an ancestor reaches it directly.

## Server rendering

The chrome (label, frame, messages) renders on the server; the editor is client state and is built on the first client update, exactly like `mono-chart` and `mono-date`. Under `@mono-lit/helper/ui/shadow/rich-text-editor` the frame is Declarative Shadow DOM and the editor mount is projected through `<slot name="editor">`.

## Optional dependency

`suneditor` is declared as an optional `peerDependency` (`^3.3.3`) and loaded with dynamic imports — `suneditor`, `suneditor/plugins`, `suneditor/css/editor`, `suneditor/langs/*` — the first time an element renders. It is **externalized** from the build, so `dist/ui/rich-text-editor.js` stays small and every one of those specifiers resolves against your app's copy, split however your bundler splits them.

## Props

<DemoTypes name="rich-text-editor" />
