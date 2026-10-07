<script setup>
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
            <header mono-nav mono-static mono-density="compact">
                <div mono-inner>
                    <div mono-start><span :style="titleStyle">Compact</span></div>
                    <div mono-center></div>
                    <div mono-end><span style="font-size: 0.78rem; opacity: 0.7;">v1.0.0</span></div>
                </div>
                <div mono-extension></div>
            </header>
        </div>

        <div :style="wrapStyle">
            <div :style="labelStyle">comfortable · 56px</div>
            <header mono-nav mono-static>
                <div mono-inner>
                    <div mono-start><span :style="titleStyle">Comfortable</span></div>
                    <div mono-center></div>
                    <div mono-end><span style="font-size: 0.78rem; opacity: 0.7;">v1.0.0</span></div>
                </div>
                <div mono-extension></div>
            </header>
        </div>

        <div :style="wrapStyle">
            <div :style="labelStyle">default · 64px</div>
            <header mono-nav mono-static mono-density="default">
                <div mono-inner>
                    <div mono-start><span :style="titleStyle">Default</span></div>
                    <div mono-center></div>
                    <div mono-end><span style="font-size: 0.78rem; opacity: 0.7;">v1.0.0</span></div>
                </div>
                <div mono-extension></div>
            </header>
        </div>
    </div>
</template>
