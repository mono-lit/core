<script setup>
    import '@mono-lit/helper/ui/date'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style=" width: 100%;">
        <mono-date
            typeable
            clearable
            label="Type a date"
            placeholder="e.g. 2026-03-15"
            :model-value="value"
            @change="value = $event.detail.modelValue"
        />
        <p style="font-size: 0.8rem; color: var(--theme-text); opacity: 0.7; margin: 0.6rem 0 0;">
            Focus the field and type a date in <code>Y-m-d</code> format — the calendar follows
            along and auto-selects once it's complete. Value: <code>{{ value || '—' }}</code>
        </p>
    </div>
</template>
