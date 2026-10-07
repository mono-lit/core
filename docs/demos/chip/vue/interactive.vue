<script setup>
import '@mono-lit/helper/ui/chip'
</script>

<template>
    <div>
        <mono-chip clickable>Clickable</mono-chip>
        <br>
        <mono-chip clickable selected>Selected</mono-chip>
        <br>
        <mono-chip disabled>Disabled</mono-chip>
        <br>
        <mono-chip color="danger" removable close-label="Remove">Serum Vit C</mono-chip>
    </div>
</template>
