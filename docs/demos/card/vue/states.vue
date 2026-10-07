<script setup>
import '@mono-lit/helper/ui/card'
</script>

<template>
    <div style="width: 100%;">
        <mono-card bordered>
            <h3 slot="title">Bordered</h3>
            <p>Card with thicker border.</p>
        </mono-card>
        <br>
        <mono-card hoverable>
            <h3 slot="title">Hoverable</h3>
            <p>Hover over this card.</p>
        </mono-card>
        <br>
        <mono-card clickable>
            <h3 slot="title">Clickable</h3>
            <p>Click this card to emit an event.</p>
        </mono-card>
        <br>
        <mono-card disabled>
            <h3 slot="title">Disabled</h3>
            <p>This card is visually disabled.</p>
        </mono-card>
    </div>
</template>
