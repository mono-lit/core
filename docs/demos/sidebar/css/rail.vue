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
const expanded = ref(false)

const paneStyle =
    'position: relative; height: 360px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle = (isOpen) =>
    `padding: 1.25rem 1.25rem 1.25rem calc(${isOpen ? '220px' : '64px'} + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto; transition: padding 0.22s ease;`

function toggle() {
    expanded.value = !expanded.value
}
</script>

<template>
    <div :style="paneStyle">
        <div
            mono-sidebar mono-mode="rail" mono-effective="rail" mono-contained
            :mono-open="expanded ? '' : null"
            style="--mono-sidebar-width: 220px; --mono-sidebar-rail-width: 64px;"
        >
            <div mono-scrim></div>
            <aside mono-panel>
                <div mono-topbar>
                    <div mono-header>
                        <div style="display: flex; align-items: center; gap: 0.55rem; font-weight: 800; color: inherit; font-size: 0.9rem; white-space: nowrap;">
                            <span style="width: 28px; height: 28px; border-radius: var(--mono-radius-md); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; flex-shrink: 0;">M</span>
                            <span class="mono-sidebar-label">Mono UI</span>
                        </div>
                    </div>
                    <div mono-rail>
                        <button
                            type="button"
                            mono-rail-toggle
                            :aria-label="expanded ? 'Collapse sidebar' : 'Expand sidebar'"
                            @click="toggle"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
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
            </aside>
        </div>

        <div :style="contentStyle(expanded)">
            <p style="margin: 0;">
                Rail mode shows icons only at <code>railWidth</code> (64 px). Click the
                toggle on the rail edge to expand to full <code>width</code> (220 px).
                Body uses a <code>.mono-menu</code> — titles clip when the panel is
                narrow.
            </p>
        </div>
    </div>
</template>
