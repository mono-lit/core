<script setup>
    import '@mono-lit/helper/ui/switch'
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <mono-switch size="xs" label="Extra small" :model-value="true"></mono-switch>
        <mono-switch size="sm" label="Small" :model-value="true"></mono-switch>
        <mono-switch size="md" label="Medium" :model-value="true"></mono-switch>
        <mono-switch size="lg" label="Large" :model-value="true"></mono-switch>
        <mono-switch size="xl" label="Extra large" :model-value="true"></mono-switch>
        <mono-switch size="xxl" label="2X large" :model-value="true"></mono-switch>
    </div>
</template>
