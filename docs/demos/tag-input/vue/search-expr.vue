<script setup lang="ts">
import '@mono-lit/helper/ui/tag-input'
import { ref, computed } from 'vue'

// Deliberately nested data: the searchable text lives one and two levels down,
// where a flat `search-value="Name"` could never reach it.
const PEOPLE = [
  {
    Id: 1,
    Code: 'EMP-001',
    Name: 'Andi Pratama',
    Company: { Name: 'Acme Logistics', City: 'Bandung' },
    Transaction: [
      { Name: 'Freight', Price: 1200 },
      { Name: 'Storage', Price: 340 },
    ],
  },
  {
    Id: 2,
    Code: 'EMP-002',
    Name: 'Budi Santoso',
    Company: { Name: 'Globex Retail', City: 'Jakarta' },
    Transaction: [{ Name: 'Packaging', Price: 890 }],
  },
  {
    Id: 3,
    Code: 'EMP-003',
    Name: 'Citra Dewi',
    Company: { Name: 'Initech Digital', City: 'Surabaya' },
    Transaction: [
      { Name: 'Consulting', Price: 5400 },
      { Name: 'Freight', Price: 210 },
    ],
  },
]

// Each preset is the SAME prop — `search-value` — written differently.
const PRESETS = [
  {
    id: 'nested',
    label: 'Nested path',
    expr: ['Company.Name'],
    hint: 'Try “globex” — matches the company, not the person.',
  },
  {
    id: 'indexed',
    label: 'Indexed path',
    expr: ['Transaction.[1].Name'],
    hint: 'Try “storage” — only the SECOND transaction of each row is read.',
  },
  {
    id: 'collection',
    label: 'Collection wildcard',
    expr: ['Transaction.[*].Price'],
    hint: 'Try “5400” — a number leaf still matches on an in-memory array.',
  },
  {
    id: 'top',
    label: "'*' (top level)",
    expr: ['*'],
    hint: 'Try “citra” or “EMP-002”. “jakarta” finds nothing — it is nested.',
  },
  {
    id: 'everything',
    label: "'*', '*.*', '*.[*].*'",
    expr: ['*', '*.*', '*.[*].*'],
    hint: 'Now “jakarta” and “freight” both hit — every level is covered.',
  },
  {
    id: 'string',
    label: 'Comma string',
    expr: 'Company.City,Transaction.[*].Name',
    hint: 'The same grammar from plain HTML, no .prop binding needed.',
  },
]

const presetId = ref('nested')
const preset = computed(() => PRESETS.find((p) => p.id === presetId.value)!)
const tags = ref<unknown[]>([])
</script>

<template>
  <div style="width: 100%; display: grid; gap: 0.7rem;">
    <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
      <button
        v-for="p in PRESETS"
        :key="p.id"
        type="button"
        class="example-chip"
        :class="{ 'example-is-active': p.id === presetId }"
        @click="presetId = p.id"
      >
        {{ p.label }}
      </button>
    </div>

    <mono-tag-input
      :key="presetId"
      :items.prop="PEOPLE"
      :search-value.prop="preset.expr"
      allow-custom="false"
      checkable
      key-value="Id"
      display-value="Name"
      label="Employees"
      placeholder="Type to search…"
      @change="tags = $event.detail.modelValue"
    ></mono-tag-input>

    <p class="example-hint">{{ preset.hint }}</p>

    <pre class="example-code">search-value = {{ JSON.stringify(preset.expr) }}</pre>

    <div class="example-out">selected ids → {{ tags.length ? tags.join(', ') : '—' }}</div>
  </div>
</template>

<style scoped>
.example-chip {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--theme-border);
  border-radius: 999px;
  background: transparent;
  color: var(--theme-text);
  font-size: 0.75rem;
  cursor: pointer;
}
.example-chip.example-is-active {
  border-color: var(--theme-primary);
  color: var(--theme-primary);
}
.example-hint {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.75;
}
.example-code {
  margin: 0;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  background: var(--theme-surface-soft);
  font-family: 'DM Mono', ui-monospace, monospace;
  font-size: 0.75rem;
  overflow-x: auto;
}
.example-out {
  font-family: 'DM Mono', ui-monospace, monospace;
  font-size: 0.8rem;
  opacity: 0.7;
}
</style>
