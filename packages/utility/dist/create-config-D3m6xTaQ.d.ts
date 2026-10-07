import { VNode } from "vue";

//#region src/composables/create-config.d.ts
interface Permission {
  permId: number;
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canApprove: boolean;
  canReport: boolean;
}
interface DefaultJWTTokenTypes {
  nbf?: number;
  exp?: number;
  iat?: number;
}
interface JWTCompleteTokenTypes extends DefaultJWTTokenTypes {
  USER_ID?: string;
  USER_NAME?: string;
  NAME?: string;
  CHANNEL?: string;
  IS_DEPT_HEAD?: '0' | '1';
  ROLE_ID?: string;
  ROLE_NAME?: string;
  ROLE_TYPE?: string;
  ORG_NAME?: string;
  JOBPOS_ID?: string;
  JOBPOS_NAME?: string;
  JOBLVL_ID?: string;
  JOBLVL_NAME?: string;
  COMPANY_DB?: string;
  DEPT_CODE?: string;
  IS_SUPERADMIN?: '0' | '1';
  COMPANY_ID?: string;
  IS_LOCK_BUDGET?: '0' | '1';
  ALL_DEPARTMENT?: '0' | '1';
  ALL_COMPANY?: '0' | '1';
  ALL_BRAND?: '0' | '1';
  ALL_AREA?: '0' | '1';
  IS_APPROVAL_PROGRAM?: '0' | '1';
  USER_BRAND?: string;
  USER_AREA?: string;
  TOKEN_KIND?: 'ACCESS' | 'REFRESH';
  EXPIRED?: string;
  PERMISSIONS?: Permission[] | string;
}
/**
 * One JWT the app carries.
 *
 * `name` is either the cookie to decode, or — the dev-mode form — an already-decoded
 * claims object, which is assigned straight into state:
 *   `name: import.meta.env.PROD ? 'MONO_token' : { ...decodedAtBoot }`
 */
interface MonoJwtEntry<T extends object = Record<string, any>> {
  name: string | T;
  split?: boolean;
}
/**
 * The `jwt` block. `token` and `refreshToken` are named — so they keep their autocomplete
 * and their own claim types — but ANY key is allowed, for an app that carries a third JWT
 * (a vendor token, an impersonation token, a second identity provider). Each one hydrates
 * into `monoState().jwt.<key>`.
 *
 * The index signature lives in a separate intersection member on purpose: inside a single
 * object type, TS would force `token` and `refreshToken` to be assignable to it, collapsing
 * their specific claim types into the generic entry.
 *
 * One cost worth knowing: an index signature turns OFF excess-property checking for the
 * block, so a mis-cased key (`refreshtoken`) compiles. `initMono` warns about that at
 * runtime, because the type system no longer can.
 */
type MonoJwtConfig = {
  token?: MonoJwtEntry<JWTCompleteTokenTypes>;
  refreshToken?: MonoJwtEntry<DefaultJWTTokenTypes>;
} & {
  [key: string]: MonoJwtEntry | undefined;
};
interface SidebarMenu {
  title: string;
  subtitle?: string;
  url?: string;
  icon?: string;
  color?: string;
  button?: {
    title?: string;
    icon?: string;
  };
  items?: SidebarMenu[];
  remoteName?: string;
  visible?: boolean;
  order?: number;
  route?: {
    meta: {
      layout: string;
      title: string;
    };
  };
}
/**
 * The kind of app, which decides its source-folder convention:
 * - `vue`  -> source under `src/`  (Vue/Vite apps)
 * - `nuxt` -> source under `app/`  (Nuxt apps)
 *
 * Consumed by `monoAlias`/`monoEcosystem` to resolve `@<app>` aliases and remote
 * folder discovery to the right subdir, instead of assuming `src/` everywhere.
 */
type MonoAppType = 'vue' | 'nuxt';
/** Source subdir for each app kind. The single place the convention lives. */
declare const MONO_SRC_DIR: Record<MonoAppType, string>;
/** Map an app `type` to its source subdir (`vue` -> `src`, `nuxt` -> `app`). */
declare function srcDirForType(type: MonoAppType): string;
/**
 * Which side of a federation this app is.
 *
 * Orthogonal to {@link MonoAppType}: `type` says where the source lives (`src/`
 * or `app/`), `template` says whether this app OWNS the shared shell or CONSUMES
 * it. Either kind of app can be either role — read by `mono.vite()` for a Vite
 * app and by the `@mono-lit/utility/nuxt` module for a Nuxt one.
 */
