<script setup>
import { ref } from 'vue'

const open = ref(new Set([0]))

function toggle(idx) {
    if (open.value.has(idx)) open.value.delete(idx)
    else open.value.add(idx)
    open.value = new Set(open.value)
}
</script>

<template>
    <div mono-accordion-group style="width: 100%;">
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
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </span>
                <span mono-heading><span mono-title>What is this library?</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                @mono-lit/helper is a small set of Lit-powered web components — usable in Vue,
                vanilla HTML, or any framework that runs custom elements.
            </div></div>
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
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a10 10 0 1 0 10 10c0-1.1-.9-2-2-2h-2a2 2 0 0 1-2-2v-1a3 3 0 0 0-3-3z"></path>
                        <circle cx="7.5" cy="11.5" r="1" fill="currentColor"></circle>
                        <circle cx="11.5" cy="7.5" r="1" fill="currentColor"></circle>
                        <circle cx="16.5" cy="9.5" r="1" fill="currentColor"></circle>
                    </svg>
                </span>
                <span mono-heading><span mono-title>How do I customize the theme?</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                Pick a preset from the Theme switcher in the top-right of this page, or
                override the <code>--theme-*</code> custom properties in your own CSS.
            </div></div>
        </div>
        <div
            mono-accordion
            :mono-open="open.has(2) ? '' : null"
        >
            <button
                type="button"
                mono-head
                :aria-expanded="open.has(2)"
                @click="toggle(2)"
            >
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m7.5 4.27 9 5.15"></path>
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                        <path d="M3.3 7 12 12l8.7-5"></path>
                        <path d="M12 22V12"></path>
                    </svg>
                </span>
                <span mono-heading><span mono-title>How do I install it?</span></span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body role="region"><div>
                Add <code>@mono-lit/helper</code> as a dependency, import
                <code>'@mono-lit/helper/index.css'</code>, then import the components you use
                (e.g. <code>import '@mono-lit/helper/accordion'</code>).
            </div></div>
        </div>
    </div>
</template>
