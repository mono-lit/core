<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import '@mono-lit/helper/ui/button'
import { ref } from 'vue'

const expanded = ref(false)
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
    `padding: 1.25rem 1.25rem 1.25rem calc(${isOpen ? '220px' : '64px'} + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto; transition: padding 0.22s ease; display: flex; flex-direction: column; gap: 0.85rem;`


function toggle() {
    expanded.value = !expanded.value
}

function open() {
    expanded.value = true
}

function close() {
    expanded.value = false
}
</script>

<template>
    <div :style="paneStyle">
        <mono-sidebar
            mode="rail"
            :width="220"
            :rail-width="64"
            :contained="true"
            :rail="expanded"
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

        <div :style="contentStyle(expanded)">
            <p style="margin: 0;">
                The default chevron is hidden because <code>:rail</code> is bound.
                State is owned by the parent — toggle it from anywhere.
            </p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <mono-button size="sm" variant="outline" @click="toggle">
                    Toggle ({{ expanded ? 'collapse' : 'expand' }})
                </mono-button>
                <mono-button size="sm" variant="outline" :disabled="expanded" @click="open">Open</mono-button>
                <mono-button size="sm" variant="outline" :disabled="!expanded" @click="close">Close</mono-button>
            </div>
            <p style="margin: 0; opacity: 0.7;">
                Bound state: <code>rail = {{ expanded }}</code>.
                Active row: <code>{{ active }}</code>.
            </p>
        </div>
    </div>
</template>
