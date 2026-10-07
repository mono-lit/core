<script setup>
import '@mono-lit/helper/ui/nav'
const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle =
    'padding: 1.25rem; color: var(--foreground); font-size: 0.85rem;'
const actionStyle =
    'padding: 0.35rem 0.8rem; border-radius: 999px; border: 1px solid color-mix(in oklab, currentColor 40%, transparent); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; cursor: pointer; font: inherit; font-size: 0.78rem; font-weight: 700;'
</script>

<template>
    <div :style="wrapStyle">
        <mono-nav
            color="primary"
            :sticky="false"
            :css-class.prop="{
                inner: 'example-nav-inner',
                start: 'example-nav-start',
                end: 'example-nav-end',
            }"
        >
            <span slot="start" style="font-weight: 800; font-size: 0.95rem;">Custom inner</span>
            <button slot="end" type="button" :style="actionStyle">Action</button>
        </mono-nav>

        <div :style="bodyStyle">
            <p style="margin: 0;">
                The <code>cssClass</code> prop appends per-section classes —
                <code>example-nav-inner</code>, <code>example-nav-start</code>, <code>example-nav-end</code>
                in this demo. Use it to apply utility classes (Tailwind, UnoCSS) without
                touching the component CSS.
            </p>
        </div>
    </div>
</template>

<!-- Global (not scoped) so the rules are adopted into the shadow tree too —
     scoped `:deep()` from a light-DOM ancestor can't cross the shadow boundary. -->
<style>
.example-nav-inner {
    background: color-mix(in oklab, currentColor 5%, transparent);
}

.example-nav-start {
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.82rem !important;
}

.example-nav-end {
    gap: 0.25rem;
}
</style>
