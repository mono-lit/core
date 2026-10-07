<script setup>
// The same bar as the Lit twin, hand-written. The Lit version passes the three
// utility classes through the `cssClass` prop; here they sit on the markup
// directly — and everything else, down to the slotted span's own inline style,
// is what `<mono-nav :css-class>` renders.
const wrapStyle =
    'border: 1px solid var(--border); border-radius: var(--mono-nav-radius, var(--mono-radius-xl)); overflow: hidden; background: var(--muted);'
const bodyStyle =
    'padding: 1.25rem; color: var(--foreground); font-size: 0.85rem;'
const actionStyle =
    'padding: 0.35rem 0.8rem; border-radius: 999px; border: 1px solid color-mix(in oklab, currentColor 40%, transparent); background: color-mix(in oklab, currentColor 18%, transparent); color: inherit; cursor: pointer; font: inherit; font-size: 0.78rem; font-weight: 700;'
</script>

<template>
    <div :style="wrapStyle">
        <header mono-nav mono-static mono-color="primary" role="banner">
            <div mono-inner class="example-nav-inner">
                <div mono-start class="example-nav-start">
                    <span style="font-weight: 800; font-size: 0.95rem;">Custom inner</span>
                </div>
                <div mono-center></div>
                <div mono-end class="example-nav-end">
                    <button type="button" :style="actionStyle">Action</button>
                </div>
            </div>
            <div mono-extension></div>
        </header>
        <div :style="bodyStyle">
            <p style="margin: 0;">
                The CSS demo applies the same utility classes
                (<code>example-nav-inner</code>, <code>example-nav-start</code>, <code>example-nav-end</code>)
                directly on the markup — the Lit version applies them via the
                <code>cssClass</code> prop. Same end result, two consumption styles.
            </p>
        </div>
    </div>
</template>

<!-- Deliberately the SAME rules as the Lit twin, `!important` included: the
     slotted span carries its own inline `font-size`, which no stylesheet rule on
     the region can override, so the region's size only reaches content that does
     not set one. Dropping the `!important` (or moving the weight onto the region)
     is what made this tab render the brand two steps smaller than the other two. -->
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
