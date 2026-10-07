# File upload — CSS refactor + docs page (VitePress)

Adds documentation for `<mono-file-upload>` and refactors its stylesheet so the same `mono-file-upload-*` classes work in both shadow DOM (the web component) and light DOM (raw HTML markup). This brings the component in line with `<mono-button>`, `<mono-checkbox>`, `<mono-badge>`, and `<mono-card>`, all of which already supported the dual-use pattern.

## Why

The Vue/CSS demo recipe established for the previous components requires that a developer can either:
- Use `<mono-file-upload …>` (the Lit web component) inside a Vue or framework app, OR
- Hand-write `<div class="mono-file-upload">…</div>` in plain HTML and rely on `@mono-lit/helper/index.css` for styling.

Before this change, `file-upload.css` only worked for the first path because it scoped its root rule and CSS variables on `:host` (which is a no-op outside shadow DOM). Raw HTML using the same class names rendered unstyled.

## Source change

`src/components/file-upload/file-upload.css` — moved the `:host` block onto `.mono-file-upload`:

- The display, box-sizing, and all `--fu-*` CSS variable definitions now live on `.mono-file-upload`.
- The unscoped `*, *::before, *::after { box-sizing: border-box }` rule was tightened to `.mono-file-upload *, *::before, *::after` so loading the global stylesheet doesn't pollute every page's box-sizing.

The component's `render()` method already produces `<div class="mono-file-upload …">` as the shadow root's first child, so the same selector matches in both contexts. No changes to `mono-file-upload.ts`, the type files, or the build config — `file-upload.css` was already aggregated into `dist/index.css` via `src/entries/index.css`.

After the change: `pnpm --filter @mono-lit/helper build` regenerates `dist/index.css` with the corrected rules.

## Docs shipped

- `demo/vitepress/docs/demos/file-upload/css/*.html` — 8 raw-HTML demos.
- `demo/vitepress/docs/demos/file-upload/vue/*.vue` — 8 Vue SFCs.
- `demo/vitepress/docs/manifests/file-upload.ts` — ordered demo list.
- `demo/vitepress/docs/file-upload.md` — thin: `<!-- @unocss-includes -->` + per-page `import('@mono-lit/helper/file-upload')` script setup + heading + `<ComponentDocs name="file-upload" />`.

Demo set: `basic`, `compact`, `multiple`, `image`, `validation`, `states`, `preloaded`, `event-log` — mirroring the canonical sections in the standalone `demo/pages/file-upload/index.html`.

## Notes

- **Drag-and-drop is component-only.** The CSS+HTML version uses `<label class="mono-file-upload-dropzone">` wrapping `<input>` for click-to-open behavior. Replicating drag-drop in vanilla JS would require ~30 lines per demo, so it's intentionally not part of the CSS variant. The Vue version inherits the component's full drag-drop support automatically.
- The standalone interactive page at `demo/pages/file-upload/index.html` is unaffected — its `lit/` and `css/` folders were empty, so there were no source loads to break.
