<script setup>
    import '@mono-lit/helper/ui/date'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <mono-date
            label="Start date"
            placeholder="Select a date"
            helper-text="The first working day."
            tooltip="Contracts starting on a weekend or public holiday begin on the next working day."
            :model-value="value"
            @change="value = $event.detail.modelValue"
        />

        <mono-date
            label="Created on"
            model-value="2026-01-15"
            readonly
            :tooltip.prop="{ content: 'Set automatically when the record was created.', placement: 'right' }"
        />
    </div>
</template>
