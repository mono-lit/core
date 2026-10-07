// @unocss-include
import 'virtual:uno.css'
import './index.css'

// Utilities / types ONLY — NO component modules. Re-exporting a component module
// here runs its `@customElement('mono-<c>')` registration as an import SIDE EFFECT,
// so `import { monoDataGrid } from '@mono-lit/helper'` (a pure utility) used to register
// EVERY light element — including `mono-nav`/`mono-sidebar`, which then collided with
// the shadow builds registered separately (e.g. a Nuxt host's `mono-shadow` plugin) →
// `NotSupportedError: 'mono-nav' has already been defined`. Components are available
// ONLY via the `@mono-lit/helper/ui/<c>` (light) and `@mono-lit/helper/ui/shadow/<c>` (SSR)
// subpaths. This mirrors the side-effect-free `node`-condition entry so the browser
// and server roots expose the same surface; the CSS imports above stay (they pull the
// global stylesheet, not any custom element).
export * from './index.node.js'

