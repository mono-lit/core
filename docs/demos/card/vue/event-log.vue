<script setup>
    import '@mono-lit/helper/ui/card'
    import { ref, computed } from 'vue'

    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function onClick(event) {
        const via = event.detail.originalEvent?.type === 'keydown' ? 'keyboard' : 'mouse'
        logLines.value = ['[click] via ' + via, ...logLines.value]
    }
</script>

<template>
    <div style="width: 100%;">
        <mono-card clickable @click="onClick">
            <h3 slot="title">Click or press Enter</h3>
            <p>Each interaction is logged below.</p>
        </mono-card>
        <br>
        <br>
        <DemoLog :text="logText" max-height="80px" />
    </div>
</template>
