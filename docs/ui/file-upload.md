# File upload

A drag-and-drop file uploader with previews, validation states and a built-in file list. Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.empty` (the dropzone) and `.item` (the file rows) inside a `.field` (see [Theme](./theme)): a dashed `rounded-lg` drop target padded `p-12` around a muted icon plate, a `text-lg` prompt and a `text-sm/relaxed` hint, over outlined `rounded-md` rows with a ghost icon button to remove each one. Dark mode is built in.

Upstream's empty state is genuinely large, so the default dropzone is **taller than the pre-Basecoat one** — `variant="compact"` is the short one, and `--mono-file-upload-dropzone-padding` moves it in a line.

## Basic

Single-file upload with default styling.

<DemoSingle name="file-upload" id="basic" />

## Compact

Reduced padding via `variant="compact"`.

<DemoSingle name="file-upload" id="compact" />

## Title & subtitle

The dropzone's two text lines are the `title` prop (default *Klik atau seret file ke sini*) and the `subtitle` prop (default *Pilih file untuk diunggah*). The old names `placeholder` and `subtext` are still accepted — as attributes and as properties — and write the same value.

For rich content, pass a `slot="title"` and/or `slot="subtitle"` child: each replaces **one** line, and **a slot beats the prop** of the same line. The whole dropzone opens the file picker, so stop the click on any link you put inside (`@click.stop`).

A `title` attribute is normally the browser's hover tooltip too; the uploader's inner root carries `title=""`, so it never pops up over the field.

The secondary line renders as `[mono-subtitle]` and still carries the old `[mono-subtext]` hook (both are styled); its CSS variables keep their `--mono-file-upload-subtext-*` names. `cssClass.subtitle` (or the old `cssClass.subtext`) adds classes to it.

<DemoSingle name="file-upload" id="slots" />

## Icon

Replace the default 📎 with an iconify class via the `icon` prop (e.g. `icon="i-mdi-cloud-upload"`), or pass a `slot="icon"` child — **the slot wins over the prop**. Use `remove-icon` for the file list's remove button.

<DemoSingle name="file-upload" id="icon" />

## Multiple

Allow multiple files with optional `max-files` / `max-file-size`.

<DemoSingle name="file-upload" id="multiple" />

## Image

Image-only upload with previews.

<DemoSingle name="file-upload" id="image" />

## Validation

Valid, invalid and warning states with messages.

<DemoSingle name="file-upload" id="validation" />

## States

Disabled and required examples.

<DemoSingle name="file-upload" id="states" />

## Preloaded

Initialize the uploader with existing files.

<DemoSingle name="file-upload" id="preloaded" />

## Event log

Live log of `change`, `remove` and `error` events.

<DemoSingle name="file-upload" id="event-log" />

## Customized

Override per-element styling with the `cssClass` prop (Vue) or extra utility classes (CSS).

<DemoSingle name="file-upload" id="customized" />

## CSS Variables

<DemoSingle name="file-upload" id="css-vars" />

Every uploader is themed through `--mono-file-upload-*` custom properties. Setting one on the element, on any wrapper/ancestor, or inline all work — custom properties inherit, and they **pierce the shadow-DOM boundary**, so the same overrides apply to `<mono-file-upload>` and the shadow build. To re-skin globally, set the underlying [tokens](./theme) (`--border`, `--muted`, `--primary`, `--destructive` …) — or switch flavor.

The two variants own **separate** knobs: everything below sizes `default`, and `compact` reads a `--mono-file-upload-compact-*` twin (`-compact-padding`, `-compact-gap`, `-compact-icon-size`, `-compact-icon-glyph-size`, `-compact-icon-offset`, `-compact-title-font-size`, `-compact-title-line-height`, `-compact-list-gap`, `-compact-item-gap`, `-compact-item-padding-x`, `-compact-item-padding-y`, `-compact-file-gap`, `-compact-thumb-size`, `-compact-meta-font-size`) — so restyling one look never repaints the other.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-file-upload-gap` | 3 × `--mono-spacing` | Label ↔ dropzone ↔ list ↔ message |
| `--mono-file-upload-dropzone-padding` / `-dropzone-gap` | 12 × / 2 × `--mono-spacing` | The drop target's padding, and its title ↔ subtext gap |
| `--mono-file-upload-border-color` (alias `-border`) / `-border-width` / `-border-style` | `--border` / `--mono-border-width` / `dashed` | The dashed edge |
| `--mono-file-upload-dropzone-bg` (alias `-background`) / `-dropzone-hover-bg` | transparent / `--mono-mode-ghost-hover` | Drop-target fill, resting and hovered |
| `--mono-file-upload-radius` | `--mono-radius-lg` | Drop-target corner |
| `--mono-file-upload-icon-size` / `-icon-glyph-size` / `-icon-offset` | 10 × / 6 × / 4 × `--mono-spacing` | The icon plate, its glyph, and the space below it |
| `--mono-file-upload-icon-bg` / `-icon-color` / `-icon-radius` | `--muted` / `--foreground` / `--mono-radius-lg` | The icon plate's paint |
| `--mono-file-upload-title-font-size` / `-title-line-height` / `-title-font-weight` / `-title-tracking` / `-title-transform` | `--mono-text-lg` / its lh / medium / `--mono-tracking-tight` / none | The prompt |
| `--mono-file-upload-subtext-font-size` / `-subtext-line-height` / `-subtext-color` | `--mono-text-sm` / `--mono-leading-relaxed` / `--muted-foreground` | The hint (the `subtitle` line — the vars keep the old name) |
| `--mono-file-upload-list-gap` | 2.5 × `--mono-spacing` | Row ↔ row |
| `--mono-file-upload-item-bg` (alias `-surface`) / `-item-border-color` / `-item-border-width` / `-item-radius` | transparent / `--border` / `--mono-border-width` / `--mono-radius-md` | A file row's box |
| `--mono-file-upload-item-gap` / `-item-padding-x` / `-item-padding-y` / `-item-font-size` / `-file-gap` | 2.5 × / 3 × / 2.5 × / `--mono-text-sm` / 1 × `--mono-spacing` | A file row's metrics |
| `--mono-file-upload-thumb-size` / `-thumb-radius` / `-thumb-bg` / `-thumb-color` | 8 × `--mono-spacing` / `--mono-radius-sm` / `--muted` / `--muted-foreground` | The preview square |
| `--mono-file-upload-name-*` / `-meta-*` | `--mono-text-sm` medium / `--mono-text-sm` muted | File name and size type |
| `--mono-file-upload-remove-size` / `-remove-radius` | 8 × `--mono-spacing` / `min(--mono-radius-md, 10px)` | The remove button (a ghost icon button) |
| `--mono-file-upload-message-font-size` / `-message-line-height` / `-message-color` | `--mono-text-sm` / `--mono-leading-normal` / `--muted-foreground` | Helper and validation text |
| `--mono-file-upload-label-*` / `-required-color` | `--mono-text-sm` medium / `--destructive` | The label row |
| `--mono-file-upload-ring-color` / `-ring-width` / `-ring-alpha` | `--ring` / `--mono-ring-width` / `--mono-ring-alpha` | The drag-over and focus rings |
| `--mono-file-upload-primary` / `-success` / `-danger` / `-warning` / `-text` / `-muted` | `--primary` / `--success` / `--destructive` / `--warning` / `--foreground` / `--muted-foreground` | The roles |

Deprecated and honoured as no-ops until 2.0: every `--mono-file-upload-*-rgb` (use `color-mix`). `--mono-file-upload-border`, `-background` and `-surface` still work as the fallbacks noted above.

## Types

<DemoTypes name="file-upload" />
