<script setup>
const brandStyle =
    'display: flex; align-items: center; gap: 0.55rem; font-weight: 800; color: var(--primary); font-size: 0.95rem;'
const logoStyle =
    'width: 28px; height: 28px; border-radius: 7px; background: var(--primary); color: var(--primary-foreground); display: inline-flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800;'
const avatarStyle =
    'display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.65rem 0.25rem 0.3rem; border-radius: 999px; border: 1px solid var(--border); background: var(--card); cursor: pointer; font: inherit;'
const avatarCircleStyle =
    'width: 26px; height: 26px; border-radius: 50%; background: var(--primary); color: var(--primary-foreground); display: inline-flex; align-items: center; justify-content: center; font-size: 0.66rem; font-weight: 700;'
const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle =
    'padding: 1.5rem; color: var(--foreground); font-size: 0.85rem; line-height: 1.6;'
</script>

<template>
    <div :style="wrapStyle">
        <header mono-nav>
            <div mono-inner>
                <div mono-start>
                    <div :style="brandStyle">
                        <span :style="logoStyle">M</span>
                        <span>Mono UI</span>
                    </div>
                </div>
                <div mono-center></div>
                <div mono-end>
                    <button type="button" :style="avatarStyle">
                        <span :style="avatarCircleStyle">JS</span>
                        <span style="font-size: 0.78rem; font-weight: 600;">Jane</span>
                    </button>
                </div>
            </div>
            <div mono-extension></div>
        </header>
        <div :style="bodyStyle">
            Scroll the page — the bar above stays anchored to the top of this preview.
        </div>
    </div>
</template>
