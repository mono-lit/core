<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/button-dropdown'

const last = ref('—')

// Every role an entry can take. Inside the menu `color` is the row's INK, not a
// fill: hover lays the same colour down at 10% (20% in dark mode), so a green
// check never ends up green-on-green.
const buttons = [
  { label: 'Approve', icon: 'i-mdi-check', color: 'success', onClick: () => (last.value = 'success') },
  { label: 'Publish', icon: 'i-mdi-rocket-launch', color: 'primary', onClick: () => (last.value = 'primary') },
  { label: 'Review', icon: 'i-mdi-alert', color: 'warning', onClick: () => (last.value = 'warning') },
  { label: 'Details', icon: 'i-mdi-information', color: 'info', onClick: () => (last.value = 'info') },
  { label: 'Sync', icon: 'i-mdi-sync', color: 'teal', onClick: () => (last.value = 'teal') },
  { label: 'Label', icon: 'i-mdi-tag', color: 'purple', onClick: () => (last.value = 'purple') },
  { label: 'Archive', icon: 'i-mdi-archive', color: 'dark', onClick: () => (last.value = 'dark') },
  { label: 'Rename', icon: 'i-mdi-pencil', color: 'secondary', onClick: () => (last.value = 'secondary') },
  { label: 'Move', icon: 'i-mdi-folder-move', onClick: () => (last.value = 'no colour') },
  { label: 'Delete', icon: 'i-mdi-delete', color: 'danger', onClick: () => (last.value = 'danger') },
]
</script>

<template>
  <div style="width: 100%; min-height: 26rem">
    <p class="example-hint">Open the menu and hover a row — the ink stays readable on its own wash.</p>

    <mono-button-dropdown
      :buttons.prop="buttons"
      :min="1"
      placement="bottom-start"
      :trigger.prop="{ label: 'Actions', icon: 'i-mdi-menu-down', variant: 'outline' }"
      @click="last = $event.detail.item.label"
    />

    <p class="example-last">last action: <code>{{ last }}</code></p>
  </div>
</template>

<style scoped>
.example-hint {
  margin: 0 0 0.8rem;
  font-size: 0.76rem;
  opacity: 0.75;
}
.example-last {
  margin: 0.9rem 0 0;
  font-size: 0.76rem;
  opacity: 0.8;
}
</style>
