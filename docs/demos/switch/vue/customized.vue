<script setup>
    import '@mono-lit/helper/ui/switch'
    import { ref } from 'vue'

    const wifi = ref(true)
    const bluetooth = ref(false)
    const airplane = ref(false)

    function bind(target) {
        return (event) => { target.value = event.detail.modelValue }
    }
</script>

<template>
    <div style="display: grid; gap: 0.75rem; max-width: 24rem;">
        <mono-switch
            label="Wi-Fi"
            sublabel="Connect to wireless networks automatically."
            :model-value="wifi"
            :css-class="{ root: 'example-switch-card' }"
            @change="bind(wifi)($event)"
        ></mono-switch>
        <mono-switch
            label="Bluetooth"
            sublabel="Discover and pair nearby devices."
            :model-value="bluetooth"
            :css-class="{ root: 'example-switch-card' }"
            @change="bind(bluetooth)($event)"
        ></mono-switch>
        <mono-switch
            label="Airplane mode"
            sublabel="Disable all wireless radios at once."
            :model-value="airplane"
            :css-class="{ root: 'example-switch-card' }"
            @change="bind(airplane)($event)"
        ></mono-switch>
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
