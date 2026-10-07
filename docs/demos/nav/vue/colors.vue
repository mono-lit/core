<script setup>
import '@mono-lit/helper/ui/nav'
import { ref } from 'vue'

// Pick a colour and every variant takes it: the bar paints in the role and inks
// in that role's -foreground. `surface` is the unpainted default — the variant
// differences (shadow / none / bottom border) read best there.
const color = ref('surface')

const variants = ['flat', 'elevated', 'outlined']

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
            <div v-for="v in variants" :key="v" :style="wrapStyle">
                <div :style="labelStyle">variant="{{ v }}"</div>
                <mono-nav :variant="v" :color="color" :sticky="false" density="comfortable">
                    <span slot="start" :style="titleStyle">{{ v }}</span>
                </mono-nav>
            </div>
        </div>
    </div>
</template>
