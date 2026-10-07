<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const open = ref(false)
const status = ref('Idle')
const name = ref('')
const email = ref('')
const nameInput = ref(null)

async function openModal() {
    open.value = true
    await nextTick()
    nameInput.value?.focus()
}

function close() {
    open.value = false
    name.value = ''
    email.value = ''
}

function act(action) {
    if (action === 'submit') {
        status.value = `Submitted: ${name.value || '(no name)'} · ${email.value || '(no email)'}`
    }
    close()
}

function onKey(e) {
    if (e.key === 'Escape' && open.value) close()
}

onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <div style="justify-self: start;" mono-button><button mono-native type="button" @click="openModal">Add user</button></div>
        <div style="font-size: 0.78rem; color: var(--theme-text); opacity: 0.7;">Status: {{ status }}</div>

        <div
            mono-modal
            :mono-open="open ? '' : null"
            role="dialog"
            aria-modal="true"
            :aria-hidden="!open"
        >
            <div mono-overlay @click="close"></div>
            <div mono-panel-wrap @click="close">
                <div mono-panel @click.stop>
                    <div mono-header>
                        <div mono-title>New user</div>
                        <button type="button" mono-close aria-label="Close" @click="close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div mono-body>
                        <div style="display: grid; gap: 0.85rem;">
                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--theme-text); margin-bottom: 0.35rem;">Name</label>
                                <input ref="nameInput" v-model="name" type="text" placeholder="Jane Doe" style="width: 100%; padding: 0.5rem 0.65rem; border-radius: 7px; border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text); font: inherit; font-size: 0.85rem;" />
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--theme-text); margin-bottom: 0.35rem;">Email</label>
                                <input v-model="email" type="email" placeholder="jane@example.com" style="width: 100%; padding: 0.5rem 0.65rem; border-radius: 7px; border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text); font: inherit; font-size: 0.85rem;" />
                            </div>
                        </div>
                    </div>
                    <div mono-footer>
                        <div mono-button mono-variant="tonal" mono-color="secondary" mono-size="sm"><button mono-native type="button" @click="act('cancel')">Cancel</button></div>
                        <div mono-button mono-size="sm"><button mono-native type="button" @click="act('submit')">Save</button></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
