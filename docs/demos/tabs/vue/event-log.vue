<script setup>
    import '@mono-lit/helper/ui/tabs'
    import { ref, computed } from 'vue'

    const items = [
        { id: 'overview', label: 'Overview' },
        { id: 'klaim', label: 'Klaim', badge: 12 },
        { id: 'target', label: 'Target' },
    ]

    const active = ref('overview')
    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function append(line) {
        logLines.value = [line, ...logLines.value]
    }

    function onClick(event) {
        active.value = event.detail.modelValue
        append('[change] modelValue=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }
</script>

<template>
    <div>
        <mono-tabs
            :items.prop="items"
            :model-value="active"
            @change="onClick"
        ></mono-tabs>
        <br>
        <DemoLog :text="logText" />
    </div>
</template>
