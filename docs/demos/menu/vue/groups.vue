<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('orders')

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    {
        id: 'sales-grp',
        type: 'group',
        title: 'Sales',
        icon: 'i-mdi-cash-multiple',
        defaultOpen: true,
        items: [
            { id: 'orders', title: 'Orders', icon: 'i-mdi-receipt-text-outline' },
            { id: 'targets', title: 'Targets & periode', icon: 'i-mdi-target' },
            { id: 'salesman', title: 'Salesman & BA', icon: 'i-mdi-car' },
        ],
    },
    {
        id: 'ops-grp',
        type: 'group',
        title: 'Operations',
        icon: 'i-mdi-wrench-outline',
        items: [
            { id: 'klaim', title: 'Klaim', icon: 'i-mdi-clipboard-text-outline' },
            { id: 'logbook', title: 'Logbook', icon: 'i-mdi-notebook-outline' },
            { id: 'master', title: 'Data master', icon: 'i-mdi-file-cabinet' },
        ],
    },
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
        Active: <code>{{ active }}</code>. Click a group header to expand or collapse;
        the Sales group is open by default via <code>defaultOpen: true</code>.
    </div>
</template>
