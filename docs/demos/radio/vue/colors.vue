<script setup>
    import '@mono-lit/helper/ui/radio'
    import { ref } from 'vue'

    // Pick a colour and the group re-paints with it: the selected dot takes the
    // colour; the disabled option shows it dimmed.
    const color = ref('primary')
    const selected = ref('medium')

    function pick(event) {
        selected.value = event.detail.modelValue
    }
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 0.5rem;">
            <mono-radio :color="color" label="Small" value="small" :model-value="selected" @change="pick"></mono-radio>
            <mono-radio :color="color" label="Medium" value="medium" :model-value="selected" @change="pick"></mono-radio>
            <mono-radio :color="color" label="Large" value="large" :model-value="selected" @change="pick"></mono-radio>
            <mono-radio :color="color" label="Disabled, selected" value="disabled" model-value="disabled" disabled></mono-radio>
        </div>
    </div>
</template>
