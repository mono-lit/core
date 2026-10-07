<script setup>
import { ref } from 'vue'

const titles = {
    dashboard: 'Dashboard',
    sales: 'Sales',
    targets: 'Targets & periode',
    salesman: 'Salesman & BA',
    klaim: 'Klaim',
    logbook: 'Logbook',
    'master-products': 'Master · Products',
    'master-customers': 'Master · Customers',
}
const active = ref('dashboard')
const open = ref(new Set(['master']))

function pick(id) { if (id) active.value = id }
function toggle(id) {
    if (open.value.has(id)) open.value.delete(id)
    else open.value.add(id)
    open.value = new Set(open.value)
}

const activeTitle = () => titles[active.value] || 'Dashboard'

const paneStyle =
    'position: relative; height: 460px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1.25rem 1.25rem 1.25rem calc(264px + 1.25rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.85rem; line-height: 1.6; overflow-y: auto;'
const brandStyle =
    'display: flex; align-items: center; gap: 0.7rem;'
const logoStyle =
    'width: 36px; height: 36px; border-radius: var(--mono-radius-md); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; flex-shrink: 0;'
</script>

<template>
    <div :style="paneStyle">
        <div mono-sidebar mono-open mono-mode="permanent" mono-effective="permanent" mono-contained style="--mono-sidebar-width: 264px;">
            <div mono-scrim></div>
            <aside mono-panel>
                <div mono-topbar>
                    <div mono-header>
                        <div :style="brandStyle">
                            <span :style="logoStyle">EJ</span>
                            <div>
                                <div style="font-weight: 800; color: inherit; font-size: 0.92rem; line-height: 1.2;">EkaJaya BMS</div>
                                <div style="font-size: 0.66rem; color: color-mix(in srgb, currentColor 62%, transparent); letter-spacing: 0.06em; text-transform: uppercase;">Beauty Mgmt</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div mono-body>
                    <nav mono-menu>
                        <ul mono-list role="listbox">
                            <li mono-subheader>Main</li>
                            <li mono-item :mono-active="active === 'dashboard' ? '' : null">
                                <button type="button" mono-action role="option" :aria-selected="active === 'dashboard'" @click="pick('dashboard')">
                                    <span mono-icon aria-hidden="true">
                                        <span mono-glyph class="i-mdi-view-dashboard"></span>
                                    </span>
                                    <span mono-content><span mono-title>Dashboard</span></span>
                                </button>
                            </li>
                            <li mono-item :mono-active="active === 'sales' ? '' : null">
                                <button type="button" mono-action role="option" :aria-selected="active === 'sales'" @click="pick('sales')">
                                    <span mono-icon aria-hidden="true">
                                        <span mono-glyph class="i-mdi-cash-multiple"></span>
                                    </span>
                                    <span mono-content><span mono-title>Sales</span></span>
                                    <span mono-badge="primary">12</span>
                                </button>
                            </li>
                            <li mono-item :mono-active="active === 'targets' ? '' : null">
                                <button type="button" mono-action role="option" :aria-selected="active === 'targets'" @click="pick('targets')">
                                    <span mono-icon aria-hidden="true">
                                        <span mono-glyph class="i-mdi-target"></span>
                                    </span>
                                    <span mono-content><span mono-title>Targets &amp; periode</span></span>
                                </button>
                            </li>
                            <li mono-item :mono-active="active === 'salesman' ? '' : null">
                                <button type="button" mono-action role="option" :aria-selected="active === 'salesman'" @click="pick('salesman')">
                                    <span mono-icon aria-hidden="true">
                                        <span mono-glyph class="i-mdi-car"></span>
                                    </span>
                                    <span mono-content><span mono-title>Salesman &amp; BA</span></span>
                                </button>
                            </li>

                            <li mono-divider role="separator"></li>
                            <li mono-subheader>Operations</li>
                            <li mono-item :mono-active="active === 'klaim' ? '' : null">
                                <button type="button" mono-action role="option" :aria-selected="active === 'klaim'" @click="pick('klaim')">
                                    <span mono-icon aria-hidden="true">
                                        <span mono-glyph class="i-mdi-clipboard-text-outline"></span>
                                    </span>
                                    <span mono-content><span mono-title>Klaim</span></span>
                                    <span mono-badge="danger">NEW</span>
                                </button>
                            </li>
                            <li mono-item :mono-active="active === 'logbook' ? '' : null">
                                <button type="button" mono-action role="option" :aria-selected="active === 'logbook'" @click="pick('logbook')">
                                    <span mono-icon aria-hidden="true">
                                        <span mono-glyph class="i-mdi-notebook-outline"></span>
                                    </span>
                                    <span mono-content><span mono-title>Logbook</span></span>
                                </button>
                            </li>

                            <li mono-item mono-group :mono-open="open.has('master') ? '' : null">
                                <button
                                    type="button"
                                    mono-group-header
                                    :aria-expanded="open.has('master')"
                                    @click="toggle('master')"
                                >
                                    <span mono-icon aria-hidden="true">
                                        <span mono-glyph class="i-mdi-file-cabinet"></span>
                                    </span>
                                    <span mono-content><span mono-title>Data master</span></span>
                                    <span mono-chevron>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </span>
                                </button>
                                <ul mono-list mono-group-body>
                                    <li mono-item :mono-active="active === 'master-products' ? '' : null">
                                        <button type="button" mono-action role="option" :aria-selected="active === 'master-products'" @click="pick('master-products')">
                                            <span mono-icon aria-hidden="true">
                                                <span mono-glyph class="i-mdi-cart-outline"></span>
                                            </span>
                                            <span mono-content><span mono-title>Products</span></span>
                                        </button>
                                    </li>
                                    <li mono-item :mono-active="active === 'master-customers' ? '' : null">
                                        <button type="button" mono-action role="option" :aria-selected="active === 'master-customers'" @click="pick('master-customers')">
                                            <span mono-icon aria-hidden="true">
                                                <span mono-glyph class="i-mdi-account-group"></span>
                                            </span>
                                            <span mono-content><span mono-title>Customers</span></span>
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div mono-footer>
                    <div style="display: flex; align-items: center; gap: 0.7rem; background: color-mix(in oklab, currentColor 10%, transparent); border-radius: var(--mono-radius-lg); padding: 0.55rem 0.75rem;">
                        <span style="width: 32px; height: 32px; border-radius: 50%; background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0;">AD</span>
                        <div style="line-height: 1.2;">
                            <div style="font-size: 0.78rem; font-weight: 700;">Admin</div>
                            <div style="font-size: 0.66rem; color: color-mix(in srgb, currentColor 62%, transparent);">Super Admin</div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>

        <div :style="contentStyle">
            <h3 style="margin: 0 0 0.6rem; font-size: 0.95rem; font-weight: 800; color: var(--primary); text-transform: capitalize;">{{ activeTitle() }}</h3>
            <p style="margin: 0 0 0.5rem;">
                The full Vuetify-style app shell — <code>.mono-sidebar</code> housing a
                <code>.mono-menu</code> in its body. Click any row to update the active
                state.
            </p>
            <p style="margin: 0; opacity: 0.7;">All structure is declarative — same classes the Lit elements emit.</p>
        </div>
    </div>
</template>
