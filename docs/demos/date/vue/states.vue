<script setup>
import '@mono-lit/helper/ui/date'
</script>

<template>
  <div style="display: grid; gap: 1rem; width: 100%; ">
    <mono-date
      label="Disabled"
      placeholder="Cannot open"
      model-value="2026-07-20"
      disabled
    ></mono-date>
    <mono-date
      label="Readonly"
      placeholder="Display only"
      model-value="2026-07-20"
      readonly
    ></mono-date>
    <mono-date
      label="Required"
      placeholder="Pick a date"
      helper-text="The asterisk indicates a required field."
      required
    ></mono-date>
  </div>
</template>
