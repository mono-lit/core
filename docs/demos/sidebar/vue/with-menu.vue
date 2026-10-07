<script setup>
import '@mono-lit/helper/ui/sidebar'
import '@mono-lit/helper/ui/menu'
import { ref } from 'vue'

const active = ref('dashboard')

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
        <mono-sidebar mode="permanent" :width="264" :contained="true">
            <div slot="header" :style="brandStyle">
                <span :style="logoStyle">EJ</span>
                <div>
                    <div style="font-weight: 800; color: inherit; font-size: 0.92rem; line-height: 1.2;">EkaJaya BMS</div>
                    <div style="font-size: 0.66rem; color: color-mix(in srgb, currentColor 62%, transparent); letter-spacing: 0.06em; text-transform: uppercase;">Beauty Mgmt</div>
                </div>
            </div>

            <mono-menu
                :model-value="active"
                @change="active = $event.detail.modelValue"
            >
                <div slot="body">
                    <mono-menu-list type="subheader" id="sh-main" title="Main"></mono-menu-list>
                    <mono-menu-list type="children" id="dashboard" title="Dashboard" icon="i-mdi-view-dashboard"></mono-menu-list>
                    <mono-menu-list type="children" id="sales" title="Sales" icon="i-mdi-cash-multiple" badge="12" badge-color="primary"></mono-menu-list>
                    <mono-menu-list type="children" id="targets" title="Targets &amp; periode" icon="i-mdi-target"></mono-menu-list>
                    <mono-menu-list type="children" id="salesman" title="Salesman &amp; BA" icon="i-mdi-car"></mono-menu-list>

                    <mono-menu-list type="divider" id="d-1"></mono-menu-list>
                    <mono-menu-list type="subheader" id="sh-ops" title="Operations"></mono-menu-list>
                    <mono-menu-list type="children" id="klaim" title="Klaim" icon="i-mdi-clipboard-text-outline" badge="NEW" badge-color="danger"></mono-menu-list>
                    <mono-menu-list type="children" id="logbook" title="Logbook" icon="i-mdi-notebook-outline"></mono-menu-list>

                    <mono-menu-list type="group" id="master" title="Data master" icon="i-mdi-file-cabinet" default-open>
                        <mono-menu-list type="children" id="master-products" title="Products" icon="i-mdi-cart-outline"></mono-menu-list>
                        <mono-menu-list type="children" id="master-customers" title="Customers" icon="i-mdi-account-group"></mono-menu-list>
                    </mono-menu-list>
                </div>
            </mono-menu>

            <div
                slot="footer"
                style="display: flex; align-items: center; gap: 0.7rem; background: color-mix(in oklab, currentColor 10%, transparent); border-radius: var(--mono-radius-lg); padding: 0.55rem 0.75rem;"
            >
                <span style="width: 32px; height: 32px; border-radius: 50%; background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0;">AD</span>
                <div style="line-height: 1.2;">
                    <div style="font-size: 0.78rem; font-weight: 700;">Admin</div>
                    <div style="font-size: 0.66rem; color: color-mix(in srgb, currentColor 62%, transparent);">Super Admin</div>
                </div>
            </div>
        </mono-sidebar>

        <div :style="contentStyle">
            <h3 style="margin: 0 0 0.6rem; font-size: 0.95rem; font-weight: 800; color: var(--primary); text-transform: capitalize;">{{ titles[active] || 'Dashboard' }}</h3>
            <p style="margin: 0 0 0.5rem;">
                The full Vuetify-style app shell — <code>&lt;mono-sidebar&gt;</code>
                housing a <code>&lt;mono-menu&gt;</code> in its body slot. The
                menu's tree is composed declaratively via stacked
                <code>&lt;mono-menu-list&gt;</code> tags — subheaders, dividers,
                rows, and a nested <code>Data master</code> group all live as
                children of the menu's body slot.
            </p>
            <p style="margin: 0; opacity: 0.7;">All slots are filled declaratively — no hand-rolled markup, no items array.</p>
        </div>
    </div>
</template>
