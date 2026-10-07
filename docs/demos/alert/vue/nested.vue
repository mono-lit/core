<script setup lang="ts">
import { ref } from 'vue'
import '@mono-lit/helper/ui/alert'
import '@mono-lit/helper/ui/button'

// Alerts nest: an inner alert is plain content of the outer one, so it is the
// outer alert's BODY (which replaces the outer icon / title / subtitle — put the
// outer heading in the body too). Every inner alert keeps its own colour, size
// and variant, and its ✕ hides only itself.
const round = ref(0)
</script>

<template>
    <div style="width: 100%;">
        <mono-alert :key="round" color="warning" variant="tonal" size="lg" clearable>
            <div class="example-alert-nested-head">
                <strong>3 checks need attention before you publish</strong>
                <span>Resolve or dismiss each one.</span>
            </div>
            <mono-alert
                clearable
                color="danger"
                icon="i-mdi-alert-circle-outline"
                title="Broken link"
                subtitle="/pricing returns 404."
            ></mono-alert>
            <mono-alert
                clearable
                icon="i-mdi-information-outline"
                title="Missing alt text"
                subtitle="2 images have no description."
            ></mono-alert>
            <mono-alert clearable variant="text" color="success" icon="i-mdi-check-circle-outline">
                A plain inner alert whose own content is its body.
            </mono-alert>
        </mono-alert>
        <mono-button size="sm" variant="outline" class="example-alert-nested-reset" @click="round++">Reset</mono-button>
    </div>
</template>

<style>
.example-alert-nested-head {
    display: grid;
    gap: 0.125rem;
    margin-bottom: 0.75rem;
}

.example-alert-nested-reset {
    margin-top: 1rem;
}
</style>
