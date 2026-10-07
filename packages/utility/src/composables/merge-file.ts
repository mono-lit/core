import fs from "node:fs"
import path from "node:path"
import { resolveAppRoots } from './app-roots'
import { srcDirForType, type MonoAppType } from "./create-config"

export type EcoSub = "composables" | "stores" | "components"
export type DirValue = string | string[]
export type MatchValue = string | RegExp | ((value: string) => boolean)

export type MergeEcosystemOptions<T = string> = {
    dirname: string
    appDir?: string

    /**
     * Pre-resolved app roots, replacing the `.mono/apps/` listing.
     *
     * `monoEcosystem` passes these so an app pointed at a local checkout by
     * `apps[].path` contributes its dirs — a directory listing cannot see one.
     * Omit for the plain scan.
     */
    appRoots?: { name: string; root: string }[]

    /**
     * App name filters.
     */
    includes?: string[]
    excludes?: string[]

    /**
     * Directory path.
     */
    dir?: DirValue
    sub?: EcoSub

    /**
     * Per-app directory override.
     */
    appDirs?: Record<string, DirValue>

    /**
     * Per-app ecosystem allowlist, from an `extends` entry's `ecosystems`.
     * App absent = unrestricted; `[]` = contributes nothing. See
     * {@link ecosystemSubAllowed}.
     *
     * Honoured here as well as in {@link monoEcosystem} so calling the
     * low-level primitive directly cannot escape a config's policy.
     */
    ecosystems?: Record<string, string[]>

    /**
     * Resolved directory filters.
     */
    dirIncludes?: MatchValue[]
    dirExcludes?: MatchValue[]

    /**
     * Output mapper.
     */
    map?: (dir: string, ctx: { appName: string; appRoot: string }) => T
}

function toArray<T>(value?: T | T[]): T[] {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
}

function uniq<T>(value: T[]): T[] {
    return [...new Set(value)]
}

function resolveDirValue({
    dir,
    sub,
}: {
    dir?: DirValue
    sub?: EcoSub
}) {
    const dirs = toArray(dir)

    if (!dirs.length && sub) {
        return [path.join("src", sub)]
    }

    if (!sub) {
        return dirs
    }

    return dirs.map((d) => path.join(d, sub))
}

/** `.\Foo\bar/` -> `Foo/bar`, so policy and candidate compare on equal terms. */
function normalizeSub(value: string): string {
    return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "")
}

/**
 * Does `sub` fall inside an `ecosystems` allowlist?
 *
 * Matching is **segment-wise**, not `startsWith`: `'composables'` admits
 * `'composables/shared'` (the shape hosts actually pass), while `'compos'`
 * admits nothing and `'composables/shared'` admits only itself.
 *
 * `undefined` means no policy was declared, so everything is allowed; an empty
 * list is an explicit "nothing".
 */
export function ecosystemSubAllowed(
    sub: string,
    allow: string[] | undefined,
): boolean {
    if (!allow) return true
    if (!allow.length) return false

    const target = normalizeSub(sub)

    return allow.some((entry) => {
        const allowed = normalizeSub(entry)
        return target === allowed || target.startsWith(`${allowed}/`)
    })
}

/**
 * Reduce a candidate relative dir to the sub an `ecosystems` list is written
 * in: `app/pages` and `src/pages` both mean `pages`. Lets the policy apply in
 * {@link mergeEcosystem}, which — unlike {@link monoEcosystem} — only ever sees
 * resolved directories, never the sub names they came from.
 */
function candidateSub(rel: string): string {
    const normalized = normalizeSub(rel)
    const [head, ...rest] = normalized.split("/")

    return rest.length && (head === "src" || head === "app")
        ? rest.join("/")
        : normalized
}

function matches(value: string, matcher: MatchValue) {
    if (typeof matcher === "string") {
        return value.includes(matcher)
    }

    if (matcher instanceof RegExp) {
        return matcher.test(value)
    }

    return matcher(value)
}

function passDirFilter({
    dir,
    dirIncludes,
    dirExcludes,
}: {
    dir: string
    dirIncludes?: MatchValue[]
    dirExcludes?: MatchValue[]
}) {
    const normalized = dir.replaceAll("\\", "/")

    if (dirIncludes?.length) {
        const hasInclude = dirIncludes.some((m) => matches(normalized, m))
        if (!hasInclude) return false
    }

    if (dirExcludes?.length) {
        const hasExclude = dirExcludes.some((m) => matches(normalized, m))
        if (hasExclude) return false
    }

    return true
}

