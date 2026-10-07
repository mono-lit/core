<script setup>
import '@mono-lit/helper/ui/accordion'
</script>

<template>
    <div style="display: grid; gap: 0.55rem; width: 100%;">
        <mono-accordion size="xs" title="Extra small accordion" :model-value="true">
            Extra small — the tightest padding and type.
        </mono-accordion>
        <mono-accordion size="sm" title="Small accordion" :model-value="true">
            Small — compact padding and type.
        </mono-accordion>
        <mono-accordion size="md" title="Medium accordion" :model-value="true">
            Medium (the default) — standard padding and type.
        </mono-accordion>
        <mono-accordion size="lg" title="Large accordion" :model-value="true">
            Large — roomier padding, larger type.
        </mono-accordion>
        <mono-accordion size="xl" title="Extra large accordion" :model-value="true">
            Extra large — roomier still.
        </mono-accordion>
        <mono-accordion size="xxl" title="2X large accordion" :model-value="true">
            2X large — the roomiest step.
        </mono-accordion>
    </div>
</template>
