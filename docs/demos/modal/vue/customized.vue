<script setup>
    import '@mono-lit/helper/ui/modal'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const open = ref(false)
</script>

<template>
    <div>
        <mono-button color="success" @click="open = true">Open customized</mono-button>

        <mono-modal
            color="success"
            title="Customized panel"
            :model-value="open"
            @close="open = false"
            :css-class.prop="{
                panel: 'shadow-2xl',
                title: 'text-base',
                body: 'italic',
            }"
        >
            <p style="margin: 0;">
                Larger title, italic body, beefier shadow — overrides applied via the
                <code>cssClass</code> prop. Theme accent unchanged.
            </p>
        </mono-modal>
    </div>
</template>
