<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const tags = ref<unknown[]>([])

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
    <mono-tag-input
      :items.prop="grouped"
      :display-group.prop="displayGroup"
      group-key="k"
      group-items="rows"
      key-value="id"
      display-value="name"
      checkable
      label="Produce"
      placeholder="Add produce…"
      @change="tags = $event.detail.modelValue"
    ></mono-tag-input>

    <div style="font-family: 'DM Mono', ui-monospace, monospace; font-size: 0.8rem; opacity: 0.7;">
      selected ids → {{ tags.length ? tags.join(', ') : '—' }}
    </div>
  </div>
</template>
