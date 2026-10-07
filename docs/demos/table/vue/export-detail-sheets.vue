<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'
import type { MonoExportDetailBatch } from '@mono-lit/helper'
import { monoFetchOdata } from '@mono-lit/utility/fetching'
import { useMonoUtility } from '@mono-lit/utility/runtime'

/*
 * One sheet per document, with the lines FETCHED rather than nested — and
 * fetched for every document AT ONCE.
 *
 * The master list here is Northwind's `/Orders`, which does not embed its line
 * items — exactly the case `field` cannot serve. `load` is handed a chunk of
 * master rows and their keys, so 100 orders cost 4 requests instead of 100.
 * Nothing is fetched while you are only looking at the table.
 *
 * The master template links with `sheet:{{OrderID}}` — the row's KEY, not the
 * sheet name. It cannot use the name: that is sanitised for Excel and
 * de-duplicated against the workbook at write time, so it is only known once
 * every sheet exists. In `.md` output the same line stays an ordinary Markdown
 * link, so one template serves both formats.
 */
const ODATA = 'https://services.odata.org/V4/Northwind/Northwind.svc'

const { filterOrIn } = useMonoUtility()

type Order = {
  OrderID: number
  CustomerID: string
  ShipCountry: string
  Freight: number
}

/** What a line row needs — shared by the source below and every chunk read. */
const LINE_QUERY = {
  select: ['OrderID', 'ProductID', 'UnitPrice', 'Quantity', 'Discount'],
  expand: ['Product'],
}

const table = controlMonoTable<Order>([], { keyExpr: 'OrderID' })

const orders = ref<Order[]>([])
// `shallowRef`: a deep reactive proxy around a DataSource breaks devextreme.
const linesSource = shallowRef<any>(null)
const status = ref('loading orders…')
const busy = ref(false)
const note = ref('')

/*
 * 100 orders — enough that the batching is doing real work rather than being
 * asserted. They carry 269 line rows between them, and the export turns that
 * into 101 worksheets from 4 requests.
 *
 * Capped server-side because Northwind holds 830 orders, and `detail` would
 * faithfully give every one of them a worksheet.
 */
onMounted(async () => {
  // Both sources are built here, once. Neither has issued a request yet — the
  // fetcher hands back a lazy DataSource — so the lines source costs nothing
  // until the export asks it for something.
  const [master, lines] = await Promise.all([
    monoFetchOdata<Order[]>({
      baseUrl: ODATA,
      url: '/Orders',
      options: {
        key: 'OrderID',
        select: ['OrderID', 'CustomerID', 'ShipCountry', 'Freight'],
        filter: ['OrderID', '<', 10348], // 10248…10347
        paginate: false,
      },
    }),
    monoFetchOdata<any[]>({
      baseUrl: ODATA,
      url: '/Order_Details',
      options: {
        key: ['OrderID', 'ProductID'],
        ...LINE_QUERY,
        paginate: false,
      },
    }),
  ])

  if (master.error || lines.error) {
    status.value = `could not reach the service — ${(master.error ?? lines.error)!.message}`
    return
  }

  linesSource.value = lines.dataSource
  table.bind(master.dataSource)
  orders.value = await table.getData()
  status.value = `${orders.value.length} orders`
})

onBeforeUnmount(() => table.dispose())

/*
 * `load` is handed a CHUNK of master rows, not one row, so a whole page of
 * orders costs a single request. `keys` is what a filter needs; `key` is the
 * field name, so the filter below never hard-codes `'OrderID'` twice.
 *
 * The keys become an `or` chain via `filterOrIn` — see the note on it below for
 * why not the compact `in` form — so the request carries
 * `OrderID eq 10248 or OrderID eq 10249 or …`.
 *
 * Throwing is the documented way to say "these are unavailable": every document
 * in the chunk lands in `result.skipped` with the error, their master cells are
 * left unlinked, and the rest of the workbook is still produced.
 */
const requests = ref(0)

