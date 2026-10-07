<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/table'
import { controlMonoChart } from '@mono-lit/helper'

// Raw transaction rows — one row per sale, NOT pre-aggregated. This is the shape
// a DataSource usually hands you, so the controller buckets them itself.
const tx = [
  { region: 'North', quarter: 'Q1', amount: 1200 },
  { region: 'North', quarter: 'Q2', amount: 1800 },
  { region: 'North', quarter: 'Q1', amount: 900 },
  { region: 'South', quarter: 'Q1', amount: 2100 },
  { region: 'South', quarter: 'Q2', amount: 1500 },
  { region: 'East', quarter: 'Q1', amount: 800 },
  { region: 'East', quarter: 'Q2', amount: 1100 },
  { region: 'East', quarter: 'Q2', amount: 700 },
  { region: 'West', quarter: 'Q1', amount: 1600 },
]

const agg = ref('sum')
const aggs = ['sum', 'avg', 'count', 'min', 'max'].map((a) => ({ label: a, value: a }))

// `groupBy` buckets rows by region; `agg` collapses each bucket to one number.
const chart = controlMonoChart(tx, {
  groupBy: 'region',
  series: [{ field: 'amount', label: 'Amount', agg: 'sum' }],
})

function setAgg(next) {
  agg.value = next
  chart.setSeries([{ field: 'amount', label: `Amount (${next})`, agg: next }])
}

// Shown next to the chart so you can check the maths by eye.
const table = computed(() => {
  const m = new Map()
  for (const r of tx) {
    const list = m.get(r.region) ?? []
    list.push(r.amount)
    m.set(r.region, list)
  }
  return [...m].map(([region, vals]) => ({
    region,
    count: vals.length,
    sum: vals.reduce((a, b) => a + b, 0),
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    min: Math.min(...vals),
    max: Math.max(...vals),
  }))
})

onBeforeUnmount(() => chart.dispose())
</script>

<template>
  <div style="width: 100%">
    <div class="example-bar">
      <mono-select size="sm" label="aggregate" :items.prop="aggs" key-value="value" display-value="label"
        :model-value="agg" @change="setAgg($event.detail.modelValue)" style="width: 8rem" />
      <span class="example-note">9 raw rows → 4 buckets by <code>region</code></span>
    </div>

    <mono-chart-bar :control-chart.prop="chart" height="280" :legend="false" />

    <!-- the buckets, as the ported table — the highlighted column is the one charted -->
    <table mono-table class="example-table">
      <thead>
        <tr>
          <th>region</th>
          <th v-for="k in ['count', 'sum', 'avg', 'min', 'max']" :key="k" :class="{ 'example-on': k === agg }">{{ k }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in table" :key="r.region">
          <td>{{ r.region }}</td>
          <td v-for="k in ['count', 'sum', 'avg', 'min', 'max']" :key="k" :class="{ 'example-on': k === agg }">{{ r[k] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.example-bar {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: calc(var(--mono-spacing) * 4);
  margin-bottom: calc(var(--mono-spacing) * 4);
}
.example-note {
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
  padding-bottom: calc(var(--mono-spacing) * 2);
}
.example-table {
  margin-top: calc(var(--mono-spacing) * 4);
  --mono-table-font: var(--mono-text-xs);
}
.example-table th,
.example-table td {
  font-variant-numeric: tabular-nums;
}
.example-on {
  color: var(--primary);
  font-weight: var(--mono-font-weight-semibold);
}
</style>
