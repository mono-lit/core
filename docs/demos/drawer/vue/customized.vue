<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)

</script>

<template>
    <div>
        <mono-button color="purple" @click="open = true">Open customized drawer</mono-button>

        <mono-drawer
            position="right"
            size="lg"
            color="primary"
            title="Custom styling"
            :model-value="open"
            @toggle="open = $event.detail.modelValue"
            :css-class.prop="{
                panel: '',
                head: 'border-b-2',
                title: 'tracking-wide uppercase text-sm',
                body: 'leading-relaxed',
            }"
        >
            <p style="margin: 0 0 0.6rem;">
                Per-element overrides via the <code>cssClass</code> object — Tailwind / Uno utility classes flow through.
            </p>
            <p style="margin: 0;">
                Title is uppercased and the panel takes a heavier shadow.
            </p>
        </mono-drawer>
    </div>
</template>
