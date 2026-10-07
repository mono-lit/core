# DOM Type — Light vs Shadow

Every `mono-*` component ships in **two flavors**: a **light-DOM** build and a **shadow-DOM** build. Most of the time you don't think about it — you just import a component and use it. This page explains the difference in plain terms and which one to pick.

## What is light vs shadow DOM?

Think of a component as a small box of HTML + CSS that you drop onto your page.

- **Light DOM** — the box is **open**. Its markup lives directly in the normal page, and it's styled by the page's global stylesheet (@mono-lit/helper's CSS). Your page can see and reach into it. Simple and shared.
- **Shadow DOM** — the box is **sealed**. The component keeps its own markup and styles inside a private bubble (a *shadow root*). Outside CSS can't leak in and its internal styles can't leak out — it's self-contained and isolated.

Both render the exact same component; they only differ in **where the markup/styles live** and **how isolated they are**.

## The two builds mono ships

| | Light (default) | Shadow |
| --- | --- | --- |
| Import | `import '@mono-lit/helper/ui/button'` | `import '@mono-lit/helper/ui/shadow/button'` |
| Tag you write | `<mono-button>` | `<mono-shadow-button>` |
| Styles come from | the global `@mono-lit/helper` CSS | the component's **own** scoped styles |
| Built for | client-side apps (SPA) | **server-side rendering** (`@lit-labs/ssr`) |

::: tip Theming works on both
CSS **custom properties inherit through the shadow boundary**, so your `--mono-*` overrides (see [Theme](./theme) and each component's *CSS Variables* section) apply to the light **and** shadow builds the same way.
:::

## Which should I use?

The right flavor depends on whether your app **renders on the server**.

- **Vue app (host or remote) → use light** (the default). A Vue SPA renders in the browser, so there's no server paint to optimize — light DOM is the simplest, smallest path. Just `import '@mono-lit/helper/ui/<name>'` and use `<mono-<name>>`.

- **Nuxt host (SSR) → use shadow.** Because Nuxt renders on the server, the shadow build lets the server send the **fully-styled component in the first HTML response** (as Declarative Shadow DOM). The result: **no skeleton delay, no unstyled flash, and no reflow when the page hydrates** — a smoother initial load and reload.

  In a Nuxt host you don't hand-write `<mono-shadow-*>` or wrap anything: just `import '@mono-lit/helper/ui/shadow/<name>'` and the `@mono-lit/helper/nuxt` module **auto-wraps** it for SSR — you keep using the component normally.

  A Nuxt app that runs **client-only** (`ssr: false`) is an SPA like a Vue app: use the **light** build there. `@mono-lit/helper/nuxt` notices the flag and skips its SSR wrapping entirely (no `<ClientOnly>` around `<mono-*>`, no `nuxt-ssr-lit`), so the elements exist by the time your page's `onMounted` binds a `controlMono*` controller to them.

> **Rule of thumb: Vue → light · Nuxt host → shadow.** A **Vue remote stays light even under a Nuxt host** — it's still a client-rendered island; the shadow build is for the Nuxt host's own server-rendered shell and pages. That Nuxt-host + Vue-remote pairing is a possible-but-risky **hybrid** — the standard is same-framework (see [Setup](../repo/setup)).

## See it in the docs

Every component's live demo on this site has a **Shadow** tab next to **Vue** and **CSS**. Toggle it to see the *same* component rendered through its shadow build — it looks identical, because theming (`--mono-*` variables) and `::part` cross the shadow boundary by design.

## Quick comparison

| | Light | Shadow |
| --- | --- | --- |
| **Import** | `@mono-lit/helper/ui/<name>` | `@mono-lit/helper/ui/shadow/<name>` |
| **Tag** | `<mono-<name>>` | `<mono-shadow-<name>>` |
| **Style source** | global @mono-lit/helper CSS | encapsulated per-component styles |
| **First paint (SSR)** | needs client hydration first | painted on the server, no flash |
| **Best for** | Vue apps (SPA) | Nuxt host (SSR) |
| **`--mono-*` theming** | ✅ | ✅ (vars pierce the boundary) |
| **`pending` skeleton** | automatic in an SSR app (released when the element's first data is in) | manual only (`pending` / `:pending`) — see [Skeleton](../addons/skeleton) |

New here? Start with [Getting Started](./getting-started) and [Theme](./theme). If you're the AI maintaining a mono template, this choice is codified as **Rule 11 ("Component flavor")** in the [Template Rules](../ai/template).
