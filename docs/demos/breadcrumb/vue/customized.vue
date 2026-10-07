<script setup>
import '@mono-lit/helper/ui/breadcrumb'
const items = [
  { id: 'dashboard', title: 'Dashboard', href: '#' },
  { id: 'premium', title: 'Premium', href: '#' },
  { id: 'gold', title: 'Gold tier' },
]

const cssClass = {
  root: 'example-breadcrumb-root',
  separator: 'example-breadcrumb-sep',
  itemCurrent: 'example-breadcrumb-current',
  action: 'example-breadcrumb-action',
}
</script>

<template>
  <mono-breadcrumb style="width: fit-content;" :items.prop="items" :css-class.prop="cssClass" variant="contained"></mono-breadcrumb>
</template>

<style>
.example-breadcrumb-root {
  font-family: 'DM Serif Display', 'Georgia', serif;
  font-size: 0.88rem;
}
.example-breadcrumb-sep {
  color: var(--warning) !important;
  font-weight: 700;
}
.example-breadcrumb-action {
  border-radius: var(--mono-radius-full, 999px) !important;
  letter-spacing: 0.01em;
}
/* The part ATTRIBUTE, not the legacy class — and a flat role fill, since the
   port has no gradients left to match. */
.example-breadcrumb-current > [mono-action] {
  background: var(--warning) !important;
  color: var(--warning-foreground) !important;
  border-color: transparent !important;
}
</style>
