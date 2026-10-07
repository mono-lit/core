<script setup>
import '@mono-lit/helper/ui/rich-text-editor'
</script>

<template>
  <div class="example-stack">
    <mono-rich-text-editor
      v-for="size in ['sm', 'md', 'lg']"
      :key="size"
      :size="size"
      :label="`size=&quot;${size}&quot;`"
      toolbar="basic"
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
