<script setup>
import '@mono-lit/helper/ui/dropdown'

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.78rem;'

const cardStyle =
    'position: relative; border: 1px dashed color-mix(in srgb, var(--theme-primary) 30%, transparent); border-radius: 12px; height: 320px; padding: 0.75rem; background: var(--theme-surface-soft);'
</script>

<template>
    <div style="padding: 1rem;">
        <p style="font-size: 0.78rem; color: var(--theme-text); opacity: 0.75; margin: 0 0 0.75rem;">
            Each activator below requests <code>placement="bottom-start"</code>. The dropdown panel
            flips to the opposite side and shifts along the cross-axis to stay inside the viewport.
        </p>
        <div :style="cardStyle">
            <div style="position: absolute; top: 0.75rem; left: 0.75rem;">
                <mono-dropdown placement="bottom-start">
                    <button slot="main" type="button" :style="triggerStyle">top-left corner</button>
                    <div slot="body">Asks for bottom-start. Stays bottom because there's room.</div>
                </mono-dropdown>
            </div>

            <div style="position: absolute; top: 0.75rem; right: 0.75rem;">
                <mono-dropdown placement="bottom-start">
                    <button slot="main" type="button" :style="triggerStyle">top-right corner</button>
                    <div slot="body">Shifts left so it doesn't run off the right edge.</div>
                </mono-dropdown>
            </div>

            <div style="position: absolute; bottom: 0.75rem; left: 0.75rem;">
                <mono-dropdown placement="bottom-start">
                    <button slot="main" type="button" :style="triggerStyle">bottom-left corner</button>
                    <div slot="body">Flips to the top because there's no room below.</div>
                </mono-dropdown>
            </div>

            <div style="position: absolute; bottom: 0.75rem; right: 0.75rem;">
                <mono-dropdown placement="bottom-start">
                    <button slot="main" type="button" :style="triggerStyle">bottom-right corner</button>
                    <div slot="body">Flips to the top AND shifts left to stay inside.</div>
                </mono-dropdown>
            </div>
        </div>
    </div>
</template>
