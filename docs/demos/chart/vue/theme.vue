<script setup>
import { onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import { controlMonoChart } from '@mono-lit/helper'

/*
 * Charts follow the theme like every other component.
 *
 * The DEFAULT palette is Basecoat's own chart colours — `--chart-1` … `--chart-5`,
 * the swatches above the charts — and the axes, grid, legend and tooltip take the
 * page's `--foreground` / `--muted-foreground` / `--border` / `--popover`. Switch
 * the flavour, the colour preset or dark mode in the page header: the swatches
 * re-cascade, and because a canvas is a bitmap the elements repaint themselves
 * (they listen for `theme-changed` and watch the `.dark` class).
 */
const rows = [
  { month: 'Jan', online: 3200, retail: 2400, wholesale: 1500, partner: 900, other: 400 },
  { month: 'Feb', online: 4100, retail: 2600, wholesale: 1800, partner: 1100, other: 300 },
  { month: 'Mar', online: 3800, retail: 3100, wholesale: 1600, partner: 1300, other: 500 },
  { month: 'Apr', online: 5300, retail: 2900, wholesale: 2100, partner: 1000, other: 600 },
  { month: 'May', online: 4900, retail: 3400, wholesale: 1900, partner: 1400, other: 450 },
]

// No `color` / `colors` anywhere — this is the out-of-the-box palette.
const bars = controlMonoChart(rows, {
  labelField: 'month',
  series: [
    { field: 'online', label: 'Online' },
    { field: 'retail', label: 'Retail' },
    { field: 'wholesale', label: 'Wholesale' },
    { field: 'partner', label: 'Partner' },
    { field: 'other', label: 'Other' },
  ],
})

const slices = controlMonoChart(
  [
    { channel: 'Online', n: 21300 },
    { channel: 'Retail', n: 14400 },
    { channel: 'Wholesale', n: 8900 },
    { channel: 'Partner', n: 5700 },
    { channel: 'Other', n: 2250 },
  ],
  { labelField: 'channel', series: [{ field: 'n', label: 'Revenue' }] },
)

const swatches = [1, 2, 3, 4, 5]

onBeforeUnmount(() => {
  bars.dispose()
  slices.dispose()
})
</script>

<template>
  <div style="width: 100%">
    <div class="example-swatches">
      <span class="example-swatch-label">default palette</span>
      <span v-for="n in swatches" :key="n" class="example-swatch" :style="{ background: `var(--chart-${n})` }">
        <code>chart-{{ n }}</code>
      </span>
    </div>

    <p class="example-note">
      Neither chart sets <code>color</code> or <code>colors</code> — the series take
      <code>--chart-1</code> … <code>--chart-5</code>, the inks and grid the page tokens.
      Change the theme in the header and both move with it.
    </p>

    <div class="example-grid">
      <mono-chart-bar :control-chart.prop="bars" height="280" legend="bottom" />
      <mono-chart-doughnut :control-chart.prop="slices" height="280" legend="right" />
    </div>
  </div>
</template>

<style scoped>
.example-swatches {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: calc(var(--mono-spacing) * 2);
  margin-bottom: calc(var(--mono-spacing) * 3);
}
.example-swatch-label {
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
  margin-right: var(--mono-spacing);
}
.example-swatch {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--mono-spacing) * 2);
  padding: var(--mono-spacing) calc(var(--mono-spacing) * 2) var(--mono-spacing) var(--mono-spacing);
  border-radius: var(--mono-radius-md);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent);
}
.example-swatch code {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: var(--mono-text-xs);
  padding: 0 var(--mono-spacing);
  border-radius: var(--mono-radius-sm);
  background: var(--background);
  color: var(--foreground);
}
.example-note {
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
  margin: 0 0 calc(var(--mono-spacing) * 4);
}
.example-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: calc(var(--mono-spacing) * 5);
}
@container (max-width: 640px) {
  .example-grid {
    grid-template-columns: 1fr;
  }
}
</style>
