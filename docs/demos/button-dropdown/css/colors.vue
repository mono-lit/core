<script setup>
// Hand-written markup, no Lit: `mono-item-color` on the `<li>` is the whole
// colour model — one attribute per row, mirroring the entry's `color`.
import { ref, onMounted, onUnmounted } from 'vue'

const root = ref(null)
const last = ref('—')
const open = ref(false)

// The element does this for you (closeOnOutsideClick / closeOnEscape); the
// hand-written twin wires it by hand so the two tabs behave the same.
function onOutside(e) {
    if (!open.value) return
    if (root.value && e.composedPath().includes(root.value)) return
    open.value = false
}
function onKey(e) {
    if (open.value && e.key === 'Escape') open.value = false
}
onMounted(() => {
    document.addEventListener('click', onOutside, true)
    document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
    document.removeEventListener('click', onOutside, true)
    document.removeEventListener('keydown', onKey)
})

const buttons = [
    { label: 'Approve', icon: 'i-mdi-check', color: 'success' },
    { label: 'Publish', icon: 'i-mdi-rocket-launch', color: 'primary' },
    { label: 'Review', icon: 'i-mdi-alert', color: 'warning' },
    { label: 'Details', icon: 'i-mdi-information', color: 'info' },
    { label: 'Sync', icon: 'i-mdi-sync', color: 'teal' },
    { label: 'Label', icon: 'i-mdi-tag', color: 'purple' },
    { label: 'Archive', icon: 'i-mdi-archive', color: 'dark' },
    { label: 'Rename', icon: 'i-mdi-pencil', color: 'secondary' },
    { label: 'Move', icon: 'i-mdi-folder-move' },
    { label: 'Delete', icon: 'i-mdi-delete', color: 'danger' },
]
</script>

<template>
    <div style="width: 100%; min-height: 26rem">
        <p class="example-hint">Open the menu and hover a row — the ink stays readable on its own wash.</p>

        <div ref="root" mono-button-dropdown mono-align="start" mono-collapsed :mono-open="open ? '' : null">
            <div mono-button mono-trigger mono-variant="outline">
                <button mono-native type="button" aria-haspopup="menu" :aria-expanded="String(open)"
                    @click.stop="open = !open">
                    <div mono-content>
                        <span mono-icon><span class="mono-icon i-mdi-menu-down"></span></span>
                        <span mono-text>Actions</span>
                    </div>
                </button>
            </div>

            <div mono-panel role="menu" :aria-hidden="String(!open)" :hidden="!open">
                <ul mono-list>
                    <li v-for="item in buttons" :key="item.label" mono-item role="none"
                        :mono-item-color="item.color">
                        <div mono-button>
                            <button mono-native type="button" role="menuitem" @click="last = item.label; open = false">
                                <div mono-content>
                                    <span mono-icon><span class="mono-icon" :class="item.icon"></span></span>
                                    <span mono-text>{{ item.label }}</span>
                                </div>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <p class="example-last">last action: <code>{{ last }}</code></p>
    </div>
</template>

<style scoped>
.example-hint {
    margin: 0 0 0.8rem;
    font-size: 0.76rem;
    opacity: 0.75;
}

.example-last {
    margin: 0.9rem 0 0;
    font-size: 0.76rem;
    opacity: 0.8;
}
</style>
