<script setup>
import '@mono-lit/helper/ui/switch'
import { ref } from 'vue'

const a = ref(true)
const b = ref(true)
</script>

<template>
  <!-- A brand accent set on the wrapper cascades into every switch inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="display: grid; gap: 0.85rem; --mono-switch-accent: #7c3aed; --mono-switch-gap: 0.9rem;">
    <mono-switch
      label="Accent from the wrapper"
      sublabel="Set --mono-switch-accent once; every switch inside inherits it."
      :model-value.prop="a"
      @change="a = $event.detail.modelValue"
    ></mono-switch>

    <!-- Inline vars on one element override the wrapper. -->
    <mono-switch
      label="Inline override (teal)"
      :model-value.prop="b"
      @change="b = $event.detail.modelValue"
      style="--mono-switch-accent: #0d9488;"
    ></mono-switch>
  </div>
</template>
