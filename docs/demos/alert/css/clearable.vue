<script setup lang="ts">
import { ref } from 'vue'

// Raw markup has no element to hide itself: the ✕ does it with one line.
// Re-rendering the group brings them back for the demo.
const round = ref(0)
function hide(event: Event) {
    ;(event.currentTarget as HTMLElement).closest('[mono-alert]')!.setAttribute('hidden', '')
}
</script>

<template>
    <div style="width: 100%;">
        <div :key="round" mono-alert-group>
            <div mono-alert mono-color="success" mono-variant="tonal" mono-clearable role="alert">
                <span mono-icon aria-hidden="true"><span class="i-mdi-check-circle-outline" mono-glyph></span></span>
                <div mono-title>Saved</div>
                <div mono-subtitle>Your changes were stored.</div>
                <button type="button" mono-clear aria-label="Close" @click="hide">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div mono-alert mono-color="warning" mono-variant="tonal" mono-clearable role="alert">
                <span mono-icon aria-hidden="true"><span class="i-mdi-alert-outline" mono-glyph></span></span>
                <div mono-title>Storage almost full</div>
                <div mono-subtitle>92% of your quota is used.</div>
                <button type="button" mono-clear aria-label="Close" @click="hide">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div mono-alert mono-color="danger" mono-variant="tonal" mono-clearable role="alert">
                <span mono-icon aria-hidden="true"><span class="i-mdi-alert-circle-outline" mono-glyph></span></span>
                <div mono-title>Sync failed</div>
                <div mono-subtitle>We will retry in a minute.</div>
                <button type="button" mono-clear aria-label="Close" @click="hide">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
        <button type="button" mono-button mono-size="sm" mono-variant="outline" class="example-alert-reset" @click="round++">
            Show them again
        </button>
    </div>
</template>

<style>
.example-alert-reset {
    margin-top: 1rem;
}
</style>
