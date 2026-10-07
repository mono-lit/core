<script setup>
import { ref } from 'vue'

const open = ref(true)
</script>

<template>
    <div style="width: 100%;">
        <div mono-accordion class="max-w-md shadow-lg" :mono-open="open ? '' : null">
            <button
                type="button"
                mono-head
                :aria-expanded="open"
                @click="open = !open"
            >
                <span mono-glyph aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18.4l1.9-5.8 5.8-1.9-5.8-1.9z"></path>
                        <path d="M5 3v4"></path>
                        <path d="M19 17v4"></path>
                        <path d="M3 5h4"></path>
                        <path d="M17 19h4"></path>
                    </svg>
                </span>
                <span mono-heading>
                    <span mono-title class="text-base font-extrabold">Customized via class names</span>
                    <span mono-description class="italic">Bolder title, italic description, larger body padding.</span>
                </span>
                <span mono-arrow aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>
            <div mono-body class="text-sm" role="region"><div>
                Width, title weight, description style and body padding are overridden by composing
                utility classes onto the root markup. The picker still drives the accent colour.
            </div></div>
        </div>
    </div>
</template>
