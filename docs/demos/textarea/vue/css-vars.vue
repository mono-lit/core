<script setup>
import '@mono-lit/helper/ui/textarea'
import { ref } from 'vue'

const value = ref('Focus me to see the custom accent.')
</script>

<template>
  <!-- Accent + border set on the wrapper cascade into the textarea inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="box-sizing: border-box; width: 100%; --mono-textarea-focus-color: #7c3aed; --mono-textarea-border-color: #e9d5ff;">
    <mono-textarea
      label="Bio"
      placeholder="Tell us a bit about yourself"
      helper-text="Focus color + border themed via --mono-textarea-*."
      :model-value="value"
      @input="value = $event.detail.modelValue"
    ></mono-textarea>
  </div>
</template>