export function mergeEcosystem<T = string>({
    dirname,
    appDir = "./.mono/apps",
    appRoots,
    includes,
    excludes,
    dir,
    sub,
    appDirs = {},
    ecosystems,
    dirIncludes,
    dirExcludes,
    map,
}: MergeEcosystemOptions<T>): T[] {
    const appsDir = path.resolve(dirname, appDir)

    // Where each app's source is. `appRoots` (from `monoEcosystem`) already
    // accounts for an app pointed at a local checkout by `path`; without it this
    // falls back to the plain `.mono/apps/` listing, which is what every caller
    // outside `monoEcosystem` still wants.
    const roots: { name: string; root: string }[] =
        appRoots ??
        (fs.existsSync(appsDir)
            ? fs
                  .readdirSync(appsDir, { withFileTypes: true })
                  .filter((d) => d.isDirectory())
                  .map((d) => ({ name: d.name, root: path.join(appsDir, d.name) }))
            : [])

    if (!roots.length) return []

    return roots
        .filter(({ name }) => {
            if (includes?.length && !includes.includes(name)) {
                return false
            }

            if (excludes?.length && excludes.includes(name)) {
                return false
            }

            return true
        })
        .flatMap(({ name: appName, root: appRoot }) => {
            const candidates = (
                appDirs[appName]
                    ? toArray(appDirs[appName])
                    : resolveDirValue({ dir, sub })
            ).filter((rel) =>
                ecosystemSubAllowed(candidateSub(rel), ecosystems?.[appName]),
            )

            return uniq(candidates)
                .map((rel) => path.resolve(appRoot, rel))
                .filter((resolvedDir) => fs.existsSync(resolvedDir))
                .filter((resolvedDir) =>
                    passDirFilter({
                        dir: resolvedDir,
                        dirIncludes,
                        dirExcludes,
                    }),
                )
                .map((resolvedDir) => {
                    if (map) {
                        return map(resolvedDir, { appName, appRoot })
                    }

                    return resolvedDir as T
                })
        })
}

export type MonoEcosystemOptions = {
    dirname: string
    /**
     * Resolved apps (name + kind). Each app's srcDir is derived from `type`.
     * `path` is read too — carry it through, or a locally-linked app silently
     * contributes nothing.
     */
    apps: { name: string; type: MonoAppType; path?: string }[]
    /**
     * Subpath(s) relative to each app's srcDir — e.g. `'pages'`,
     * `['composables/shared', 'stores/shared', 'composables']`. Resolved per app
     * to `<srcDirForType(type)>/<sub>` (`src/pages` for a vue app, `app/pages`
     * for a nuxt app).
     */
    subs: string | string[]
    appDir?: string
    includes?: string[]
    excludes?: string[]
    /**
     * Per-app ecosystem allowlist from `resolveExtendsEcosystems(rawConfig)`.
     * App absent = unrestricted; `[]` = contributes nothing.
     */
    ecosystems?: Record<string, string[]>
    dirIncludes?: MatchValue[]
    dirExcludes?: MatchValue[]
    /** @deprecated `apps[].path` is authoritative in every command; ignored. */
    link?: boolean
}

/**
 * Type-aware wrapper over {@link mergeEcosystem}: builds per-app `appDirs` from
 * each app's `type` (`vue` -> `src/<sub>`, `nuxt` -> `app/<sub>`) so a host can
 * pull in a remote without hardcoding its source folder. Only apps present in
 * both `apps` and {@link resolveAppRoots} produce dirs — which means the
 * `.mono/apps/` clone, or the local checkout an app's `path` names. Returns
 * absolute, existing dirs.
 */
export function monoEcosystem({
    dirname,
    apps,
    subs,
    appDir,
    includes,
    excludes,
    ecosystems,
    dirIncludes,
    dirExcludes,
}: MonoEcosystemOptions): string[] {
    const subList = toArray(subs)

    const appDirs: Record<string, string[]> = {}
    for (const app of apps) {
        if (!app?.name || !app?.type) continue

        // The policy is applied here, against the real sub names, rather than
        // being forwarded to mergeEcosystem — which would have to infer them
        // back out of resolved paths. An app left out of `appDirs` entirely
        // falls through mergeEcosystem's "no entry, no dir/sub" path to `[]`,
        // which is the same gate `extends` activation already relies on.
        const keep = subList.filter((s) =>
            ecosystemSubAllowed(s, ecosystems?.[app.name]),
        )
        if (!keep.length) continue

        const src = srcDirForType(app.type)
        appDirs[app.name] = keep.map((s) => path.join(src, s))
    }

    return mergeEcosystem<string>({
        dirname,
        appDir,
        // Resolve roots rather than letting mergeEcosystem list `.mono/apps/`:
        // an app read in place through `path` has no directory there, and
        // would otherwise contribute nothing. `ignore` a missing path here —
        // the alias pass that ran before this one already reported it.
        appRoots: resolveAppRoots({
            dirname,
            ...(appDir ? { appsDir: appDir } : {}),
            apps,
            onMissingPath: 'ignore',
        }),
        appDirs,
        includes,
        excludes,
        dirIncludes,
        dirExcludes,
    })
}