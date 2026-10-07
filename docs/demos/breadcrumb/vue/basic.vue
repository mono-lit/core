<script setup>
import '@mono-lit/helper/ui/breadcrumb'
const items = [
  { id: 'home', title: 'Dashboard', href: '#' },
  { id: 'klaim', title: 'Klaim', href: '#' },
  { id: 'detail', title: 'Detail Klaim' },
]
</script>

<template>
  <mono-breadcrumb style="width: fit-content;" :items.prop="items"></mono-breadcrumb>
</template>
