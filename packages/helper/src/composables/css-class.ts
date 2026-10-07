// css-class.ts
//
// Shared helpers for the `cssClass` (per-part overrides) + `cssClassName` (root
// class string) feature implemented by mono components. Centralizes the logic
// each component's core mixin used to duplicate.

/**
 * Append a per-part class override (if present) to a base class string.
 *
 *   cssPart({ inner: 'px-4' }, 'mono-nav-inner', 'inner') // 'mono-nav-inner px-4'
 *   cssPart(undefined,        'mono-nav-inner', 'inner') // 'mono-nav-inner'
 */
export function cssPart<T extends object>(
  cssClass: T | undefined,
  base: string,
  key: keyof T,
): string {
  const extra = cssClass?.[key] as string | undefined
  return extra ? `${base} ${extra}` : base
}

/**
 * Apply a `css-class` value to an element's `cssClass`/`cssClassName`.
 *
 *  - `null`/`undefined`/empty string → reset both
 *  - object                          → `cssClass`
 *  - `'{ … }'` JSON string           → parsed into `cssClass`
 *  - plain string                    → `cssClassName` (root class fallback)
 *
 * Mutates the element's reactive properties directly (so Lit picks up the
 * change). Used by each component's `_setCssClass`.
 */
export function applyCssClass<T extends object>(
  target: { cssClass: T; cssClassName: string },
  value: unknown,
): void {
  if (value == null) {
    target.cssClass = {} as T
    target.cssClassName = ''
    return
  }

  if (typeof value === 'object') {
    target.cssClass = value as T
    return
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      target.cssClass = {} as T
      target.cssClassName = ''
      return
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        target.cssClass = JSON.parse(trimmed) as T
        return
      } catch {
        // fall through to plain class name
      }
    }

    target.cssClassName = trimmed
  }
}

/**
 * Define `css-class` and `cssclass` instance aliases (Vue interop) that route to
 * `set`. Lets consumers write `<el :css-class="…">` / `:cssclass` / `:cssClass`.
 */
export function defineCssClassAliases(
  target: object,
  set: (value: unknown) => void,
): void {
  for (const alias of ['css-class', 'cssclass']) {
    Object.defineProperty(target, alias, {
      get: () => (target as { cssClass?: unknown }).cssClass,
      set,
      configurable: true,
      enumerable: false,
    })
  }
}
