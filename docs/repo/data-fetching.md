# Data Fetching

To set up fetching, you need three things: a base URL, a token, and the fetch function. Mono ships with all of them.

Inside your `mono.config.ts`, define a `fetching` object. `api` is a **named map** — each entry has a required `url`, a `type` (`'restful'` or `'odata'`), and, for odata, its own `oDataService`. The shared DevExtreme source constructors (`dataSource` / `oDataStore` / `customStore`) are the same for every odata API, so they live once on `fetching.source`:

```ts
import { defineConfig } from '@mono-lit/utility/config'
import DataSource from 'devextreme/data/data_source'
import ODataStore from 'devextreme/data/odata/store'
import CustomStore from 'devextreme/data/custom_store'
import { DefaultService } from './odata/DefaultService'

export default defineConfig({
    name: 'mono-vue',
    fetching: {
        api: {
            Posts: {
                type: 'restful',
                url: 'https://jsonplaceholder.typicode.com',
            },
            MyApi: {
                type: 'odata',
                url: 'https://services.odata.org/V4/Northwind/Northwind.svc',
                // unique per odata API:
                oDataService: DefaultService,
            },
        },
        // shared by every odata API:
        source: {
            dataSource: DataSource,
            oDataStore: ODataStore,
            customStore: CustomStore,
        },
    }
});

```

You then pick which named API a call uses with **`configBaseUrl: "<entryName>"`**. It resolves that entry's `url` (and, for odata, the shared `source` ctors plus that entry's `oDataService`), overriding the call's own `baseUrl`.

## Adding a JWT Token

