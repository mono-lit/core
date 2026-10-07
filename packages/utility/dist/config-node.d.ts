import { S as MonoSkillConfig, c as MonoConfig, o as MonoAppType, w as MonoTemplate } from "./create-config-D3m6xTaQ.js";
import { a as ResolveAppRootsOptions, c as isMissingPathError, d as pathAppRoots, f as resetAppPathWarnings, i as MonoMissingPathPolicy, l as linkedAppRoots, n as MonoAppRootInput, o as appRootDirs, p as resolveAppRoots, r as MonoAppRootSource, s as hasUrl, t as MonoAppRoot, u as missingPathMessage } from "./app-roots-BJsIxzjk.js";
import { LoadConfigOptions } from "c12";
import { TSConfig } from "pkg-types";

//#region src/composables/config-node.d.ts
interface LoadMonoConfigOptions extends Partial<LoadConfigOptions<MonoConfig>> {
  cwd?: string;
}
declare function loadMonoConfig(options?: LoadMonoConfigOptions): Promise<{
  config: MonoConfig;
  layers?: import("c12").ConfigLayer<MonoConfig, import("c12").ConfigLayerMeta>[] | undefined;
  cwd?: string;
  _configFile?: string;
  source?: string;
  sourceOptions?: import("c12").SourceOptions<MonoConfig, import("c12").ConfigLayerMeta> | undefined;
  meta?: import("c12").ConfigLayerMeta | undefined;
  configFile?: string;
}>;
declare function getMonoConfig(options?: LoadMonoConfigOptions): Promise<MonoConfig>;
//#endregion
//#region src/composables/mono-alias.d.ts
interface MonoAliasOptions {
  /** App root (absolute). Pass `fileURLToPath(new URL('.', import.meta.url))`. */
  dirname: string;
  /** Override the own name instead of reading it from mono.config.ts. */
  name?: string;
  /** Folder scanned for remotes. Default './.mono/apps'. */
  appsDir?: string;
  /** Fallback source subdir when an app's `type` is unknown. Default 'src'. */
  srcDir?: string;
  /** Suffix for the root-level alias. Default '-root'. */
  rootSuffix?: string;
  /** Override the own app's kind (else read from mono.config.ts top-level `type`). */
  ownType?: MonoAppType;
  /** Override/augment per-remote kinds (else read from mono.config.ts `apps[].type`). */
  appTypes?: Record<string, MonoAppType>;
  /**
   * @deprecated `apps[].path` is authoritative in every command (dev, build,
   * prepare, sync); this option is ignored.
   */
  link?: boolean;
}
/**
 * Strip `//` and `/* *​/` comments without touching string contents, so a
 * commented-out `name:` never shadows the real one.
 *
 * Ported verbatim from `bin/mono-clone.mjs`.
 */
declare function stripCommentsSafe(code: string): string;
/**
 * Absolute path of the mono config file in `dir`, or `null`. The same lookup
 * order every static reader here uses.
 */
declare function monoConfigFileFor(dir: string): string | null;
/**
 * Read the top-level `name: '...'` literal from mono.config.ts text without
 * executing it. The first lowercase `name:` string literal is the config name —
 * `apps[].name` entries appear later in the file.
 */
declare function extractConfigName(dir: string): string | null;
/**
 * Read the top-level `template: 'host' | 'remote'` literal from mono.config.ts
 * text without executing it — the same trick `extractConfigName` uses, and for
 * the same reason: `monoNuxtLayers()` runs while `nuxt.config` is being loaded,
 * where the config's `extends` chain (which imports the host's own config
 * through an alias that does not exist yet) cannot be resolved.
 *
 * Only the text BEFORE `apps:` is searched, so a per-app key can never be
 * mistaken for the top-level one. `null` when absent — which, per `MonoTemplate`,
 * reads as `'remote'`.
 */
declare function extractTemplate(dir: string): MonoTemplate | null;
/** A statically-parsed `apps[]` entry (only fields we rely on here). */
interface ExtractedApp {
  name: string;
  type?: MonoAppType;
  /** Where `mono sync` clones from — optional when `path` is set. */
  url?: string;
  /** Directory the app is read from in place. See `MonoAppConfig.path`. */
  path?: string;
  [key: string]: unknown;
}
/** Statically read `{ name, type }` of a config without executing it. */
interface ExtractedConfig {
  name: string | null;
  type: MonoAppType;
  apps: ExtractedApp[];
}
/**
 * Read a mono.config.ts's own `name`/`type` and its `apps[]` (name + type)
 * WITHOUT executing it — `monoAlias` runs before the config is loaded, so it
 * can only parse the source text. The apps array is eval'd in isolation (same
 * approach as `bin/mono-clone.mjs`), so keep apps static (no variables/fns).
 *
 * The top-level `type` is read from the text BEFORE `apps:` so it can't be
 * shadowed by an `apps[].type` (or a `fetching.api.*.type`). Declare the
 * config's own `type` above `apps`.
 */
