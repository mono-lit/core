<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/filter'
import '@mono-lit/helper/ui/card'
import { controlMonoFilterBuilder } from '@mono-lit/helper'

// `fields` is the source of truth for the field dropdown. `dataType` decides which
// OData operators that column offers, and which value editor renders.
const filter = controlMonoFilterBuilder({
  fields: [
    { field: 'Nama', caption: 'Display Name', dataType: 'string' },
    { field: 'Pesan', caption: 'Message', dataType: 'string' },
    { field: 'Jumlah', caption: 'Payment', dataType: 'number' },
    { field: 'Aktif', caption: 'Active', dataType: 'boolean' },
    { field: 'Tanggal', caption: 'Date', dataType: 'date' },
  ],
  // Shape-flexible: an array or an OData string, auto-detected.
  filter: [['Nama', 'contains', 'Andy'], 'and', [['Pesan', '=', 'hi'], 'or', ['Jumlah', '>', 100]]],
})

const asArray = ref<unknown>(filter.changed({ type: 'array' }))
const asString = ref<string>(filter.changed({ type: 'string' }) as string)

// The controller notifies on every edit — mirror it into refs for display.
filter.subscribe(() => {
  asArray.value = filter.changed({ type: 'array' })
  asString.value = filter.changed({ type: 'string' }) as string
})
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <mono-filter-builder :control-filter-builder.prop="filter" data-builder />

    <div class="example-out">
      <div class="example-out-row">
        <strong>changed({{ '{' }} type: 'string' {{ '}' }})</strong>
        <code data-out-string>{{ asString || '—' }}</code>
      </div>
      <div class="example-out-row">
        <strong>changed({{ '{' }} type: 'array' {{ '}' }})</strong>
        <code data-out-array>{{ JSON.stringify(asArray) }}</code>
      </div>
      <div class="example-out-row">
        <strong>original()</strong>
        <code data-out-original>{{ JSON.stringify(filter.original({ type: 'array' })) }}</code>
      </div>
    </div>
  </mono-card>
</template>

<style scoped>
.example-card {
  width: 100%;
  --mono-card-padding: 1rem;
}
.example-out {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px dashed var(--border);
  font-size: 0.78rem;
}
.example-out-row {
  display: grid;
  grid-template-columns: 12rem 1fr;
  gap: 0.6rem;
  align-items: start;
}
.example-out-row code {
  word-break: break-all;
  color: var(--primary);
}
@media (max-width: 640px) {
  .example-out-row {
    grid-template-columns: 1fr;
  }
}
</style>
