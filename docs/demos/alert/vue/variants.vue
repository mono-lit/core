<script setup lang="ts">
import '@mono-lit/helper/ui/alert'
</script>

<template>
    <div style="width: 100%;">
        <mono-alert
            color="info"
            icon="i-mdi-information-outline"
            title="outline (default)"
            subtitle="The card surface and edge; the colour paints the ink."
        ></mono-alert>
        <mono-alert
            color="info"
            variant="tonal"
            icon="i-mdi-information-outline"
            title="tonal"
            subtitle="A soft tint of the colour, no edge."
        ></mono-alert>
        <mono-alert
            color="info"
            variant="solid"
            icon="i-mdi-information-outline"
            title="solid"
            subtitle="The colour as the plate."
        ></mono-alert>
        <mono-alert
            color="info"
            variant="text"
            icon="i-mdi-information-outline"
            title="text"
            subtitle="No plate, no edge — an inline notice."
        ></mono-alert>
    </div>
</template>
