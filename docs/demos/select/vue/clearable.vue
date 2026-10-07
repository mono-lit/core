<script setup>
    import '@mono-lit/helper/ui/select'
    import { ref } from 'vue'

    const selected = ref('banana')

    const items = [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
    ]
</script>

<template>
    <div style="width: 100%;">
        <mono-select
            label="Clearable"
            placeholder="Pick a fruit"
            helper-text="The clear button appears when a value is selected."
            clearable
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value="selected"
            @change="selected = $event.detail.modelValue"
            @clear="selected = null"
        ></mono-select>
    </div>
</template>
