<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('dashboard')

const items = [
    { id: 'dashboard', title: 'Dashboard',  icon: 'i-mdi-view-dashboard' },
    { id: 'analytics', title: 'Analytics',  icon: 'i-mdi-chart-line' },
    { id: 'customers', title: 'Customers',  icon: 'i-mdi-account-group' },
    { id: 'orders',    title: 'Orders',     icon: 'i-mdi-package-variant', badge: 12, badgeColor: 'primary' },
    { id: 'inbox',     title: 'Inbox',      icon: 'i-mdi-email-outline',   badge: 3,  badgeColor: 'danger' },
    { id: 'd-1', type: 'divider' },
    { id: 'sh-account', type: 'subheader', title: 'Account' },
    { id: 'profile',   title: 'Profile',    icon: 'i-mdi-account-circle' },
    { id: 'settings',  title: 'Settings',   icon: 'i-mdi-cog' },
    { id: 'logout',    title: 'Logout',     icon: 'i-mdi-logout' },
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
        Set <code>item.icon</code> to any iconify class — <code>i-mdi-*</code>,
        <code>i-tabler-*</code>, <code>i-lucide-*</code>, <code>i-simple-icons-*</code>,
        etc. The component renders <code>&lt;span class="i-mdi-cog"&gt;</code> and
        UnoCSS's <code>presetIcons</code> paints the SVG via mask +
        <code>currentColor</code>, so the active row inherits white automatically.
        Browse <a href="https://icones.js.org" target="_blank" rel="noreferrer">icones.js.org</a>
        for the full catalog.
    </div>
</template>
