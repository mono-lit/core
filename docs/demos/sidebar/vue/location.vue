<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import { ref, onMounted } from 'vue'



const leftActive = ref('dashboard')
const rightActive = ref('activity')

const leftItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]

const rightItems = [
    { id: 'activity', title: 'Activity', icon: 'i-mdi-clipboard-text-outline' },
    { id: 'notifications', title: 'Notifications', icon: 'i-mdi-bell-outline' },
    { id: 'team', title: 'Team', icon: 'i-mdi-account-group' },
]

const paneStyle =
    'position: relative; height: 360px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted); margin-bottom: 0.6rem;'
const leftStyle =
    'padding: 1.25rem 1.25rem 1.25rem calc(200px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
const rightStyle =
    'padding: 1.25rem calc(200px + 1.25rem) 1.25rem 1.25rem; height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
</script>

<template>
    <div>
        <div :style="paneStyle">
            <mono-sidebar mode="permanent" location="left" :width="200" :contained="true">
                <div slot="header" style="font-weight: 800; color: inherit;">Left</div>
                <mono-menu
                    :items.prop="leftItems"
                    :model-value="leftActive"
                    @change="leftActive = $event.detail.modelValue"
                />
            </mono-sidebar>
            <div :style="leftStyle">
                <p style="margin: 0;"><code>location="left"</code> — sidebar anchored to the left, content padded on the left.</p>
            </div>
        </div>

        <div :style="paneStyle">
            <mono-sidebar mode="permanent" location="right" :width="200" :contained="true">
                <div slot="header" style="font-weight: 800; color: inherit;">Right</div>
                <mono-menu
                    :items.prop="rightItems"
                    :model-value="rightActive"
                    @change="rightActive = $event.detail.modelValue"
                />
            </mono-sidebar>
            <div :style="rightStyle">
                <p style="margin: 0;"><code>location="right"</code> — sidebar anchored to the right, content padded on the right. Common for activity panels and chat.</p>
            </div>
        </div>
    </div>
</template>
