<script setup>
    import '@mono-lit/helper/ui/textarea'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <mono-textarea
            label="Notes"
            placeholder="Start typing — the field grows from 2 to 8 rows."
            helper-text="Auto-grow stops at max-rows; the textarea scrolls beyond that."
            auto-resize
            :min-rows="2"
            :max-rows="8"
            :model-value="value"
            @input="value = $event.detail.modelValue"
        ></mono-textarea>
    </div>
</template>
