<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('cut')

const items = [
    { id: 'cut', title: 'Cut', icon: 'i-mdi-content-cut' },
    { id: 'copy', title: 'Copy', icon: 'i-mdi-clipboard-text-outline' },
    { id: 'paste', title: 'Paste', icon: 'i-mdi-paperclip' },
    { id: 'duplicate', title: 'Duplicate', icon: 'i-mdi-repeat' },
    { id: 'd-1', type: 'divider' },
    { id: 'delete', title: 'Delete', icon: 'i-mdi-trash-can-outline', badge: '⌫', badgeColor: 'danger' },
]

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.55rem; background: var(--theme-surface); box-shadow: 0 8px 30px rgba(0,0,0,0.08); max-width: 240px;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-menu
            :items.prop="items"
            :nav="false"
            density="compact"
            :model-value="active"
            @change="active = $event.detail.modelValue"
        />
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        With <code>nav={false}</code> + <code>density="compact"</code>, the menu
        looks like a context menu / dropdown — softer fill on the active row,
        tighter spacing.
    </div>
</template>
