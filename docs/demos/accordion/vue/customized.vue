<script setup>
    import '@mono-lit/helper/ui/accordion'
    import { ref } from 'vue'

    const open = ref(true)
</script>

<template>
    <div style="width: 100%;">
        <mono-accordion
            title="Customized via cssClass"
            subtitle="Bolder title, italic subtitle, larger body padding."
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
            :css-class.prop="{
                root: 'max-w-md shadow-lg',
                title: 'text-base font-extrabold',
                description: 'italic',
                body: 'text-sm',
            }"
        >
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
                <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9L12 18.4l1.9-5.8 5.8-1.9-5.8-1.9z"></path>
                <path d="M5 3v4"></path>
                <path d="M19 17v4"></path>
                <path d="M3 5h4"></path>
                <path d="M17 19h4"></path>
            </svg>
            Width, title weight, description style and body padding are overridden via
            the <code>cssClass</code> prop. The picker still drives the accent colour.
        </mono-accordion>
    </div>
</template>
