<script setup>
import '@mono-lit/helper/ui/breadcrumb'
const items = [
  { id: 'dashboard', title: 'Dashboard', href: '#' },
  { id: 'eng', title: 'Engineering Department', href: '#' },
  { id: 'frontend', title: 'Frontend Platform Group', href: '#' },
  { id: 'cl', title: 'Component Library Initiative', href: '#' },
  { id: 'spec', title: 'Breadcrumb Component Specification' },
]
</script>

<template>
  <div style="max-width: 32rem; width: 100%;">
    <mono-breadcrumb :items.prop="items" truncate></mono-breadcrumb>
  </div>
</template>
