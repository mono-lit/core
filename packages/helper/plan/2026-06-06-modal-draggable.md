# Draggable modal — move by the header, clamp inside the viewport on drop

## Context

After stacking, users want to move a modal aside (by its header) to see the modal/content
beneath it. Added an opt-in `draggable` prop: when set, the modal is dragged by its header.
During the drag the panel follows the pointer freely and may go past the screen edges, but
**on drop it snaps instantly back so the whole panel sits inside the viewport** ("the
maximum location is the inner window"). Default off — existing modals unchanged.

## Implementation

### `src/components/modal/mono-modal.ts`
- `@property({ reflect: true, converter: booleanStringConverter }) draggable = false`. Single
  lowercase word → not added to `defineHybridPropAliases` (would self-recurse); attribute is
  `draggable`.
- `@state() _dragging`; `_computePortalClasses()` adds `draggable` (when prop) and `dragging`
  (when active). `@query('.mono-modal-panel') _panelEl`.
- Offset stored in non-reactive `_dragX/_dragY`, applied imperatively as `--drag-x/--drag-y`
  on the panel (no Lit re-render during move). Drag math from `_dragStart*` / `_dragOrigin*`.
- `_renderHead()` adds `@pointerdown=${this._onHeaderPointerDown}` to `.mono-modal-head` in
  both branches. Pointerdown bails unless `draggable`, left button, not `_isFullscreen`, and
  not on `.mono-modal-close`; then captures and attaches `pointermove` + one-shot `pointerup`
  on `window` (drag continues past edges).
- `_onPointerUp` → `_clampIntoViewport()` (runs while `dragging` class still suppresses the
  transition → instant snap) then clears `_dragging`. Clamp keeps `left≥0,top≥0,
  right≤innerWidth,bottom≤innerHeight` (pins top-left if larger than viewport).
- Offset reset to 0 on open (`willUpdate`, modelValue→true). Listeners cleaned in
  `disconnectedCallback` and on pointerup.

### `src/components/modal/modal.css`
- Drag offset composed into BOTH panel transforms:
  `transform: translate(var(--drag-x,0px), var(--drag-y,0px)) translateY(…) scale(…)` so the
  open/close animation still works.
- `.mono-modal.dragging .mono-modal-panel { transition: none }` (instant follow + instant
  snap). `.draggable .mono-modal-head { cursor: grab; touch-action: none; user-select: none }`,
  `.dragging .mono-modal-head { cursor: grabbing }`, `.draggable .mono-modal-close { cursor: pointer }`.

### `src/components/modal/modal-types.ts`
- `draggable?: boolean` added to `ModalProps`.

### Demo — id `draggable`
- `demos/modal/vue/draggable.vue` — a draggable modal that opens a second draggable modal;
  drag the top by its header to reveal the one behind; drag past an edge → snaps back on drop.
- `demos/modal/css/draggable.vue` — raw `.mono-modal` markup + a small drag helper in the
  demo script (drag is inherently JS) writing `--drag-x/--drag-y` and clamping on pointerup.
- `ui/modal.md` — "## Draggable" section + `<DemoSingle name="modal" id="draggable" />`.

## Verification
- `npm run build` (package + vitepress) clean.
- Dev: drag by header (mouse/touch); release off-screen → snaps fully inside; stacked top
  drags aside to reveal the modal behind; ✕/Escape/overlay still work; non-draggable modal
  can't be moved; Vue + CSS match.
