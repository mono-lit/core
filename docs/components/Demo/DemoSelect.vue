<script setup lang="ts">
// Demo chrome — NOT a mono component. A labelled NATIVE <select> painted like
// Basecoat's `select.select` (bg-background, border-input, rounded-md, shadow-xs,
// h-8 text-sm, a currentColor chevron) so it reads in dark mode and takes each
// flavour's corner. Deliberately native: the demos that use it are often the
// demos OF <mono-select>, and the picker must not be the thing under test.
//
//   <DemoSelect v-model="size" label="Size" :options="['xs', 'sm', 'md']" />
//   <DemoSelect v-model="color" label="Chip color" :options="[{ value: '', label: 'follow field' }, 'primary']" />
//   <DemoSelect v-model.number="count" label="buttons" :options="[1, 2, 3]" number />
//   <DemoSelect v-model="color" label="Color" colors="button" />            every ButtonColor
//   <DemoSelect v-model="color" label="Chip color" colors="chip" empty="follow field" />
//
// `colors` fills the options with a component's FULL colour set (Demo/palette.ts),
// so a Color picker never shows a subset; `empty` prepends a '' entry with that label.
// Attributes (`data-*-picker`, `id`, `disabled`…) fall through to the <select>.
import { computed, useAttrs } from 'vue'
import { PALETTE, type PaletteName } from './palette'

defineOptions({ inheritAttrs: false })

type Option = string | number | { value: string | number; label?: string; disabled?: boolean }

const props = defineProps<{
  modelValue?: string | number | null
  label?: string
  options?: Option[]
  /** A component's full colour list instead of `options`. */
  colors?: PaletteName
  /** Prepend an empty-value entry with this label ("follow field", "default"). */
  empty?: string
  /** Coerce the picked value to a number (like `v-model.number`). */
  number?: boolean
  /** Label after the control instead of before it. */
  after?: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string | number): void }>()
const attrs = useAttrs()

const items = computed(() => {
  const source: Option[] = props.colors ? [...PALETTE[props.colors]] : props.options ?? []
  const list = source.map((o) =>
    typeof o === 'object' ? { value: o.value, label: o.label ?? String(o.value), disabled: !!o.disabled } : { value: o, label: String(o), disabled: false },
  )
  return props.empty !== undefined ? [{ value: '', label: props.empty, disabled: false }, ...list] : list
})

function onChange(event: Event) {
  const raw = (event.target as HTMLSelectElement).value
  const picked = items.value.find((i) => String(i.value) === raw)
  const value = picked ? picked.value : raw
  emit('update:modelValue', props.number && typeof value === 'string' && value !== '' ? Number(value) : value)
}
</script>

<template>
  <label class="demo-select" :class="{ 'demo-select--after': after }">
    <span v-if="label" class="demo-select__label">{{ label }}</span>
    <span class="demo-select__box">
      <select v-bind="attrs" :value="modelValue == null ? '' : String(modelValue)" @change="onChange">
        <slot>
          <option v-for="item in items" :key="String(item.value)" :value="String(item.value)" :disabled="item.disabled">
            {{ item.label }}
          </option>
        </slot>
      </select>
      <svg class="demo-select__caret" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </label>
</template>

<style scoped>
.demo-select {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--foreground);
  font-size: inherit;
  cursor: pointer;
}
.demo-select--after {
  flex-direction: row-reverse;
}
.demo-select__label {
  white-space: nowrap;
}
.demo-select__box {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.demo-select select {
  appearance: none;
  min-width: 0;
  height: 2rem;
  padding: 0 1.75rem 0 0.65rem;
  border: 1px solid var(--input);
  border-radius: var(--mono-radius-md);
  background: var(--background);
  color: var(--foreground);
  font: inherit;
  font-size: 0.8rem;
  line-height: 1;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.demo-select select:hover {
  border-color: color-mix(in oklab, var(--input) 60%, var(--foreground));
}
.demo-select select:focus-visible {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent);
}
.demo-select select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* the list itself: the browser paints it from color-scheme, which the stage sets */
.demo-select option {
  background: Canvas;
  color: CanvasText;
}
.demo-select__caret {
  position: absolute;
  right: 0.5rem;
  width: 0.9rem;
  height: 0.9rem;
  pointer-events: none;
  color: var(--muted-foreground);
}
</style>
