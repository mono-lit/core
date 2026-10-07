<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
    // Counts the clicks the page receives while the panel is open — the click
    // that closes the panel still lands here.
    const pageClicks = ref(0)
</script>

<template>
    <div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <mono-button @click="open = true">Open without overlay</mono-button>
            <mono-button variant="outline" color="secondary" @click="pageClicks++">Page button · {{ pageClicks }}</mono-button>
        </div>

        <p style="font-size: 0.8rem; color: var(--theme-text); opacity: 0.65; margin: 0.6rem 0 0;">
            With <code>:overlay="false"</code> there's no backdrop and the page behind
            stays interactive. A click outside the panel still closes it
            (<code>close-on-overlay</code>, the default) — and the click goes through:
            hit the page button while the panel is open and the counter moves too.
            <code>:close-on-overlay="false"</code> keeps it open.
        </p>

        <mono-modal
            :overlay="false"
            title="Floating panel"
            :model-value="open"
            @close="open = false"
        >
            <p style="margin: 0;">
                The page behind this dialog still receives clicks and scroll events.
                Click anywhere outside, press the close button or Escape to dismiss.
            </p>
        </mono-modal>
    </div>
</template>
