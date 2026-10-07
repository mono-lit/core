<script setup>
import '@mono-lit/helper/ui/input'
import { ref } from 'vue'

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
      <mono-input variant="outlined" :color="color" label="Outlined" placeholder="Focus me to see the color"></mono-input>
      <mono-input variant="filled" :color="color" label="Filled" placeholder="Focus me to see the color"></mono-input>
      <mono-input variant="underlined" :color="color" label="Underlined" placeholder="Focus me to see the color"></mono-input>
    </div>
  </div>
</template>
