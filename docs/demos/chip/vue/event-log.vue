<script setup>
    import '@mono-lit/helper/ui/chip'
    import { ref, computed } from 'vue'

    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function onClick(event) {
        logLines.value = ['[click] selected=' + event.detail.modelValue, ...logLines.value]
    }

    function onClose(event) {
        logLines.value = ['[close] label=' + event.detail.label, ...logLines.value]
    }
</script>

<template>
    <div>
        <mono-chip clickable color="primary" @click="onClick">Click me</mono-chip>
        <br>
        <mono-chip color="danger" removable @close="onClose">Close me</mono-chip>
        <br>
        <br>
        <DemoLog :text="logText" max-height="80px" />
    </div>
</template>