declare function extractConfig(dir: string): ExtractedConfig;
/**
 * Statically read the top-level `skill: { url, envToken? }` literal of a
 * mono.config.ts WITHOUT executing it — the `mono skills` CLI runs in a bare
 * checkout where the config's `extends` imports (other apps' aliases) may not be
 * resolvable, so it can only parse the source text, exactly like `extractConfig`.
 *
 * Read from THIS file only: `skill` is never inherited through `extends` (see
 * `MonoConfig.skill`). The object literal is eval'd in isolation, so keep it
 * static — no variables, no template expressions.
 *
 * `null` when the key is absent (the feature is off). THROWS when the key is
 * present but is not a static object literal with a string `url` — a present
 * but broken `skill` must surface as an error, not silently read as "off".
 */
declare function extractSkill(dir: string): MonoSkillConfig | null;
/**
 * Every `apps[]` entry must say where it comes from: a `url` (`mono sync`
 * clones it), a `path` (read in place), or both (`path` wins, `url` is the
 * fallback when the directory is absent). An entry with neither is a config
 * error, reported here by name rather than as a mysterious missing alias later.
 *
 * Run on the ROOT config only — a sibling's config is that sibling's business
 * and is validated when IT runs.
 */
declare function assertAppSources(apps: ExtractedApp[], file: string): void;
interface ResolveFederatedRootsOptions {
  /** App root (absolute). */
  dirname: string;
  /** Folder holding the clones. @default './.mono/apps' */
  appsDir?: string;
  /** Policy for the ROOT config's own `path` entries. @default 'report' */
  onMissingPath?: MonoMissingPathPolicy;
}
/**
 * The root config's apps, plus ONE level of the apps each of those declares by
 * `path` — resolved against THAT app's directory, not ours.
 *
 * In a mono-lith every sibling carries its own `mono.config.ts`, and a
 * remote's config can name a third sibling this root never listed. Its
 * `extends` chain then imports `@<third>-root/mono.config`, which only
 * resolves if that app has an alias here. So "present" and "aliased" are
 * decided by this one walk, and `monoAlias` / `monoMissingApps` both take its
 * answer.
 *
 * One level, never recursive: a host and its remote list each other, and the
 * cycle must not loop. A sibling's own `.mono/apps` is never listed
 * (`listClones: false`) — its clones are its standalone-dev business — and a
 * sibling's missing `path` is skipped silently (`onMissingPath: 'ignore'`):
 * that sibling reports it when it runs.
 */
declare function resolveFederatedRoots(opts: ResolveFederatedRootsOptions): MonoAppRoot[];
/**
 * Build the mono alias map for both Vite's `resolve.alias` and the jiti alias
 * that `getMonoConfig` needs to parse `mono.config.ts`.
 *
 * The source subdir of each app is derived from its `type` (`vue` -> `src`,
 * `nuxt` -> `app`): the own type from the config's top-level `type`, each
 * remote's from its `apps[].type`. Unknown types fall back to `srcDir`.
 *
 * Convention (keyed off app names; `<src>` = `srcDirForType(type)`):
 * - `@<own-name>`        -> `<dirname>/<src>`
 * - `@<own-name>-root`   -> `<dirname>`
 * - `@<remote>`          -> `<dirname>/.mono/apps/<remote>/<src>`
 * - `@<remote>-root`     -> `<dirname>/.mono/apps/<remote>`
 * - `@mono-apps`              -> `<dirname>/.mono/apps`
 *
 * Name/type are read from `mono.config.ts` (or passed via `name`/`ownType`/
 * `appTypes`). Remotes come from {@link resolveFederatedRoots}: the
 * `.mono/apps/` listing, plus every app whose `apps[].path` names a directory
 * — in which case `@<remote>` resolves THERE, in every command — plus the
 * `path` apps those apps declare themselves. Returns absolute paths.
 */
declare function monoAlias(opts: MonoAliasOptions): Record<string, string>;
/** An app some config federates that has no directory under `.mono/apps/`. */
interface MonoMissingApp {
  /** The app's `name` — the thing `@<name>` / `@<name>-root` is keyed on. */
  name: string;
  /** Which config asked for it: this app's own name, or a cloned app's. */
  via: string;
  /** Its `apps[].envToken`, when it was declared — what to set for a private repo. */
  envToken?: string;
}
interface MonoMissingAppsOptions {
  /** App root (absolute). */
  dirname: string;
  /** Folder scanned for remotes. Default './.mono/apps'. */
  appsDir?: string;
  /** Suffix for the root-level alias. Default '-root'. */
  rootSuffix?: string;
  /** @deprecated `apps[].path` is authoritative in every command; ignored. */
  link?: boolean;
}
/**
 * Apps that are federated somewhere in the chain but aren't on disk.
 *
 * A cloned app never carries its own `.mono/` (gitignored, so it's absent from the
 * archive `mono sync` downloads), so a host that federates apps of its own arrives
 * with `import … from '@some-app-root/mono.config'` and nothing to resolve it
 * against. `monoAlias` keys off the `.mono/apps/` DIRECTORY LISTING, so there is no
 * key and jiti falls through to bare-package resolution — `Cannot find module`, and
 * the config never loads. Finding those names first is what lets
 * {@link monoStubAliases} neutralise them.
 *
 * Static only — {@link extractConfig} text-parses each config without executing it,
 * which is the sole option: this runs BEFORE any config can be loaded.
 *
 * Two sources, union'd:
 *  - names in any reachable `apps[]` with no directory (carries `envToken`)
 *  - `@<name>-root/…` import specifiers with no alias key — covers a config that
 *    imports an app it never declared in `apps[]`
 *
 * Only the `-root` suffix form is scanned for the second source: `@scope/pkg` npm
 * imports are syntactically identical to `@app/file`, and mistaking `@vueuse/core`
 * for a mono app would stub a real dependency out of the build.
 */
