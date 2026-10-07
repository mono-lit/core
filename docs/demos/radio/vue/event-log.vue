<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref, computed } from 'vue'

    const selected = ref('')
    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function append(line) {
        logLines.value = [line, ...logLines.value]
    }

    function onChange(event) {
        selected.value = event.detail.modelValue
        append('[change] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }
</script>

<template>
    <div>
        <div style="display: grid; gap: 0.5rem;">
            <mono-radio
                label="Option A"
                value="a"
                :model-value="selected"
                @change="onChange"
            ></mono-radio>
            <mono-radio
                label="Option B"
                value="b"
                :model-value="selected"
                @change="onChange"
            ></mono-radio>
            <mono-radio
                label="Option C"
                value="c"
                :model-value="selected"
                @change="onChange"
            ></mono-radio>
        </div>
        <br>
        <DemoLog :text="logText" max-height="100px" />
    </div>
</template>
