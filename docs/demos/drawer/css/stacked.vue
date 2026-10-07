<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const o1 = ref(false)
const o2 = ref(false)
const o3 = ref(false)

// `has-drawer-above` mirrors the component: set on any level that has a higher
// level open, so its backdrop is hidden and dim layers don't compound.
const above1 = computed(() => o2.value || o3.value)
const above2 = computed(() => o3.value)

// Escape closes the topmost (last-opened) level only.
function onKey(e) {
    if (e.key !== 'Escape') return
    if (o3.value) o3.value = false
    else if (o2.value) o2.value = false
    else if (o1.value) o1.value = false
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div>
        <div mono-button mono-size="sm"><button mono-native type="button" @click="o1 = true">Open drawer</button></div>

        <!-- Level 1 — right -->
        <div
            mono-drawer
            :mono-open="o1 ? '' : null"
            :mono-has-drawer-above="above1 ? '' : null"
            :style="{ '--mono-drawer-z': 9990 }"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!o1"
        >
            <div mono-overlay @click="o1 = false"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Level 1 — right</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="o1 = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0 0 1rem;">Open a drawer from inside — each level sets a higher <code>--drawer-z</code>.</p>
                    <div mono-button mono-variant="tonal" mono-size="sm"><button mono-native type="button" @click="o2 = true">Open drawer inside ↑</button></div>
                </div>
            </div>
        </div>

        <!-- Level 2 — left -->
        <div
            mono-drawer mono-color="success" mono-position="left"
            :mono-open="o2 ? '' : null"
            :mono-has-drawer-above="above2 ? '' : null"
            :style="{ '--mono-drawer-z': 10000 }"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!o2"
        >
            <div mono-overlay @click="o2 = false"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Level 2 — left</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="o2 = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0 0 1rem;">Only one backdrop dims the screen — the lower overlay is hidden via <code>has-drawer-above</code>.</p>
                    <div mono-button mono-variant="tonal" mono-color="success" mono-size="sm"><button mono-native type="button" @click="o3 = true">Go deeper ↑</button></div>
                </div>
            </div>
        </div>

        <!-- Level 3 — bottom -->
        <div
            mono-drawer mono-color="danger" mono-position="bottom"
            :mono-open="o3 ? '' : null"
            :style="{ '--mono-drawer-z': 10010 }"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!o3"
        >
            <div mono-overlay @click="o3 = false"></div>
            <div mono-panel>
                <div mono-header>
                    <div mono-title>Level 3 — bottom</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="o3 = false">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0;">Press <kbd>Esc</kbd> to close this one only — the drawers beneath stay open.</p>
                </div>
            </div>
        </div>
    </div>
</template>
