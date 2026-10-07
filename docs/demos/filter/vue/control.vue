<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/filter'
import { controlMonoFilterBuilder } from '@mono-lit/helper'

// `controlMonoFilterBuilder` owns the filter tree; bind the element with
// `:control-filter-builder` and read it back as an OData string whenever it
// notifies.
const filter = controlMonoFilterBuilder({
  fields: [
    { field: 'Name', caption: 'Name', dataType: 'string' },
    { field: 'City', caption: 'City', dataType: 'string' },
  ],
  filter: ['Name', 'contains', 'Andy'],
})

const odata = ref<string>(String(filter.changed({ type: 'string' }) ?? ''))
filter.subscribe(() => {
  odata.value = String(filter.changed({ type: 'string' }) ?? '')
})
</script>

<template>
  <div style="width: 100%;">
    <mono-filter-builder  :control-filter-builder.prop="filter" />
    <p class="example-odata">$filter = <code>{{ odata || '(no filter)' }}</code></p>
  </div>
</template>

<style scoped>
.example-odata {
  margin: 0.6rem 0 0;
  font-size: 0.8rem;
  color: var(--muted-foreground);
  word-break: break-all;
}
.example-odata code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
