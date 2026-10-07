<script setup>
    import '@mono-lit/helper/ui/select'
    import { ref } from 'vue'

    const selected = ref(null)
    const lastLabel = ref('—')

    const items = [
        { label: 'Coffee', value: 'coffee' },
        { label: 'Tea', value: 'tea' },
        { label: 'Water', value: 'water' },
    ]

    function onChange(event) {
        selected.value = event.detail.modelValue
        lastLabel.value = event.detail.selectedItem?.label ?? '—'
    }
</script>

<template>
    <div style="width: 100%; display: grid; gap: 0.5rem;">
        <mono-select
            label="Drink"
            placeholder="Pick a drink"
            :items.prop="items"
            key-value="value"
            display-value="label"
            :model-value="selected"
            @change="onChange"
        ></mono-select>
        <DemoReadout>
            Last picked: {{ lastLabel }} ({{ JSON.stringify(selected) }})
        </DemoReadout>
    </div>
</template>
