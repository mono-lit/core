<script setup>
import '@mono-lit/helper/ui/input'
import { ref } from 'vue'

const value = ref('')
</script>

<template>
  <!-- Focus color + border set on the wrapper cascade into the input inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="width: 100%; --mono-input-focus-color: #7c3aed; --mono-input-focus-rgb: 124, 58, 237; --mono-input-border-color: #e9d5ff;">
    <mono-input
      label="Full name"
      placeholder="Focus me to see the accent"
      helper-text="Focus color + border themed via --mono-input-*."
      :model-value="value"
      @input="value = $event.detail.modelValue"
    ></mono-input>
  </div>
</template>
