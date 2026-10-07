<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <mono-input
            label="Full name"
            placeholder="Type your name"
            helper-text="Letters, spaces and hyphens only."
            :model-value="value"
            @input="value = $event.detail.modelValue"
        ></mono-input>
    </div>
</template>
