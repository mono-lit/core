<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import { controlMonoChart } from '@mono-lit/helper'

// One controller can feed several elements — each preset just fixes its own
// `type`, so the same projected data renders four ways.
const rows = [
  { team: 'Research', headcount: 18 },
  { team: 'Engineering', headcount: 42 },
  { team: 'Operations', headcount: 25 },
  { team: 'Design', headcount: 12 },
]

const make = () =>
  controlMonoChart(rows, { labelField: 'team', series: [{ field: 'headcount', label: 'Headcount' }] })

const bar = make()
const line = make()
const pie = make()
const doughnut = make()

onBeforeUnmount(() => [bar, line, pie, doughnut].forEach((c) => c.dispose()))
</script>

<template>
  <div class="example-grid">
    <div>
      <div class="example-label">&lt;mono-chart-bar&gt;</div>
      <mono-chart-bar :control-chart.prop="bar" height="220" :legend="false" />
    </div>
    <div>
      <div class="example-label">&lt;mono-chart-line&gt;</div>
      <mono-chart-line :control-chart.prop="line" height="220" :legend="false" />
    </div>
    <div>
      <div class="example-label">&lt;mono-chart-pie&gt;</div>
      <mono-chart-pie :control-chart.prop="pie" height="220" legend="right" />
    </div>
    <div>
      <div class="example-label">&lt;mono-chart-doughnut&gt;</div>
      <mono-chart-doughnut :control-chart.prop="doughnut" height="220" legend="right" />
    </div>
  </div>
</template>

<style scoped>
.example-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  width: 100%;
}
@container (max-width: 640px) {
  .example-grid {
    grid-template-columns: 1fr;
  }
}
.example-label {
  font-family: monospace;
  font-size: 0.72rem;
  opacity: 0.6;
  margin-bottom: 0.4rem;
}
</style>
