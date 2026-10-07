<script setup lang="ts">
// Demo chrome — NOT a mono component. The one-line readout a demo prints under
// its subject (`selected = "md"`, `Last picked: Tea`). Used to be an inline
// `color: #475569` monospace div — invisible on a dark stage. Muted ink on the
// page tokens, the mono face; `strong` reads in the page ink.
//
//   <DemoReadout>selected = "{{ size }}"</DemoReadout>
defineProps<{
  /** Stack under the subject with a small gap (default true). */
  inline?: boolean
}>()
</script>

<template>
  <div class="demo-readout" :class="{ 'demo-readout--inline': inline }">
    <slot />
  </div>
</template>

<style scoped>
.demo-readout {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--muted-foreground);
  overflow-wrap: anywhere;
}
.demo-readout--inline {
  display: inline;
}
.demo-readout :deep(strong),
.demo-readout :deep(b) {
  color: var(--foreground);
  font-weight: 600;
}
.demo-readout :deep(code) {
  font: inherit;
  color: var(--foreground);
}
</style>