Both fetch functions — `monoFetch` and `monoFetchOdata`, covered in [Fetching](#fetching) below — read this same config, so you define the token once and every call carries it. Set up your `mono.config.ts` like this:

```ts
import { defineConfig } from '@mono-lit/utility/config'

export default defineConfig({
  name: 'mono-host',
  fetching: {
      api: {
          Posts: {
              type: 'restful',
              url: 'https://jsonplaceholder.typicode.com',
          },
          MyApi: {
              type: 'odata',
              url: 'https://services.odata.org/V4/Northwind/Northwind.svc',
          },
      },
      auth: {
          use: {
              // sent on every API request
              apiRequest: 'Your_Refresh_Token',
              // sent as the Bearer ON the refresh request itself
              refreshTokenRequest: 'Your_Token',
          },
      },
  },
  cookie: [
    {
      name: 'Your_Token',
      split: true,
    },
    {
      name: 'Your_Refresh_Token',
    }
  ],
});
```

`use` names cookies you already declared in `cookie[]` — so each one's `split` flag is
inherited from there rather than restated. The two keys say **what each cookie is for**:

| Key | The cookie that… |
| --- | --- |
| `apiRequest` | goes out as the Bearer on every `monoFetch` / `monoFetchOdata` call |
| `refreshTokenRequest` | authenticates the **refresh call itself** — typically the JWT you got at login |

::: tip They're meant to look backwards
In the example above, `apiRequest` names the *refresh* cookie and `refreshTokenRequest` names
the *login* one. That is not a typo. Which cookie you send on an API call and which one buys
you a new token are separate questions, and in this backend they happen to be the opposite of
what the names suggest. Read each key as "the cookie used **for** this", not "the cookie
**called** this".
:::

::: tip Migrating
The older form — `auth: { token, tokenRefresh, use: 'tokenRefresh' }` — still works, but it
can't drive the automatic refresh below. `use` has to name the cookies for that.
:::

### Reading the cookie names in your app

Login, logout and route guards still need the cookie names by hand. Resolve them **once**, from
the config, and export them alongside it:

```ts
// src/datas/config.ts (Vue)  ·  app/datas/config.ts (Nuxt)
const monoConfig = __MONO_CONFIG_EXPOSE__

const use = monoConfig.fetching?.auth?.use

const authCookie = {
  /** the JWT written at login; also the Bearer sent ON the refresh request */
  jwt: typeof use === 'object' ? String(use.refreshTokenRequest) : '',
  /** the token sent on every API request — what a refresh re-issues */
  jwtRefresh: typeof use === 'object' ? String(use.apiRequest) : '',
}

export default {
  ...monoConfig,
  authCookie,
}
```

Then read `appConfig.authCookie.jwt` wherever you need it. `use` also accepts the legacy string
form, so it has to be narrowed before you can read `.apiRequest` off it — doing that here, once,
keeps the `typeof` check out of every call site.

::: warning Don't reach for `auth.token` / `auth.tokenRefresh`
Those keys are deprecated, and reading them once you've moved to `use` gives you `undefined` —
which `String()` happily turns into a cookie **named `"undefined"`**. No error, no warning: every
request just goes out unauthenticated and every guard sees a logged-out user.
:::

## Fetching

Call `monoFetch` as your fetch function. Point it at a named entry with `configBaseUrl`, or pass a `baseUrl` directly.

`monoFetchOdata` works the same way, but targets an `odata` entry — `configBaseUrl` resolves both the base URL **and** the source constructors from that entry. The difference is the **options** field, which shapes the OData result.

::: code-group

```vue [Normal Fetching]
<script setup lang="ts">
import { monoFetch } from '@mono-lit/utility/fetching'

let fetchPostData = async () => {
  // resolves the base URL from the "Posts" entry in mono.config.ts
  const response = await monoFetch('/posts', {
    configBaseUrl: 'Posts',
    // or pass the base URL directly instead:
    // baseUrl: 'https://jsonplaceholder.typicode.com',
    method: 'GET'
  })
  // the response is available here
  console.log({response})
}
</script>
<template>
  <div>
    <button @click="fetchPostData()">
     Test Fetching
    </button>
  </div>
</template>
```

```vue [OData Fetching]
<script setup lang="ts">
import { monoFetchOdata } from '@mono-lit/utility/fetching'

let fetchBrandData = async () => {
  // resolves the base URL + source constructors from the "MyApi" odata entry
  const response = await monoFetchOdata({
    configBaseUrl: 'MyApi',
    url: '/DTO_Brand',
    method: 'GET',
    type: 'data',
    options: {
      key: 'Id',
      select: ['Id', 'Nama'],
      sort: [
        {
          selector: 'Id',
          desc: true,
        }
      ]
    }
  })
  // the response is available here
  console.log({response})
}
</script>
<template>
  <div>
    <button @click="fetchBrandData()">
     Test Fetching
    </button>
  </div>
</template>
```

:::

## Automatic Token Refresh

Add `requestRefreshTokenRequest` and mono refreshes the token for you — proactively before a
request, and again on a `401` (the request is then retried once). Without it, nothing
refreshes: the token is simply read from its cookie and sent.

```ts
auth: {
    use: {
        apiRequest: 'Your_Refresh_Token',
        refreshTokenRequest: 'Your_Token',
    },
    requestRefreshTokenRequest: {
        // the cookie the new token is written back to
        name: 'Your_Refresh_Token',
        // where to find each value in the RESPONSE body
        path: {
            milis: 'Expired',
            value: 'RefreshToken',
        },
        splitCookie: false,
        fetchParams: {
            url: '/Auth/RefreshToken',
            options: {
                method: 'POST',
                baseUrl: import.meta.env.VITE_API_BASE_URL,
            },
        },
    },
},
```

The refresh request authenticates itself with the `use.refreshTokenRequest` cookie — you
don't attach it by hand. `name`, `splitCookie` and `baseUrl` are all optional:

| Omitted | Falls back to |
| --- | --- |
| `name` | the `apiRequest` cookie |
| `splitCookie` | that cookie's `split` flag, as declared in `cookie[]` |
| `baseUrl` | a **`restful`** entry in `fetching.api` — the one the triggering call used if it is REST, otherwise the first `restful` entry you declared (and finally any `restBaseUrl` set via `monoConfigureFetching`) |

::: warning Set `baseUrl` explicitly
A refresh endpoint is a REST route, but the call that *triggers* a refresh is often an OData
one — and an OData entry's `url` is the `/odata` root. That's why the fallback hunts for a
`restful` entry rather than reusing the triggering call's base: inheriting it would POST
`/odata/Auth/RefreshToken` and 404 on every refresh, from a config that reads perfectly fine.
The fallback covers the common case; naming the base yourself removes the guesswork.
:::

::: warning `path.milis` (or `path.days`) is required
That's the cookie **lifetime**, read out of the response. With neither, the refreshed token
is never written to the cookie — the refresh appears to succeed and changes nothing, and
every subsequent request still carries the old token. mono warns at runtime if you omit it.
:::

### Which token actually gets sent

In precedence order: a `token` passed on the call itself, then one set via
`monoConfigureFetching({ token })`, then the `use.apiRequest` cookie. The same rule applies to
`config` and `tokenOptions` — pass your own on a call and it wins over the config.

mono reads that cookie **live** on every request rather than trusting the value hydrated at
boot. It has to: a refresh writes the new token straight to `document.cookie`, so reading the
hydrated copy would keep sending the pre-refresh token forever. The refreshed token is picked
up by the very next call, and mono state is patched to match.

### Where the request goes when refresh fails

`unauthCall` is the usual answer: it fires when a token is expired and the refresh couldn't save
it. It needs the router, so it's registered at runtime rather than in `mono.config.ts`.

::: code-group

```ts [Vue — src/main.ts]
import { monoConfigureFetching } from '@mono-lit/utility/fetching'
import router from './router'

monoConfigureFetching({
    unauthCall: () => router.push('/'),
})

app.use(createMono(monoConfig))
app.use(router)
```

```ts [Nuxt — app/plugins/mono.ts]
import { monoConfigureFetching } from '@mono-lit/utility/fetching'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    const router = useRouter()

    monoConfigureFetching({
      unauthCall: () => router.push('/'),
    })
  }

  nuxtApp.vueApp.use(createMono(monoConfig))
})
```

:::

The blunt alternative — reload the page and let the app re-bootstrap:

```ts
auth: { expiredBehaviour: 'refresh' }
```

Registering `unauthCall` **short-circuits** `expiredBehaviour` — set both and only
`unauthCall` runs.

::: info Mock API
Requests served by [`mockIndexedDB`](/repo/mock-api) never carry a token and never trigger a
refresh. The mock has no auth surface, so you can leave `auth` fully configured while
developing against it.
:::
