<script setup>
import '@mono-lit/helper/ui/dropdown'
import { ref } from 'vue'

// Pick a colour, then open the dropdown: the panel's ring takes it live, so
// re-pick while the panel is open to watch it change.
const color = ref('primary')

const triggerStyle =
    'padding: 0.4rem 0.8rem; border-radius: 7px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.78rem;'
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; gap: 0.85rem; padding: 4rem 1rem; justify-content: center;">
            <mono-dropdown :color="color" placement="bottom-start">
                <button slot="main" type="button" :style="triggerStyle">Open dropdown</button>
                <div slot="body">The panel's ring takes the {{ color }} role colour.</div>
            </mono-dropdown>
        </div>
    </div>
</template>
