<script setup>
    import '@mono-lit/helper/ui/file-upload'
    import { ref, computed } from 'vue'

    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function append(line) {
        logLines.value = [line, ...logLines.value]
    }

    function onChange(event) {
        append('[change] action=' + event.detail.action + ' files=' + event.detail.modelValue.length)
    }

    function onRemove(event) {
        append('[remove] file=' + event.detail.removedFile.name)
    }

    function onError(event) {
        append('[error] reason=' + event.detail.reason + ' message=' + event.detail.message)
    }
</script>

<template>
    <div style="width: 100%">
        <mono-file-upload
            label="Event Upload"
            multiple
            max-files="2"
            max-file-size="1048576"
            title="Upload files to see events"
            subtitle="Try multiple files or one over 1MB"
            @change="onChange"
            @remove="onRemove"
            @error="onError"
        ></mono-file-upload>
        <br>
        <DemoLog :text="logText" max-height="100px" />
    </div>
</template>
