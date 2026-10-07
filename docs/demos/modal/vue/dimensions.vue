<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const active = ref(null)

    function open(name) {
        active.value = name
    }
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.55rem;">
        <mono-button size="sm" @click="open('fixed')">Fixed 480 × 520</mono-button>
        <mono-button size="sm" @click="open('wide')">Wide 760px</mono-button>
        <mono-button size="sm" @click="open('minmax')">Min / max</mono-button>
        <mono-button size="sm" @click="open('preset')">Preset width="lg"</mono-button>
        <mono-button size="sm" @click="open('presetMix')">size="sm" width="xl"</mono-button>
        <mono-button size="sm" @click="open('full')">Full screen</mono-button>

        <!-- Numbers are interpreted as px (480 → 480px) -->
        <mono-modal
            :width="480"
            :height="520"
            title="Fixed 480 × 520"
            :model-value="active === 'fixed'"
            @close="active = null"
        >
            <p style="margin: 0;">
                Both <code>width</code> and <code>height</code> are passed as numbers, so they
                resolve to <code>480px</code> and <code>520px</code>.
            </p>
        </mono-modal>

        <!-- CSS string passes through verbatim -->
        <mono-modal
            width="760px"
            title="Wide — 760px"
            :model-value="active === 'wide'"
            @close="active = null"
        >
            <p style="margin: 0;">A wider panel for tables or side-by-side content. Height stays auto.</p>
        </mono-modal>

        <!-- Kebab-case bindings: min-width / max-height -->
        <mono-modal
            min-width="420px"
            max-height="240px"
            title="Min width 420 · max height 240"
            :model-value="active === 'minmax'"
            @close="active = null"
        >
            <p style="margin: 0 0 0.75rem;">
                <code>min-width</code> keeps the panel at least 420px wide; <code>max-height</code>
                caps it at 240px so the body scrolls.
            </p>
            <p style="margin: 0 0 0.75rem;" v-for="n in 6" :key="n">
                Scrollable line {{ n }} — the body grows past the cap and scrolls inside the panel.
            </p>
        </mono-modal>

        <!-- Preset tokens: the same xs…xxl names `size` uses, but for the MEASURE -->
        <mono-modal
            width="lg"
            title="width=&quot;lg&quot;"
            :model-value="active === 'preset'"
            @close="active = null"
        >
            <p style="margin: 0;">
                <code>width="lg"</code> resolves to <code>min(90vw, 680px)</code> — the clamp
                comes with the token, so it can't overflow a phone.
            </p>
        </mono-modal>

        <!-- The two props are independent axes and are meant to be mixed -->
        <mono-modal
            size="sm"
            width="xl"
            title="size=&quot;sm&quot; width=&quot;xl&quot;"
            :model-value="active === 'presetMix'"
            @close="active = null"
        >
            <p style="margin: 0;">
                Compact type and padding from <code>size="sm"</code>, a
                <code>min(95vw, 880px)</code> measure from <code>width="xl"</code>.
            </p>
        </mono-modal>

        <!-- width AND height = "100%" → true full screen (no flag needed) -->
        <mono-modal
            width="100%"
            height="100%"
            title="Full screen"
            :model-value="active === 'full'"
            @close="active = null"
        >
            <p style="margin: 0;">
                Passing <code>width="100%"</code> and <code>height="100%"</code> covers the whole
                viewport — edge to edge, no radius.
            </p>
        </mono-modal>
    </div>
</template>