declare function monoMissingApps(opts: MonoMissingAppsOptions): MonoMissingApp[];
interface MonoStubAliasesOptions extends MonoMissingAppsOptions {
  /** Pre-computed missing apps (else discovered via {@link monoMissingApps}). */
  missing?: MonoMissingApp[];
}
interface MonoStubAliases {
  /** Alias entries to merge ON TOP of {@link monoAlias}'s map. Empty when nothing is missing. */
  alias: Record<string, string>;
  /** What was stubbed — feed to {@link formatMissingApps}. */
  missing: MonoMissingApp[];
  /** The generated stub module, or `null` when nothing was missing. */
  stubFile: string | null;
}
/**
 * Alias entries that let a config chain load with apps missing from `.mono/apps/`.
 *
 * Each unsynced app gets EXACT keys for its config specifier only —
 * `@<name>-root/mono.config` (+ `.ts`/`.js`/`.mjs`, and the `@<name>` form) — all
 * pointing at one generated module that exports `{ apps: [], extends: [] }`. The
 * import resolves, the layer merges to nothing, the build starts.
 *
 * Deliberately NOT the bare `@<name>` / `@<name>-root` prefixes: app code that
 * imports a missing app (`@some-app/components/Foo.vue`) must still fail loudly. A
 * page that can't exist is better than a page that silently renders blank.
 *
 * Exact keys work because alias matching (pathe's `resolveAlias`, used by jiti;
 * the same rule in Vite) treats a key with no trailing segment as a full match, and
 * sorts keys with more slashes first — so `@x-root/mono.config` is always tried
 * before `@x-root`. For a missing app that prefix key doesn't exist anyway.
 *
 * Merge into BOTH alias maps: jiti's (so `getMonoConfig` can load) and Vite's (the
 * browser graph resolves the same chain via `import monoConfig from '../mono.config'`
 * in an app's `main.ts` — stub only jiti and the dev server starts, then dies on
 * first page load).
 */
declare function monoStubAliases(opts: MonoStubAliasesOptions): MonoStubAliases;
/**
 * The warning for stubbed apps — names them, says what was lost, and gives the
 * command that fixes it. `envToken` is the actionable part: a private repo fails to
 * sync silently until someone knows which variable to set.
 */
declare function formatMissingApps(missing: MonoMissingApp[]): string;
//#endregion
//#region src/composables/mono-tsconfig.d.ts
/** Folder (relative to an app root) that holds the generated tsconfig. */
declare const MONO_DIR = ".mono";
/** Reference to the generated tsconfig, as written into the root `extends`. */
declare const MONO_TSCONFIG_REF = "./.mono/tsconfig.json";
/** Folder (relative to an app root) that holds the cloned remotes. */
declare const MONO_APPS_DIR = ".mono/apps";
/**
 * Build the `compilerOptions.paths` map for `.mono/tsconfig.json` from the mono
 * alias map.
 *
 * `monoAlias` returns absolute directory paths keyed WITHOUT a `/*` glob (e.g.
 * `@mono-host` -> `<abs>/src`). tsconfig `paths` need the `/*` glob on both the
 * key and the value, and the value must be relative to the `.mono/` folder that
 * the file lives in. So `@mono-host` -> `{ "@mono-host/*": ["../src/*"] }`.
 *
 * All alias/type/srcDir rules are inherited from `monoAlias` — nothing is
 * re-implemented here.
 */
declare function monoTsconfigPaths(opts: MonoAliasOptions): Record<string, string[]>;
/** The object written to `<dirname>/.mono/tsconfig.json`. */
declare function buildMonoTsconfig(opts: MonoAliasOptions): TSConfig;
interface RunMonoPrepareOptions {
  /** App root (absolute) containing `mono.config.ts` and `tsconfig.json`. */
  dirname: string;
}
interface RunMonoPrepareResult {
  /** Absolute path of the generated `.mono/tsconfig.json`. */
  monoTsconfigPath: string;
  /** Absolute path of the root `tsconfig.json` that was wired. */
  rootTsconfigPath: string;
  /** The alias keys (with `/*`) written into `.mono/tsconfig.json`. */
  writtenKeys: string[];
  /** Inline `@mono-*` path keys stripped from the root tsconfig. */
  removedKeys: string[];
  /** Whether the `extends` entry was added (false if it was already present). */
  addedExtends: boolean;
  /** Cloned remotes under `.mono/apps/` whose tsconfig was (re)wired. */
  wiredApps: string[];
  /**
   * Alias keys whose directory lies outside the project (`apps[].path`
   * siblings) while the root tsconfig sets `rootDir` — TypeScript will reject
   * them until `rootDir` is removed or widened.
   */
  outsideProject: string[];
  /**
   * `path` apps whose own `tsconfig.json` extends a `.mono/tsconfig.json` that
   * does not exist yet — they have not run their own `mono prepare`.
   */
  unpreparedApps: string[];
}
/**
 * Generate `<dirname>/.mono/tsconfig.json` from the mono alias map and wire it
 * into the root `tsconfig.json` via `extends`, stripping the now-redundant
 * inline `@mono-*` paths. Idempotent: safe to run repeatedly.
 */
