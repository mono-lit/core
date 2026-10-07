<script setup>
import { ref } from 'vue'

const active = ref('orders')
const open = ref(new Set(['sales']))

function toggle(id) {
    if (open.value.has(id)) open.value.delete(id)
    else open.value.add(id)
    open.value = new Set(open.value)
}

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div :style="wrapStyle">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li
                    mono-item
                    :mono-active="active === 'dashboard' ? '' : null"
                >
                    <button
                        type="button"
                        mono-action
                        role="option"
                        :aria-selected="active === 'dashboard'"
                        @click="active = 'dashboard'"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-view-dashboard"></span>
                        </span>
                        <span mono-content><span mono-title>Dashboard</span></span>
                    </button>
                </li>

                <li
                    mono-item
                    mono-group
                    :mono-open="open.has('sales') ? '' : null"
                    :mono-active="['orders', 'targets', 'salesman'].includes(active) ? '' : null"
                >
                    <button
                        type="button"
                        mono-group-header
                        :aria-expanded="open.has('sales')"
                        @click="toggle('sales')"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cash-multiple"></span>
                        </span>
                        <span mono-content><span mono-title>Sales</span></span>
                        <span mono-chevron>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                    </button>
                    <ul mono-list mono-group-body>
                        <li
                            mono-item
                            :mono-active="active === 'orders' ? '' : null"
                        >
                            <button
                                type="button"
                                mono-action
                                role="option"
                                :aria-selected="active === 'orders'"
                                @click="active = 'orders'"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-receipt-text-outline"></span>
                                </span>
                                <span mono-content><span mono-title>Orders</span></span>
                            </button>
                        </li>
                        <li
                            mono-item
                            :mono-active="active === 'targets' ? '' : null"
                        >
                            <button
                                type="button"
                                mono-action
                                role="option"
                                :aria-selected="active === 'targets'"
                                @click="active = 'targets'"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-target"></span>
                                </span>
                                <span mono-content><span mono-title>Targets &amp; periode</span></span>
                            </button>
                        </li>
                        <li
                            mono-item
                            :mono-active="active === 'salesman' ? '' : null"
                        >
                            <button
                                type="button"
                                mono-action
                                role="option"
                                :aria-selected="active === 'salesman'"
                                @click="active = 'salesman'"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-car"></span>
                                </span>
                                <span mono-content><span mono-title>Salesman &amp; BA</span></span>
                            </button>
                        </li>
                    </ul>
                </li>

                <li
                    mono-item
                    mono-group
                    :mono-open="open.has('ops') ? '' : null"
                    :mono-active="['klaim', 'logbook', 'master'].includes(active) ? '' : null"
                >
                    <button
                        type="button"
                        mono-group-header
                        :aria-expanded="open.has('ops')"
                        @click="toggle('ops')"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-wrench-outline"></span>
                        </span>
                        <span mono-content><span mono-title>Operations</span></span>
                        <span mono-chevron>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </span>
                    </button>
                    <ul mono-list mono-group-body>
                        <li
                            mono-item
                            :mono-active="active === 'klaim' ? '' : null"
                        >
                            <button
                                type="button"
                                mono-action
                                role="option"
                                :aria-selected="active === 'klaim'"
                                @click="active = 'klaim'"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-clipboard-text-outline"></span>
                                </span>
                                <span mono-content><span mono-title>Klaim</span></span>
                            </button>
                        </li>
                        <li
                            mono-item
                            :mono-active="active === 'logbook' ? '' : null"
                        >
                            <button
                                type="button"
                                mono-action
                                role="option"
                                :aria-selected="active === 'logbook'"
                                @click="active = 'logbook'"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-notebook-outline"></span>
                                </span>
                                <span mono-content><span mono-title>Logbook</span></span>
                            </button>
                        </li>
                        <li
                            mono-item
                            :mono-active="active === 'master' ? '' : null"
                        >
                            <button
                                type="button"
                                mono-action
                                role="option"
                                :aria-selected="active === 'master'"
                                @click="active = 'master'"
                            >
                                <span mono-icon aria-hidden="true">
                                    <span mono-glyph class="i-mdi-file-cabinet"></span>
                                </span>
                                <span mono-content><span mono-title>Data master</span></span>
                            </button>
                        </li>
                    </ul>
                </li>

                <li
                    mono-item
                    :mono-active="active === 'settings' ? '' : null"
                >
                    <button
                        type="button"
                        mono-action
                        role="option"
                        :aria-selected="active === 'settings'"
                        @click="active = 'settings'"
                    >
                        <span mono-icon aria-hidden="true">
                            <span mono-glyph class="i-mdi-cog"></span>
                        </span>
                        <span mono-content><span mono-title>Settings</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Active: <code>{{ active }}</code>. Click a group header to expand or collapse;
        the Sales group is open by default via <code>defaultOpen: true</code>.
    </div>
</template>
