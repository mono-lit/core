<script setup>
    import '@mono-lit/helper/ui/select'
    import { ref } from 'vue'

    const selected = ref(null)

    const items = ref([
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
        { label: 'Durian', value: 'durian' },
    ])
</script>

<template>
    <div style="width: 100%;">
        <mono-select
            label="Favourite fruit"
            placeholder="Pick one"
            helper-text="Just one fruit, please."
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value="selected"
            @change="selected = $event.detail.modelValue"
        ></mono-select>
    </div>
</template>
