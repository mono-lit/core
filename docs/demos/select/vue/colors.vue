<script setup>
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

const items = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
]

// Pick a colour and every variant re-paints with it: outlined = coloured border,
// filled = coloured tint, underlined = coloured underline. The colour is the
// FOCUS colour, so focus a field to see it.
const color = ref('primary')
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="form" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <mono-select variant="outlined" :color="color" label="Outlined" placeholder="Outlined" :items.prop="items" key-value="value" display-value="label"></mono-select>
      <mono-select variant="filled" :color="color" label="Filled" placeholder="Filled" :items.prop="items" key-value="value" display-value="label"></mono-select>
      <mono-select variant="underlined" :color="color" label="Underlined" placeholder="Underlined" :items.prop="items" key-value="value" display-value="label"></mono-select>
    </div>
  </div>
</template>
