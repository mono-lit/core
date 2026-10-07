# Toast component + docs

## Context

Third item from the `2026-05-04-template-componentization-roadmap.md` roadmap (Accordion, Tabs, then Toast). `mono-toast` is a small flash-message element with four semantic types (`success`/`info`/`warning`/`danger`), an entrance animation, optional auto-dismiss, optional close button, and an imperative `MonoToast.notify({...})` static helper that creates a singleton fixed-positioned region under `<body>` and pushes a fresh toast into it.

## Files added

### Lib
- `src/components/toast/index.ts`
- `src/components/toast/mono-toast.ts` — Lit element. Props: `type`, `size`, `title`, `message`, `duration` (auto-dismiss ms, 0 = sticky), `dismissible`, `open` (reflected), `cssClass`, `cssClassName`. Slots: `icon` (default SVGs by type), `title`, `body` (default slot also routes here), `actions`. Static `MonoToast.notify({...})` helper. Methods: `show()`, `hide(source?)`, `restartTimer()`. Auto-cleans the timer on `disconnectedCallback`.
- `src/components/toast/toast-types.ts` — `ToastType`, `ToastSize`, `ToastSource`, `ToastPosition`, `ToastCssClass`, `ToastDismissEventDetail` (`{ modelValue, currentValue, oldValue, value, source, sourceEvent? }` per the standardized shape), `ToastDismissEvent`, `ToastNotifyOptions`, `ToastProps`, `ToastEvents`.
- `src/components/toast/toast.css` — variables on `.mono-toast` (no `:host`); per-type accent (`--toast-accent` / `--toast-accent-rgb` / `--toast-bg` / `--toast-border` / `--toast-text` all derived from `--theme-X`); sm/md/lg sizing; entrance/exit `@keyframes`; `.mono-toast-region` flex stack with `.position-{top,bottom}-{left,center,right}` opt-in fixed-positioning modifiers; SVG sizing rules; `mono-toast { display: contents }` so the host doesn't introduce extra layout.

### Docs
- `demo/vitepress/docs/toast.md`
- `demo/vitepress/docs/manifests/toast.ts` — 10 entries.
- `demo/vitepress/docs/demos/toast/vue/*.vue` — 10 SFCs.
- `demo/vitepress/docs/demos/toast/css/*.html` — 10 self-contained demos.

## Files changed

- `src/entries/index.ts` — added `export * from '../components/toast/index'`.
- `src/entries/index.css` — added `@import '../components/toast/toast.css';`.
- `vite.config.ts` — added `toast: r('./src/components/toast/index.ts')` to `build.lib.entry`.
- `package.json` — added `./toast` sub-export.
- `demo/vitepress/docs/.vitepress/config.ts` — new "Feedback" sidebar group with `Toast → /toast`.

## Demo set (10)

`basic`, `types`, `sizes`, `dismissible`, `auto-dismiss`, `with-icon`, `actions`, `imperative`, `event-log`, `customized`.

## Patterns followed

- **SVG-only icons**: type-specific defaults (`check-circle`, `info-circle`, `alert-triangle`, `x-octagon`) + close-button × — all hand-drawn Lucide-style. Custom icons via `<svg slot="icon">…</svg>` per the codified rule.
- **Standardized event detail**: `mno-dismiss` emits `{ modelValue: false, currentValue: false, oldValue: true, value: false, source, sourceEvent? }` matching input/select/accordion/tabs.
- **Theme integration**: every accent reads `var(--theme-X)`; the global theme switcher recolours every toast in flight.
- **CSS demos**: vanilla-JS IIFEs drive auto-dismiss timers and close buttons. Demo regions are inline (no `position-*` modifier) to keep the doc layout sane; `imperative` is the one demo that opts into fixed positioning.

## Verification

1. `pnpm dev` and open `/toast`.
2. All 10 demos render. Toggle Vue / CSS — both look identical.
3. `dismissible`: click ✕ — `event-log` shows `[mno-dismiss] ... source="close"`.
4. `auto-dismiss`: wait 4s — toast hides; log shows `source="auto"`.
5. `imperative`: clicking the buttons calls `MonoToast.notify({...})` — fresh toasts appear in the bottom-right fixed region and remove themselves on dismiss.
6. Switch the global theme — all toast accents recolour.
7. `pnpm build` — `dist/toast.js` and `dist/toast.d.ts` are emitted.