declare function runMonoPrepare(opts: RunMonoPrepareOptions): Promise<RunMonoPrepareResult>;
//#endregion
//#region src/skills/config.d.ts
/**
 * Built-in behavioural defaults. Users never configure these — they only set
 * `skill.url` / `skill.envToken`.
 */
declare const SKILLS_DEFAULTS: Readonly<{
  /** Local staging + clone directory (under the already-gitignored `.mono/`). */stagingDir: ".mono/skills"; /** Subfolder of `stagingDir` holding the working clone of the skills repo. */
  repoDir: "repo"; /** Conversation chunk size before splitting into `part-NNNN.jsonl`. 750 KB. */
  chunkSizeBytes: number; /** Remove the local staging dir after a successful upload. */
  cleanupAfterSuccess: true; /** Move a failed session from `pending/` to `failed/`. */
  moveFailedSessions: true; /** `read`/`search` re-fetch the clone when its last fetch is older than this. */
  refreshTtlMs: number; /** How many times a rejected (non-fast-forward) push is replayed on a fresh tip. */
  pushAttempts: 3; /** Timeout for a single remote git operation (probe, fetch, push). */
  gitTimeoutMs: number;
}>;
/**
 * The ONLY CLI flags any `mono skills` subcommand may accept. The argument guard
 * rejects everything else — in particular `--token`, `--owner`, `--repo`,
 * `--branch`, `--url`, `--destination`, etc. — so the AI can never (accidentally
 * or otherwise) retarget the repo or leak a token via argv.
 */
declare const ALLOWED_FLAGS: readonly string[];
/**
 * Default/generic template app names. While an app still carries one of these
 * placeholder names, `save`/`retry` are skipped — we don't want session history
 * filed under a non-specific id. The user is expected to rename the app first
 * (see Template Rule 1 — "confirm the app name"). Comparison is case-insensitive
 * against the normalized app id.
 */
declare const GENERIC_APP_NAMES: readonly string[];
/** True when `id` is still a default/generic template name. */
declare function isGenericAppName(id: string): boolean;
/**
 * Load `.env` (and `.env.dev` if present) from `cwd` into `process.env` without
 * overriding values already set in the real environment, so `skill.envToken`
 * can name a variable kept in a dotenv file — exactly like `apps[].envToken`
 * for `mono sync`. Missing files are ignored silently.
 */
declare function loadSkillsEnv(cwd?: string): void;
/**
 * Read `skill` from the `mono.config.ts` in `cwd`. `null` = not configured (the
 * feature is off). Throws when the key is present but malformed.
 */
declare function loadSkillConfig(cwd?: string): MonoSkillConfig | null;
/** How `skill.url` was recognised. Decides token support and probing. */
type SkillUrlKind = 'github' | 'https' | 'ssh' | 'local';
/** `skill.url` parsed into what the git layer needs. Pure data, no I/O. */
interface SkillTarget {
  kind: SkillUrlKind;
  /** Plain, credential-free clone URL — the ONLY form that is ever logged or stored. */
  remoteUrl: string;
  /** Hostname (`null` for a local path). */
  host: string | null;
  /** GitHub only. */
  owner?: string;
  repo?: string;
  /**
   * Branch to use. `null` = the remote's default branch (resolved by probing
   * `HEAD`). For a GitHub deep URL this is filled in AFTER the probe splits
   * `refAndDir`, so it stays `null` here.
   */
  ref: string | null;
  /**
   * Raw remainder of a GitHub `/tree/<…>` URL. `release/v2/app` could be branch
   * `release/v2` + folder `app` or branch `release` + folder `v2/app`; only the
   * remote knows, so the split happens in `resolveRemote`, not here.
   */
  refAndDir: string | null;
  /** Subfolder inside the repo everything is written under. `''` = repo root. */
  dir: string;
  /** Env var NAME holding the PAT, when configured. */
  tokenEnv?: string;
  /** HTTPS only: a token can ride the URL. `ssh`/`local` = machine access only. */
  tokenSupported: boolean;
}
/**
 * Parse `skill.url` into a {@link SkillTarget}. Throws `Invalid skill.url: …`
 * for anything that is not a repository (`/blob/` file links, an owner with no
 * repo, garbage).
 */
