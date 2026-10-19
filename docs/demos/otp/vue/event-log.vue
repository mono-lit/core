<script setup>
    import '@mono-lit/helper/ui/otp'
    import { ref, computed } from 'vue'

    const code = ref('')
    const logLines = ref([])

    const logText = computed(() => (logLines.value.length ? logLines.value.join('\n') : 'No events yet...'))

    function append(line) {
        logLines.value = [line, ...logLines.value].slice(0, 40)
    }

    function onInput(event) {
        code.value = event.detail.modelValue
        append(`[input]    value="${event.detail.modelValue}" box=${event.detail.index}`)
    }

    function onChange(event) {
        append(`[change]   value="${event.detail.modelValue}" old="${event.detail.oldValue}"`)
    }

    function onComplete(event) {
        append(`[complete] value="${event.detail.modelValue}"`)
    }
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- input per edit · complete once every box is filled · change when focus leaves the boxes · clear from the × -->
        <mono-otp
            label="Event code"
            groups="3"
            clearable
            :model-value="code"
            @input="onInput"
            @complete="onComplete"
            @change="onChange"
            @clear="append('[clear]')"
        ></mono-otp>
        <DemoLog :text="logText" max-height="160px" />
    </div>
</template>
