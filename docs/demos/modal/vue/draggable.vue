<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const o1 = ref(false)
    const o2 = ref(false)
</script>

<template>
    <div>
        <mono-button color="primary" @click="o1 = true">Open draggable modal</mono-button>

        <mono-modal
            draggable
            stackable
            title="Drag me by the header"
            color="primary"
            :model-value="o1"
            @close="o1 = false"
        >
            <p style="margin: 0 0 1rem;">
                Grab the header and drag this modal anywhere. Drag it mostly off-screen and
                release — it snaps back inside the viewport. Open another draggable modal and
                slide it aside to see this one behind it.
            </p>
            <mono-button color="primary" variant="tonal" size="sm" @click="o2 = true">Open another ↑</mono-button>
        </mono-modal>

        <mono-modal
            draggable
            stackable
            title="Second modal"
            color="success"
            :model-value="o2"
            @close="o2 = false"
        >
            <p style="margin: 0;">
                Drag me aside by my header — the first modal is revealed behind. The ✕ button
                and <kbd>Esc</kbd> still work while dragging is enabled.
            </p>
        </mono-modal>
    </div>
</template>
