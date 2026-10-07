<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
import { ref } from 'vue'

// Pick a colour and every variant re-paints with it: the focus ring, the active
// toolbar state and links inside the content take the colour.
const color = ref('primary')
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="form" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <mono-rich-text-editor
        v-for="variant in ['outlined', 'filled', 'underlined']"
        :key="variant"
        :variant="variant"
        :color="color"
        :label="`variant=&quot;${variant}&quot;`"
        toolbar="basic"
        min-height="5rem"
      />
    </div>
  </div>
</template>
