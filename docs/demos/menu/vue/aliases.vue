<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

// None of these items declare an `icon` — the menu falls back to a monogram
// avatar built from the title (1–2 uppercase letters). This is the
// representation rail-mode sidebars show when labels are hidden.
const items = [
    { id: 'dashboard',    title: 'Dashboard' },
    { id: 'post-budget',  title: 'Post Budget' },
    { id: 'sales-order',  title: 'Sales Order' },
    { id: 'klaim',        title: 'Klaim' },
    { id: 'd-1', type: 'divider' },
    { id: 'sh-account', type: 'subheader', title: 'Account' },
    { id: 'profile',      title: 'Profile' },
    { id: 'settings',     title: 'Settings' },
]

const active = ref('post-budget')

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
        Each row's icon is missing, so the renderer derives an alias from the
        title — <code>"Dashboard"</code> → <strong>D</strong>,
        <code>"Post Budget"</code> → <strong>PB</strong>,
        <code>"Sales Order"</code> → <strong>SO</strong>. In a rail-mode
        sidebar where labels are hidden, this alias becomes the only visual
        cue for the row.
    </div>
</template>
