# Modal

A centered overlay dialog with header / title / subtitle / body / footer slots, six content sizes, ten theme colours, and a `modelValue` binding contract that matches drawer / popover / toast. Renders into a body portal to escape transformed ancestors and stays fully invisible while closed (no shadow halo bleed). Toggle **Vue / CSS** to switch the live demo and source together.

The look is Basecoat's `.dialog` (see [Theme](./theme)): **one padded box** — the panel carries `p-6` and `gap-6` and the header / body / footer are unpadded, unbordered, untinted regions inside it — on `bg-popover` with a `ring-1 ring-foreground/10` edge and `rounded-xl`, over a `bg-black/10 backdrop-blur-xs` scrim. The tinted gradient header bar, the tinted footer and both divider rules are **gone**; `--mono-modal-header-bg` / `-footer-bg` (+ the matching `-border` / `-border-width` / `-pad`) put them back. Dark mode is built in.

## Basic

Simple modal with a title, a `subtitle` (the muted description line under it — hidden when empty), a body, and the close button.

<DemoSingle name="modal" id="basic" />

## Header & footer slots

The header is a row: a **heading column** (title over subtitle) and the close ✕ beside it. The slots are:

| Slot | Alias | Renders |
| --- | --- | --- |
| `header` | `head` | Replaces the whole heading column — title **and** subtitle. Beats the `title` / `subtitle` slots and props. The ✕ stays |
| `title` | — | Replaces the title line (beats the `title` prop) |
| `subtitle` | — | Replaces the subtitle line (beats the `subtitle` prop) |
| `body` | *(default slot)* | Main content — unslotted children land here |
| `footer` | `foot` | Action row under the body |

`header` and `footer` are the preferred names and match `mono-drawer`, which has the same header model. The original `head` and `foot` still work, so existing markup keeps rendering. If you supply **both** spellings for the same region, **the alias wins** (`header` beats `head`) and the other is ignored. The header shows whenever there is a title, a subtitle, a `header` slot or the ✕.

::: warning Changed
`slot="header"` / `slot="head"` used to replace the **entire** header row, close ✕ included. It now replaces only the title + subtitle column and the ✕ stays, matching the drawer. Use `:dismissible="false"` to drop the ✕ (that also disables dismissal), and remove a hand-rolled close button from your header content if you had one.
:::

<DemoSingle name="modal" id="slots" />

## Sizes

