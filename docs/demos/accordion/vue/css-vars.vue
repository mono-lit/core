<script setup>
import '@mono-lit/helper/ui/accordion'
import { ref } from 'vue'

const open = ref(true)
</script>

<template>
  <!-- Accent, radius and padding set on the wrapper cascade into the accordion
       inside (custom properties inherit — and pierce the shadow boundary). -->
  <div style="width: 100%; --mono-accordion-accent: #7c3aed; --mono-accordion-radius: 14px; --mono-accordion-pad-x: 1.25rem;">
    <mono-accordion
      title="Themed via CSS variables"
      :model-value="open"
      @toggle="open = $event.detail.modelValue"
    >
      Accent, radius and padding all come from <code>--mono-accordion-*</code> set on the wrapper.
    </mono-accordion>
  </div>
</template>
