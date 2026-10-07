<script setup>
import { ref } from 'vue'

// The same picker as the Vue tab; the hand-written markup takes the colour as
// the `mono-color` attribute (primary is the default and emits nothing).
const color = ref('primary')
const open = ref(new Set([1]))

function toggle(idx) {
    if (open.value.has(idx)) open.value.delete(idx)
    else open.value.add(idx)
    open.value = new Set(open.value)
}
</script>

<template>
    <div style="width: 100%;">
        <DemoControls>
            <DemoSelect v-model="color" label="Color" colors="form" />
        </DemoControls>

        <div style="display: grid; gap: 0.55rem;">
            <div
                mono-accordion
                :mono-color="color === 'primary' ? null : color"
                :mono-open="open.has(0) ? '' : null"
            >
                <button
                    type="button"
                    mono-head
                    :aria-expanded="open.has(0)"
                    @click="toggle(0)"
                >
                    <span mono-heading><span mono-title>Closed</span></span>
                    <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
                </button>
                <div mono-body role="region"><div>Click the head to expand — the accent takes the picked colour.</div></div>
            </div>
            <div
                mono-accordion
                :mono-color="color === 'primary' ? null : color"
                :mono-open="open.has(1) ? '' : null"
            >
                <button
                    type="button"
                    mono-head
                    :aria-expanded="open.has(1)"
                    @click="toggle(1)"
                >
                    <span mono-heading><span mono-title>Open</span></span>
                    <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
                </button>
                <div mono-body role="region"><div>Accent on the active border, icon background and arrow.</div></div>
            </div>
        </div>
    </div>
</template>
