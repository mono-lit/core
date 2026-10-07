<script setup>
import '@mono-lit/helper/ui/rich-text-editor'

const text =
  '<p>Click into this editor — the toolbar appears with the focus (inline) or floats over a selection (balloon).</p>'
</script>

<template>
  <div class="example-stack">
    <mono-rich-text-editor label='mode="inline"' mode="inline" toolbar="basic" :model-value="text" min-height="5rem" />
    <mono-rich-text-editor label='mode="balloon"' mode="balloon" toolbar="basic" :model-value="text" min-height="5rem" />
    <mono-rich-text-editor
      label='mode="classic:bottom"'
      mode="classic:bottom"
      toolbar="basic"
      :model-value="text"
      min-height="5rem"
    />
  </div>
</template>

<style scoped>
.example-stack {
  display: grid;
  gap: 1rem;
  width: 100%;
}
</style>
