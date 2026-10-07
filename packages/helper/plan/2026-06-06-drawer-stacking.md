# Stackable drawers — open a drawer from inside a drawer (same as modal)

## Context

Modal got automatic stacking; drawer is structurally identical to the pre-stacking modal
(same body-portal pattern, same per-instance Escape listener + scroll lock) and had the
same single-at-a-time limitations: Escape closed every open drawer, stacking order
followed portal DOM order, backdrops compounded, scroll-lock could mis-restore. Port the
modal stack manager to drawer. Automatic — no new props.

## Implementation

### `src/components/drawer/mono-drawer.ts` — module-level stack manager
Copied from `mono-modal.ts` with drawer naming and `Z_BASE = 9990` (the drawer's existing
`--drawer-z` default). Every `document` touch guarded by the SSR `typeof document` check.
- `openDrawers: MonoDrawer[]` (open order, last = topmost), `Z_BASE=9990`, `Z_STEP=10`,
  `savedBodyOverflow`, `escBound`.
- `registerOpenDrawer`/`unregisterOpenDrawer` → `applyStackOrder()` + `syncBodyLock()` +
  `ensureEscapeListener()`.
- `applyStackOrder()` — per open drawer `i`: `assignStackLevel(Z_BASE+i*Z_STEP, i<length-1)`.
  The drawer overlay/panel read `--drawer-z` (overlay = z, panel = z+1), so a higher level's
  overlay sits above the lower level's panel.
- `syncBodyLock()` — lock once if ANY open drawer has `lockScroll`; restore when none
  (reference-counted → out-of-order safe).
- `ensureEscapeListener()` — one shared `keydown` while non-empty; Escape hides
  `openDrawers.at(-1)` only, if its `closeOnEscape && !persistent`.

Instance: `@state() _hasDrawerAbove`; `_computePortalClasses()` adds `has-drawer-above`;
`public assignStackLevel(z, hasAbove)` sets portal inline `--drawer-z` + the state;
`_applyOpenSideEffects`/`_releaseSideEffects` delegate to register/unregister (removed the
old `_previousBodyOverflow` / `_escapeListener` fields).

### `src/components/drawer/drawer.css`
```
.mono-drawer.open.has-drawer-above .mono-drawer-overlay { opacity: 0; }
```

No `drawer-types.ts` change.

### Demo — id `stacked`
Each level opens from a different edge so all are visible at once.
- `demos/drawer/vue/stacked.vue` — drawer 1 (right) → button opens drawer 2 (left) → drawer
  3 (bottom); independent refs, `@mno-close`.
- `demos/drawer/css/stacked.vue` — raw `.mono-drawer` markup, inline `--drawer-z` per level
  + `has-drawer-above` on lower levels, keydown closes topmost only.
- `ui/drawer.md` — "## Stacked" section + `<DemoSingle name="drawer" id="stacked" />`.

## Verification
- `npm run build` (package + vitepress) clean; `dist/drawer-*.js` has stack logic,
  `dist/ui/index.css` has the `has-drawer-above` rule.
- Dev: open 3 drawers (right/left/bottom); one backdrop; Escape/overlay close topmost only;
  scroll restored after all close; Vue + CSS match; single-drawer demos unaffected.
