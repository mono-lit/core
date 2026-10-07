<script setup>
import '@mono-lit/helper/ui/tabs'
import { ref } from 'vue'

const items = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'history', label: 'History' },
]
const active = ref('overview')
</script>

<template>
  <!-- Accent + spacing set on the wrapper cascade into the tab strip inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="width: fit-content; --mono-tabs-accent: #7c3aed; --mono-tabs-pad-x: 1.25rem; --mono-tabs-gap: 0.6rem;">
    <mono-tabs
      :items.prop="items"
      :model-value="active"
      @change="active = $event.detail.modelValue"
    ></mono-tabs>
  </div>
</template>
