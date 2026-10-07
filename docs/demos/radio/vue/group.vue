<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    const selected = ref('medium')

    function pick(event) {
        selected.value = event.detail.modelValue
    }
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <mono-radio
            label="Small"
            value="small"
            :model-value="selected"
            @change="pick"
        ></mono-radio>
        <mono-radio
            label="Medium"
            value="medium"
            :model-value="selected"
            @change="pick"
        ></mono-radio>
        <mono-radio
            label="Large"
            value="large"
            :model-value="selected"
            @change="pick"
        ></mono-radio>
        <DemoReadout>
            selected = {{ JSON.stringify(selected) }}
        </DemoReadout>
    </div>
</template>
