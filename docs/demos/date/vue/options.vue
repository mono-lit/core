<script setup>
    import '@mono-lit/helper/ui/date'
    import { ref } from 'vue'

    const value = ref('')

    // Any flatpickr option not surfaced as a named prop goes here — the picker is
    // "completely featured" via this passthrough.
    const fpOptions = {
        weekNumbers: true,
        dateFormat: 'd.m.Y',
        minDate: 'today',
    }
</script>

<template>
    <div style="width: 100%;">
        <mono-date
            label="With flatpickr options"
            placeholder="Week numbers · d.m.Y · min today"
            :options.prop="fpOptions"
            :model-value="value"
            @change="value = $event.detail.modelValue"
        />
        <p style="font-size: 0.8rem; color: var(--theme-text); opacity: 0.7; margin: 0.6rem 0 0;">
            Value: <code>{{ value || '—' }}</code>
        </p>
    </div>
</template>
