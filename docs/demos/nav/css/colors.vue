<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (surface is the default and emits nothing, and so
// is the `elevated` variant).
const color = ref('surface')

const wrapStyle =
    'background: var(--muted); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); padding: 0.85rem;'
const labelStyle =
    'font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--foreground); opacity: 0.55; margin-bottom: 0.4rem;'
const titleStyle = 'font-weight: 700; font-size: 0.9rem; text-transform: capitalize;'
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="nav" />
        </DemoControls>

        <div style="display: grid; gap: 0.5rem;">
            <div :style="wrapStyle">
                <div :style="labelStyle">variant="flat"</div>
                <header mono-nav mono-static mono-variant="flat" :mono-color="color === 'surface' ? null : color">
                    <div mono-inner>
                        <div mono-start><span :style="titleStyle">flat</span></div>
                        <div mono-center></div>
                        <div mono-end></div>
                    </div>
                    <div mono-extension></div>
                </header>
            </div>

            <div :style="wrapStyle">
                <div :style="labelStyle">variant="elevated"</div>
                <header mono-nav mono-static :mono-color="color === 'surface' ? null : color">
                    <div mono-inner>
                        <div mono-start><span :style="titleStyle">elevated</span></div>
                        <div mono-center></div>
                        <div mono-end></div>
                    </div>
                    <div mono-extension></div>
                </header>
            </div>

            <div :style="wrapStyle">
                <div :style="labelStyle">variant="outlined"</div>
                <header mono-nav mono-static mono-variant="outlined" :mono-color="color === 'surface' ? null : color">
                    <div mono-inner>
                        <div mono-start><span :style="titleStyle">outlined</span></div>
                        <div mono-center></div>
                        <div mono-end></div>
                    </div>
                    <div mono-extension></div>
                </header>
            </div>
        </div>
    </div>
</template>
