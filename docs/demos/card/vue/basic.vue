<script setup lang="ts">
import '@mono-lit/helper/ui/card'

</script>

<template>
    <div style="width: 100%;">
        <mono-card>
            <p>This is a basic card with default styling.</p>
        </mono-card>
        <br>
        <mono-card>
            <h3 slot="title">Card Title</h3>
            <p slot="subtitle">Simple subtitle text</p>
            <p>This card includes a title and subtitle header.</p>
        </mono-card>
    </div>
</template>
