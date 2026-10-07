<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import { controlMonoChart } from '@mono-lit/helper'

// Rows in, chart out. `labelField` names the category axis; each `series` entry
// becomes one dataset. Field names accept path expressions (`Job.Budget`).
const rows = [
  { month: 'Jan', sales: 4200, costs: 3100 },
  { month: 'Feb', sales: 5100, costs: 3400 },
  { month: 'Mar', sales: 4800, costs: 3600 },
  { month: 'Apr', sales: 6300, costs: 3900 },
  { month: 'May', sales: 5900, costs: 4100 },
  { month: 'Jun', sales: 7200, costs: 4300 },
]

const chart = controlMonoChart(rows, {
  labelField: 'month',
  series: [
    { field: 'sales', label: 'Sales' },
    { field: 'costs', label: 'Costs' },
  ],
})

onBeforeUnmount(() => chart.dispose())
</script>

<template>
  <div style="width: 100%">
    <mono-chart-bar :control-chart.prop="chart" height="320" title="Sales vs costs" />
  </div>
</template>
