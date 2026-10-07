<script setup>
import '@mono-lit/helper/ui/button'
</script>

<template>
    <div>
        <mono-button
            color="primary"
            :css-class="{
                root: 'shadow-2xl',
                text: 'tracking-widest',
            }"
        >
            Bold &amp; shadowed
        </mono-button>
        <br>
        <mono-button
            color="success"
            :css-class="{
                root: 'rounded-3xl px-8',
                text: 'font-bold',
            }"
        >
            Pill-ish &amp; padded
        </mono-button>
        <br>
        <mono-button
            color="info"
            :css-class="{
                root: 'shadow-md',
                main: 'gap-3',
                icon: 'text-orange-500',
            }"
        >
            <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 13l4 4L19 7"></path>
            </svg>
            Tinted icon
        </mono-button>
        <br>
        <mono-button
            color="danger"
            badge="9"
            :css-class="{
                root: 'p-3',
                badge: 'text-base px-2',
            }"
        >
            Big badge
        </mono-button>
    </div>
</template>
