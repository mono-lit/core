<script setup>
    import '@mono-lit/helper/ui/button'
    import { ref } from 'vue'

    const loading = ref(false)

    function trigger() {
        loading.value = true
        setTimeout(() => {
            loading.value = false
        }, 1500)
    }
</script>

<template>
    <div>
        <mono-button>Normal</mono-button>
        <mono-button disabled>Disabled</mono-button>
        <mono-button :loading="loading" @click="trigger">Click to Load</mono-button>
        <mono-button width="100%">Full Width</mono-button>
    </div>
</template>
