<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const root = ref(null)
const open = ref(false)
const name = ref('')
const remember = ref(false)
const status = ref('')

function onOutside(e) {
    if (!open.value) return
    if (root.value && e.composedPath().includes(root.value)) return
    open.value = false
}

function onKey(e) {
    if (e.key === 'Escape') open.value = false
}

onMounted(() => {
    document.addEventListener('click', onOutside, true)
    document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
    document.removeEventListener('click', onOutside, true)
    document.removeEventListener('keydown', onKey)
})

function save() {
    status.value = `Saved "${name.value}" (remember=${remember.value})`
}

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'
</script>

<template>
    <div style="padding: 4rem 1rem; display: grid; gap: 0.6rem; justify-items: center;">
        <div ref="root" mono-dropdown mono-size="lg" mono-color="secondary" :mono-open="open ? '' : null">
            <span mono-activator>
                <button type="button" :style="triggerStyle" @click.stop="open = !open">Quick form</button>
            </span>
            <div mono-panel role="dialog" :aria-hidden="String(!open)">
                <div mono-body style="display: grid; gap: 0.65rem;">
                    <mono-input
                        label="Display name"
                        placeholder="Type something"
                        :model-value="name"
                        @input="name = $event.detail.modelValue"
                    ></mono-input>
                    <mono-checkbox
                        label="Remember me"
                        :model-value="remember"
                        @change="remember = $event.detail.modelValue"
                    ></mono-checkbox>
                    <mono-button color="secondary" @click="save">Save</mono-button>
                </div>
            </div>
        </div>
        <div style="font-size: 0.78rem; color: var(--foreground); opacity: 0.7; min-height: 1em;">
            {{ status }}
        </div>
    </div>
</template>
