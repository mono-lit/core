import { o as MonoAppType } from "./create-config-D3m6xTaQ.js";

//#region src/composables/merge-file.d.ts
type EcoSub = "composables" | "stores" | "components";
type DirValue = string | string[];
type MatchValue = string | RegExp | ((value: string) => boolean);
type MergeEcosystemOptions<T = string> = {
  dirname: string;
  appDir?: string;
  /**
   * Pre-resolved app roots, replacing the `.mono/apps/` listing.
   *
   * `monoEcosystem` passes these so an app pointed at a local checkout by
   * `apps[].path` contributes its dirs — a directory listing cannot see one.
   * Omit for the plain scan.
   */
  appRoots?: {
    name: string;
    root: string;
  }[];
  /**
   * App name filters.
   */
  includes?: string[];
  excludes?: string[];
  /**
   * Directory path.
   */
  dir?: DirValue;
  sub?: EcoSub;
  /**
   * Per-app directory override.
   */
  appDirs?: Record<string, DirValue>;
  /**
   * Per-app ecosystem allowlist, from an `extends` entry's `ecosystems`.
   * App absent = unrestricted; `[]` = contributes nothing. See
   * {@link ecosystemSubAllowed}.
   *
   * Honoured here as well as in {@link monoEcosystem} so calling the
   * low-level primitive directly cannot escape a config's policy.
   */
  ecosystems?: Record<string, string[]>;
  /**
   * Resolved directory filters.
   */
  dirIncludes?: MatchValue[];
  dirExcludes?: MatchValue[];
  /**
   * Output mapper.
   */
  map?: (dir: string, ctx: {
    appName: string;
    appRoot: string;
  }) => T;
};
declare function mergeEcosystem<T = string>({
  dirname,
  appDir,
  appRoots,
  includes,
  excludes,
  dir,
  sub,
  appDirs,
  ecosystems,
  dirIncludes,
  dirExcludes,
  map
}: MergeEcosystemOptions<T>): T[];
type MonoEcosystemOptions = {
  dirname: string;
  /**
   * Resolved apps (name + kind). Each app's srcDir is derived from `type`.
   * `path` is read too — carry it through, or a locally-linked app silently
   * contributes nothing.
   */
  apps: {
    name: string;
    type: MonoAppType;
    path?: string;
  }[];
  /**
   * Subpath(s) relative to each app's srcDir — e.g. `'pages'`,
   * `['composables/shared', 'stores/shared', 'composables']`. Resolved per app
   * to `<srcDirForType(type)>/<sub>` (`src/pages` for a vue app, `app/pages`
   * for a nuxt app).
   */
  subs: string | string[];
  appDir?: string;
  includes?: string[];
  excludes?: string[];
  /**
   * Per-app ecosystem allowlist from `resolveExtendsEcosystems(rawConfig)`.
   * App absent = unrestricted; `[]` = contributes nothing.
   */
  ecosystems?: Record<string, string[]>;
  dirIncludes?: MatchValue[];
  dirExcludes?: MatchValue[]; /** @deprecated `apps[].path` is authoritative in every command; ignored. */
  link?: boolean;
};
/**
 * Type-aware wrapper over {@link mergeEcosystem}: builds per-app `appDirs` from
 * each app's `type` (`vue` -> `src/<sub>`, `nuxt` -> `app/<sub>`) so a host can
 * pull in a remote without hardcoding its source folder. Only apps present in
 * both `apps` and {@link resolveAppRoots} produce dirs — which means the
 * `.mono/apps/` clone, or the local checkout an app's `path` names. Returns
 * absolute, existing dirs.
 */
declare function monoEcosystem({
  dirname,
  apps,
  subs,
  appDir,
  includes,
  excludes,
  ecosystems,
  dirIncludes,
  dirExcludes
}: MonoEcosystemOptions): string[];
//#endregion
export { monoEcosystem as i, MonoEcosystemOptions as n, mergeEcosystem as r, MergeEcosystemOptions as t };