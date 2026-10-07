<script setup>
    import '@mono-lit/helper/ui/card'
    import { ref } from 'vue'

    const show = ref(true)
    const items = ref([1, 2])

    function toggle() {
        show.value = !show.value
    }

    function addItem() {
        items.value = [...items.value, items.value.length + 1]
    }
</script>

<template>
    <div style="width: 100%;">
        <mono-card variant="outlined">
            <h3 slot="title">Outer card</h3>
            <p slot="subtitle">Cards can be stacked freely, including behind v-if / v-for.</p>

            <p>Some content in the outer card body.</p>

            <mono-card variant="tonal" color="primary" style="margin-top: 0.75rem;">
                <h3 slot="title">Nested card</h3>
                <p>A card living inside another card's body.</p>
            </mono-card>

            <mono-card
                v-if="show"
                variant="tonal"
                color="success"
                style="margin-top: 0.75rem;"
            >
                <h3 slot="title">Conditional nested card</h3>
                <p>Toggled with <code>v-if</code> — no crash when it mounts / unmounts.</p>
                <ul>
                    <li v-for="i in items" :key="i">Item {{ i }}</li>
                </ul>
            </mono-card>
        </mono-card>

        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
            <button type="button" @click="toggle">
                {{ show ? 'Hide' : 'Show' }} conditional card
            </button>
            <button type="button" @click="addItem">Add item</button>
        </div>
    </div>
</template>
