<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
const active = ref('dashboard')

const items = [
    { id: 'dashboard', title: 'Dashboard', icon: 'i-mdi-view-dashboard' },
    { id: 'sales', title: 'Sales', icon: 'i-mdi-cash-multiple' },
    { id: 'reports', title: 'Reports', icon: 'i-mdi-notebook-outline' },
    { id: 'settings', title: 'Settings', icon: 'i-mdi-cog' },
]

const wrapStyle =
    'border: 1px solid var(--theme-border); border-radius: 12px; padding: 0.85rem; background: var(--theme-surface); max-width: 280px;'
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="nav" />
        </DemoControls>

        <div :style="wrapStyle">
            <nav mono-menu :mono-color="color === 'primary' ? null : color">
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
    </div>
</template>
