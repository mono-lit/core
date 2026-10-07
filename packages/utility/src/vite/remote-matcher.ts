/**
 * "Is this module a federated remote's source?"
 *
 * Every Nuxt-compat transform asks that before rewriting anything, and the
 * answer used to be a substring test for `'/.mono/apps/'`. That works while
 * every remote is a clone under one directory — but an app pointed at a local
 * checkout by `apps[].path` lives somewhere else entirely, and its module ids
 * contain no such marker.
 *
 * The failure mode is the reason this is its own file: a missed root does not
 * error. `definePageMeta` simply survives into the compiler, `<NuxtLink>` is
 * never rewritten, and the breakage surfaces far from the cause. So the roots
 * come from one place ({@link resolveAppRoots}, threaded through `monoRepo`) and
 * are matched here, once.
 */


export interface RemoteMatcherOptions {
  /**
   * Substring an id must contain. Kept as the default so a plugin used
   * standalone behaves exactly as before.
   * @default '/.mono/apps/'
   */
  marker?: string
  /**
   * Absolute app roots. An id inside any of them is a remote, whatever its
   * path — this is what covers a local checkout.
   */
  roots?: string[]
}

/** `C:\a\B` -> `c:/a/b` — ids arrive slashed either way, and Windows is case-insensitive. */
function normalizeId(value: string): string {
  const slashed = value.replace(/\\/g, '/')
  return process.platform === 'win32' ? slashed.toLowerCase() : slashed
}

/** Strip the query so `foo.vue?vue&type=script` matches `foo.vue`. */
export function idPath(id: string): string {
  return id?.split('?')[0] ?? ''
}

/**
 * Build the "is this a remote's file?" predicate.
 *
 * Matches the marker substring OR containment in any root. Roots are compared
 * as directory prefixes, so a root of `…/host` never swallows `…/host-extra`.
 */
export function createRemoteMatcher(
  options: RemoteMatcherOptions = {},
): (id: string) => boolean {
  const marker = options.marker ?? '/.mono/apps/'
  // Compared as given, NOT re-resolved: callers pass already-absolute roots from
  // `resolveAppRoots`, and `path.resolve` would rewrite anything not matching
  // the host platform's shape (a POSIX path on Windows gains a drive letter).
  // Trailing slash makes the prefix test a directory test.
  const roots = (options.roots ?? [])
    .filter(Boolean)
    .map((root) => `${normalizeId(root).replace(/\/+$/, '')}/`)

  return (id: string): boolean => {
    const file = idPath(id)
    if (!file) return false

    const normalized = normalizeId(file)
    if (marker && normalized.includes(normalizeId(marker))) return true

    return roots.some((root) => normalized.startsWith(root))
  }
}

/** The options every compat transform accepts, so they stay interchangeable. */
export interface MonoRemoteGateOptions {
  /** Only transform files whose id contains this marker. Default '/.mono/apps/'. */
  appsMarker?: string
  /**
   * Absolute roots that also count as remote source — a locally-linked app's
   * checkout. `monoRepo()` supplies these; there is nothing to pass by hand.
   */
  appsRoots?: string[]
}

/** `createRemoteMatcher` from the shared option names. */
export function remoteGate(options: MonoRemoteGateOptions = {}): (id: string) => boolean {
  return createRemoteMatcher({
    ...(options.appsMarker !== undefined ? { marker: options.appsMarker } : {}),
    ...(options.appsRoots ? { roots: options.appsRoots } : {}),
  })
}