declare function resolveSkillTarget(cfg: MonoSkillConfig): SkillTarget;
//#endregion
//#region src/skills/types.d.ts
/** Outcome status a session can carry. */
type SessionStatus = 'completed' | 'partial' | 'failed';
/** A file the session touched — METADATA ONLY; contents are never uploaded. */
interface ChangedFile {
  path: string;
  operation: 'added' | 'modified' | 'deleted' | 'renamed';
}
/** A technical/business decision recorded during the session. */
interface SessionDecision {
  title: string;
  decision: string;
  reason?: string;
}
/** Shape of `metadata.json` the AI (or a human) writes before `mono skills save`. */
interface SessionMetadata {
  schemaVersion: number;
  sessionId: string;
  status: SessionStatus;
  startedAt?: string;
  finishedAt?: string;
  topics?: string[];
  userRequests?: string[];
  commandsRun?: string[];
  validation?: {
    testsRun?: boolean;
    testsPassed?: boolean | null;
    buildRun?: boolean;
    buildPassed?: boolean | null;
  };
  outcome?: {
    result?: string;
    notes?: string;
  };
  [key: string]: unknown;
}
/** The effective local git identity used for attribution (`whoami`). */
interface Actor {
  name: string;
  email: string;
  /** `<name-slug>__<6 hex>` — the per-actor folder under `<app>/history/`. */
  actorFolder: string;
}
/** Result of a successful `mono skills save` / `retry`. */
interface SaveResult {
  success: true;
  sessionId: string;
  /** The configured repository (plain URL, never a token). */
  repository: string;
  /** Branch the session was pushed to. */
  ref: string;
  /** Subfolder inside the repo (`''` = root). */
  dir: string;
  /** Which credentials got through: the machine's own git access, or `envToken`. */
  transport: 'git' | 'token';
  /** `<app>/history/<actor>/<date>/<time>_<id>` — relative to `dir`. */
  savedPath: string;
  /** `dir` + `savedPath` — the path as seen from the repository root. */
  repoPath: string;
  /** The commit that landed on the remote. */
  commit: string;
  /** 1 = first push; 2+ = replayed after a concurrent save. */
  pushAttempts: number;
  filesUploaded: number;
  localCleanup: boolean;
}
/** Result when `skill` is not configured in mono.config.ts — NOT an error. */
interface SkippedResult {
  success: true;
  skipped: true;
  reason: 'MONO_SKILLS_NOT_CONFIGURED';
  hint?: string;
}
/** Generic failure payload. */
interface FailureResult {
  success: false;
  error: string;
  [key: string]: unknown;
}
//#endregion
//#region src/skills/git.d.ts
/**
 * Applied to EVERY git invocation (same list as `mono sync`, same reasons):
 * stop Git Credential Manager from popping a dialog, keep LF so the tree is
 * byte-identical across machines, no symlinks/submodules, long paths, no gc.
 */
declare const BASE_ARGS: string[];
/** Environment for every git child process. */
declare function gitEnv(extra?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
interface GitResult {
  ok: boolean;
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  error?: NodeJS.ErrnoException;
  timedOut: boolean;
}
interface RunGitOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}
type GitRunner = (args: string[], opts?: RunGitOptions) => GitResult;
/**
 * Run git. NEVER throws — returns a record for the caller to classify.
 * `shell: false` so a path like `C:\Program Files\…` needs no quoting.
 */
declare function runGit(args: string[], {
  cwd,
  timeoutMs,
  env
}?: RunGitOptions): GitResult;
/** First `fatal:`/`error:`/`remote:` line of stderr, tag stripped — and redacted. */
declare function firstFatal(stderr: string): string;
type GitFailureKind = 'no-git' | 'timeout' | 'ref-missing' | 'network' | 'no-access' | 'unknown';
type GitNoAccessWhy = 'not-invited' | 'bad-credential' | 'no-credential';
interface GitFailure {
  kind: GitFailureKind;
  why?: GitNoAccessWhy;
  detail?: string;
}
/**
 * Turn a `runGit` result into an actionable cause. The `not-invited` vs
 * `bad-credential` split matters: GitHub answers 404 for private repos you
 * cannot see, but a STALE cached credential answers "Authentication failed".
 */
declare function classifyGitFailure(res: GitResult | undefined): GitFailure;
/** Strip any embedded credential before a URL (or a line containing one) reaches a log or an error. */
declare function redactUrl(text: string): string;
/**
 * Put a token on an https clone URL for ONE fetch/push. GitHub authenticates a
 * PAT as user `x-access-token`; GitLab-style hosts as `oauth2`; Azure DevOps
 * accepts any user name with a PAT password. Never store the result — pass it
 * as the positional remote argument only, so `.git/config` stays clean.
 */
declare function tokenRemote(remoteUrl: string, token: string): string;
/**
 * Every legal split of a `/tree/<refAndDir>` URL remainder into ref + folder,
 * longest ref first — `release/v2/app` may be branch `release/v2` + `app` or
 * branch `release` + `v2/app`. Only the remote can tell, so the caller probes
 * each candidate in this order. (Ported from `bin/mono-git.mjs`.)
 */
declare function refDirCandidates(refAndDir: string): Array<{
  ref: string;
  dir: string;
}>;
/** Refs to ask `ls-remote` about for a branch-or-tag name. */
declare function refPatterns(ref: string): string[];
/** Pick the SHA for `ref` out of `ls-remote` output. Branch beats tag. */
declare function parseLsRemote(stdout: string, ref: string): string | null;
/**
 * The default branch from `git ls-remote --symref <url> HEAD`:
 * `ref: refs/heads/main\tHEAD` → `main`. `null` for an empty (unborn) remote.
 */
