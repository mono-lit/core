<script setup>
    import '@mono-lit/helper/ui/tabs'

    const items = [
        { id: 'a', label: 'Overview' },
        { id: 'b', label: 'Details' },
        { id: 'c', label: 'History' },
    ]
</script>

<template>
    <div style="display: grid; gap: 1.5rem;">
        <mono-tabs size="xs" :items.prop="items" model-value="a"></mono-tabs>
        <mono-tabs size="sm" :items.prop="items" model-value="a"></mono-tabs>
        <mono-tabs size="md" :items.prop="items" model-value="a"></mono-tabs>
        <mono-tabs size="lg" :items.prop="items" model-value="a"></mono-tabs>
        <mono-tabs size="xl" :items.prop="items" model-value="a"></mono-tabs>
        <mono-tabs size="xxl" :items.prop="items" model-value="a"></mono-tabs>
    </div>
</template>