async function loadLines({ keys, key }: MonoExportDetailBatch): Promise<any[]> {
  // `filterOrIn(field, values, combine)` from `useMonoUtility()` builds the key
  // filter, so there is no hand-rolled `or` loop here.
  //
  // `combine: true` would give the compact `Field in (…)`, but that form is for
  // the string path — `dxFilterToString` renders it, and a DevExtreme store does
  // not: handing `['OrderID','in',[…]]` to `store().load()` throws E4003
  // ("Unknown filter operation is used: in") before a request is even sent. This
  // service would refuse it anyway: it is OData 4.0, and `in` arrived in 4.01.
  const filter = filterOrIn(key, keys as any[])

  // Read through the STORE, not the DataSource. `store().load(options)` takes
  // the filter as an argument and returns just those rows, leaving the source's
  // own filter/paging untouched — so concurrent chunks cannot fight over shared
  // state the way `ds.filter(…)` + `ds.load()` would. It is the same route the
  // library's own reader takes for exactly this reason.
  const lines = ((await linesSource.value?.store().load({ ...LINE_QUERY, filter })) ??
    []) as any[]
  requests.value += 1

  // Returned flat, for every order at once. `OrderID` rides along on each row so
  // the exporter can fan them back out per document — that is `groupBy`, which
  // defaults to `key` and so needs no configuring here.
  return lines.map((d: any) => ({
    OrderID: d.OrderID,
    product: d.Product?.ProductName ?? `Product #${d.ProductID}`,
    qty: d.Quantity,
    price: d.UnitPrice,
    total: d.Quantity * d.UnitPrice * (1 - d.Discount),
  }))
}

const MASTER = `
# Northwind orders

| Order | Customer | Country | Freight |
| ----- | -------- | ------- | ------- |
{{#each rows}}
| [{{OrderID}}](sheet:{{OrderID}}) | {{CustomerID}} | {{ShipCountry}} | {{currency Freight}} |
{{/each}}
`

const DETAIL = `
## Order {{row.OrderID}} — {{row.CustomerID}}

| Product | Qty | Unit price | Line total |
| ------- | --- | ---------- | ---------- |
{{#each rows}}
| {{product}} | {{qty}} | {{currency price}} | {{currency total}} |
{{/each}}
`

async function download() {
  busy.value = true
  requests.value = 0
  note.value = 'fetching lines…'
  try {
    const result = await table.export({
      md: MASTER,
      data: { rows: await table.getData() },
      sheetName: 'Orders',
      fileName: 'northwind-orders.xlsx',
      detail: {
        key: 'OrderID',
        md: DETAIL,
        load: loadLines,
        /*
         * 25, not the default 100, because of the `or` chain. 100 keys make a
         * 3138-character URL and this service answers 404 — IIS refusing a
         * query string past ~2048. Measured against the live endpoint: 60 keys
         * (1831 chars) still returns 200, 75 (2281) does not. 25 leaves room
         * for the `$select`/`$expand` that ride along.
         *
         * This is exactly what `loadChunk` is for: the ceiling is the
         * backend's, not the exporter's.
         */
        loadChunk: 25,
        sheetName: (row: Order) => `Order ${row.OrderID}`,
      },
    })
    note.value =
      `${result.sheets.length} sheets from ${requests.value} ` +
      `request${requests.value === 1 ? '' : 's'}` +
      (result.skipped.length ? ` · ${result.skipped.length} skipped` : '')
  } catch (err) {
    note.value = `export failed — ${(err as Error).message}`
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="example-detail">
    <div class="example-detail__bar">
      <strong>Northwind orders</strong>
      <span class="example-detail__status">{{ status }}</span>
      <mono-button
        color="primary"
        size="sm"
        :loading.prop="busy"
        :disabled="!orders.length"
        @click="download()"
      >
        Download .xlsx
      </mono-button>
    </div>

    <!-- 100 rows: cap the height so the demo stays a demo. -->
    <div mono-table-scroll class="example-detail__scroll">
      <table mono-table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Country</th>
            <th>Freight</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in orders" :key="row.OrderID">
            <td>{{ row.OrderID }}</td>
            <td>{{ row.CustomerID }}</td>
            <td>{{ row.ShipCountry }}</td>
            <td>{{ row.Freight.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="example-detail__lede">
      The lines are not on these rows &mdash; <code>/Orders</code> does not embed
      them. On export, <code>load</code> is handed the keys in chunks and fetches
      <code>/Order_Details</code> filtered to each chunk, so these
      <strong>100 orders cost 4 requests, not 100</strong>; the exporter fans
      each flat response back out per document. <code>loadChunk</code> is 25 here
      rather than the default 100 because the keys go out as an
      <code>or</code> chain and 100 of them overrun this service's query-string
      limit &mdash; the ceiling is the backend's, not the exporter's. Every order
      number links to its own sheet with a <code>&larr; Back</code> link, and an
      order whose lines fail to load is reported in <code>skipped</code> and left
      unlinked rather than sinking the whole export.
    </p>

    <p v-if="note" class="example-detail__note">{{ note }}</p>
  </div>
</template>

<style scoped>
.example-detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
.example-detail__bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.example-detail__scroll {
  max-height: 320px;
  overflow-y: auto;
}
.example-detail__status {
  margin-right: auto;
  font-size: 0.78rem;
  opacity: 0.7;
}
.example-detail__lede {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.55;
}
.example-detail__note {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.74rem;
  opacity: 0.7;
}
</style>
