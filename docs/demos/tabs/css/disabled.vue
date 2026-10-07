<script setup>
import { ref } from 'vue'

const perItem = [
    { id: 'general', label: 'General' },
    { id: 'billing', label: 'Billing', disabled: true },
    { id: 'team', label: 'Team' },
    { id: 'audit', label: 'Audit log', disabled: true },
]
const active = ref('general')

function pick(tab) {
    if (tab.disabled) return
    active.value = tab.id
}
</script>

<template>
    <div style="display: grid; gap: 1.5rem;">
        <div>
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--theme-text); margin-bottom: 0.5rem;">
                Per-item disabled
            </div>
            <div mono-tabs role="tablist">
                <button
                    v-for="tab in perItem"
                    :key="tab.id"
                    type="button"
                    mono-tab
                    :aria-selected="active === tab.id"
                    role="tab"
                    :disabled="tab.disabled"
                    :aria-disabled="tab.disabled || undefined"
                    @click="pick(tab)"
                >
                    <span mono-label>{{ tab.label }}</span>
                </button>
            </div>
        </div>

        <div>
            <div style="font-size: 0.74rem; font-weight: 700; color: var(--theme-text); margin-bottom: 0.5rem;">
                Whole strip disabled
            </div>
            <div mono-tabs mono-disabled role="tablist">
                <button type="button" mono-tab aria-selected="true" role="tab" disabled><span mono-label>One</span></button>
                <button type="button" mono-tab role="tab" disabled><span mono-label>Two</span></button>
                <button type="button" mono-tab role="tab" disabled><span mono-label>Three</span></button>
            </div>
        </div>
    </div>
</template>
