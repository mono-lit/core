<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const active = ref(null)
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.55rem;">
        <mono-button size="sm" @click="active = 'narrow'">Narrow (280px)</mono-button>
        <mono-button size="sm" @click="active = 'wide'">Wide (60%)</mono-button>
        <mono-button size="sm" @click="active = 'full'">Full width</mono-button>
        <mono-button size="sm" @click="active = 'sheet'">Bottom sheet (40vh)</mono-button>
        <mono-button size="sm" @click="active = 'preset'">Preset width="xl"</mono-button>
        <mono-button size="sm" @click="active = 'presetH'">Preset height="lg"</mono-button>

        <!-- `width` applies to left/right drawers; the other axis is pinned by
             `position`. A number is read as px. -->
        <mono-drawer
            position="right" width="280" title="width=&quot;280&quot;"
            :model-value="active === 'narrow'" @close="active = null"
        >
            <p style="margin: 0;">A narrow rail. Content scale is untouched by this.</p>
        </mono-drawer>

        <mono-drawer
            position="right" width="60%" title="width=&quot;60%&quot;"
            :model-value="active === 'wide'" @close="active = null"
        >
            <p style="margin: 0;">Any CSS length works — <code>%</code>, <code>rem</code>, <code>vw</code>.</p>
        </mono-drawer>

        <!-- Replaces the old `size="full"`. -->
        <mono-drawer
            position="right" width="100%" title="width=&quot;100%&quot;"
            :model-value="active === 'full'" @close="active = null"
        >
            <p style="margin: 0;">Edge to edge — this is what <code>size="full"</code> used to do.</p>
        </mono-drawer>

        <!-- Preset tokens: the same xs…xxl names `size` uses, but for the MEASURE.
             `size` here stays `sm`, so this is a compact drawer in a wide panel. -->
        <mono-drawer
            position="right" size="sm" width="xl" title="size=&quot;sm&quot; width=&quot;xl&quot;"
            :model-value="active === 'preset'" @close="active = null"
        >
            <p style="margin: 0;">
                <code>width="xl"</code> resolves to <code>720px</code>. The type and padding
                stay at <code>size="sm"</code> — the two props are independent axes.
            </p>
        </mono-drawer>

        <!-- On a top/bottom drawer the token resolves on the height ladder instead. -->
        <mono-drawer
            position="bottom" height="lg" title="height=&quot;lg&quot;"
            :model-value="active === 'presetH'" @close="active = null"
        >
            <p style="margin: 0;">
                The same token names a different ladder per axis:
                <code>height="lg"</code> is <code>70vh</code>.
            </p>
        </mono-drawer>

        <!-- `height` is the one that matters for top/bottom drawers. -->
        <mono-drawer
            position="bottom" height="40vh" title="height=&quot;40vh&quot;"
            :model-value="active === 'sheet'" @close="active = null"
        >
            <p style="margin: 0;">For top/bottom drawers, set <code>height</code> instead.</p>
        </mono-drawer>
    </div>
</template>
