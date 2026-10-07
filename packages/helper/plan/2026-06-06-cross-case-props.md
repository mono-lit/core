# Cross-case props sweep (kebab + camelCase) across components

## Context

Component props should be usable both as camelCase and kebab-case. At runtime this
already works everywhere: every multi-word prop declares a kebab Lit attribute
(`@property({ attribute: 'close-on-escape' })`) — auto-observed via
`super.observedAttributes` — and `defineHybridPropAliases` (in
`src/composables/hybird-prop.ts`) installs kebab + lowercase **property** aliases for
Vue/JS binding.

The inconsistency was in the **TypeScript `*Props` interfaces**: a few multi-word props
listed only the camelCase key, so `:kebab-case` bindings in Vue templates (and the
DemoTypes docs) had no typed counterpart. This is the same gap previously fixed for
`ModalProps`.

## Standard

Every multi-word camelCase prop in a `*Props` interface must declare **two** case
variants: `propName?: T` and `'kebab-name'?: T`. Pre-existing all-lowercase keys
(`propname?`) are left untouched (not removed, not newly added). Single-word
all-lowercase props (`size`, `width`, `disabled`, …) are unchanged.

## Audit result

A full grep of all `src/components/*/<component>-types.ts` `*Props` interfaces found
that nearly all were already compliant (most even carry the extra lowercase variant).
Only two files had props missing the kebab sibling:

- `src/components/drawer/drawer-types.ts` — `closeOnEscape`, `closeOnOverlay`,
  `lockScroll`.
- `src/components/sidebar/sidebar-types.ts` — `railWidth`, `expandOnHover`,
  `closeOnEscape`, `closeOnScrim`, `lockScroll`, `showScrim`.

Runtime (`mono-drawer.ts`, `mono-sidebar.ts`) already declares the kebab `attribute:`
for all of these, so no runtime change was needed.

Item/data interfaces (`MenuItem`, `BreadcrumbItem`, `TabItem`, `SelectItem`, …) are
out of scope — they are object shapes passed via array props and accessed in JS as
camelCase only, not as element attributes.

## Changes

1. `drawer-types.ts` — add `'close-on-escape'?`, `'close-on-overlay'?`,
   `'lock-scroll'?` next to their camelCase keys.
2. `sidebar-types.ts` — add `'rail-width'?`, `'expand-on-hover'?`,
   `'close-on-escape'?`, `'close-on-scrim'?`, `'lock-scroll'?`, `'show-scrim'?`.

## Verification

- `cd packages/helper && npm run build` passes (dts/tsc would fail on a malformed
  interface).
- Grep each `*Props`: every multi-word `camelCase?:` has a sibling `'kebab-case'?:`.
- `cd packages/helper/demo/vitepress && npm run build` — DemoTypes tables still build.
