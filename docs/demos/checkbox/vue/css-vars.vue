<script setup>
import '@mono-lit/helper/ui/checkbox'
</script>

<template>
  <!-- Accent + radius set on the wrapper cascade into every checkbox inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="display: grid; gap: 0.75rem; --mono-checkbox-accent: #7c3aed; --mono-checkbox-radius: 0.6rem;">
    <mono-checkbox
      model-value="true"
      label="Accent + radius from the wrapper"
      sublabel="Set --mono-checkbox-* once; every checkbox inside inherits it."
    />
    <!-- Inline vars on one element override the wrapper. -->
    <mono-checkbox
      model-value="true"
      label="Inline override (teal)"
      style="--mono-checkbox-accent: #0d9488;"
    />
  </div>
</template>
