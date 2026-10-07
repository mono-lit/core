<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import { ref, onMounted } from 'vue'

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
    'padding: 1.25rem 1.25rem 1.25rem calc(220px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
const brandStyle =
    'display: flex; align-items: center; gap: 0.55rem; font-weight: 800; color: inherit; font-size: 0.9rem;'
const logoStyle =
    'width: 28px; height: 28px; border-radius: var(--mono-radius-md); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800;'
</script>

<template>
    <div :style="paneStyle">
        <mono-sidebar mode="permanent" :width="220" :contained="true">
            <div slot="header" :style="brandStyle">
                <span :style="logoStyle">M</span>
                <span>Mono UI</span>
            </div>

            <mono-menu
                :items.prop="items"
                :model-value="active"
                @change="active = $event.detail.modelValue"
            />

            <div slot="footer" style="font-size: 0.7rem; opacity: 0.6;">v1.0.0</div>
        </mono-sidebar>

        <div :style="contentStyle">
            <h3 style="margin: 0 0 0.6rem; font-size: 0.95rem; font-weight: 800; color: var(--primary);">Main content</h3>
            <p style="margin: 0;">
                Permanent mode keeps the sidebar visible at all times and the content
                area pads itself by the sidebar's <code>width</code> (220 px here).
                The sidebar writes <code>--mono-sidebar-left-width</code> to
                <code>:root</code> when used outside <code>contained</code>; in
                <code>contained</code> mode (this demo), pad manually as shown.
                Navigation is driven by <code>&lt;mono-menu&gt;</code>.
            </p>
        </div>
    </div>
</template>
