<script setup>
    import '@mono-lit/helper/ui/tabs'
    import { ref } from 'vue'

    const items = [
        { id: 'overview', label: 'Overview' },
        { id: 'details', label: 'Details' },
        { id: 'history', label: 'History' },
    ]

    const active = ref('overview')
</script>

<template>
    <div>
        <mono-tabs
            :items.prop="items"
            :model-value="active"
            @change="active = $event.detail.modelValue"
        ></mono-tabs>

        <div style="padding: 1rem; font-size: 0.86rem; color: var(--theme-text);">
            <div v-if="active === 'overview'">A short summary of the record.</div>
            <div v-else-if="active === 'details'">Detail rows go here — fields, edit history, links.</div>
            <div v-else-if="active === 'history'">Audit log: who changed what, when.</div>
        </div>
    </div>
</template>