type MonoTemplate = 'host' | 'remote';
/**
 * How `mono sync` reaches a remote app's repository.
 *
 * - `auto`  (default) probe the machine's own git credentials first — one
 *           `git ls-remote`, no token, no GitHub REST rate limit. Falls back to
 *           `envToken` + the REST/archive-ZIP path if this machine has no access.
 * - `git`   git transport only. Fails the app instead of falling back, so a CI
 *           runner with a missing credential errors loudly rather than silently
 *           burning the shared PAT.
 * - `token` legacy behaviour: always REST + archive ZIP (needs `unzip` on PATH).
 *
 * Overridable for every app at once with `MONO_SYNC_TRANSPORT`.
 */
type MonoSyncTransport = 'auto' | 'git' | 'token';
/**
 * A remote app this host federates — from a clone (`url`, materialised by
 * `mono sync` into `.mono/apps/<name>`) or read in place (`path`, a sibling
 * folder in a mono-lith). Every command reads the same directory; `mono sync`
 * only ever writes and deletes inside `.mono/apps`.
 */
interface MonoAppConfig {
  name: string;
  /**
   * Where `mono sync` clones this app from (a GitHub URL, optionally with
   * `/tree/<ref>[/<dir>]`).
   *
   * Optional when `path` is set: in a mono-lith the app is read from its
   * sibling folder and there is nothing to clone. Keep it anyway if this app
   * may be lifted out of the lith into a standalone checkout — there the
   * `path` directory is absent, and `mono sync` falls back to the `url`.
   *
   * An entry with neither `url` nor `path` is a config error.
   */
  url?: string;
  /**
   * Read this app from a directory instead of a clone. **Authoritative in
   * every command** — dev, build, `mono prepare`, `mono sync`, `mono env`,
   * the Nuxt module — so a mono-lith (every app a sibling folder of one repo)
   * builds from exactly what dev served:
   *
   * ```ts
   * // apps/esw-host/mono.config.ts
   * apps: [
   *   { name: 'esw-project', path: '../esw-project', url: 'https://github.com/org/esw-project/tree/mono', type: 'vue' },
   * ]
   * ```
   *
   * Resolved against the app root, absolute paths kept as-is. Rules:
   *
   * - **The directory wins.** `.mono/apps/<name>` is not read while `path`
   *   resolves, and a stale clone there is left alone (never deleted).
   * - **A missing directory falls back to the clone when `url` is set**, with
   *   one warning — your machine reads the sibling, a checkout that was lifted
   *   out of the lith syncs from GitHub. With no `url` it is an error: there is
   *   nothing to fall back to.
   * - **Nothing here is ever written to or deleted.** `mono sync` prunes only
   *   inside `.mono/apps`, and `mono prepare` never touches a sibling's
   *   `tsconfig.json` — each sibling runs its own prepare.
   * - **Static literal, forward slashes.** `mono.config.ts` is text-parsed
   *   before it can be executed, so a computed path yields no alias; and the
   *   literal is evaluated as JS, so `'..\esw-x'` loses its backslash.
   *
   * See the Mono-Lith docs.
   */
  path?: string;
  /**
   * Env var holding a GitHub PAT. Only read on the token transport, so it is
   * optional: if every machine that syncs this app is a repo collaborator, the
   * git transport covers it and no token is needed at all.
   */
  envToken?: string;
  /** Sync transport for this app. @default 'auto' */
  transport?: MonoSyncTransport;
  /**
   * App kind / folder convention. `vue` -> `src/`, `nuxt` -> `app/`. Lets the
   * host resolve this remote's `@<name>` alias and synced folders to the
   * correct subdir (a Nuxt remote keeps source under `app/`, not `src/`).
   */
  type: MonoAppType;
}
/**
 * The DevExtreme source constructors shared across every OData API in an app.
 * These are the same classes for all OData entries, so they live once at the
 * `fetching.source` level instead of being repeated per entry. The per-API
 * service constructor (`oDataService`) stays on each {@link MonoApiEntry}.
 */
