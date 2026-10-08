# @mono-lit/helper

Lit web components (tables, forms, inputs, dialogs, charts, …) for Vue and Nuxt. Every component ships a light-DOM build (`@mono-lit/helper/ui/<name>`) and a shadow-DOM build (`@mono-lit/helper/ui/shadow/<name>`).

## Installation

**From npmjs (public):**

```bash
pnpm add @mono-lit/helper
```

**From the Netlify registry:** add this to your project's `.npmrc`, then run the same `pnpm add`:

```ini
@mono-lit:registry=https://mono-libs.netlify.app/npm/
//mono-libs.netlify.app/npm/:_authToken=<REGISTRY_DOWNLOAD_TOKEN>
```

Optional peers are only needed for the features that use them: `chart.js` (chart), `suneditor` (rich-text editor), `exceljs` / `handlebars` (table export), plus `@floating-ui/dom`, `vue`, `vite` and `@nuxt/kit` for their integrations.

## Usage

```ts
import '@mono-lit/helper/index.css'
import '@mono-lit/helper/ui/button'
```

```html
<mono-button>Save</mono-button>
```

## License

MIT. See the [repository](https://github.com/mono-lit/core) for full documentation.
