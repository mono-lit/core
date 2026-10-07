<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const tags = ref(['vue', 'lit'])
const items = ref([
  { label: 'Vue', value: 'vue' },
  { label: 'Lit', value: 'lit' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte' },
])
</script>

<template>
  <!-- Focus color + border set on the wrapper cascade into the tag input inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="box-sizing: border-box; width: 100%; --mono-tag-input-focus-color: #7c3aed; --mono-tag-input-focus-rgb: 124, 58, 237; --mono-tag-input-border: #e9d5ff;">
    <mono-tag-input
      label="Skills"
      placeholder="Add a skill and press Enter"
      helper-text="Focus color + border themed via --mono-tag-input-*."
      :model-value.prop="tags"
      :items.prop="items"
      key-value="value"
      display-value="label"
      @change="tags = $event.detail.modelValue"
    ></mono-tag-input>
  </div>
</template>
