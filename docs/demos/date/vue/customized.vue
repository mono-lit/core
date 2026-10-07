<script setup>
import '@mono-lit/helper/ui/date'
import { ref } from 'vue'

const value = ref('')

// Per-part class overrides via the cssClass prop (root/label/field/native/message).
const cssClass = {
  root: 'max-w-md',
  label: 'font-bold text-base',
  native: 'text-lg',
  message: 'italic',
}
</script>

<template>
  <div style="width: 100%">
    <mono-date
      label="Customized via cssClass"
      placeholder="Wider, bolder, italic message"
      helper-text="Width, label weight, input font size and message style are overridden via cssClass."
      clearable
      :css-class.prop="cssClass"
      :model-value="value"
      @change="value = $event.detail.modelValue"
    ></mono-date>
  </div>
</template>
