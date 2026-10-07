<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
</script>

<template>
  <div style="width: 100%;">
    <DemoControls>
      <DemoSelect v-model="color" label="Color" colors="form" />
    </DemoControls>

    <div style="display: grid; gap: 1rem;">
      <div mono-input :mono-color="color === 'primary' ? null : color">
        <label mono-label>Outlined</label>
        <div mono-field>
          <input mono-native type="text" placeholder="Focus me to see the color" />
        </div>
      </div>
      <div mono-input mono-variant="filled" :mono-color="color === 'primary' ? null : color">
        <label mono-label>Filled</label>
        <div mono-field>
          <input mono-native type="text" placeholder="Focus me to see the color" />
        </div>
      </div>
      <div mono-input mono-variant="underlined" :mono-color="color === 'primary' ? null : color">
        <label mono-label>Underlined</label>
        <div mono-field>
          <input mono-native type="text" placeholder="Focus me to see the color" />
        </div>
      </div>
    </div>
  </div>
</template>
