# Useful Utils

Every public API `@mono-lit/utility` ships, grouped by entry point. Type-only exports are left out —
import them from the same entry as the value they belong to.

**Reach for these before writing custom code** (Rule 13 in [Template Rules](../ai/template)).

## `@mono-lit/utility/runtime`

App runtime: config, state, cookies, JWT, and the helper bundles.

| API | What it is |
| --- | --- |
| `createMono(config)` | Vue plugin — `app.use(createMono(monoConfig))`. |
| `initMono(config)` | The federation init `createMono` wraps. |
| `monoConfig()` | The resolved `mono.config.ts` at runtime. |
| `monoEnv()` | Resolved `env` block. |
| `monoState()` | Reactive mono state — `cookie`, `jwt`, `env`, `menu`. |
| `monoStatePatch()` / `monoStateReset()` | Patch / reset that state. |
| `monoUseState()` / `useState()` | Nuxt-style shared state, usable in a Vue app. |
| `nuxtStateKeys()` / `clearNuxtState()` | Inspect / clear those state keys. |
| `monoProvide()` / `monoInject()` | Cross-app provide/inject — see [Provide & Inject](./provide-inject). |
| `monoCookie()` / `useMyCookie()` | Cookie read/write. |
| `monoJwt()` / `useMyJwt()` | Decode a JWT cookie (`cookieDecode`). |
| `monoToken()` / `useMyToken()` | Raw token access. |
| `monoStorage()` / `useMyStorage()` | Local/session storage. |
| `useMyFetch()` | Re-export of the fetching helper. |
| `setMonoEventResolver(fn)` | Server-side cookie source for Nuxt — set in `app/plugins/mono.ts`. |
| `defineLayout(...)` | Declare a layout for the federated layout resolver. |
| `MonoNotivue` | Notification renderer component. |
| `MonoNotifAction` | The action-notification card `notif` renders. |
| `useMonoUtility()` / `useMonoUtils()` | The helper bundle below (`useMonoUtils` is an alias). |
| `useUtils()` | Same bundle as `useMonoUtility()` (older name). |

### `useMonoUtility()` helpers

| Helper | Signature | What it does |
| --- | --- | --- |
| `notif` | `notif(options): Promise<void>` | Success / info / warning / error / promise toast, optional routing + redirect. |
| `validateAllSchema` | `({ schema, input, error }, cb?): Promise<boolean>` | Validate a whole form object against a Yup schema. |
| `validateSchema` | `({ schema, field, input, error }, cb?): Promise<boolean>` | Validate a single field. |
| `validateAllSchemaCheck` | `(error): boolean` | `true` if any field is currently invalid. |
| `clearSchemaValidation` | `({ error })` | Recursively reset all errors. |
| `replacerData` | `({ fn, type, item, key, items })` | Add / update / remove a row in an array or a DevExtreme DataSource. |
| `filterOrIn` | `(field, values, combine?)` | Build an OData `in` / chained `or` filter. |
| `dxFilterToString` | `({ filter, encode? })` | DevExtreme filter object → OData v4 `$filter` string. |
| `isDate` | `(value): value is Date` | Valid `Date` or parseable date string/number. |
| `isJSONString` | `({ input, strict?, root? })` | Is this string valid JSON. |
| `safeJSONParse` | `(str): any` | Parse JSON with fallbacks; `null` on failure. |

`filterOrIn(field, values, combine?)` has two output shapes, and they are not
interchangeable:

```ts
filterOrIn('OrderID', [1, 2])        // [['OrderID','=',1], 'or', ['OrderID','=',2]]
filterOrIn('OrderID', [1, 2], true)  // ['OrderID', 'in', [1, 2]]
```

The default `or` chain is what a **DevExtreme store** understands — pass it to
`store().load({ filter })` or a DataSource.

The `combine: true` form is for the **string** path only: `dxFilterToString`
renders it as `OrderID in (1,2)`, for a URL you build yourself. It does not
survive a round trip back into a store, in either direction:

| what you pass to `store().load({ filter })` | what is sent | result |
| --- | --- | --- |
| `['OrderID','in',[1,2]]` | *nothing* | throws `E4003 — Unknown filter operation is used: in` |
| `['OrderID in (1,2)']` | `OrderID in (1,2) eq true` | 400 |
| `'OrderID in (1,2)'` | `OrderID in (1,2) eq true` | 400 |
| `[['OrderID in (1,2)']]` | `(OrderID in (1,2) eq true)` | 400 |
| `filterOrIn('OrderID',[1,2])` | `(OrderID eq 1) or (OrderID eq 2)` | **200** |