declare function parseSymref(stdout: string): string | null;
/** The SHA that `ls-remote … HEAD` reports (second line of a `--symref` answer). */
declare function parseHeadSha(stdout: string): string | null;
/** Did a push get rejected because the remote moved on (someone else pushed first)? */
declare function isNonFastForward(stderr: string): boolean;
//#endregion
//#region src/skills/repo.d.ts
type SkillTransport = 'git' | 'token';
/** `skill.url` resolved against the live remote: which URL works, which branch, which folder. */
interface ResolvedRemote {
  target: SkillTarget;
  transport: SkillTransport;
  /** The URL that reached the remote. MAY CARRY THE TOKEN — never log or store; `redactUrl()` it. */
  fetchUrl: string;
  /** Resolved branch. */
  ref: string;
  /** Resolved subfolder (`''` = repo root). */
  dir: string;
  /** Tip of `ref` at probe time; `null` when the remote is empty. */
  headSha: string | null;
  /** The remote has no refs at all — the first push creates `ref`. */
  emptyRemote: boolean;
}
/** The remote could not be reached with any transport we were allowed to try. */
declare class SkillsAccessError extends Error {
  kind: GitFailureKind;
  why?: GitNoAccessWhy;
  transportTried: SkillTransport[];
  constructor(message: string, failure: GitFailure, transportTried: SkillTransport[]);
}
/**
 * Work out how to reach `skill.url` and what branch/folder it names.
 * Throws {@link SkillsAccessError} (message already redacted) when neither the
 * machine's credentials nor the configured token get through.
 */
declare function resolveRemote({
  target,
  env,
  run,
  timeoutMs
}: {
  target: SkillTarget;
  env?: NodeJS.ProcessEnv;
  run?: GitRunner;
  timeoutMs?: number;
}): ResolvedRemote;
/** Absolute path of the working clone: `<cwd>/.mono/skills/repo`. */
declare function repoDir(cwd?: string): string;
type RepoRefresh = 'always' | 'if-stale' | 'never';
interface EnsureRepoResult {
  repoDir: string;
  /** A fetch ran and the working tree now matches the remote tip. */
  refreshed: boolean;
  /** A refresh was wanted but failed; the clone is being served as-is. */
  stale: boolean;
  /** Local HEAD after the call (`null` on an unborn branch — empty remote). */
  headSha: string | null;
  /** Age of the last successful fetch, ms (`null` if never fetched). */
  lastFetchMs: number | null;
}
/**
 * Make `.mono/skills/repo` a valid clone of the resolved remote on `ref`, and
 * bring it up to date according to `refresh`:
 *
 * - `always`   — fetch now (before a save).
 * - `if-stale` — fetch when the last fetch is older than `refreshTtlMs`, or the
 *                branch was never fetched (before a read).
 * - `never`    — serve whatever is there (diagnostics), fetching only if the
 *                branch has never been fetched at all.
 *
 * A failed refresh of an EXISTING clone degrades to `stale: true` — offline
 * reads still work. A failed FIRST fetch throws, since there is nothing to serve.
 */
declare function ensureRepo({
  cwd,
  remote,
  refresh,
  run,
  timeoutMs
}: {
  cwd?: string;
  remote: ResolvedRemote;
  refresh: RepoRefresh;
  run?: GitRunner;
  timeoutMs?: number;
}): EnsureRepoResult;
interface CommitAndPushResult {
  /** SHA of the commit that landed on the remote. */
  sha: string;
  /** 1 = pushed first time; 2+ = replayed after someone else pushed first. */
  attempts: number;
}
/**
 * Write files (via `apply`), commit them as `actor`, push to `ref`. On a
 * non-fast-forward rejection: fetch, hard-reset to the new remote tip, run
 * `apply` again (it re-checks immutability on the fresh tree), commit, push —
 * up to `attempts` times.
 */
declare function commitAndPush({
  repoDir: dir,
  remote,
  actor,
  message,
  apply,
  attempts,
  run,
  timeoutMs
}: {
  repoDir: string;
  remote: ResolvedRemote;
  actor: Actor;
  message: string;
  apply: (repoDir: string) => void;
  attempts?: number;
  run?: GitRunner;
  timeoutMs?: number;
}): CommitAndPushResult;
/** Absolute path of the skills root inside the clone (`repoDir/<dir>`). */
declare function skillsRoot(dir: string, sub: string): string;
/** Read one file under `<repoDir>/<dir>/<rel>`; `null` when absent or a directory. */
declare function readRepoFile(dir: string, sub: string, rel: string): string | null;
/**
 * List files under `<repoDir>/<dir>/<prefix>` recursively, as forward-slash
 * paths relative to `<repoDir>/<dir>`. `.git` is never entered.
 */
declare function listRepoFiles(dir: string, sub: string, prefix?: string): string[];
//#endregion
//#region src/skills/actor.d.ts
/**
 * Resolve the actor from `git config user.name` / `user.email`.
 *
 * `actorFolder` = `<name-slug>__<6 hex>` where the 6 hex come from a sha256 of
 * the email (stable per identity, so the same person always maps to the same
 * folder). Example: `John Doe` / `john.doe@company.com` -> `john_doe__8f219a`.
 */
declare function detectActor(cwd?: string): Actor;
//#endregion
//#region src/skills/appid.d.ts
/**
 * Normalize an app id: lowercase, keep only `[a-z0-9_-]`, collapse the rest to
 * `-`, trim separators. Rejects path-traversal / separators outright.
 */
declare function normalizeAppId(raw: string): string;
/**
 * Resolve the effective app id for a command. `app` is the explicit `--app`
 * value (if any); `cwd` is the working directory.
 */
