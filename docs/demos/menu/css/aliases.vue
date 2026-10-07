<script setup>
import { ref } from 'vue'

const active = ref('post-budget')
function pick(id) { active.value = id }

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div :style="wrapStyle">
        <nav mono-menu>
            <ul mono-list role="listbox">
                <li mono-item :mono-active="active === 'dashboard' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'dashboard'" @click="pick('dashboard')">
                        <span mono-icon mono-alias aria-hidden="true" data-mono-alias="D">D</span>
                        <span mono-content><span mono-title>Dashboard</span></span>
                    </button>
                </li>
                <li mono-item :mono-active="active === 'post-budget' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'post-budget'" @click="pick('post-budget')">
                        <span mono-icon mono-alias aria-hidden="true" data-mono-alias="PB">PB</span>
                        <span mono-content><span mono-title>Post Budget</span></span>
                    </button>
                </li>
                <li mono-item :mono-active="active === 'sales-order' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'sales-order'" @click="pick('sales-order')">
                        <span mono-icon mono-alias aria-hidden="true" data-mono-alias="SO">SO</span>
                        <span mono-content><span mono-title>Sales Order</span></span>
                    </button>
                </li>
                <li mono-item :mono-active="active === 'klaim' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'klaim'" @click="pick('klaim')">
                        <span mono-icon mono-alias aria-hidden="true" data-mono-alias="K">K</span>
                        <span mono-content><span mono-title>Klaim</span></span>
                    </button>
                </li>

                <li mono-divider role="separator"></li>
                <li mono-subheader>Account</li>

                <li mono-item :mono-active="active === 'profile' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'profile'" @click="pick('profile')">
                        <span mono-icon mono-alias aria-hidden="true" data-mono-alias="P">P</span>
                        <span mono-content><span mono-title>Profile</span></span>
                    </button>
                </li>
                <li mono-item :mono-active="active === 'settings' ? '' : null">
                    <button type="button" mono-action role="option" :aria-selected="active === 'settings'" @click="pick('settings')">
                        <span mono-icon mono-alias aria-hidden="true" data-mono-alias="S">S</span>
                        <span mono-content><span mono-title>Settings</span></span>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Each row's icon is missing, so the renderer derives an alias from the
        title — <code>"Dashboard"</code> → <strong>D</strong>,
        <code>"Post Budget"</code> → <strong>PB</strong>,
        <code>"Sales Order"</code> → <strong>SO</strong>. In a rail-mode
        sidebar where labels are hidden, this alias becomes the only visual
        cue for the row.
    </div>
</template>
