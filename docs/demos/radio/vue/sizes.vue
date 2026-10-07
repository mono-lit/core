<script setup>
import '@mono-lit/helper/ui/radio'
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <mono-radio size="xs" label="Extra small" value="xs" model-value="xs"></mono-radio>
        <mono-radio size="sm" label="Small" value="sm" model-value="sm"></mono-radio>
        <mono-radio size="md" label="Medium" value="md" model-value="md"></mono-radio>
        <mono-radio size="lg" label="Large" value="lg" model-value="lg"></mono-radio>
        <mono-radio size="xl" label="Extra large" value="xl" model-value="xl"></mono-radio>
        <mono-radio size="xxl" label="2X large" value="xxl" model-value="xxl"></mono-radio>
    </div>
</template>
