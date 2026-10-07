<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/button'
import { buildChartApply, controlMonoChart } from '@mono-lit/helper'

const ODATA_BASE = 'https://services.odata.org/TripPinRESTierService/(S(monohelperdocs000000001))'

// The SERVER does the roll-up. Supplying `odata.aggregate` switches the
// controller to a single `$apply=groupby(…)` request that returns one row per
// gender, instead of draining every row and counting them in the browser.
//
// TripPin has no numeric column to sum (`Age` is null on every row), so the
// measure here is `$count`. On a service with a numeric field you would add
// `{ field: 'Amount', agg: 'sum' }` alongside it.
const onlyA = ref(false)

const chart = controlMonoChart<any>(null, {
  groupBy: 'Gender',
  series: [
    { field: 'Rows', label: 'People', agg: 'count' },
  ],
  odata: {
    baseUrl: ODATA_BASE,
    url: '/People',
    // `apply` arrives prebuilt from `groupBy` + `series`; compose and return it.
    aggregate: ({ apply, filter, withFilter }) => withFilter(apply, filter),
  },
  // The base every request goes out on — a getter, read fresh at every reload,
  // so it follows `onlyA` without any mirroring. The `$filter` is folded INSIDE
  // `$apply`, so the server filters first and aggregates only the matching rows.
  odataOptions: () => (onlyA.value ? { $filter: "contains(FirstName,'A')" } : {}),
})

// Shown on screen so the request the chart makes is visible.
const applied = ref('')
const off = chart.subscribe(() => {
  applied.value = buildChartApply('Gender', [
    { field: 'Rows', agg: 'count' },
  ])
})

async function toggleFilter() {
  onlyA.value = !onlyA.value
  await chart.reload()
}

onBeforeUnmount(() => {
  off()
  chart.dispose()
})
</script>

<template>
  <div style="width: 100%">
    <div class="example-bar">
      <mono-button size="sm" variant="tonal" @click="chart.reload()">Reload</mono-button>
      <mono-button size="sm" :variant="onlyA ? 'solid' : 'outline'" @click="toggleFilter">
        {{ onlyA ? "filter: contains(FirstName,'A')" : 'no filter' }}
      </mono-button>
      <span class="example-note">one request — {{ chart.items.length }} buckets returned</span>
    </div>

    <mono-chart-bar :control-chart.prop="chart" height="320" legend="bottom" />

    <p class="example-apply">
      <strong>$apply</strong>
      <code>{{ onlyA ? `filter(contains(FirstName,'A'))/${applied}` : applied }}</code>
    </p>
  </div>
</template>

<style scoped>
.example-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}
.example-note {
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
}
.example-apply {
  display: grid;
  grid-template-columns: 4rem 1fr;
  gap: 0.6rem;
  align-items: start;
  margin: 0.7rem 0 0;
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
}
.example-apply code {
  word-break: break-all;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--primary);
}
</style>
