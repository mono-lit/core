<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const frameworks = [
  { id: 'vue', name: 'Vue' },
  { id: 'react', name: 'React' },
  { id: 'angular', name: 'Angular' },
  { id: 'svelte', name: 'Svelte' },
  { id: 'solid', name: 'Solid' },
  { id: 'qwik', name: 'Qwik' },
  { id: 'preact', name: 'Preact' },
  { id: 'lit', name: 'Lit' },
]

// Pre-select 4 so the "+N more" overflow shows immediately (max-visible = 3).
const selected = ref<string[]>(['vue', 'react', 'svelte', 'solid'])
</script>

<template>
  <div style="width: 100%;">
    <mono-tag-input
      checkable
      :max-visible.prop="3"
      :items.prop="frameworks"
      :model-value.prop="selected"
      key-value="id"
      display-value="name"
      label="Frameworks"
      placeholder="Pick frameworks…"
      @change="selected = ($event.detail.currentValue as string[])"
    ></mono-tag-input>

    <p style="margin-top: 0.75rem; font-size: 0.82rem; opacity: 0.7;">
      selected: {{ selected.length ? selected.join(', ') : '—' }}
    </p>
  </div>
</template>
