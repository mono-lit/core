<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const items = ref([
  { label: 'Vue', value: 'vue', description: 'Vue framework' },
  { label: 'Lit', value: 'lit', description: 'Lit web components' },
  { label: 'React', value: 'react' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
])
const tags = ref(['vue', 'lit'])

// Pick a colour and every variant re-paints with it: outlined = coloured border,
// filled = coloured tint, underlined = coloured underline. The colour is the
// FOCUS colour, so focus a field to see it — the chips stay muted (see `chip.color`).
const color = ref('primary')
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="form" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <mono-tag-input variant="outlined" :color="color" label="Outlined" placeholder="Add tag" :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags"></mono-tag-input>
      <mono-tag-input variant="filled" :color="color" label="Filled" placeholder="Add tag" :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags"></mono-tag-input>
      <mono-tag-input variant="underlined" :color="color" label="Underlined" placeholder="Add tag" :items.prop="items" key-value="value" display-value="label" :model-value.prop="tags"></mono-tag-input>
    </div>
  </div>
</template>
