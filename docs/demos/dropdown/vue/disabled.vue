<script setup>
import '@mono-lit/helper/ui/dropdown'

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="padding: 4rem 1rem; display: flex; justify-content: center;">
        <mono-dropdown placement="bottom-start" disabled>
            <button slot="main" type="button" :style="triggerStyle">Disabled</button>
            <div slot="body">You won't see this — the activator refuses to open.</div>
        </mono-dropdown>
    </div>
</template>
