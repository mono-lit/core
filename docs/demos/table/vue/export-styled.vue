<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

type Invoice = {
  Id: number
  Number: string
  Client: string
  DueAt: string
  Amount: number
  Paid: boolean
}

const invoices: Invoice[] = [
  { Id: 1, Number: 'INV-1001', Client: 'Nusantara Retail', DueAt: '2026-06-30', Amount: 12500000, Paid: true },
  { Id: 2, Number: 'INV-1002', Client: 'Garuda Logistik', DueAt: '2026-07-15', Amount: 8400000, Paid: false },
  { Id: 3, Number: 'INV-1003', Client: 'Sinar Abadi', DueAt: '2026-07-28', Amount: 21750000, Paid: false },
  { Id: 4, Number: 'INV-1004', Client: 'Mitra Sejati', DueAt: '2026-08-05', Amount: 5300000, Paid: true },
]

// `{{style}}` paints one cell, `{{rowStyle}}` paints the row, `{{merge cols=…}}`
// spans a cell, and `{{#if}}` picks a semantic style per row. Headings and
// paragraphs already span the full sheet width, so they need no `{{merge}}`.
const template = `# Accounts Receivable

{{style "note"}}Generated for {{company.name}} · {{company.taxId}}

| Invoice | Client | Due | Amount | Status |
|---------|--------|-----|--------|--------|
{{#each rows}}
| {{Number}} | {{Client}} | {{date DueAt}} | {{currency Amount}} | {{#if Paid}}{{style "success"}}Paid{{else}}{{style "danger"}}Outstanding{{/if}} |
{{/each}}
| {{rowStyle "total"}}{{merge cols=3}}**Total billed** | | | {{currency (sum rows "Amount")}} | |

> Outstanding balance: {{currency outstanding}} across {{count rows}} invoices.
`

const table = controlMonoTable<Invoice>(invoices, { pageSize: 10, keyExpr: 'Id' })

const rows = ref<Invoice[]>([])
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
    await table.export({
      md: template,
      fileName: 'accounts-receivable.xlsx',
      data: {
        rows: await table.getData(),
        company: { name: 'PT Mono Sejahtera', taxId: '01.234.567.8-901.000' },
        // Aggregates that need real logic belong in TypeScript, not the template.
        outstanding: invoices.filter((i) => !i.Paid).reduce((t, i) => t + i.Amount, 0),
      },
      formatting: { locale: 'id-ID', currency: 'IDR', dateFormat: 'dd mmm yyyy' },
      // Only the keys you name are overridden — the rest of each style is kept.
      styles: {
        header: { bg: '#0F172A', color: '#FFFFFF' },
        title: { size: 18, color: '#0F172A' },
        success: { color: '#065F46', bg: '#D1FAE5', align: 'center' as const },
        danger: { color: '#991B1B', bg: '#FEE2E2', align: 'center' as const },
      },
      columns: [{ width: 14 }, { width: 24 }, { width: 14 }, { width: 18 }, { width: 14 }],
      sheetName: 'AR',
      freezeRows: 4,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <mono-card bordered width="100%" class="example-report-card">
    <div class="example-report-toolbar">
      <strong class="example-report-title">Accounts receivable</strong>

      <mono-button size="sm" color="primary" :loading.prop="busy" @click="downloadExcel">
        Download .xlsx
      </mono-button>
    </div>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Client</th>
            <th>Due</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Number }}</td>
            <td>{{ row.Client }}</td>
            <td>{{ row.DueAt }}</td>
            <td>{{ row.Amount.toLocaleString('id-ID') }}</td>
            <td>
              <span :class="row.Paid ? 'example-pill-paid' : 'example-pill-due'">
                {{ row.Paid ? 'Paid' : 'Outstanding' }}
              </span>
            </td>
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

.example-pill-paid,
.example-pill-due {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.example-pill-paid {
  color: var(--success);
  background: color-mix(in oklab, var(--success) 14%, var(--card));
}

.example-pill-due {
  color: var(--destructive);
  background: color-mix(in oklab, var(--destructive) 14%, var(--card));
}
</style>
