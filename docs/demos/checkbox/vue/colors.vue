<script setup>
import '@mono-lit/helper/ui/checkbox'
import { ref } from 'vue'

// Pick a colour and every state re-paints with it: the checked box and the
// indeterminate bar take the colour; the disabled row shows it dimmed.
const color = ref('primary')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 0.5rem;">
            <mono-checkbox :color="color" label="Unchecked" />
            <mono-checkbox :color="color" model-value label="Checked" />
            <mono-checkbox :color="color" indeterminate label="Indeterminate" />
            <mono-checkbox :color="color" disabled model-value label="Disabled, checked" />
        </div>
    </div>
</template>
