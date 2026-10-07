<script setup>
import '@mono-lit/helper/ui/drawer'
import '@mono-lit/helper/ui/button'
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <div>
    <mono-button color="purple" @click="open = true">Open themed drawer</mono-button>

    <!-- Inline --mono-drawer-* are forwarded to the body portal, so per-instance
         theming works even though the panel renders outside this subtree. -->
    <mono-drawer
      position="right"
      title="Themed drawer"
      :model-value="open"
      @toggle="open = $event.detail.modelValue"
      style="
        --mono-drawer-accent: #7c3aed;
        --mono-drawer-width: 360px;
        --mono-drawer-title-color: #7c3aed;
        --mono-drawer-header-bg: color-mix(in oklab, #7c3aed 8%, var(--popover));
        --mono-drawer-header-border: color-mix(in oklab, #7c3aed 25%, transparent);
        --mono-drawer-header-border-width: 1px;
      "
    >
      <p style="margin: 0;">The port leaves the header bar OFF; the three <code>--mono-drawer-header-*</code>
            knobs bring it back, and the accent and the measure are vars too.</p>
    </mono-drawer>
  </div>
</template>
