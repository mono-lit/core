<script setup>
import '@mono-lit/helper/ui/modal'
import '@mono-lit/helper/ui/button'
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <div>
    <mono-button color="primary" @click="open = true">Open themed modal</mono-button>

    <!-- Inline --mono-modal-* are forwarded to the body portal, so per-instance
         theming works even though the dialog renders outside this subtree. -->
    <mono-modal
      title="Themed dialog"
      :model-value="open"
      @close="open = false"
      style="--mono-modal-accent: #7c3aed; --mono-modal-radius: 26px;"
    >
      <p style="margin: 0;">
        Accent, header tint and corner radius all come from <code>--mono-modal-*</code>.
      </p>
    </mono-modal>
  </div>
</template>
