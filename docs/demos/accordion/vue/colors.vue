<script setup>
import '@mono-lit/helper/ui/accordion'
import { ref } from 'vue'

// Pick a colour and both accordions re-paint with it: the accent on the active
// border, icon background and arrow. Open the closed one to see it take the colour.
const color = ref('primary')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 0.55rem;">
            <mono-accordion :color="color" title="Closed">Click the head to expand — the accent takes the picked colour.</mono-accordion>
            <mono-accordion :color="color" title="Open" :model-value="true">Accent on the active border, icon background and arrow.</mono-accordion>
        </div>
    </div>
</template>
