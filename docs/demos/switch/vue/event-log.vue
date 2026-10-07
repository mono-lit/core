<script setup>
    import '@mono-lit/helper/ui/switch'
    import { ref, computed } from 'vue'

    const enabled = ref(false)
    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
    )

    function append(line) {
        logLines.value = [line, ...logLines.value]
    }

    function onChange(event) {
        enabled.value = event.detail.modelValue
        append('[change] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }
</script>

<template>
    <div>
        <mono-switch
            label="Event Switch"
            sublabel="Toggle me to see events fire."
            :model-value="enabled"
            @change="onChange"
        ></mono-switch>
        <br>
        <DemoLog :text="logText" max-height="100px" />
    </div>
</template>
