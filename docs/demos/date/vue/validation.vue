<script setup>
import '@mono-lit/helper/ui/date'
</script>

<template>
  <!-- mono-date's validation states are `error` and `success` (there is no
       warning/invalid). Set via validation-state or the error/success booleans. -->
  <div style="display: grid; gap: 1rem; width: 100%;">
    <mono-date
      label="Error"
      placeholder="Pick a date"
      validation-state="error"
      validation-message="A date is required."
    ></mono-date>
    <mono-date
      label="Success"
      model-value="2026-07-20"
      validation-state="success"
      validation-message="Date confirmed."
    ></mono-date>
  </div>
</template>
