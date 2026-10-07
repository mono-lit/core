<script setup>
import '@mono-lit/helper/ui/accordion'
</script>

<template>
    <div mono-accordion-group style="width: 100%;">
        <mono-accordion title="What is this library?" model-value>
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            @mono-lit/helper is a small set of Lit-powered web components — usable in Vue,
            vanilla HTML, or any framework that runs custom elements.
        </mono-accordion>

        <mono-accordion title="How do I customize the theme?">
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M12 2a10 10 0 1 0 10 10c0-1.1-.9-2-2-2h-2a2 2 0 0 1-2-2v-1a3 3 0 0 0-3-3z"></path>
                <circle cx="7.5" cy="11.5" r="1" fill="currentColor"></circle>
                <circle cx="11.5" cy="7.5" r="1" fill="currentColor"></circle>
                <circle cx="16.5" cy="9.5" r="1" fill="currentColor"></circle>
            </svg>
            Pick a preset from the Theme switcher in the top-right of this page, or
            override the <code>--theme-*</code> custom properties in your own CSS.
        </mono-accordion>

        <mono-accordion title="How do I install it?">
            <svg
                slot="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="m7.5 4.27 9 5.15"></path>
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <path d="M3.3 7 12 12l8.7-5"></path>
                <path d="M12 22V12"></path>
            </svg>
            Add <code>@mono-lit/helper</code> as a dependency, import
            <code>'@mono-lit/helper/index.css'</code>, then import the components you use
            (e.g. <code>import '@mono-lit/helper/accordion'</code>).
        </mono-accordion>
    </div>
</template>
