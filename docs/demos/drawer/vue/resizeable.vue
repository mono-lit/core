<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const active = ref(null)

    function onClick(event) {
        if (!event.detail.modelValue) active.value = null
    }
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <mono-button size="sm" @click="active = 'right'">Right (resize width)</mono-button>
        <mono-button size="sm" @click="active = 'bottom'">Bottom (resize height)</mono-button>

        <mono-drawer
            resizeable
            position="right"
            color="primary"
            title="Resizable — right"
            :model-value="active === 'right'"
            @toggle="onClick"
        >
            <p style="margin: 0;">
                Drag the handle on this panel's <strong>left edge</strong> to change its width.
                It's clamped between a minimum and the viewport width.
            </p>
        </mono-drawer>

        <mono-drawer
            resizeable
            position="bottom"
            color="success"
            title="Resizable — bottom"
            :model-value="active === 'bottom'"
            @toggle="onClick"
        >
            <p style="margin: 0;">
                Drag the handle on this panel's <strong>top edge</strong> to change its height.
            </p>
        </mono-drawer>
    </div>
</template>
