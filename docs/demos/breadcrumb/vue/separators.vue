<script setup>
import '@mono-lit/helper/ui/breadcrumb'
const items = [
  { id: 'home', title: 'Dashboard', href: '#' },
  { id: 'catalog', title: 'Catalog', href: '#' },
  { id: 'item', title: 'Item' },
]
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
    <mono-breadcrumb :items.prop="items" separator="›"></mono-breadcrumb>
    <mono-breadcrumb :items.prop="items" separator="/"></mono-breadcrumb>
    <mono-breadcrumb :items.prop="items" separator="•"></mono-breadcrumb>
    <mono-breadcrumb :items.prop="items">
      <svg slot="separator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 6 15 12 9 18"></polyline>
      </svg>
    </mono-breadcrumb>
  </div>
</template>
