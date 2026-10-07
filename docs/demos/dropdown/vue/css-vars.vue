<script setup>
import '@mono-lit/helper/ui/dropdown'
import { ref } from 'vue'

const open = ref(true)
const triggerStyle =
  'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
  <!-- Panel accent, radius and padding set on the wrapper cascade into the
       dropdown inside (custom properties inherit — and pierce the shadow boundary). -->
  <div style="padding: 1rem 1rem 8rem; display: flex; justify-content: center; --mono-dropdown-accent: #7c3aed; --mono-dropdown-radius: 16px; --mono-dropdown-pad-x: 1.25rem;">
    <mono-dropdown
      placement="bottom-start"
      :model-value="open"
      @toggle="open = $event.detail.modelValue"
    >
      <button slot="main" type="button" :style="triggerStyle">Themed dropdown</button>
      <div slot="body">Panel accent, radius and padding come from <code>--mono-dropdown-*</code>.</div>
    </mono-dropdown>
  </div>
</template>
