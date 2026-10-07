<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const ROLES = [
  { Id: 'admin', Name: 'Administrator' },
  { Id: 'editor', Name: 'Editor' },
  { Id: 'viewer', Name: 'Viewer' },
  { Id: 'auditor', Name: 'Auditor' },
  { Id: 'billing', Name: 'Billing' },
]

const searchable = ref(false)
const tags = ref<unknown[]>(['editor'])
</script>

<template>
  <div style="width: 100%; display: grid; gap: 0.7rem;">
    <DemoCheck v-model="searchable"><code>searchable</code> = {{ searchable }}</DemoCheck>

    <mono-tag-input
      :items.prop="ROLES"
      :searchable="searchable"
      allow-custom="false"
      checkable
      key-value="Id"
      display-value="Name"
      label="Roles"
      :placeholder="searchable ? 'Type to filter…' : 'Click to pick'"
      :model-value.prop="tags"
      @change="tags = $event.detail.modelValue"
    ></mono-tag-input>

    <p class="example-hint">
      With search off the field is read-only — it cannot be typed into and never
      filters. Clicking still opens the list, <kbd>↓</kbd> / <kbd>Enter</kbd> still
      pick, and <kbd>Backspace</kbd> still removes the last chip.
    </p>

    <DemoReadout>selected → {{ tags.length ? tags.join(', ') : '—' }}</DemoReadout>
  </div>
</template>

<style scoped>
.example-hint {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.75;
  line-height: 1.5;
}
</style>
