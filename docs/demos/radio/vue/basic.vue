<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    const selected = ref('')
</script>

<template>
    <div>
        <mono-radio
            label="I agree to the terms"
            value="agree"
            :model-value="selected"
            @change="selected = $event.detail.modelValue"
        ></mono-radio>
    </div>
</template>
