<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
</script>

<template>
    <div>
        <mono-button color="primary" @click="open = true">Open modal</mono-button>

        <mono-modal
            title="Modal title"
            subtitle="A short description under the title."
            :model-value="open"
            @close="open = false"
        >
            <p style="margin: 0 0 0.6rem; font-weight: 600;">
                A centered dialog rendered through a body portal.
            </p>
            <p style="margin: 0; opacity: 0.8;">
                Click the close button, the dimmed overlay, or press Escape to dismiss.
            </p>
        </mono-modal>
    </div>
</template>
