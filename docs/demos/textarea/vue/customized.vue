<script setup>
    import '@mono-lit/helper/ui/textarea'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <mono-textarea
            label="Customized via cssClass"
            placeholder="Wider, bolder, italic message"
            helper-text="Width, label weight, field font and message style are overridden via the cssClass prop."
            show-counter
            :max-length="500"
            :model-value="value"
            @input="value = $event.detail.modelValue"
            :css-class.prop="{
                root: 'max-w-md',
                label: 'font-bold text-base',
                field: 'text-base',
                message: 'italic',
            }"
        ></mono-textarea>
    </div>
</template>
