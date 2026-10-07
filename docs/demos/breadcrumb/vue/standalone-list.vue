<script setup>
import '@mono-lit/helper/ui/breadcrumb'
// <mono-breadcrumb-list> works without a <mono-breadcrumb> wrapper. When
// rendered standalone, it emits its own <nav class="mono-breadcrumb …"><ol>
// structure and reads its modifier attributes (size, color, variant, …)
// directly.
const items = [
  { id: 'home', title: 'Dashboard', href: '#' },
  { id: 'docs', title: 'Docs', href: '#' },
  { id: 'guide', title: 'Quickstart' },
]
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.85rem; width: 100%;">
    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">items array</div>
      <mono-breadcrumb-list :items.prop="items" size="md" color="success" variant="underlined"></mono-breadcrumb-list>
    </div>

    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">single-row direct props</div>
      <mono-breadcrumb-list
        title="Dashboard"
        href="#"
        size="md"
        color="info"
        variant="contained"
      ></mono-breadcrumb-list>
    </div>
  </div>
</template>
