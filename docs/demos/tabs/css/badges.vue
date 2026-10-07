<script setup>
import { ref } from 'vue'

const tabs = [
    { id: 'inbox', label: 'Inbox', badge: '12' },
    { id: 'sent', label: 'Sent', badge: '3' },
    { id: 'drafts', label: 'Drafts', badge: '28' },
    { id: 'trash', label: 'Trash' },
]
const active = ref('inbox')
</script>

<template>
    <div style="width: fit-content;" mono-tabs role="tablist">
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
            <span v-if="tab.badge" mono-badge>{{ tab.badge }}</span>
        </button>
    </div>
</template>
