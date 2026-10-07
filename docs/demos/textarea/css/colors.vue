<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 1rem;">
            <div mono-textarea :mono-color="color === 'primary' ? null : color">
                <label mono-label>Outlined</label>
                <textarea mono-native placeholder="Outlined variant" rows="3"></textarea>
            </div>
            <div mono-textarea mono-variant="filled" :mono-color="color === 'primary' ? null : color">
                <label mono-label>Filled</label>
                <textarea mono-native placeholder="Filled variant" rows="3"></textarea>
            </div>
            <div mono-textarea mono-variant="underlined" :mono-color="color === 'primary' ? null : color">
                <label mono-label>Underlined</label>
                <textarea mono-native placeholder="Underlined variant" rows="3"></textarea>
            </div>
        </div>
    </div>
</template>
