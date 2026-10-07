<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('dashboard')

const items = [
    { id: 'home', title: 'Home', icon: 'i-mdi-home-outline' },
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },

    { id: 'd-1', type: 'divider' },
    { id: 'sh-main', type: 'subheader', title: 'Main' },

    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'targets', title: 'Targets', icon: 'i-mdi-target' },

    { id: 'd-2', type: 'divider' },
    { id: 'sh-ops', type: 'subheader', title: 'Operations' },

    { id: 'klaim', title: 'Klaim', icon: 'i-mdi-clipboard-text-outline' },
    { id: 'logbook', title: 'Logbook', icon: 'i-mdi-notebook-outline' },

    { id: 'd-3', type: 'divider' },
    { id: 'sh-account', type: 'subheader', title: 'Account' },

    { id: 'profile', title: 'Profile', icon: 'i-mdi-account' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
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
        Use <code>{ type: 'divider', id }</code> for thin rules and
        <code>{ type: 'subheader', id, title }</code> for section labels — both
        live in the same <code>items</code> array as regular rows.
    </div>
</template>
