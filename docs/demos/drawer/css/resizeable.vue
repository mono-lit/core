<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const active = ref(null)
const rz = ref(null) // which drawer is mid-resize ('right' | 'bottom' | null)

const root1 = ref(null)
const panel1 = ref(null)
const root2 = ref(null)
const panel2 = ref(null)

const MIN = 200
let drag = null

function onResizeDown(e, which) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const panel = which === 'right' ? panel1.value : panel2.value
    const root = which === 'right' ? root1.value : root2.value
    if (!panel || !root) return
    const rect = panel.getBoundingClientRect()
    drag = {
        which,
        root,
        horizontal: which === 'right',
        startX: e.clientX,
        startY: e.clientY,
        baseW: rect.width,
        baseH: rect.height,
    }
    rz.value = which
    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', onResizeUp, { once: true })
    window.addEventListener('pointercancel', onResizeUp, { once: true })
}

function onResizeMove(e) {
    if (!drag) return
    if (drag.horizontal) {
        // right drawer: handle on the left edge → drag left grows width
        const next = Math.max(MIN, Math.min(drag.baseW + (drag.startX - e.clientX), window.innerWidth))
        drag.root.style.setProperty('--mono-drawer-width', `${next}px`)
    } else {
        // bottom drawer: handle on the top edge → drag up grows height
        const next = Math.max(MIN, Math.min(drag.baseH + (drag.startY - e.clientY), window.innerHeight))
        drag.root.style.setProperty('--mono-drawer-height', `${next}px`)
    }
}

function onResizeUp() {
    window.removeEventListener('pointermove', onResizeMove)
    drag = null
    rz.value = null
}

function onKey(e) {
    if (e.key === 'Escape' && active.value) active.value = null
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <div mono-button mono-size="sm"><button mono-native type="button" @click="active = 'right'">Right (resize width)</button></div>
        <div mono-button mono-size="sm"><button mono-native type="button" @click="active = 'bottom'">Bottom (resize height)</button></div>

        <!-- Right -->
        <div
            ref="root1"
            mono-drawer mono-resizeable
            :mono-open="active === 'right' ? '' : null"
            :mono-resizing="rz === 'right' ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="active !== 'right'"
        >
            <div mono-overlay @click="active = null"></div>
            <div ref="panel1" mono-panel>
                <div mono-resizer role="separator" aria-orientation="vertical" @pointerdown="onResizeDown($event, 'right')"></div>
                <div mono-header>
                    <div mono-title>Resizable — right</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="active = null">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0;">Drag the handle on the <strong>left edge</strong> to change width.</p>
                </div>
            </div>
        </div>

        <!-- Bottom -->
        <div
            ref="root2"
            mono-drawer mono-color="success" mono-position="bottom" mono-resizeable
            :mono-open="active === 'bottom' ? '' : null"
            :mono-resizing="rz === 'bottom' ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="active !== 'bottom'"
        >
            <div mono-overlay @click="active = null"></div>
            <div ref="panel2" mono-panel>
                <div mono-resizer role="separator" aria-orientation="horizontal" @pointerdown="onResizeDown($event, 'bottom')"></div>
                <div mono-header>
                    <div mono-title>Resizable — bottom</div>
                    <button type="button" mono-close aria-label="Close drawer" @click="active = null">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div mono-body>
                    <p style="margin: 0;">Drag the handle on the <strong>top edge</strong> to change height.</p>
                </div>
            </div>
        </div>
    </div>
</template>
