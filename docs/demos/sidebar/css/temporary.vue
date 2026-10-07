<script setup>
import { ref } from 'vue'

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'targets', title: 'Targets', icon: 'i-mdi-target' },
    { id: 'reports', title: 'Reports', icon: 'i-mdi-notebook-outline' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]
const active = ref('dashboard')
const open = ref(false)

const paneStyle =
    'position: relative; height: 360px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1.25rem; height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
</script>

<template>
    <div :style="paneStyle">
        <div
            mono-sidebar mono-mode="temporary" mono-effective="temporary" mono-contained
            :mono-open="open ? '' : null"
            style="--mono-sidebar-width: 240px; --mono-sidebar-rail-width: 64px;"
        >
            <div mono-scrim @click="open = false"></div>
            <aside mono-panel style="width: 240px;">
                <div mono-topbar>
                    <div mono-header><div style="font-weight: 800; color: inherit;">Menu</div></div>
                </div>
                <div mono-body>
                    <nav mono-menu>
                        <ul mono-list role="listbox">
                            <li
                                v-for="it in items"
                                :key="it.id"
                                mono-item
                                :mono-active="active === it.id ? '' : null"
                            >
                                <button
                                    type="button"
                                    mono-action
                                    role="option"
                                    :aria-selected="active === it.id"
                                    @click="active = it.id"
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
                <div mono-footer>
                    <div mono-button mono-size="sm" mono-variant="outline">
                        <button mono-native type="button" @click="open = false">
                            <div mono-content>
                                <span mono-icon mono-empty></span>
                                <span mono-text>Close</span>
                            </div>
                        </button>
                    </div>
                </div>
            </aside>
        </div>

        <div :style="contentStyle">
            <div mono-button>
                <button mono-native type="button" @click="open = true">
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Open menu</span>
                    </div>
                </button>
            </div>
            <p style="margin: 1rem 0 0;">
                Temporary mode floats over the content with a scrim. Click the trigger
                above to open; click the scrim or the close button to dismiss. Body
                uses a <code>.mono-menu</code>.
            </p>
        </div>
    </div>
</template>
