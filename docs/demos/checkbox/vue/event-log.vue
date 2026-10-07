<script setup>
import '@mono-lit/helper/ui/checkbox'
import { ref, computed } from 'vue'

const watched = ref(false)
const logLines = ref([])

const logText = computed(() =>
    logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
)

function onChange(event) {
    watched.value = event.detail.modelValue
    const line = '[change] ' + (event.detail.modelValue ? 'CHECKED' : 'UNCHECKED')
    logLines.value = [line, ...logLines.value]
}
</script>

<template>
    <div>
        <mono-checkbox :model-value="watched" @change="onChange" label="Watched checkbox" />
        <br>
        <br>
        <DemoLog :text="logText" max-height="80px" />
    </div>
</template>
