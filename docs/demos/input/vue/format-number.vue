<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref } from 'vue'

    // The VALUE stays a plain numeric string — `Number(value)` works, whatever the field shows.
    const value = ref('')
    const committed = ref('')
</script>

<template>
    <div style="display: grid; gap: 1rem; width: 100%">
        <!-- `type="text"` is required: a native number input rejects any value that is not a bare
             number, so it would blank itself the moment a separator appeared. `inputmode="numeric"`
             keeps the numeric keypad on touch. -->
        <mono-input
            type="text"
            inputmode="numeric"
            label="Total (live)"
            placeholder="Type an amount"
            helper-text="Grouped as you type. The value stays unformatted."
            format-display="#,##0.##"
            format-value="#,##0.##"
            format-locale="id-ID"
            :model-value="value"
            @input="value = $event.detail.modelValue"
        ></mono-input>

        <mono-input
            type="text"
            inputmode="numeric"
            label="Total (on blur)"
            placeholder="Type, then leave the field"
            helper-text="format-on=&quot;blur&quot; — raw while typing, so the decimal separator types freely."
            format-display="#,##0.00"
            format-value="#,##0.00"
            format-locale="id-ID"
            format-on="blur"
            :model-value="committed"
            @change="committed = $event.detail.modelValue"
        ></mono-input>

        <p style="margin: 0; font-size: 0.78rem; opacity: 0.75">
            value: <strong>{{ value || '—' }}</strong> ·
            on blur: <strong>{{ committed || '—' }}</strong>
        </p>
    </div>
</template>
