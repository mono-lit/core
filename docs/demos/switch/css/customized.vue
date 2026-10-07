<script setup>
import { ref } from 'vue'

const wifi = ref(true)
const bluetooth = ref(false)
const airplane = ref(false)
</script>

<template>
    <div style="display: grid; gap: 0.75rem; max-width: 24rem;">
        <label mono-switch class="example-switch-card">
            <input mono-input type="checkbox" role="switch" v-model="wifi" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label>
                <span mono-label-text>Wi-Fi</span>
                <span mono-description>Connect to wireless networks automatically.</span>
            </span>
        </label>
        <label mono-switch class="example-switch-card">
            <input mono-input type="checkbox" role="switch" v-model="bluetooth" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label>
                <span mono-label-text>Bluetooth</span>
                <span mono-description>Discover and pair nearby devices.</span>
            </span>
        </label>
        <label mono-switch class="example-switch-card">
            <input mono-input type="checkbox" role="switch" v-model="airplane" />
            <span mono-track aria-hidden="true"><span mono-thumb></span></span>
            <span mono-label>
                <span mono-label-text>Airplane mode</span>
                <span mono-description>Disable all wireless radios at once.</span>
            </span>
        </label>
    </div>
</template>

<style>
    /* mono ships no card variant — this is Basecoat's own recipe, composed with
       your CSS: basecoat@1.0.2 styles/vega.css
       `.field > label:has(input[role='switch'])` (rounded-md border p-3) and
       `.field > label` (has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30,
       dark /10 and /20 — the --mono-mode-checked-* tokens carry the mode delta).

       A GLOBAL (non-scoped) style: the Shadow-DOM tab adopts the page's utility
       sheet into the shadow root, and a scoped :deep() rule cannot cross that
       boundary. */
    .example-switch-card {
        width: 100%;
        padding: calc(var(--mono-spacing) * 3);
        border: var(--mono-border-width) solid var(--border);
        border-radius: var(--mono-radius-md);
        background-color: var(--background);
        transition-property: background-color, border-color;
        transition-timing-function: var(--mono-ease);
        transition-duration: var(--mono-duration);
    }

    .example-switch-card:has([mono-input]:checked) {
        border-color: color-mix(in oklab, var(--primary) var(--mono-mode-checked-border), transparent);
        background-color: color-mix(in oklab, var(--primary) var(--mono-mode-checked-bg), transparent);
    }
</style>
