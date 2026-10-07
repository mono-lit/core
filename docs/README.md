# Mono Docs (VitePress)

VitePress + Vue 3 documentation for **Mono** — a Host/Remote mono-repo pattern plus a Lit-powered web component library.

The site has two main sections:

- `docs/repo/` — Mono-Repo guide (Host/Remote concept, sync, config, provide-inject).
- `docs/ui/` — Mono-UI component pages, one per component.

## Getting started

```bash
pnpm install
pnpm dev      # start dev server
pnpm build    # build static site -> docs/.vitepress/dist
pnpm preview  # preview production build
```

## Architecture

```
docs/
  .vitepress/
    config.ts            # site config + Vue isCustomElement for `mono-*`
    theme/
      index.ts           # registers web components on the client
      custom.css         # iframe + tweaks
  components/
    DemoPreview.vue      # reusable live demo + source toggle
  demos/
    <component>/
      vue/*.vue          # Vue demo SFCs (rendered + shown as ?raw)
      native/*.vue       # Vue host that runs vanilla DOM code in onMounted (rendered)
      native/*.html      # Plain HTML+JS shown in the source panel via ?raw
  <component>.md         # markdown page that imports demos and renders DemoPreview
```

## Adding a new component

1. Drop demo files in `docs/demos/<name>/vue/` (Vue SFCs) and `docs/demos/<name>/native/` (a `.vue` host + a matching `.html` for the displayed source).
2. Add a dynamic import for the component bundle in `docs/.vitepress/theme/index.ts`.
3. Create `docs/<name>.md` mirroring `checkbox.md` — one `<DemoPreview>` per demo, with both `vue-*` and `native-*` props.
4. Add a sidebar entry in `docs/.vitepress/config.ts`.

No DemoPreview / config rewrite required.
