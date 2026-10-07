<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

type Stock = {
  Id: number
  Sku: string
  Product: string
  Qty: number
  Value: number
}

const inventory: Stock[] = [
  { Id: 1, Sku: 'MB-001', Product: 'Widget A', Qty: 4, Value: 600000 },
  { Id: 2, Sku: 'MB-002', Product: 'Widget B', Qty: 38, Value: 12160000 },
  { Id: 3, Sku: 'MB-003', Product: 'Widget C', Qty: 12, Value: 1080000 },
  { Id: 4, Sku: 'MB-004', Product: 'Widget D', Qty: 2, Value: 340000 },
  { Id: 5, Sku: 'MB-005', Product: 'Widget E', Qty: 25, Value: 4750000 },
]

const template = `# Inventory

| SKU | Product | Qty | Value |
|-----|---------|-----|-------|
{{#each rows}}
| {{Sku}} | {{Product}} | {{number Qty}} | {{currency Value}} |
{{/each}}
`

const table = controlMonoTable<Stock>(inventory, { pageSize: 5, keyExpr: 'Id' })

const rows = ref<Stock[]>([])
const busy = ref(false)

const off = table.subscribe(() => {
  rows.value = [...table.items]
})

onMounted(() => table.load())
onBeforeUnmount(() => {
  off()
  table.dispose()
})

async function downloadExcel() {
  busy.value = true
  try {
    const data = await table.getData()

    await table.export({
      md: template,
      fileName: 'inventory.xlsx',
      data: { rows: data },
      sheetName: 'Stock',
      freezeRows: 2,
      formatting: { locale: 'id-ID', currency: 'IDR' },

      // Runs after the template is rendered but BEFORE any bytes are written,
      // so it still applies on this auto-downloading path. Everything here is
      // something Markdown has no way to express.
      onWorkbook: (wb) => {
        const ws = wb.getWorksheet('Stock')

        // Row 1 is the `# Inventory` heading, row 2 the table header,
        // so the body starts at row 3.
        const firstRow = 3
        const lastRow = 2 + data.length

        ws.autoFilter = 'A2:D2'
        ws.getCell('A1').note = 'Generated from the live grid'

        // Red → green scale across the Qty column: low stock stands out.
        ws.addConditionalFormatting({
          ref: `C${firstRow}:C${lastRow}`,
          rules: [
            {
              type: 'colorScale',
              cfvo: [{ type: 'min' }, { type: 'max' }],
              color: [{ argb: 'FFF8696B' }, { argb: 'FF63BE7B' }],
            },
          ],
        })

        ws.pageSetup.orientation = 'landscape'
        ws.pageSetup.fitToPage = true

        // A second worksheet — one report, two sheets.
        const raw = wb.addWorksheet('Raw data')
        raw.columns = [
          { header: 'Id', key: 'Id', width: 8 },
          { header: 'SKU', key: 'Sku', width: 14 },
          { header: 'Product', key: 'Product', width: 20 },
          { header: 'Qty', key: 'Qty', width: 10 },
          { header: 'Value', key: 'Value', width: 16 },
        ]
        raw.addRows(data)
        raw.getRow(1).font = { bold: true }

        wb.creator = 'PT Mono Sejahtera'
      },
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <mono-card bordered width="100%" class="example-report-card">
    <div class="example-report-toolbar">
      <strong class="example-report-title">Inventory</strong>

      <mono-button size="sm" color="primary" :loading.prop="busy" @click="downloadExcel">
        Download .xlsx
      </mono-button>
    </div>

    <p class="example-report-hint">
      The workbook gets an auto-filter, a colour scale on <strong>Qty</strong>, a cell note,
      landscape print setup and a second <strong>Raw data</strong> sheet — none of which
      Markdown can describe.
    </p>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Value</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Sku }}</td>
            <td>{{ row.Product }}</td>
            <td :class="{ 'example-is-low': row.Qty < 5 }">{{ row.Qty }}</td>
            <td>{{ row.Value.toLocaleString('id-ID') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </mono-card>
</template>

<style scoped>
.example-report-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-report-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-report-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-report-hint {
  margin: 0;
  padding: 0 1rem 0.6rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}

.example-is-low {
  color: var(--destructive);
  font-weight: 600;
}
</style>
