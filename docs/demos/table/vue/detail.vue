<!--
  <mono-table-detail> — the expand/collapse chevron for a row.

  It is ONLY the chevron: you keep authoring the <tr>, drop the element into one
  <td>, and everything slotted into it becomes the panel — a full-width
  <tr mono-detail-row><td colspan="…"> the element inserts right
  below that row while open and removes when closed. The colspan is measured from
  the row's own cells, so it always spans the grid.

  The panel holds real DOM you own (captured like <mono-card>'s slots), so Vue
  interpolation, v-if, a whole nested <table mono-table> with its own
  controlMonoTable, and further nested <mono-table-detail> elements all work
  inside it — all four are exercised below.

  Notes:
  - `props: { detail }` sets shared defaults for EVERY detail bound to the grid.
    `open` is deliberately ignored there: it is per-row state, and the controller
    re-applies its props on each update, so it would undo every click. Its events
    go there too: `onToggle` is attached to every detail as a listener, and
    `event.detail.rowKey` says which row fired — so no `@toggle` per row.
  - The details are an ACCORDION: opening a row closes the row that was open,
    scoped to the bound controller (so each order's nested line table runs its
    own accordion without disturbing the outer one).
  - `stay-open` is the exemption — such a row is skipped by the accordion AND by
    collapseAll(), so it is the one panel that survives both. Here exactly ONE
    row carries it, straight off the data (`order.KeepOpen`): open SO-1044, then
    open any other order, and SO-1044 stays. Not a lock — its own chevron still
    closes it. Set it on every row to allow many panels open at once.
  - An open panel is a real <tr>, but it is excluded from the zebra's data set,
    so it neither takes a stripe nor flips the parity of the rows below it while
    it is open.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/chip'
import '@mono-lit/helper/ui/button'
import { controlMonoTable, type MonoTableController } from '@mono-lit/helper'
import type { ChipColor } from '@mono-lit/helper/ui/chip'

type LineItem = {
  Id: number
  Sku: string
  Item: string
  Qty: number
  Price: number
  Note: string
}

type Order = {
  Id: number
  Code: string
  Customer: string
  Channel: string
  Status: 'Paid' | 'Pending' | 'Draft' | 'Refunded'
  Total: number
  Note: string
  /** Drives `:stay-open` — exactly one order sets it. */
  KeepOpen?: boolean
  Items: LineItem[]
}

const orders: Order[] = [
  {
    Id: 1,
    Code: 'SO-1041',
    Customer: 'Andi Wijaya',
    Channel: 'Marketplace',
    Status: 'Paid',
    Total: 4_250_000,
    Note: 'Paid in full by transfer; shipped from the Bandung warehouse.',
    Items: [
      { Id: 101, Sku: 'KB-87', Item: 'Mechanical keyboard', Qty: 2, Price: 1_200_000, Note: 'Brown switches, ships in the retail box.' },
      { Id: 102, Sku: 'MS-21', Item: 'Wireless mouse', Qty: 3, Price: 450_000, Note: 'One unit swapped under warranty last month.' },
      { Id: 103, Sku: 'PD-05', Item: 'Desk pad', Qty: 1, Price: 250_000, Note: 'Large size, stitched edge.' },
      { Id: 104, Sku: 'CB-03', Item: 'USB-C cable 2m', Qty: 2, Price: 120_000, Note: 'Braided, 100W rated.' },
    ],
  },
  {
    Id: 2,
    Code: 'SO-1042',
    Customer: 'Sarah Putri',
    Channel: 'Direct',
    Status: 'Pending',
    Total: 1_800_000,
    Note: 'Waiting on the second payment instalment before release.',
    Items: [
      { Id: 201, Sku: 'MN-27', Item: '27" monitor', Qty: 1, Price: 1_500_000, Note: 'Customer asked for the height-adjustable stand.' },
      { Id: 202, Sku: 'CB-01', Item: 'HDMI cable 2m', Qty: 2, Price: 150_000, Note: 'Bundled with the monitor.' },
    ],
  },
  {
    Id: 3,
    Code: 'SO-1043',
    Customer: 'Budi Santoso',
    Channel: 'Reseller',
    Status: 'Draft',
    Total: 950_000,
    Note: 'Quote only — nothing reserved in stock yet.',
    Items: [
      { Id: 301, Sku: 'HS-11', Item: 'Headset', Qty: 1, Price: 650_000, Note: 'Pending a colour choice.' },
      { Id: 302, Sku: 'WC-02', Item: 'Webcam 1080p', Qty: 1, Price: 300_000, Note: 'Last one on the shelf.' },
    ],
  },
  {
    Id: 4,
    Code: 'SO-1044',
    Customer: 'Dewi Lestari',
    Channel: 'Corporate',
    Status: 'Pending',
    Total: 12_400_000,
    Note: 'Escalated account — finance wants this panel kept open while they reconcile.',
    // The one row that survives `table.detail().collapseAll()`.
    KeepOpen: true,
    Items: [
      { Id: 401, Sku: 'LT-14', Item: 'Laptop 14"', Qty: 4, Price: 2_400_000, Note: 'Imaged with the corporate build before hand-over.' },
      { Id: 402, Sku: 'DK-02', Item: 'Docking station', Qty: 4, Price: 550_000, Note: 'Dual-monitor variant.' },
      { Id: 403, Sku: 'BG-07', Item: 'Laptop bag', Qty: 4, Price: 200_000, Note: 'Embroidered with the company logo.' },
      { Id: 404, Sku: 'MS-21', Item: 'Wireless mouse', Qty: 4, Price: 450_000, Note: 'Same SKU as SO-1041 — shared stock pool.' },
      { Id: 405, Sku: 'WR-01', Item: 'Extended warranty', Qty: 4, Price: 300_000, Note: '24 months, on-site.' },
    ],
  },
  {
    Id: 5,
    Code: 'SO-1045',
    Customer: 'Rizky Ramadhan',
    Channel: 'Marketplace',
    Status: 'Paid',
    Total: 2_150_000,
    Note: 'Same-day pickup at the Surabaya counter.',
    Items: [
      { Id: 501, Sku: 'SS-08', Item: 'SSD 1TB', Qty: 2, Price: 850_000, Note: 'NVMe Gen4.' },
      { Id: 502, Sku: 'RM-16', Item: 'RAM 16GB', Qty: 1, Price: 450_000, Note: 'DDR5 5600.' },
    ],
  },
  {
    Id: 6,
    Code: 'SO-1046',
    Customer: 'Maya Anggraini',
    Channel: 'Direct',
    Status: 'Refunded',
    Total: 3_300_000,
    Note: 'Refunded in full after a DOA panel; replacement issued on SO-1049.',
    Items: [
      { Id: 601, Sku: 'MN-32', Item: '32" monitor', Qty: 1, Price: 3_000_000, Note: 'Dead pixels on arrival — returned to the vendor.' },
      { Id: 602, Sku: 'CB-01', Item: 'HDMI cable 2m', Qty: 2, Price: 150_000, Note: 'Returned unopened.' },
    ],
  },
  {
    Id: 7,
    Code: 'SO-1047',
    Customer: 'Fajar Nugroho',
    Channel: 'Reseller',
    Status: 'Paid',
    Total: 5_700_000,
    Note: 'Reseller pricing applied; invoice sent to the Jakarta office.',
    Items: [
      { Id: 701, Sku: 'PR-04', Item: 'Label printer', Qty: 3, Price: 1_500_000, Note: 'Thermal, 203 dpi.' },
      { Id: 702, Sku: 'LB-09', Item: 'Label roll', Qty: 12, Price: 75_000, Note: 'Ships in packs of six.' },
      { Id: 703, Sku: 'SC-05', Item: 'Barcode scanner', Qty: 2, Price: 150_000, Note: '2D, USB.' },
    ],
  },
  {
    Id: 8,
    Code: 'SO-1048',
    Customer: 'Intan Permata',
    Channel: 'Corporate',
    Status: 'Draft',
    Total: 8_900_000,
    Note: 'Awaiting a purchase order number before anything is reserved.',
    Items: [
      { Id: 801, Sku: 'SV-01', Item: 'Rack server', Qty: 1, Price: 7_500_000, Note: 'Quoted with a 3-year warranty.' },
      { Id: 802, Sku: 'RM-32', Item: 'RAM 32GB', Qty: 2, Price: 700_000, Note: 'ECC, matched pair.' },
    ],
  },
]

// The outer grid. `props.detail` is the SHARED default for every
// <mono-table-detail> bound to this controller — set the icons once instead of
// repeating them on each row, and listen once instead of once per row.
const table = controlMonoTable<Order>(orders, {
  searchValue: ['Code', 'Customer'],
  props: {
    detail: {
      icon: 'i-mdi-plus-box-outline',
      iconExpanded: 'i-mdi-minus-box-outline',
      onToggle: (event) => {
        const { open, rowKey } = event.detail
        lastEvent.value = `row ${rowKey ?? '?'} → ${open ? 'open' : 'closed'}`
        openCount.value = table.detail().openCount()
      },
    },
  },
})

// One nested controller per order — each drives its own <table mono-table>
// INSIDE the panel, complete with its own row details.
const lineTables = new Map<number, MonoTableController<LineItem>>()
for (const order of orders) lineTables.set(order.Id, controlMonoTable<LineItem>(order.Items))

const openCount = ref(0)
const lastEvent = ref('—')

const off = table.subscribe(() => {
  openCount.value = table.detail().openCount()
})

onBeforeUnmount(() => {
  off()
  table.dispose()
  for (const t of lineTables.values()) t.dispose()
})

const rupiah = (value: number): string => `Rp ${value.toLocaleString('id-ID')}`

const statusColor = (status: Order['Status']): ChipColor =>
  status === 'Paid'
    ? 'success'
    : status === 'Pending'
      ? 'warning'
      : status === 'Refunded'
        ? 'danger'
        : 'neutral'

function expandAll(): void {
  table.detail().expandAll()
  openCount.value = table.detail().openCount()
}

function collapseAll(): void {
  // Closes every detail EXCEPT the ones marked `stay-open` — here only SO-1044.
  table.detail().collapseAll()
  openCount.value = table.detail().openCount()
}

const summary = computed(() => `${openCount.value} of ${orders.length} open`)
</script>

<template>
  <mono-card bordered width="100%" class="example-detail-card">
    <div class="example-detail-toolbar">
      <div class="example-detail-toolbar-left">
        <mono-button size="sm" variant="outline" color="secondary" @click="expandAll">
          Expand all
        </mono-button>
        <mono-button size="sm" variant="outline" color="secondary" @click="collapseAll">
          Collapse all
        </mono-button>
      </div>

      <div class="example-detail-toolbar-right">
        <mono-chip size="xs" color="primary" variant="soft">{{ summary }}</mono-chip>
        <mono-chip size="xs" color="neutral" variant="soft">toggle: {{ lastEvent }}</mono-chip>
      </div>
    </div>

    <table mono-table>
      <thead>
        <tr>
          <th class="example-detail-toggle-col"></th>
          <th>Order</th>
          <th>Customer</th>
          <th>Channel</th>
          <th>Status</th>
          <th class="example-num">Total</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="order in orders" :key="order.Id" :data-row-key="order.Id">
          <td class="example-detail-toggle-col">
            <!-- Only the chevron lives here; everything slotted inside becomes
                 the panel row inserted below this <tr>. `stay-open` comes off the
                 data, so exactly one row survives Collapse all. -->
            <mono-table-detail
              :control-table.prop="table"
              :stay-open="order.KeepOpen === true"
            >
              <p class="example-detail-note">
                <strong>{{ order.Code }}</strong> — {{ order.Note }}
              </p>

              <p v-if="order.Status === 'Draft'" class="example-detail-warn">
                This order is still a draft, so the lines below are not reserved.
              </p>

              <!-- A whole nested grid, with its own controller AND its own
                   row details, inside the panel. -->
              <table mono-table class="example-detail-lines">
                <thead>
                  <tr>
                    <th class="example-detail-toggle-col"></th>
                    <th>SKU</th>
                    <th>Item</th>
                    <th class="example-num">Qty</th>
                    <th class="example-num">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in order.Items" :key="line.Id" :data-row-key="line.Id">
                    <td class="example-detail-toggle-col">
                      <mono-table-detail :control-table.prop="lineTables.get(order.Id)">
                        <p class="example-detail-note">{{ line.Item }}: {{ line.Note }}</p>
                      </mono-table-detail>
                    </td>
                    <td>{{ line.Sku }}</td>
                    <td>{{ line.Item }}</td>
                    <td class="example-num">{{ line.Qty }}</td>
                    <td class="example-num">{{ rupiah(line.Price) }}</td>
                  </tr>
                </tbody>
              </table>
            </mono-table-detail>
          </td>

          <td>
            {{ order.Code }}
            <mono-chip v-if="order.KeepOpen" size="xs" color="info" variant="soft">
              stay-open
            </mono-chip>
          </td>
          <td>{{ order.Customer }}</td>
          <td>{{ order.Channel }}</td>
          <td>
            <mono-chip size="xs" :color="statusColor(order.Status)" variant="soft">
              {{ order.Status }}
            </mono-chip>
          </td>
          <td class="example-num">{{ rupiah(order.Total) }}</td>
        </tr>
      </tbody>
    </table>
  </mono-card>
</template>

<style scoped>
.example-detail-card {
  --mono-card-padding: 0;
  width: 100%;
  overflow: hidden;
}

.example-detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-detail-toolbar-left,
.example-detail-toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* The chevron column only needs to fit the toggle. */
.example-detail-toggle-col {
  width: 2.5rem;
}

.example-num {
  text-align: right;
  white-space: nowrap;
}

.example-detail-note {
  margin: 0 0 0.35rem;
}

.example-detail-warn {
  margin: 0 0 0.35rem;
  color: var(--warning);
}

.example-detail-lines {
  background: var(--card);
}
</style>
