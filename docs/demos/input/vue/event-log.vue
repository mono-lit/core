<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref, computed } from 'vue'

    const value = ref('')
    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function append(line) {
        logLines.value = [line, ...logLines.value]
    }

    function onInput(event) {
        value.value = event.detail.modelValue
        append('[input] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }

    function onChange(event) {
        append('[change] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }

    function onClear(event) {
        append('[clear] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }
</script>

<template>
    <div style="width: 100%">
        <mono-input
            label="Event Input"
            placeholder="Type, blur, then clear"
            clearable
            :model-value="value"
            @input="onInput"
            @change="onChange"
            @clear="onClear"
        ></mono-input>
        <br>
        <DemoLog :text="logText" max-height="100px" />
    </div>
</template>
