<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
const selected = ref('medium')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 0.5rem;">
            <label mono-radio :mono-color="color === 'primary' ? null : color">
                <input mono-input type="radio" name="colors-size" value="small" v-model="selected" />
                <span mono-circle aria-hidden="true"></span>
                <span mono-label><span mono-label-text>Small</span></span>
            </label>
            <label mono-radio :mono-color="color === 'primary' ? null : color">
                <input mono-input type="radio" name="colors-size" value="medium" v-model="selected" />
                <span mono-circle aria-hidden="true"></span>
                <span mono-label><span mono-label-text>Medium</span></span>
            </label>
            <label mono-radio :mono-color="color === 'primary' ? null : color">
                <input mono-input type="radio" name="colors-size" value="large" v-model="selected" />
                <span mono-circle aria-hidden="true"></span>
                <span mono-label><span mono-label-text>Large</span></span>
            </label>
            <label mono-radio :mono-color="color === 'primary' ? null : color">
                <input mono-input type="radio" name="colors-disabled" value="disabled" checked disabled />
                <span mono-circle aria-hidden="true"></span>
                <span mono-label><span mono-label-text>Disabled, selected</span></span>
            </label>
        </div>
    </div>
</template>
