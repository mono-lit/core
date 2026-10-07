<script setup>
    import '@mono-lit/helper/ui/select'

    const items = [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
    ]
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1rem;">
        <mono-select size="xs" label="Extra small" placeholder="Extra small" :items.prop="items" key-value="value" display-value="label"></mono-select>
        <mono-select size="sm" label="Small" placeholder="Small" :items.prop="items" key-value="value" display-value="label"></mono-select>
        <mono-select size="md" label="Medium" placeholder="Medium" :items.prop="items" key-value="value" display-value="label"></mono-select>
        <mono-select size="lg" label="Large" placeholder="Large" :items.prop="items" key-value="value" display-value="label"></mono-select>
        <mono-select size="xl" label="Extra large" placeholder="Extra large" :items.prop="items" key-value="value" display-value="label"></mono-select>
        <mono-select size="xxl" label="2X large" placeholder="2X large" :items.prop="items" key-value="value" display-value="label"></mono-select>
    </div>
</template>
