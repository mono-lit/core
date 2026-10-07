<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/select'
import { controlMonoChart } from '@mono-lit/helper'

// FOUR series on purpose. A palette is indexed per dataset on bar/line, so a
// single-series chart could only ever show its first colour.
const rows = [
  { quarter: 'Q1', won: 42, pending: 28, atRisk: 16, lost: 9 },
  { quarter: 'Q2', won: 51, pending: 24, atRisk: 12, lost: 14 },
  { quarter: 'Q3', won: 47, pending: 31, atRisk: 19, lost: 7 },
  { quarter: 'Q4', won: 63, pending: 22, atRisk: 14, lost: 11 },
]

const chart = controlMonoChart(rows, {
  labelField: 'quarter',
  series: [
    { field: 'won', label: 'Won' },
    { field: 'pending', label: 'Pending' },
    { field: 'atRisk', label: 'At risk' },
    { field: 'lost', label: 'Lost' },
  ],
})

// `<mono-chart>` takes the type as a prop — the presets (`<mono-chart-bar>` etc.)
// are the same element with it locked, so switching here shows every one of them.
const type = ref('bar')
const types = ['bar', 'line', 'pie', 'doughnut', 'polarArea'].map((t) => ({ label: t, value: t }))

// The same mono colour names every other component takes — Basecoat's five chart
// colours, the roles — plus any CSS colour.
const accent = ref('chart-3')
const accents = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'primary', 'secondary', 'accent', 'success', 'warning', 'danger', 'info', '#7c3aed']
  .map((c) => ({ label: c, value: c }))
const palette = ref('')
const palettes = [
  { label: 'chart-1 … chart-4', value: 'chart-1,chart-2,chart-3,chart-4' },
  { label: 'success, info, warning, danger', value: 'success,info,warning,danger' },
  { label: 'chart-5, chart-3, chart-1, chart-2', value: 'chart-5,chart-3,chart-1,chart-2' },
  { label: 'names mixed with hex', value: 'primary,#7c3aed,success,#0891b2' },
]

// `colors` wins over `color` when both are set, so blank the accent select's
// effect while a palette is chosen rather than sending both.
const color = computed(() => (palette.value ? undefined : accent.value))

// Pie-family charts paint one colour per SLICE; bar/line paint one per DATASET.
// That's the whole reason this demo carries four series — say it out loud, since
// a palette on a single-series bar otherwise looks broken.
const perSlice = computed(() => ['pie', 'doughnut', 'polarArea'].includes(type.value))
const hint = computed(() => {
  if (!palette.value) return 'every dataset takes the one accent'
  return perSlice.value
    ? 'one colour per SLICE — the palette maps across the four quarters'
    : 'one colour per DATASET — four series, so the whole palette shows'
})

onBeforeUnmount(() => chart.dispose())
</script>

<template>
  <div style="width: 100%">
    <div class="example-bar">
      <mono-select size="sm" label="type" :items.prop="types" key-value="value" display-value="label"
        :model-value="type" @change="type = $event.detail.modelValue" style="width: 9rem" />
      <mono-select size="sm" label="color" :items.prop="accents" key-value="value" display-value="label"
        :model-value="accent" :disabled="!!palette" @change="accent = $event.detail.modelValue" style="width: 9rem" />
      <mono-select size="sm" label="colors" placeholder="— (use color)" clearable :items.prop="palettes" key-value="value" display-value="label"
        :model-value="palette || null" @change="palette = $event.detail.modelValue ?? ''" style="width: 15rem" />
    </div>

    <mono-chart
      :control-chart.prop="chart"
      :type="type"
      :color="color"
      :colors="palette || undefined"
      height="260"
      legend="right" />

    <p class="example-code">
      <code v-if="palette">colors="{{ palette }}"</code>
      <code v-else>color="{{ accent }}"</code>
      <span class="example-hint">— {{ hint }}</span>
    </p>
  </div>
</template>

<style scoped>
.example-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: calc(var(--mono-spacing) * 4);
  margin-bottom: calc(var(--mono-spacing) * 4);
}
.example-code {
  margin: calc(var(--mono-spacing) * 3) 0 0;
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
}
.example-code code {
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--foreground);
}
.example-hint {
  margin-left: var(--mono-spacing);
}
</style>
