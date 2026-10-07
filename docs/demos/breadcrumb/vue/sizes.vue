<script setup>
import '@mono-lit/helper/ui/breadcrumb'
const items = [
  { id: 'home', title: 'Dashboard', href: '#' },
  { id: 'settings', title: 'Settings', href: '#' },
  { id: 'profile', title: 'Profile' },
]
const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.95rem; width: 100%;">
    <div v-for="s in sizes" :key="s" style="display: flex; align-items: center; gap: 1rem;">
      <span style="min-width: 2.2rem; font-size: 0.7rem; color: var(--foreground); opacity: 0.55; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">{{ s }}</span>
      <mono-breadcrumb :items.prop="items" :size="s"></mono-breadcrumb>
    </div>
  </div>
</template>
