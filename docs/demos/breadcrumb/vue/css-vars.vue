<script setup>
import '@mono-lit/helper/ui/breadcrumb'
const items = [
  { id: 'home', title: 'Dashboard', href: '#' },
  { id: 'reports', title: 'Reports', href: '#' },
  { id: 'q4', title: 'Q4' },
]
</script>

<template>
  <!-- Accent + radius set on the wrapper cascade into the breadcrumb inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="--mono-breadcrumb-accent: var(--purple); --mono-breadcrumb-radius: 999px;">
    <mono-breadcrumb :items.prop="items" variant="contained"></mono-breadcrumb>
  </div>
</template>
