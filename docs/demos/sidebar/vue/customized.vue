<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import { ref, onMounted } from 'vue'



const active = ref('dashboard')

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]

const paneStyle =
    'position: relative; height: 320px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1.25rem 1.25rem 1.25rem calc(220px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
</script>

<template>
    <div :style="paneStyle">
        <mono-sidebar
            mode="permanent"
            color="primary"
            :width="220"
            :contained="true"
            :css-class.prop="{
                panel: 'example-sidebar-panel',
                header: 'example-sidebar-header',
                body: 'example-sidebar-body',
                footer: 'example-sidebar-footer',
            }"
        >
            <div slot="header">Brand</div>
            <mono-menu
                color="primary"
                :items.prop="items"
                :model-value="active"
                @change="active = $event.detail.modelValue"
            />
            <div slot="footer">© 2026</div>
        </mono-sidebar>

        <div :style="contentStyle">
            <p style="margin: 0;">
                The <code>cssClass</code> prop appends per-element classes:
                <code>example-sidebar-panel</code>, <code>example-sidebar-header</code>,
                <code>example-sidebar-body</code>, <code>example-sidebar-footer</code>. Use it to
                apply utility classes (Tailwind, UnoCSS) without forking
                <code>sidebar.css</code>. Body uses <code>&lt;mono-menu&gt;</code>.
            </p>
        </div>
    </div>
</template>

<!-- Global (not scoped) so the rules are adopted into the shadow tree too —
     scoped `:deep()` from a light-DOM ancestor can't cross the shadow boundary. -->
<style>
.example-sidebar-panel {
    background: var(--primary) !important;
}

.example-sidebar-header {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78rem !important;
    font-weight: 800;
    background: color-mix(in oklab, var(--primary-foreground) 10%, transparent);
}

.example-sidebar-body {
    font-size: 0.83rem;
}

.example-sidebar-footer {
    background: color-mix(in oklab, var(--primary-foreground) 18%, transparent);
    text-align: center;
    font-size: 0.7rem;
    opacity: 0.75;
}
</style>
