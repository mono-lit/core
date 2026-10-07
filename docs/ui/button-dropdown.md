<!-- @unocss-includes -->

# Button dropdown

A row of actions that stays flat while it's short and collapses behind a `⋮` menu once it isn't. `<mono-button-dropdown :buttons.prop="actions" :min="1">` — button plus dropdown in one element.

The menu is Basecoat's `.dropdown-menu` (see [Theme](./theme)): a `bg-popover` panel with a `ring-1 ring-foreground/10` edge, `rounded-md`, `shadow-md` and `p-1`, holding `rounded-sm` rows that wash `bg-accent` under the pointer. Dark mode is built in.

```ts
import '@mono-lit/helper/ui/button-dropdown'

const actions = [
  { label: 'Save', icon: 'i-mdi-content-save', color: 'primary', onClick: save },
  { label: 'Delete', icon: 'i-mdi-delete', color: 'danger', variant: 'outline', onClick: remove },
]
```

```vue
<mono-button-dropdown :buttons.prop="actions" :min="1" />
```

`buttons` and `trigger` are objects, so bind them with `.prop` — a plain attribute would only carry a stringified value.

## How `min` decides

`min` is how many entries may render **inline**. It's all-or-nothing: while `buttons.length <= min` every entry is a plain button; past that they **all** move into the dropdown and only the trigger is left.

| `min` | `buttons` | renders |
| --- | --- | --- |
| `1` | 1 | that button, directly |
| `1` | 3 | `⋮` → the three in a menu |
| `3` | 3 | all three inline |

<ClientOnly>
<DemoSingle name="button-dropdown" id="basic" />
</ClientOnly>

## Entries are real buttons

Each entry is rendered as an actual `<mono-button>`, so **every** button prop keeps working — `variant`, `color`, `size`, `disabled`, `badge`, `icon-position`, and the behavioural ones like `loading`, `throttle` / `debounce` and `handler`. Nothing is re-implemented, so a prop added to the button later works here for free.

On top of `ButtonProps`, an entry takes `label`, `icon` and `onClick`.

<ClientOnly>
<DemoSingle name="button-dropdown" id="trigger" />
</ClientOnly>

## Entries look different inside the menu

A dropdown of solid, outlined and tonal buttons in assorted colours reads as noise rather than a list. So **inside the menu** every row is the same flat, borderless strip — no fill, no border, no shadow, no press "twitch", just Basecoat's `rounded-sm` corner and a `bg-accent` wash under the pointer. The moment the list is short enough to render **inline**, each entry goes back to its real button styling: fills, outlines, radius, press effect and all.

The flattening is done with the button's own public custom properties (`--mono-button-bg`, `-hover-bg`, `-width`, `-justify`, …) set on the `<li mono-item>`, not with a selector — a custom property is the only thing that also reaches the control in the shadow build, so both builds flatten identically.

The `⋮` trigger is styled separately, with `color` / `variant` / `size` / `rounded` on the element itself (or the long form through `trigger`).

## Entry colours

An entry's `color` is **not** a button colour inside the menu. It is Basecoat's `[data-variant='destructive']` menu-item treatment generalised to all ten roles: the row's **ink** — label and icon alike — becomes the role, and hovering lays that same colour down as a **10% wash** (20% in dark mode, via `--mono-mode-tint`).

That is deliberate, not cosmetic: a solid role fill under a role-coloured glyph is exactly the combination that makes the glyph disappear — a green check on a green row. A wash keeps the ink at full strength against its own background at every size, in both modes.

`secondary`, `light` and `dark` are surfaces rather than hues — upstream they are fills paired with a `-foreground`, and `--dark` stays a dark grey in dark mode — so a row takes their **foreground** as ink and hovers on the neutral `--accent` wash, like an uncoloured row.

<ClientOnly>
<DemoSingle name="button-dropdown" id="colors" />
</ClientOnly>

## Props

