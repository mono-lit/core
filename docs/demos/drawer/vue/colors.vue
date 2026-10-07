<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    // Pick a colour, then open the drawer: the button and the drawer head both
    // take it live, so re-pick while the drawer is open to watch it change.
    const color = ref('primary')
    const open = ref(false)

    function onToggle(event) {
        if (!event.detail.modelValue) open.value = false
    }
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <mono-button :color="color" size="sm" @click="open = true">Open drawer</mono-button>
        </div>

        <mono-drawer
            position="right"
            size="md"
            :color="color"
            :title="`Color — ${color}`"
            :model-value="open"
            @toggle="onToggle"
        >
            <p style="margin: 0;">
                The edge, the glow under the panel, the resizer and the close-button hover take the {{ color }} accent.
            </p>
        </mono-drawer>
    </div>
</template>