declare function resolveAppId({
  app,
  cwd
}: {
  app?: string;
  cwd?: string;
}): string;
//#endregion
//#region src/skills/staging.d.ts
/** Absolute `.mono/skills` for a given project root. */
declare function stagingRoot(cwd?: string): string;
declare const REQUIRED_FILES: readonly ["metadata.json", "summary.md"];
/** A single staged session on disk. */
interface StagedSession {
  sessionId: string;
  dir: string;
  files: string[];
  metadata: SessionMetadata;
}
/**
 * Load + validate a staged session directory. Throws a clear error when a
 * required file is missing, `metadata.json` is malformed, or any staged file
 * doesn't match the template standard — so the caller (save/retry) refuses to
 * upload a session that doesn't conform, and nothing reaches GitHub.
 */
declare function loadStagedSession(dir: string): StagedSession;
/** List session ids under `pending/` (or `failed/`). */
declare function listSessions(cwd: string, kind: 'pending' | 'failed'): string[];
/** Move a session directory from `pending/` to `failed/` (spec §22). Returns the new path. */
declare function moveToFailed(cwd: string, sessionId: string): string;
/** Remove a staged session directory after a successful upload (spec §20 cleanup). */
declare function removeSession(dir: string): void;
/** Cache directory for remote reads (`knowledge` / `skills` / `search`). */
declare function cacheDir(cwd: string, kind: 'knowledge' | 'skills' | 'search'): string;
//#endregion
//#region src/skills/validate.d.ts
/**
 * Validate a staged session's files against the template standard. Throws a
 * single error listing every problem when the session doesn't conform, so
 * `save`/`retry` refuse to upload it. A conforming session returns silently.
 */
declare function validateStagedSession(dir: string, metadata: SessionMetadata): void;
//#endregion
//#region src/skills/redact.d.ts
/**
 * Redact a string. Returns the cleaned text. Safe to run on any text content
 * (summaries, conversation lines, decisions, metadata serialized to JSON).
 */
declare function redact(input: string): string;
/**
 * Redact a Buffer (e.g. a conversation chunk before upload) by round-tripping
 * through UTF-8. Returns a new Buffer.
 */
declare function redactBuffer(buf: Buffer): Buffer;
//#endregion
//#region src/skills/chunk.d.ts
interface ConversationPart {
  /** `part-0001.jsonl` */
  name: string;
  /** The chunk's raw bytes (already newline-joined). */
  content: Buffer;
}
/**
 * Chunk newline-delimited `jsonl` text into parts. Blank lines are dropped.
 * Returns `[]` for empty input.
 */
declare function chunkConversation(jsonl: string, chunkSizeBytes?: number): ConversationPart[];
//#endregion
//#region src/skills/save.d.ts
/** A single file to write into the permanent session folder. */
interface PlannedFile {
  /** Path relative to the skills root (`dir`). */
  repoPath: string;
  /** Already-redacted bytes. */
  content: Buffer;
}
interface SavePlan {
  appId: string;
  actor: Actor;
  sessionId: string;
  /** The configured repository (plain URL). */
  repository: string;
  /** `<app>/history/<actor>/<date>/<time>_<id>` */
  savedPath: string;
  /** Files that WILL be written (skills-root-relative), in order. */
  files: PlannedFile[];
}
/**
 * Build the full upload plan from a staged session WITHOUT touching the network.
 * `--dry-run` returns exactly this. Everything textual is redacted here.
 */
declare function buildSavePlan({
  cwd,
  app,
  dir,
  target
}: {
  cwd?: string;
  app?: string;
  dir: string;
  target?: SkillTarget;
}): SavePlan;
/**
 * Write the plan into the clone. Runs inside `commitAndPush`, so it may run
 * more than once (after a replay onto a newer tip) — every step is idempotent:
 * `app.json` / `user.json` are created once and never overwritten (so human
 * edits to them survive), and an existing session folder is REFUSED (sessions
 * are immutable).
 */
declare function applyPlan(plan: SavePlan, root: string): void;
/**
 * Execute a save: resolve the remote, refresh the clone, apply, commit, push.
 * On any failure the local staging dir is preserved / moved to `failed/` and
 * the error is rethrown (already redacted).
 */
declare function runSave({
  cwd,
  app,
  dir,
  target,
  remote,
  env,
  run
}: {
  cwd?: string;
  app?: string;
  dir: string; /** Pre-parsed `skill` (the CLI parses it once). */
  target?: SkillTarget; /** Pre-resolved remote (skips the probe). */
  remote?: ResolvedRemote;
  env?: NodeJS.ProcessEnv;
  run?: GitRunner;
}): SaveResult;
//#endregion
//#region src/skills/read.d.ts
/** Where the answer came from — every read result carries this. */
interface ReadSource {
  source: 'local-clone';
  /** The clone could not be refreshed and may be behind the remote. */
  stale: boolean;
  ref: string;
  dir: string;
}
interface ReadResult extends ReadSource {
  app: string;
  type?: 'knowledge' | 'skills';
  /** Files returned: skills-root-relative path + text. */
  files: Array<{
    path: string;
    text: string;
  }>;
}
interface RepoAccess {
  cwd?: string;
  remote: ResolvedRemote;
  run?: GitRunner;
}
/**
 * Read either a whole `--type knowledge|skills` folder for an app, or a single
 * safe `--path` under that app. Returns the matched files' text.
 */