| Prop | Purpose |
| --- | --- |
| `buttons` | The actions. Each entry takes every `<mono-button>` prop plus `label` / `icon` / `onClick`, and the button's other events as `on<Event>` keys (`onLoadingChange`, …) attached as listeners. Bind with `.prop`. |
| `min` | How many entries may render inline (default `1`). |
| `color` / `variant` / `size` / `rounded` | Style the `⋮` trigger. An entry's own `color` becomes its row's ink in the menu — see [Entry colours](#entry-colours). |
| `trigger` | `ButtonProps` for the `⋮` button — size, variant, a different `icon`, or a `label` to make it a normal labelled button. Its events are accepted as `on<Event>` keys too. |
| `placement` | Where the panel opens (default `bottom-end`). |
| `offset` | Gap in px between trigger and panel (default `4`). |
| `model-value` | Open state. Listen for `open` / `close` to mirror it. |
| `close-on-select` | Close when an entry is clicked (default `true`). |
| `close-on-outside-click` / `close-on-escape` | Both default `true`. |
| `disabled` | Disables the trigger and every entry. |

`click` fires with `{ item, index, collapsed }` **in addition to** the entry's own `onClick`, so you can handle actions per-item or centrally.

::: tip Keyboard
`↑` / `↓` move between menu rows, `Enter` activates, `Esc` closes and returns focus to the trigger.
:::

Both demos also run under **Vue + Shadow DOM** — same behaviour, icons included.

## CSS Variables

The menu is themed through `--mono-button-dropdown-*` custom properties. Setting one on the element, on any ancestor, or inline all work — custom properties inherit and they **pierce the shadow-DOM boundary**. To re-skin globally, set the underlying [tokens](./theme) (`--popover`, `--accent`, `--destructive` …) or switch flavor.

| Variable | Default | Controls |
| --- | --- | --- |
| `--mono-button-dropdown-bg` (alias `-surface`) / `-text` | `--popover` / `--popover-foreground` | The panel's fill and ink |
| `-ring-width` / `-ring-color` (alias `-border`) | `--mono-border-width` / `--foreground`/10 | The `ring-1` edge |
| `-shadow` | `--mono-shadow-md` | The panel's elevation |
| `-radius` / `-radius-<size>` | `--mono-radius-md` at md | Panel corner |
| `-padding` / `-padding-<size>` | `--mono-spacing` (4px) at md | Panel padding (`p-1`) |
| `-min-width` / `-min-width-<size>` | `9rem` at md | Panel width floor (upstream anchors it to the trigger; here it is a length) |
| `-offset` / `-offset-<size>` | `--mono-spacing` (4px) | Static gap between trigger and panel — keep in step with the `offset` prop |
| `-list-gap` | `0` | Gap between rows (`gap-0`) |
| `-gap` | 1.5 × `--mono-spacing` | Gap between the **inline** buttons, before they collapse |
| `-item-color` / `-item-hover-bg` / `-item-hover-color` | — | A row's ink, hover wash and hover ink, **overriding an entry's `color`**. Set these to paint every row the same whatever role it carries |
| `-item-base-color` / `-item-base-hover-bg` (alias `-item-hover`) / `-item-base-hover-color` | `--popover-foreground` / `--accent` / `--accent-foreground` | The same three for an **uncoloured** row only — the tier a flavor writes, leaving the ten roles intact |
| `-item-radius` / `-item-radius-<size>` | `--mono-radius-sm` | Row corner (`rounded-sm`) |
| `-item-font-weight` | `--mono-font-weight-medium` | Row label weight |
| `-<role>` | the role token | The ten entry roles (`-success`, `-danger`, …) that `mono-item-color` selects |

A row is a real button, so the button's own knobs apply inside the menu as well — `--mono-button-width`, `--mono-button-justify` and `--mono-button-press-translate` are what this component sets to turn one into a full-width, start-aligned, twitch-free strip.

## Types

<DemoTypes name="button-dropdown" />
