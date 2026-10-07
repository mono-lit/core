<script setup>
    import '@mono-lit/helper/ui/drawer'
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const active = ref(null)

    function openAt(pos) {
        active.value = pos
    }

    function onClick(event) {
        if (!event.detail.modelValue) active.value = null
    }
</script>

<template>
    <div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <mono-button size="sm" @click="openAt('left')">← Left</mono-button>
            <mono-button size="sm" @click="openAt('right')">Right →</mono-button>
            <mono-button size="sm" @click="openAt('top')">↑ Top</mono-button>
            <mono-button size="sm" @click="openAt('bottom')">↓ Bottom</mono-button>
        </div>

        <mono-drawer
            v-for="pos in ['left', 'right', 'top', 'bottom']"
            :key="pos"
            :position="pos"
            size="md"
            color="primary"
            :title="`Drawer — ${pos}`"
            :model-value="active === pos"
            @toggle="onClick"
        >
            <p style="margin: 0;">
                This drawer is anchored to the <strong>{{ pos }}</strong> edge.
            </p>
        </mono-drawer>
    </div>
</template>
