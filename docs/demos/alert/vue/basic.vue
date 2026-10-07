<script setup lang="ts">
import '@mono-lit/helper/ui/alert'
</script>

<template>
    <div style="width: 100%;">
        <mono-alert
            icon="i-mdi-information-outline"
            title="Heads up!"
            subtitle="You can add components to your app using the CLI."
        ></mono-alert>
        <mono-alert
            color="danger"
            icon="i-mdi-alert-circle-outline"
            title="Unable to process your payment."
            subtitle="Please verify your billing information and try again."
        ></mono-alert>
        <mono-alert title="A title on its own is fine too."></mono-alert>
    </div>
</template>
