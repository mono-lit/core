<script setup>
import { ref } from 'vue'

const tabs = [
    { id: 'overview', label: 'Overview', badge: '3' },
    { id: 'klaim', label: 'Klaim', badge: '12' },
    { id: 'target', label: 'Target' },
]
const active = ref('overview')
</script>

<template>
    <div mono-tabs mono-variant="pill" class="shadow-md" role="tablist">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            mono-tab class="text-base"
            :aria-selected="active === tab.id"
            role="tab"
            @click="active = tab.id"
        >
            <span mono-label class="tracking-wide">{{ tab.label }}</span>
            <span v-if="tab.badge" mono-badge class="font-extrabold">{{ tab.badge }}</span>
        </button>
    </div>
</template>
