<script setup lang="ts">
// Demo chrome — NOT a mono component. A labelled NATIVE checkbox (Basecoat's
// `.input[type='checkbox']`: a 1rem rounded box on border-input / bg-background,
// filled with --primary when checked, a --primary-foreground check drawn by mask).
// Native on purpose: the checkbox demos need a picker that is not <mono-checkbox>.
//
//   <DemoCheck v-model="dot" label="Dot" />
//   <DemoCheck v-model="clearable" label="clearable" data-clearable-picker />
//
// Attributes fall through to the <input>.
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps<{
  modelValue?: boolean
  label?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
const attrs = useAttrs()
</script>

<template>
  <label class="demo-check">
    <input
      v-bind="attrs"
      type="checkbox"
      :checked="!!modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span v-if="label || $slots.default" class="demo-check__label"><slot>{{ label }}</slot></span>
  </label>
</template>

<style scoped>
.demo-check {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--foreground);
  font-size: inherit;
  cursor: pointer;
  user-select: none;
}
.demo-check input {
  appearance: none;
  position: relative;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  margin: 0;
  border: 1px solid var(--input);
  border-radius: calc(var(--mono-radius-md) * 0.6);
  background: var(--background);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
}
.demo-check input:checked {
  border-color: var(--primary);
  background: var(--primary);
}
.demo-check input:checked::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--primary-foreground);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center / 0.75rem no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center / 0.75rem no-repeat;
}
.demo-check input:focus-visible {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent);
}
.demo-check input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
