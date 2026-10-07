<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const o1 = ref(false)
const o2 = ref(false)
const drag1 = ref(false)
const drag2 = ref(false)
const p1 = ref(null)
const p2 = ref(null)

const num = (v) => parseFloat(v) || 0

function open(which) {
    if (which === 1) o1.value = true
    else o2.value = true
    // each open starts centered
    nextTick(() => {
        const panel = which === 1 ? p1.value : p2.value
        if (panel) {
            panel.style.setProperty('--drag-x', '0px')
            panel.style.setProperty('--drag-y', '0px')
        }
    })
}

let active = null

function onHeadDown(e, which) {
    if (e.button !== 0) return
    if (e.target.closest('[mono-close]')) return
    const panel = which === 1 ? p1.value : p2.value
    if (!panel) return
    e.preventDefault()
    if (which === 1) drag1.value = true
    else drag2.value = true
    active = {
        which,
        panel,
        startX: e.clientX,
        startY: e.clientY,
        origX: num(panel.style.getPropertyValue('--drag-x')),
        origY: num(panel.style.getPropertyValue('--drag-y')),
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
    window.addEventListener('pointercancel', onUp, { once: true })
}

function onMove(e) {
    if (!active) return
    active.panel.style.setProperty('--drag-x', `${active.origX + (e.clientX - active.startX)}px`)
    active.panel.style.setProperty('--drag-y', `${active.origY + (e.clientY - active.startY)}px`)
}

function onUp() {
    window.removeEventListener('pointermove', onMove)
    if (!active) return
    clamp(active.panel)
    if (active.which === 1) drag1.value = false
    else drag2.value = false
    active = null
}

// Pull the panel back fully inside the viewport on drop.
function clamp(panel) {
    const r = panel.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let dx = 0
    if (r.width >= vw || r.left < 0) dx = -r.left
    else if (r.right > vw) dx = vw - r.right
    let dy = 0
    if (r.height >= vh || r.top < 0) dy = -r.top
    else if (r.bottom > vh) dy = vh - r.bottom
    if (dx || dy) {
        panel.style.setProperty('--drag-x', `${num(panel.style.getPropertyValue('--drag-x')) + dx}px`)
        panel.style.setProperty('--drag-y', `${num(panel.style.getPropertyValue('--drag-y')) + dy}px`)
    }
}

function onKey(e) {
    if (e.key !== 'Escape') return
    if (o2.value) o2.value = false
    else if (o1.value) o1.value = false
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div>
        <div mono-button><button mono-native type="button" @click="open(1)">Open draggable modal</button></div>

        <!-- Level 1 -->
        <div
            mono-modal mono-draggable
            :mono-open="o1 ? '' : null"
            :mono-dragging="drag1 ? '' : null"
            :mono-has-modal-above="o2 ? '' : null"
            :style="{ '--mono-modal-z': 600 }"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!o1"
        >
            <div mono-overlay @click="o1 = false"></div>
            <div mono-panel-wrap @click="o1 = false">
                <div ref="p1" mono-panel @click.stop>
                    <div mono-header @pointerdown="onHeadDown($event, 1)">
                        <div mono-title>Drag me by the header</div>
                        <button type="button" mono-close aria-label="Close" @click="o1 = false">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0 0 1rem;">Grab the header and drag anywhere; release off-screen and it snaps back inside.</p>
                        <div mono-button mono-variant="tonal" mono-size="sm"><button mono-native type="button" @click="open(2)">Open another ↑</button></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Level 2 -->
        <div
            mono-modal mono-color="success" mono-draggable
            :mono-open="o2 ? '' : null"
            :mono-dragging="drag2 ? '' : null"
            :style="{ '--mono-modal-z': 620 }"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!o2"
        >
            <div mono-overlay @click="o2 = false"></div>
            <div mono-panel-wrap @click="o2 = false">
                <div ref="p2" mono-panel @click.stop>
                    <div mono-header @pointerdown="onHeadDown($event, 2)">
                        <div mono-title>Second modal</div>
                        <button type="button" mono-close aria-label="Close" @click="o2 = false">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div mono-body>
                        <p style="margin: 0;">Drag me aside to reveal the first modal behind. <kbd>Esc</kbd> closes the top one.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
