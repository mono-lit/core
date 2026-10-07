<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('dashboard')
const items = [
  { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
  { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
  { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]

// Brand tokens on the pane cascade into BOTH the sidebar and the slotted menu.
const paneStyle =
  'position: relative; height: 320px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted); --mono-sidebar-surface: #faf5ff; --mono-sidebar-accent: #7c3aed; --mono-menu-accent: #7c3aed;'
const contentStyle =
  'padding: 1.25rem 1.25rem 1.25rem calc(220px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem;'
</script>

<template>
  <div :style="paneStyle">
    <mono-sidebar mode="permanent" :width="220" :contained="true">
      <div slot="header" style="font-weight: 800; font-size: 0.9rem; color: #7c3aed;">Mono UI</div>
      <mono-menu
        variant="nav"
        :items.prop="items"
        :model-value="active"
        @change="active = $event.detail.modelValue"
      />
    </mono-sidebar>
    <div :style="contentStyle">
      Sidebar surface + accent and the menu accent all come from
      <code>--mono-sidebar-*</code> / <code>--mono-menu-*</code> on the pane.
    </div>
  </div>
</template>
