<script setup>
import '@mono-lit/helper/ui/button'
</script>

<template>
    <div style="width: 100%;">
        <mono-button color="primary" icon-position="right">
            <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5">
                <path d="M12 5v14M5 12h14"></path>
            </svg>
            Add Item
        </mono-button>
        <br>
        <mono-button color="success" icon-position="left">
            Save
            <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5">
                <path d="M5 13l4 4L19 7"></path>
            </svg>
        </mono-button>
        <br>
        <mono-button color="danger" icon-position="right">
            Delete
            <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        </mono-button>
        <br>
        <mono-button color="info" icon-position="left">
            <div slot="icon" class="i-mdi-close">
            
            </div>
            <div>
                Continue
            </div>
        </mono-button>
    </div>
</template>
