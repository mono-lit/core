<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
    <div style="width: 100%;">
        <div mono-accordion :mono-open="open ? '' : null">
            <button
                type="button"
                mono-head
                :aria-expanded="open"
                @click="open = !open"
            >
                <span mono-heading>
                    <span mono-title>What is @mono-lit/helper?</span>
                </span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                @mono-lit/helper is a small set of Lit-powered web components designed to work in
                Vue, vanilla HTML, or any framework that runs custom elements.
            </div></div>
        </div>
    </div>
</template>
