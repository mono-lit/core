<script setup lang="ts">
// Demo chrome — NOT a mono component. The event log an "event-log" demo prints
// under its subject. Every demo used to inline the same `<div style="… background:
// #f0f0f0 …">`, which stayed light in dark mode. One surface on the page tokens:
// bg-muted, the page ink, the mono face, the flavour's corner; the empty state muted.
//
//   <DemoLog :lines="logLines" />                       newest first, one per line
//   <DemoLog :text="logText" max-height="160px" />      an already-joined string
//   <DemoLog>{{ logText }}</DemoLog>                    or slotted
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    lines?: string[]
    text?: string
    empty?: string
    maxHeight?: string
    /** A small caption above the log ("Events", "Output"…). */
    title?: string
  }>(),
  { empty: 'No events yet...', maxHeight: '140px' },
)

const body = computed(() => (props.lines ? props.lines.join('\n') : props.text ?? ''))
const isEmpty = computed(() => (props.lines ? props.lines.length === 0 : (props.text ?? '') === '' || props.text === props.empty))
</script>

<template>
  <div class="demo-log" :class="{ 'demo-log--empty': isEmpty }">
    <div v-if="title" class="demo-log__title">{{ title }}</div>
    <div class="demo-log__body" :style="{ maxHeight }">
      <slot>{{ isEmpty ? empty : body }}</slot>
    </div>
  </div>
</template>

<style scoped>
.demo-log {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--border);
  border-radius: var(--mono-radius-md);
  background: var(--muted);
  color: var(--foreground);
}
.demo-log__title {
  padding: 0.45rem 0.85rem 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.demo-log__body {
  padding: 0.75rem 0.85rem;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.5;
}
.demo-log--empty .demo-log__body {
  color: var(--muted-foreground);
}
</style>
