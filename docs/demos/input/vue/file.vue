<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref, computed } from 'vue'

    const single = ref(null)
    const many = ref([])
    const logLines = ref([])

    const logText = computed(() =>
        logLines.value.length ? logLines.value.join('\n') : 'Pick a file...',
    )

    const describe = (value) =>
        Array.isArray(value)
            ? '[' + value.map((f) => f.name).join(', ') + ']'
            : value
                ? 'File(' + value.name + ', ' + value.size + ' B)'
                : String(value)

    function append(line) {
        logLines.value = [line, ...logLines.value]
    }

    function onSingle(event) {
        single.value = event.detail.modelValue
        append('[change] single=' + describe(event.detail.modelValue))
    }

    function onMany(event) {
        many.value = event.detail.modelValue
        append('[change] multiple=' + describe(event.detail.modelValue))
    }

    function onError(event) {
        append('[error] ' + event.detail.message)
    }
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem">
        <mono-input
            type="file"
            label="Attachment"
            placeholder="Choose a file"
            helper-text="Click the field or the cloud icon. Max 1 MB."
            accept=".pdf,image/*"
            :max-file-size="1024 * 1024"
            clearable
            :model-value.prop="single"
            @change="onSingle"
            @clear="single = null"
            @error="onError"
        ></mono-input>

        <mono-input
            type="file"
            label="Gallery"
            placeholder="Choose images"
            accept="image/*"
            multiple
            clearable
            :model-value.prop="many"
            @change="onMany"
            @clear="many = []"
        ></mono-input>

        <DemoLog :text="logText" max-height="120px" />
    </div>
</template>
