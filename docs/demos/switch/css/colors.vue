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

        <div style="display: grid; gap: 0.5rem;">
            <label mono-switch :mono-color="color === 'primary' ? null : color">
                <input mono-input type="checkbox" role="switch" />
                <span mono-track aria-hidden="true"><span mono-thumb></span></span>
                <span mono-label><span mono-label-text>Off</span></span>
            </label>
            <label mono-switch :mono-color="color === 'primary' ? null : color">
                <input mono-input type="checkbox" role="switch" checked />
                <span mono-track aria-hidden="true"><span mono-thumb></span></span>
                <span mono-label><span mono-label-text>On</span></span>
            </label>
            <label mono-switch :mono-color="color === 'primary' ? null : color">
                <input mono-input type="checkbox" role="switch" checked disabled />
                <span mono-track aria-hidden="true"><span mono-thumb></span></span>
                <span mono-label><span mono-label-text>Disabled, on</span></span>
            </label>
        </div>
    </div>
</template>
