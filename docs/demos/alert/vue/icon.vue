<script setup lang="ts">
import '@mono-lit/helper/ui/alert'
</script>

<template>
    <div style="width: 100%;">
        <mono-alert
            color="success"
            icon="i-mdi-check-circle-outline"
            title="An iconify class"
            subtitle="icon=&quot;i-mdi-check-circle-outline&quot;"
        ></mono-alert>
        <mono-alert color="warning" icon="⚡" title="Plain text" subtitle="icon=&quot;⚡&quot; — an emoji or a letter"></mono-alert>
        <mono-alert color="primary" title="slot=&quot;icon&quot;" subtitle="Any markup, e.g. your own svg.">
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
                <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"></path>
            </svg>
        </mono-alert>
    </div>
</template>
