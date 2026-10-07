<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import { controlMonoTable, monoArraySource } from '@mono-lit/helper'

type Row = {
  Id: number
  Code: string
  Company: { Name: string; City: string }
  Transaction: { Name: string; Price: number }[]
}

// Nested on purpose: the interesting fields are one and two levels down, where a
// flat column list can't reach them.
const ROWS: Row[] = [
  {
    Id: 1, Code: 'TMM',
    Company: { Name: 'Acme Logistics', City: 'Bandung' },
    Transaction: [{ Name: 'Freight', Price: 1200 }, { Name: 'Storage', Price: 340 }],
  },
  {
    Id: 2, Code: 'SLS',
    Company: { Name: 'Globex Retail', City: 'Jakarta' },
    Transaction: [{ Name: 'Packaging', Price: 890 }],
  },
  {
    Id: 3, Code: 'MKT',
    Company: { Name: 'Initech Digital', City: 'Surabaya' },
    Transaction: [{ Name: 'Consulting', Price: 5400 }, { Name: 'Freight', Price: 210 }],
  },
]

// Every preset below is the SAME option — `searchValue` — in a different shape.
const PRESETS = [
  {
    id: 'expr-array',
    label: "searchValue: ['Company.Name']",
    value: ['Company.Name'],
    hint: 'Array form. Try “globex”.',
  },
  {
    id: 'value-string',
    label: "searchValue: 'Company.Name,Company.City'",
    value: 'Company.Name,Company.City',
    hint: 'Comma string — identical grammar, no .prop binding needed. Try “jakarta”.',
  },
  {
    id: 'collection',
    label: "'Transaction.[*].Name'",
    value: 'Transaction.[*].Name',
    hint: 'Matches if ANY transaction hits. Try “freight”.',
  },
  {
    id: 'indexed',
    label: "'Transaction.[1].Name'",
    value: 'Transaction.[1].Name',
    hint: 'Only the second transaction is read. Try “storage”, then “packaging”.',
  },
  {
    id: 'everything',
    label: "'*,*.*,*.[*].*'",
    value: '*,*.*,*.[*].*',
    hint: 'Every level at once. Try “surabaya”, “TMM” or “consulting”.',
  },
]

const presetId = ref('expr-array')
const preset = computed(() => PRESETS.find((p) => p.id === presetId.value)!)

const table = controlMonoTable<Row>(null, { pageSize: 10 })
const rows = ref<Row[]>([])

const off = table.subscribe(() => { rows.value = [...table.items] })
table.bind(monoArraySource(ROWS, { pageSize: 10 }))
void table.load()

onBeforeUnmount(() => { off(); table.dispose() })

const money = (n: number) => n.toLocaleString('en-US')
</script>

<template>
  <div style="width: 100%;">
    <div class="example-field-picker">
      <button
        v-for="p in PRESETS"
        :key="p.id"
        type="button"
        class="example-field-chip"
        :class="{ 'example-is-active': p.id === presetId }"
        @click="presetId = p.id"
      >
        {{ p.label }}
      </button>
    </div>

    <mono-card bordered width="100%" class="example-field-card">
      <div class="example-field-search">
        <!-- The element declares the fields; it REPLACES the controller option.
             No `:key` — changing the prop re-pushes and re-runs the live query, so
             a term you already typed re-filters as you switch presets. -->
        <mono-table-search
          :control-table.prop="table"
          :search-value.prop="preset.value"
          clearable
          label="Search"
          placeholder="Type to filter…"
          :helper-text="preset.hint"
          data-search
        />
      </div>

      <div mono-table-scroll>
        <table mono-table>
          <thead>
            <tr><th>Code</th><th>Company</th><th>City</th><th>Transactions</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.Id">
              <td>{{ row.Code }}</td>
              <td>{{ row.Company.Name }}</td>
              <td>{{ row.Company.City }}</td>
              <td>
                <span v-for="t in row.Transaction" :key="t.Name" class="example-txn">
                  {{ t.Name }} <b>{{ money(t.Price) }}</b>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!rows.length" mono-table-empty>
        <div mono-empty-title>No matches</div>
      </div>
    </mono-card>

    <p class="example-field-note">
      The same value works as a controller option —
      <code>controlMonoTable(rows, {{ '{' }} searchValue: '…' {{ '}' }})</code> — or centrally via
      <code>props.search.searchValue</code>. <code>searchExpr</code> is the same option
      under its older name.
    </p>
  </div>
</template>

<style scoped>
.example-field-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.9rem;
}
.example-field-chip {
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--foreground);
  font-family: 'DM Mono', ui-monospace, monospace;
  font-size: 0.72rem;
  cursor: pointer;
}
.example-field-chip.example-is-active {
  border-color: var(--primary);
  color: var(--primary);
}
.example-field-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}
.example-field-search {
  padding: 0.9rem 1rem;
}
.example-txn {
  display: inline-block;
  margin-right: 0.6rem;
  white-space: nowrap;
  font-size: 0.8rem;
}
.example-field-note {
  margin: 0.8rem 0 0;
  font-size: 0.78rem;
  opacity: 0.75;
}
</style>
