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
            label="Valid"
            :items.prop="items"
            key-value="value"
            display-value="label"
            model-value="apple"
            validation-state="valid"
            validation-message="Looks good."
        ></mono-select>
        <mono-select
            label="Invalid"
            placeholder="Pick a fruit"
            :items.prop="items"
            key-value="value"
            display-value="label"
            validation-state="invalid"
            validation-message="A fruit is required."
        ></mono-select>
        <mono-select
            label="Warning"
            :items.prop="items"
            key-value="value"
            display-value="label"
            model-value="banana"
            validation-state="warning"
            validation-message="Bananas are out of stock — try another."
        ></mono-select>
    </div>
</template>
