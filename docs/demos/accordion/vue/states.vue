<script setup>
import '@mono-lit/helper/ui/accordion'
</script>

<template>
    <div style="display: grid; gap: 0.55rem; width: 100%;">
        <mono-accordion title="Default closed">Click the head to expand.</mono-accordion>
        <mono-accordion title="Default open" :model-value="true">Already expanded on first render.</mono-accordion>
        <mono-accordion title="Disabled, closed" disabled>Cannot toggle.</mono-accordion>
        <mono-accordion title="Disabled, open" :model-value="true" disabled>Frozen in the open state.</mono-accordion>
    </div>
</template>
