<script setup>
import { ref } from 'vue'

const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'history', label: 'History' },
]
const active = ref('overview')
</script>

<template>
    <div>
        <div mono-tabs role="tablist">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                mono-tab
                :aria-selected="active === tab.id"
                role="tab"
                @click="active = tab.id"
            >
                <span mono-label>{{ tab.label }}</span>
            </button>
        </div>

        <div style="padding: 1rem; font-size: 0.86rem; color: var(--theme-text);">
            <div v-if="active === 'overview'">A short summary of the record.</div>
            <div v-if="active === 'details'">Detail rows go here — fields, edit history, links.</div>
            <div v-if="active === 'history'">Audit log: who changed what, when.</div>
        </div>
    </div>
</template>
