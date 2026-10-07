<script setup>
    import '@mono-lit/helper/ui/select'

    const items = [
        { label: 'USD — US Dollar', value: 'USD' },
        { label: 'EUR — Euro', value: 'EUR' },
        { label: 'GBP — British Pound', value: 'GBP' },
        { label: 'JPY — Japanese Yen', value: 'JPY' },
    ]
</script>

<template>
    <div style="width: 100%;">
        <mono-select :items.prop="items" key-value="value" display-value="label" model-value="USD">
            <span slot="label">💱 Currency</span>
            <span slot="prefix">$</span>
            <span slot="helper">Used for billing and reporting.</span>
        </mono-select>
    </div>
</template>
