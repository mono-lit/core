<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import type { MonoGroupNode } from '@mono-lit/helper'

type Sale = {
  Id: number
  Region: string
  Product: string
  Qty: number
  Price: number
}

const sales: Sale[] = [
  { Id: 1, Region: 'Jakarta', Product: 'Widget A', Qty: 12, Price: 150000 },
  { Id: 2, Region: 'Jakarta', Product: 'Widget B', Qty: 5, Price: 320000 },
  { Id: 3, Region: 'Surabaya', Product: 'Widget A', Qty: 9, Price: 150000 },
  { Id: 4, Region: 'Surabaya', Product: 'Widget C', Qty: 21, Price: 90000 },
  { Id: 5, Region: 'Bandung', Product: 'Widget B', Qty: 7, Price: 320000 },
  { Id: 6, Region: 'Bandung', Product: 'Widget C', Qty: 14, Price: 90000 },
]

// One continuous Markdown table: the header + delimiter are written once, then
// the group loop emits a banner row followed by that group's rows. Everything
// lands in a single worksheet table.
const template = `# Sales by region

| Region / Product | Qty | Unit price | Line total |
|------------------|-----|------------|------------|
{{#each groups}}
| {{rowStyle "groupHeader"}}**{{key}}** | {{number (sum items "Qty")}} | | {{currency (sum items "Total")}} |
{{#each items}}
| {{Product}} | {{number Qty}} | {{currency Price}} | {{currency Total}} |
{{/each}}
{{/each}}
| {{rowStyle "total"}}**Grand total** | {{number (sum rows "Qty")}} | | {{currency (sum rows "Total")}} |
`

const table = controlMonoTable<Sale>(
  // `Total` is derived in TypeScript — business logic stays out of the template.
  sales.map((s) => ({ ...s, Total: s.Qty * s.Price })),
  { pageSize: 2, keyExpr: 'Id', group: 'Region' },
)

const display = ref<Array<{ key: string; kind: string; label: string; detail?: string }>>([])
const busy = ref(false)

const off = table.subscribe(() => {
  display.value = table.displayRows.map((r) => ({
    key: r.key,
    kind: r.kind,
    label:
      r.kind === 'group'
        ? String((r.node as MonoGroupNode<Sale>).key)
        : (r.row as Sale)?.Product ?? '',
    detail: r.kind === 'row' ? String((r.row as Sale)?.Qty ?? '') : String(r.node?.count ?? ''),
  }))
})

onMounted(() => table.load())
onBeforeUnmount(() => {
  off()
  table.dispose()
})

async function downloadExcel() {
  busy.value = true
  try {
    // Fetch once, then group those same rows — `buildGroups()` reuses the
    // `group: 'Region'` field configured above, so it isn't repeated here.
    const rows = await table.getData()

    await table.export({
      md: template,
      fileName: 'sales-by-region.xlsx',
      data: { rows, groups: await table.buildGroups(rows) },
      formatting: { locale: 'id-ID', currency: 'IDR' },
      styles: { groupHeader: { bg: '#DBEAFE' } },
      freezeRows: 1,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <mono-card bordered width="100%" class="example-report-card">
    <div class="example-report-toolbar">
      <strong class="example-report-title">Sales · grouped by region</strong>

      <mono-button size="sm" color="primary" :loading.prop="busy" @click="downloadExcel">
        Download .xlsx
      </mono-button>
    </div>

    <p class="example-report-hint">
      The grid shows <strong>2 regions per page</strong> — the report always covers every
      group and every row.
    </p>

    <div mono-table-scroll>
      <table mono-table>
        <thead>
          <tr>
            <th>Region / Product</th>
            <th>Qty</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in display" :key="row.key" :class="{ 'example-is-group': row.kind === 'group' }">
            <td>{{ row.label }}</td>
            <td>{{ row.detail }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div mono-table-foot>
      <mono-table-info :control-table.prop="table" />
      <mono-table-paging :control-table.prop="table" />
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

.example-is-group td {
  font-weight: 600;
  background: var(--muted);
}
</style>
