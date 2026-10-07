<script setup>
import '@mono-lit/helper/ui/rich-text-editor'

const text = '<p>Some <em>content</em> to look at.</p>'
</script>

<template>
  <div class="example-stack">
    <mono-rich-text-editor label="Disabled" disabled toolbar="basic" :model-value="text" min-height="5rem" />
    <mono-rich-text-editor label="Readonly" readonly toolbar="basic" :model-value="text" min-height="5rem" />
    <mono-rich-text-editor
      label="Invalid"
      error-message="Please rewrite this section"
      toolbar="basic"
      :model-value="text"
      min-height="5rem"
    />
    <mono-rich-text-editor label="Valid" success-message="Looks good" toolbar="basic" :model-value="text" min-height="5rem" />
    <mono-rich-text-editor
      label="With a character cap"
      :max-length="120"
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
