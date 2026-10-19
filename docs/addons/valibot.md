# Valibot

Schema-based **form validation** with [Valibot](https://valibot.dev): the same helpers and `error`
object as [Yup](./yup), but a much smaller bundle. Valibot is modular, so an app ships only the
validators it imports, often under 1 kB. Pass a Valibot schema to the validation helpers from
[`useMonoUtility`](../repo/useful-utils) (`validateAllSchema`, `validateSchema`,
`validateAllSchemaCheck`, `clearSchemaValidation`) and it just works. Valibot is an **optional**
dependency, and `@mono-lit/utility` imports nothing from it.

## The pattern

Three pieces: a reactive **input**, a **Valibot schema**, and an **error** object that mirrors the
form, with one `{ valid, message }` slot per field. These are exactly the same calls as with Yup;
only the schema changes.

```ts
import * as v from 'valibot'
import { useMonoUtility } from '@mono-lit/utility/runtime'

const { validateAllSchema, validateSchema, clearSchemaValidation } = useMonoUtility()

const input = ref({ username: '', password: '' })

const schema = v.object({
  username: v.pipe(v.string(), v.nonEmpty('Username is required')),
  password: v.pipe(
    v.string(),
    v.nonEmpty('Password is required'),
    v.minLength(6, 'Min 6 characters'),
  ),
})

// one { valid, message } slot per field
const error = ref({
  username: { valid: true, message: '' },
  password: { valid: true, message: '' },
})
```

**Validate the whole form.** It resolves `true` when valid, and the callback runs only then:

```ts
await validateAllSchema(
  { schema, input: input.value, error: error.value },
  async () => { await submit() },        // valid → proceed
)
```

**Validate a single field**, e.g. on blur. It updates only that field's slot and resolves `true`
when the field is valid. Nested paths work too: `'address.city'`, `'items[0].name'`.

```ts
await validateSchema({ field: 'username', schema, input: input.value, error: error.value })
```

**Reset** every slot with `clearSchemaValidation({ error })`. It accepts the Ref or `error.value`.
`validateAllSchemaCheck(error)` returns `true` if any field is currently invalid.

## Nested objects and arrays

Shape the `error` object like the input. Each issue's path is followed into it, and only slots
that already exist are written:

```ts
const schema = v.object({
  address: v.object({ city: v.pipe(v.string(), v.nonEmpty('City is required')) }),
  items: v.array(v.object({ name: v.pipe(v.string(), v.nonEmpty('Name is required')) })),
})

const error = ref({
  address: { city: { valid: true, message: '' } },
  items: [{ name: { valid: true, message: '' } }],
})
```

## Cross-field checks

Put a `forward` + `partialCheck` on the object to send the message to the field it belongs to.
`validateSchema({ field: 'confirm', … })` picks it up as well:

```ts
const schema = v.pipe(
  v.object({ password: v.string(), confirm: v.string() }),
  v.forward(
    v.partialCheck(
      [['password'], ['confirm']],
      (i) => i.password === i.confirm,
      'Passwords do not match',
    ),
    ['confirm'],
  ),
)
```

## Async checks

Async schemas (`objectAsync`, `pipeAsync`, `checkAsync`) are awaited, so a server-side check
such as "username taken" goes through the same helpers:

```ts
const schema = v.objectAsync({
  username: v.pipeAsync(
    v.string(),
    v.checkAsync(async (u) => !(await isTaken(u)), 'Username taken'),
  ),
})
```

::: tip Typed input + error
Infer the form type from the schema with `v.InferInput<typeof schema>`, then type the error map
with `MonoValidateError<T>` from `@mono-lit/utility/runtime`:

```ts
type Form = v.InferInput<typeof schema>
const input = ref<Form>({ username: '', password: '' })
const error = ref<MonoValidateError<Form>>({ /* … */ })
```
:::

## Where it plugs in

For per-field rules inside [`controlMonoForm`](../ui/form#schema-rules), pass a field-level
Valibot schema as a rule: `validates: [{ schema: v.pipe(v.string(), v.minLength(6, 'Min 6')) }]`.


The validation state (`error[field].valid` / `.message`) drives the form controls. Bind it to the
`validation-state` / `validation-message` props on `<mono-input>`, `<mono-select>`, etc., so a
failed field shows its message inline.

## Optional dependency

```sh
pnpm add valibot
```

`valibot` is an **optional peer** of `@mono-lit/utility`; install it only in apps that validate
forms. The helpers never import it. They validate through
[Standard Schema](https://standardschema.dev) (`schema['~standard'].validate`), which Valibot
implements. The same calls therefore also accept any other Standard Schema library (Zod, ArkType,
…), and `@mono-lit/utility` adds nothing to your bundle for it.
