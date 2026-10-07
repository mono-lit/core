<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const root = ref(null)
const open = ref(false)
const lines = ref([])
const empty = 'No events yet...'

const logText = computed(() => lines.value.length ? lines.value.join('\n') : empty)

function append(line) {
    lines.value = [line, ...lines.value]
}

function setOpen(next, source) {
    if (open.value === next) return
    const oldValue = !next
    open.value = next
    append(`[click] modelValue=${next} old=${oldValue} source=${JSON.stringify(source)} resolvedSide="bottom"`)
    append(`[${next ? 'open' : 'close'}] modelValue=${next} old=${oldValue} source=${JSON.stringify(source)} resolvedSide="bottom"`)
}

function onOutside(e) {
    if (!open.value) return
    if (root.value && e.composedPath().includes(root.value)) return
    setOpen(false, 'outside')
}

function onKey(e) {
    if (e.key !== 'Escape') return
    if (!open.value) return
    setOpen(false, 'escape')
}

onMounted(() => {
    document.addEventListener('click', onOutside, true)
    document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
    document.removeEventListener('click', onOutside, true)
    document.removeEventListener('keydown', onKey)
})
</script>

<template>
    <div>
        <div style="padding: 3rem 1rem; display: flex; justify-content: center;">
            <div ref="root" mono-dropdown :mono-open="open ? '' : null">
                <span mono-activator>
                    <button
                        type="button"
                        style="padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;"
                        @click.stop="setOpen(!open, 'trigger')"
                    >
                        Open and watch the log
                    </button>
                </span>
                <div mono-panel role="dialog" :aria-hidden="String(!open)">
                    <div mono-body>
                        <code>toggle</code> fires on every state change.
                        <code>open</code> only fires on open transitions,
                        <code>close</code> only on close transitions.
                        <code>resolvedSide</code> reports which side the panel
                        actually rendered on after auto-flip.
                    </div>
                </div>
            </div>
        </div>
        <DemoLog :text="logText" max-height="160px" />
    </div>
</template>
