<script setup>
import '@mono-lit/helper/ui/card'
import '@mono-lit/helper/ui/button'
</script>

<template>
    <div style="width: 100%;">
        <mono-card>
            <h3 slot="title">Action Card</h3>
            <p>This card demonstrates footer actions.</p>
            <div slot="actions">
                <mono-button color="danger">Cancel</mono-button>
                <mono-button color="primary">Save</mono-button>
            </div>
        </mono-card>
        <br>
        <mono-card variant="tonal" color="primary" hoverable clickable>
            <h3 slot="title">Interactive Card</h3>
            <p slot="subtitle">Header, content, actions, and interaction</p>
            <p>This card combines multiple features in one example.</p>
            <div slot="actions">
                <mono-button color="warning">Later</mono-button>
                <mono-button color="primary">Open</mono-button>
            </div>
        </mono-card>
    </div>
</template>
