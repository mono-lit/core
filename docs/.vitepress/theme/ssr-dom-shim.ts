// Minimal DOM globals so the `@mono-lit/helper` barrel can be imported during
// VitePress's Node SSR/build pass.
//
// The published `@mono-lit/helper` bundle is the *browser* build of Lit
// (lit-html + reactive-element) with no SSR dom-shim. Its shared base chunk
// (`dist/decorate-*.js`) touches three globals at module-load time:
//   - `class extends HTMLElement`   (the base custom-element class)
//   - `const D = document`          (lit-html caches the document)
//   - `customElements.define(...)`  (each component registers itself)
// In Node none of these exist, so merely importing the barrel — which happens
// whenever a component imports e.g. `themes`/`flavors`/`controlMonoTable` — throws
// "HTMLElement is not defined" before any page can render.
//
// VitePress renders `<mono-*>` as plain custom-element tags (see
// `isCustomElement` in config.ts), so the classes are never *instantiated*
// server-side — only these load-time side effects run. Stubbing the globals is
// therefore enough; nothing here is used during actual SSR output.
//
// Guarded with `??=` so this is a no-op in the browser (where the real DOM
// already provides them) and safe to load in both SSR and client bundles.

const g = globalThis as unknown as {
  HTMLElement?: unknown
  customElements?: unknown
  document?: unknown
}

if (typeof g.HTMLElement === 'undefined') {
  g.HTMLElement = class HTMLElement {} as unknown
}

if (typeof g.customElements === 'undefined') {
  g.customElements = {
    define() {},
    get() {
      return undefined
    },
    whenDefined() {
      return Promise.resolve()
    },
    upgrade() {},
  } as unknown
}

if (typeof g.document === 'undefined') {
  // lit-html only stores a reference at load time; the render-time methods
  // never run server-side, but stub the common ones cheaply just in case.
  const noopNode = () => ({}) as unknown
  g.document = {
    createElement: noopNode,
    createElementNS: noopNode,
    createComment: noopNode,
    createTextNode: noopNode,
    createDocumentFragment: noopNode,
    createTreeWalker: () => ({ nextNode: () => null }),
  } as unknown
}

export {}