interface MonoOdataSource {
  /** DevExtreme `DataSource` constructor (shared across all odata APIs) */
  dataSource?: any;
  /** DevExtreme `ODataStore` constructor (shared across all odata APIs) */
  oDataStore?: any;
  /** DevExtreme `CustomStore` constructor (shared across all odata APIs) */
  customStore?: any;
}
/**
 * A single named API entry.
 *
 * `url` is always required. `type` is a flag: `'odata'` entries may additionally
 * carry their own `oDataService` constructor (it differs per API). The shared
 * DevExtreme source ctors live on `fetching.source`, not here.
 */
interface MonoApiEntry {
  type: 'restful' | 'odata';
  url: string;
  /** odata only — the OData service constructor, unique to this API */
  oDataService?: any;
}
interface MonoFetchingConfig {
  /**
   * Named map of APIs. Pick one per call with `configBaseUrl: "<entryName>"`.
   *
   * @example
   * api: {
   *   Posts: { type: 'restful', url: 'https://jsonplaceholder.typicode.com' },
   *   MyApi: { type: 'odata', url: '.../odata', oDataService: DefaultService },
   * }
   */
  api?: {
    [key: string]: MonoApiEntry;
  };
  /**
   * Shared DevExtreme source constructors, reused by every odata API entry.
   *
   * @example
   * source: { dataSource: DataSource, oDataStore: ODataStore, customStore: CustomStore }
   */
  source?: MonoOdataSource;
  auth?: MonoAuthConfig;
}
/**
 * The request that swaps an expiring token for a fresh one.
 *
 * Mirrors `MonoFetchCookieOptions` (src/token), which is what the core fetch layer ultimately
 * receives. You supply the endpoint and where to find the new token in its response;
 * the `Authorization` header and the `{ username }` body are filled in for you from
 * the `use.refreshTokenRequest` cookie.
 */
interface MonoRefreshRequestConfig {
  /**
   * The cookie this re-sets with the new token. Defaults to `use.apiRequest` — i.e.
   * the token the app sends on normal requests, which is the one that has to stay fresh.
   */
  name?: string;
  /**
   * Where to find the pieces in the refresh response body (dot-paths).
   *
   * `value` is the new token. **One of `milis` / `days` is REQUIRED** — it is the
   * cookie's lifetime, and without it the cookie is never written: the refresh appears
   * to succeed and silently changes nothing.
   *
   * @example path: { milis: 'Expired', value: 'RefreshToken' }
   */
  path: {
    milis?: string;
    days?: string;
    value?: string;
    name?: string;
  };
  /** Defaults to whatever `cookie[]` declares for `name`. */
  splitCookie?: boolean;
  fetchParams: {
    url: string; /** Any `RequestInit` field, plus `baseUrl` (defaults to the resolved REST base url). */
    options?: Record<string, any> & {
      baseUrl?: string;
    };
  };
}
interface MonoAuthConfig {
  /** @deprecated Name the cookies in `use` instead. Still honoured. */
  token?: string;
  /** @deprecated Name the cookies in `use` instead. Still honoured. */
  tokenRefresh?: string;
  /**
   * Which cookie goes on which request. The object form names **cookies** — entries of
   * the top-level `cookie[]` array — so each one's `split` flag is inherited from there
   * rather than restated here.
   *
   * @example
   * use: {
   *   apiRequest: 'MONO_tokenRefresh',       // sent on every API request
   *   refreshTokenRequest: 'MONO_token',     // sent as the Bearer ON the refresh request
   * }
   *
   * The legacy string form (`'token'` | `'tokenRefresh'`) picks which of the deprecated
   * `token` / `tokenRefresh` names to send on API requests, and is still supported.
   */
  use?: 'token' | 'tokenRefresh' | {
    apiRequest?: string;
    refreshTokenRequest?: string;
  };
  /**
   * Enables **automatic token refresh** — proactively when the token is expiring, and
   * on a 401 (the request is retried once).
   *
   * Omit it and nothing refreshes, which is the behaviour mono had before this existed.
   */
  requestRefreshTokenRequest?: MonoRefreshRequestConfig;
  /**
   * What to do when a request is unauthorized and no refresh could save it.
   * Only consulted when no `unauthCall` is registered via `monoConfigureFetching`.
   */
  expiredBehaviour?: 'refresh';
}
/**
 * A single `extends` source.
 *
 * - `string` / `[string, options]` — a local path, npm package, or remote
 *   source (e.g. `github:org/repo`). Resolved only by the C12 node loader
 *   (`@mono-lit/utility/config/node` → `getMonoConfig`). Ignored at runtime.
 * - object — an already-imported config object. Merged at runtime by
 *   `createMono`/`initMono`, so this is the browser-safe form (functions
 *   such as DevExtreme source constructors are preserved).
 * - thunk `() => config` — a lazy getter, called at resolve-time. Use this when
 *   two configs extend each other (mono-host ⇄ mono-vue): a thunk dodges the
 *   ESM circular-import trap where a direct object would still be `undefined`
 *   when this module evaluates. e.g. `extends: [() => monoHostConfig]`.
 * - `{ config, merges?, ecosystems? }` — the selective form, taking only part of
 *   a layer. See {@link MonoConfigExtendsOptions}.
 */
