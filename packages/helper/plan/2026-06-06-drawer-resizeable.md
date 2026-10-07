# Resizable drawer — drag the inner edge to resize, via `resizeable` prop

## Context

Opt-in `resizeable` boolean prop: a drag handle appears on the panel's inner edge (the edge
facing the page) and dragging it grows/shrinks the drawer. Default off. A drawer is
edge-anchored, so resizing is one axis per position:
- `position-right` → handle on left edge → width
- `position-left` → handle on right edge → width
- `position-top` → handle on bottom edge → height
- `position-bottom` → handle on top edge → height

## Implementation

### `src/components/drawer/mono-drawer.ts`
- Import `query`; `@query('.mono-drawer-panel') _panelEl`.
- `@property({ reflect: true, converter: booleanStringConverter }) resizeable = false` (single
  lowercase word → no hybrid alias, attribute `resizeable`).
- `@state() _resizing`; `_computePortalClasses()` adds `resizeable` (when prop) and `resizing`
  (while active).
- `render()` adds `<div class="mono-drawer-resizer" @pointerdown=${this._onResizeStart}>` inside
  the panel when `resizeable` (placement/cursor from CSS keyed on `.position-*`).
- Pointer handlers (window listeners, mirroring the modal drag impl): capture start pointer +
  current panel rect; on move compute new size from the delta along the position's axis, clamp
  `[200px, viewport]`, set inline `--drawer-width` / `--drawer-height` on the portal; on up clear
  `_resizing`. `_teardownResize()` from `disconnectedCallback`. Resized size persists.

### `src/components/drawer/drawer.css`
- `.mono-drawer-resizer` absolute thin bar, `z-index:2`, `touch-action:none`; per `.position-*`
  placement + `ew-resize`/`ns-resize` cursor + subtle hover tint.
- `.mono-drawer.resizing .mono-drawer-panel { transition: none }`, `.mono-drawer.resizing { user-select: none }`.

### `src/components/drawer/drawer-types.ts`
- `resizeable?: boolean` added to `DrawerProps`.

### Demo — id `resizeable`
- `demos/drawer/vue/resizeable.vue` — a `resizeable` right drawer (+ a bottom one); hint to drag
  the inner edge.
- `demos/drawer/css/resizeable.vue` — raw `.mono-drawer` markup with `.mono-drawer-resizer` + a
  small resize helper in the demo script writing the size var and clamping.
- `ui/drawer.md` — "## Resizable" section + `<DemoSingle name="drawer" id="resizeable" />`.

## Verification
- `npm run build` (package + vitepress) clean; `dist/drawer-*.js` has resize logic,
  `dist/ui/index.css` has `.mono-drawer-resizer` + `.resizing` rules.
- Dev: right drawer resizes width from its left edge (mouse/touch), clamped; bottom drawer
  resizes height from its top edge; non-resizeable has no handle; ✕/Esc/overlay still work;
  Vue + CSS match.
