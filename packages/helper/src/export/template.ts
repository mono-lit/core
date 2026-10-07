/**
 * Handlebars stage — preprocess the template, compile it in an isolated
 * environment, and run it against the report context.
 *
 * Handlebars is an **optional peer dependency**. Templates are authored at
 * runtime, so the full ~225KB *compiler* is needed (the `handlebars/runtime`
 * build only executes precompiled specs) — and an app that never calls
 * `table.export()` shouldn't carry it. It is therefore reached through a dynamic
 * `import()` that only runs when a report is actually rendered, exactly like
 * `exceljs` in `./excel/index`. Unlike exceljs this one is needed for **every**
 * export, markdown included: it is the template engine.
 */

// Type-only — erased at build, so it does not resurrect the static dependency.
import type Handlebars from 'handlebars'
import { evaluateExpression, preprocessTemplate } from './expression'
import { createHelpers } from './helpers'
import type { MonoExportOptions } from './types'

/** Load the optional `handlebars` peer, with an actionable error when it's absent. */
async function loadHandlebars(): Promise<any> {
  try {
    const mod: any = await import('handlebars')
    // Handlebars is CJS; its ESM-interop `default` is the environment itself.
    return mod?.default ?? mod
  } catch (err) {
    throw new Error(
      '[mono-export] rendering a report needs the optional peer dependency "handlebars". ' +
        'Install it in your app: pnpm add handlebars' +
        (err instanceof Error ? `\n  (resolution failed: ${err.message})` : ''),
    )
  }
}

/**
 * Render a report template to Markdown (still carrying directive tokens).
 *
 * `noEscape` is deliberate: Handlebars' default escaping is *HTML* escaping,
 * which would turn `&` into `&amp;` and `"` into `&quot;` inside a spreadsheet
 * cell. Table cells are protected instead by the `esc` helper, which the
 * preprocessor injects only where it matters (see `expression.ts`).
 */
export async function renderTemplate(
  options: Pick<MonoExportOptions, 'md' | 'data' | 'helpers' | 'partials' | 'formatting'>,
): Promise<string> {
  const handlebars = await loadHandlebars()

  // A private environment per render — registering helpers on the shared
  // `Handlebars` singleton would leak them into the host app's own templates.
  const env = handlebars.create()

  env.registerHelper(createHelpers(options.formatting) as Record<string, Handlebars.HelperDelegate>)

  /**
   * The bridge to Jexl. `this` is the current block context (inside `{{#each}}`
   * it's the item), `options.data.root` is the whole report context — merging
   * them lets an expression name a loop-local field *and* a top-level one.
   */
  env.registerHelper('__jexl', function (this: unknown, ...args: unknown[]) {
    const helperOptions = args[args.length - 1] as { data?: { root?: unknown } } | undefined
    const expression = String(args[0] ?? '')
    const root = (helperOptions?.data?.root ?? {}) as Record<string, unknown>
    const local = (typeof this === 'object' && this !== null ? this : {}) as Record<string, unknown>
    const value = evaluateExpression(expression, { ...root, ...local, this: local })
    return value == null ? '' : value
  })

  if (options.helpers) {
    env.registerHelper(options.helpers as Record<string, Handlebars.HelperDelegate>)
  }
  if (options.partials) {
    for (const [name, source] of Object.entries(options.partials)) {
      env.registerPartial(name, preprocessTemplate(source))
    }
  }

  const template = env.compile(preprocessTemplate(options.md ?? ''), { noEscape: true })
  return template(options.data ?? {})
}
