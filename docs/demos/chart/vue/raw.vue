<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import { controlMonoChart } from '@mono-lit/helper'

// Raw passthrough: hand the controller a chart.js `{ labels, datasets }` object
// and it is used verbatim — no field mapping, no aggregation. Everything
// chart.js accepts on a dataset works, including a per-series `type` for a
// mixed bar + line chart.
const chart = controlMonoChart({
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [
    {
      type: 'bar',
      label: 'Revenue',
      data: [12000, 15200, 14100, 18600],
      backgroundColor: '#6d8ef0',
      borderRadius: 4,
    },
    {
      type: 'line',
      label: 'Target',
      data: [13000, 14000, 15000, 16000],
      borderColor: '#e5484d',
      borderDash: [6, 4],
      pointRadius: 3,
      fill: false,
    },
  ],
})

onBeforeUnmount(() => chart.dispose())
</script>

<template>
  <div style="width: 100%">
    <!-- The element's `type` is the FALLBACK for datasets that don't state one. -->
    <mono-chart :control-chart.prop="chart" type="bar" height="320" title="Revenue vs target" />
  </div>
</template>