type MonoConfigExtendsEntry = MonoConfigExtendsOptions | string | [string, Record<string, any>] | MonoConfigLayer | (() => Partial<MonoConfig> | undefined);
/**
 * A plain, already-imported config object used as an `extends` layer.
 *
 * The three {@link MonoConfigExtendsOptions} keys are excluded on purpose.
 * `Partial<MonoConfig>` makes every key optional, so *any* object is
 * structurally assignable to it — which meant a selective entry with one bad
 * key (`merges: ['mockIndexedDb']`, `ecosystem` for `ecosystems`) stopped
 * matching `MonoConfigExtendsOptions` and silently landed here instead. That
 * either passed a typo through to a runtime no-op, or produced an error
 * elaborated against whichever other union member TypeScript liked best
 * (`'() => MonoConfig' is not assignable to type 'string'`), naming neither the
 * key nor the type at fault.
 *
 * `config?: never` makes the two members mutually exclusive, so anything
 * carrying a `config` key is checked — and reported — as the selective form.
 */
type MonoConfigLayer = Partial<MonoConfig> & {
  config?: never;
  merges?: never;
  ecosystems?: never;
};
/**
 * Config keys an `extends` layer is allowed to contribute.
 *
 * `name`, `type`, `template` and `skill` identify a config rather than describe
 * shared state, and `extends` is always stripped before merging, so none of the
 * five is ever taken from a layer.
 *
 * `template` matters most here: a remote extends its host, and a host declaring
 * `template: 'host'` leaking down would tell the remote to drop the host's
 * layouts — rendering it with no shell, silently.
 */
type MonoMergeableKey = keyof Omit<MonoConfig, 'extends' | 'name' | 'type' | 'template' | 'skill'>;
/**
 * The selective form of an `extends` entry: take only part of a layer.
 *
 * A bare thunk merges everything, which is still the right default. This form is
 * for the case where you want a remote's `menu` and mock data but not its
 * components, or want to ignore a host's directories while developing.
 *
 * ```ts
 * extends: [
 *   (): MonoConfig => flowAppConfig,                     // everything
 *   { config: (): MonoConfig => galleryAppConfig,
 *     merges: ['menu', 'mockIndexedDB'],
 *     ecosystems: ['pages', 'composables', 'stores'] },
 * ]
 * ```
 *
 * Both lists are allowlists, and **omitting one means "no restriction"** — so
 * `{ config }` behaves exactly like the bare thunk. An explicit `[]` means
 * "none", which is how you express config-only or directories-only.
 *
 * `ecosystems` outranks the call site: `mono.ecosystem('components')` in a Vite
 * config, and the Nuxt module's own discovery, both yield nothing for a layer
 * that did not list `components`.
 */
