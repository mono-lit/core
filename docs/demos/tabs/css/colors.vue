<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')

const variants = ['underline', 'pill', 'ghost']
const active = ref(variants.map(() => 0))
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 1.5rem;">
            <div
                v-for="(variant, idx) in variants"
                :key="variant"
                mono-tabs
                :mono-variant="variant"
                :mono-color="color === 'primary' ? null : color"
                role="tablist"
            >
                <button
                    v-for="(label, i) in ['Overview', 'Details', 'History']"
                    :key="label"
                    type="button"
                    mono-tab
                    :aria-selected="active[idx] === i"
                    role="tab"
                    @click="active[idx] = i"
                >
                    <span mono-label>{{ label }}</span>
                </button>
            </div>
        </div>
    </div>
</template>
