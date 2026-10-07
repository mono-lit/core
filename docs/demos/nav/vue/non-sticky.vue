<script setup>
import '@mono-lit/helper/ui/nav'
const titleStyle = 'font-weight: 800; color: var(--primary); font-size: 0.95rem;'
const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle = 'padding: 1.5rem; color: var(--foreground); font-size: 0.85rem; line-height: 1.6;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-nav :sticky="false" variant="outlined">
            <span slot="start" :style="titleStyle">Inline header</span>
            <span slot="end" style="font-size: 0.75rem; opacity: 0.65;">scrolls with page</span>
        </mono-nav>

        <div :style="bodyStyle">
            <p style="margin: 0 0 0.5rem;">With <code>sticky="false"</code>, the bar behaves like any other inline header. Use this for single-page sections or admin panels where the bar shouldn't follow scroll.</p>
            <p style="margin: 0;">Default is <code>sticky="true"</code> — see the basic demo for the contrasted behavior.</p>
        </div>
    </div>
</template>
