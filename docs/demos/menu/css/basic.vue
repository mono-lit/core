<script setup>
import { ref } from 'vue'

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'targets', title: 'Targets & periode', icon: 'i-mdi-target' },
    { id: 'reports', title: 'Reports', icon: 'i-mdi-notebook-outline' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]
const active = ref('dashboard')

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div :style="wrapStyle">
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
    <div style="margin-top: 0.6rem; font-size: 0.78rem; opacity: 0.7;">
        Active: <code>{{ active }}</code>
    </div>
</template>
