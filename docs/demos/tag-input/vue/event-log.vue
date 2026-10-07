<script setup>
import '@mono-lit/helper/ui/tag-input'
import { ref, computed } from 'vue'

const tags = ref([])
const logLines = ref([])

const items = ref([
    { label: 'Vue', value: 'vue', description: 'Vue framework' },
    { label: 'Lit', value: 'lit', description: 'Lit web components' },
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' },
    { label: 'Svelte', value: 'svelte' },
])

const logText = computed(() =>
    logLines.value.length ? logLines.value.join('\n') : 'No events yet...',
)

function append(line) {
    logLines.value = [line, ...logLines.value]
}

function onAdd(event) {
    append('[add] added=' + JSON.stringify(event.detail.addedValue) + ' value=' + JSON.stringify(event.detail.modelValue))
}

function onRemove(event) {
    append('[remove] removed=' + JSON.stringify(event.detail.removedValue) + ' value=' + JSON.stringify(event.detail.modelValue))
}

function onClear(event) {
    append('[clear] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
}

function onChange(event) {
    tags.value = event.detail.modelValue
    append('[change] value=' + JSON.stringify(event.detail.modelValue) + ' old=' + JSON.stringify(event.detail.oldValue))
}
</script>

<template>
    <div style="width: 100%;">
        <mono-tag-input label="Event Tag Input" placeholder="Add, remove, clear" clearable :model-value.prop="tags" :items.prop="items" key-value="value" display-value="label"
            @add="onAdd" @remove="onRemove" @clear="onClear" @change="onChange"></mono-tag-input>
        <br>
        <DemoLog :text="logText" />
    </div>
</template>
