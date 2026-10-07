# mono-date — flatpickr-based date / datetime / time picker

## Context
The native date input was too basic. Added `mono-date`, a rich picker built on
[flatpickr](https://flatpickr.js.org/). `type: 'date' | 'datetime' | 'time'` drives the mode;
common flatpickr options are named props and an `options` object prop passes through any other
flatpickr option (completely featured). `model-value` is the formatted string; `mno-change`
also carries the raw `Date[]`.

## Dependency
`flatpickr ^4.6.13` added to @mono-lit/helper `dependencies` (bundled — vite `external: []`).
**Lazy-loaded** via `await import('flatpickr')` at init so the `@mono-lit/helper` barrel (imported
during docs SSR) never pulls flatpickr's `window`-touching module; flatpickr types via
`import type`.

## Component — `src/components/date/`
- `date-types.ts` — `DateType`/`DateSize`/`DateColor`/`DateVariant`/`DateMode`/`DateCssClass`/
  `DateChangeEventDetail`/`DateProps`/`DateEvents` (cross-case keys; `options?: Partial<Options>`).
- `mono-date.ts` — light-DOM element mirroring mono-input (label/field/native/clear/message,
  sizes/colors/variants/validation/cssClass/sizing/hybrid aliases). Named flatpickr props +
  `options`. `_buildConfig()` = `{ ...typeDefaults, ...options, ...definedNamedProps, onChange,
  onOpen, onClose }`; `modelValue` → `defaultDate`. Lifecycle: `firstUpdated` lazy-loads +
  inits flatpickr on `.mono-date-native`; `updated` rebuilds on config-key change / `setDate`
  on external `modelValue`; `disconnectedCallback` destroys. onChange sets `modelValue=dateStr`
  + dispatches `mno-change`/`mnoChange` (`detail.modelValue` for v-model) with `dates`.
- `date.css` — `@import 'flatpickr/dist/flatpickr.css'` (calendar renders to <body> → needs the
  global bundle), the `.mono-date-*` field styles (adapted from input), and mono theming of
  `.flatpickr-calendar` / `.flatpickr-day.selected/.today/.inRange` / time inputs via tokens.
- `index.ts` — exports.

## Wiring (5 edits)
1. `src/entries/index.ts` → `export * from '../components/date/index'`.
2. `src/entries/index.css` → `@import '../components/date/date.css';`.
3. `vite.config.ts` → `'ui/date': r('./src/components/date/index.ts')`.
4. `package.json` → `./ui/date` export pair + `flatpickr` dependency.
5. Docs: `ui/date.md`, `manifests/date.ts`, `demos/date/vue/*` (basic, datetime, time, range,
   inline, options), Form sidebar entry in `.vitepress/config.ts`.

## Material flavor (`src/data/theme/index.css`)
`.theme-flavor-material .mono-date-field:focus-within` → 2px primary border (joins the other
text fields); `.theme-flavor-material .flatpickr-calendar` → 4px radius + `--theme-elev-3`.

## Notes
- Demos are **vue-only** (a date picker needs flatpickr JS; a raw CSS demo can't import
  flatpickr from the docs package). `DemoPreview` shows the vue demo with no toggle when the CSS
  demo is absent.
- `DemoTypes name="date"` resolves automatically (the extractor reads `src` keyed by folder).

## Verification
- `pnpm add flatpickr && npm run build` (package) — passes; `dist/ui/date.js` exists; flatpickr
  bundled (`dist/esm-*.js`); `grep flatpickr-calendar dist/ui/index.css` > 0; `DateProps` in
  `dist/src/components/date/date-types.d.ts`; tag in `dist/date-*.js`.
- `demo/vitepress` build clean (SSR safe — flatpickr dynamic, page import client-only).
- Dev `/ui/date`: each picker opens/selects; model-value updates; range/inline/time-24hr/options
  work; material flavor themes the calendar.