interface MonoConfigExtendsOptions {
  /**
   * The layer. Thunk form for the same reason as a bare entry — it dodges the
   * ESM circular-import trap between two mutually-extending configs.
   */
  config: (() => Partial<MonoConfig> | undefined) | Partial<MonoConfig>;
  /**
   * Config keys to take from this layer. Omitted = all. `[]` = none.
   *
   * `readonly` so an `as const` list is accepted; it is copied before use.
   */
  merges?: readonly MonoMergeableKey[];
  /**
   * Ecosystem sub-directories this layer may contribute (`'pages'`,
   * `'composables'`, …). Omitted = all. `[]` = none.
   *
   * Matching is segment-wise, so `'composables'` also admits
   * `'composables/shared'`, but `'composables/shared'` admits only itself.
   */
  ecosystems?: readonly string[];
}
/**
 * Configs this config extends.
 *
 * The ROOT config — the repo you are working in, the one c12 loads from `cwd` —
 * is the top-priority layer, for every key and (for `env`) in every block. Layers
 * only fill in what the root did not declare. Name-keyed arrays
 * (apps/menu/cookie) are combined and de-duped: a same-key entry from the root
 * replaces the layer's and leads the list, layer-only entries survive.
 */
type MonoConfigExtends = MonoConfigExtendsEntry[] | Exclude<MonoConfigExtendsEntry, [string, Record<string, any>]>;
/**
 * One entity (object store) in a mock schema.
 *
 * `fields` uses the mini-DSL `'<type>|<modifier>'`:
 *
 *   type     number | string | boolean | date | object | array
 *   modifier primary | foreign | <localField>-><targetEntity>:<targetKey>
 *
 * A relation modifier reads **`A->B:C` = "rows of B where `B[C] === row[A]`"**;
 * `object` yields the first match, `array` yields all of them. So a one-to-many
 * lives on the PARENT and a many-to-one on the CHILD:
 *
 * @example
 * users: { fields: { id: 'number|primary', name: 'string',
 *                    cars: 'array|id->cars:userId' } }        // parent -> children
 * cars:  { fields: { id: 'number|primary', userId: 'number|foreign',
 *                    user: 'object|userId->users:id' } }      // child  -> parent
 *
 * Relations are virtual: never stored, materialised only under `$expand`.
 */
interface MonoMockEntity {
  fields: Record<string, string>;
  /**
   * Explicit fixtures. When present they are used verbatim and the generator is
   * skipped for this entity — the escape hatch for data a generator cannot
   * invent (enum-like columns, serialized graphs, anything an app parses).
   *
   * Must be importable at BUILD time (a literal, or an imported JSON module).
   * Fetching it at runtime would break the offline/no-server guarantee.
   */
  seed?: Record<string, any>[];
}
/**
 * Browser-native mock backend. Declaring this makes every `@mono-lit/utility/fetching`
 * call whose url matches one of the `schema` base-urls resolve against
 * IndexedDB instead of the network — the same code path in dev and in a static
 * production build, so there is no server, no port and no CORS.
 *
 * Schemas from several apps merge automatically: `deepMergeLayer` deep-merges
 * plain objects key-by-key, so each app contributes its own base-url. Keep every
 * value here a KEYED OBJECT — arrays are concatenated on merge, never deduped.
 *
 * @example
 * mockIndexedDB: {
 *   schema: {
 *     'my-mock': {
 *       users: { fields: { id: 'number|primary', name: 'string' } },
 *     },
 *   },
 * }
 */
