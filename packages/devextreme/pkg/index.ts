// @mono-lit/devextreme — the consumer's DevExtreme *data* layer, re-exported from ONE place.
// Minimal surface: only the stores actually consumed downstream. devextreme itself is a
// peer dependency and is never bundled (see tsdown.config.ts): the classes below are the
// app's own, so a DataSource built here is the one its devextreme-vue widgets accept.
//
// Everything is re-exported explicitly (not via `export *`) so the public API is
// identical across the ESM and CJS builds. `export *` does not forward a module's
// default export and its star re-exports are dropped by the CJS interop.

import { scheduleDevExtremeLicenseCheck } from './license-check';

// Let DevExtreme run its own license validation once per browser runtime (no-op under
// SSR). This entry is the only shared module every consumer goes through; see
// license-check.ts for why it waits for `load`, and package.json `sideEffects`.
scheduleDevExtremeLicenseCheck();

// Stores
export { default as DataSource } from 'devextreme/data/data_source';
export { default as CustomStore } from 'devextreme/data/custom_store';
export { default as ODataStore } from 'devextreme/data/odata/store';
export { default as ArrayStore } from 'devextreme/data/array_store';

// DevExtreme's global config — re-exported so apps can set `config({ licenseKey })` without
// listing `devextreme` themselves (pnpm only lets an app import its own dependencies), and
// so the key always lands on the same devextreme copy the license check uses.
export { default as config } from 'devextreme/core/config';
// Type-only (erased at build time — no runtime/bundle cost)
export type { LoadOptions } from 'devextreme/data';
