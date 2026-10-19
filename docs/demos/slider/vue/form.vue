<script setup>
    import '@mono-lit/helper/ui/slider'
    import { ref, onBeforeUnmount } from 'vue'
    import { controlMonoForm } from '@mono-lit/helper/ui/form'

    const state = ref({})

    const form = controlMonoForm({
        validation: { type: 'live' },
        state,
        inputs: {
            Budget: {
                component: 'mono-slider',
                value: [20, 50],
                // A range value is an array; a custom rule reads it directly.
                validates: [
                    {
                        type: 'custom',
                        validate: ({ value }) => value[1] - value[0] <= 40 || 'Keep the range within 40.',
                    },
                ],
            },
            Volume: { component: 'mono-slider', value: 30 },
        },
    })

    onBeforeUnmount(() => form.dispose())
</script>

<template>
    <div style="width: 100%; display: grid; gap: 1.5rem">
        <!-- No :model-value, no @input — the form owns the value and renders the validation. -->
        <mono-slider :control-form="form" key-form="Budget" label="Budget band"></mono-slider>
        <mono-slider :control-form="form" key-form="Volume" label="Volume"></mono-slider>
        <DemoReadout>
            <div v-for="(item, key) in state" :key="key">
                {{ key }} = {{ JSON.stringify(item.currentValue) }}
                <strong v-if="!item.validate.success">— {{ item.validate.message }}</strong>
            </div>
        </DemoReadout>
    </div>
</template>
