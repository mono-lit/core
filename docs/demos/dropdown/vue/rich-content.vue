<script setup>
import '@mono-lit/helper/ui/dropdown'
import '@mono-lit/helper/ui/button'
import '@mono-lit/helper/ui/input'
import '@mono-lit/helper/ui/checkbox'
import { ref } from 'vue'

const name = ref('')
const remember = ref(false)
const status = ref('')

const triggerStyle =
    'padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid var(--border); background: var(--background); color: var(--foreground); cursor: pointer; font: inherit; font-weight: 600; font-size: 0.82rem;'

function save() {
    status.value = `Saved "${name.value}" (remember=${remember.value})`
}
</script>

<template>
    <div style="padding: 4rem 1rem; display: grid; gap: 0.6rem; justify-items: center;">
        <mono-dropdown placement="bottom-start" size="lg" color="secondary">
            <button slot="main" type="button" :style="triggerStyle">Quick form</button>
            <div slot="body" style="display: grid; gap: 0.65rem;">
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
        </mono-dropdown>
        <div style="font-size: 0.78rem; color: var(--theme-text); opacity: 0.7; min-height: 1em;">
            {{ status }}
        </div>
    </div>
</template>
