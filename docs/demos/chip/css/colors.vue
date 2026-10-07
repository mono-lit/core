<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing, and so
// is the `soft` variant).
const color = ref('primary')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="chip" />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;">
            <div mono-chip :mono-color="color === 'primary' ? null : color">
                <span mono-main>
                    <span mono-content>
                        <span mono-label>Soft</span>
                    </span>
                </span>
            </div>
            <div mono-chip mono-variant="solid" :mono-color="color === 'primary' ? null : color">
                <span mono-main>
                    <span mono-content>
                        <span mono-label>Solid</span>
                    </span>
                </span>
            </div>
            <div mono-chip mono-variant="outline" :mono-color="color === 'primary' ? null : color">
                <span mono-main>
                    <span mono-content>
                        <span mono-label>Outline</span>
                    </span>
                </span>
            </div>
        </div>
    </div>
</template>
