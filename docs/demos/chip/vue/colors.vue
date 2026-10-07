<script setup>
import '@mono-lit/helper/ui/chip'
import { ref } from 'vue'

// Pick a colour and every variant re-paints with it: soft = tinted surface in
// the colour, solid = filled with it, outline = a bare border with coloured text.
const color = ref('primary')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="chip" />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;">
            <mono-chip variant="soft" :color="color">Soft</mono-chip>
            <mono-chip variant="solid" :color="color">Solid</mono-chip>
            <mono-chip variant="outline" :color="color">Outline</mono-chip>
        </div>
    </div>
</template>
