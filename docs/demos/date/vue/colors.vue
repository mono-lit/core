<script setup>
import '@mono-lit/helper/ui/date'
import { ref } from 'vue'

// Pick a colour and every variant re-paints with it: outlined = coloured border,
// filled = coloured tint, underlined = coloured underline. The colour is the
// FOCUS colour (and the calendar's selected-day accent), so focus a field to see it.
const color = ref('primary')
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="form" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <mono-date variant="outlined" :color="color" label="Outlined" placeholder="Outlined"></mono-date>
      <mono-date variant="filled" :color="color" label="Filled" placeholder="Filled"></mono-date>
      <mono-date variant="underlined" :color="color" label="Underlined" placeholder="Underlined"></mono-date>
    </div>
  </div>
</template>
