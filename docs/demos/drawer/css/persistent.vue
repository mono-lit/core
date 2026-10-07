<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
    <div>
        <div mono-button mono-color="warning"><button mono-native type="button" @click="open = true">Open persistent drawer</button></div>

        <div
            mono-drawer mono-color="warning" mono-persistent
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Confirm changes</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="open = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0 0 0.65rem;">Overlay clicks and Escape are ignored when <code>persistent</code> is set.</p>
                    <p style="margin: 0;">The user must explicitly press a footer button to dismiss.</p>
                </div>
                <div mono-footer>
                    <div mono-button mono-color="warning" mono-size="sm"><button mono-native type="button" @click="open = false">Got it</button></div>
                </div>
            </div>
        </div>
    </div>
</template>
