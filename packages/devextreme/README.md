# @mono-lit/devextreme

The app's DevExtreme **data** layer (`DataSource`, `CustomStore`, `ODataStore`, `ArrayStore`), re-exported from one place, plus DevExtreme's `config` (for the license key). `devextreme` (pinned `25.1.6`) is a dependency and is never bundled, so these are the same classes the app's own DevExtreme widgets use.

## Setting a valid DevExtreme license key

DevExtreme checks its license in the browser, once per page, when its first UI component is created. It reads the key from DevExtreme's global config **at that moment** and never checks again.

This package only exposes data classes, which never create a UI component. So that apps using only the data layer still get DevExtreme's check, `@mono-lit/devextreme` creates one throwaway DevExtreme `LoadIndicator` on a detached element, never added to the page, and disposes it straight away. This happens once per page, after the window `load` event. DevExtreme then validates the key itself and prints its own messages. This package never reads, checks or prints your key, and does nothing on the server (SSR).

### 1. Get your key

Get the license key for your DevExtreme subscription from DevExpress. See [DevExtreme Licensing](https://js.devexpress.com/Documentation/Licensing/) for where to find it and which subscriptions include one.

### 2. Register it before the page finishes loading

Nothing extra to install: `@mono-lit/devextreme` re-exports DevExtreme's `config`, so import it from this package.

> **Why not `import config from 'devextreme/core/config'`?** `devextreme` is installed as a dependency of this package, but pnpm only lets your app import packages listed in its **own** `package.json`, so that import fails with `Cannot find module`. Importing `config` from `@mono-lit/devextreme` also guarantees the key lands on the same DevExtreme copy the license check reads.

Call `config()` with your key **before** the window `load` event and before any DevExtreme widget is created. Startup code (`main.ts`, Nuxt plugins) runs before `load`. A key set later is ignored: DevExtreme has already validated with whatever was set at the time.

**Vue + Vite** — put it first in `main.ts`:

```ts
// src/devextreme-license.ts
import { config } from '@mono-lit/devextreme'

config({ licenseKey: import.meta.env.VITE_DEVEXTREME_LICENSE_KEY })
```

```ts
// src/main.ts
import './devextreme-license'   // before anything that creates DevExtreme widgets
import { createApp } from 'vue'
// …
```

```ini
# .env.local (not committed)
VITE_DEVEXTREME_LICENSE_KEY=<your key>
```

**Nuxt** — a client plugin is enough, because DevExtreme validates only in the browser:

```ts
// plugins/devextreme-license.client.ts
import { config } from '@mono-lit/devextreme'

export default defineNuxtPlugin(() => {
  config({ licenseKey: useRuntimeConfig().public.devextremeLicenseKey })
})
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: { devextremeLicenseKey: '' }, // filled from NUXT_PUBLIC_DEVEXTREME_LICENSE_KEY
  },
})
```

```ini
# .env (not committed)
NUXT_PUBLIC_DEVEXTREME_LICENSE_KEY=<your key>
```

Keep the key out of git: use an env file or a CI secret. It still ends up in the client bundle, because DevExtreme reads it in the browser.

### 3. Check it

Open the app in a browser and look at the console after the page has loaded:

| You see | Meaning |
|---|---|
| nothing from DevExtreme | the key is valid |
| `W0019` "Unable to Locate a Valid License Key", plus DevExtreme's trial banner | no key was set before validation ran |
| `W0020` | the key does not cover this DevExtreme version (`25.1`) |
| `W0021` | the key could not be read (corrupted, truncated, or not a real key) |
| `W0024` | a DevExpress key was used where a DevExtreme key is expected |
| `W0022` | a DevExtreme preview build is in use |

These messages and the banner come from DevExtreme itself. See the [DevExtreme licensing docs](https://js.devexpress.com/Documentation/Licensing/) for what each one means.

### Troubleshooting

- **`W0019` even though you call `config()`:** the call ran too late (after `load`, or after the first widget). Also make sure you import `config` from `@mono-lit/devextreme`: if your app has its own `devextreme` at a different version, `devextreme/core/config` points to a second copy that the license check never reads.
- **`Cannot find module 'devextreme/core/config'`:** import `config` from `@mono-lit/devextreme` instead (see step 2).
- **Server logs:** nothing is printed on the server. Validation only happens in the browser.

## DevExtreme License Notice

This project uses or integrates with **DevExtreme**, a product of Developer Express Inc. ("DevExpress").

DevExtreme is third-party software and is governed by its own license terms. Using this project does **not** grant you a DevExtreme license or any rights to use DevExtreme beyond those provided by DevExpress.

You are responsible for:

- obtaining any required DevExtreme license;
- complying with the applicable DevExtreme End User License Agreement (EULA);
- configuring any required DevExtreme license key;
- ensuring that your development, deployment, distribution, and redistribution comply with DevExpress licensing terms.

This project does not provide, sublicense, transfer, or grant any DevExpress or DevExtreme license.

### License Validation

DevExtreme may perform its own runtime license validation and may display license-related warnings or messages.

These messages are generated by DevExtreme itself and should not be interpreted as licensing decisions made by this project.

This project does not intentionally bypass, disable, modify, or circumvent DevExtreme's licensing or license-validation mechanisms.

### No Affiliation

This project is independent and is not affiliated with, endorsed by, sponsored by, or officially associated with Developer Express Inc.

"DevExpress" and "DevExtreme" are trademarks or registered trademarks of Developer Express Inc. and/or its affiliates.

### Official Licensing Information

Always refer to DevExpress for the current licensing requirements:

- DevExtreme Licensing: https://js.devexpress.com/Licensing/
- DevExtreme EULA: https://js.devexpress.com/EULAs/DevExtremeComplete/

DevExpress licensing terms may change over time. The official DevExpress license terms applicable to your version and usage take precedence over this notice.

This notice is provided for informational purposes only and is not legal advice.