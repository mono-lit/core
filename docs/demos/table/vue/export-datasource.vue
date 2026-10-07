<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

type OrderRow = {
  OrderID: number
  CustomerID: string
  ShipName: string
  ShipCountry: string
  ShipCity: string
  Freight: number
}

const ODATA_BASE = 'https://services.odata.org/V4/Northwind/Northwind.svc'

const table = controlMonoTable<OrderRow>(null, {
  keyExpr: 'OrderID',
  searchValue: ['ShipName', 'ShipCity', 'CustomerID'],
})

// `shallowRef`, not `ref`: a deep reactive proxy around a DataSource can break
// devextreme's internals. (The engine unwraps a ref that slips through, but
// keeping the source raw is the right habit.)
const dataSource = shallowRef<any>(null)

const rows = ref<OrderRow[]>([])
const loading = ref(false)
const busy = ref(false)

const off = table.subscribe(() => {
  rows.value = [...table.items]
  loading.value = table.loading
})

onMounted(async () => {
  const res = await monoCreateFetcher({
    baseUrl: ODATA_BASE,
    url: '/Orders',
  }).response({
    options: {
      key: 'OrderID',
      select: ['OrderID', 'CustomerID', 'ShipName', 'ShipCountry', 'ShipCity', 'Freight'],
      paginate: true,
      pageSize: 10,
    },
  })

  dataSource.value = res.dataSource
  table.bind(res.dataSource)
  await table.load()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
})

const template = `# Orders

| Order | Ship to | Country | City | Freight |
|-------|---------|---------|------|---------|
{{#each orders}}
| {{OrderID}} | {{ShipName}} | {{ShipCountry}} | {{ShipCity}} | {{currency Freight}} |
{{/each}}
| {{rowStyle "total"}}**Total** | | | | {{currency (sum orders "Freight")}} |
`

async function downloadExcel() {
  busy.value = true
  try {
    // Hand the DataSource over as-is. The engine drains it in chunks of 100
    // (the row count isn't knowable up front) and honours the filter, search
    // and sort it already carries — so whatever you typed into the search box
    // narrows the export too.
    await table.export({
      md: template,
      fileName: 'orders.xlsx',
      data: { orders: dataSource.value },
      formatting: { locale: 'en-US', currency: 'USD' },
      freezeRows: 2,
    })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <strong class="example-title">Orders</strong>

      <div class="example-actions">
        <mono-table-search :control-table.prop="table" placeholder="Search ship name, city, customer…" />

        <mono-button
          size="sm"
          color="primary"
          :loading.prop="busy"
          :disabled="!dataSource"
          @click="downloadExcel"
        >
          Download .xlsx
        </mono-button>
      </div>
    </div>

    <p class="example-hint">
      830 rows on the server, 10 on screen. The export passes the
      <strong>DataSource itself</strong> — no manual fetching. Type a search first and the
      export narrows with it.
    </p>

    <div mono-table-scroll>
      <table mono-table>
        <caption><mono-table-loading :control-table.prop="table" /></caption>
        <thead>
          <tr>
            <th>Order</th>
            <th>Ship to</th>
            <th>Country</th>
            <th>City</th>
            <th>Freight</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.OrderID">
            <td>{{ row.OrderID }}</td>
            <td>{{ row.ShipName }}</td>
            <td>{{ row.ShipCountry }}</td>
            <td>{{ row.ShipCity }}</td>
            <td>{{ row.Freight?.toLocaleString('en-US') }}</td>
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
.example-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-title {
  font-size: 0.9rem;
  color: var(--foreground);
}

.example-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.example-hint {
  margin: 0;
  padding: 0 1rem 0.6rem;
  font-size: 0.8rem;
  color: var(--muted-foreground);
}
</style>