A lone string is read by DevExtreme as a boolean-field shorthand, so it always
gets ` eq true` appended — there is no raw-`$filter` passthrough through
`filter`. To send a literal `$filter`, set it in the store's `beforeSend` and
leave `filter` out of the load options.

Note also that `in` is OData **4.01**. A 4.0 service rejects it outright — the
public Northwind endpoint answers
`Microsoft.OData.Core.ODataException: Syntax error at position 10` — while
TripPin accepts it.

Yup is an optional peer — see the [Yup](../addons/yup) and [Notivue](../addons/notivue) addons.

## `@mono-lit/utility/fetching`

See [Data Fetching](./data-fetching) and [DataSource](../odata/datasource).

| API | What it is |
| --- | --- |
| `monoFetch` | REST fetch with auth, refresh and error handling. |
| `monoFetchOdata` | OData fetch. |
| `monoFetchOdataUnique` | OData fetch for a single entity. |
| `monoCreateFetcher` | Build a reusable fetcher. |
| `monoStaticDataSource` | DataSource over a static array. |
| `monoTryCatchDatasource` | Wrap a DataSource with error handling. |
| `monoLoadChuckStores` | Chunked store loading. |
| `monoConfigureFetching` / `monoResetFetchingConfig` | Set / clear runtime fetching options (e.g. `unauthCall`). |
| `monoFetchingRuntime` | The current resolved fetching runtime. |
| `monoRestBaseUrl` / `monoOdataBaseUrl` / `monoOdataSource` | Resolved API bases and OData service. |
| `monoRequestToken` | Token sent on requests. |
| `monoMockDb` / `resetMonoMockDb` | Mock IndexedDB backend — see [Mock API](./mock-api). |
| `promiseWrapper` | Await a promise into an error/data pair. |

## `@mono-lit/utility/vite`

Everything a Vue Host or Remote wires in `vite.config.ts` — see [Setup](./setup).

| API | What it is |
| --- | --- |
| `monoRepo(options?)` | **The entry point.** `await monoRepo({ command })` → `mono.pages` / `layouts` / `components` / `autoImport` / `vite()` / `ecosystem()`. |
| `monoVite(ctx, opts?)` | The mono plugin set — register **last**. |
| `monoVue(options?)` | Compat plugins for a Vue app against a Nuxt Host — the hybrid pairing, possible but risky (alias: `monoNuxtHost`); register before `VueRouter()`. |
| `monoPages` / `monoPagesOptions` | vue-router routesFolder + `extendRoute`, own and federated. |
| `monoLayouts` / `monoLayoutsOptions` | `layoutsDirs`, driven by `template`. |
| `monoComponents` / `monoComponentsOptions` | unplugin-vue-components dirs. |
| `monoAutoImport` / `monoAutoImportOptions` | unplugin-auto-import dirs + imports. |
| `monoExtendRoute(options?)` | The `extendRoute` that stamps `meta.layout`. |
| `reconcileEcoPlugins(plugins)` | Stand down a duplicate ecosystem plugin. |
| `sanitizeForExpose(value)` | The sanitiser behind `__MONO_CONFIG_EXPOSE__`. |
| `ecoKeyForSub(sub)` / `MONO_ECO_SUB_KEYS` / `MONO_ECO_PLUGIN_NAMES` | Ecosystem key lookup tables. |
| `createRootLoader(rootDir)` / `canResolveFromRoot(rootDir, id)` | Resolve a module from an app root. |
| `parsePageMeta` / `parsePageMetaFromFile` | Read `definePageMeta` / `definePage` blocks. |

**Nuxt-compat transforms** (added automatically when a federated app is `type: 'nuxt'`):
`monoStripPageMeta`, `monoPageMetaToDefinePage`, `monoLayoutSlotToRouterView`, `monoNuxtState`,
`monoNuxtStateToRef`, `monoNuxtLink`, `monoNuxtLinkToRouterLink`, `monoRouterLink`,
`monoRouterLinkToNuxtLink`.

## `@mono-lit/utility/nuxt` · `@mono-lit/utility/nuxt-runtime`

