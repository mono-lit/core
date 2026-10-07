<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
    const name = ref('')
    const email = ref('')
    const status = ref('Idle')

    const inputStyle =
        'width: 100%; padding: 0.5rem 0.65rem; border-radius: 7px; border: 1px solid var(--theme-border); background: var(--theme-surface); color: var(--theme-text); font: inherit; font-size: 0.85rem;'

    const labelStyle =
        'display: block; font-size: 0.75rem; font-weight: 700; color: var(--theme-text); margin-bottom: 0.35rem;'

    function reset() {
        name.value = ''
        email.value = ''
    }

    function submit() {
        status.value = `Submitted: ${name.value || '(no name)'} · ${email.value || '(no email)'}`
        reset()
        open.value = false
    }

    function cancel() {
        reset()
        open.value = false
    }
</script>

<template>
    <div style="display: grid; gap: 0.55rem;">
        <mono-button style="justify-self: start;" color="primary" @click="open = true">Add user</mono-button>
        <div style="font-size: 0.78rem; color: var(--theme-text); opacity: 0.7;">
            Status: {{ status }}
        </div>

        <mono-modal
            title="New user"
            :model-value="open"
            @close="open = false"
        >
            <div style="display: grid; gap: 0.85rem;">
                <div>
                    <label :style="labelStyle">Name</label>
                    <input
                        type="text"
                        v-model="name"
                        :style="inputStyle"
                        placeholder="Jane Doe"
                    />
                </div>
                <div>
                    <label :style="labelStyle">Email</label>
                    <input
                        type="email"
                        v-model="email"
                        :style="inputStyle"
                        placeholder="jane@example.com"
                    />
                </div>
            </div>

            <mono-button slot="footer" variant="tonal" color="secondary" size="sm" @click="cancel">Cancel</mono-button>
            <mono-button slot="footer" color="primary" size="sm" @click="submit">Save</mono-button>
        </mono-modal>
    </div>
</template>