interface MonoMockDbConfig {
  /** IndexedDB database name. Default `mono-mock`. */
  dbName?: string;
  /**
   * Schema version. Bumping it WIPES the store and re-hydrates from the seed —
   * correct for a mock, but it discards whatever the user had saved.
   */
  version?: number;
  /** Rows generated per entity that has no explicit `seed`. Default 10. */
  seedCount?: number;
  /** Fixed RNG seed, so generated rows are identical across reloads. Default 1. */
  seedRandom?: number;
  /** Keyed by base-url: a request url matching one is served from IndexedDB. */
  schema: Record<string, Record<string, MonoMockEntity>>;
}
/**
 * Non-secret, environment-specific values, keyed by `NODE_ENV`. Use this for
 * things that aren't really secret (API base URLs, feature flags) so they live
 * in `mono.config.ts` — merged across the host+remote `extends` chain — instead
 * of a `.env` file each dev has to remember to push.
 *
 * The `default` block deep-merges UNDER the active `env[NODE_ENV]` block (the
 * active block wins, key by key). Read the flattened result at runtime with
 * `monoEnv()` / `monoEnv('KEY')`.
 *
 * **Layer beats block.** That mode-wins-over-default rule applies only WITHIN a
 * single config. Across `extends`, the repo you are working in always outranks
 * the layers it extends — so re-declaring a key in your own `default` overrides
 * a host's per-mode value, and you do not have to mirror the host's block layout
 * to override it:
 *
 * ```ts
 * // .mono/apps/mono-host/mono.config.ts
 * env: { development: { MONO_URL: 'https://host.api' } }
 *
 * // your repo's mono.config.ts
 * env: { default: { MONO_URL: 'https://mine.api' } }
 *
 * monoEnv('MONO_URL') // -> 'https://mine.api', in every mode
 * ```
 *
 * Keys you do NOT re-declare keep the host's whole per-environment matrix.
 * See {@link mergeEnvLayer}.
 *
 * Leaves must be scalars: an array value would CONCATENATE across `extends`
 * layers rather than override (see {@link deepMergeLayer}).
 */
type MonoEnvConfig = {
  /** Shared values merged under every environment. */default?: Record<string, string | number | boolean>; /** One block per `NODE_ENV` value, e.g. `development` / `production`. */
  [nodeEnv: string]: Record<string, string | number | boolean> | undefined;
};
/**
 * Where `mono skills` stores THIS app's knowledge, decisions and AI session
 * history: a git repository the user owns. Its presence in `mono.config.ts` is
 * the feature switch — no `skill` key, no skills workflow (every remote command
 * reports `skipped: true, reason: 'MONO_SKILLS_NOT_CONFIGURED'`).
 *
 * ```ts
 * skill: { url: 'https://github.com/org/app-knowledge.git', envToken: 'APP_SKILLS_TOKEN' }
 * // push into a subfolder on a specific branch (GitHub deep URL):
 * skill: { url: 'https://github.com/org/monorepo/tree/mono/knowledge' }
 * ```
 *
 * Both values must be static string literals — the skills CLI text-parses this
 * file (like `apps[]`) before it could be executed, so a computed `url` reads as
 * an invalid config rather than a different repo.
 */
