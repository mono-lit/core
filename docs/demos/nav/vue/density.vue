<script setup>
import '@mono-lit/helper/ui/nav'
const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted); margin-bottom: 0.6rem;'
const labelStyle =
    'padding: 0.4rem 1rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--foreground); opacity: 0.55; background: var(--card);'
const titleStyle = 'font-weight: 700; color: var(--primary); font-size: 0.92rem;'
</script>

<template>
    <div style="display: grid; gap: 0.4rem;">
        <div :style="wrapStyle">
            <div :style="labelStyle">compact · 48px</div>
            <mono-nav density="compact" :sticky="false">
                <span slot="start" :style="titleStyle">Compact</span>
                <span slot="end" style="font-size: 0.78rem; opacity: 0.7;">v1.0.0</span>
            </mono-nav>
        </div>

        <div :style="wrapStyle">
            <div :style="labelStyle">comfortable · 56px</div>
            <mono-nav density="comfortable" :sticky="false">
                <span slot="start" :style="titleStyle">Comfortable</span>
                <span slot="end" style="font-size: 0.78rem; opacity: 0.7;">v1.0.0</span>
            </mono-nav>
        </div>

        <div :style="wrapStyle">
            <div :style="labelStyle">default · 64px</div>
            <mono-nav density="default" :sticky="false">
                <span slot="start" :style="titleStyle">Default</span>
                <span slot="end" style="font-size: 0.78rem; opacity: 0.7;">v1.0.0</span>
            </mono-nav>
        </div>
    </div>
</template>
