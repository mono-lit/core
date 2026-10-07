<script setup>
import { ref } from 'vue'

const items = [
    { id: 'sh-main', type: 'subheader', title: 'Main' },
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'analytics', title: 'Analytics', icon: 'i-mdi-chart-line' },
    { id: 'customers', title: 'Customers', icon: 'i-mdi-account-group' },
    { id: 'orders', title: 'Orders', icon: 'i-mdi-package-variant', badge: 12, badgeColor: 'primary' },
    { id: 'inbox', title: 'Inbox', icon: 'i-mdi-email-outline', badge: 3, badgeColor: 'danger' },
    { id: 'd-1', type: 'divider' },
    { id: 'sh-account', type: 'subheader', title: 'Account' },
    { id: 'profile', title: 'Profile', icon: 'i-mdi-account-circle' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
    { id: 'logout', title: 'Logout', icon: 'i-mdi-logout' },
]
const active = ref('dashboard')

const activeTitle = () => items.find((i) => i.id === active.value)?.title || 'Dashboard'

const paneStyle =
    'position: relative; height: 460px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1.25rem 1.25rem 1.25rem calc(248px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
const brandStyle =
    'display: flex; align-items: center; gap: 0.6rem; font-weight: 800; color: inherit; font-size: 0.92rem;'
const logoStyle =
    'width: 30px; height: 30px; border-radius: var(--mono-radius-md); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; flex-shrink: 0;'
</script>

<template>
    <div :style="paneStyle">
        <div mono-sidebar mono-open mono-mode="permanent" mono-effective="permanent" mono-contained style="--mono-sidebar-width: 248px;">
            <div mono-scrim></div>
            <aside mono-panel>
                <div mono-topbar>
                    <div mono-header>
                        <div :style="brandStyle">
                            <span :style="logoStyle">M</span>
                            <span>Mono UI</span>
                        </div>
                    </div>
                </div>
                <div mono-body>
                    <nav mono-menu>
                        <ul mono-list role="listbox">
                            <template v-for="it in items" :key="it.id">
                                <li v-if="it.type === 'subheader'" mono-subheader>{{ it.title }}</li>
                                <li v-else-if="it.type === 'divider'" mono-divider role="separator"></li>
                                <li
                                    v-else
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
                                        <span mono-icon>
                                            <span mono-glyph :class="it.icon"></span>
                                        </span>
                                        <span mono-content><span mono-title>{{ it.title }}</span></span>
                                        <span
                                            v-if="it.badge !== undefined"
                                            :mono-badge="it.badgeColor"
                                        >{{ it.badge }}</span>
                                    </button>
                                </li>
                            </template>
                        </ul>
                    </nav>
                </div>
                <div mono-footer style="font-size: 0.7rem; opacity: 0.65;">v1.0.0</div>
            </aside>
        </div>

        <div :style="contentStyle">
            <h3 style="margin: 0 0 0.6rem; font-size: 0.95rem; font-weight: 800; color: var(--primary); text-transform: capitalize;">{{ activeTitle() }}</h3>
            <p style="margin: 0 0 0.5rem;">
                Sidebar body hosts a <code>.mono-menu</code> whose icon spans use
                iconify utility classes (<code>.i-mdi-view-dashboard</code>,
                <code>.i-mdi-chart-line</code>, …). UnoCSS's <code>presetIcons</code>
                paints each class as a mask-based SVG that picks up
                <code>currentColor</code>.
            </p>
            <p style="margin: 0; opacity: 0.7;">
                Browse <a href="https://icones.js.org" target="_blank" rel="noreferrer">icones.js.org</a>
                for the catalog — <code>.i-tabler-*</code>, <code>.i-lucide-*</code>,
                <code>.i-simple-icons-*</code> all work identically.
            </p>
        </div>
    </div>
</template>
