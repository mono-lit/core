<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/chip'
import { controlMonoForm } from '@mono-lit/helper/ui/form'

const cities = ref([
  { label: 'Jakarta', value: 'Jakarta' },
  { label: 'Bandung', value: 'Bandung' },
  { label: 'Surabaya', value: 'Surabaya' },
])

// `controlMonoForm` owns the value + validation. Each control opts in with
// `:control-form` + `key-form` — no `:model-value` / `@change` needed.
const state = ref<Record<string, any>>({})

const form = controlMonoForm({
  validation: { type: 'live' },
  state,
  inputs: {
    Name: {
      component: 'mono-input',
      value: '',
      validates: [{ type: 'required', message: 'Name is required' }],
    },
    City: {
      component: 'mono-select',
      value: null,
      props: { items: cities.value, keyValue: 'value', displayValue: 'label' },
      validates: [{ type: 'required', message: 'Pick a city' }],
    },
  },
})

onBeforeUnmount(() => form.dispose())
</script>

<template>
  <form class="example-form" @submit.prevent>
    <mono-input :control-form="form" key-form="Name" label="Name" placeholder="Your name" />
    <mono-select :control-form="form" key-form="City" label="City" placeholder="Pick a city" />

    <!-- the live items() readout — one chip per field, coloured by its validation -->
    <div class="example-form-readout">
      <mono-chip
        v-for="(item, key) in state"
        :key="key"
        size="sm"
        :color="item.validate.success ? 'success' : 'danger'"
        :data-ok="item.validate.success"
      >
        {{ key }}: {{ item.currentValue === '' ? '—' : item.currentValue }}
        <span class="example-form-state">{{ item.validate.success ? '✓' : item.validate.message }}</span>
      </mono-chip>
    </div>
  </form>
</template>

<style scoped>
.example-form {
  display: grid;
  gap: calc(var(--mono-spacing) * 4);
  width: 100%;
  max-width: 26rem;
}
.example-form-readout {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--mono-spacing) * 2);
}
.example-form-state {
  margin-left: calc(var(--mono-spacing) * 1.5);
  font-weight: var(--mono-font-weight-semibold);
}
</style>
