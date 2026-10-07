<script setup>
    import '@mono-lit/helper/ui/select'
    import { ref, computed } from 'vue'

    const selected = ref(null)
    const logLines = ref([])

    const items = [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
    ]

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

    function onClear(event) {
        selected.value = null
        append('[clear] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
    }
</script>

<template>
    <div style="width: 100%;">
        <mono-select
            label="Event Select"
            placeholder="Pick, then clear"
            clearable
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value="selected"
            @change="onChange"
            @clear="onClear"
        ></mono-select>
        <br>
        <DemoLog :text="logText" max-height="100px" />
    </div>
</template>
