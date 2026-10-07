<script setup>
import '@mono-lit/helper/ui/button'
</script>

<template>
  <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
    <!-- Re-tint the primary fill (and its 80% hover) via the palette knob. -->
    <mono-button style="--mono-button-primary: #7c3aed;">
      Branded primary
    </mono-button>

    <!-- Override the resolved background + shadow directly. -->
    <mono-button style="--mono-button-bg: #0d9488; --mono-button-shadow: 0 3px 12px rgba(13, 148, 136, 0.35);">
      Custom solid
    </mono-button>
  </div>
</template>
