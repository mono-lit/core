<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
</script>

<template>
    <div>
        <mono-button color="primary" @click="open = true">Open persistent modal</mono-button>

        <mono-modal
            persistent
            title="Read this carefully"
            :model-value="open"
            @close="open = false"
        >
            <p style="margin: 0 0 0.5rem; font-weight: 600;">
                Overlay-click and Escape are disabled.
            </p>
            <p style="margin: 0; opacity: 0.8;">
                Persistent modals require an explicit dismissal — the close button or
                a footer action. Use sparingly: this only fits truly destructive flows
                or end-of-session interruptions.
            </p>

            <mono-button slot="footer" color="primary" size="sm" @click="open = false">I understand</mono-button>
        </mono-modal>
    </div>
</template>
