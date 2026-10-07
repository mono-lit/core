# Reference LLMs (for AI)

When you (an AI assistant) need authoritative API details for any library in this stack, **read that
project's official `llms.txt` first** instead of relying on memory. An `llms.txt` is the
project's documentation flattened into a single machine-readable markdown file, so it is the most
reliable source for current APIs, options, and examples.

::: tip How to use
Fetch the relevant URL below and ground your answer in it **before** writing or changing code. Prefer
the `llms.txt` reference over assumptions, and base the behavior you rely on on what the docs
actually say.
:::

## Core stack — official `llms.txt`

These projects publish a full machine-readable docs file. Read it directly.

| Library | What it's for | Reference |
| --- | --- | --- |
| Vue 3 | Framework / Composition API | <https://vuejs.org/llms.txt> |
| Vue Router | File-based routing | <https://router.vuejs.org/llms.txt> |
| Vite | Dev server / bundler | <https://vite.dev/llms.txt> |
| UnoCSS | Atomic utility-class CSS | <https://unocss.dev/llms.txt> |
| Unhead | `<head>` / SEO meta tags | <https://unhead.unjs.io/llms.txt> |
| Nuxt | Nuxt reference for host of nuxt | <https://nuxt.com/llms.txt> |


## Other stack — official docs

These libraries are used across the Host and Remote templates but do **not** publish an
`llms-full.txt`. Read their official documentation site instead.

| Library | What it's for | Docs |
| --- | --- | --- |
| VueUse | Auto-imported composition utilities (`@vueuse/core`) | <https://vueuse.org/> |
| Pinia | State management (auto-imported) | <https://pinia.vuejs.org/> |
| odata2ts | Generates typed OData classes from metadata | <https://odata2ts.github.io/> |

::: tip Ecosystem packages
For the in-house packages (`@mono-lit/utility`, `@mono-lit/helper`), the source of truth is **this
docs site**, not an external URL — see [Getting Started](../repo/getting-started),
[Template Rules](./template), and [Useful Utils](../repo/useful-utils).
:::
