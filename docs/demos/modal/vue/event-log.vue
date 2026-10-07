<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref, computed } from 'vue'

    const open = ref(false)
    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function onClose(event) {
        open.value = false
        logLines.value = [
            '[close] modelValue=' + event.detail.modelValue +
            ' old=' + event.detail.oldValue +
            ' source=' + JSON.stringify(event.detail.source),
            ...logLines.value,
        ]
    }
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <mono-button style="justify-self: start;" color="primary" @click="open = true">Open and watch the log</mono-button>

        <mono-modal
            title="Close source disambiguation"
            :model-value="open"
            @close="onClose"
        >
            <p style="margin: 0;">
                <code>close</code> fires whenever the modal closes itself.
                The <code>source</code> field disambiguates between overlay click
                (<code>overlay</code>), the ✕ button (<code>close</code>), Escape
                (<code>escape</code>), and manual <code>hide()</code> calls
                (<code>manual</code>).
            </p>
        </mono-modal>

        <DemoLog :text="logText" max-height="160px" />
    </div>
</template>
