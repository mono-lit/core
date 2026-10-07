<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (surface is the default and emits nothing, and so
// is the `elevated` variant). A literal colour has no slot of its own: write
// `mono-color="custom"` plus --mono-sidebar-accent / --mono-sidebar-on-accent.
const color = ref('surface')

const variants = [
    { name: 'flat', desc: 'No shadow, no border.' },
    { name: 'elevated', desc: 'Edge shadow.' },
    { name: 'outlined', desc: 'Border on the edge.' },
]

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
            <div v-for="v in variants" :key="v.name" :style="paneStyle">
                <div
                    mono-sidebar mono-open mono-mode="permanent" mono-effective="permanent" mono-contained
                    :mono-variant="v.name === 'elevated' ? null : v.name"
                    :mono-color="color === 'surface' ? null : color"
                    style="--mono-sidebar-width: 180px;"
                >
                    <div mono-scrim></div>
                    <aside mono-panel style="width: 180px;">
                        <div mono-topbar>
                            <div mono-header><div style="font-weight: 800; color: inherit; text-transform: capitalize;">{{ v.name }}</div></div>
                        </div>
                        <div mono-body><p style="margin: 0; font-size: 0.78rem; opacity: 0.7;">Sidebar content</p></div>
                    </aside>
                </div>
                <div :style="contentStyle">
                    <div :style="labelStyle">variant="{{ v.name }}"</div>
                    <p style="margin: 0;">{{ v.desc }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
