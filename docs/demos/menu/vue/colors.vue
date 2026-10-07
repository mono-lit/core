<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

// Pick a colour; the active pill and the hover wash take it. `surface` is the
// untinted upstream look (neutral wash, inked active row).
const color = ref('primary')
const active = ref('dashboard')

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'reports', title: 'Reports', icon: 'i-mdi-notebook-outline' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="nav" />
        </DemoControls>

        <div :style="wrapStyle">
            <mono-menu
                :items.prop="items"
                :color="color"
                :model-value="active"
                @change="active = $event.detail.modelValue"
            />
        </div>
    </div>
</template>
