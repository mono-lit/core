<script setup>
import '@mono-lit/helper/ui/radio'
import { ref } from 'vue'

const selected = ref('a')
</script>

<template>
  <!-- A brand accent set on the wrapper cascades into every radio inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="display: grid; gap: 0.6rem; --mono-radio-accent: #7c3aed;">
    <mono-radio
      label="Accent from the wrapper"
      value="a"
      :model-value="selected"
      @change="selected = $event.detail.modelValue"
    ></mono-radio>
    <!-- Inline vars on one element override the wrapper. -->
    <mono-radio
      label="Same group, inline teal"
      value="b"
      :model-value="selected"
      @change="selected = $event.detail.modelValue"
      style="--mono-radio-accent: #0d9488;"
    ></mono-radio>
  </div>
</template>
