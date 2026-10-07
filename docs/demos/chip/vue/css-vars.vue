<script setup>
import '@mono-lit/helper/ui/chip'
</script>

<template>
  <!-- Re-tint on the wrapper: --mono-chip-primary cascades into every chip inside,
       and the soft/solid/outline tints all derive from it (custom properties
       inherit — and pierce the shadow boundary). -->
  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; --mono-chip-primary: #7c3aed;">
    <mono-chip color="primary">Soft</mono-chip>
    <mono-chip color="primary" variant="solid">Solid</mono-chip>
    <mono-chip color="primary" variant="outline">Outline</mono-chip>
  </div>
</template>
