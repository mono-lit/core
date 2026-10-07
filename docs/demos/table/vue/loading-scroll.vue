<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/table'
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
import { controlMonoTable } from '@mono-lit/helper'

// A table that scrolls BOTH ways — 15 columns and 40 rows behind a fixed-height region — so the
// overlay's geometry is the thing on show. Hold it on with the button and scroll around: the dim
// stays over every column and every row, and the spinner holds one place in the VISIBLE area —
// centred on the scrollport, a measured gap below the frozen header — at every scroll offset.
//
// The markup is one line, in the `<caption>` — the one table section whose content model takes a
// custom element. Dropped into `<tbody>` instead it still works (the element wraps ITSELF in a
// zero-height `<tr><td colspan>` on connect), but `<tbody>` takes only `<tr>`, so Vue's compiler
// warns about the nesting before any of that runs.
type Row = { Id: number; Item: string; Region: string; Owner: string } & Record<string, unknown>

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const REGIONS = ['North', 'South', 'East', 'West']
const OWNERS = ['Avery', 'Blake', 'Casey', 'Devon', 'Ellis']

const data = Array.from({ length: 40 }, (_, i) => {
  const row: any = {
    Id: i + 1,
    Item: `SKU-${1000 + i}`,
    Region: REGIONS[i % REGIONS.length],
    Owner: OWNERS[i % OWNERS.length],
  }
  for (let m = 1; m <= 12; m++) row[`M${m}`] = ((i * 37 + m * 11) % 90) * 25
  return row as Row
})

const table = controlMonoTable<Row>(data, { keyExpr: 'Id', pageSize: 40 })

const rows = ref<Row[]>([])
const off = table.subscribe(() => { rows.value = [...table.items] })
table.load()

// Held by hand so the overlay can be inspected at leisure — a real query is over too quickly to
// scroll around in. `|| null` REMOVES the attribute: the CSS keys on a bare `[data-loading]`, so
// a literal `false` would still match.
const busy = ref(false)
const flag = computed(() => busy.value || null)

const money = (n: unknown) => Number(n).toLocaleString('en-US')

onBeforeUnmount(() => {
  off()
  table.dispose()
})
</script>

<template>
  <mono-card bordered width="100%" class="example-card">
    <div class="example-toolbar">
      <mono-button size="sm" :color="busy ? 'danger' : 'primary'" @click="busy = !busy">
        {{ busy ? 'Hide overlay' : 'Show overlay' }}
      </mono-button>

      <span class="example-hint">Turn it on, then scroll the table both ways.</span>
    </div>

    <div mono-table-scroll mono-scroll-y class="example-scroll">
      <table mono-table mono-fixed mono-sticky-head>
        <caption><mono-table-loading :control-table.prop="table" :data-loading="flag" /></caption>

        <colgroup>
          <col style="width: 7rem">
          <col style="width: 7rem">
          <col style="width: 7rem">
          <col v-for="m in MONTHS" :key="m" style="width: 6rem">
        </colgroup>

        <thead>
          <tr>
            <th>Item</th>
            <th>Region</th>
            <th>Owner</th>
            <th v-for="m in MONTHS" :key="m">{{ m }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.Id">
            <td>{{ row.Item }}</td>
            <td>{{ row.Region }}</td>
            <td>{{ row.Owner }}</td>
            <td v-for="(m, i) in MONTHS" :key="m" class="example-num">
              {{ money(row[`M${i + 1}`]) }}
            </td>
          </tr>
        </tbody>
      </table>
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
  gap: 0.75rem;
  padding: 0.72rem 1rem;
  flex-wrap: wrap;
}

.example-hint {
  font-size: 0.8rem;
  opacity: 0.7;
}

.example-scroll {
  height: 22rem;
}

.example-num {
  text-align: right;
}
</style>
