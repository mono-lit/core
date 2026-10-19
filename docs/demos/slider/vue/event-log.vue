<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref, computed } from 'vue'

    const value = ref([20, 60])
    const logLines = ref([])

    const logText = computed(() => (logLines.value.length ? logLines.value.join('\n') : 'No events yet...'))

    function append(line) {
        logLines.value = [line, ...logLines.value].slice(0, 40)
    }

    function onInput(event) {
        value.value = event.detail.modelValue
        append('[input]  value=' + JSON.stringify(event.detail.modelValue) + ' thumb=' + event.detail.index)
    }

    function onChange(event) {
        append('[change] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- input fires while dragging (thumb = -1 for a segment drag); change on release. -->
        <mono-slider
            label="Event slider"
            :model-value.prop="value"
            @input="onInput"
            @change="onChange"
        ></mono-slider>
        <DemoLog :text="logText" max-height="140px" />
    </div>
</template>
