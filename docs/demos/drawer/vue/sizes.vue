<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const active = ref(null)

    // `size` scales the CONTENT — title/body type, padding, close icon. The panel is
    // the same width at every step; `width` / `height` control the dimensions.
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

    function openSize(size) {
        active.value = size
    }

    function onClick(event) {
        if (!event.detail.modelValue) active.value = null
    }
</script>

<template>
    <div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <mono-button v-for="s in sizes" :key="s" size="sm" @click="openSize(s)">{{ s }}</mono-button>
        </div>

        <mono-drawer
            v-for="s in sizes"
            :key="s"
            position="right"
            :size="s"
            color="secondary"
            :title="`Size — ${s}`"
            :model-value="active === s"
            @toggle="onClick"
        >
            <p style="margin: 0;">
                Content scale <code>{{ s }}</code> — the panel stays the same width at
                every step. Use <code>width</code> to change that.
            </p>
        </mono-drawer>
    </div>
</template>
