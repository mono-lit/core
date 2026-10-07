<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/alert'
import '@mono-lit/helper/ui/button'

// The ✕ hides an alert by itself (the element's own `hidden` attribute); the
// ones below move up. Re-rendering the group brings them back for the demo.
const round = ref(0)
</script>

<template>
    <div style="width: 100%;">
        <div :key="round" mono-alert-group>
            <mono-alert
                clearable
                color="success"
                variant="tonal"
                icon="i-mdi-check-circle-outline"
                title="Saved"
                subtitle="Your changes were stored."
            ></mono-alert>
            <mono-alert
                clearable
                color="warning"
                variant="tonal"
                icon="i-mdi-alert-outline"
                title="Storage almost full"
                subtitle="92% of your quota is used."
            ></mono-alert>
            <mono-alert
                clearable
                color="danger"
                variant="tonal"
                icon="i-mdi-alert-circle-outline"
                title="Sync failed"
                subtitle="We will retry in a minute."
            ></mono-alert>
        </div>
        <mono-button size="sm" variant="outline" class="example-alert-reset" @click="round++">Show them again</mono-button>
    </div>
</template>

<style>
.example-alert-reset {
    margin-top: 1rem;
}
</style>