declare function runRead({
  cwd,
  app,
  type,
  path: relPath,
  remote,
  run
}: RepoAccess & {
  app?: string;
  type?: 'knowledge' | 'skills';
  path?: string;
}): ReadResult;
interface SearchHit {
  path: string;
  score: number;
  /** A short snippet around the first match. */
  snippet: string;
}
interface SearchResult extends ReadSource {
  app: string;
  query: string;
  hits: SearchHit[];
}
/**
 * Search an app's knowledge/skills + history summaries/decisions/index for a
 * query. Returns the top `limit` matches with snippets. Conversation chunks are
 * intentionally excluded from the scan (too large / low signal).
 */
declare function runSearch({
  cwd,
  app,
  query,
  limit,
  remote,
  run
}: RepoAccess & {
  app?: string;
  query: string;
  limit?: number;
}): SearchResult;
//#endregion
//#region src/skills/check.d.ts
interface CheckReport {
  /** `skill` is present (and parseable) in mono.config.ts. */
  configured: boolean;
  /** Plain repository URL, never a token. */
  url: string | null;
  kind: SkillUrlKind | null;
  /** Resolved branch / subfolder (after probing). */
  ref: string | null;
  dir: string | null;
  /** The env var NAME from `skill.envToken`, and whether it is set. */
  tokenEnv: string | null;
  tokenPresent: boolean;
  tokenSupported: boolean;
  /** Which credentials reached the remote. */
  transport: SkillTransport | null;
  canRead: boolean | null;
  canPush: boolean | null;
  remoteHead: string | null;
  emptyRemote: boolean | null;
  localClone: {
    path: string;
    exists: boolean;
    headSha: string | null; /** ISO time of the last successful fetch, if any. */
    lastFetchAt: string | null;
  };
  /** The resolved current app id, and whether it's still a generic template name. */
  currentApp: string | null;
  genericAppName: boolean;
  actor: Actor;
  gitIdentityConfigured: boolean;
  notes: string[];
}
/**
 * Run every check that is possible given the current config. Never throws:
 * an absent `skill` reports `configured: false`; an unreachable remote reports
 * `null`s plus a note.
 */
declare function runCheck({
  cwd,
  env,
  run
}?: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  run?: GitRunner;
}): CheckReport;
//#endregion
//#region src/skills/session.d.ts
interface SessionShowResult extends ReadSource {
  app: string;
  sessionId: string;
  /** Skills-root-relative session folder, if found. */
  path: string | null;
  metadata: unknown | null;
  summary: string | null;
}
/**
 * Locate `<app>/history/**​/HH-mm-ss_<sessionId>/` in the clone, then return its
 * `metadata.json` + `summary.md`. Returns nulls when the session isn't found.
 */
declare function runSessionShow({
  cwd,
  app,
  sessionId,
  remote,
  run
}: {
  cwd?: string;
  app?: string;
  sessionId: string;
  remote: ResolvedRemote;
  run?: GitRunner;
}): SessionShowResult;
//#endregion
export { ALLOWED_FLAGS, Actor, BASE_ARGS, ChangedFile, CheckReport, CommitAndPushResult, ConversationPart, EnsureRepoResult, ExtractedApp, ExtractedConfig, FailureResult, GENERIC_APP_NAMES, GitFailure, GitFailureKind, GitNoAccessWhy, GitResult, GitRunner, LoadMonoConfigOptions, MONO_APPS_DIR, MONO_DIR, MONO_TSCONFIG_REF, MonoAliasOptions, MonoAppRoot, MonoAppRootInput, MonoAppRootSource, MonoMissingApp, MonoMissingAppsOptions, MonoMissingPathPolicy, type MonoSkillConfig, MonoStubAliases, MonoStubAliasesOptions, REQUIRED_FILES, ReadResult, ReadSource, RepoRefresh, ResolveAppRootsOptions, ResolveFederatedRootsOptions, ResolvedRemote, RunGitOptions, RunMonoPrepareOptions, RunMonoPrepareResult, SKILLS_DEFAULTS, SavePlan, SaveResult, SearchHit, SearchResult, SessionDecision, SessionMetadata, SessionShowResult, SessionStatus, SkillTarget, SkillTransport, SkillUrlKind, SkillsAccessError, SkippedResult, StagedSession, appRootDirs, applyPlan, assertAppSources, buildMonoTsconfig, buildSavePlan, cacheDir, chunkConversation, classifyGitFailure, commitAndPush, detectActor, ensureRepo, extractConfig, extractConfigName, extractSkill, extractTemplate, firstFatal, formatMissingApps, getMonoConfig, gitEnv, hasUrl, isGenericAppName, isMissingPathError, isNonFastForward, linkedAppRoots, listRepoFiles, listSessions, loadMonoConfig, loadSkillConfig, loadSkillsEnv, loadStagedSession, missingPathMessage, monoAlias, monoConfigFileFor, monoMissingApps, monoStubAliases, monoTsconfigPaths, moveToFailed, normalizeAppId, parseHeadSha, parseLsRemote, parseSymref, pathAppRoots, readRepoFile, redact, redactBuffer, redactUrl, refDirCandidates, refPatterns, removeSession, repoDir, resetAppPathWarnings, resolveAppId, resolveAppRoots, resolveFederatedRoots, resolveRemote, resolveSkillTarget, runCheck, runGit, runMonoPrepare, runRead, runSave, runSearch, runSessionShow, skillsRoot, stagingRoot, stripCommentsSafe, tokenRemote, validateStagedSession };