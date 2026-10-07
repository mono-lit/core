<script setup>
import '@mono-lit/helper/ui/breadcrumb'
const iconifyItems = [
  { id: 'home', title: 'Dashboard', href: '#', icon: 'i-mdi-view-dashboard' },
  { id: 'team', title: 'Team', href: '#', icon: 'i-mdi-account-group' },
  { id: 'member', title: 'Ahmad Fauzi', icon: 'i-mdi-account-circle' },
]

const slotItems = [
  { id: 'home', title: 'Home', href: '#' },
  { id: 'klaim', title: 'Klaim', href: '#' },
  { id: 'detail', title: '#KLM-0053' },
]
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.05rem; width: 100%;">
    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">Iconify (item.icon)</div>
      <mono-breadcrumb :items.prop="iconifyItems"></mono-breadcrumb>
    </div>

    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">Slotted SVGs (slot=&quot;icon-{id}&quot;)</div>
      <mono-breadcrumb :items.prop="slotItems">
        <svg slot="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12l9-9 9 9" />
          <path d="M5 10v10h14V10" />
        </svg>
        <svg slot="icon-klaim" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </mono-breadcrumb>
    </div>
  </div>
</template>
