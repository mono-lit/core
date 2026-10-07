# Form

A headless form controller — there is **no `mono-form` element**. You author a native `<form>` and place controls wherever you like; `controlMonoForm` owns the value, the validation, the cross-field reactions and the props pushed onto each control.

Controls opt in with two props: `:control-form` (the controller) and `key-form` (which field it is). That's the whole binding — no `:model-value`, no `@change`, because the form owns the value and writes it into the control.

## Control

`controlMonoForm` owns the value + validation; each `mono-input` / `mono-select` / … opts in with `:control-form` + `key-form`, and the live `items()` readout is yours to use.

<ClientOnly>
<DemoSingle name="form" id="control" />
</ClientOnly>

## Basic

Values, rules and the live `items()` readout. Rules run `live` (every keystroke, on `input`) or on `change` (commit/blur, on `change`); set the default with `validation.type` and override it per rule with `timing`. `form.validate()` runs every rule regardless — that's the submit sweep. Only the first failing rule is reported per field, since the controls render a single message.

<ClientOnly>
<DemoSingle name="form" id="basic" />
</ClientOnly>

## Cross-field watchers

A field's `watcher` runs for **every** change in the form: its own (`peerKey === selfKey`) and every other field's (`peerKey` = the field that changed). That fan-out is what lets one field react to another with no separate peer registry. `event` and `peerEvent` carry the originating DOM `CustomEvent`, and are `undefined` after a programmatic `setValue`.

<ClientOnly>
<DemoSingle name="form" id="cross-field" />
</ClientOnly>

## External refs and reactivity

`external` takes anything ref-like (a Vue `ref` qualifies), read from watchers as `external.<name>`; call `form.refresh()` when it changes. Pass a `state` ref and the form writes a fresh snapshot into it on every change, so a template re-renders with no manual subscription — `form.subscribe(fn)` is the lower-level primitive.

<ClientOnly>
<DemoSingle name="form" id="external" />
</ClientOnly>

## Prop precedence

`inputs[key].props` (static) → the `setProp()` method (from watchers or outside) → your template bindings. **The static `props` always wins**, so a watcher can't override a prop the config also declares. Same key name and role as `controlMonoTable({ props })`.

## Events from the controller

A control's `props` also take its **events**, as `on<Event>` keys — `onChange`, `onInput`, `onClear`, … — the same spelling Vue gives a listener prop. The form attaches each one to the element as a DOM listener (never as a property), so a store can own a control's behaviour next to its configuration and the template carries nothing but the binding:

```ts
const form = controlMonoForm({
  inputs: {
    Name: {
      component: 'mono-input',
      value: '',
      props: {
        label: 'Name',
        onChange: (event) => save(event.detail.modelValue),   // typed from InputEvents
      },
    },
  },
})

// Runtime — a new function replaces the old listener, `null` removes it.
form.setProp({ key: 'Name', props: { onInput: (e) => draft(e.detail.modelValue) } })
form.setProp({ key: 'Name', props: { onInput: null } })
```

The handler receives exactly what a template `@change` would — the element's event, with the model on `event.detail` — in both the light and the shadow build. A template listener on the same element still fires too: they are two listeners, not a replacement. Handlers follow the same precedence as any other prop (a static `inputs[key].props` handler wins over one set through `setProp()`), are attached **once** no matter how often the form re-applies its props, and leave the element with the form when it is re-bound to another one.

<ClientOnly>
<DemoSingle name="form" id="events" />
</ClientOnly>

## Visibility

Every supported control takes `:visible` (default `true`) and `:visible-type`, so a conditional field is a line of form config instead of a `v-if` in the template — and the control stays registered with the controller while hidden.

`:visible-type="'none'"` (the default) applies `display: none`, removing the control from layout so it leaves no gap. `:visible-type="'invisible'"` applies `visibility: hidden`, keeping its space so nothing around it shifts. Both are written on the **host** element, which is what lets `none` release its cell in a grid or flex form.

```ts
form.setProp({ key: 'TaxId', props: { visible: false } })
```

Two things to know. The prop is **purely visual** — a hidden field keeps its value and its rules still run, so a hidden `required` field will still fail `form.validate()`; drop the rule (or skip the key) yourself if that isn't what you want. And because a static `inputs[key].props` always wins (see above), a field you intend to toggle must **not** declare `visible` there.

Under SSR, a `mono-shadow-*` control that is server-rendered with `visible: false` ships visible and hides once it hydrates — Lit SSR doesn't run the lifecycle that writes the style. Toggling at runtime, which is what this prop is for, is unaffected.

<ClientOnly>
<DemoSingle name="form" id="visibility" />
</ClientOnly>

## Supported controls

`mono-input`, `mono-textarea`, `mono-select`, `mono-tag-input`, `mono-date`, `mono-file-upload` and `mono-dropdown-table` support the full set — value, props **and** the rendered validation message.

`mono-checkbox`, `mono-radio` and `mono-switch` are wired for **value and props only**: they have no `validation-state` / `validation-message` props today, so `setValidation` on those keys updates `form.items()` but has nothing to render on the control. Read it from `items()` and render your own message until those props exist.

## Types

`controlMonoForm` is also exported as `monoForm`, and `:control-form` is also accepted as `:data-form` — the older spellings still work.

<DemoTypes name="form" />
