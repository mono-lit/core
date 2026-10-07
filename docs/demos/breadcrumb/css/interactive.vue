<script setup>
import { ref } from 'vue'

const log = ref([])

function onClick(title, index, event) {
  event.preventDefault()
  const stamp = new Date().toLocaleTimeString()
  log.value = [{ time: stamp, title, index }, ...log.value].slice(0, 5)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.85rem; width: 100%;">
    <nav mono-breadcrumb mono-variant="contained" aria-label="Breadcrumb">
      <ol mono-list>
        <li mono-item>
          <a mono-action href="/dashboard" @click="(e) => onClick('Dashboard', 0, e)">
            <span mono-content><span mono-title>Dashboard</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item>
          <a mono-action href="/orders" @click="(e) => onClick('Orders', 1, e)">
            <span mono-content><span mono-title>Orders</span></span>
          </a>
        </li>
        <li mono-separator aria-hidden="true">›</li>
        <li mono-item mono-current aria-current="page">
          <span mono-action>
            <span mono-content><span mono-title>Order #4012</span></span>
          </span>
        </li>
      </ol>
    </nav>
    <div style="border: 1px solid var(--border); border-radius: 8px; padding: 0.65rem 0.85rem; background: var(--muted); font-size: 0.72rem;">
      <div v-if="!log.length" style="color: var(--foreground); opacity: 0.6;">Click a non-current breadcrumb item — events show here.</div>
      <ul v-else style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem;">
        <li v-for="(entry, i) in log" :key="i" style="font-family: 'DM Mono', ui-monospace, monospace;">
          <span style="opacity: 0.55;">{{ entry.time }}</span>
          <span style="margin-left: 0.5rem;">→ <strong>{{ entry.title }}</strong> (index {{ entry.index }})</span>
        </li>
      </ul>
    </div>
  </div>
</template>
