<script setup>
    import '@mono-lit/helper/ui/textarea'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>

    <div style="width: 100%">

        <mono-textarea
            label="Bio"
            placeholder="Tell us a bit about yourself"
            helper-text="Plain text. A few sentences is enough."
            :model-value="value"
            @input="value = $event.detail.modelValue"
        ></mono-textarea>

    </div>
</template>
