<script setup>
    import '@mono-lit/helper/ui/date'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%;">
        <mono-date
            type="time"
            label="Time"
            placeholder="Select a time"
            time-24hr
            :model-value="value"
            @change="value = $event.detail.modelValue"
        />
        <p style="font-size: 0.8rem; color: var(--theme-text); opacity: 0.7; margin: 0.6rem 0 0;">
            Value: <code>{{ value || '—' }}</code>
        </p>
    </div>
</template>
