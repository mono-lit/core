# Notivue

Toast **notifications** for the template apps, built on [notivue](https://notivue.smastrom.io/).
You don't call notivue directly — you push through **`notif()`** (from
[`useMonoUtility`](../repo/useful-utils)) and render with the **`MonoNotivue`** component. It's an
**optional** dependency: skip it if an app doesn't need notifications.

## `notif()` — push a notification

`notif` is one unified call for every kind of toast. Non-error toasts auto-dismiss (~3s); `error`
sticks until dismissed; `promise` shows a pending spinner and can redirect on resolve.

```ts
import { useMonoUtility } from '@mono-lit/utility/runtime'

const { notif } = useMonoUtility()

notif({ type: 'success', message: 'Saved.' })
notif({ type: 'error', message: 'Could not save — try again.' })

// promise: pending spinner, then (optionally) route away when it resolves
notif({
  type: 'promise',
  message: 'Saving…',
  router,                                   // vue-router instance
  props: { redirect: '/data', buttons: [] },
})
```

## `MonoNotivue` — render them

`MonoNotivue` is the drop-in renderer for your app shell — it replaces the hand-wired
`<Notivue v-slot>…</Notivue>` block. Action notifications (`props.isAction`) render a custom card
with buttons; everything else uses notivue's default themed toast.

```vue
<script setup lang="ts">
import { MonoNotivue } from '@mono-lit/utility/runtime'
</script>

<template>
  <main>
    <MonoNotivue />
    <RouterView />
  </main>
</template>
```

`MonoNotivue` only **renders**. Each app still registers the notivue plugin + CSS once (below).

## Per-template setup

Notivue is wired **differently** in each template — the shell that owns the plugin differs.

### Vue Host — manual plugin

The host owns the notification UI. In `main.ts`, import the CSS, create the plugin, and register it:

```ts
// main.ts
import 'notivue/notifications.css'
import 'notivue/animations.css'
import { createNotivue } from 'notivue'

const notivue = createNotivue({
  position: 'top-right',
  pauseOnHover: true,
  avoidDuplicates: true,
  limit: 4,
  notifications: { global: { duration: 2000 } },
})

app.use(notivue)
```

Then render `<MonoNotivue />` in `App.vue` (it replaces the old hand-wired `<Notivue v-slot>`
notification block).

### Vue Remote — standalone only

A Remote's `main.ts` runs **only when you develop the remote standalone**. Once it's federated into
a Host, the Host's app boots it — the remote's `createNotivue`/`app.use` never run, and every
`notif()` from remote code surfaces in the **Host's** single notivue instance. So the remote's own
setup is minimal (bare `<Notivue v-slot><Notification :item /></Notivue>`, CSS
`notivue/notification.css` — note the singular filename), and you don't add a second
`<MonoNotivue />` inside a federated remote.

### Nuxt Host — the `notivue/nuxt` module (SSR)

Nuxt uses notivue's **Nuxt module** instead of a manual `createNotivue`, so notifications are
SSR-aware. In `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['notivue/nuxt'],
  css: ['notivue/notifications.css', 'notivue/animations.css'],
  notivue: {
    position: 'top-right',
    pauseOnHover: true,
    avoidDuplicates: true,
    limit: 4,
    notifications: { global: { duration: 2000 } },
  },
})
```

There's no `app.use(notivue)` — the module registers it. Render `<MonoNotivue />` in `app.vue`.

## With `monoFetch`

The fetch layer integrates with Notivue through a `notif` option: pass `notif: true` and the
request routes its success / error through the same `notif()` → notivue, so the call **auto-toasts**
without you writing a handler.

```ts
import { monoFetch } from '@mono-lit/utility/fetching'

await monoFetch({ url: '/Employee', method: 'POST', body, notif: true })
```

Set it per call, or a default for every request via `monoConfigureFetching({ notif })`. Because it
funnels through the same notivue instance, it needs Notivue set up (this addon). See
[Data Fetching](../repo/data-fetching).

## Optional dependency

`notivue` is an **optional peer** of `@mono-lit/utility` — install it only in apps that show
notifications. Without it, `notif()` / `MonoNotivue` / `monoFetch({ notif: true })` simply aren't
used; everything else in `@mono-lit/utility` works unchanged.
