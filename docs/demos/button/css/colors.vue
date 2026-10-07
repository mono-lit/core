<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect
                v-model="color"
                label="Color"
                data-color-picker
                colors="button"
            />
        </DemoControls>

        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;">
            <div mono-button :mono-color="color === 'primary' ? null : color">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Solid</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-variant="outline" :mono-color="color === 'primary' ? null : color">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Outline</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-variant="tonal" :mono-color="color === 'primary' ? null : color">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Tonal</span>
                    </div>
                </button>
            </div>
            <div mono-button mono-variant="text" :mono-color="color === 'primary' ? null : color">
                <button mono-native>
                    <div mono-content>
                        <span mono-icon mono-empty></span>
                        <span mono-text>Text</span>
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>
