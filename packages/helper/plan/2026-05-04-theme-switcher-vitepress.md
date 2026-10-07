# VitePress global theme switcher

## Context

`@mono-lit/helper` ships a runtime theme system in `src/data/theme/`:
- `index.css` defines `:root` defaults plus four presets (`.theme-opsi-a/b/c/d`) — each redefines the full `--theme-*` and `--theme-*-rgb` palette.
- `index.ts` exposes `themes`, `applyTheme`, `getCurrentTheme`, `getAllThemes`, `isValidTheme`, plus a `theme-changed` `CustomEvent`.
- `presets.ts` exposes `themePresets` and `ThemeName`.

All exports are re-exported from `@mono-lit/helper` via `entries/index.ts:4-5`, and the theme stylesheet ships in `@mono-lit/helper/index.css` which the VitePress docs already import at `demo/vitepress/docs/.vitepress/theme/index.ts:3`. Every component CSS file (`button.css`, `input.css`, `radio.css`, …) reads colours via `var(--theme-X, fallback)`, so swapping the body/html class cascades to every demo automatically.

What was missing: a UI to switch themes, and a way to avoid the first-paint flash when a saved choice differs from `:root`.

## Files added

- `demo/vitepress/docs/components/ThemeSwitcher.vue` — native `<select>` bound to a `ref<ThemeName>`. On mount, reads the class from `documentElement` (set by the inline head script) or falls back to `localStorage` then `'opsi-a'`. A watcher cleans `theme-*` classes off `<html>`, applies the new one, sets `data-theme`, writes `localStorage`, and dispatches a `theme-changed` `CustomEvent` matching the lib's shape. SSR-safe: side-effecting code is gated by `onMounted` / `typeof window !== 'undefined'`.
- `demo/vitepress/docs/.vitepress/theme/Layout.vue` — wraps `DefaultTheme.Layout` and injects `<ThemeSwitcher>` into the `#nav-bar-content-after` slot. No props, no script logic.

## Files changed

- `demo/vitepress/docs/.vitepress/theme/index.ts` — switch from `extends: DefaultTheme` to a custom `Layout` (the new `Layout.vue`). Continue calling `enhanceApp` to register the existing globals; also register `ThemeSwitcher` so it's usable inside markdown if someone wants it.
- `demo/vitepress/docs/.vitepress/config.ts` — add a `head` entry that injects an inline script reading `localStorage`, validating against the four allowed names, and applying the `theme-XXX` class + `data-theme` attribute to `documentElement` synchronously in `<head>`. Runs before any CSS evaluates, so no first-paint flash.

## Design decisions

- **Class target = `documentElement`**: the `.theme-opsi-X` selectors aren't body-anchored, so cascading from `<html>` works. Using one consistent target across the head script and Vue switcher avoids the body/html dual-class race that would otherwise happen if the head script targets `<html>` and the Vue switcher uses the lib's `body`-targeting `applyTheme()`.
- **Native `<select>` UI**: avoids dogfooding `<mono-select>` here so the switcher doesn't depend on a Lit module being loaded first and works under SSR.
- **Lib's `applyTheme()` left untouched**: would be a behaviour change for downstream apps. Docs ship their own small documentElement-targeted helper inside `ThemeSwitcher.vue`.

## Verification

1. From `demo/vitepress/`, run the dev server.
2. Theme picker appears top-right on every page.
3. Pick a non-default theme on `/input` (or any component page) — every Vue + CSS demo recolours instantly.
4. Reload — the picker remembers the choice, no flash from default → saved on load.
5. DevTools: `<html>` carries `class="theme-opsi-X" data-theme="opsi-X"`, `localStorage['mono-helper-theme']` matches.
6. Clear localStorage, reload — picker resets to "Navy & Sky Blue" (`opsi-a`).

## Not changed

- `src/data/theme/*` (lib's theme system already does what's needed).
- `src/components/*` (already read `var(--theme-*)`; the cascade does the rest).
- `package.json` (`@mono-lit/helper` already a workspace dep; theme exports already public).
- Light/dark mode toggle for components — out of scope.