`size` sets the **content scale** — header/title type, body type, padding, the close button and the corner radius — across `xs`, `sm`, `md` (default), `lg`, `xl` and `xxl`. It does **not** change the panel width: every panel in the demo below is the same width. Use [`width`](#width-height) for that — it takes the same `xs`…`xxl` tokens, so `size="sm" width="xl"` gives you a compact, wide dialog.

::: warning Changed
`size` used to be a width preset (`sm` 380px … `xl` 880px) and did nothing to the type scale. Panels that relied on `size` for their measure should now pass `width` instead.
:::

<DemoSingle name="modal" id="sizes" />

## Width & height

For full control, set `width`, `height`, `min-width`, `max-width`, `min-height` or `max-height` directly. Each accepts:

- a **preset token** — `xs`, `sm`, `md`, `lg`, `xl`, `xxl` (see below);
- a CSS string — `"760px"`, `"12rem"`, `"80%"`;
- a number, treated as `px` — `:width="480"` → `480px`.

Both kebab-case (`min-width`) and camelCase (`minWidth`) work. Set **both** `width` and `height` to `"100%"` for true full screen.

### Dimension presets

`width="lg"` is shorthand for a stock measure, so you rarely have to pick pixel values. Widths carry the same viewport clamp as the default, so no preset can overflow a phone; heights are viewport-relative and match the [drawer's ladder](./drawer#width-height).

| token | `width` / `min-width` / `max-width` | `height` / `min-height` / `max-height` |
| --- | --- | --- |
| `xs` | `min(90vw, 300px)` | `22vh` |
| `sm` | `min(90vw, 380px)` | `30vh` |
| `md` | `min(90vw, 520px)` — the default width | `50vh` |
| `lg` | `min(90vw, 680px)` | `70vh` |
| `xl` | `min(95vw, 880px)` | `85vh` |
| `xxl` | `min(95vw, 1080px)` | `95vh` |

These tokens are spelled the same as [`size`](#sizes) but are a **different axis**: `size` scales the content, these name a measure. Mixing them is the point — `<mono-modal size="sm" width="xl">` is a compact, wide dialog.

<DemoSingle name="modal" id="dimensions" />

## Auto full-screen

Set `auto-fullscreen` and the modal fills the screen on small viewports. It defaults to `sm` (under 640px); pass `md`, `lg`, `xl` or `2xl` to move the boundary. Any authored `width` / `height` is overridden while it applies and restored above it.

<ClientOnly>
<DemoSingle name="modal" id="auto-fullscreen" />
</ClientOnly>

## Scroll lock

While open, a modal locks page scroll — `lock-scroll`, default `true`. Opt out with `:lock-scroll="false"` when the page behind should stay scrollable.

```vue
<mono-modal v-model="open" :lock-scroll="false" />
```

The lock is shared, not per-instance: overlapping overlays (a modal opened from a drawer, stacked modals, a sidebar) all draw on one lock, so scroll is released only when the **last** one that wanted it closes. `mono-sidebar` takes the same prop.

It is the document **root** that gets `overflow: hidden` (the body too, but that is not the part
that matters). The body's overflow only reaches the viewport while the root's computed overflow is
`visible` — CSS Overflow §3.5 — so any reset that gives `html` an overflow of its own cancels the
propagation and a body-only lock does nothing at all. Vuetify's reset ships
`html { overflow-y: scroll }`; ress and sanitize.css do the same. Locking the root is immune to it.

The declaration is written `!important` on the element itself, because a normal inline style loses
to a stylesheet that claims the root's overflow with `!important` — and apps do that: Vuetify's own
scroll block is `.v-overlay-scroll-blocked:not(html) { overflow-y: hidden !important }`, and a
layout that drives `<html class>` (`.overflow-auto { overflow: auto !important }`) pins it for the
life of the page. That failure is silent in the worst way: `documentElement.style.overflow` reads
`"hidden"`, so every style assertion passes while the page keeps scrolling, because the *computed*
value never changed. An important declaration in the style attribute outranks an important one from
a selector, so it cannot be out-cascaded. Whatever was there before — value and priority — is put
back exactly on close.

The scrollbar goes away with it, and its width is handed back to the body as `padding-right` so
nothing shifts sideways — measured first, because a system with overlay scrollbars has no width to
give back and compensating there would itself be the shift. Deliberately not
`scrollbar-gutter: stable`, which reserves the space in one declaration but leaves Chrome painting
the empty scrollbar track: the page then still looks like it has a scrollbar, which is usually the
whole complaint.

::: warning iOS
`overflow: hidden` does not stop touch scrolling in iOS Safari. Locking there needs
`position: fixed` plus scroll-position save/restore, which brings its own problems (lost position,
focus jumps), so the modal does not attempt it.
:::


## Stacked

Set `stackable` to let modals stack — open a modal from inside another, any depth. Each new modal sits above the previous, only one backdrop dims the screen (a stacked one with `overlay="false"` leaves the dim of the one beneath it in place), and <kbd>Esc</kbd> / overlay-click affect only the topmost. Without `stackable` a modal is **exclusive**: opening one closes any other open modal.

<DemoSingle name="modal" id="stacked" />

## Z-index

By default the modal takes its stacking level from mono's shared popup stack, so the newest layer is always on top. Set `z-index` to pin it instead — for sitting above (or below) something the host app already positions, like a sticky header or a third-party widget. Accepts `z-index="1500"`, `:z-index="1500"` and `:zIndex="1500"`.

The value is the level of the **whole dialog**: `.mono-modal` is `position: fixed` and carries the `z-index`, so it forms a stacking context and the panel's internal `+1` only orders it against its own overlay. Anything outside the modal has to clear the value itself.

Popups opened *inside* a pinned modal — a `mono-select`, a `mono-button-dropdown`, a table menu — stack above it automatically: the shared stack resumes its chain from the pinned level rather than from its base. The lower-level `--mono-modal-z` CSS variable does **not** get that treatment; set it and you own the whole chain.

<DemoSingle name="modal" id="z-index" />

## Draggable

Set `draggable` to let users move the modal by its header — handy with stacked modals to slide the top one aside and see what's behind. The panel follows the pointer freely while dragging, but snaps back fully inside the viewport when you drop it.

<DemoSingle name="modal" id="draggable" />

## Colors

Pick a colour, then open the modal: the panel's thin ring and a faint glow under it take the colour, as do the close-button hover and a restored bar — it re-paints live, so re-pick while it is open. Without `color` the ring stays neutral and there is no glow.

<DemoSingle name="modal" id="colors" />

## Confirmation

Cancel + Confirm footer that triggers a status update.

<DemoSingle name="modal" id="confirmation" />

## Form

Modal containing an input + submit button.

<DemoSingle name="modal" id="with-form" />

## Controller

`controlMonoModal()` (also exported as `monoModal`) drives a modal from code, the way `controlMonoForm` drives a form. Bind it with `:control-modal.prop` and the modal takes its `props` — they win over the same attribute on the element — and answers `open()` / `close()` / `toggle()` through its own `show()` / `hide()`, so `open` / `close` still fire. `isOpen` follows the screen: a ✕, overlay or Escape close is reported back. `setProps()` merges into the live props and `subscribe()` hears every change.

```ts
import '@mono-lit/helper/ui/modal'
import { controlMonoModal } from '@mono-lit/helper'

const modal = controlMonoModal({ props: { title: 'Detail', size: 'sm', width: 'lg' } })
```

```vue
<mono-modal :control-modal.prop="modal">…</mono-modal>
<mono-button @click="modal.open()">Open</mono-button>
```

The modal's events go in `props` too, as `on<Event>` keys — `onOpen`, `onClose`, `onToggle` — attached to every bound `<mono-modal>` as listeners with the same event a template `@close` would get (`event.detail.source` says whether it was the ✕, the overlay, Escape or code). A template listener still fires beside them.

```ts
const modal = controlMonoModal({
  props: { title: 'Detail', onClose: (event) => audit(event.detail.source) },
})
```

<DemoSingle name="modal" id="controller" />

## Dialog

The controller also owns a **dialog**: a compact question the user has to answer. `modal.dialog.show()` builds a small `<mono-modal>` by code — `size="xs"`, hugging its text, the actions centred under it — opens it and returns a promise. It cannot be dismissed: no ✕, no overlay click, no Escape. The only way out is a button that answers (or `dialog.close()` from code), because a question left unanswered is the bug this exists to prevent.

```ts
const modal = controlMonoModal({
  dialog: {
    title: 'Lock Budget Reminder',
    subtitle: 'Budget 2025',   // optional muted line under the title
    body: 'Sudah selesai meng-input budget?<br/>Pastikan sudah lock sebelum menambahkan program.',
    buttons: [
      { label: 'Ya, lanjut', color: 'success', value: true },
      { label: 'Belum, tetap di sini', variant: 'outline', color: 'secondary', value: false },
    ],
  },
})

const ok = await modal.dialog.show()   // true — the 'Ya' button answered
```

`body` is rendered as HTML (or pass a Node). Each entry of `buttons` is a `<mono-button>` — every button prop works — (`size` defaults to `xs`) plus `label`, `icon` and the answer. A button's **`value`** is its answer: pressing it closes the dialog and resolves `show()` with that value. A button **without** one runs `onClick` and leaves the dialog open (a "show details" link, say). `onClick(event, { dialog, button })` is the button's work: `dialog` is the dialog controller (`close()`, `isOpen`, `element`) and `button` is the `<mono-button>` pressed. Return a promise and the button shows its spinner (and a `value` close waits) until it settles; a rejection keeps the dialog open.

That gives two ways to write a dialog, and which one depends on **where the decision lives**. When the code after `await show()` decides, use `value` — it is the only channel back to that code (the example above). When the button itself does the work, there is nothing to report: do it in `onClick` and close with a bare `dialog.close()`:

```ts
buttons: [
  { label: 'Lihat detail', variant: 'text', onClick: () => openDetails() },   // no close → stays open
  { label: 'Hapus', color: 'danger', onClick: async (_e, { dialog }) => {
      await api.remove(id)                                                      // spinner on; a throw keeps it open
      dialog.close()
  } },
  { label: 'Batal', variant: 'tonal', color: 'secondary', onClick: (_e, { dialog }) => dialog.close() },
]
await modal.dialog.show()   // nothing to check — the buttons already did the work
```

The first button is focused on open (`focus` picks another, or `'none'`). `show(override)` merges one-off options over the ones the controller was created with; `dialog.setProps()` changes them for good; `dialog.props` reaches the dialog's own modal (`color`, `width`, `zIndex`, …) but never its locks. A dialog is `stackable`, so it sits over whatever modal is already open, `draggable` by its header, and dims the page only lightly with no blur — what it asks about stays readable behind it.

<DemoSingle name="modal" id="dialog" />

## Persistent

Overlay-click and Escape do not close — only the buttons or the ✕ work.

<DemoSingle name="modal" id="persistent" />

## No overlay

Page behind stays interactive. A click outside the panel still closes the modal (`close-on-overlay`, on by default — the page is the outside) and the click goes through to the page; `:close-on-overlay="false"` keeps it open.

<DemoSingle name="modal" id="no-overlay" />

## Event log

The modal emits `toggle` on every state change, plus `open` (on open) and `close` (on close) — matching the drawer. Each event's `detail.source` (`overlay` / `close` / `escape` / `manual`) says what triggered it. The log below shows the close events and their source.

<DemoSingle name="modal" id="event-log" />

## Customized

Override per-element styling with `cssClass` (Vue) or utility classes (CSS).

<DemoSingle name="modal" id="customized" />

## CSS Variables

<DemoSingle name="modal" id="css-vars" />

Every modal is themed through `--mono-modal-*` custom properties. Because the dialog renders through a `<body>` portal, `--mono-modal-*` set **inline on the `<mono-modal>` element are forwarded to the portal** (so per-instance theming works); you can also set them on `:root` to theme every modal, and they **pierce the shadow-DOM boundary** for the shadow build. The `size` and `color` props set presets, but an explicit `--mono-modal-*` override always wins. To re-skin globally, set the underlying [tokens](./theme) (`--popover`, `--border`, `--mono-mode-backdrop` …) or switch flavor. Scroll areas use the shared [`--mono-scrollbar-*`](./theme#scrollbar) tokens.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-modal-bg` (alias `-surface`) / `-text` | `--popover` / `--popover-foreground` | The panel's fill and ink |
| `--mono-modal-ring-color` / `-ring-width` | `--foreground`/10 / `--mono-border-width` | The `ring-1` edge |
| `--mono-modal-shadow` | `--mono-shadow-lg` | The panel's elevation |
| `--mono-modal-accent-ring` / `--mono-modal-glow` | accent 35% on `--border` / a 24px halo of the accent at 45% | Only while `color` is set: the ring becomes a thin line of the colour and a faint glow of it sits under the elevation |
| `--mono-modal-radius` / `-radius-<size>` | `--mono-radius-xl` at md | Panel corner |
| `--mono-modal-pad-<size>` / `-gap-<size>` | 6 × `--mono-spacing` at md (`p-6 gap-6`) | The panel's padding, and the gap between header / body / footer |
| `--mono-modal-width` | `--mono-container-md` (upstream's `sm:max-w-md`), capped at `100% - 2rem` | Panel width — **not** set by `size`; use the `width` prop (a length, or an `xs`…`xxl` token) |
| `--mono-modal-title-font-<size>` / `-title-weight` / `-title-color` | `--mono-text-sm` / medium / the panel ink | The title. Four of the eight flavors bump it to `text-base` and sera to `text-lg` |
| `--mono-modal-subtitle-font` / `-subtitle-color` / `-subtitle-line-height` | the body font (`--mono-text-sm` at md) / `--muted-foreground` / `--mono-leading-normal` | The subtitle — Basecoat's dialog description (`text-muted-foreground text-sm leading-normal`) |
| `--mono-modal-body-font-<size>` / `-body-line-height` | `--mono-text-sm` at md | The body |
| `--mono-modal-header-gap-<size>` / `-footer-gap-<size>` | 2 × `--mono-spacing` (`gap-2`) | Inside the header row and the footer row |
| `--mono-modal-heading-gap` | the header gap | Between the title and the subtitle |
| `--mono-modal-header-bg` (alias `-head-bg`) / `-header-border` / `-header-border-width` / `-header-pad` | transparent / transparent / `0` / `0` | The header BAR — off, because upstream has none. Set the four to bring the pre-port bar back |
| `--mono-modal-footer-bg` / `-footer-border` / `-footer-border-width` / `-footer-pad` / `-footer-margin` / `-footer-radius` | all off | The footer bar. nova's flavor is exactly this: `bg-muted/50`, a top rule, `p-4` and a negative margin so it bleeds to the panel's edge |
| `--mono-modal-close-size-<size>` / `-close-glyph` / `-close-bg` / `-close-color` / `-close-opacity` / `-close-hover-opacity` / `-close-hover-bg` | 7 × `--mono-spacing` / `size-4` / transparent / the panel ink / `0.7` / `1` / transparent | The ✕. luma, sera and rhea give it a `bg-secondary` resting fill |
| `--mono-modal-overlay-bg` / `-overlay-backdrop-filter` | `--mono-mode-backdrop` (`black/10`) / `blur(--mono-blur-xs)` | The scrim |
| `--mono-modal-accent` / `-<role>` | `--primary` / the ten roles | The colour a restored bar, the ✕ hover and the ring tint draw from (set by `color`) |
| `--mono-modal-duration` | `--mono-duration-slow` | Open/close animation; `0s` for an instant modal |
| `--mono-modal-z` | `600` | Base z-index (the popup stack overwrites this per level; prefer the `z-index` prop, and note an inline var still wins over it) |

## Types

`controlMonoModal` is also exported as `monoModal`, and `:control-modal` is also accepted as `:data-modal`.

<DemoTypes name="modal" />
