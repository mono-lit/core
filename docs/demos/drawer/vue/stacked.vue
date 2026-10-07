<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const o1 = ref(false)
    const o2 = ref(false)
    const o3 = ref(false)

</script>

<template>
    <div>
        <mono-button size="sm" @click="o1 = true">Open drawer</mono-button>

        <!-- Level 1 — right -->
        <mono-drawer
            stackable
            position="right"
            color="primary"
            title="Level 1 — right"
            :model-value="o1"
            @close="o1 = false"
        >
            <p style="margin: 0 0 1rem;">
                Open a drawer from inside this one — each has <code>stackable</code>, so they
                stack and Escape / overlay-click only affect the topmost.
            </p>
            <mono-button variant="tonal" size="sm" @click="o2 = true">Open drawer inside ↑</mono-button>
        </mono-drawer>

        <!-- Level 2 — left -->
        <mono-drawer
            stackable
            position="left"
            color="success"
            title="Level 2 — left"
            :model-value="o2"
            @close="o2 = false"
        >
            <p style="margin: 0 0 1rem;">
                Second drawer, above the first. Each new level opens from a different edge so
                you can see them stacked — but only one backdrop dims the screen.
            </p>
            <mono-button variant="tonal" color="success" size="sm" @click="o3 = true">Go deeper ↑</mono-button>
        </mono-drawer>

        <!-- Level 3 — bottom -->
        <mono-drawer
            stackable
            position="bottom"
            color="danger"
            title="Level 3 — bottom"
            :model-value="o3"
            @close="o3 = false"
        >
            <p style="margin: 0;">
                Press <kbd>Esc</kbd> to close this one only — the drawers beneath stay open.
            </p>
        </mono-drawer>
    </div>
</template>
