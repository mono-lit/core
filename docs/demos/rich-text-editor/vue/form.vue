<script setup>
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/rich-text-editor'
import '@mono-lit/helper/ui/button'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

// No :model-value, no @change — the form owns the value. `required` sees
// an emptied editor as '' (SunEditor's `<p><br></p>` never reaches the rule).
const form = controlMonoForm({
  validation: { type: 'live' },
  inputs: {
    Title: {
      component: 'mono-input',
      value: '',
      validates: [{ type: 'required', message: 'A title is required' }],
    },
    Body: {
      component: 'mono-rich-text-editor',
      value: '',
      props: { toolbar: 'basic', minHeight: '7rem' },
      validates: [
        { type: 'required', message: 'Write a body' },
        { type: 'max', value: 400, message: 'Keep it under 400 characters of HTML' },
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
  <form class="example-form" @submit.prevent="onSubmit">
    <mono-input :control-form="form" key-form="Title" label="Title" placeholder="Release notes" />
    <mono-rich-text-editor :control-form="form" key-form="Body" label="Body" required />
    <div>
      <mono-button type="submit">Submit</mono-button>
    </div>
    <pre v-if="submitted" class="example-html">{{ submitted }}</pre>
  </form>
</template>

<style scoped>
.example-form {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
}
.example-html {
  margin: 0;
  padding: calc(var(--mono-spacing) * 2) calc(var(--mono-spacing) * 3);
  border-radius: var(--mono-radius-md);
  background: var(--muted);
  color: var(--foreground);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--mono-text-xs);
  line-height: var(--mono-leading-relaxed);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
