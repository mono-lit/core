<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const o1 = ref(false)
    const o2 = ref(false)
    const o3 = ref(false)
</script>

<template>
    <div>
        <mono-button color="primary" @click="o1 = true">Open modal</mono-button>

        <!-- Level 1 -->
        <mono-modal
            stackable
            title="Level 1"
            color="primary"
            :model-value="o1"
            @close="o1 = false"
        >
            <p style="margin: 0 0 1rem;">
                This is the first modal. Open another one on top of it — each has
                <code>stackable</code>, so they stack and Escape / overlay-click only affect
                the topmost.
            </p>
            <mono-button color="primary" variant="tonal" size="sm" @click="o2 = true">Open modal inside ↑</mono-button>
        </mono-modal>

        <!-- Level 2 -->
        <mono-modal
            stackable
            title="Level 2"
            color="success"
            :model-value="o2"
            @close="o2 = false"
        >
            <p style="margin: 0 0 1rem;">
                Second modal, sitting above the first. Notice only one backdrop dims the
                screen — the layers don't compound.
            </p>
            <mono-button color="success" variant="tonal" size="sm" @click="o3 = true">Go deeper ↑</mono-button>
        </mono-modal>

        <!-- Level 3 -->
        <mono-modal
            stackable
            title="Level 3"
            color="danger"
            :model-value="o3"
            @close="o3 = false"
        >
            <p style="margin: 0;">
                Third level. Press <kbd>Esc</kbd> to close this one only — the modals
                beneath stay open.
            </p>
        </mono-modal>
    </div>
</template>
