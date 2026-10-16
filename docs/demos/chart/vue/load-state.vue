<script setup lang="ts">
import '@mono-lit/helper/ui/chart'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { controlMonoChart } from '@mono-lit/helper'
import { monoCreateFetcher } from '@mono-lit/utility/fetching'

// The real Northwind Orders feed, freight summed per country. Ticked, the drain
// also asks for `ShipColour` — a column Orders does not have — so the server
// answers 400 and the chart shows the error. Untick it and press ↻: the base
// options are read fresh on every reload, so the retry goes out valid.
const broken = ref(true)
const FIELDS = ['ShipCountry', 'Freight']

const chart = controlMonoChart<any>(null, {
  groupBy: 'ShipCountry',
  series: [{ field: 'Freight', label: 'Total freight', agg: 'sum' }],
  // Drain the rows rather than asking for a server roll-up, so the `$select`
  // below is what goes on the wire.
  serverApply: false,
  dataSourceOptions: computed(() => ({
    select: broken.value ? [...FIELDS, 'ShipColour'] : FIELDS,
  })),
})

onMounted(async () => {
  const res = await monoCreateFetcher({
    baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
    url: '/Orders',
  }).response({
    options: { select: FIELDS, paginate: true, pageSize: 200 },
  })
  chart.bind(res.dataSource) // binding it starts the first load
})

onBeforeUnmount(() => chart.dispose())
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoCheck v-model="broken">Request a column that doesn't exist (<code>ShipColour</code>)</DemoCheck>
      <button type="button" class="example-btn" @click="chart.reload().catch(() => {})">Reload</button>
    </DemoControls>

    <mono-chart-bar :control-chart.prop="chart" height="300" :legend="false" />
  </div>
</template>

<style scoped>
.example-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card);
  color: var(--foreground);
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
