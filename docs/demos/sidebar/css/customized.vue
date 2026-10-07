<script setup>
import { ref } from 'vue'

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]
const active = ref('dashboard')

const paneStyle =
    'position: relative; height: 320px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1.25rem 1.25rem 1.25rem calc(220px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
</script>

<template>
    <div :style="paneStyle">
        <div mono-sidebar mono-open mono-mode="permanent" mono-effective="permanent" mono-color="primary" mono-contained style="--mono-sidebar-width: 220px;">
            <div mono-scrim></div>
            <aside mono-panel class="example-sidebar-panel" style="width: 220px;">
                <div mono-topbar>
                    <div mono-header class="example-sidebar-header"><div>Brand</div></div>
                </div>
                <div mono-body class="example-sidebar-body">
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
                                    <span mono-content>
                                        <span mono-title>{{ it.title }}</span>
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div mono-footer class="example-sidebar-footer"><div>© 2026</div></div>
            </aside>
        </div>

        <div :style="contentStyle">
            <p style="margin: 0;">
                The CSS demo applies the same utility classes (<code>example-sidebar-panel</code>,
                <code>example-sidebar-header</code>, <code>example-sidebar-body</code>,
                <code>example-sidebar-footer</code>) directly on the markup — the Lit version
                applies them via the <code>cssClass</code> prop. Body uses a
                <code>.mono-menu</code>.
            </p>
        </div>
    </div>
</template>

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
