<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    const selected = ref('pro')

    function pick(event) {
        selected.value = event.detail.modelValue
    }
</script>

<template>
    <div style="display: grid; gap: 0.75rem; max-width: 24rem;">
        <mono-radio
            label="Starter"
            sublabel="For solo developers and small projects."
            value="starter"
            :model-value="selected"
            :css-class="{ root: 'example-radio-card' }"
            @change="pick"
        ></mono-radio>
        <mono-radio
            label="Pro"
            sublabel="For growing teams that need more seats and support."
            value="pro"
            :model-value="selected"
            :css-class="{ root: 'example-radio-card' }"
            @change="pick"
        ></mono-radio>
        <mono-radio
            label="Enterprise"
            sublabel="Custom limits, SSO and a dedicated account manager."
            value="enterprise"
            :model-value="selected"
            :css-class="{ root: 'example-radio-card' }"
            @change="pick"
        ></mono-radio>
    </div>
</template>

<style>
    /* mono ships no card variant — this is Basecoat's own recipe, composed with
       your CSS: basecoat@1.0.2 styles/vega.css
       `.field > label:has(input[type='radio'])` (rounded-md border p-3) and
       `.field > label` (has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30,
       dark /10 and /20 — the --mono-mode-checked-* tokens carry the mode delta).

       A GLOBAL (non-scoped) style: the Shadow-DOM tab adopts the page's utility
       sheet into the shadow root, and a scoped :deep() rule cannot cross that
       boundary. */
    .example-radio-card {
        width: 100%;
        padding: calc(var(--mono-spacing) * 3);
        border: var(--mono-border-width) solid var(--border);
        border-radius: var(--mono-radius-md);
        background-color: var(--background);
        transition-property: background-color, border-color;
        transition-timing-function: var(--mono-ease);
        transition-duration: var(--mono-duration);
    }

    .example-radio-card:has([mono-input]:checked) {
        border-color: color-mix(in oklab, var(--primary) var(--mono-mode-checked-border), transparent);
        background-color: color-mix(in oklab, var(--primary) var(--mono-mode-checked-bg), transparent);
    }
</style>
