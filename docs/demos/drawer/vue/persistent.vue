<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)

</script>

<template>
    <div>
        <mono-button color="warning" @click="open = true">Open persistent drawer</mono-button>

        <mono-drawer
            position="right"
            size="md"
            color="warning"
            title="Confirm changes"
            persistent
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
        >
            <p style="margin: 0 0 0.65rem;">
                Overlay clicks and Escape are ignored when <code>persistent</code> is set.
            </p>
            <p style="margin: 0 0 1rem;">
                The user must explicitly press a footer button to dismiss.
            </p>
            <mono-button slot="footer" color="warning" size="sm" @click="open = false">Got it</mono-button>
        </mono-drawer>
    </div>
</template>
