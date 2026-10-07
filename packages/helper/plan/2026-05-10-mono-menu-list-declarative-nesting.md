# `<mono-menu-list>` declarative nesting (any depth, any HTML)

## Context

`<mono-menu-list>` today supports three input modes:

1. `:items.prop="array"` — full recursive list driven by data.
2. `:item.prop="object"` — render exactly one full `MenuItem` (used by Vue `v-for`).
3. Direct attribute mode (`title`, `icon`, `href`, `item-type`, …) — the element synthesises a single `MenuItem` from its props.

What it cannot do is **stack multiple `<mono-menu-list>` elements** to express the menu tree declaratively, e.g.

```html
<mono-menu-list type="group" title="Group 1">
  <mono-menu-list type="group" title="Group 2">
    <mono-menu-list title="Deep item A" href="/a"></mono-menu-list>
  </mono-menu-list>
  <mono-menu-list type="group" title="Group 3"></mono-menu-list>
  <mono-menu-list type="children" title="Menu deep 1"></mono-menu-list>
</mono-menu-list>
```

Right now each nested `<mono-menu-list>` would render its own `<ul>` and the parent's Lit render would clobber the children that the user wrote inside it. The user wants the freedom to nest arbitrarily deep **and** to be able to drop in any other HTML inside a list — so the design must be a true light-DOM slot composition, not a data-only rebuild.

The aim is parity with how `<mono-menu>` already accepts `slot="body"` content: capture children before Lit renders, leave a `data-mono-slot` placeholder in the template, and re-attach them after render.

## Design

### Element behaviour

`<mono-menu-list>` becomes a single recursive primitive. The render output depends on two signals:

