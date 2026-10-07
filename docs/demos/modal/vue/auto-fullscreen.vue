<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

    // Tailwind's values — the same ones `auto-fullscreen` accepts.
    const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
    const bpOptions = Object.entries(BREAKPOINTS).map(([token, px]) => ({ value: token, label: `${token} — under ${px}px` }))

    const bp = ref('sm')
    const open = ref(false)
    const width = ref(false)

    // Live viewport readout, so the effect is visible without resizing the window:
    // pick a breakpoint above your current width and the modal goes full screen.
    const vw = ref(0)
    let onResize

    onMounted(() => {
        onResize = () => (vw.value = document.documentElement.clientWidth)
        onResize()
        window.addEventListener('resize', onResize)
    })

    onBeforeUnmount(() => window.removeEventListener('resize', onResize))

    // Exactly the query the CSS uses — the boundary is exclusive, so at 1024px
    // `lg:` already applies and `auto-fullscreen="lg"` deliberately does not.
    const active = computed(() => vw.value > 0 && vw.value < BREAKPOINTS[bp.value])
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <DemoControls gap="0">
            <DemoSelect v-model="bp" label="Breakpoint" :options="bpOptions" />

            <DemoCheck v-model="width">also set <code>width="560px"</code></DemoCheck>

            <span>
                viewport <strong>{{ vw }}px</strong> —
                <strong>{{ active ? 'full screen' : 'normal' }}</strong>
            </span>
        </DemoControls>

        <div>
            <mono-button size="sm" @click="open = true">Open modal</mono-button>
        </div>

        <!--
            `auto-fullscreen` alone would mean `sm`. Binding the token moves the
            boundary; an authored `width` is overridden while it applies and handed
            back above it.
        -->
        <mono-modal
            :auto-fullscreen="bp"
            :width="width ? '560px' : undefined"
            title="Auto full-screen"
            :model-value="open"
            @close="open = false"
        >
            <p style="margin: 0 0 0.75rem;">
                This modal is <code>auto-fullscreen="{{ bp }}"</code>, so it fills the screen below
                <strong>{{ BREAKPOINTS[bp] }}px</strong> and keeps its normal size above.
            </p>
            <p style="margin: 0 0 0.75rem;">
                Right now the viewport is <strong>{{ vw }}px</strong>, so it is rendering
                <strong>{{ active ? 'full screen' : 'at its normal size' }}</strong>. Pick a larger
                breakpoint above — or narrow the window — to flip it without closing the modal.
            </p>
            <p style="margin: 0;" v-if="width">
                <code>width="560px"</code> is set too. While full screen it is overridden; above the
                breakpoint the panel goes back to 560px.
            </p>
        </mono-modal>
    </div>
</template>
