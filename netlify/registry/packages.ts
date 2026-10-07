// The single source of truth for which packages this registry owns.
// Only these scoped names are served from (and publishable into) Blobs.
// Everything else is REDIRECTED to registry.npmjs.org — at the CDN edge when
// the request never reaches the function (see `monoFunctionPaths` and
// netlify.toml), and by the handler itself if it does.

export const MONO_PACKAGES: ReadonlySet<string> = new Set([
  '@mono-lit/helper',
  '@mono-lit/utility',
  '@mono-lit/devextreme',
])

export function isMonoPackage(name: string): boolean {
  return MONO_PACKAGES.has(name)
}

/**
 * The part after the scope: `@mono-lit/helper` → `helper`. npm names a scoped
 * package's tarball after this bare name (`/@mono-lit/helper/-/helper-0.0.1.tgz`).
 */
export function bareName(name: string): string {
  const slash = name.indexOf('/')
  return name.startsWith('@') && slash !== -1 ? name.slice(slash + 1) : name
}

/** The registry's URL prefix on the site. */
export const REGISTRY_PREFIX = '/npm'

/**
 * The URL patterns the function is mounted on — the owned packages and the
 * admin endpoint, and NOTHING else.
 *
 * Mounted on these paths only, `/npm/lit-html` never reaches a function: the
 * redirect rule in netlify.toml answers it at the edge, so a consumer whose
 * `.npmrc` points a registry here never pays a Lambda invocation per public
 * package.
 *
 * Clients spell a scoped packument either encoded (`/npm/@mono-lit%2fhelper`,
 * what npm/pnpm send) or with a literal slash (`/npm/@mono-lit/helper`, what
 * tarball URLs use), so each name is mounted in both forms. Derived from
 * `MONO_PACKAGES` so a new package cannot be added here and forgotten there;
 * `-/admin/sync` is the publish plugin's purge call.
 */
export function monoFunctionPaths(): string[] {
  const paths: string[] = []
  for (const name of MONO_PACKAGES) {
    const spellings = name.startsWith('@')
      ? [name, name.replace('/', '%2f'), name.replace('/', '%2F')]
      : [name]
    for (const s of spellings) paths.push(`${REGISTRY_PREFIX}/${s}`, `${REGISTRY_PREFIX}/${s}/*`)
  }
  paths.push(`${REGISTRY_PREFIX}/-/*`)
  return paths
}
