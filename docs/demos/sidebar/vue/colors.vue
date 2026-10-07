<script setup>
import '@mono-lit/helper/ui/sidebar'
import { ref } from 'vue'

// Pick a colour and every variant takes it: the panel paints in the role and
// inks in that role's on-accent end. `surface` is the unpainted default — the
// variant differences (edge shadow / none / border) read best there. `color`
// also takes any CSS color (`#7c3aed`), derived to a readable ink by luminance.
const color = ref('surface')

const variants = ['flat', 'elevated', 'outlined']

const paneStyle =
    'position: relative; height: 180px; border: 1px solid var(--border); border-radius: var(--mono-sidebar-radius, var(--mono-radius-lg)); overflow: hidden; background: var(--muted);'
const contentStyle =
    'padding: 1rem 1rem 1rem calc(180px + 1rem); height: 100%; box-sizing: border-box; color: var(--foreground); font-size: 0.82rem;'
const labelStyle =
    'font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--foreground); opacity: 0.55; margin-bottom: 0.3rem;'
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="nav" />
        </DemoControls>

        <div style="display: grid; gap: 0.6rem;">
            <div v-for="v in variants" :key="v" :style="paneStyle">
                <mono-sidebar
                    mode="permanent"
                    :variant="v"
                    :color="color"
                    :width="180"
                    :contained="true"
                >
                    <div slot="header" style="font-weight: 800; color: inherit; text-transform: capitalize;">{{ v }}</div>
                    <p style="margin: 0; font-size: 0.78rem; opacity: 0.7;">Sidebar content</p>
                </mono-sidebar>
                <div :style="contentStyle">
                    <div :style="labelStyle">variant="{{ v }}"</div>
                    <p style="margin: 0;">{{ v === 'flat' ? 'No shadow, no border.' : v === 'elevated' ? 'Edge shadow.' : 'Border on the edge.' }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
