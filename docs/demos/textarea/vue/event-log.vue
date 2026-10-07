<script setup>
    import '@mono-lit/helper/ui/textarea'
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
</script>

<template>
    <div style="width: 100%">
        <mono-textarea
            label="Event Textarea"
            placeholder="Type, then blur"
            :model-value="value"
            @input="onInput"
            @change="onChange"
        ></mono-textarea>
        <br>
        <DemoLog :text="logText" />
    </div>
</template>
