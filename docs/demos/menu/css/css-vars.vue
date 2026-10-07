<script setup>
import { ref } from 'vue'

const items = [
  { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
  { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
  { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]
const active = ref('dashboard')
const wrapStyle =
  'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px; --mono-menu-accent: #7c3aed; --mono-menu-radius: 12px; --mono-menu-gap: 0.9rem;'
</script>

<template>
  <!-- Accent, radius and gap set on the wrapper cascade into the menu. -->
  <div :style="wrapStyle">
    <nav mono-menu>
      <ul mono-list role="listbox">
        <li
          v-for="it in items"
          :key="it.id"
          mono-item
          :mono-active="active === it.id ? '' : null"
        >
          <button
            type="button"
            mono-action
            role="option"
            :aria-selected="active === it.id"
            @click="active = it.id"
          >
            <span mono-icon aria-hidden="true">
                <span mono-glyph :class="it.icon"></span>
            </span>
            <span mono-content><span mono-title>{{ it.title }}</span></span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>
