<script setup>
import '@mono-lit/helper/ui/tag-input'
import { computed, ref } from 'vue'

const tags = ['alpha', 'beta']

// Every key maps 1:1 to a mono-chip prop. Leave one out and it follows the
// control: `color` tracks the field color, `variant` tracks the field variant.
const size = ref('md')
const shape = ref('rounded')
const color = ref('')
const dot = ref(true)

const chip = computed(() => ({
  size: size.value,
  shape: shape.value,
  dot: dot.value,
  ...(color.value ? { color: color.value } : {}),
}))
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="size" label="Size" :options="['xs', 'sm', 'md', 'lg', 'xl', 'xxl']" />
      <DemoSelect v-model="shape" label="Shape" :options="['pill', 'rounded', 'square']" />
      <DemoSelect v-model="color" label="Chip color" colors="chip" empty="follow field" />
      <DemoCheck v-model="dot" label="Dot" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <mono-tag-input
        color="success"
        label="Chips follow the field"
        placeholder="Add tag"
        :model-value.prop="tags"
        :chip.prop="chip"
      ></mono-tag-input>

      <mono-tag-input
        color="success"
        variant="filled"
        label="…and the field variant"
        placeholder="Add tag"
        :model-value.prop="tags"
        :chip.prop="chip"
      ></mono-tag-input>
    </div>
  </div>
</template>