interface MonoSkillConfig {
  /**
   * The repository. Either a plain clone URL — `https://host/org/repo.git` on
   * ANY git host, or `ssh://` / `git@host:org/repo.git` (machine credentials
   * only) — or a GitHub deep URL `https://github.com/org/repo/tree/<ref>/<dir>`
   * meaning "on branch `<ref>`, under folder `<dir>`". A bare
   * `https://github.com/org/repo` targets the remote's default branch at its
   * root.
   */
  url: string;
  /**
   * NAME of the env var holding a personal access token — the same convention
   * as `apps[].envToken`. Only read when this machine's own git credentials
   * cannot reach the repo (not invited / no credential); a collaborator never
   * needs it. HTTPS URLs only: the token rides the fetch/push URL and is never
   * written into the clone's `.git/config` or any log line.
   */
  envToken?: string;
}
interface MonoConfig {
  extends?: MonoConfigExtends;
  name: string;
  /**
   * This host's own app kind / folder convention. `vue` -> `src/`, `nuxt` ->
   * `app/`. Drives the `@<own-name>` alias and (Nuxt) ecosystem discovery. When
   * statically parsed (pre-config-load, by `monoAlias`), declare it ABOVE `apps`.
   */
  type: MonoAppType;
  /**
   * Host or remote — which side of the federation this app is.
   *
   * The line the two roles have always disagreed on is **layouts**: a `host`
   * ships the shared shell, so it takes its own `layouts/` and NO federated
   * ones; a `remote` consumes the host's, so it takes both. Both readers agree
   * on that:
   *
   * - `mono.vite()` — `monoLayoutsOptions` builds `layoutsDirs` from it.
   * - `@mono-lit/utility/nuxt` — with two paths, both gated on the same answer:
   *
   *   - **A federated app that is itself Nuxt** is registered as a native NUXT
   *     LAYER (`registerMonoNuxtLayers`), so Nuxt merges its pages, layouts,
   *     middleware, plugins and components with its own cross-layer rules. A
   *     `'host'` gets no layers at all: a layer is all-or-nothing, so opting one
   *     in would hand the host its remotes' `layouts/` with no way to refuse.
   *   - **A Vue remote**, which can never be a Nuxt layer, goes through mono's
   *     own merge, where the `layouts` ecosystem entry is enabled unless
   *     `'host'` — matching `mono.vite()` exactly, absent `template` included.
   *     `middleware` and `plugins` are enabled there on an EXPLICIT `'remote'`
   *     only: they have no Vite analogue, so there is no prior behaviour to
   *     preserve, and a host silently adopting a remote's global middleware
   *     would be a regression rather than a fix.
   *
   *   Either way a file the app ships itself wins over the federated one.
   *
   * ```ts
   * defineConfig({ name: 'mono-host', type: 'vue', template: 'host', … })
   * ```
   *
   * Optional. Absent behaves as `'remote'`, which is what `mono.vite()` did
   * before this field existed — so adding it breaks nothing, and the long-hand
   * config (`Layouts({ layoutsDirs: mono.ecosystem('layouts') })`) ignores it
   * entirely and keeps deciding for itself. To override for one call, pass the
   * plugin's own option: `mono.layouts.options({ layoutsDirs: [...] })` replaces
   * the whole list.
   *
   * **Never inherited through `extends`.** Like `name` and `type`, it identifies
   * a config rather than describing shared state — a remote that extends a host
   * declaring `template: 'host'` would otherwise inherit it and silently render
   * with no shell. It is read from THIS file only.
   */
  template?: MonoTemplate;
  /**
   * Optional. The user-owned repository `mono skills` reads knowledge from and
   * saves session history to. See {@link MonoSkillConfig}.
   *
   * **Never inherited through `extends`.** Like `template`, it says something
   * about THIS app — which repo holds its history — so a remote extending a host
   * must not silently start filing its sessions into the host's repo. It is read
   * from THIS file only.
   */
  skill?: MonoSkillConfig;
  menu?: SidebarMenu[];
  apps: MonoAppConfig[];
  fetching?: MonoFetchingConfig;
  /**
   * Environment-specific, non-secret values keyed by `NODE_ENV`. Deep-merges
   * across the `extends` chain (current app wins). See {@link MonoEnvConfig}
   * and read it with `monoEnv()`.
   */
  env?: MonoEnvConfig;
  /** Browser-native mock backend (IndexedDB). See {@link MonoMockDbConfig}. */
  mockIndexedDB?: MonoMockDbConfig;
  renderFn?: () => VNode;
  jwt?: MonoJwtConfig;
  cookie?: {
    name: string;
    split?: boolean;
  }[];
}
/**
 * Browser-safe defineConfig.
 *
 * No C12 here.
 * No process here.
 * No filesystem here.
 *
 * NOTE on mutually-extending configs: when two configs extend each other via
 * `extends: [() => other]`, TypeScript hits a circular type reference
 * ("'default' implicitly has type 'any' … referenced … in its own initializer").
 * The fix lives in the config file, not here — annotate the thunk's return type
 * so TS stops inferring through the cycle:
 *   `extends: [(): MonoConfig => otherConfig]`
 * (or annotate the export: `const config: MonoConfig = defineConfig({...})`).
 */
declare function defineConfig<T extends MonoConfig>(config: T): T;
/** Dedupe a name-keyed list, keeping the FIRST occurrence of each key. */
declare function dedupeBy<T>(list: T[] | undefined, key: (item: T) => string): T[] | undefined;
/**
 * Collapse the name-keyed arrays of a single config. The layer merge already
 * dedupes pairwise ({@link mergeKeyedList}), so this is the safety net for a
 * config that repeats a key inside its own array — and the ONE rule the C12 node
 * loader shares, so the two can never disagree about precedence.
 */
