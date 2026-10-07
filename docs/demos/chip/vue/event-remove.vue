<script setup>
    import '@mono-lit/helper/ui/chip'
    import { ref } from 'vue'

    const items = ref(['Apple', 'Orange', 'Banana'])

    function onRemove(item) {
        items.value = items.value.filter((x) => x !== item)
    }
</script>

<template>
    <div>
        <template v-for="item in items" :key="item">
            <mono-chip
                color="primary"
                removable
                :close-label="`Remove ${item}`"
                @close="onRemove(item)"
            >
                {{ item }}
            </mono-chip>
            <br>
        </template>
        <br>
        <div class="event-demo-status">{{ items.length }} items remaining</div>
    </div>
</template>
