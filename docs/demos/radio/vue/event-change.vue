<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    const selected = ref('')
    const lastPicked = ref('—')

    function onChange(event) {
        selected.value = event.detail.modelValue
        lastPicked.value = event.detail.modelValue
    }
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <mono-radio
            label="Coffee"
            value="coffee"
            :model-value="selected"
            @change="onChange"
        ></mono-radio>
        <mono-radio
            label="Tea"
            value="tea"
            :model-value="selected"
            @change="onChange"
        ></mono-radio>
        <mono-radio
            label="Water"
            value="water"
            :model-value="selected"
            @change="onChange"
        ></mono-radio>
        <DemoReadout>
            Last picked: {{ lastPicked }}
        </DemoReadout>
    </div>
</template>
