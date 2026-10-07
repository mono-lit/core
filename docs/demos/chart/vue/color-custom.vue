<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/select'
import '@mono-lit/helper/ui/switch'
import { controlMonoChart } from '@mono-lit/helper'

/*
 * Every layer of colour customization, live:
 *   1. `color` / `colors`   — mono names or CSS colors, on the element
 *   2. `series[].color`     — per dataset, wins over the palette
 *   3. `--mono-chart-*`     — retarget what a NAME means (theme-level)
 *   4. `chart-options`      — raw chart.js for anything else (grid, ticks, fill)
 */

const rows = [
  { month: 'Jan', online: 3200, retail: 2400 },
  { month: 'Feb', online: 4100, retail: 2600 },
  { month: 'Mar', online: 3800, retail: 3100 },
  { month: 'Apr', online: 5300, retail: 2900 },
  { month: 'May', online: 4900, retail: 3400 },
  { month: 'Jun', online: 6200, retail: 3800 },
]

const opt = (list) => list.map((v) => ({ label: v, value: v }))

const type = ref('bar')
const types = opt(['bar', 'line', 'pie', 'doughnut'])
const mode = ref('palette') // palette | per-series
const modes = [
  { label: 'palette', value: 'palette' },
  { label: 'series[].color', value: 'per-series' },
]
const palette = ref('chart-1,chart-3')
const palettes = [
  { label: 'chart-1, chart-3', value: 'chart-1,chart-3' },
  { label: 'primary, accent', value: 'primary,accent' },
  { label: 'success, danger', value: 'success,danger' },
  { label: 'warning, info', value: 'warning,info' },
  { label: '#7c3aed, #0891b2', value: '#7c3aed,#0891b2' },
]
const seriesA = ref('success')
const seriesAOptions = opt(['primary', 'success', 'info', 'accent', 'chart-2'])
const seriesB = ref('warning')
const seriesBOptions = opt(['warning', 'danger', 'secondary', 'accent', 'chart-4'])

// Retarget what the NAMES mean. Because the element resolves `success` through
// `--mono-chart-success`, overriding the variable re-colours everything that
// asked for `success` — no chart code changes.
const brandSuccess = ref('')
const brandDanger = ref('')
const styleVars = computed(() => {
  const s = {}
  if (brandSuccess.value) s['--mono-chart-success'] = brandSuccess.value
  if (brandDanger.value) s['--mono-chart-danger'] = brandDanger.value
  return s
})

const fill = ref(false)
const grid = ref(true)

const chart = controlMonoChart(rows, {
  labelField: 'month',
  series: [
    { field: 'online', label: 'Online' },
    { field: 'retail', label: 'Retail' },
  ],
})

function applyMode() {
  if (mode.value === 'per-series') {
    // A series' own `color` wins over the palette — names work here too.
    chart.setSeries([
      { field: 'online', label: 'Online', color: seriesA.value },
      { field: 'retail', label: 'Retail', color: seriesB.value },
    ])
  } else {
    chart.setSeries([
      { field: 'online', label: 'Online' },
      { field: 'retail', label: 'Retail' },
    ])
  }
}
function setMode(next) {
  mode.value = next
  applyMode()
}
function setSeries(which, value) {
  if (which === 'a') seriesA.value = value
  else seriesB.value = value
  applyMode()
}

const chartOptions = computed(() => ({
  elements: { line: { fill: fill.value, tension: 0.35 } },
  scales: {
    x: { grid: { display: grid.value } },
    y: { grid: { display: grid.value }, beginAtZero: true },
  },
}))

onBeforeUnmount(() => chart.dispose())
</script>

<template>
  <div style="width: 100%">
    <div class="example-panel">
      <mono-select size="sm" label="type" :items.prop="types" key-value="value" display-value="label"
        :model-value="type" @change="type = $event.detail.modelValue" style="width: 8rem" />
      <mono-select size="sm" label="colors from" :items.prop="modes" key-value="value" display-value="label"
        :model-value="mode" @change="setMode($event.detail.modelValue)" style="width: 9rem" />

      <mono-select v-if="mode === 'palette'" size="sm" label="colors" :items.prop="palettes" key-value="value" display-value="label"
        :model-value="palette" @change="palette = $event.detail.modelValue" style="width: 11rem" />
      <template v-else>
        <mono-select size="sm" label="Online" :items.prop="seriesAOptions" key-value="value" display-value="label"
          :model-value="seriesA" @change="setSeries('a', $event.detail.modelValue)" style="width: 8rem" />
        <mono-select size="sm" label="Retail" :items.prop="seriesBOptions" key-value="value" display-value="label"
          :model-value="seriesB" @change="setSeries('b', $event.detail.modelValue)" style="width: 8rem" />
      </template>

      <label class="example-swatch">
        <span>--mono-chart-success</span>
        <input type="color" :value="brandSuccess || '#0f9d58'" @input="brandSuccess = $event.target.value" />
      </label>
      <label class="example-swatch">
        <span>--mono-chart-danger</span>
        <input type="color" :value="brandDanger || '#d93025'" @input="brandDanger = $event.target.value" />
      </label>

      <mono-switch size="sm" label="fill" :model-value="fill" @change="fill = $event.detail.modelValue" />
      <mono-switch size="sm" label="grid" :model-value="grid" @change="grid = $event.detail.modelValue" />
    </div>

    <!-- `style` carries the token overrides; the element reads them back out of
         the DOM when it resolves a name, so this re-colours without new props. -->
    <div :style="styleVars">
      <mono-chart
        :control-chart.prop="chart"
        :type="type"
        :colors="mode === 'palette' ? palette : undefined"
        :chart-options.prop="chartOptions"
        height="320"
        legend="bottom" />
    </div>

    <p class="example-note">
      The two colour pickers rewrite <code>--mono-chart-success</code> /
      <code>--mono-chart-danger</code> on the wrapper. Switch <em>colors from</em> to
      <code>series[].color</code> and pick those names to see it take effect —
      that's the whole theming chain in one place.
    </p>
  </div>
</template>

<style scoped>
.example-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: calc(var(--mono-spacing) * 3) calc(var(--mono-spacing) * 4);
  margin-bottom: calc(var(--mono-spacing) * 4);
}
.example-swatch {
  display: inline-flex;
  flex-direction: column;
  gap: calc(var(--mono-spacing) * 2);
  font-size: var(--mono-text-xs);
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--muted-foreground);
}
.example-swatch input[type='color'] {
  width: calc(var(--mono-spacing) * 9);
  height: var(--mono-control-height-sm);
  padding: 0;
  border: var(--mono-border-width) solid var(--input);
  border-radius: var(--mono-radius-md);
  background: var(--background);
}
.example-note {
  margin: calc(var(--mono-spacing) * 3) 0 0;
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
}
</style>
