<script setup>
    import '@mono-lit/helper/ui/select'

    const items = ['Apple', 'Banana', 'Cherry', 'Durian']
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem;">
        <mono-select label="Fixed 260px" width="260px" placeholder="Pick one" :items.prop="items" />
        <mono-select label="Max-width 360px" max-width="360px" placeholder="Pick one" :items.prop="items" />
        <mono-select label="Full width" width="100%" placeholder="Pick one" :items.prop="items" />
    </div>
</template>
