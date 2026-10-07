<script setup>
import { ref, onBeforeUnmount } from 'vue'
import '@mono-lit/helper/ui/chart'
import '@mono-lit/helper/ui/button'
import { controlMonoChart, monoArraySource } from '@mono-lit/helper'

// A live array source: `setData` emits `changed`, the controller re-syncs and
// re-projects, and the element updates the EXISTING chart.js instance rather
// than tearing the canvas down — so the transition animates instead of flashing.
let tick = 0
const seed = () =>
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => ({
    day,
    visits: 200 + Math.round(Math.random() * 800),
  }))

const source = monoArraySource(seed(), { pageSize: 0 })
const chart = controlMonoChart(source, {
  type: 'line',
  labelField: 'day',
  series: [{ field: 'visits', label: 'Visits' }],
})

const updates = ref(0)
const off = chart.subscribe(() => {
  updates.value++
})

function randomise() {
  tick++
  void source.setData(seed())
}

function addDay() {
  const next = [...source.data(), { day: `D${++tick}`, visits: 200 + Math.round(Math.random() * 800) }]
  void source.setData(next)
}

let timer = null
const live = ref(false)
function toggleLive() {
  live.value = !live.value
  if (live.value) timer = setInterval(randomise, 1200)
  else {
    clearInterval(timer)
    timer = null
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  off()
  chart.dispose()
})
</script>

<template>
  <div style="width: 100%">
    <div class="example-bar">
      <mono-button size="sm" color="primary" @click="randomise">Randomise</mono-button>
      <mono-button size="sm" variant="tonal" @click="addDay">Add point</mono-button>
      <mono-button size="sm" :variant="live ? 'outline' : 'tonal'" @click="toggleLive">
        {{ live ? 'Stop' : 'Start' }} live
      </mono-button>
      <span class="example-note">{{ updates }} controller notifications</span>
    </div>
    <mono-chart-line :control-chart.prop="chart" height="300" :legend="false" />
  </div>
</template>

<style scoped>
.example-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}
.example-note {
  font-size: var(--mono-text-xs);
  color: var(--muted-foreground);
  margin-left: auto;
}
</style>
