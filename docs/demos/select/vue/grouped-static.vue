<script setup lang="ts">
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

const selected = ref<unknown>(null)

// Pre-grouped, two levels, with CUSTOM field names: `k` (key) and `rows`
// (children) instead of the default `key` / `items`.
const grouped = [
  {
    k: 'Fruits',
    rows: [
      { k: 'Citrus', rows: [
        { id: 1, name: 'Orange', cat: 'Fruits', sub: 'Citrus' },
        { id: 2, name: 'Lemon', cat: 'Fruits', sub: 'Citrus' },
      ] },
      { k: 'Berry', rows: [
        { id: 3, name: 'Strawberry', cat: 'Fruits', sub: 'Berry' },
      ] },
    ],
  },
  {
    k: 'Vegetables',
    rows: [
      { k: 'Root', rows: [
        { id: 4, name: 'Carrot', cat: 'Vegetables', sub: 'Root' },
        { id: 5, name: 'Beet', cat: 'Vegetables', sub: 'Root' },
      ] },
    ],
  },
]

// L0 header from row.cat (string accessor), L1 header from row.sub (function).
const displayGroup = ['cat', (row: any) => row.sub]
</script>

<template>
  <div style="width: 100%; display: grid; gap: 0.6rem;">
    <mono-select
      :items.prop="grouped"
      :display-group.prop="displayGroup"
      group-key="k"
      group-items="rows"
      key-value="id"
      display-value="name"
      label="Produce"
      placeholder="Pick produce"
      :model-value="selected"
      @change="selected = $event.detail.modelValue"
    ></mono-select>

    <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
      selected id → {{ selected ?? '—' }}
    </div>
  </div>
</template>
