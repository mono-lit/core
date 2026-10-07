<script setup>
import '@mono-lit/helper/ui/chip'
</script>

<template>
    <div>
        <mono-chip icon-position="left" color="primary">
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"></path>
            </svg>
            Add Label
        </mono-chip>
        <br>
        <mono-chip icon-position="right" color="success">
            Approved
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 13l4 4L19 7"></path>
            </svg>
        </mono-chip>
        <br>
        <mono-chip icon-position="left" color="warning">
            <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 9v4M12 17h.01"></path>
                <path d="M3.85 8.62a4 4 0 017.72 0A6 6 0 0112 9a6 6 0 011.72-.38 4 4 0 017.72 0"></path>
            </svg>
            Attention
        </mono-chip>
    </div>
</template>
