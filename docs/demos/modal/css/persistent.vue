<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
    <div>
        <div mono-button><button mono-native type="button" @click="open = true">Open persistent modal</button></div>

        <div
            mono-modal mono-persistent
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay></div>
            <div mono-panel-wrap>
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>Read this carefully</div>
                        <button type="button" mono-close aria-label="Close" @click="open = false">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0 0 0.5rem; font-weight: 600;">Overlay-click and Escape are disabled.</p>
                        <p style="margin: 0; opacity: 0.8;">
                            Persistent modals require an explicit dismissal — the close button or
                            a footer action. Use sparingly: this only fits truly destructive flows
                            or end-of-session interruptions.
                        </p>
                    </div>
                    <div mono-footer>
                        <div mono-button mono-size="sm"><button mono-native type="button" @click="open = false">I understand</button></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
