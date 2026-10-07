<script setup lang="ts">
import { ref } from 'vue'

// Raw markup has no element to hide itself: each ✕ does it with one line,
// and only for its OWN alert (`closest` from the button).
const round = ref(0)
function hide(event: Event) {
    ;(event.currentTarget as HTMLElement).closest('[mono-alert]')!.setAttribute('hidden', '')
}
</script>

<template>
    <div style="width: 100%;">
        <div :key="round" mono-alert mono-color="warning" mono-variant="tonal" mono-size="lg" mono-clearable role="alert">
            <div mono-body>
                <div class="example-alert-nested-head">
                    <strong>3 checks need attention before you publish</strong>
                    <span>Resolve or dismiss each one.</span>
                </div>

                <div mono-alert mono-color="danger" mono-clearable role="alert">
                    <span mono-icon aria-hidden="true"><span class="i-mdi-alert-circle-outline" mono-glyph></span></span>
                    <div mono-title>Broken link</div>
                    <div mono-subtitle>/pricing returns 404.</div>
                    <button type="button" mono-clear aria-label="Close" @click="hide">
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div mono-alert mono-clearable role="alert">
                    <span mono-icon aria-hidden="true"><span class="i-mdi-information-outline" mono-glyph></span></span>
                    <div mono-title>Missing alt text</div>
                    <div mono-subtitle>2 images have no description.</div>
                    <button type="button" mono-clear aria-label="Close" @click="hide">
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div mono-alert mono-variant="text" mono-color="success" mono-clearable role="alert">
                    <div mono-body>A plain inner alert whose own content is its body.</div>
                    <button type="button" mono-clear aria-label="Close" @click="hide">
                        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            <button type="button" mono-clear aria-label="Close" @click="hide">
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
        <button type="button" mono-button mono-size="sm" mono-variant="outline" class="example-alert-nested-reset" @click="round++">
            Reset
        </button>
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
