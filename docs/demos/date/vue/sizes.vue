<script setup>
import '@mono-lit/helper/ui/date'
</script>

<template>
  <div style="display: grid; gap: 1rem; width: 100%;">
    <mono-date size="xs" label="Extra small" placeholder="Extra small date"></mono-date>
    <mono-date size="sm" label="Small" placeholder="Small date"></mono-date>
    <mono-date size="md" label="Medium" placeholder="Medium date"></mono-date>
    <mono-date size="lg" label="Large" placeholder="Large date"></mono-date>
    <mono-date size="xl" label="Extra large" placeholder="Extra large date"></mono-date>
    <mono-date size="xxl" label="2X large" placeholder="2X large date"></mono-date>
  </div>
</template>
