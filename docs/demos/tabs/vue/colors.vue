<script setup>
    import '@mono-lit/helper/ui/tabs'
    import { ref } from 'vue'

    // Pick a colour and every variant takes it: underline paints the bar,
    // pill the lifted tab's ink, ghost the selected tab's tint.
    const color = ref('primary')

    const items = [
        { id: 'a', label: 'Overview' },
        { id: 'b', label: 'Details' },
        { id: 'c', label: 'History' },
    ]
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 1.5rem;">
            <mono-tabs variant="underline" :color="color" :items.prop="items" model-value="a"></mono-tabs>
            <mono-tabs variant="pill" :color="color" :items.prop="items" model-value="a"></mono-tabs>
            <mono-tabs variant="ghost" :color="color" :items.prop="items" model-value="a"></mono-tabs>
        </div>
    </div>
</template>
