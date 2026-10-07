<script setup>
    import '@mono-lit/helper/ui/textarea'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <mono-textarea
            label="Tweet"
            placeholder="What's happening?"
            helper-text="Show-counter renders the live count next to the helper."
            show-counter
            :max-length="280"
            :model-value="value"
            @input="value = $event.detail.modelValue"
        ></mono-textarea>
    </div>
</template>
