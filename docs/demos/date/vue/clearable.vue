<script setup>
import '@mono-lit/helper/ui/date'
import { ref } from 'vue'

const value = ref('2026-07-20')
</script>

<template>
  <div style="width: 100%;">
    <mono-date
      label="Clearable"
      placeholder="Pick a date"
      helper-text="The clear button appears when a value is selected."
      clearable
      :model-value="value"
      @change="value = $event.detail.modelValue"
    ></mono-date>
    <p style="font-size: 0.8rem; color: var(--theme-text); opacity: 0.7; margin: 0.6rem 0 0;">
      Value: <code>{{ value || '—' }}</code>
    </p>
  </div>
</template>
