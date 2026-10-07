<script setup>
import { ref } from 'vue'

const tabs = ['overview', 'reports', 'settings']
const active = ref('overview')

const titleStyle = 'font-weight: 800; color: var(--primary); font-size: 1rem;'
const subStyle = 'font-size: 0.72rem; opacity: 0.65; margin-top: 1px;'

function tabBtnStyle(on) {
    return `padding: 0.45rem 0.85rem; border: none; background: transparent; cursor: pointer; font: inherit; font-size: 0.82rem; font-weight: ${on ? 700 : 500}; color: ${on ? 'var(--primary)' : 'color-mix(in oklab, var(--foreground) 65%, transparent)'}; border-bottom: 2px solid ${on ? 'var(--primary)' : 'transparent'}; margin-bottom: -1px;`
}

const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle = 'padding: 1.25rem; color: var(--foreground); font-size: 0.85rem;'
const exportStyle =
    'padding: 0.4rem 0.85rem; border-radius: 7px; border: 1px solid var(--primary); background: var(--primary); color: var(--primary-foreground); cursor: pointer; font: inherit; font-size: 0.8rem; font-weight: 600;'
</script>

<template>
    <div :style="wrapStyle">
        <header mono-nav mono-static mono-has-extension>
            <div mono-inner>
                <div mono-start>
                    <div>
                        <div :style="titleStyle">Analytics</div>
                        <div :style="subStyle">Q3 dashboard</div>
                    </div>
                </div>
                <div mono-center></div>
                <div mono-end>
                    <button type="button" :style="exportStyle">Export</button>
                </div>
            </div>
            <div mono-extension>
                <button
                    v-for="t in tabs"
                    :key="t"
                    type="button"
                    :style="tabBtnStyle(active === t)"
                    @click="active = t"
                >{{ t.charAt(0).toUpperCase() + t.slice(1) }}</button>
            </div>
        </header>
        <div :style="bodyStyle">
            Active tab: <strong>{{ active }}</strong>. The extension row hosts the secondary nav while the main row keeps the title and primary action.
        </div>
    </div>
</template>
