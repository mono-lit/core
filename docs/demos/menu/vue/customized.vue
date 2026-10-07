<script setup>
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('dashboard')

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple', badge: 12 },
    { id: 'targets', title: 'Targets', icon: 'i-mdi-target' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-menu
            :items.prop="items"
            color="success"
            :model-value="active"
            @change="active = $event.detail.modelValue"
            :css-class.prop="{
                action: 'example-menu-action',
                title: 'example-menu-title',
                badge: 'example-menu-badge',
            }"
        />
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        The <code>cssClass</code> prop appends per-element classes —
        <code>example-menu-action</code>, <code>example-menu-title</code>,
        <code>example-menu-badge</code> in this demo. Combine with utility classes
        (Tailwind / UnoCSS) to override styling without forking
        <code>menu.css</code>.
    </div>
</template>

<!-- Global (not scoped) so the rules are adopted into the shadow tree too —
     scoped `:deep()` from a light-DOM ancestor can't cross the shadow boundary. -->
<style>
.example-menu-action {
    border-radius: 99px !important;
}

.example-menu-title {
    letter-spacing: 0.01em;
    font-weight: 600;
}

.example-menu-badge {
    font-family: ui-monospace, monospace;
    border: 1px dashed currentColor;
}
</style>
