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
        <mono-select
            label="Disabled"
            placeholder="Cannot open"
            :items.prop="items"
            key-value="value"
            display-value="label"
            model-value="banana"
            clearable
            disabled
        ></mono-select>
        <mono-select
            label="Readonly"
            placeholder="Display only"
            :items.prop="items"
            key-value="value"
            display-value="label"
            model-value="cherry"
            clearable
            readonly
        ></mono-select>
        <mono-select
            label="Required"
            placeholder="Pick a fruit"
            helper-text="The asterisk indicates a required field."
            :items.prop="items"
            key-value="value"
            display-value="label"
            required
        ></mono-select>
    </div>
</template>
