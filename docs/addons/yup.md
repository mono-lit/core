# Yup

Schema-based **form validation**, built on [Yup](https://github.com/jquense/yup). You don't call
Yup's `.validate()` yourself — you build a schema, keep an `error` object, and run it through the
validation helpers from [`useMonoUtility`](../repo/useful-utils) (`validateAllSchema`,
`validateSchema`, `validateAllSchemaCheck`, `clearSchemaValidation`). Yup is an **optional**
dependency: skip it if an app has no forms to validate.

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

**Validate the whole form** (the callback runs only when everything passes):

```ts
await validateAllSchema(
  { schema, input: input.value, error: error.value },
  async () => { await submit() },        // valid → proceed
)
```

**Validate a single field** (e.g. on blur) — updates just that field's `error` slot:

```ts
await validateSchema({ field: 'username', schema, input: input.value, error: error.value })
```

**Reset** all messages/flags with `clearSchemaValidation({ error })`, and check current validity
with `validateAllSchemaCheck(error)` (`true` if any field is invalid). See
[Useful Utils](../repo/useful-utils#usemonoutility-helpers) for the full signatures.

::: tip Typed schema + error
`@mono-lit/utility/runtime` also exports helper types — `SchemaObject<T>` (a typed `.shape<…>()`) and
`ValidateError<T>` / `MonoValidateError` (the `{ valid, message }` map) — for full
type-safety on nested forms. Import them when you want the compiler to check your schema against
your input type.
:::

## Where it plugs in

The validation state (`error[field].valid` / `.message`) drives the form controls — bind it to the
`validation-state` / `validation-message` props on `<mono-input>`, `<mono-select>`, etc., so a
failed field shows its message inline.

## Optional dependency

`yup` is an **optional peer** of `@mono-lit/utility` — install it only in apps that validate forms. The
app owns the schemas (you write `yup.object().shape(...)`), so Yup lives in the app the same way
[notivue](./notivue) does. Without it, the validation helpers simply aren't used; everything else
in `@mono-lit/utility` works unchanged.

::: tip Vite interop (`tiny-case`) — handled for you
`yup` imports the CommonJS `tiny-case`, which has no named ESM exports, so a Vite dev server would
normally throw `doesn't provide an export named 'snakeCase'` when it hits `@mono-lit/utility`'s validation
helpers. **`@mono-lit/utility` bundles its own copy of `yup` (and `tiny-case`) into its dist at build
time**, so that chain never reaches your app — no `optimizeDeps` / `ssr.noExternal` wiring is needed
in either a Nuxt or a plain-Vite host.

The `yup` you install in your app (for authoring schemas) is a **separate, normal dependency** that
Vite pre-bundles automatically the first time it's imported. Same version as `@mono-lit/utility`'s bundled
copy, so schemas built with your `yup` validate correctly through the helpers.
:::
