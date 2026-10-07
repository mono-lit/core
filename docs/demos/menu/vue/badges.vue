<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('inbox')

const items = [
    { id: 'inbox', title: 'Inbox', icon: 'i-mdi-inbox-arrow-down', badge: 12 },
    { id: 'flagged', title: 'Flagged', icon: 'i-mdi-flag-outline', badge: 3, badgeColor: 'danger' },
    { id: 'review', title: 'Pending review', icon: 'i-mdi-eye-outline', badge: 'NEW', badgeColor: 'success' },
    { id: 'paused', title: 'Paused', icon: '⏸️', badge: 'PRO', badgeColor: 'warning' },
    { id: 'archive', title: 'Archive', icon: 'i-mdi-package-variant' },
]

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-menu
            :items.prop="items"
            :model-value="active"
            @change="active = $event.detail.modelValue"
        />
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        <code>badge</code> can be a number or string. <code>badgeColor</code> picks
        from <code>default</code> / <code>primary</code> / <code>success</code> /
        <code>danger</code> / <code>warning</code> / <code>info</code>.
    </div>
</template>
