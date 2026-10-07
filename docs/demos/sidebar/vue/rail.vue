<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
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
const contentStyle = (isOpen) =>
    `padding: 1.25rem 1.25rem 1.25rem calc(${isOpen ? '220px' : '64px'} + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto; transition: padding 0.22s ease;`
</script>

<template>
    <div :style="paneStyle">
        <mono-sidebar
            mode="rail"
            :width="220"
            :rail-width="64"
            :contained="true"
            :model-value="open"
            @open="open = true"
            @close="open = false"
        >
            <div
                slot="header"
                style="display: flex; align-items: center; gap: 0.55rem; font-weight: 800; color: inherit; font-size: 0.9rem; white-space: nowrap;"
            >
                <span style="width: 28px; height: 28px; border-radius: var(--mono-radius-md); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; flex-shrink: 0;">M</span>
                <span class="mono-sidebar-label">Mono UI</span>
            </div>


                <mono-menu
                    :items.prop="items"
                    :model-value="active"
                    @change="active = $event.detail.modelValue"
                />

        </mono-sidebar>

        <div :style="contentStyle(open)">
            <p style="margin: 0;">
                Rail mode shows icons only at <code>railWidth</code> (64 px). Click
                the toggle on the rail edge to expand to full <code>width</code>
                (220 px). State: <strong>{{ open ? 'expanded' : 'collapsed' }}</strong>.
                Active row: <code>{{ active }}</code>.
            </p>
        </div>
    </div>
</template>