<script setup>
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/switch'
import { controlMonoChart } from '@mono-lit/helper'

const rows = [
  { stage: 'Leads', a: 900, b: 720 },
  { stage: 'Qualified', a: 640, b: 540 },
  { stage: 'Proposal', a: 380, b: 350 },
  { stage: 'Won', a: 210, b: 180 },
]

const chart = controlMonoChart(rows, {
  labelField: 'stage',
  series: [
    { field: 'a', label: 'This year' },
    { field: 'b', label: 'Last year' },
  ],
  // Raw chart.js options are deep-merged OVER the element's generated defaults,
  // so you can reach anything the library supports without losing the theming.
  options: {
    plugins: { tooltip: { callbacks: {} } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => `${v}` } } },
  },
})

const palette = ref('chart-4,chart-2')
const palettes = [
  { label: 'chart-4, chart-2', value: 'chart-4,chart-2' },
  { label: 'success, warning', value: 'success,warning' },
  { label: 'primary, secondary', value: 'primary,secondary' },
  { label: '#7c3aed, #dc2626', value: '#7c3aed,#dc2626' },
]
const stacked = ref(false)

function applyPalette(next) {
  palette.value = next
  // names or CSS colours, exactly as the `colors` attribute takes them
  chart.setColors(next.split(',').map((s) => s.trim()))
}
applyPalette(palette.value)

onBeforeUnmount(() => chart.dispose())
</script>

<template>
  <div style="width: 100%">
    <div class="example-bar">
      <mono-select size="sm" label="palette" :items.prop="palettes" key-value="value" display-value="label"
        :model-value="palette" @change="applyPalette($event.detail.modelValue)" style="width: 11rem" />
      <mono-switch size="sm" label="stacked" :model-value="stacked" @change="stacked = $event.detail.modelValue" />
    </div>

    <!-- `colors` also accepts a comma-separated attribute; `chart-options` takes
         raw chart.js options via `.prop` for per-element tweaks. -->
    <mono-chart-bar
      :control-chart.prop="chart"
      :stacked="stacked"
      height="300"
      legend="bottom"
      :chart-options.prop="{ plugins: { legend: { labels: { boxWidth: 12 } } } }" />
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
</style>
