<script setup>
    import '@mono-lit/helper/ui/input'
    import { ref } from 'vue'

    const value = ref('')
</script>

<template>
    <div style="width: 100%">
        <mono-input
            label="Customized via cssClass"
            placeholder="Wider, bolder, italic message"
            helper-text="Width, label weight, font size and message style are overridden via the cssClass prop."
            clearable
            :model-value="value"
            @input="value = $event.detail.modelValue"
            @clear="value = ''"
            :css-class="{
                root: 'max-w-md',
                label: 'font-bold text-base',
                native: 'text-lg',
                message: 'italic',
            }"
        ></mono-input>
    </div>
</template>
