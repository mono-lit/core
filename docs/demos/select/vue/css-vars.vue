<script setup>
import '@mono-lit/helper/ui/select'
import { ref } from 'vue'

const selected = ref(null)
const items = ref([
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
])
</script>

<template>
  <!-- Focus color + border set on the wrapper cascade into the select inside
       (custom properties inherit — and pierce the shadow boundary). -->
  <div style="box-sizing: border-box; width: 100%; --mono-select-focus-color: #7c3aed; --mono-select-focus-rgb: 124, 58, 237; --mono-select-border: #e9d5ff;">
    <mono-select
      label="Favourite fruit"
      placeholder="Pick one"
      helper-text="Focus color + border themed via --mono-select-*."
      :items.prop="items"
      key-value="value"
      display-value="label"
      :model-value="selected"
      @change="selected = $event.detail.modelValue"
    ></mono-select>
  </div>
</template>
