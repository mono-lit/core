# Stackable modals — open a modal from inside a modal, any depth

## Context

`mono-modal` assumed a single modal at a time. Each `<mono-modal>` renders into its own
portal `<div>` on `document.body` and, while open, adds a per-instance `document`
`keydown` listener (closes itself on Escape) and locks body scroll per-instance. Opening
a second modal while the first is open misbehaved: Escape closed the whole stack at once;
stacking order followed portal DOM (creation) order, not open order; backdrops compounded
darker with depth; scroll-lock could mis-restore on out-of-order closes.

Goal: any number of modals open at once, each new one above the previous, Escape /
overlay-click affect only the topmost, scroll-lock correct. Stacking is **automatic** —
no new props.

## Implementation

### `src/components/modal/mono-modal.ts` — module-level stack manager
A singleton shared by all instances (every `document` touch guarded by the existing SSR
`typeof document === 'undefined'` check):
- `openModals: MonoModal[]` (open order, last = topmost), `Z_BASE=600`, `Z_STEP=10`,
  `savedBodyOverflow`, `escBound`.
- `registerOpen(m)` / `unregisterOpen(m)` → `applyStackOrder()` + `syncBodyLock()` +
  `ensureEscapeListener()`.
- `applyStackOrder()` — per open modal `i`: set portal inline `--modal-z = Z_BASE+i*Z_STEP`
  (raises the whole stacking context above the one below; step 10 clears the internal
  panel-wrap `+1`), and set reactive `_hasModalAbove = i < length-1`.
- `syncBodyLock()` — lock once if ANY open modal has `lockScroll`; restore when none do
  (reference-counted by the array → out-of-order safe).
- `ensureEscapeListener()` — one shared `keydown` listener while `openModals` non-empty;
  Escape hides `openModals.at(-1)` only, if its `closeOnEscape && !persistent`.

Instance: `@state() _hasModalAbove`; `_computePortalClasses()` adds `has-modal-above`;
`_applyOpenSideEffects`/`_releaseSideEffects` now delegate to `registerOpen`/`unregisterOpen`
(removed the old `_previousBodyOverflow` / `_escapeListener` fields).

### `src/components/modal/modal.css`
One rule so backdrops don't compound (topmost overlay dims everything beneath):
```
.mono-modal.open.has-modal-above .mono-modal-overlay { opacity: 0; }
```

No `modal-types.ts` change (no public API added).

### Demo — id `stacked`
- `demo/vitepress/docs/demos/modal/vue/stacked.vue` — base trigger → modal 1 → button
  opens modal 2 → modal 3 (independent `ref` booleans).
- `demo/vitepress/docs/demos/modal/css/stacked.vue` — raw `.mono-modal` markup, inline
  `--modal-z` per level + `has-modal-above` on lower levels.
- `demo/vitepress/docs/ui/modal.md` — "## Stacked" section + `<DemoSingle name="modal" id="stacked" />`.

## Verification
- `npm run build` (package) — stack logic in `dist/modal-*.js`, rule in `dist/ui/index.css`.
- `npm run build` (vitepress) — clean.
- Dev: open 3 levels; each above the last; one backdrop; Escape/overlay close top only;
  scroll restored after all close; Vue + CSS match; single-modal demos unaffected.
