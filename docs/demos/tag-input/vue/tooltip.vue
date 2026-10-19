<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref } from 'vue'

const tags = ref(['vue'])

const items = [
  { label: 'Vue', value: 'vue' },
  { label: 'Lit', value: 'lit' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte' },
]
</script>

<template>
  <div style="width: 100%; display: grid; gap: 1rem;">
    <mono-tag-input
      label="Skills"
      placeholder="Add a skill and press Enter"
      helper-text="Up to five."
      tooltip="Skills help match you to projects. List the ones you would be comfortable leading, not just using."
      :model-value.prop="tags"
      :items.prop="items"
      key-value="value"
      display-value="label"
      @change="tags = $event.detail.modelValue"
    ></mono-tag-input>

    <mono-tag-input
      label="Certifications"
      readonly
      :model-value.prop="['lit']"
      :items.prop="items"
      key-value="value"
      display-value="label"
      :tooltip.prop="{ content: 'Synced from the training portal.', placement: 'right', color: 'info' }"
    ></mono-tag-input>
  </div>
</template>
