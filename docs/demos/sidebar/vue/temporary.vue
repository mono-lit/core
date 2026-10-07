<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import '@mono-lit/helper/ui/button'
import { ref, onMounted } from 'vue'


const open = ref(false)
const active = ref('dashboard')

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'targets', title: 'Targets', icon: 'i-mdi-target' },
    { id: 'reports', title: 'Reports', icon: 'i-mdi-notebook-outline' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]

const paneStyle =
    'position: relative; height: 360px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1.25rem; height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
</script>

<template>
    <div :style="paneStyle">
        <mono-sidebar
            mode="temporary"
            :width="240"
            :contained="true"
            :model-value="open"
            :lock-scroll="false"
            @open="open = true"
            @close="open = false"
        >
            <div slot="header" style="font-weight: 800; color: inherit;">Menu</div>

            <mono-menu
                :items.prop="items"
                :model-value="active"
                @change="active = $event.detail.modelValue"
            />

            <div slot="footer">
                <mono-button size="sm" variant="outline" @click="open = false">Close</mono-button>
            </div>
        </mono-sidebar>

        <div :style="contentStyle">
            <mono-button @click="open = true">Open menu</mono-button>
            <p style="margin: 1rem 0 0;">
                Temporary mode floats over the content. Click the trigger above to
                open; the scrim, the close button, or pressing Escape (when not
                <code>contained</code>) dismiss it.
            </p>
        </div>
    </div>
</template>
