<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    // Pick a colour, then open the modal: the button and the modal header both
    // take it live, so re-pick while the modal is open to watch it change.
    const color = ref('primary')
    const open = ref(false)

    function cap(s) {
        return s[0].toUpperCase() + s.slice(1)
    }
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; gap: 0.55rem;">
            <mono-button :color="color" size="sm" @click="open = true">Open modal</mono-button>
        </div>

        <mono-modal
            :color="color"
            :title="`${cap(color)} accent`"
            :model-value="open"
            @close="open = false"
        >
            <p style="margin: 0;">
                The thin ring, the glow under the panel and the close-button hover take the {{ color }} accent.
            </p>
        </mono-modal>
    </div>
</template>
