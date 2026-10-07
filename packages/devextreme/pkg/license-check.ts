// Internal (not exported): make DevExtreme run its OWN license validation in the browser.
//
// This package only re-exports DevExtreme's data layer, and DevExtreme validates the
// license when its first UI component is constructed (`DOMComponent.ctor` →
// `validateLicense(config().licenseKey)`). An app that only uses the data classes would
// therefore never see DevExtreme's license check. Constructing one throwaway LoadIndicator
// lets DevExtreme perform that check itself and emit its own messages — nothing here
// reads the key, judges it, or prints anything.
//
// - Browser only: on the server (Nuxt/Nitro, any SSR) there is no DOM to build a
//   component on, so this is a no-op there; it runs in the client after hydration.
// - Once per runtime: the flag lives on `globalThis` under a `Symbol.for` key, so even two
//   copies of this package in one page trigger it once.
// - Deferred until the window `load` event: DevExtreme validates only ONCE and reads the
//   key at that moment, so running before the app calls `config({ licenseKey })` would
//   make a licensed app look unlicensed. By `load`, `main.ts` and Nuxt plugins have run.
//   If the app builds a real DevExtreme widget first, DevExtreme has already validated and
//   this throwaway component changes nothing.
// - Never breaks the app: every failure of this helper is swallowed. DevExtreme's own
//   console output and trial panel are left untouched.

const LICENSE_CHECK_FLAG = Symbol.for('@mono-lit/devextreme.licenseCheck')

type FlaggedGlobal = typeof globalThis & { [LICENSE_CHECK_FLAG]?: true }

async function runLicenseCheck(): Promise<void> {
  try {
    // Dynamic import: the widget code is only fetched in the browser, after `load`.
    const mod = await import('devextreme/ui/load_indicator')
    // CJS interop can hand back the whole `exports` object as `default`. DevExtreme classes
    // also carry an unrelated static `default`, so pick the candidate that is the widget.
    const candidate: any = mod.default
    const LoadIndicator: typeof mod.default =
      typeof candidate?.prototype?.dispose === 'function' ? candidate : candidate?.default
    // Detached element — never appended to the document.
    const element = document.createElement('div')
    const instance = new LoadIndicator(element)
    instance.dispose()
  } catch {
    // Our helper failed (chunk load error, missing DOM API, …) — never break the app.
  }
}

export function scheduleDevExtremeLicenseCheck(): void {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    const g = globalThis as FlaggedGlobal
    if (g[LICENSE_CHECK_FLAG]) return
    g[LICENSE_CHECK_FLAG] = true

    const run = () => {
      setTimeout(() => {
        void runLicenseCheck()
      }, 0)
    }
    if (document.readyState === 'complete') run()
    else window.addEventListener('load', run, { once: true })
  } catch {
    // Never break the consuming application.
  }
}
