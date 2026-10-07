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
            <label mono-checkbox :mono-color="color === 'primary' ? null : color">
                <input mono-input type="checkbox">
                <span mono-box aria-hidden="true"></span>
                <div mono-label>
                    <span mono-label-text>Unchecked</span>
                </div>
            </label>
            <label mono-checkbox :mono-color="color === 'primary' ? null : color">
                <input mono-input type="checkbox" checked>
                <span mono-box aria-hidden="true"></span>
                <div mono-label>
                    <span mono-label-text>Checked</span>
                </div>
            </label>
            <label mono-checkbox mono-indeterminate :mono-color="color === 'primary' ? null : color">
                <input mono-input type="checkbox">
                <span mono-box aria-hidden="true"></span>
                <div mono-label>
                    <span mono-label-text>Indeterminate</span>
                </div>
            </label>
            <label mono-checkbox mono-disabled :mono-color="color === 'primary' ? null : color">
                <input mono-input type="checkbox" checked disabled>
                <span mono-box aria-hidden="true"></span>
                <div mono-label>
                    <span mono-label-text>Disabled, checked</span>
                </div>
            </label>
        </div>
    </div>
</template>
