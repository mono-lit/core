<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/button'
import { controlMonoChart } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

const ODATA_BASE = 'https://services.odata.org/V4/Northwind/Northwind.svc'

// A remote source is paged, but a chart wants the WHOLE set — so the controller
// drains it in chunks (`loadAll`, on by default) rather than charting page 1.
// Rows arrive as raw documents, so `groupBy` + `agg` do the roll-up here.
// Keep `select` down to the fields charted (see below); to skip the drain
// entirely, let the server aggregate — see the `$apply` demo.
const chart = controlMonoChart<any>(null, {
  groupBy: 'ShipCountry',
  series: [{ field: 'Freight', label: 'Total freight', agg: 'sum' }],
})

// `shallowRef`, not `ref`: a deep reactive proxy around a DataSource can break
// devextreme's internals.
const dataSource = shallowRef<any>(null)
const loading = ref(false)
const rowCount = ref(0)

const off = chart.subscribe(() => {
  loading.value = chart.loading
  rowCount.value = chart.items.length
})

onMounted(async () => {
  const res = await monoCreateFetcher({
    baseUrl: ODATA_BASE,
    url: '/Orders',
  }).response({
    options: {
      // Only what the chart actually reads: the `groupBy` field and the series
      // field. Every extra column here is fetched for EVERY row and then thrown
      // away — on a draining chart, narrowing `$select` is the one lever that
      // keeps the payload down.
      select: ['ShipCountry', 'Freight'],
      paginate: true,
      // Bigger pages → fewer round-trips while the controller drains all 830 rows.
      pageSize: 200,
    },
  })

  dataSource.value = res.dataSource
  chart.bind(res.dataSource)
  await chart.reload()
})

onBeforeUnmount(() => {
  off()
  chart.dispose()
})
</script>

<template>
  <div style="width: 100%">
    <div class="example-bar">
      <mono-button size="sm" variant="tonal" :disabled="loading" @click="chart.reload()">
        Reload
      </mono-button>
      <span class="example-note">
        {{ loading ? 'loading…' : `${rowCount} rows drained, 2 columns each → freight summed per country` }}
      </span>
    </div>
    <mono-chart-bar :control-chart.prop="chart" height="320" :legend="false" />
  </div>
</template>

<style scoped>
.example-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}
.example-note {
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
}
</style>
