<script setup>
import { ref } from 'vue'

const open = ref(new Set([1]))

function toggle(idx) {
    if (open.value.has(idx)) open.value.delete(idx)
    else open.value.add(idx)
    open.value = new Set(open.value)
}
</script>

<template>
    <div style="width: 100%; display: grid; gap: 0.55rem;">
        <div
            mono-accordion
            :mono-open="open.has(0) ? '' : null"
        >
            <button
                type="button"
                mono-head
                :aria-expanded="open.has(0)"
                @click="toggle(0)"
            >
                <span mono-heading><span mono-title>Default closed</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Click the head to expand.</div></div>
        </div>
        <div
            mono-accordion
            :mono-open="open.has(1) ? '' : null"
        >
            <button
                type="button"
                mono-head
                :aria-expanded="open.has(1)"
                @click="toggle(1)"
            >
                <span mono-heading><span mono-title>Default open</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Already expanded on first render.</div></div>
        </div>
        <div mono-accordion mono-disabled>
            <button type="button" mono-head aria-expanded="false" disabled>
                <span mono-heading><span mono-title>Disabled, closed</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Cannot toggle.</div></div>
        </div>
        <div mono-accordion mono-open mono-disabled>
            <button type="button" mono-head aria-expanded="true" disabled>
                <span mono-heading><span mono-title>Disabled, open</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>Frozen in the open state.</div></div>
        </div>
    </div>
</template>
