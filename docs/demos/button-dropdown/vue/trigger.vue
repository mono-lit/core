<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/button-dropdown'

const last = ref('—')

const rows = [
  { id: 1, name: 'INV-1042' },
  { id: 2, name: 'INV-1043' },
]

// The entries are real <mono-button>s, so button-only behaviour keeps working
// inside the menu — this one shows its own spinner while its handler runs.
const actionsFor = (row: { id: number; name: string }) => [
  {
    label: 'Approve',
    icon: 'i-mdi-check',
    color: 'success',
    // `handler` is a mono-button prop: the button drives its own loading state
    // for exactly as long as the promise takes.
    handler: async () => {
      await new Promise((r) => setTimeout(r, 900))
      last.value = `approved ${row.name}`
    },
  },
  { label: 'Print', icon: 'i-mdi-printer', variant: 'outline', onClick: () => (last.value = `print ${row.name}`) },
  { label: 'Void', icon: 'i-mdi-close-octagon', color: 'danger', variant: 'outline', onClick: () => (last.value = `void ${row.name}`) },
]
</script>

<template>
  <div style="width: 100%">
    <table class="example-table">
      <thead>
        <tr>
          <th>Document</th>
          <th style="width: 1%">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.name }}</td>
          <td>
            <!-- `trigger` shapes the ⋮ button with the same ButtonProps. -->
            <mono-button-dropdown
              :buttons.prop="actionsFor(row)"
              :min="1"
              placement="bottom-end"
              :trigger.prop="{ size: 'sm', variant: 'outline', icon: 'i-mdi-dots-horizontal' }"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <p class="example-last">last action: <code>{{ last }}</code></p>
  </div>
</template>

<style scoped>
.example-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  /* VitePress turns a prose table into a scroll container
     (`.vp-doc table { display: block; overflow-x: auto }`). The LIGHT build
     portals its panel to <body> and never notices; the SHADOW build keeps it
     in the shadow root, where a scrolling ancestor clips it. */
  display: table;
  overflow: visible;
}
.example-table th,
.example-table td {
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 0.6rem;
  text-align: left;
}
.example-last {
  margin: 0.9rem 0 0;
  font-size: 0.76rem;
  opacity: 0.8;
}
</style>
