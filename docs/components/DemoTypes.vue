<script setup lang="ts">
import { computed } from 'vue'
import types from 'virtual:mono-component-types'

const props = defineProps<{
  /** Component folder name, same convention as <DemoSingle> — e.g. "button". */
  name: string
}>()

interface TypeRow {
  prop: string
  value: string
  default: string
  description: string
}
interface TypeGroup {
  element: string
  interfaceName: string
  rows: TypeRow[]
}

const doc = computed(() => {
  const all = types as Record<string, { groups: TypeGroup[] }>
  const found = all[props.name]
  if (!found && import.meta.env.DEV) {
    console.warn(`[DemoTypes] no types found for "${props.name}"`)
  }
  return found
})

// Show per-element subheader rows only when a component has more than one element.
const grouped = computed(() => (doc.value?.groups.length ?? 0) > 1)

// Import hint — the prop interface(s) are exported from '@mono-lit/helper'.
const importLine = computed(() => {
  const names = [...new Set(doc.value?.groups.map((g) => g.interfaceName) ?? [])]
  if (!names.length) return ''
  return `import { ${names.join(', ')} } from '@mono-lit/helper'`
})
</script>

<template>
  <div v-if="doc" class="mono-types">
    <div class="mono-types-import">
      <span class="mono-types-import-label">Import</span>
      <code>{{ importLine }}</code>
    </div>
    <table class="mono-types-table">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Value</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in doc.groups" :key="group.element">
          <tr v-if="grouped" class="mono-types-group">
            <!-- Composable folders label their groups `controlMonoForm(options)` rather
                 than a tag, so only wrap real tags in angle brackets. -->
            <th colspan="4">
              <code v-if="group.element.startsWith('mono-')">&lt;{{ group.element }}&gt;</code>
              <code v-else>{{ group.element }}</code>
            </th>
          </tr>
          <tr v-for="row in group.rows" :key="group.element + row.prop">
            <td><code>{{ row.prop }}</code></td>
            <td><code>{{ row.value }}</code></td>
            <td>
              <code v-if="row.default !== '—'">{{ row.default }}</code>
              <span v-else>—</span>
            </td>
            <td>{{ row.description }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
  <p v-else><em>No type information available for <code>{{ name }}</code>.</em></p>
</template>

<style scoped>
.mono-types {
  overflow-x: auto;
  margin: 16px 0;
}
.mono-types-import {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.mono-types-import-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
}
.mono-types-import code {
  font-size: 12.5px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}
.mono-types-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.mono-types-table th,
.mono-types-table td {
  border: 1px solid var(--vp-c-divider);
  padding: 6px 12px;
  text-align: left;
  vertical-align: top;
}
.mono-types-table thead th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
}
.mono-types-table code {
  font-size: 12px;
  white-space: pre-wrap;
}
.mono-types-group th {
  background: var(--vp-c-bg-soft);
  font-weight: 600;
  color: var(--vp-c-brand-1);
}
</style>
