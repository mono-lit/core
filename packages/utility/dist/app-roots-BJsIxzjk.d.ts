import { o as MonoAppType } from "./create-config-D3m6xTaQ.js";

//#region src/composables/app-roots.d.ts
/** Where a resolved root came from. */
type MonoAppRootSource = 'path' | 'clone';
/** One federated app, resolved to the directory its source is read from. */
interface MonoAppRoot {
  /** The app's `name` — what `@<name>` / `@<name>-root` key off. */
  name: string;
  /** Its declared `type`, when a config entry supplied one. */
  type?: MonoAppType;
  /** Absolute directory that IS the app root (contains `src/` or `app/`). */
  root: string;
  /**
   * `'path'` — resolved from `apps[].path`, read in place, never written to.
   * `'clone'` — the `.mono/apps/<name>` tree `mono sync` materialised.
   */
  source: MonoAppRootSource;
  /**
   * Set when the entry was not declared by the root config but by one of its
   * apps (see `resolveFederatedRoots`): the name of the app whose config
   * declared it.
   */
  via?: string;
}
/** The `apps[]` shape this needs. Loosened so the static text-parse fits too. */
interface MonoAppRootInput {
  name?: string;
  type?: MonoAppType;
  url?: string;
  path?: string;
  [key: string]: unknown;
}
/**
 * What to do with a declared `path` whose directory does not exist.
 *
 * - `'report'` — the entry also has a `url`: warn once and fall back to the
 *   clone (the developer who set `path` has the directory, everyone else gets
 *   `mono sync`'s copy). No `url`: THROW, there is nothing to fall back to.
 * - `'ignore'` — skip silently. For a second pass over a config that another
 *   pass has already reported (prepare after alias, the transitive walk).
 */
type MonoMissingPathPolicy = 'report' | 'ignore';
interface ResolveAppRootsOptions {
  /** Project root. `path` entries resolve against it. */
  dirname: string;
  /** Folder holding the clones. @default './.mono/apps' */
  appsDir?: string;
  /** `apps[]` from `mono.config.ts`. Entries with `path` resolve in place. */
  apps?: MonoAppRootInput[];
  /** @default 'report' */
  onMissingPath?: MonoMissingPathPolicy;
  /**
   * Also list `<appsDir>` for clones. Pass `false` to resolve ONLY the declared
   * `path` entries — what a transitive walk over a sibling's config wants.
   * @default true
   */
  listClones?: boolean;
  /**
   * @deprecated `path` is authoritative in every command; this is ignored.
   * Kept so older call sites keep type-checking.
   */
  link?: boolean;
  /** @deprecated use `onMissingPath: 'ignore'`. */
  warnMissingPath?: boolean;
}
/**
 * Resolve every federated app to the directory it is read from.
 *
 * Config-declared `path` apps (when the directory exists) UNIONed with the
 * `.mono/apps/` listing. A `path` root SHADOWS a clone of the same name — the
 * stale clone is left on disk, simply not read — and a `path` that does not
 * exist falls back to the clone when the entry has a `url` to sync from.
 */
declare function resolveAppRoots(opts: ResolveAppRootsOptions): MonoAppRoot[];
/** Just the absolute roots — for `server.fs.allow` and the transform gates. */
declare function appRootDirs(roots: MonoAppRoot[]): string[];
/** The `path`-resolved subset. Used to tell the developer what is read in place. */
declare function pathAppRoots(roots: MonoAppRoot[]): MonoAppRoot[];
/** @deprecated renamed {@link pathAppRoots}. */
declare const linkedAppRoots: typeof pathAppRoots;
/** `true` when an app entry can be synced from GitHub. */
declare function hasUrl(app: MonoAppRootInput | undefined): boolean;
/** The error every entry point raises for a `path` with no directory and no `url`. */
declare function missingPathMessage(name: string, declared: string, resolved: string): string;
/** Recognise {@link missingPathMessage} from a caught error. */
declare function isMissingPathError(e: unknown): boolean;
/** Test seam: forget which missing paths have been reported. */
declare function resetAppPathWarnings(): void;
//#endregion
export { ResolveAppRootsOptions as a, isMissingPathError as c, pathAppRoots as d, resetAppPathWarnings as f, MonoMissingPathPolicy as i, linkedAppRoots as l, MonoAppRootInput as n, appRootDirs as o, resolveAppRoots as p, MonoAppRootSource as r, hasUrl as s, MonoAppRoot as t, missingPathMessage as u };