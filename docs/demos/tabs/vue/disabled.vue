<script setup>
    import '@mono-lit/helper/ui/tabs'
    import { ref } from 'vue'

    const itemsPartial = [
        { id: 'general', label: 'General' },
        { id: 'billing', label: 'Billing', disabled: true },
        { id: 'team', label: 'Team' },
        { id: 'audit', label: 'Audit log', disabled: true },
    ]

    const itemsAll = [
        { id: 'a', label: 'One' },
        { id: 'b', label: 'Two' },
        { id: 'c', label: 'Three' },
    ]

    const partialActive = ref('general')
</script>

<template>
    <div style="display: grid; gap: 1.5rem;">
        <div>
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--theme-text); margin-bottom: 0.5rem;">
                Per-item disabled
            </div>
            <mono-tabs
                :items.prop="itemsPartial"
                :model-value="partialActive"
                @change="partialActive = $event.detail.modelValue"
            ></mono-tabs>
        </div>

        <div>
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--theme-text); margin-bottom: 0.5rem;">
                Whole strip disabled
            </div>
            <mono-tabs :items.prop="itemsAll" model-value="a" disabled></mono-tabs>
        </div>
    </div>
</template>
