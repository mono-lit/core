<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

    // Tailwind's values — the same ones `auto-fullscreen` accepts.
    const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
    const bpOptions = Object.entries(BREAKPOINTS).map(([token, px]) => ({ value: token, label: `${token} — under ${px}px` }))

    const bp = ref('sm')
    const position = ref('right')
    const open = ref(false)

    // Live viewport readout, so the effect is visible without resizing the window:
    // pick a breakpoint above your current width and the drawer goes full screen.
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
            <DemoSelect v-model="position" label="Position" :options="['right', 'left', 'top', 'bottom']" />

            <span>
                viewport <strong>{{ vw }}px</strong> —
                <strong>{{ active ? 'full screen' : 'normal' }}</strong>
            </span>
        </DemoControls>

        <div>
            <mono-button size="sm" @click="open = true">Open drawer</mono-button>
        </div>

        <!--
            `resizeable` is on so you can watch the grab-handle disappear while full
            screen. That is deliberate: over a full-screen panel a drag would move
            nothing yet still record a width, and the drawer would snap to it as soon
            as the viewport grew back past the breakpoint.
        -->
        <mono-drawer
            :auto-fullscreen="bp"
            :position="position"
            width="380px"
            height="45vh"
            resizeable
            title="Auto full-screen"
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
        >
            <p style="margin: 0 0 0.75rem;">
                <code>auto-fullscreen="{{ bp }}"</code> — full screen below
                <strong>{{ BREAKPOINTS[bp] }}px</strong>, authored size above it.
            </p>
            <p style="margin: 0 0 0.75rem;">
                The drawer keeps <code>position="{{ position }}"</code> either way: it still slides
                in from that edge, it just covers the viewport.
            </p>
            <p style="margin: 0;">
                Viewport is <strong>{{ vw }}px</strong> →
                <strong>{{ active ? 'full screen, resize handle hidden' : 'normal, drag the inner edge to resize' }}</strong>.
            </p>
        </mono-drawer>
    </div>
</template>
