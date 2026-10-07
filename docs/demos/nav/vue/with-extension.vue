<script setup>
import '@mono-lit/helper/ui/nav'
import { ref } from 'vue'

const tab = ref('overview')
const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
]

const titleStyle = 'font-weight: 800; color: var(--primary); font-size: 1rem;'
const subStyle = 'font-size: 0.72rem; opacity: 0.65; margin-top: 1px;'

function tabBtnStyle(active) {
    return `padding: 0.45rem 0.85rem; border: none; background: transparent; cursor: pointer; font: inherit; font-size: 0.82rem; font-weight: ${active ? 700 : 500}; color: ${active ? 'var(--primary)' : 'color-mix(in oklab, var(--foreground) 65%, transparent)'}; border-bottom: 2px solid ${active ? 'var(--primary)' : 'transparent'}; margin-bottom: -1px;`
}

const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle = 'padding: 1.25rem; color: var(--foreground); font-size: 0.85rem;'
const exportStyle =
    'padding: 0.4rem 0.85rem; border-radius: 7px; border: 1px solid var(--primary); background: var(--primary); color: var(--primary-foreground); cursor: pointer; font: inherit; font-size: 0.8rem; font-weight: 600;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-nav :extension="true" :sticky="false">
            <div slot="start">
                <div :style="titleStyle">Analytics</div>
                <div :style="subStyle">Q3 dashboard</div>
            </div>

            <button slot="end" type="button" :style="exportStyle">Export</button>

            <div slot="extension">
                <button
                    v-for="t in tabs"
                    :key="t.id"
                    type="button"
                    :style="tabBtnStyle(tab === t.id)"
                    @click="tab = t.id"
                >
                    {{ t.label }}
                </button>
            </div>
        </mono-nav>

        <div :style="bodyStyle">
            Active tab: <strong>{{ tab }}</strong>. The extension row hosts the secondary nav while the main row keeps the title and primary action.
        </div>
    </div>
</template>
