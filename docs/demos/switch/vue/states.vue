<script setup>
    import '@mono-lit/helper/ui/switch'
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <mono-switch label="Default off" :model-value="false"></mono-switch>
        <mono-switch label="Default on" :model-value="true"></mono-switch>
        <mono-switch label="Disabled, off" disabled></mono-switch>
        <mono-switch label="Disabled, on" :model-value="true" disabled></mono-switch>
        <mono-switch label="Loading" :model-value="true" loading></mono-switch>
    </div>
</template>
