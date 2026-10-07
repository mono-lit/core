<script setup>
import '@mono-lit/helper/ui/textarea'
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
      <mono-textarea variant="outlined" :color="color" label="Outlined" placeholder="Outlined variant"></mono-textarea>
      <mono-textarea variant="filled" :color="color" label="Filled" placeholder="Filled variant"></mono-textarea>
      <mono-textarea variant="underlined" :color="color" label="Underlined" placeholder="Underlined variant"></mono-textarea>
    </div>
  </div>
</template>
