<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/filter'
import '@mono-lit/helper/ui/card'
import { controlMonoFilterBuilder } from '@mono-lit/helper'

// The same `filter` option accepts an OData `$filter` STRING — it is parsed and the
// rows render from it. No extra flag: the shape is detected from `typeof`.
const SOURCE = "contains(Nama,'Andy') and (Jumlah gt 100 or Aktif eq true)"

const filter = controlMonoFilterBuilder({
  fields: [
    { field: 'Nama', caption: 'Display Name', dataType: 'string' },
    { field: 'Jumlah', caption: 'Payment', dataType: 'number' },
    { field: 'Aktif', caption: 'Active', dataType: 'boolean' },
  ],
  filter: SOURCE,
  // Localise every label — operator names and chrome both.
  texts: {
    matchPrefix: 'Cocokkan',
    matchSuffix: 'dari aturan berikut:',
    and: 'semua',
    or: 'apapun',
    addRule: 'Peraturan Baru',
    addGroup: 'Grup Baru',
    contains: 'mengandung',
    eq: 'adalah sama dengan',
    isblank: 'diatur',
    apply: 'Pencarian',
    clear: 'Buang',
  },
})

// A string went in, so a `type`-less read gives a string back.
const live = ref<string>(filter.changed() as string)
filter.subscribe(() => { live.value = filter.changed() as string })
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <p class="example-src">
      Loaded from: <code>{{ SOURCE }}</code>
    </p>

    <mono-filter-builder :control-filter-builder.prop="filter" data-builder />

    <div class="example-out">
      <strong>changed()</strong>
      <code data-out-live>{{ live || '—' }}</code>
    </div>
  </mono-card>
</template>

<style scoped>
.example-card {
  width: 100%;
  --mono-card-padding: 1rem;
}
.example-src {
  margin: 0 0 0.9rem;
  font-size: 0.78rem;
  color: var(--foreground);
  opacity: 0.75;
}
.example-out {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px dashed var(--border);
  font-size: 0.78rem;
}
.example-out code {
  word-break: break-all;
  color: var(--primary);
}
</style>
