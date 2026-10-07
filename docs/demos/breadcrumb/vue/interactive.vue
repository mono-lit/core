<script setup>
import '@mono-lit/helper/ui/breadcrumb'
import { ref } from 'vue'

const items = [
  { id: 'home', title: 'Dashboard', href: '/dashboard' },
  { id: 'orders', title: 'Orders', href: '/orders' },
  { id: 'detail', title: 'Order #4012' },
]
const selected = ref(items[items.length - 1])
const log = ref([])

function onClick(event) {
  // `click` is the native click; an item activation carries `detail.sourceEvent`.
  event.detail?.sourceEvent?.preventDefault?.()
}

function onChange(event) {
  // event.detail.modelValue (and .currentValue) is the FULL BreadcrumbItem object.
  selected.value = event.detail.currentValue
  const stamp = new Date().toLocaleTimeString()
  log.value = [
    {
      time: stamp,
      id: event.detail.currentValue?.id,
      title: event.detail.currentValue?.title,
      old: event.detail.oldValue?.id ?? '—',
    },
    ...log.value,
  ].slice(0, 5)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.85rem; width: 100%;">
    <mono-breadcrumb
      :items.prop="items"
      :model-value.prop="selected"
      variant="contained"
      @click="onClick"
      @change="onChange"
    ></mono-breadcrumb>
    <div style="border: 1px solid var(--border); border-radius: 8px; padding: 0.65rem 0.85rem; background: var(--muted); font-size: 0.72rem;">
      <div style="font-family: 'DM Mono', ui-monospace, monospace; margin-bottom: 0.4rem;">
        <span style="opacity: 0.55;">selected →</span>
        <strong style="margin-left: 0.4rem;">{{ selected?.title }}</strong>
        <span style="opacity: 0.55; margin-left: 0.4rem;">(id: {{ selected?.id }})</span>
      </div>
      <div v-if="!log.length" style="color: var(--foreground); opacity: 0.6;">Click a non-current breadcrumb item — event.detail.modelValue is the full item object.</div>
      <ul v-else style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem;">
        <li v-for="(entry, i) in log" :key="i" style="font-family: 'DM Mono', ui-monospace, monospace;">
          <span style="opacity: 0.55;">{{ entry.time }}</span>
          <span style="margin-left: 0.5rem;">→ <strong>{{ entry.title }}</strong> <span style="opacity: 0.55;">(id: {{ entry.id }}, old: {{ entry.old }})</span></span>
        </li>
      </ul>
    </div>
  </div>
</template>
