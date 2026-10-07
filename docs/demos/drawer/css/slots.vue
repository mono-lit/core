<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const openHeader = ref(false)

function approve() {
    alert('Approved.')
    open.value = false
}

function onKey(e) {
    if (e.key !== 'Escape') return
    open.value = false
    openHeader.value = false
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <div mono-button><button mono-native type="button" @click="open = true">Open detail drawer</button></div>
        <div mono-button mono-variant="outline"><button mono-native type="button" @click="openHeader = true">Custom header</button></div>

        <div
            mono-drawer mono-color="info"
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="open = false"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-heading>
                        <div mono-title style="display: inline-flex; align-items: center; gap: 0.55rem;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>Claim KLM-2025-0053</span>
                        </div>
                        <div mono-subtitle>Waiting on supervisor approval</div>
                    </div>
                    <button type="button" mono-close aria-label="Close drawer" @click="open = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1rem;">
                        <div style="padding: 0.6rem 0.8rem; border: 1px solid var(--theme-border); border-radius: 8px;">
                            <div style="font-size: 0.65rem; font-weight: 700; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.08em;">Salesman</div>
                            <div style="font-weight: 700;">Ahmad Fauzi</div>
                        </div>
                        <div style="padding: 0.6rem 0.8rem; border: 1px solid var(--theme-border); border-radius: 8px;">
                            <div style="font-size: 0.65rem; font-weight: 700; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.08em;">Amount</div>
                            <div style="font-weight: 700; font-family: monospace;">Rp 2.500.000</div>
                        </div>
                    </div>
                    <p style="margin: 0;">Submitted on 10 Apr 2025. Currently waiting on supervisor approval.</p>
                </div>
                <div mono-footer>
                    <span style="display: flex; gap: 0.45rem; flex: 1; justify-content: space-between;">
                        <div mono-button mono-variant="outline" mono-color="danger" mono-size="sm"><button mono-native type="button" @click="open = false">Reject</button></div>
                        <div mono-button mono-color="success" mono-size="sm"><button mono-native type="button" @click="approve">Approve</button></div>
                    </span>
                </div>
            </div>
        </div>

        <!-- the element's `slot="header"`: custom markup in the heading column,
             the ✕ still beside it -->
        <div
            mono-drawer
            :mono-open="openHeader ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!openHeader"
        >
            <div mono-overlay @click="openHeader = false"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-heading>
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <span style="font-size: 1.1rem;">📦</span>
                            <span style="font-weight: 700;">Shipment #4821</span>
                            <span
                                style="font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 999px; background: color-mix(in oklab, var(--success) 18%, var(--popover)); color: var(--success);"
                            >In transit</span>
                        </div>
                    </div>
                    <button type="button" mono-close aria-label="Close drawer" @click="openHeader = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0;">A fully custom header row.</p>
                </div>
            </div>
        </div>
    </div>
</template>
