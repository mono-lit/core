<script setup>
import '@mono-lit/helper/ui/button'
import { ref } from 'vue'

// Pick a color to see how it combines with each variant: solid = filled with the
// color, outline = colored border + text, tonal = soft tint of the same color,
// text = no background or border until you hover or tab to it, at which point it
// takes tonal's look.
const color = ref('primary')

</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect
        v-model="color"
        label="Color"
        data-color-picker
        colors="button"
      />
    </DemoControls>

    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;">
      <mono-button variant="solid" :color="color">Solid</mono-button>
      <mono-button variant="outline" :color="color">Outline</mono-button>
      <mono-button variant="tonal" :color="color">Tonal</mono-button>
      <mono-button variant="text" :color="color">Text</mono-button>
    </div>
  </div>
</template>