| API | What it is |
| --- | --- |
| `@mono-lit/utility/nuxt` (default) | The Nuxt module — aliases, `server.fs.allow`, the config define, ecosystem merge. Add to `modules[]`. |
| `setMonoEventResolver(fn)` | Server-side request resolver. |
| `monoCookieDriver` / `monoCookieStorage` | h3-backed cookie driver for SSR. |

## `@mono-lit/utility/config`

Loaded by `mono.config.ts` itself — see [Config](./config).

| API | What it is |
| --- | --- |
| `defineConfig(config)` | Define `mono.config.ts`. |
| `resolveMonoConfig(config)` | Resolve the `extends` chain into one config. |
| `resolveExtendsAppNames` / `resolveExtendsEcosystems` | Which layers and directories are switched on. |
| `resolveEnv(...)` | Resolve the `env` block. |
| `srcDirForType(type)` / `MONO_SRC_DIR` | `'vue'` → `src/`, `'nuxt'` → `app/`. |
| `dedupeBy` / `dedupeConfigArrays` | Merge helpers for the name-keyed arrays. |

Types: `MonoConfig`, `MonoAppConfig`, `MonoAppType`, `MonoTemplate`, `MonoEnvConfig`,
`MonoFetchingConfig`, `MonoJwtConfig`, `MonoApiEntry`, `MonoAuthConfig`, `MonoMockDbConfig`,
`MonoSyncTransport`, `JWTCompleteTokenTypes`, `SidebarMenu`, `Permission`.

## `@mono-lit/utility/config/node`

Node-only — what the CLI and the build integrations use.

| API | What it is |
| --- | --- |
| `loadMonoConfig` / `getMonoConfig` | Load `mono.config.ts` outside the browser (c12/jiti). |
| `monoAlias(options?)` | Build the `@mono-*` alias map. |
| `monoTsconfigPaths` / `buildMonoTsconfig` / `runMonoPrepare` | What `mono prepare` runs. |
| `monoMissingApps` / `formatMissingApps` / `monoStubAliases` | Report and stub apps not yet synced. |
| `extractConfig` / `extractConfigName` / `stripCommentsSafe` | Static parse of the config text (how `type` is read before eval). |
| `MONO_DIR` / `MONO_APPS_DIR` / `MONO_TSCONFIG_REF` | `.mono/` path constants. |

Skills / session storage (`mono skills`): `isSkillsEnabled`, `readToken`, `loadSkillsEnv`,
`detectActor`, `ghRepoMeta`, `ghBranchExists`, `ghGetContent`, `ghPutFile`, `ghTree`,
`GithubHttpError`, `normalizeAppId`, `resolveAppId`, `isGenericAppName`, `stagingRoot`,
`loadStagedSession`, `listSessions`, `validateStagedSession`, `moveToFailed`, `removeSession`,
`cacheDir`, `chunkConversation`, `redact`, `redactBuffer`, `buildSavePlan`, `runSave`,
`runRead`, `runSearch`, `runCheck`, `runSessionShow`.

## `@mono-lit/utility/mock-db`

The browser mock backend — see [Mock API](./mock-api).

| API | What it is |
| --- | --- |
| `createMockDb` / `openMockDb` / `monoMockDb` / `resetMonoMockDb` | Create, open, access, reset the database. |
| `createMockStore` | A store over one entity. |
| `parseMockSchema` | Parse the `mockIndexedDB` schema. |
| `generateSeed` / `createRandom` / `orderEntitiesByDependency` | Seed generation. |
| `executeQuery` / `matchMockRoute` / `toODataEnvelope` | Serve an OData request. |
| `parseQuery` / `parseFilter` / `parseExpand` / `parseApply` / `parseField` / `parseKeySegment` / `tokenize` / `normalizeSegment` | OData query parsing. |
| `evaluateFilter` / `applyTransforms` | Apply `$filter` / `$apply` in memory. |
| `isIndexedDbAvailable` | Environment check. |

## `@mono-lit/utility` (root)

| API | What it is |
| --- | --- |
| `monoEcosystem(options)` | Resolve ecosystem directories by hand. |
| `mergeEcosystem(...)` | Merge two ecosystem sets. |
| `htmlPath` / `htmlToVue` | Resolve an HTML file and turn it into a Vue component. |
