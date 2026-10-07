<script setup>
    import '@mono-lit/helper/ui/select'
    import { ref } from 'vue'

    const selected = ref(null)

    const items = [
        { label: 'Espresso', value: 'espresso' },
        { label: 'Latte', value: 'latte' },
        { label: 'Mocha', value: 'mocha' },
    ]
</script>

<template>
    <div style="width: 100%;">
        <mono-select
            label="Customized via cssClass"
            placeholder="Wider, bolder, italic message"
            helper-text="Width, label weight, value font and message style are overridden via the cssClass prop."
            clearable
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value="selected"
            @change="selected = $event.detail.modelValue"
            @clear="selected = null"
            :css-class="{
                root: 'max-w-md',
                label: 'font-bold text-base',
                value: 'text-base',
                message: 'italic',
            }"
        ></mono-select>
    </div>
</template>
