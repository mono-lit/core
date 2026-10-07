<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
    // Counts the clicks the page receives — the click that closes the panel still lands here.
    const pageClicks = ref(0)

</script>

<template>
    <div style="width: 100%;">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <mono-button @click="open = !open">{{ open ? 'Close panel' : 'Open panel' }}</mono-button>
            <mono-button variant="outline" color="secondary" @click="pageClicks++">Page button · {{ pageClicks }}</mono-button>
        </div>
        <p style="margin: 0.65rem 0 0; font-size: 0.78rem; opacity: 0.7;">
            With <code>:overlay="false"</code> the page behind stays interactive — useful for filter rails or contextual side panels.
            A click outside the panel closes it and still reaches the page (the counter moves); <code>:close-on-overlay="false"</code> keeps it open.
        </p>

        <mono-drawer
            position="left"
            size="sm"
            color="secondary"
            title="Filters"
            :overlay="false"
            :lock-scroll="false"
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
        >
            <p style="margin: 0;">
                The page behind this panel stays scrollable and clickable — click anywhere outside to close.
            </p>
        </mono-drawer>
    </div>
</template>
