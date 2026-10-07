<script setup>
const navHeight = '56px'

const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle =
    'padding: 1.25rem; color: var(--foreground); font-size: 0.85rem; line-height: 1.7;'
const codeStyle =
    'background: color-mix(in oklab, var(--primary) 8%, transparent); color: var(--primary); padding: 0.1rem 0.4rem; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 0.85em;'
</script>

<template>
    <div :style="[wrapStyle, { '--mono-nav-height': navHeight }]">
        <header mono-nav mono-static>
            <div mono-inner>
                <div mono-start><span style="font-weight: 800; color: var(--primary);">Layout var demo</span></div>
                <div mono-center></div>
                <div mono-end><span style="font-size: 0.78rem; opacity: 0.7;">→ writes to :root</span></div>
            </div>
            <div mono-extension></div>
        </header>
        <div :style="bodyStyle">
            <p style="margin: 0 0 0.5rem;">
                The Lit element writes <code :style="codeStyle">--mono-nav-height</code> on
                <code :style="codeStyle">document.documentElement</code> (this CSS-only demo sets it locally
                for illustration).
            </p>
            <p style="margin: 0; font-family: ui-monospace, monospace; font-size: 1.1rem; color: var(--primary); font-weight: 700;">{{ navHeight }}</p>
            <p style="margin: 0.75rem 0 0; font-size: 0.78rem; opacity: 0.7;">
                Wrap your main content in <code :style="codeStyle">.mono-layout-content</code>
                and it pads itself below the nav automatically — no prop drilling.
            </p>
        </div>
    </div>
</template>
