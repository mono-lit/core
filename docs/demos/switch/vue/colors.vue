<script setup>
    import '@mono-lit/helper/ui/switch'
    import { ref } from 'vue'

    // Pick a colour and every state re-paints with it: the on-track takes the
    // colour; the disabled switch shows it dimmed.
    const color = ref('primary')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 0.5rem;">
            <mono-switch :color="color" label="Off"></mono-switch>
            <mono-switch :color="color" label="On" :model-value="true"></mono-switch>
            <mono-switch :color="color" label="Disabled, on" :model-value="true" disabled></mono-switch>
        </div>
    </div>
</template>
