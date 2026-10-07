<script setup>
import '@mono-lit/helper/ui/date'
import { ref } from 'vue'

const value = ref('')
</script>

<template>
  <!-- Focus color, border and calendar accent set on the wrapper cascade into
       the date picker inside (custom properties inherit — and pierce the shadow
       boundary; date-core copies the accent onto the popup calendar). -->
  <div style="box-sizing: border-box; width: 100%; --mono-date-primary: #7c3aed; --mono-date-primary-rgb: 124, 58, 237; --mono-date-border: #e9d5ff;">
    <mono-date
      label="Date"
      placeholder="Select a date — themed"
      :model-value="value"
      @change="value = $event.detail.modelValue"
    />
    <p style="font-size: 0.8rem; color: var(--theme-text); opacity: 0.7; margin: 0.6rem 0 0;">
      Field focus, border and the popup calendar accent all come from
      <code>--mono-date-*</code>.
    </p>
  </div>
</template>
