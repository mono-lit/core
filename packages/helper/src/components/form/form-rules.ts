import type { MonoFormRule, MonoFormRuleCtx, MonoFormSchemaLike } from './form-types.js'

/** Empty for validation purposes: null/undefined, blank string, empty array. */
export function isBlank(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Length for `min`/`max`: a number compares by magnitude, everything else by
 * length — so `min: 3` reads naturally for both "at least 3 characters" and
 * "at least 3 selected tags".
 */
function sizeOf(value: unknown): number {
  if (typeof value === 'number') return value
  if (Array.isArray(value)) return value.length
  if (value == null) return 0
  return String(value).length
}

let warnedUnknownSchema = false

/**
 * Run one schema-shaped rule. Duck-typed so neither yup nor Valibot is a
 * dependency of @mono-lit/helper. The schema's OWN message wins over the
 * rule's `message`.
 *
 * - yup-shaped (`validateSync` / `validate` that THROW): checked first, because
 *   yup ≥1.7 also exposes `~standard` and its own path keeps its exact messages.
 * - Standard Schema (`schema['~standard'].validate`, which RETURNS issues):
 *   Valibot, Zod, ArkType, … — sync or async.
 */
async function runSchema(schema: MonoFormSchemaLike, value: unknown): Promise<true | string> {
  try {
    if (typeof schema.validateSync === 'function') {
      schema.validateSync(value)
      return true
    }
    if (typeof schema.validate === 'function') {
      await schema.validate(value)
      return true
    }
    const standard = schema['~standard']
    if (typeof standard?.validate === 'function') {
      const result = await standard.validate(value)
      return result.issues?.length ? (result.issues[0]!.message || 'Invalid') : true
    }
    if (!warnedUnknownSchema) {
      warnedUnknownSchema = true
      console.warn('[mono-form] rule.schema is neither yup-shaped nor a Standard Schema (e.g. Valibot); it is ignored:', schema)
    }
    return true
  } catch (err) {
    const e = err as { message?: string; errors?: string[] }
    return e?.errors?.[0] ?? e?.message ?? 'Invalid'
  }
}

/**
 * Run a single rule. Returns `true` when it passes, or the failure message.
 *
 * A `schema` on the rule takes precedence over its `type`/`validate` — that's
 * the documented override, so a rule can be declared as a built-in and later
 * swapped to a schema without moving it.
 */
export async function runRule<V>(
  rule: MonoFormRule<V>,
  ctx: MonoFormRuleCtx<V>,
): Promise<true | string> {
  if (rule.schema) return runSchema(rule.schema, ctx.value)

  const { value } = ctx
  const fail = (fallback: string) => rule.message ?? fallback

  switch (rule.type) {
    case 'required':
      return isBlank(value) ? fail('This field is required') : true

    case 'min':
      if (isBlank(value)) return true // `required` owns emptiness
      return sizeOf(value) < rule.value ? fail(`Minimum ${rule.value}`) : true

    case 'max':
      if (isBlank(value)) return true
      return sizeOf(value) > rule.value ? fail(`Maximum ${rule.value}`) : true

    case 'pattern': {
      if (isBlank(value)) return true
      const re = typeof rule.value === 'string' ? new RegExp(rule.value) : rule.value
      return re.test(String(value)) ? true : fail('Invalid format')
    }

    case 'email':
      if (isBlank(value)) return true
      return EMAIL.test(String(value)) ? true : fail('Invalid email')

    case 'custom': {
      const out = rule.validate(ctx)
      if (out === true) return true
      return typeof out === 'string' ? out : fail('Invalid')
    }

    default:
      return true
  }
}

/**
 * Run a field's rules and return the FIRST failure (so one message shows at a
 * time, matching how the components render a single `validation-message`).
 *
 * `timing` filters which rules apply: `undefined` runs them all (that's
 * `form.validate()`), otherwise only rules whose effective timing matches.
 */
export async function runRules<V>(
  rules: MonoFormRule<V>[] | undefined,
  ctx: MonoFormRuleCtx<V>,
  opts: { timing?: 'live' | 'change'; defaultTiming: 'live' | 'change' },
): Promise<{ success: boolean; message: string }> {
  if (!rules?.length) return { success: true, message: '' }

  for (const rule of rules) {
    if (opts.timing) {
      const effective = rule.timing ?? opts.defaultTiming
      // A `live` rule also runs on commit — committing shouldn't drop an error
      // the user could already see while typing.
      const applies = effective === opts.timing || (effective === 'live' && opts.timing === 'change')
      if (!applies) continue
    }
    const out = await runRule(rule, ctx)
    if (out !== true) return { success: false, message: out }
  }
  return { success: true, message: '' }
}
