<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    const selected = ref('annual')

    function pick(event) {
        selected.value = event.detail.modelValue
    }
</script>

<template>
    <div style="display: grid; gap: 0.75rem;">
        <mono-radio
            label="Monthly"
            sublabel="Billed every month at $9. Cancel anytime."
            value="monthly"
            :model-value="selected"
            @change="pick"
        ></mono-radio>
        <mono-radio
            label="Annual"
            sublabel="Billed once a year at $84. Save 22%."
            value="annual"
            :model-value="selected"
            @change="pick"
        ></mono-radio>
    </div>
</template>
