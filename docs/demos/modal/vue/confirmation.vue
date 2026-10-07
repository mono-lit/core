<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
    const status = ref('Idle')

    function confirmDelete() {
        status.value = 'Deleted'
        open.value = false
    }

    function cancel() {
        status.value = 'Cancelled'
        open.value = false
    }
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <mono-button style="justify-self: start;" color="danger" @click="open = true">Delete record</mono-button>
        <div style="font-size: 0.78rem; color: var(--theme-text); opacity: 0.7;">
            Status: {{ status }}
        </div>

        <mono-modal
            color="danger"
            title="Delete this record?"
            :model-value="open"
            @close="open = false"
        >
            <p style="margin: 0 0 0.4rem; font-weight: 600;">
                This action can't be undone.
            </p>
            <p style="margin: 0; opacity: 0.8;">
                The record and all its attachments will be permanently removed.
            </p>

            <mono-button slot="footer" variant="tonal" color="secondary" size="sm" @click="cancel">Cancel</mono-button>
            <mono-button slot="footer" color="danger" size="sm" @click="confirmDelete">Delete</mono-button>
        </mono-modal>
    </div>
</template>
