<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)

function onKey(e) {
    if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <div mono-button><button mono-native type="button" @click="open = true">Open without overlay</button></div>
            <div mono-button mono-variant="outline" mono-color="secondary"><button mono-native type="button" @click="pageClicks++">Page button · {{ pageClicks }}</button></div>
        </div>
        <p style="font-size: 0.8rem; color: var(--theme-text); opacity: 0.65; margin: 0.6rem 0 0;">
            With the <code>no-overlay</code> modifier, no backdrop is rendered and the page
            behind stays interactive. Useful for non-modal dialogs (preferences, side panels)
            where the user shouldn't be blocked from the main flow.
        </p>

        <div
            mono-modal mono-no-overlay
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="false"
            :aria-hidden="!open"
        >
            <div mono-overlay></div>
            <div mono-panel-wrap>
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>Floating panel</div>
                        <button type="button" mono-close aria-label="Close" @click="open = false">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0;">
                            The page behind this dialog still receives clicks and scroll events.
                            Press the close button or Escape to dismiss.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
