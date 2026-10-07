<script setup>
import { ref } from 'vue'

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
const leftActive = ref('dashboard')
const rightActive = ref('activity')

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
            <div mono-sidebar mono-open mono-mode="permanent" mono-effective="permanent" mono-contained style="--mono-sidebar-width: 200px; --mono-sidebar-rail-width: 64px;">
                <div mono-scrim></div>
                <aside mono-panel style="width: 200px;">
                    <div mono-topbar>
                        <div mono-header><div style="font-weight: 800; color: inherit;">Left</div></div>
                    </div>
                    <div mono-body>
                        <nav mono-menu>
                            <ul mono-list role="listbox">
                                <li
                                    v-for="it in leftItems"
                                    :key="it.id"
                                    mono-item
                                    :mono-active="leftActive === it.id ? '' : null"
                                >
                                    <button
                                        type="button"
                                        mono-action
                                        role="option"
                                        :aria-selected="leftActive === it.id"
                                        @click="leftActive = it.id"
                                    >
                                        <span mono-icon aria-hidden="true">
                                            <span mono-glyph :class="it.icon"></span>
                                        </span>
                                        <span mono-content><span mono-title>{{ it.title }}</span></span>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </aside>
            </div>
            <div :style="leftStyle">
                <p style="margin: 0;"><code>location="left"</code> — sidebar anchored to the left, content padded on the left.</p>
            </div>
        </div>

        <div :style="paneStyle">
            <div mono-sidebar mono-open mono-mode="permanent" mono-effective="permanent" mono-location="right" mono-contained style="--mono-sidebar-width: 200px; --mono-sidebar-rail-width: 64px;">
                <div mono-scrim></div>
                <aside mono-panel style="width: 200px;">
                    <div mono-topbar>
                        <div mono-header><div style="font-weight: 800; color: inherit;">Right</div></div>
                    </div>
                    <div mono-body>
                        <nav mono-menu>
                            <ul mono-list role="listbox">
                                <li
                                    v-for="it in rightItems"
                                    :key="it.id"
                                    mono-item
                                    :mono-active="rightActive === it.id ? '' : null"
                                >
                                    <button
                                        type="button"
                                        mono-action
                                        role="option"
                                        :aria-selected="rightActive === it.id"
                                        @click="rightActive = it.id"
                                    >
                                        <span mono-icon aria-hidden="true">
                                            <span mono-glyph :class="it.icon"></span>
                                        </span>
                                        <span mono-content><span mono-title>{{ it.title }}</span></span>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </aside>
            </div>
            <div :style="rightStyle">
                <p style="margin: 0;"><code>location="right"</code> — sidebar anchored to the right, content padded on the right. Common for activity panels and chat.</p>
            </div>
        </div>
    </div>
</template>
