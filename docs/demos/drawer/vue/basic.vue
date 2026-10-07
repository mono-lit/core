<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)

</script>

<template>
    <div>
        <mono-button @click="open = true">Open drawer</mono-button>

        <mono-drawer
            position="right"
            size="md"
            color="primary"
            title="Drawer title"
            subtitle="A short description under the title."
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
        >
            <p style="margin: 0 0 0.6rem; font-weight: 600;">
                Hello from the right side.
            </p>
            <p style="margin: 0; opacity: 0.8;">
                Click the close button, the dimmed overlay, or press Escape to dismiss.
            </p>
        </mono-drawer>
    </div>
</template>
