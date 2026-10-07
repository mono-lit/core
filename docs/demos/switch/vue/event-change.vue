<script setup>
    import '@mono-lit/helper/ui/switch'
    import { ref } from 'vue'

    const enabled = ref(false)

    function onChange(event) {
        enabled.value = event.detail.modelValue
    }
</script>

<template>
    <div style="display: grid; gap: 0.5rem;">
        <mono-switch
            label="Wi-Fi"
            :model-value="enabled"
            @change="onChange"
        ></mono-switch>
        <DemoReadout>
            enabled = {{ enabled }}
        </DemoReadout>
    </div>
</template>