declare function dedupeConfigArrays<T extends Partial<MonoConfig>>(config: T): T;
/**
 * Resolve a config's `extends` at runtime by merging any object layers.
 *
 * Only object entries are merged here (browser-safe). String/path entries are a
 * C12-loader concern and are ignored (with a warning), since the filesystem
 * isn't available at runtime. The current config takes precedence over its
 * layers — every key, and for `env` every block (see {@link mergeEnvLayer}) —
 * and name-keyed arrays (apps/menu/cookie) are combined and de-duped with the
 * current config's entries winning and leading the list.
 *
 * Circular references are supported: two configs may extend each other (e.g.
 * mono-host ⇄ mono-vue). A layer already on the current resolution path is
 * skipped, so whichever config is loaded as the root wins on conflicts.
 *
 * Called automatically by `createMono`/`initMono`, so apps don't normally
 * need to invoke it directly.
 */
declare function resolveMonoConfig<T extends MonoConfig>(config: T): T;
/**
 * Flatten a config's {@link MonoEnvConfig} into the values for the active
 * environment: `env.default` merged first, then the active `env[mode]` block on
 * top (active wins). Returns `{}` when there is no `env` field.
 *
 * `config` MUST be already resolved (post-{@link resolveMonoConfig}) — that is
 * where the layer-beats-block rule is applied. Handed a raw config whose
 * `extends` were never merged, this returns only that one config's values; handed
 * a naively block-merged one, a layer's per-mode value would outrank the root's
 * `default`. Prefer the runtime `monoEnv()` accessor, which always reads the
 * resolved config out of `monoState()`.
 */
declare function resolveEnv(config: Partial<MonoConfig>, mode?: string | undefined): Record<string, string | number | boolean>;
/**
 * The `name`s of the apps a config activates through its `extends` array — the
 * authoritative "which remotes are switched on" set.
 *
 * Each `extends` entry (a thunk `() => config` or an already-imported object)
 * is resolved and its `name` collected; string/path entries have no name and
 * are skipped. Only the top-level layer's `name` is read — this never recurses
 * into a layer's own `extends`, so it is safe with the circular host⇄remote
 * import graph.
 *
 * Callers use this to gate rendering (page/route + auto-import discovery, and
 * the sidebar menu) on `extends`, so commenting an `extends` entry fully
 * removes that remote while `apps[]` (the `mono sync` clone source) is left
 * untouched. Returns `[]` when there is no `extends` field.
 */
declare function resolveExtendsAppNames(config: Partial<MonoConfig>): string[];
/**
 * The per-app ecosystem allowlists declared in `extends`.
 *
 * Keyed by each layer's own `name`, which is also that remote's name in
 * `apps[]` — the same identity `resolveExtendsAppNames` already gates
 * activation on. An app **absent** from the result is unrestricted; an app
 * mapped to `[]` contributes no directories at all.
 *
 * Read from the RAW config for the same reason as `resolveExtendsAppNames`:
 * `resolveMonoConfig` strips `extends` before any consumer could see it.
 */
declare function resolveExtendsEcosystems(config: Partial<MonoConfig>): Record<string, string[]>;
//#endregion
export { resolveEnv as A, MonoSyncTransport as C, dedupeBy as D, SidebarMenu as E, resolveExtendsEcosystems as M, resolveMonoConfig as N, dedupeConfigArrays as O, srcDirForType as P, MonoSkillConfig as S, Permission as T, MonoMergeableKey as _, MonoAppConfig as a, MonoOdataSource as b, MonoConfig as c, MonoConfigExtendsOptions as d, MonoConfigLayer as f, MonoJwtEntry as g, MonoJwtConfig as h, MonoApiEntry as i, resolveExtendsAppNames as j, defineConfig as k, MonoConfigExtends as l, MonoFetchingConfig as m, JWTCompleteTokenTypes as n, MonoAppType as o, MonoEnvConfig as p, MONO_SRC_DIR as r, MonoAuthConfig as s, DefaultJWTTokenTypes as t, MonoConfigExtendsEntry as u, MonoMockDbConfig as v, MonoTemplate as w, MonoRefreshRequestConfig as x, MonoMockEntity as y };