<script setup>
import '@mono-lit/helper/ui/card'
import { ref } from 'vue'

// Pick a colour and every variant takes it: the ring and the title paint in the
// role, `tonal` tints its whole surface with it. `neutral` is the default and
// leaves the card unpainted.
const color = ref('neutral')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="card" />
        </DemoControls>

        <div style="display: grid; gap: 1rem;">
            <mono-card variant="elevated" :color="color">
                <h3 slot="title">Elevated</h3>
                <p>Default card with shadow.</p>
            </mono-card>
            <mono-card variant="outlined" :color="color">
                <h3 slot="title">Outlined</h3>
                <p>Card with stronger border and no shadow.</p>
            </mono-card>
            <mono-card variant="flat" :color="color">
                <h3 slot="title">Flat</h3>
                <p>Card without elevation.</p>
            </mono-card>
            <mono-card variant="tonal" :color="color">
                <h3 slot="title">Tonal</h3>
                <p>Card with soft background tint.</p>
            </mono-card>
            <mono-card variant="glass" :color="color">
                <h3 slot="title">Glass</h3>
                <p>Translucent, blurred pane.</p>
            </mono-card>
        </div>
    </div>
</template>
