<script setup>
import { ref } from 'vue'

const open = ref(false)
// Counts the clicks the page receives — the click that closes the panel still lands here.
const pageClicks = ref(0)

</script>

<template>
    <div style="width: 100%;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <div mono-button><button mono-native type="button" @click="open = !open">{{ open ? 'Close panel' : 'Open panel' }}</button></div>
            <div mono-button mono-variant="outline" mono-color="secondary"><button mono-native type="button" @click="pageClicks++">Page button · {{ pageClicks }}</button></div>
        </div>
        <p style="margin: 0.65rem 0 0; font-size: 0.78rem; opacity: 0.7;">
            With the <code>no-overlay</code> modifier the page behind stays interactive.
        </p>

        <div
            mono-drawer mono-size="sm" mono-color="secondary" mono-position="left" mono-no-overlay
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="false"
            :aria-hidden="!open"
        >
            <div mono-overlay></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Filters</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="open = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0;">The page behind this panel stays scrollable and clickable.</p>
                </div>
            </div>
        </div>
    </div>
</template>
