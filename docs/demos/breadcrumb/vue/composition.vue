<script setup>
import '@mono-lit/helper/ui/breadcrumb'
// Slot-body composition. The outer <mono-breadcrumb> provides theming + nav
// semantics; the inner <mono-breadcrumb-list> renders the actual rows. Inside
// a body slot, the list element delegates click handling and current-state
// lookups to the parent.
const items = [
  { id: 'home', title: 'Dashboard', href: '#' },
  { id: 'projects', title: 'Projects', href: '#' },
  { id: 'rfc', title: 'RFCs', href: '#' },
  { id: 'current', title: 'Breadcrumb v2', current: true },
]
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.85rem; width: 100%;">
    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">items array on inner list</div>
      <mono-breadcrumb size="md" color="primary" variant="contained">
        <mono-breadcrumb-list slot="body" :items.prop="items"></mono-breadcrumb-list>
      </mono-breadcrumb>
    </div>

    <div>
      <div style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;">v-for of single-row lists</div>
      <mono-breadcrumb size="md" color="success" variant="default">
        <mono-breadcrumb-list
          v-for="it in items"
          slot="body"
          :key="it.id"
          :id="it.id"
          :title="it.title"
          :href="it.href"
          :current="it.current === true"
        />
      </mono-breadcrumb>
    </div>
  </div>
</template>
