<script setup>
    import '@mono-lit/helper/ui/tabs'
    import { ref } from 'vue'

    const items = [
        { id: 'overview', label: 'Overview', badge: 3 },
        { id: 'klaim', label: 'Klaim', badge: 12 },
        { id: 'target', label: 'Target' },
    ]

    const active = ref('overview')
</script>

<template>
    <mono-tabs
        :items.prop="items"
        :model-value="active"
        variant="pill"
        @change="active = $event.detail.modelValue"
        :css-class.prop="{
            root: 'shadow-md',
            tab: 'text-base',
            label: 'tracking-wide',
            badge: 'font-extrabold',
        }"
    ></mono-tabs>
</template>
