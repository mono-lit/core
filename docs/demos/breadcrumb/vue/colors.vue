<script setup>
import '@mono-lit/helper/ui/breadcrumb'
import { ref } from 'vue'

// Pick a colour and every variant takes it — the current item and the hover
// state ink in the role (`surface` resolves back to --foreground).
const color = ref('primary')

const items = [
  { id: 'home', title: 'Dashboard', href: '#' },
  { id: 'reports', title: 'Reports', href: '#' },
  { id: 'q4', title: 'Q4 Summary' },
]
const variants = ['default', 'contained', 'underlined']
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="nav" />
    </DemoControls>

    <div style="display: flex; flex-direction: column; gap: 0.95rem;">
      <div v-for="v in variants" :key="v" style="display: flex; align-items: center; gap: 1rem;">
        <span style="min-width: 5.5rem; font-size: 0.7rem; color: var(--foreground); opacity: 0.55; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">{{ v }}</span>
        <mono-breadcrumb :items.prop="items" :variant="v" :color="color"></mono-breadcrumb>
      </div>
    </div>
  </div>
</template>
