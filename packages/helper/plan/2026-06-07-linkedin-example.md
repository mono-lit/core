# LinkedIn-inspired example page (single mono-component, static data)

## Context
Added a third full-page showcase (after Odoo Sales and Layout): a LinkedIn-inspired **home feed**,
built as one self-contained component using only `mono-*` components + static data — inspired by, not
mimicking, LinkedIn. Mirrors the `components/Example/Odoo.vue` recipe.

## Changes
- **New `demo/vitepress/docs/components/Example/LinkedIn.vue`** — the whole example:
  - SSR-guarded lazy imports of `@mono-lit/helper/ui/{nav,card,button,chip,input,textarea,dropdown,modal,drawer,tabs}`.
  - Static reactive state: `profile`, `posts[]` (with nested comments), `suggestions[]`, `news[]`,
    `conversations[]`, `notifications[]`, plus UI flags.
  - Sections: `mono-nav` top bar (brand, search, nav links, Notifications + Me `mono-dropdown`s,
    Messaging `mono-drawer`); 3-column responsive grid — left profile `mono-card` + saved list,
    center composer (`mono-modal` + `mono-textarea`) + feed-filter `mono-tabs` + post `mono-card`s
    (Like toggle, Comment `mono-drawer`, Repost, Send), right "Add to your feed" (Follow toggle) +
    news. Toast via the Odoo `flashToast` pattern.
  - Root `.li-page theme-color-light-blue` (Mono structure + blue palette, self-contained). Styles use
    only `var(--theme-*)` tokens; layout via UnoCSS + scoped CSS; `i-mdi-*` icons.
- **`docs/.vitepress/theme/index.ts`** — import + `app.component('ExampleLinkedIn', …)`.
- **`docs/example/linkedin.md`** — `layout: false` + `<ClientOnly><ExampleLinkedIn/></ClientOnly>`.
- **`docs/.vitepress/config.ts`** — Example sidebar entry `LinkedIn Feed` → `/example/linkedin` (new tab).

## Verification
- `cd demo/vitepress && npm run build` — clean (ClientOnly + SSR-guarded imports keep custom elements
  out of the server pass).
- `/example/linkedin`: like/follow toggles, create-post modal prepends, comment drawer increments,
  messaging/notifications/Me open; responsive 3→1 column; blue theme tokens resolve.
- Only `mono-*` components for UI primitives (avatars are themed initials divs); all data static.
