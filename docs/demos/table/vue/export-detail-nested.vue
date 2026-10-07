<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

/*
 * One sheet per document, with the lines ALREADY on the row.
 *
 * `field` is the no-I/O case: the list endpoint embedded its own lines, so the
 * whole export costs exactly what a single-sheet one costs. When the lines are
 * not on the row, `load` fetches them instead — see the next demo.
 *
 * The master template links with `sheet:{{no}}` — the document's KEY, not the
 * sheet name. It cannot use the name: that is sanitised for Excel and
 * de-duplicated against the workbook at write time, so it is only known once
 * every sheet exists. In `.md` output the same line stays an ordinary Markdown
 * link, so one template serves both formats.
 */
type Line = { sku: string; name: string; qty: number; price: number }
type TopUp = { no: string; vendor: string; total: number; items: Line[] }

const topUps: TopUp[] = [
  {
    no: 'TU/2026/001',
    vendor: 'Acme Supplies',
    total: 4250,
    items: [
      { sku: 'ACM-1', name: 'Cable tray', qty: 40, price: 65 },
      { sku: 'ACM-2', name: 'Mounting kit', qty: 25, price: 26 },
    ],
  },
  {
    no: 'TU/2026/002',
    vendor: 'Northwind Ltd',
    total: 1980,
    items: [{ sku: 'NW-9', name: 'Sensor module', qty: 12, price: 165 }],
  },
  // No lines: gets no sheet and no link, and turns up in `skipped`.
  { no: 'TU/2026/003', vendor: 'Empty Co', total: 0, items: [] },
]

const table = controlMonoTable<TopUp>(topUps, { keyExpr: 'no' })

const MASTER = `
# Top-ups

| Doc | Vendor | Total |
| --- | ------ | ----- |
{{#each rows}}
| [{{no}}](sheet:{{no}}) | {{vendor}} | {{currency total}} |
{{/each}}
`

const DETAIL = `
## {{row.no}} — {{row.vendor}}

| SKU | Item | Qty | Price |
| --- | ---- | --- | ----- |
{{#each rows}}
| {{sku}} | {{name}} | {{qty}} | {{currency price}} |
{{/each}}
`

const busy = ref(false)
const note = ref('')

async function download() {
  busy.value = true
  try {
    const result = await table.export({
      md: MASTER,
      data: { rows: await table.getData() },
      sheetName: 'Top-ups',
      fileName: 'top-ups.xlsx',
      detail: {
        key: 'no',
        field: 'items',
        md: DETAIL,
        sheetName: (row) => `Detail ${row.no}`,
      },
    })
    note.value =
      `${result.sheets.length} sheets` +
      (result.skipped.length ? ` · ${result.skipped.length} skipped (no lines)` : '')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="example-nested">
    <div class="example-nested__bar">
      <strong>Top-ups</strong>
      <mono-button color="primary" size="sm" :loading.prop="busy" @click="download()">
        Download .xlsx
      </mono-button>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>Doc</th>
            <th>Vendor</th>
            <th>Lines</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in topUps" :key="row.no">
            <td>{{ row.no }}</td>
            <td>{{ row.vendor }}</td>
            <td>{{ row.items.length }}</td>
            <td>{{ row.total.toLocaleString('id-ID') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="example-nested__lede">
      Each document number in the workbook links to its own sheet, and every
      detail sheet has a <code>&larr; Back</code> link. Nothing is fetched: the
      lines are already on the row, so <code>field</code> just reads them.
      <code>TU/2026/003</code> has none, so it gets neither link nor sheet
      &mdash; it is reported in <code>skipped</code> rather than becoming an
      empty sheet behind a dead link.
    </p>

    <p v-if="note" class="example-nested__note">{{ note }}</p>
  </div>
</template>

<style scoped>
.example-nested {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
.example-nested__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.example-nested__lede {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.55;
}
.example-nested__note {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.74rem;
  opacity: 0.7;
}
</style>
