<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import { ref, onMounted } from 'vue'


const active = ref('dashboard')

const items = [
    { id: 'sh-main', type: 'subheader', title: 'Main' },
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'analytics', title: 'Analytics', icon: 'i-mdi-chart-line' },
    { id: 'customers', title: 'Customers', icon: 'i-mdi-account-group' },
    { id: 'orders', title: 'Orders', icon: 'i-mdi-package-variant', badge: 12, badgeColor: 'primary' },
    { id: 'inbox', title: 'Inbox', icon: 'i-mdi-email-outline', badge: 3, badgeColor: 'danger' },
    { id: 'd-1', type: 'divider' },
    { id: 'sh-account', type: 'subheader', title: 'Account' },
    { id: 'profile', title: 'Profile', icon: 'i-mdi-account-circle' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
    { id: 'logout', title: 'Logout', icon: 'i-mdi-logout' },
]

const paneStyle =
    'position: relative; height: 460px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1.25rem 1.25rem 1.25rem calc(248px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
const brandStyle =
    'display: flex; align-items: center; gap: 0.6rem; font-weight: 800; color: inherit; font-size: 0.92rem;'
const logoStyle =
    'width: 30px; height: 30px; border-radius: var(--mono-radius-md); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;'
</script>

<template>
    <div :style="paneStyle">
        <mono-sidebar mode="permanent" :width="248" :contained="true">
            <div slot="header" :style="brandStyle">
                <span :style="logoStyle">M</span>
                <span>Mono UI</span>
            </div>

            <mono-menu
                :items.prop="items"
                :model-value="active"
                @change="active = $event.detail.modelValue"
            />

            <div slot="footer" style="font-size: 0.7rem; opacity: 0.65;">v1.0.0</div>
        </mono-sidebar>

        <div :style="contentStyle">
            <h3 style="margin: 0 0 0.6rem; font-size: 0.95rem; font-weight: 800; color: var(--primary); text-transform: capitalize;">{{ items.find((i) => i.id === active)?.title || 'Dashboard' }}</h3>
            <p style="margin: 0 0 0.5rem;">
                The sidebar body hosts a <code>&lt;mono-menu&gt;</code> whose
                <code>icon</code> field holds an iconify utility class —
                <code>i-mdi-view-dashboard</code>, <code>i-mdi-chart-line</code>,
                etc. UnoCSS's <code>presetIcons</code> paints each class as a
                mask-based SVG that picks up <code>currentColor</code>, so the
                active row's white text carries through to the icon.
            </p>
            <p style="margin: 0; opacity: 0.7;">
                Browse <a href="https://icones.js.org" target="_blank" rel="noreferrer">icones.js.org</a>
                for the full catalog — <code>i-tabler-*</code>,
                <code>i-lucide-*</code>, <code>i-simple-icons-*</code> all work the
                same way.
            </p>
        </div>
    </div>
</template>
