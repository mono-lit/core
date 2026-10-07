<script setup lang="ts">
// Demo chrome — NOT a mono component. The row of pickers a demo puts above its
// subject ("Size / Shape / Chip color / Dot"). Every demo used to hand-roll this
// as a `.mono-picker` / `.example-picker` block with its own colours, half of them
// hard-coded to light values that went invisible in dark mode. One component, on
// the page tokens, so every demo's controls read in both modes and every flavour.
//
// Children are <DemoSelect> / <DemoCheck> (or any inline control); a trailing
// <span> reads as a hint (muted).
defineProps<{
  /** Extra bottom gap before the demo subject (default 0.9rem). */
  gap?: string
}>()
</script>

<template>
  <div class="demo-controls" :style="gap ? { marginBottom: gap } : undefined">
    <slot />
  </div>
</template>

<style scoped>
.demo-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem 0.9rem;
  margin-bottom: 0.9rem;
  font-size: 0.8rem;
  line-height: 1.25;
  color: var(--foreground);
}
/* a loose <span> in the row is a hint */
.demo-controls > :deep(span:not([class])) {
  color: var(--muted-foreground);
}
</style>
