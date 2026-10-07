<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('dashboard')
const items = [
  { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
  { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
  { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]
const wrapStyle =
  'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px; --mono-menu-accent: #7c3aed; --mono-menu-radius: 12px; --mono-menu-gap: 0.9rem;'
</script>

<template>
  <!-- Accent, radius and gap set on the wrapper cascade into the menu inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div :style="wrapStyle">
    <mono-menu
      variant="nav"
      :items.prop="items"
      :model-value="active"
      @change="active = $event.detail.modelValue"
    />
  </div>
</template>