| Signal | Effect |
| --- | --- |
| `_parentList = this.parentElement?.closest('mono-menu-list')` | If non-null, render **without** the outer `<ul>` wrap (we are slotted into the parent's body `<ul>`). |
| `type` (extended union) | Selects the rendered shape: `group`, `children`/`item`, `divider`, `subheader`. |

`type` extends to `'children' | 'item' | 'group' | 'divider' | 'subheader'`. `'children'` (existing default) keeps its meaning of "regular menu row" for direct-prop mode. The new `'item'` is an alias for `'children'` because the underlying `MenuItem.type` is `'item'` — both should resolve identically.

Backward-compatibility rule (no breakage to the items-array API):

- If the element has **direct props OR captured child nodes**, `type` is interpreted as `MenuItem.type` (the new declarative meaning).
- If the element has **only** an `items` array (no direct props, no children), `type` retains the old "renderer mode" meaning (`group` ⇒ filter to groups only).

This rule is enforced inside a single helper, so the existing tests/demos that pass `:items.prop="…"` plus `type="group"` keep working unchanged.

### Render shapes

Top-level (no `_parentList`):

```html
<ul class="mono-menu-list">
  <!-- renders the synthesised <li> for the host's own row, OR the items array -->
  <li class="mono-menu-group" data-open="…">
    <button class="mono-menu-group-header">…</button>
    <ul class="mono-menu-list" data-mono-slot="body">
      <!-- captured children are appended here -->
    </ul>
  </li>
</ul>
```

Nested (has `_parentList`):

```html
<!-- mono-menu-list { display: contents } means this <li> is laid out as a direct child of the parent <ul> -->
<li class="mono-menu-group" data-open="…">
  <button class="mono-menu-group-header">…</button>
  <ul class="mono-menu-list" data-mono-slot="body">
    <!-- captured children are appended here -->
  </ul>
</li>
```

For `type="children"` (regular row), the slot target becomes the auto-indent sub-list `<ul class="mono-menu-list" data-mono-slot="body">` already supported by `renderMenuItemRow`. For `divider` / `subheader` no body slot is rendered (these are leaf rows).

`mono-menu-list { display: contents }` is already in `menu.css` line 127 — it makes the host element layout-transparent so the `<li>` it renders flows as a real child of the parent `<ul>`. The existing rail-indent rule `.mono-menu .mono-menu-list .mono-menu-list { padding-left: var(--menu-indent); … }` still applies because the body's `<ul class="mono-menu-list">` is the literal next-level `.mono-menu-list` in DOM order.

### Slot capture

Adopt the pattern already used by `mono-menu._captureSlots` / `_placeBodySlot`:

1. `connectedCallback` captures `this.childNodes` into `_capturedChildren: Node[]` and removes them from the host before the first Lit render. Idempotent guard via `_childrenCaptured` flag.
2. The render template for `group`/`item` includes `<ul class="mono-menu-list" data-mono-slot="body">`.
3. `protected updated()` calls `_placeBodySlot()` which finds `[data-mono-slot="body"]` and appends each captured node (skipping ones already in place).
4. A `MutationObserver` watches `this` for late additions (Vue can append children after the parent's `connectedCallback` in some cases; the observer is the safety net) and re-runs capture-then-place.

When a captured child is itself a `<mono-menu-list>`, it will be inserted into the parent's body `<ul>`. Its own `connectedCallback` fires at that point, finds `_parentList` set, and renders in nested mode. Recursion is unbounded.

### State coordination

- The topmost `<mono-menu>` (if present) remains the source of truth for selection + open-groups.
- `<mono-menu-list>` continues to register with the closest `<mono-menu>` via `_registerListChild`.
- Selection click handlers and group-toggle handlers in nested rendering call `_buildContext()` which already pulls from `_parent` when present.
- `default-open` seeding: each `<mono-menu-list>` already calls `_seedDefaultOpenIntoParent()`. For nested groups whose `<mono-menu-list>` synthesises its own group `MenuItem`, that item enters `_getEffectiveItems()` and gets seeded — so `defaultOpen` works at any depth without further work.
- Standalone (no `<mono-menu>` ancestor): a `_rootList` lookup walks `parentElement?.closest('mono-menu-list')` repeatedly until it lands on the topmost. The topmost owns the `_standaloneOpen` set; nested lists' contexts proxy `isGroupOpen` / `onGroupToggle` to it. This ensures group expand/collapse works in standalone trees.

### Type updates

`menu-types.ts`:

- `MonoMenuListType` becomes `'children' | 'item' | 'group' | 'divider' | 'subheader'`.
- `MenuListProps.type` widens to the new union.
- Add a `Slots` JSDoc note on `MenuListProps` describing the "any HTML inside" capability.

No changes to `MenuItem` or `MenuProps`.

## Files to change

### Library

- `src/components/menu/mono-menu-list.ts` — main work. Add `_parentList`, `_capturedChildren`, `_childrenCaptured`, `_mo`, `_captureChildren()`, `_placeBodySlot()`, MutationObserver wiring. Rewrite `render()` to dispatch on `type` and emit either the wrapping `<ul>` (top-level) or the bare row (nested). Reuse the existing helpers in `menu-render.ts` for the actual row markup (`renderMenuItemRow`, `renderMenuGroup`, `renderMenuDivider`, `renderMenuSubheader`) — they already produce the correct `<li>` structure; the only addition is the `data-mono-slot="body"` placeholder for groups/items.
- `src/components/menu/menu-render.ts` — extend `renderMenuGroup` and `renderMenuItemRow` with an optional `bodySlot?: boolean` flag in `MenuRenderContext` (default `false` to keep current behaviour). When `true`, the function emits an empty `<ul class="mono-menu-list" data-mono-slot="body">` instead of rendering `group.items` / `item.items` from data. The new `<mono-menu-list>` render passes `bodySlot: true`; everything driven by `:items.prop="…"` keeps `bodySlot: false`.
- `src/components/menu/menu-types.ts` — widen `MonoMenuListType`, expose new `type` values in `MenuListProps`. Update the doc comment on `<mono-menu-list>`'s render modes.
- `src/components/menu/menu.css` — likely no change. Verify the indent rail rule still triggers because each body slot is itself a `.mono-menu-list`.
- `src/components/menu/index.ts` — no change (already re-exports types).

### Demos

- `demo/vitepress/docs/demos/menu/vue/nested-elements.vue` — **new**. 3-level declarative tree mixing `type="group"`, default-open, plain rows, `divider`, `subheader`, badges, icons.
- `demo/vitepress/docs/demos/menu/css/nested-elements.vue` — **new**. Self-contained hand-written `.mono-menu` HTML producing the same DOM the declarative form generates.
- `demo/vitepress/docs/manifests/menu.ts` — append a `nested-elements` entry.
- `demo/vitepress/docs/demos/sidebar/vue/with-menu.vue` — replace items-array form with declarative `<mono-menu-list>` form.
- `demo/vitepress/docs/demos/sidebar/css/with-menu.vue` — update static HTML to match the new declarative output.

## Critical files / functions to reuse

- `menu-render.ts:111` `renderMenuItemRow` — emits `<li class="mono-menu-item">` + button/anchor.
- `menu-render.ts:184` `renderMenuGroup` — emits `<li class="mono-menu-group" data-open>` + header + body `<ul>`.
- `menu-render.ts:248` / `:259` `renderMenuDivider` / `renderMenuSubheader`.
- `mono-menu.ts:464` `_captureSlots` / `:524` `_placeBodySlot` — established slot-capture pattern to mirror.
- `mono-menu-list.ts:153` `_normalizeItem` / `:182` `_buildDirectItem` — already produce `MenuItem` from element props; reuse verbatim.
- `menu-utils.ts:62` `collectDefaultOpenGroups` — handles default-open at any tree depth; unchanged.

## Verification

Run from `packages/helper/`:

1. `pnpm dev` (lib watch) and `pnpm dev` in `demo/vitepress` — open `/menu`.
2. **`/menu/#nested-elements`**: 3-level tree renders. Each level shows the `--menu-indent` rail. `defaultOpen` on `Group 1` and `Group 2` makes them expand on first paint. Click `Group 3` header → expands. Click any leaf row → `Active` caption updates with the leaf's id. Vue tab and CSS tab look identical.
3. **Existing `/menu/#groups`, `/menu/#nested`, `/menu/#multiple`, `/menu/#dividers-subheaders`, `/menu/#plain-variant`, `/menu/#customized`** — all still render and behave exactly as before.
4. **`/sidebar/#with-menu`**: the sidebar's body now contains the declarative `<mono-menu-list>` tree. Subheaders / divider / red `NEW` badge all render. Click a row inside a nested group → content title updates. Theme switcher recolors active gradient and badges.
5. **`pnpm build`** (lib) — `dist/menu.js` and `dist/menu.d.ts` emit; type check passes.
6. **`pnpm build`** (vitepress) — all SFCs compile, SSR build succeeds.

## Out of scope

- Per-row slot routing for `prepend` / `append` content. Today only `slot="icon-${id}"` is supported on `<mono-menu>`.
- Keyboard navigation across nested groups (arrow keys, Home/End).
- Auto-collapse-other-groups (`open-strategy="single"` from Vuetify) — composable externally via `mno-toggle-group`.
- Replacing the items-array API. The declarative form is additive; both inputs remain first-class.
