<script setup>
import { ref, onBeforeUnmount } from 'vue'
import * as v from 'valibot'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/card'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

// Field-level schemas: each one receives ONLY its field's value.
const username = v.pipe(
  v.string(),
  v.nonEmpty('Username is required'),
  v.minLength(3, 'Min 3 characters'),
  v.regex(/^[a-z0-9_]+$/, 'Lowercase letters, digits and _ only'),
)
const taken = new Set(['admin', 'root'])
const usernameFree = v.pipeAsync(
  v.string(),
  v.checkAsync(async (name) => {
    await new Promise((r) => setTimeout(r, 300)) // pretend server round-trip
    return !taken.has(name)
  }, 'That username is taken'),
)
const password = v.pipe(
  v.string(),
  v.minLength(8, 'Min 8 characters'),
  v.regex(/\d/, 'Needs at least one digit'),
)

const form = controlMonoForm({
  validation: { type: 'live' },
  inputs: {
    Username: {
      component: 'mono-input',
      value: '',
      validates: [
        { schema: username },
        // async check only on commit — no request per keystroke
        { schema: usernameFree, timing: 'change' },
      ],
    },
    Password: {
      component: 'mono-input',
      value: '',
      validates: [
        { type: 'required', message: 'Password is required' },
        { schema: password },
      ],
    },
    Confirm: {
      component: 'mono-input',
      value: '',
      // Cross-field: a schema never sees other fields, a `custom` rule does.
      validates: [
        {
          type: 'custom',
          validate: ({ value, values }) => value === values.Password || 'Passwords do not match',
        },
      ],
    },
  },
})

const submitted = ref(null)
async function onSubmit() {
  const ok = await form.validate()
  submitted.value = ok ? form.values() : null
}

onBeforeUnmount(() => form.dispose())
</script>

<template>
  <div class="example-form-schema">
    <mono-card bordered width="100%">
      <h3 slot="title">Sign up</h3>
      <p slot="subtitle">Valibot schemas as rules; try "admin" as the username.</p>

      <form class="example-form-schema-fields" @submit.prevent="onSubmit">
        <mono-input :control-form="form" key-form="Username" label="Username" placeholder="ann_01" />
        <mono-input :control-form="form" key-form="Password" label="Password" type="password" />
        <mono-input :control-form="form" key-form="Confirm" label="Confirm password" type="password" />
      </form>

      <div slot="actions" class="example-form-schema-actions">
        <mono-button size="sm" variant="outline" color="neutral" type="button"
          @click="form.reset(); submitted = null">Reset</mono-button>
        <mono-button size="sm" color="primary" @click="onSubmit">Create account</mono-button>
      </div>
    </mono-card>

    <pre class="example-form-schema-pre" data-submitted>{{ submitted ?? '— not valid yet —' }}</pre>
  </div>
</template>

<style scoped>
.example-form-schema {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
}
.example-form-schema-fields {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
}
.example-form-schema-actions {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--mono-spacing) * 2);
  width: 100%;
}
.example-form-schema-pre {
  margin: 0;
  padding: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4);
  border-radius: var(--radius, 0.5rem);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--mono-text-xs);
  color: var(--foreground);
  background: var(--muted);
  overflow: auto;
}
</style>
