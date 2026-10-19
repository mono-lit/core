# Yup

Schema-based **form validation**, built on [Yup](https://github.com/jquense/yup). You don't call
Yup's `.validate()` yourself — you build a schema, keep an `error` object, and run it through the
validation helpers from [`useMonoUtility`](../repo/useful-utils) (`validateAllSchema`,
`validateSchema`, `validateAllSchemaCheck`, `clearSchemaValidation`). Yup is an **optional**
dependency: skip it if an app has no forms to validate. Want a much smaller bundle? The same
helpers take a [Valibot](./valibot) schema unchanged.

## The pattern

Three pieces: a reactive **input**, a **Yup schema**, and an **error** object that mirrors the form
— each field holding `{ valid, message }`. The helpers fill the error object for you.

```ts
import * as yup from 'yup'
import { useMonoUtility } from '@mono-lit/utility/runtime'

const { validateAllSchema, validateSchema, clearSchemaValidation } = useMonoUtility()

const input = ref({ username: '', password: '' })

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
})

// one { valid, message } slot per field
const error = ref({
  username: { valid: true, message: '' },
  password: { valid: true, message: '' },
})
```

**Validate the whole form** (resolves `true` when valid; the callback runs only then):

```ts
await validateAllSchema(
  { schema, input: input.value, error: error.value },
  async () => { await submit() },        // valid → proceed
)
```

**Validate a single field** (e.g. on blur) — updates just that field's `error` slot and resolves
`true` when it is valid. Every failing rule is flagged (not only empty values), and nested paths
work: `'address.city'`, `'items[0].name'`.

```ts
await validateSchema({ field: 'username', schema, input: input.value, error: error.value })
```

**Reset** all messages/flags with `clearSchemaValidation({ error })` (Ref or `error.value`), and check current validity
with `validateAllSchemaCheck(error)` (`true` if any field is invalid). See
[Useful Utils](../repo/useful-utils#usemonoutility-helpers) for the full signatures.

::: tip Typed schema + error
`@mono-lit/utility/runtime` also exports helper types — `SchemaObject<T>` (a typed `.shape<…>()`) and
`ValidateError<T>` / `MonoValidateError` (the `{ valid, message }` map) — for full
type-safety on nested forms. Import them when you want the compiler to check your schema against
your input type.
:::

## Where it plugs in

For per-field rules inside [`controlMonoForm`](../ui/form#schema-rules), pass a field-level yup
schema as a rule: `validates: [{ schema: yup.string().min(6, 'Min 6') }]`.


The validation state (`error[field].valid` / `.message`) drives the form controls — bind it to the
`validation-state` / `validation-message` props on `<mono-input>`, `<mono-select>`, etc., so a
failed field shows its message inline.

## Optional dependency

`yup` is an **optional peer** of `@mono-lit/utility` — install it only in apps that validate forms. The
app owns the schemas (you write `yup.object().shape(...)`), so Yup lives in the app the same way
[notivue](./notivue) does. Without it, the validation helpers simply aren't used; everything else
in `@mono-lit/utility` works unchanged.

::: tip Your yup, not a bundled copy
`@mono-lit/utility` imports nothing from `yup` at runtime: the helpers drive the schema you pass
through its own methods (`validate`, `validateAt`, `pick`). So the app's `yup` is the only copy
in the bundle, and no `tiny-case` / `optimizeDeps` interop is involved.
:::

::: warning Changed behaviour
`validateSchema` used to resolve `true` when the field was **invalid** and only flagged empty
values. It now resolves `true` when **valid**, matching `validateAllSchema`, and flags every
failing rule. `validateAllSchema` also clears slots that pass on re-validation.
:::
