<script setup>
    import '@mono-lit/helper/ui/otp'
    import '@mono-lit/helper/ui/button'
    import { ref, onBeforeUnmount } from 'vue'
    import { controlMonoForm } from '@mono-lit/helper/ui/form'

    const state = ref({})
    const result = ref('')

    const form = controlMonoForm({
        state,
        inputs: {
            Code: {
                component: 'mono-otp',
                value: '',
                validates: [
                    { type: 'required', message: 'Enter the code from the SMS.' },
                    { type: 'min', value: 6, message: 'The code has 6 digits.' },
                    { type: 'custom', validate: ({ value }) => value !== '000000' || 'That code is not valid.' },
                ],
            },
            Backup: {
                component: 'mono-otp',
                value: '',
                props: { type: 'alphanumeric', length: 8, groups: 4 },
                validates: [{ type: 'pattern', value: /^[A-Z0-9]{8}$/, message: 'Eight letters or digits.' }],
            },
        },
    })

    async function submit() {
        result.value = (await form.validate()) ? `Valid: ${JSON.stringify(form.values())}` : 'Fix the errors above.'
    }

    function reset() {
        form.reset()
        result.value = ''
    }

    onBeforeUnmount(() => form.dispose())
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- No :model-value, no @input — the form owns the value; change rules run when focus leaves the boxes. -->
        <mono-otp :control-form="form" key-form="Code" label="SMS code" required groups="3"></mono-otp>
        <mono-otp :control-form="form" key-form="Backup" label="Backup code (optional)"></mono-otp>
        <div style="display: flex; gap: 0.5rem">
            <mono-button size="sm" color="primary" @click="submit">Verify</mono-button>
            <mono-button size="sm" variant="outline" color="neutral" type="button" @click="reset">Reset</mono-button>
        </div>
        <DemoReadout>
            <div v-for="(item, key) in state" :key="key">
                {{ key }} = "{{ item.currentValue }}"
                <strong v-if="!item.validate.success">— {{ item.validate.message }}</strong>
            </div>
            <div v-if="result">{{ result }}</div>
        </DemoReadout>
    </div>
</template>
